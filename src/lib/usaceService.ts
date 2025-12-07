
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parse, isValid } from 'date-fns';
import { UsaceData, HourlyLakeData } from './types';

const USACE_URL = 'https://www.swl-wc.usace.army.mil/pages/data/tabular/htm/norfork.htm';

export async function fetchUsaceData(): Promise<UsaceData> {
    const response = await axios.get(USACE_URL);
    const rawText = response.data;

    // USACE data often comes wrapped in basic HTML with a <pre> tag
    const $ = cheerio.load(rawText);
    let textContent = $('pre').text();

    if (!textContent) {
        // Fallback if it's just raw text without html
        textContent = rawText;
    }

    const lines = textContent.split('\n');
    const hourlyData: HourlyLakeData[] = [];
    const meta: UsaceData['meta'] = {};

    // Regex patterns to find pool levels in the header
    // Example: "Top Flood Pool ... 580.00"
    const topFloodRegex = /Top\s+Flood\s+Pool.*?(\d{3}\.\d{2})/;
    const powerPoolRegex = /Current\s+Power\s+Pool.*?(\d{3}\.\d{2})/;
    // Some pages list Bottom Power Pool significantly differently

    for (const line of lines) {
        if (!meta.topFloodPool) {
            const match = line.match(topFloodRegex);
            if (match) meta.topFloodPool = parseFloat(match[1]);
        }
        if (!meta.currentPowerPool) {
            const match = line.match(powerPoolRegex);
            if (match) meta.currentPowerPool = parseFloat(match[1]);
        }

        // Parse data rows. 
        // Typical row: "06DEC2025 1500  553.43 ... "
        // We look for lines starting with a date pattern like DDMMMYYYY
        const trimmedLine = line.trim();
        // Regex for: 01JAN2025 2400 (or 0000)
        const rowRegex = /^(\d{2}[A-Z]{3}\d{4})\s+(\d{4})\s+([\d\.]+)/;
        const match = trimmedLine.match(rowRegex);

        if (match) {
            // We found a data row. Now we need to handle fixed width parsing more robustly 
            // because simple splitting by space might fail if there are missing columns.
            // However, USACE tabular data usually has consistent columns.
            // Let's rely on whitespace splitting for now, but be defensive.

            const parts = trimmedLine.split(/\s+/);
            // parts[0] = Date (06DEC2025)
            // parts[1] = Time (1500)
            // parts[2] = Elevation
            // parts[3] = Tailwater (usually)
            // parts[4] = ? (could be precipitation, or flow)

            // This mapping depends heavily on the specific table layout.
            // Based on typical USACE Little Rock district tables:
            // DDMMMYYYY HHMM  ELEV    TW      PRECIP  GEN(MWH) GEN(CFS) SPILL RELEAS(CFS)

            if (parts.length >= 3) {
                const dateStr = parts[0];
                const timeStr = parts[1];
                const elevation = parseFloat(parts[2]);

                // Try to deduce other columns
                // Some columns might be missing or dashes

                let tailwater = undefined;
                if (parts.length > 3 && !isNaN(parseFloat(parts[3]))) {
                    tailwater = parseFloat(parts[3]);
                }

                // MWH is often around index 5 or 6? Let's check typical USACE headers
                // Often: Date Time Elev TW Precip MWh CFS Spill TotalRef
                // Let's assume standard layout.
                // Index 0: Date
                // Index 1: Time
                // Index 2: Elevation
                // Index 3: Tailwater
                // Index 4: Precip (often)
                // Index 5: Gen MWh (often)
                // Index 6: Gen CFS (often)
                // Index 7: Spill
                // Index 8: Total Release

                let genMwh = undefined;
                if (parts.length > 5 && !isNaN(parseFloat(parts[5]))) genMwh = parseFloat(parts[5]);

                let genCfs = undefined;
                if (parts.length > 6 && !isNaN(parseFloat(parts[6]))) genCfs = parseFloat(parts[6]);

                let totalRelease = undefined;
                if (parts.length > 8 && !isNaN(parseFloat(parts[8]))) totalRelease = parseFloat(parts[8]);

                // Create timestamp
                // Note: 2400 hours usually means end of day, which is 00:00 of NEXT day.
                // Date-fns parse might struggle with 2400.
                let timeForParse = timeStr;
                let addDay = false;
                if (timeForParse === '2400') {
                    timeForParse = '0000';
                    addDay = true;
                }

                // Parse format: ddMMMyyyy HHmm
                let parsedDate = parse(`${dateStr} ${timeForParse}`, 'ddMMMyyyy HHmm', new Date());

                if (addDay) {
                    parsedDate = new Date(parsedDate.getTime() + 24 * 60 * 60 * 1000);
                }

                if (isValid(parsedDate)) {
                    hourlyData.push({
                        timestamp: parsedDate.getTime(),
                        dateStr,
                        timeStr,
                        elevation,
                        tailwater,
                        generationMwh: genMwh,
                        generationCfs: genCfs,
                        totalReleaseCfs: totalRelease
                    });
                }
            }
        }
    }

    // Sort by timestamp descending (newest first)
    hourlyData.sort((a, b) => b.timestamp - a.timestamp);

    // Return limited history? The prompt asks for 24-48 hours.
    // The USACE page usually has current month + previous month sometimes.
    // Just returning the Top 48 is reasonable.
    return {
        meta,
        hourly: hourlyData.slice(0, 48),
    };
}
