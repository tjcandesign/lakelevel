
import { NextResponse } from 'next/server';
import { fetchUsaceData } from '@/lib/usaceService';
import { getCachedData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await getCachedData('norfork-lake', fetchUsaceData);
        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch Norfork Lake data' },
            { status: 500 }
        );
    }
}
