---
"@expojet/core": patch
"create-expojet": patch
---

Reject adapter-owned Metro files that composition would silently replace. Generation omits the
SDK's default Metro file when a composed config takes ownership, preserving the generated output.
