/**
 * Toll plaza / interchange location database.
 * Maps raw exit codes (e.g. "T331 E", "Md Trans Auth - FMT") to human-readable location names.
 * Edit this file to add or correct plaza names.
 */
export const tollPlazaNames = {
  // Pennsylvania Turnpike (T3xx E/W)
  'T322 E': 'Interchange 322 (Eastbound)',
  'T322 W': 'Interchange 322 (Westbound)',
  'T331 E': 'Norristown (Eastbound)',
  'T331 W': 'Norristown (Westbound)',
  'T336 E': 'Fort Washington (Eastbound)',
  'T336 W': 'Fort Washington (Westbound)',
  'T340 W': 'Virginia Drive (Westbound)',
  'T341 E': 'Willow Grove (Eastbound)',
  'T341 W': 'Willow Grove (Westbound)',
  'T349 E': 'Bensalem (Eastbound)',
  'T349 W': 'Bensalem (Westbound)',
  'T353 E': 'Neshaminy Falls (Eastbound)',
  'T353 W': 'Neshaminy Falls (Westbound)',
  // Maryland / Delaware River / NJ
  'Md Trans Auth - FMT': 'Maryland Trans Auth – Fort McHenry Tunnel',
  'Md Trans Auth - JFK': 'Maryland Trans Auth – JFK Memorial Hwy',
  'Delaware DOT - D95': 'Delaware DOT – I-95',
  'Del River Port Auth - BFB': 'Delaware River Port Auth – Ben Franklin Bridge',
  'DRJT Bridge Comm - SF': 'Delaware River Joint Toll – Scudder Falls',
  'DRJT Bridge Comm - T-M': 'Delaware River Joint Toll – Trenton–Morrisville',
  'Burlington Br Comm - TPB': 'Burlington Bridge – Tacony Palmyra',
  'Central Bus. Dist. - CXC': 'Central Business District – CXC',
  'New Jersey Turnpike - 6': 'New Jersey Turnpike – Exit 6',
  'New Jersey Turnpike - 14C': 'New Jersey Turnpike – Exit 14C',
  'H43 S': 'Route 43 South',
}

/**
 * Get display name for an exit interchange code. Returns the code if not in the database.
 */
export function getPlazaDisplayName(code) {
  if (!code || String(code).trim() === '') return '—'
  const key = String(code).trim()
  return tollPlazaNames[key] ?? key
}
