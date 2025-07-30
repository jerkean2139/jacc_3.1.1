# Complete Dependencies List for External IDE

## Copy this entire package.json content to the external IDE:

```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "main": "dist/index.js",
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.37.0",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^3.10.0",
    "@jridgewell/trace-mapping": "^0.3.25",
    "@neondatabase/serverless": "^0.10.4",
    "@pinecone-database/pinecone": "^6.0.1",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@replit/vite-plugin-cartographer": "^1.4.0",
    "@replit/vite-plugin-runtime-error-modal": "^1.0.6",
    "@sendgrid/mail": "^8.1.5",
    "@supabase/supabase-js": "^2.49.8",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/vite": "^4.0.0-alpha.35",
    "@tanstack/react-query": "^5.60.5",
    "@types/bcrypt": "^5.0.2",
    "@types/connect-pg-simple": "^7.0.3",
    "@types/cookie-parser": "^1.4.7",
    "@types/express": "^5.0.0",
    "@types/express-session": "^1.18.0",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/memoizee": "^0.4.11",
    "@types/multer": "^1.4.18",
    "@types/node": "^22.10.2",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/pdf-parse": "^1.1.4",
    "@types/qrcode": "^1.5.5",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@types/turndown": "^5.0.5",
    "@types/ws": "^8.5.13",
    "@types/yauzl": "^2.10.3",
    "@vitejs/plugin-react": "^4.4.2",
    "autoprefixer": "^10.4.20",
    "axios": "^1.9.0",
    "bcrypt": "^6.0.0",
    "cheerio": "^1.1.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "connect-pg-simple": "^10.0.0",
    "cookie-parser": "^1.4.7",
    "cross-env": "^7.0.3",
    "csv-parser": "^3.2.0",
    "date-fns": "^3.6.0",
    "dotenv": "^16.4.7",
    "drizzle-kit": "^0.30.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "embla-carousel-react": "^8.6.0",
    "esbuild": "^0.24.2",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.1",
    "express-session": "^1.18.1",
    "framer-motion": "^11.13.1",
    "googleapis": "^149.0.0",
    "helmet": "^8.1.0",
    "idb": "^8.0.3",
    "input-otp": "^1.4.2",
    "isomorphic-dompurify": "^2.26.0",
    "lucide-react": "^0.453.0",
    "mammoth": "^1.8.0",
    "memoizee": "^0.4.17",
    "memorystore": "^1.7.0",
    "multer": "^1.4.5-lts.1",
    "next-themes": "^0.4.4",
    "openai": "^4.77.3",
    "openid-client": "^6.1.6",
    "otplib": "^12.0.1",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "pdf-parse": "^1.1.1",
    "pdf2pic": "^3.1.3",
    "postcss": "^8.5.1",
    "puppeteer": "^24.0.0",
    "qrcode": "^1.5.4",
    "react": "^18.3.1",
    "react-day-picker": "^9.4.3",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.2.1",
    "recharts": "^2.15.0",
    "robots-parser": "^3.0.1",
    "tailwind-merge": "^2.5.4",
    "tailwindcss": "^3.4.15",
    "tailwindcss-animate": "^1.0.7",
    "tesseract.js": "^5.1.1",
    "tiktoken": "^1.0.18",
    "tsx": "^4.19.2",
    "turndown": "^7.2.0",
    "tw-animate-css": "^1.0.10",
    "typescript": "^5.7.2",
    "vaul": "^1.1.1",
    "vite": "^6.0.3",
    "wouter": "^3.5.1",
    "ws": "^8.18.0",
    "yauzl": "^3.2.0",
    "zod": "^3.24.1",
    "zod-validation-error": "^3.4.0"
  }
}
```

## Quick Install Command
Tell them to run this single command to install everything:

```bash
npm install
```

## Alternative: Copy Individual Dependencies
If they prefer to install manually, they can run:

```bash
npm install @anthropic-ai/sdk @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @hookform/resolvers @jridgewell/trace-mapping @neondatabase/serverless @pinecone-database/pinecone express react react-dom axios bcrypt dotenv cross-env tsx esbuild vite typescript drizzle-kit drizzle-orm
```

## Essential Dependencies for Basic Functionality
If they want to start with just the essentials:

```bash
npm install express react react-dom axios bcrypt dotenv cross-env tsx esbuild vite typescript @types/node @types/express
```