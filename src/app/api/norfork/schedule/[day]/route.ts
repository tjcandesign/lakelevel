
import { NextRequest, NextResponse } from 'next/server';
import { fetchSwpaSchedule } from '@/lib/swpaService';
import { getCachedData } from '@/lib/types';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ day: string }> }
) {
    let { day } = await params;

    // Handle "today" and "tomorrow" alias
    if (day === 'today' || day === 'tomorrow') {
        const now = new Date();
        // Central Time formatting
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Chicago',
            weekday: 'short',
        });

        if (day === 'tomorrow') {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            day = formatter.format(tomorrow).toLowerCase();
        } else {
            // Today
            day = formatter.format(now).toLowerCase();
        }
    }

    // Validate day
    const validDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    if (!validDays.includes(day.toLowerCase())) {
        return NextResponse.json(
            { error: 'Invalid day. Use sun, mon, tue, wed, thu, fri, sat, today, or tomorrow.' },
            { status: 400 }
        );
    }

    try {
        const data = await getCachedData(`swpa-schedule-${day}`, () => fetchSwpaSchedule(day));
        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: `Failed to fetch schedule for ${day}` },
            { status: 500 }
        );
    }
}
