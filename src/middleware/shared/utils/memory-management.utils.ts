const ONE_MB = 1024 * 1024;

export interface MemoryUsage {
  rss: string;
  heapTotal: string;
  heapUsed: string;
  external: string;
}

export function getMemoryUsage(): MemoryUsage {
  const used = process.memoryUsage();
  return {
    rss: `${Math.round(used.rss / ONE_MB)}MB`,
    heapTotal: `${Math.round(used.heapTotal / ONE_MB)}MB`,
    heapUsed: `${Math.round(used.heapUsed / ONE_MB)}MB`,
    external: `${Math.round(used.external / ONE_MB)}MB`
  };
}

export function isMemoryUsageCritical(limit: number): boolean {
  const currentUsage = process.memoryUsage().heapUsed / ONE_MB;
  return currentUsage > limit;
}

export async function forceGarbageCollection(): Promise<void> {
  if (global.gc) {
    const beforeGC = getMemoryUsage();
    global.gc();
    const afterGC = getMemoryUsage();
    
    console.log('Manual garbage collection executed', {
      before: beforeGC,
      after: afterGC
    });
  }
}
