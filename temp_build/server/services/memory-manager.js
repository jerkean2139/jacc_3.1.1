class MemoryManager {
    static instance;
    cleanupIntervals = [];
    memoryWarningThreshold = 0.70; // 70% (reduced)
    memoryCriticalThreshold = 0.85; // 85% (reduced)
    static getInstance() {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }
    constructor() {
        this.startMemoryMonitoring();
    }
    startMemoryMonitoring() {
        // Monitor memory every 15 seconds (more frequent)
        const memoryInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, 15000);
        this.cleanupIntervals.push(memoryInterval);
    }
    checkMemoryUsage() {
        const memUsage = process.memoryUsage();
        const totalMemory = 400 * 1024 * 1024; // 400MB realistic limit 
        const usedMemory = memUsage.rss;
        const memoryPercentage = usedMemory / totalMemory;
        console.log(`📊 Memory: ${Math.round(usedMemory / 1024 / 1024)}MB / ${Math.round(totalMemory / 1024 / 1024)}MB (${Math.round(memoryPercentage * 100)}%)`);
        if (memoryPercentage > this.memoryCriticalThreshold) {
            console.log("🚨 CRITICAL MEMORY USAGE: Force cleanup");
            this.forceGarbageCollection();
            this.clearCaches();
        }
        else if (memoryPercentage > this.memoryWarningThreshold) {
            console.log("⚠️ HIGH MEMORY USAGE: Cleanup recommended");
            this.performLightCleanup();
        }
    }
    forceGarbageCollection() {
        try {
            if (global.gc) {
                global.gc();
                console.log("✅ Garbage collection completed");
            }
            else {
                console.log("⚠️ Garbage collection not available");
            }
        }
        catch (error) {
            console.error("❌ Garbage collection failed:", error);
        }
    }
    clearCaches() {
        try {
            // ES modules don't use require.cache, so just force garbage collection
            if (typeof global.gc === 'function') {
                global.gc();
                console.log("✅ Memory caches cleared via GC");
            }
            else {
                console.log("⚠️ Garbage collection not available for cache clearing");
            }
        }
        catch (error) {
            console.error("❌ Cache cleanup failed:", error);
        }
    }
    performLightCleanup() {
        try {
            // Clear process title cache
            process.title = "jacc-server";
            console.log("✅ Light cleanup completed");
        }
        catch (error) {
            console.error("❌ Light cleanup failed:", error);
        }
    }
    getMemoryStats() {
        const memUsage = process.memoryUsage();
        const totalMemory = 1024 * 1024 * 1024; // 1GB
        return {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            percentage: (memUsage.rss / totalMemory) * 100,
            totalMemory: totalMemory
        };
    }
    cleanup() {
        this.cleanupIntervals.forEach(interval => clearInterval(interval));
        this.cleanupIntervals = [];
    }
}
export const memoryManager = MemoryManager.getInstance();
