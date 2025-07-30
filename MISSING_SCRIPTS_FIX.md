# Missing Scripts Fix for External IDE

## The Problem
The external IDE is missing the npm scripts in package.json that are needed to run the application.

## The Solution
Add these scripts to your `package.json` file in the "scripts" section:

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

## Install Missing Dependencies
You'll also need to install these dependencies:

```bash
npm install cross-env tsx esbuild vite typescript drizzle-kit
```

## Quick Fix Command
Run this in your terminal to install everything needed:

```bash
npm install cross-env tsx esbuild vite typescript drizzle-kit @types/node
```

Then you can run:
```bash
npm run dev
```

## Complete package.json Scripts Section
Your package.json should have this scripts section:

```json
"scripts": {
  "dev": "cross-env NODE_ENV=development tsx server/index.ts",
  "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist", 
  "start": "NODE_ENV=production node dist/index.js",
  "check": "tsc",
  "db:push": "drizzle-kit push"
}
```

## What These Scripts Do
- **dev**: Starts development server with environment variables
- **build**: Creates production build
- **start**: Runs production server
- **check**: Type checking with TypeScript
- **db:push**: Database schema updates