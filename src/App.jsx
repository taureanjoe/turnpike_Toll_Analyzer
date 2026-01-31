import { useState, useMemo } from 'react'
import { parseTurnpikeCsv } from './utils/csvParser'
import {
  filterByTimePeriod,
  dailyExpenseTrend,
  expensesByVehicle,
  topTollLocations,
} from './utils/analysis'
import { format } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import './App.css'

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom range' },
]

const CHART_COLORS = ['#0d9488', '#0891b2', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b']

export default function App() {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([])
  const [parseError, setParseError] = useState('')
  const [period, setPeriod] = useState('month')
  const [periodDate, setPeriodDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [includeAllVehicles, setIncludeAllVehicles] = useState(true)
  const [vehicleTags, setVehicleTags] = useState('')
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    setParseError('')
    setFile(null)
    setFileName('')
    setRows([])
    setHasAnalyzed(false)
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please select a CSV file.')
      return
    }
    setFileName(f.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result ?? ''
        const parsed = parseTurnpikeCsv(text)
        setRows(parsed)
        setFile(f)
        setParseError('')
      } catch (err) {
        setParseError(err.message || 'Failed to parse CSV')
        setRows([])
      }
    }
    reader.readAsText(f, 'UTF-8')
  }

  const filteredRows = useMemo(() => {
    const tags = includeAllVehicles ? '' : vehicleTags
    return filterByTimePeriod(rows, period, periodDate, null, tags)
  }, [rows, period, periodDate, includeAllVehicles, vehicleTags])

  const customFilteredRows = useMemo(() => {
    if (period !== 'custom' || !startDate || !endDate) return filteredRows
    return filterByTimePeriod(rows, 'custom', startDate, endDate, includeAllVehicles ? '' : vehicleTags)
  }, [rows, period, startDate, endDate, includeAllVehicles, vehicleTags])

  const displayRows = period === 'custom' ? customFilteredRows : filteredRows

  const totalExpenses = useMemo(() => displayRows.reduce((s, r) => s + r.amount, 0), [displayRows])
  const dailyTrend = useMemo(() => dailyExpenseTrend(displayRows), [displayRows])
  const byVehicle = useMemo(() => expensesByVehicle(displayRows), [displayRows])
  const topLocations = useMemo(() => topTollLocations(displayRows, 10), [displayRows])

  const runAnalysis = () => setHasAnalyzed(true)

  const downloadPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    doc.setFontSize(18)
    doc.text('Toll Expense Report', 40, 40)
    doc.setFontSize(11)
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 40, 58)
    doc.text(`Total toll expenses: $${totalExpenses.toFixed(2)}`, 40, 76)
    doc.text(`Transactions: ${displayRows.length}`, 40, 94)

    doc.autoTable({
      startY: 110,
      head: [['Location', 'Count', 'Total cost']],
      body: topLocations.map((l) => [l.location, String(l.count), `$${l.total.toFixed(2)}`]),
      theme: 'grid',
      headStyles: { fillColor: [15, 148, 136] },
    })

    let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 110
    doc.setFontSize(14)
    doc.text('By vehicle / transponder', 40, y)
    y += 12
    doc.autoTable({
      startY: y,
      head: [['Vehicle', 'Total', 'Count', '%']],
      body: byVehicle.map((v) => [
        v.name,
        `$${v.total.toFixed(2)}`,
        String(v.count),
        `${v.percent.toFixed(1)}%`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 148, 136] },
    })

    doc.save('toll-expense-report.pdf')
  }

  const showResults = hasAnalyzed && (rows.length > 0 || parseError)

  return (
    <div className="app">
      <header className="header">
        <h1 className="header-title">TollWatch Toll Expense Analyzer</h1>
        <p className="header-date">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </header>

      <main className="main">
        <section className="card upload-card">
          <h2 className="card-title">Upload &amp; settings</h2>

          <div
            className={`upload-zone ${fileName ? 'has-file' : ''}`}
            onClick={() => document.getElementById('csv-input')?.click()}
          >
            <input
              id="csv-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="upload-input"
            />
            <div className="upload-content">
              <span className="upload-icon">↑</span>
              <span className="upload-label">
                {fileName ? fileName : 'Upload CSV file'}
              </span>
            </div>
          </div>
          {parseError && <p className="error-msg">{parseError}</p>}
          {rows.length > 0 && (
            <p className="success-msg">{rows.length} transaction(s) loaded.</p>
          )}

          <div className="settings">
            <h3 className="settings-title">Time period</h3>
            <div className="period-buttons">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`period-btn ${period === opt.value ? 'active' : ''}`}
                  onClick={() => setPeriod(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {period === 'custom' && (
              <div className="date-range">
                <label>
                  <span>Start date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <label>
                  <span>End date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </label>
              </div>
            )}
            {(period === 'month' || period === 'quarter' || period === 'year') && (
              <div className="period-date">
                <label>
                  <span>Date</span>
                  <input
                    type="date"
                    value={periodDate}
                    onChange={(e) => setPeriodDate(e.target.value)}
                  />
                </label>
              </div>
            )}

            <div className="toggle-row">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={includeAllVehicles}
                  onChange={(e) => setIncludeAllVehicles(e.target.checked)}
                />
                <span>Include all vehicles</span>
              </label>
            </div>
            {!includeAllVehicles && (
              <div className="vehicle-tags">
                <label>
                  <span>Vehicle tags (comma or space separated)</span>
                  <input
                    type="text"
                    placeholder="e.g. 006 11743677"
                    value={vehicleTags}
                    onChange={(e) => setVehicleTags(e.target.value)}
                  />
                </label>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary analyze-btn"
            onClick={runAnalysis}
            disabled={rows.length === 0}
          >
            Analyze
          </button>
        </section>

        {showResults && (
          <section className="card results-card">
            <h2 className="card-title">Analysis results</h2>

            <div className="total-block">
              <span className="total-label">Total toll expenses</span>
              <span className="total-value">${totalExpenses.toFixed(2)}</span>
            </div>

            {dailyTrend.length > 0 && (
              <div className="chart-block">
                <h3 className="chart-title">Daily expense trend</h3>
                <div className="chart-wrap chart-line">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={dailyTrend} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        stroke="var(--text-muted)"
                      />
                      <YAxis
                        tickFormatter={(v) => `$${v}`}
                        tick={{ fontSize: 11 }}
                        stroke="var(--text-muted)"
                      />
                      <Tooltip
                        formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Total']}
                        labelFormatter={(l) => `Date: ${l}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--accent)', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {byVehicle.length > 0 && (
              <div className="chart-block">
                <h3 className="chart-title">Expenses by vehicle</h3>
                <div className="chart-wrap chart-pie">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={byVehicle}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        label={({ name, percent }) =>
                          `${name.length > 12 ? name.slice(0, 10) + '…' : name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {byVehicle.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Total']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {topLocations.length > 0 && (
              <div className="table-block">
                <h3 className="chart-title">Top toll locations</h3>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Location</th>
                        <th>Count</th>
                        <th>Total cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topLocations.map((row, i) => (
                        <tr key={i}>
                          <td>{row.location}</td>
                          <td>{row.count}</td>
                          <td>${row.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button type="button" className="btn btn-primary download-btn" onClick={downloadPdf}>
              Download report (PDF)
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
