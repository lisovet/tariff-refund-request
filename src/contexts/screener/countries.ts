/**
 * Curated country list for the screener country question (q2).
 *
 * Scope: IEEPA-window trading partners — all of Asia, EU-27, major
 * manufacturing countries, and NAFTA neighbors. Keeps the list
 * manageable without requiring a full ISO-3166 dependency.
 *
 * `iso` is retained in the data for future use (e.g. mapping to
 * HTS-origin rules) but is NOT displayed in the UI per the
 * screener-feedback pass.
 */

export interface Country {
  readonly iso: string
  readonly name: string
}

export const COUNTRIES: readonly Country[] = [
  { iso: 'CN', name: 'China' },
  { iso: 'VN', name: 'Vietnam' },
  { iso: 'IN', name: 'India' },
  { iso: 'MX', name: 'Mexico' },
  { iso: 'CA', name: 'Canada' },
  { iso: 'TH', name: 'Thailand' },
  { iso: 'MY', name: 'Malaysia' },
  { iso: 'ID', name: 'Indonesia' },
  { iso: 'PH', name: 'Philippines' },
  { iso: 'KH', name: 'Cambodia' },
  { iso: 'BD', name: 'Bangladesh' },
  { iso: 'PK', name: 'Pakistan' },
  { iso: 'LK', name: 'Sri Lanka' },
  { iso: 'TW', name: 'Taiwan' },
  { iso: 'KR', name: 'South Korea' },
  { iso: 'JP', name: 'Japan' },
  { iso: 'HK', name: 'Hong Kong' },
  { iso: 'SG', name: 'Singapore' },
  { iso: 'MM', name: 'Myanmar' },
  { iso: 'LA', name: 'Laos' },
  { iso: 'NP', name: 'Nepal' },
  { iso: 'AE', name: 'United Arab Emirates' },
  { iso: 'TR', name: 'Turkey' },
  { iso: 'IL', name: 'Israel' },
  { iso: 'DE', name: 'Germany' },
  { iso: 'IT', name: 'Italy' },
  { iso: 'FR', name: 'France' },
  { iso: 'ES', name: 'Spain' },
  { iso: 'PT', name: 'Portugal' },
  { iso: 'NL', name: 'Netherlands' },
  { iso: 'BE', name: 'Belgium' },
  { iso: 'PL', name: 'Poland' },
  { iso: 'CZ', name: 'Czech Republic' },
  { iso: 'SK', name: 'Slovakia' },
  { iso: 'HU', name: 'Hungary' },
  { iso: 'RO', name: 'Romania' },
  { iso: 'AT', name: 'Austria' },
  { iso: 'CH', name: 'Switzerland' },
  { iso: 'SE', name: 'Sweden' },
  { iso: 'DK', name: 'Denmark' },
  { iso: 'FI', name: 'Finland' },
  { iso: 'IE', name: 'Ireland' },
  { iso: 'GB', name: 'United Kingdom' },
  { iso: 'GR', name: 'Greece' },
  { iso: 'BR', name: 'Brazil' },
  { iso: 'AR', name: 'Argentina' },
  { iso: 'CL', name: 'Chile' },
  { iso: 'CO', name: 'Colombia' },
  { iso: 'PE', name: 'Peru' },
  { iso: 'ZA', name: 'South Africa' },
  { iso: 'EG', name: 'Egypt' },
  { iso: 'MA', name: 'Morocco' },
  { iso: 'AU', name: 'Australia' },
  { iso: 'NZ', name: 'New Zealand' },
]

export function filterCountries(query: string): readonly Country[] {
  const q = query.trim().toLowerCase()
  if (!q) return COUNTRIES
  return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q))
}
