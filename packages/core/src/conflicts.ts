import { join, normalize } from "node:path";
import type { JsonEdit, Operation, PlanConflict } from "./operations.js";

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isPrefix(prefix: JsonEdit["path"], path: JsonEdit["path"]) {
  return (
    prefix.length <= path.length && prefix.every((part, at) => String(part) === String(path[at]))
  );
}

function affectedPath(edit: JsonEdit) {
  // Removing an array element shifts later indices, so sibling edits can also conflict.
  return edit.value === undefined && typeof edit.path.at(-1) === "number"
    ? edit.path.slice(0, -1)
    : edit.path;
}

export function detectPlanConflicts(operations: Operation[]): PlanConflict[] {
  const claims = new Map<string, { owner: string; value: unknown }>();
  const jsonClaims = new Map<string, { owner: string; edit: JsonEdit }[]>();
  const conflicts: PlanConflict[] = [];

  const claim = (key: string, owner: string, value: unknown, label: string) => {
    const existing = claims.get(key);
    if (!existing) {
      claims.set(key, { owner, value });
      return;
    }
    if (existing.owner !== owner && !sameValue(existing.value, value)) {
      conflicts.push({
        key,
        message: `${label} is claimed incompatibly by ${existing.owner} and ${owner}`,
        owners: [existing.owner, owner],
      });
    }
  };

  /**
   * Immediate JSON changes share ownership across patches, dependencies, and scripts.
   * Replacing a parent object overlaps edits below it, even when the pointers differ.
   */
  const claimJsonEdits = (file: string, owner: string, edits: JsonEdit[]) => {
    const normalized = normalize(file);
    const existing = jsonClaims.get(normalized) ?? [];
    for (const edit of edits) {
      for (const previous of existing) {
        if (previous.owner === owner) continue;
        const samePath =
          previous.edit.path.length === edit.path.length && isPrefix(previous.edit.path, edit.path);
        const previousPath = affectedPath(previous.edit);
        const currentPath = affectedPath(edit);
        // Repeating an array deletion removes another item after the first deletion shifts it.
        if (
          samePath &&
          sameValue(previous.edit.value, edit.value) &&
          currentPath.length === edit.path.length
        )
          continue;
        if (!isPrefix(previousPath, currentPath) && !isPrefix(currentPath, previousPath)) continue;
        conflicts.push({
          key: JSON.stringify([normalized, ...edit.path]),
          message: `${normalized} has overlapping JSON changes from ${previous.owner} and ${owner}`,
          owners: [previous.owner, owner],
        });
      }
      existing.push({ owner, edit });
    }
    jsonClaims.set(normalized, existing);
  };

  for (const operation of operations) {
    switch (operation.type) {
      case "write-file":
        claim(
          `file:${normalize(operation.path)}`,
          operation.owner,
          operation.content,
          operation.path,
        );
        break;
      case "copy-tree":
        claim(`tree:${normalize(operation.to)}`, operation.owner, operation.from, operation.to);
        break;
      case "add-dependency":
        claim(
          `dependency:${normalize(operation.workspace)}:${operation.name}`,
          operation.owner,
          { version: operation.version, kind: operation.kind },
          `Dependency ${operation.name}`,
        );
        claimJsonEdits(join(operation.workspace, "package.json"), operation.owner, [
          { path: [operation.kind, operation.name], value: operation.version },
        ]);
        break;
      case "add-env":
        claim(
          `env:${normalize(operation.workspace)}:${operation.variable.name}`,
          operation.owner,
          operation.variable.classification,
          `Environment variable ${operation.variable.name}`,
        );
        break;
      case "add-script":
        claim(
          `script:${normalize(operation.workspace)}:${operation.name}`,
          operation.owner,
          operation.command,
          `Script ${operation.name}`,
        );
        claimJsonEdits(join(operation.workspace, "package.json"), operation.owner, [
          { path: ["scripts", operation.name], value: operation.command },
        ]);
        break;
      case "patch-json":
      case "patch-jsonc":
        claimJsonEdits(operation.path, operation.owner, operation.edits);
        break;
      case "compose-metro":
        claim(
          `metro:${normalize(operation.contribution.workspace ?? ".")}:${operation.contribution.id}`,
          operation.owner,
          {
            ...operation.contribution,
            workspace: normalize(operation.contribution.workspace ?? "."),
          },
          `Metro contribution ${operation.contribution.id}`,
        );
        break;
      case "compose-app-config":
        claim(
          `app-plugin:${normalize(operation.contribution.workspace ?? ".")}:${operation.contribution.plugin}`,
          operation.owner,
          operation.contribution.options ?? null,
          `App config plugin ${operation.contribution.plugin}`,
        );
        break;
    }
  }
  return conflicts;
}
