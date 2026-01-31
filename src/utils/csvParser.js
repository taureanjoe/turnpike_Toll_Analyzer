import Papa from 'papaparse'
import { parse, isValid } from 'date-fns'

/**
 * Normalize column names: trim, lowercase, handle "Card #" / "Card Number"
 */
function normalizeHeader(header) {
  return header
    ? String(header).trim().toLowerCase().replace(/\s+/g, ' ').replace(/#/g, ' number')
    : ''
}

/**
 * Parse amount string like "$1.72" or "1.72" to number
 */
function parseAmount(value) {
  if (value == null || value === '') return 0
  const str = String(value).replace(/[$,]/g, '').trim()
  const num = parseFloat(str)
  return Number.isFinite(num) ? num : 0
}

/**
 * Parse date from "MM/DD/YYYY" or "MM/DD/YYYY HH:MM AM/PM"
 */
function parseDate(value) {
  if (value == null || value === '') return null
  const str = String(value).trim()
  const formats = ['MM/dd/yyyy hh:mm a', 'MM/dd/yyyy HH:mm a', 'MM/dd/yyyy']
  for (const fmt of formats) {
    try {
      const d = parse(str, fmt, new Date())
      if (isValid(d)) return d
    } catch (_) {}
  }
  try {
    const d = new Date(str)
    return isValid(d) ? d : null
  } catch (_) {
    return null
  }
}

/**
 * Find column index by possible header names (normalized)
 */
function findColumnIndex(headers, ...names) {
  const normalized = headers.map(normalizeHeader)
  for (const name of names) {
    const n = normalizeHeader(name)
    const i = normalized.findIndex((h) => h === n || h.includes(n) || n.includes(h))
    if (i !== -1) return i
  }
  return -1
}

/**
 * Parse turnpike CSV (full transaction or simple Amount-only format) into normalized rows
 */
export function parseTurnpikeCsv(csvText) {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  if (parsed.errors.length && !parsed.data.length) {
    throw new Error(parsed.errors[0]?.message || 'Failed to parse CSV')
  }

  const rawRows = parsed.data
  if (!rawRows.length) return []

  const first = rawRows[0]
  const headers = Object.keys(first).map((k) => k.trim())

  const amountIdx = findColumnIndex(headers, 'Amount', 'amount')
  if (amountIdx === -1) {
    const amountKey = headers.find((h) => normalizeHeader(h).includes('amount'))
    if (!amountKey) throw new Error('CSV must contain an "Amount" column')
  }

  const getVal = (row, ...names) => {
    const key = headers[findColumnIndex(headers, ...names)]
    return key != null ? row[key] : ''
  }

  return rawRows.map((row) => {
    const amount = parseAmount(getVal(row, 'Amount', 'amount'))
    const postingDate = parseDate(getVal(row, 'Posting Date', 'posting date'))
    const exitDate = parseDate(getVal(row, 'Exit Date', 'exit date'))
    /* Use exit date as when travel actually happened; fall back to posting date if missing */
    const date = exitDate || postingDate
    const transaction = getVal(row, 'Transaction', 'transaction') || ''
    const transponder = getVal(row, 'Transponder', 'transponder') || ''
    const exitInterchange = getVal(row, 'Exit Interchange', 'exit interchange') || ''
    const vehicleClass = getVal(row, 'Class', 'class') || ''
    const licenseState = getVal(row, 'License State', 'license state') || ''
    const licensePlate = getVal(row, 'License Plate', 'license plate', 'License', 'license') || ''

    return {
      amount,
      date,
      postingDate,
      exitDate,
      transaction,
      transponder: transponder.trim() || '',
      exitInterchange: exitInterchange.trim() || '—',
      class: vehicleClass,
      licenseState: licenseState.trim() || '',
      licensePlate: licensePlate.trim() || '',
      raw: row,
    }
  })
}
