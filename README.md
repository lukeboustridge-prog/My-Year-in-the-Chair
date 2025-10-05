# Fix: add @types/jsonwebtoken

This updates `package.json` to include `@types/jsonwebtoken` so the TypeScript build passes.

After replacing your package.json:
```bash
pnpm install
pnpm build
```