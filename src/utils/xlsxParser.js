import * as XLSX from 'xlsx'
import { parseTurnpikeCsv } from './csvParser'

/**
 * Read an XLSX file (ArrayBuffer), convert first sheet to CSV, then parse with existing CSV logic.
 * Returns same normalized row format as parseTurnpikeCsv.
 */
export function parseTurnpikeXlsx(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) throw new Error('Excel file has no sheets')
  const sheet = workbook.Sheets[firstSheetName]
  const csv = XLSX.utils.sheet_to_csv(sheet)
  if (!csv.trim()) throw new Error('First sheet is empty')
  return parseTurnpikeCsv(csv)
}
