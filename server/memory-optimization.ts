// Memory optimization utilities for production deployment

export async function configureMemoryOptimization() {
  // Force garbage collection more frequently
  if (typeof global.gc === 'function') {
    setInterval(() => {
      try {
        global.gc();
        console.log('🧹 Manual garbage collection completed');
      } catch (e) {
        console.error('GC error:', e);
      }
    }, 60000); // Every 60 seconds instead of 30
  }

  // Aggressive memory monitoring and cleanup
  setInterval(() => {
    const usage = process.memoryUsage();
    const rssMB = Math.round(usage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const resBudgetMB = 200; // Target 200MB max (400MB actual limit in Replit)
    const percentage = Math.round((usage.rss / (resBudgetMB * 1024 * 1024)) * 100);
    
    console.log(`📊 Memory: ${rssMB}MB / ${resBudgetMB}MB (${percentage}%)`);
    
    // Aggressive cleanup at lower thresholds
    if (percentage > 85) {
      console.warn(`⚠️ HIGH MEMORY USAGE: ${percentage}%`);
      performAggressiveCleanup();
    } else if (percentage > 75) {
      // Force garbage collection more frequently
      if (global.gc) {
        global.gc();
      }
    }
  }, 120000); // Every 2 minutes
}

// Optimize large string operations
export function optimizeStringOperations() {
  // Limit the size of strings we process
  const MAX_STRING_LENGTH = 1024 * 1024; // 1MB
  
  return {
    truncateString: (str: string) => {
      if (str.length > MAX_STRING_LENGTH) {
        console.warn(`⚠️ Truncating large string: ${str.length} chars`);
        return str.substring(0, MAX_STRING_LENGTH) + '... [truncated]';
      }
      return str;
    },
    
    // Process strings in chunks to avoid memory spikes
    processInChunks: async (text: string, chunkSize = 1024 * 10) => {
      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize));
        // Allow event loop to process other tasks
        if (i % (chunkSize * 10) === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
      return chunks;
    }
  };
}

// Aggressive memory cleanup function
function performAggressiveCleanup() {
  try {
    // Force multiple GC cycles
    if (global.gc) {
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
    }
    
    // Clear require cache more aggressively
    const keysToDelete = Object.keys(require.cache).filter(key => 
      !key.includes('node_modules') && 
      !key.includes('express') && 
      !key.includes('drizzle-orm')
    );
    
    keysToDelete.forEach(key => delete require.cache[key]);
    console.log(`🧹 Cleared ${keysToDelete.length} cached modules`);
    
  } catch (error) {
    console.error('Aggressive cleanup failed:', error);
  }
}

// Configure process limits with reduced memory target
export function configureProcessLimits() {
  // Set aggressive memory limits
  const targetMemoryMB = 180; // Very conservative target
  const maxMemoryMB = parseInt(process.env.MAX_MEMORY || '200');
  
  // Monitor for memory leaks more aggressively
  let lastRss = 0;
  let increasingCount = 0;
  
  setInterval(() => {
    const usage = process.memoryUsage();
    const currentRss = usage.rss;
    const rssMB = Math.round(currentRss / 1024 / 1024);
    
    if (rssMB > targetMemoryMB) {
      console.warn(`⚠️ Memory over target: ${rssMB}MB > ${targetMemoryMB}MB`);
      performAggressiveCleanup();
    }
    
    if (currentRss > lastRss) {
      increasingCount++;
      if (increasingCount > 5) { // Reduced from 10
        console.warn('⚠️ Memory leak detected - forcing cleanup');
        performAggressiveCleanup();
        increasingCount = 0; // Reset counter
      }
    } else {
      increasingCount = 0;
    }
    
    lastRss = currentRss;
  }, 15000); // Check every 15 seconds (more frequent)
}