# Nexus Example With Prisma

This example shows how to use Nexus with [Prisma](https://prisma.io) without the [Prisma plugin for Nexus](https://nxs.li/plugins/prisma). This approach is lower-level and here for reference reasons. Generally, you would want to use the Prisma plugin.

### Try It

```
npm install
npx prisma generate
npx prisma migrate dev --preview-feature
```

Terminal 1

```
npm run dev
```

Terminal 2

```
npm run dev:typecheck
```
