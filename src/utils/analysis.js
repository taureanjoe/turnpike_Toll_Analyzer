import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  isWithinInterval,
  startOfDay,
  endOfDay,
  format,
  isValid,
} from 'date-fns'

/**
 * Filter rows by time period and optional date range
 */
export function filterByTimePeriod(rows, period, startDate, endDate, vehicleTags) {
  let filtered = rows.filter((r) => r.amount > 0)

  const hasDate = (d) => d && isValid(d)
  const inRange = (d, start, end) => hasDate(d) && isWithinInterval(d, { start, end })

  if (period === 'custom' && startDate && endDate) {
    const start = startOfDay(new Date(startDate))
    const end = endOfDay(new Date(endDate))
    filtered = filtered.filter((r) => r.date && inRange(r.date, start, end))
  } else if (period === 'month' && startDate) {
    const d = new Date(startDate)
    filtered = filtered.filter((r) => r.date && inRange(r.date, startOfMonth(d), endOfMonth(d)))
  } else if (period === 'quarter' && startDate) {
    const d = new Date(startDate)
    filtered = filtered.filter((r) => r.date && inRange(r.date, startOfQuarter(d), endOfQuarter(d)))
  } else if (period === 'year' && startDate) {
    const d = new Date(startDate)
    filtered = filtered.filter((r) => r.date && inRange(r.date, startOfYear(d), endOfYear(d)))
  } else if (period === 'all') {
    // no date filter
  } else {
    // default: include rows with or without date
    if (period === 'month' && !startDate) {
      const d = new Date()
      filtered = filtered.filter((r) => !r.date || inRange(r.date, startOfMonth(d), endOfMonth(d)))
    } else if (period === 'year' && !startDate) {
      const d = new Date()
      filtered = filtered.filter((r) => !r.date || inRange(r.date, startOfYear(d), endOfYear(d)))
    }
  }

  if (vehicleTags && vehicleTags.trim()) {
    const tags = vehicleTags
      .split(/[\s,]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    if (tags.length) {
      filtered = filtered.filter((r) =>
        tags.some((tag) => String(r.transponder || '').toLowerCase().includes(tag))
      )
    }
  }

  return filtered
}

/**
 * Daily expense trend: array of { date, total, count }
 */
export function dailyExpenseTrend(rows) {
  const byDay = new Map()
  for (const r of rows) {
    if (!r.date) continue
    const key = format(startOfDay(r.date), 'yyyy-MM-dd')
    const label = format(r.date, 'MMM d')
    if (!byDay.has(key)) byDay.set(key, { date: key, label, total: 0, count: 0 })
    const entry = byDay.get(key)
    entry.total += r.amount
    entry.count += 1
  }
  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Expenses by vehicle (transponder): array of { name, total, count, percent }
 * name is the raw transponder id (or empty string when missing).
 */
export function expensesByVehicle(rows) {
  const byVehicle = new Map()
  let total = 0
  for (const r of rows) {
    const id = r.transponder != null && String(r.transponder).trim() !== '' ? String(r.transponder).trim() : ''
    total += r.amount
    if (!byVehicle.has(id)) byVehicle.set(id, { name: id, total: 0, count: 0 })
    const entry = byVehicle.get(id)
    entry.total += r.amount
    entry.count += 1
  }
  return Array.from(byVehicle.values())
    .map((e) => ({ ...e, percent: total ? (e.total / total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Build a map from transponder id to display label: "Vehicle 1", "Vehicle 2", … or "Unassigned" for empty.
 */
export function getVehicleDisplayNames(rows) {
  const byVehicle = expensesByVehicle(rows)
  const map = new Map()
  byVehicle.forEach((v, i) => {
    const label = v.name === '' ? 'Unassigned' : `Vehicle ${i + 1}`
    map.set(v.name, label)
  })
  return map
}

/**
 * Top toll locations (exit interchange): array of { location, count, total }
 */
export function topTollLocations(rows, limit = 10) {
  const byLocation = new Map()
  for (const r of rows) {
    const loc = r.exitInterchange || '—'
    if (!byLocation.has(loc)) byLocation.set(loc, { location: loc, count: 0, total: 0 })
    const entry = byLocation.get(loc)
    entry.count += 1
    entry.total += r.amount
  }
  return Array.from(byLocation.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}

/**
 * Toll location breakdown for a subset of rows (e.g. one day). Same shape as topTollLocations.
 */
export function locationBreakdown(rows, limit = 20) {
  return topTollLocations(rows, limit)
}

/**
 * Travel behavior summary: total trips, weeks in period, avg weekly trips, top locations text.
 */
export function travelBehaviorSummary(rows, period, periodDate, startDate, endDate) {
  const totalTrips = rows.length
  if (totalTrips === 0) {
    return { totalTrips: 0, weeksInPeriod: 0, avgWeeklyTrips: 0, topLocationNames: [], weekdayCounts: null }
  }

  const dateRows = rows.filter((r) => r.date && isValid(r.date))
  let weeksInPeriod = 0
  if (period === 'custom' && startDate && endDate) {
    const start = startOfDay(new Date(startDate))
    const end = endOfDay(new Date(endDate))
    weeksInPeriod = Math.max(0.5, (end - start) / (7 * 24 * 60 * 60 * 1000))
  } else if (period === 'month' && periodDate) {
    const d = new Date(periodDate)
    weeksInPeriod = (endOfMonth(d) - startOfMonth(d)) / (7 * 24 * 60 * 60 * 1000) + 1 / 7
  } else if (period === 'quarter' && periodDate) {
    const d = new Date(periodDate)
    weeksInPeriod = (endOfQuarter(d) - startOfQuarter(d)) / (7 * 24 * 60 * 60 * 1000) + 1 / 7
  } else if (period === 'year' && periodDate) {
    const d = new Date(periodDate)
    weeksInPeriod = (endOfYear(d) - startOfYear(d)) / (7 * 24 * 60 * 60 * 1000) + 1 / 7
  } else if (dateRows.length >= 2) {
    const min = new Date(Math.min(...dateRows.map((r) => r.date.getTime())))
    const max = new Date(Math.max(...dateRows.map((r) => r.date.getTime())))
    weeksInPeriod = Math.max(0.5, (max - min) / (7 * 24 * 60 * 60 * 1000) + 1 / 7)
  } else {
    weeksInPeriod = 1
  }

  const avgWeeklyTrips = weeksInPeriod > 0 ? totalTrips / weeksInPeriod : totalTrips
  const topLocs = topTollLocations(rows, 5)
  const topLocationNames = topLocs.map((l) => l.location)

  const weekdayCounts = dateRows.length
    ? (() => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const byDay = new Map(dayNames.map((d) => [d, 0]))
        dateRows.forEach((r) => {
          const day = dayNames[r.date.getDay()]
          byDay.set(day, (byDay.get(day) ?? 0) + 1)
        })
        return Object.fromEntries(byDay)
      })()
    : null

  return {
    totalTrips,
    weeksInPeriod,
    avgWeeklyTrips,
    topLocationNames,
    weekdayCounts,
  }
}
