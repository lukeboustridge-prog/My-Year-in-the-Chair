# Type packages fix

Next.js TypeScript build needs `@types/react` and `@types/node`. This `package.json` adds them.

After replacing your package.json:
```bash
pnpm install
pnpm build
```