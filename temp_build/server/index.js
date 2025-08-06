// Environment variables loading (required for external IDEs)
import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import path from "path";
import { registerConsolidatedRoutes } from "./consolidated-routes";
import { setupVite } from "./vite";
import { initializeDatabase } from "./db";
import { performanceService } from "./services/performance-service";
import { ensureProductionFiles, validateDeploymentEnvironment } from "./deployment-config";
import { createTestDataPlaceholders, setupProductionDirectories, setupErrorHandling } from "./production-setup";
import { configureMemoryOptimization, configureProcessLimits } from "./memory-optimization";
import { setupSecurity } from "./security-middleware";
const app = express();
const isDevelopment = process.env.NODE_ENV === "development";
// Trust proxy (for rate limiting behind proxies)
app.set("trust proxy", 1);
// Iframe embedding / CORS configuration
app.use((req, res, next) => {
    // X-Frame-Options / CSP for iframe allowlist
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://*.replit.app https://*.replit.dev https://iso-hub-domain.com");
    // SECURITY FIX: More restrictive CORS in production
    const allowedOrigins = isDevelopment
        ? [
            // Development domains
            "http://localhost:3000",
            "http://localhost:5000",
            /https:\/\/.*\.replit\.app$/,
            /https:\/\/.*\.replit\.dev$/,
            /https:\/\/.*\.replit\.co$/
        ]
        : [
            // Production domains including Replit deployment
            process.env.PRODUCTION_DOMAIN,
            process.env.ISO_HUB_DOMAIN,
            /https:\/\/.*\.replit\.app$/,
            /https:\/\/.*\.replit\.dev$/
        ].filter(Boolean);
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
// Body parsers - reduce limits to save memory
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));
// Performance tracking
app.use(performanceService.trackPerformance());
// Initialize memory management
console.log("✅ Memory management initialized");
// Static assets - serve public folder
app.use("/assets", express.static("public", {
    maxAge: "1d",
    etag: true,
    lastModified: true
}));
// Also serve public files directly from root for compatibility
app.use(express.static("public", {
    maxAge: "1d",
    etag: true,
    lastModified: true
}));
// Startup sequence
(async () => {
    console.log("🚀 Starting JACC application server...");
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Is Development: ${isDevelopment}`);
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
        // Only validate production files in production
        if (!isDevelopment) {
            await ensureProductionFiles();
            console.log("✅ Production files validated");
        }
        // Database init
        await initializeDatabase();
        console.log("✅ Database initialized");
        // Route registration
        registerConsolidatedRoutes(app);
        console.log("✅ Routes registered");
    }
    catch (error) {
        console.error("❌ Initialization error:", error);
        process.exit(1);
    }
    // Deployment checks
    if (!isDevelopment && !validateDeploymentEnvironment()) {
        console.warn("⚠️ Some deployment checks failed—continuing anyway");
    }
    // Global error handler
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        if (isDevelopment) {
            console.error("Error:", err);
        }
        res.status(status).json({ message });
    });
    // Create HTTP server
    const http = await import("http");
    const server = http.createServer(app);
    // Development vs Production setup
    if (isDevelopment) {
        // Use Vite only in development
        console.log("🔧 Setting up Vite development server...");
        await setupVite(app, server);
        console.log("✅ Vite development server configured");
    }
    else {
        // In production, serve the built static files
        console.log("📦 Serving production build...");
        // Serve the built client files
        const staticPath = path.join(process.cwd(), 'dist', 'public');
        console.log(`📁 Serving static files from: ${staticPath}`);
        app.use(express.static(staticPath, {
            maxAge: '1d',
            etag: true,
            lastModified: true,
            index: 'index.html'
        }));
        // SPA fallback - serve index.html for all non-API routes
        app.get('*', (req, res, next) => {
            // Skip API routes
            if (req.path.startsWith('/api')) {
                return next();
            }
            const indexPath = path.join(staticPath, 'index.html');
            res.sendFile(indexPath, (err) => {
                if (err) {
                    console.error('Error serving index.html:', err);
                    res.status(404).send('Page not found');
                }
            });
        });
        console.log("✅ Production static file serving configured");
    }
    // Port configuration - simplified and consistent
    const PORT = parseInt(process.env.PORT || '3000', 10);
    const HOST = '0.0.0.0';
    // Start server with error handling
    try {
        await new Promise((resolve, reject) => {
            server.listen(PORT, HOST, () => {
                console.log(`\n🚀 Server successfully started!`);
                console.log(`📡 Listening on http://${HOST}:${PORT}`);
                console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
                if (!isDevelopment) {
                    console.log(`✅ Production server ready for traffic`);
                    console.log(`📊 Process ID: ${process.pid}`);
                }
                else {
                    console.log(`🔧 Development server with hot reload enabled`);
                }
                resolve();
            });
            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.error(`❌ Port ${PORT} is already in use`);
                    console.error(`💡 Try: lsof -i :${PORT} to see what's using it`);
                }
                else if (err.code === 'EACCES') {
                    console.error(`❌ Permission denied to bind to port ${PORT}`);
                    console.error(`💡 Try using a port number > 1024`);
                }
                else {
                    console.error(`❌ Server error:`, err);
                }
                reject(err);
            });
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
        console.log(`\n📴 ${signal} received, starting graceful shutdown...`);
        server.close(() => {
            console.log('✅ HTTP server closed');
            // Add any cleanup logic here (close DB connections, etc.)
            process.exit(0);
        });
        // Force shutdown after 10 seconds
        setTimeout(() => {
            console.error('❌ Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    // Handle uncaught errors
    process.on('uncaughtException', (err) => {
        console.error('❌ Uncaught Exception:', err);
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
})();
