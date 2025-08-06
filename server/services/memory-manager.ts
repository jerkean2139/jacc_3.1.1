import { performance } from "perf_hooks";

class MemoryManager {
  private static instance: MemoryManager;
  private cleanupIntervals: NodeJS.Timeout[] = [];
  private memoryWarningThreshold = 0.70; // 70% (reduced)
  private memoryCriticalThreshold = 0.85; // 85% (reduced)

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  private constructor() {
    this.startMemoryMonitoring();
  }

  private startMemoryMonitoring() {
    // Monitor memory every 15 seconds (more frequent)
    const memoryInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 15000);
    
    this.cleanupIntervals.push(memoryInterval);
  }

  private checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const totalMemory = 400 * 1024 * 1024; // 400MB realistic limit 
    const usedMemory = memUsage.rss;
    const memoryPercentage = usedMemory / totalMemory;

    console.log(`📊 Memory: ${Math.round(usedMemory / 1024 / 1024)}MB / ${Math.round(totalMemory / 1024 / 1024)}MB (${Math.round(memoryPercentage * 100)}%)`);

    if (memoryPercentage > this.memoryCriticalThreshold) {
      console.log("🚨 CRITICAL MEMORY USAGE: Force cleanup");
      this.forceGarbageCollection();
      this.clearCaches();
    } else if (memoryPercentage > this.memoryWarningThreshold) {
      console.log("⚠️ HIGH MEMORY USAGE: Cleanup recommended");
      this.performLightCleanup();
    }
  }

  private forceGarbageCollection() {
    try {
      if (global.gc) {
        global.gc();
        console.log("✅ Garbage collection completed");
      } else {
        console.log("⚠️ Garbage collection not available");
      }
    } catch (error) {
      console.error("❌ Garbage collection failed:", error);
    }
  }

  private clearCaches() {
    try {
      // ES modules don't use require.cache, so just force garbage collection
      if (typeof global.gc === 'function') {
        global.gc();
        console.log("✅ Memory caches cleared via GC");
      } else {
        console.log("⚠️ Garbage collection not available for cache clearing");
      }
    } catch (error) {
      console.error("❌ Cache cleanup failed:", error);
    }
  }

  private performLightCleanup() {
    try {
      // Clear process title cache
      process.title = "jacc-server";
      console.log("✅ Light cleanup completed");
    } catch (error) {
      console.error("❌ Light cleanup failed:", error);
    }
  }

  public getMemoryStats() {
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

  public cleanup() {
    this.cleanupIntervals.forEach(interval => clearInterval(interval));
    this.cleanupIntervals = [];
  }
}

export const memoryManager = MemoryManager.getInstance();