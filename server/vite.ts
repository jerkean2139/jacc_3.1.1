import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();
const isProduction = process.env.NODE_ENV === "production";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Only setup Vite in development
  if (isProduction) {
    log("Skipping Vite setup in production", "vite");
    return;
  }

  try {
    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    };

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          // Don't exit in production, just log the error
          if (!isProduction) {
            process.exit(1);
          }
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );

        // Always reload the index.html file from disk in case it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");

        // Add cache busting for development
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );

        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    log("Vite development server configured", "vite");
  } catch (error) {
    console.error("Failed to setup Vite:", error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  // Fix: Correct path to dist/public for production builds
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  log(`Checking for static files at: ${distPath}`, "static");

  if (!fs.existsSync(distPath)) {
    // More helpful error message
    console.error(`❌ Build directory not found: ${distPath}`);
    console.error(`📦 Please run 'npm run build' first to create production files`);
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first with 'npm run build'`,
    );
  }

  // Check if index.html exists
  const indexPath = path.join(distPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error(`❌ index.html not found at: ${indexPath}`);
    throw new Error(`index.html not found in build directory`);
  }

  log(`Serving static files from: ${distPath}`, "static");

  // Serve static files with caching headers
  app.use(
    express.static(distPath, {
      maxAge: isProduction ? "1d" : 0,
      etag: true,
      lastModified: true,
      index: "index.html",
      fallthrough: true,
    })
  );

  // SPA fallback - serve index.html for all non-API routes
  app.use("*", (req, res, next) => {
    // Skip API routes and static assets
    if (req.originalUrl.startsWith("/api") || 
        req.originalUrl.includes(".") || 
        req.originalUrl.startsWith("/assets")) {
      return next();
    }

    const indexFile = path.join(distPath, "index.html");

    res.sendFile(indexFile, (err) => {
      if (err) {
        console.error(`Error serving index.html for ${req.originalUrl}:`, err);
        res.status(404).send("Page not found");
      }
    });
  });

  log("Static file serving configured", "static");
}