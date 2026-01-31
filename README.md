# TollWatch – Turnpike Toll Analyzer

A single-page web app that reads turnpike (or similar) toll CSV exports, analyzes them, and shows summarized expenses with charts and a downloadable PDF report. Works on desktop and mobile.

## Features

- **Upload CSV or Excel** – Accepts **CSV** and **Excel (.xlsx, .xls)** files. Supports full transaction data (Posting Date, Exit Date, Exit Interchange, Transponder, Amount, etc.) or simple files with an Amount column. The first sheet is used for Excel files.
- **Settings on the same page** – Time period (All / Month / Quarter / Year / Custom range), date picker, and optional vehicle filter by transponder/tags.
- **Analysis results** – Total toll expenses, daily expense trend (line chart), expenses by vehicle (donut chart with “Vehicle 1”, “Vehicle 2”, “Unassigned” instead of raw IDs), and top toll locations table with **plaza location names** from the built-in database.
- **Click a day for details** – Click any point on the daily trend chart to see that day’s transactions (time, location name, vehicle, amount).
- **Toll plaza database** – `src/data/tollPlazas.js` maps interchange codes (e.g. T331 E, Md Trans Auth - FMT) to human-readable location names. Edit this file to add or correct plaza names.
- **Download report** – One-click PDF with totals, location names, and by-vehicle breakdown.
- **Responsive UI** – Single page, no tabs; layout adapts for phones and larger screens.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), upload a toll CSV or Excel file (e.g. `sample-toll-data.csv` or `public/TransactionsResult.xlsx`), set time period and options, click **Analyze**. Click a point on the daily trend chart to see that day’s transactions; use **Download report (PDF)** for a full report.

## Build

```bash
npm run build
npm run preview   # optional: preview production build
```

## Deploy to GitHub Pages

The repo is set up to deploy the **main** branch to GitHub Pages.

1. **Enable GitHub Pages:** In your repo on GitHub, go to **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.
2. **Push main:** Push the `main` branch (or merge your branch into `main` and push). The workflow **Deploy to GitHub Pages** will build and deploy the app.
3. **Live URL:** After the workflow completes (check the **Actions** tab), open:  
   **https://taureanjoe.github.io/turnpike_Toll_Analyzer/**  
   Use this exact URL (including the repo name). If you see a blank page, wait 1–2 minutes for the deploy to finish, then hard-refresh (Ctrl+Shift+R / Cmd+Shift+R). If it still fails, open DevTools (F12) → Console and check for 404 or script errors.

The app uses relative asset paths (`base: './'`) so it works from any deployment path.

## File format (CSV or Excel)

Accepted: **.csv**, **.xlsx**, **.xls**. For Excel, the **first sheet** is read. The app expects at least an **Amount** column. For richer analysis it uses:

- **Posting Date** (MM/DD/YYYY)
- **Exit Date** (MM/DD/YYYY HH:MM AM/PM)
- **Exit Interchange** – location name
- **Transponder** – vehicle/transponder ID (for “by vehicle” and vehicle filter)
- **Transaction**, **Class** – optional

Column names are matched case-insensitively; extra columns are ignored. Empty optional fields are handled.

## Sample data

- **`sample-toll-data.csv`** – Small CSV sample in the project root.
- **`public/TransactionsResult.xlsx`** – Sample Excel file (251 rows) for testing; you can open it from the app via “Upload CSV or Excel file” if you copy it from `public/` or use a path that points to it.

## Customizing toll plaza names

Edit **`src/data/tollPlazas.js`** to add or change location names. The `tollPlazaNames` object maps raw exit codes (e.g. `'T331 E'`, `'Md Trans Auth - FMT'`) to display names. Unlisted codes are shown as-is.
