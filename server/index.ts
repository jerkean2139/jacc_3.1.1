      import express, { type Request, Response, NextFunction } from "express";
      import { registerConsolidatedRoutes } from "./consolidated-routes";
      import { setupVite, serveStatic, log } from "./vite";
      import { initializeDatabase } from "./db";
      import { performanceService } from "./services/performance-service";
      import {
        ensureProductionFiles,
        configureProductionServer,
        validateDeploymentEnvironment
      } from "./deployment-config";
      import {
        createTestDataPlaceholders,
        setupProductionDirectories,
        setupErrorHandling
      } from "./production-setup";
      import { configureMemoryOptimization, configureProcessLimits } from "./memory-optimization";
      import { setupSecurity } from "./security-middleware";

      const app = express();

      // Trust proxy (for rate limiting behind proxies)
      app.set("trust proxy", 1);

      // Iframe embedding / CORS configuration
      app.use((req, res, next) => {
        // X-Frame-Options / CSP for iframe allowlist
        res.setHeader("X-Frame-Options", "SAMEORIGIN");
        res.setHeader(
          "Content-Security-Policy",
          "frame-ancestors 'self' https://*.replit.app https://*.replit.dev https://iso-hub-domain.com"
        );

        // CORS allowlist
        const allowedOrigins = [
          "https://iso-hub-domain.com",
          "https://your-main-saas.com",
          /https:\/\/.*\.replit\.app$/,
          /https:\/\/.*\.replit\.dev$/
        ];
        const origin = req.headers.origin;
        if (origin && allowedOrigins.some(a => (typeof a === "string" ? a === origin : a.test(origin)))) {
          res.setHeader("Access-Control-Allow-Origin", origin);
          res.setHeader("Access-Control-Allow-Credentials", "true");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        }

        if (req.method === "OPTIONS") {
          res.status(200).end();
          return;
        }
        next();
      });

      // Body parsers
      app.use(express.json({ limit: "10mb" }));
      app.use(express.urlencoded({ extended: false, limit: "10mb" }));

      // Performance tracking
      app.use(performanceService.trackPerformance());

      // Static assets
      app.use(
        express.static("public", {
          maxAge: "1d",
          etag: true,
          lastModified: true
        })
      );

      // Startup sequence
      (async () => {
        console.log("🚀 Starting JACC application server...");

        try {
          // Memory and process tuning
          configureMemoryOptimization();
          configureProcessLimits();
          console.log("✅ Memory and process limits configured");

          // Security middleware
          setupSecurity(app);
          console.log("✅ Security middleware configured");

          // Production directories & placeholders
          setupProductionDirectories();
          console.log("✅ Production directories ready");
          createTestDataPlaceholders();
          console.log("✅ Test data placeholders created");

          // Error handling setup
          setupErrorHandling();
          console.log("✅ Error handling configured");

          // Ensure built frontend/assets exist
          await ensureProductionFiles();
          console.log("✅ Production files validated");

          // Database init
          await initializeDatabase();
          console.log("✅ Database initialized");

          // Route registration
          registerConsolidatedRoutes(app);
          console.log("✅ Routes registered");
        } catch (error) {
          console.error("❌ Initialization error:", error);
          process.exit(1);
        }

        // Deployment checks
        if (!validateDeploymentEnvironment()) {
          console.warn("⚠️ Some deployment checks failed—continuing anyway");
        }

        // Global error handler
        app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
          const status = err.status || err.statusCode || 500;
          const message = err.message || "Internal Server Error";
          res.status(status).json({ message });
        });

        // Dev vs Prod: Always use Vite for Replit environment
        const http = await import("http");
        let server = http.createServer(app);
        
        // Always use Vite middleware in Replit to avoid deployment white screen
        await setupVite(app, server);

        // Listen
        const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
        const host = "0.0.0.0";
        server.listen(port, host, () => {
          log(`serving on ${host}:${port}`);
          if (app.get("env") === "production") {
            console.log("✅ Production server ready for deployment");
          }
        });

        // Graceful shutdown
        process.on("SIGTERM", () => {
          console.log("SIGTERM received, shutting down gracefully");
          server.close(() => {
            console.log("Process terminated");
          });
        });
      })();
