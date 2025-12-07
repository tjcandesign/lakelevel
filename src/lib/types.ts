
export interface UsaceData {
    meta: {
        topFloodPool?: number;
        currentPowerPool?: number;
        bottomPowerPool?: number;
    };
    hourly: HourlyLakeData[];
}

export interface HourlyLakeData {
    timestamp: number; // Unix timestamp
    dateStr: string;
    timeStr: string;
    elevation: number;
    tailwater?: number;
    generationMwh?: number;
    generationCfs?: number;
    totalReleaseCfs?: number;
}

export interface SwpaSchedule {
    day: string;
    date: string;
    schedule: HourlyGeneration[];
}

export interface HourlyGeneration {
    hour: number;
    nfdMw: number;
}

// Simple in-memory cache
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache: Record<string, CacheEntry<any>> = {};
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function getCachedData<T>(
    key: string,
    fetchFn: () => Promise<T>
): Promise<T> {
    const now = Date.now();
    const cached = cache[key];

    if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
        console.log(`[CACHE] Hit for ${key}`);
        return cached.data;
    }

    console.log(`[CACHE] Miss for ${key}, fetching...`);
    try {
        const data = await fetchFn();
        cache[key] = {
            data,
            timestamp: now,
        };
        return data;
    } catch (error) {
        console.error(`Error fetching data for ${key}:`, error);
        // If we have stale data, return it as a fallback
        if (cached) {
            console.warn(`Returning stale data for ${key}`);
            return cached.data;
        }
        throw error;
    }
}
