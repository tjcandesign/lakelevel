
# Norfork Lake Water & Generation Dashboard

A modern web application that displays real-time Norfork Lake water levels and projected hydroelectric generation schedules.

## Data Sources

1.  **US Army Corps of Engineers (USACE)** - [Recent Lake Data](https://www.swl-wc.usace.army.mil/pages/data/tabular/htm/norfork.htm)
    *   Lake Elevation
    *   Tailwater Elevation
    *   Releases (CFS) & Generation (MWh)

2.  **Southwestern Power Administration (SWPA)** - [Generation Schedules](https://www.energy.gov/swpa)
    *   Projected daily generation loads (NFD column)

## Tech Stack

*   **Frontend**: React, Next.js 15 (App Router), Tailwind CSS
*   **Backend**: Next.js API Routes
*   **Data Processing**: Axios, Cheerio (for text parsing)

## Getting Started

### Prerequisites

*   Node.js 18+ installed

### Installation

1.  Navigate to the project directory:
    ```bash
    cd norfork-lake-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

To create an optimized production build:

```bash
npm run build
npm start
```

## Disclaimer

This is a hobby project and is **not affiliated** with the USACE or SWPA. Data is scraped from public legacy websites and may be brittle if their formats change. Always rely on official sources for safety-critical decisions.
