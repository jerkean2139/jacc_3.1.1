      // Environment variables loading (required for external IDEs)
      import dotenv from 'dotenv';
      dotenv.config();

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
      import { memoryManager } from "./services/memory-manager";

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

        // SECURITY FIX: More restrictive CORS in production
        const allowedOrigins = process.env.NODE_ENV === 'production' 
          ? [
              // Production domains including Replit deployment
              process.env.PRODUCTION_DOMAIN,
              process.env.ISO_HUB_DOMAIN,
              /https:\/\/.*\.replit\.app$/,
              /https:\/\/.*\.replit\.dev$/
            ].filter(Boolean)
          : [
              // Development domains
              "http://localhost:3000",
              "http://localhost:5000",
              /https:\/\/.*\.replit\.app$/,
              /https:\/\/.*\.replit\.dev$/,
              /https:\/\/.*\.replit\.co$/
            ];
        const origin = req.headers.origin;
        if (origin && allowedOrigins.some(a => (typeof a === "string" ? a === origin : (a as RegExp).test(origin)))) {
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

      // Initialize memory management
      console.log("✅ Memory management initialized");

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

        // Listen - Smart port selection for deployment
        const isDevelopment = process.env.NODE_ENV === "development";
        const preferredPort = process.env.PORT ? parseInt(process.env.PORT) : (isDevelopment ? 5000 : 3000);
        const host = "0.0.0.0";
        
        // For production deployment, try multiple ports to avoid conflicts
        const tryPorts = isDevelopment ? [preferredPort] : [preferredPort, 3000, 3001, 4000, 8000];
        
        let serverStarted = false;
        for (const port of tryPorts) {
          try {
            await new Promise<void>((resolve, reject) => {
              const testServer = server.listen(port, host, () => {
                log(`serving on ${host}:${port}`);
                if (!isDevelopment) {
                  console.log(`✅ Production server ready for deployment on port ${port}`);
                }
                serverStarted = true;
                resolve();
              });
              testServer.on('error', (err: any) => {
                if (err.code === 'EADDRINUSE') {
                  console.log(`Port ${port} in use, trying next...`);
                  reject(err);
                } else {
                  reject(err);
                }
              });
            });
            break; // Success, exit loop
          } catch (err: any) {
            if (err.code !== 'EADDRINUSE' || port === tryPorts[tryPorts.length - 1]) {
              console.error(`Failed to start server: ${err.message}`);
              process.exit(1);
            }
          }
        }
        
        if (!serverStarted) {
          console.error("Failed to find available port");
          process.exit(1);
        }

        // Graceful shutdown
        process.on("SIGTERM", () => {
          console.log("SIGTERM received, shutting down gracefully");
          server.close(() => {
            console.log("Process terminated");
          });
        });
      })();
