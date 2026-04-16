/* Indian locale utilities */

/** ₹1,00,000 format (Indian system) */
export function formatINR(value, short = false) {
  const num = Number(value || 0);
  if (short) {
    if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(2)} Cr`;
    if (num >= 1_00_000)    return `₹${(num / 1_00_000).toFixed(2)} L`;
    if (num >= 1_000)       return `₹${(num / 1_000).toFixed(1)}K`;
    return `₹${num}`;
  }
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Plain number in Indian system */
export function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

/** DD/MM/YYYY */
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return '—';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

/** 09 Apr 2026 */
export function formatDateLong(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Indian greeting */
export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/** Number in words — Indian style */
export function toIndianWords(num) {
  const n = Number(num || 0);
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1)} Crore`;
  if (n >= 1_00_000)    return `${(n / 1_00_000).toFixed(1)} Lakh`;
  if (n >= 1_000)       return `${(n / 1_000).toFixed(1)} Thousand`;
  return String(n);
}
