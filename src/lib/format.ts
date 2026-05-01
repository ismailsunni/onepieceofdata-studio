export function formatBerry(amount: number): string {
  if (amount >= 1_000_000_000) return `₿${(amount / 1_000_000_000).toFixed(2)}B`
  if (amount >= 1_000_000) return `₿${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₿${(amount / 1_000).toFixed(1)}K`
  return `₿${amount}`
}
