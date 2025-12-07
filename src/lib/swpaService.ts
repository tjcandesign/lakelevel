
import axios from 'axios';
import * as cheerio from 'cheerio';
import { SwpaSchedule, HourlyGeneration } from './types';

const BASE_URL = 'https://www.energy.gov/swpa/';

export async function fetchSwpaSchedule(day: string): Promise<SwpaSchedule> {
    // normalize day to lowercase 3 chars
    const dayKey = day.toLowerCase().slice(0, 3);
    const url = `${BASE_URL}${dayKey}.htm`;

    console.log(`Fetching SWPA schedule from ${url}`);

    const response = await axios.get(url);
    const rawText = response.data;
    const $ = cheerio.load(rawText);

    // SWPA pages are usually plain text wrapped in <pre> or similar
    // Sometimes they are inside <body><pre>...</pre></body>
    let content = $('pre').text();
    if (!content || content.length < 100) {
        // Fallback: entire body text if pre is missing or empty
        content = $('body').text() || rawText;
    }

    const lines = content.split('\n');

    // 1. Find the Date 
    // Header often looks like: "WEDNESDAY    DECEMBER 03, 2025"
    // It's usually near the top.
    let dateStr = '';
    // Try to find a line with the day name
    const dayNameRegex = new RegExp(`${dayKey}\\w*`, 'i');

    for (let i = 0; i < 20; i++) { // search first 20 lines
        if (lines[i] && lines[i].match(dayNameRegex)) {
            // Verify it has a month/year looking thing
            if (lines[i].match(/\d{4}/)) {
                dateStr = lines[i].trim();
                break;
            }
        }
    }

    // 2. Find the "PROJECTED LOADING SCHEDULE" section
    let startRowIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('PROJECTED LOADING SCHEDULE')) {
            startRowIndex = i;
            break;
        }
    }

    if (startRowIndex === -1) {
        throw new Error('Could not find PROJECTED LOADING SCHEDULE section');
    }

    // 3. Find Header Row with "NFD"
    // It should be shortly after the section title
    let headerRowIndex = -1;
    let nfdColIndex = -1;

    // Look a few lines down from startRowIndex
    for (let i = startRowIndex; i < startRowIndex + 10; i++) {
        if (lines[i] && lines[i].includes('NFD')) {
            headerRowIndex = i;
            // Calculate column index.
            // This is fixed width text. We need to be careful.
            // Strategy: Find "NFD" in the string, and use that character position approx range
            // to pull values from subsequent lines.
            // Or split by whitespace and find the index in the array?
            // Splitting by whitespace is risky if some cols are empty (blank), but 
            // usually this table is full of numbers. Let's try to map character positions.

            nfdColIndex = lines[i].indexOf('NFD');
            break;
        }
    }

    if (headerRowIndex === -1 || nfdColIndex === -1) {
        throw new Error('Could not find NFD column in schedule');
    }

    // 4. Parse Hourly Rows
    // We expect rows starting with "1", "2", ... "24" (HR column)
    const schedule: HourlyGeneration[] = [];

    // We scan lines after the header
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Stop if we hit end of table (often empty markers or "TOTAL")
        if (trimmed.startsWith('TOTAL') || trimmed.includes('PROJECT TABLE')) {
            break;
        }

        // Check if line starts with a number 1-24
        // The line usually starts with the Hour number
        const match = trimmed.match(/^(\d{1,2})\s+/);
        if (match) {
            const hour = parseInt(match[1]);
            if (hour >= 1 && hour <= 24) {
                // Extract the value at the NFD position
                // NFD is 3 chars wide. Let's look at the substring around nfdColIndex.
                // We'll take a safe window, e.g., index - 2 to index + 5
                // Then trim and parse.

                // It's safer to just split the line by whitespace if we confirm headers align.
                // BUT strict alignment is better:
                // Let's assume the value is right below the 'NFD' header.
                // The value might be '0', '40', '92'.
                // We grab a substring.

                // Header: ...   BSD   NFD   GFD ...
                // Row:    ...    0     0     50 ...
                // The number usually aligns right or center under the header. 

                const valSubstr = line.substring(nfdColIndex - 2, nfdColIndex + 5).trim();
                const val = parseInt(valSubstr);

                if (!isNaN(val)) {
                    schedule.push({ hour, nfdMw: val });
                }
            }
        }
    }

    return {
        day,
        date: dateStr,
        schedule
    };
}
