# GitHub Actions CI (pnpm, no lockfile)

This workflow installs Node and pnpm, then builds the project without requiring a `pnpm-lock.yaml`.

To enable caching later, commit a lockfile and update:
```yaml
with:
  node-version: 20
  cache: pnpm
  cache-dependency-path: pnpm-lock.yaml
```