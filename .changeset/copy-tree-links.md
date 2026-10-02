---
"@expojet/core": patch
"create-expojet": patch
---

Reject symbolic links in copied trees before rendering. Later operations cannot follow a copied
link and overwrite files outside the staging directory.
