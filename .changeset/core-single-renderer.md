---
"@expojet/core": patch
"create-expojet": patch
---

Use the same operation renderer for generated projects and in-memory previews. Read current file
contents after copied files and normalize equivalent paths so later edits preserve earlier changes.

Keep preset loading consistent between the sync and async APIs. Doctor now flags known server
credentials even with an EXPO_PUBLIC_ prefix and also scans mobile environment files.
