# TollWatch – Turnpike Toll Analyzer

A single-page web app that reads turnpike (or similar) toll CSV exports, analyzes them, and shows summarized expenses with charts and a downloadable PDF report. Works on desktop and mobile.

## Features

- **Upload CSV** – Supports full transaction CSVs (Posting Date, Exit Date, Exit Interchange, Transponder, Amount, etc.) or simple CSVs with an Amount column.
- **Settings on the same page** – Time period (All / Month / Quarter / Year / Custom range), date picker, and optional vehicle filter by transponder/tags.
- **Analysis results** – Total toll expenses, daily expense trend (line chart), expenses by vehicle (donut chart), and top toll locations table.
- **Download report** – One-click PDF with totals, top locations, and by-vehicle breakdown.
- **Responsive UI** – Single page, no tabs; layout adapts for phones and larger screens.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), upload a toll CSV (or use `sample-toll-data.csv`), set time period and options, click **Analyze**, then **Download report (PDF)** if needed.

## Build

```bash
npm run build
npm run preview   # optional: preview production build
```

## CSV format

The app expects at least an **Amount** column. For richer analysis it uses:

- **Posting Date** (MM/DD/YYYY)
- **Exit Date** (MM/DD/YYYY HH:MM AM/PM)
- **Exit Interchange** – location name
- **Transponder** – vehicle/transponder ID (for “by vehicle” and vehicle filter)
- **Transaction**, **Class** – optional

Column names are matched case-insensitively; extra columns are ignored. Empty optional fields are handled.
