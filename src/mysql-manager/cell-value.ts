/** Format the JSON wire representation of MySQL values without losing binary bytes. */
export function formatCellValue(value: unknown): string {
  if (value == null) return 'NULL'
  if (typeof value !== 'object') return String(value)
  const binary = value as { type?: unknown; data?: unknown }
  if (binary.type === 'Buffer' && Array.isArray(binary.data) && binary.data.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)) {
    const bytes = new Uint8Array(binary.data)
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      if (!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text)) return text
    } catch { /* Non-text bytes are displayed losslessly as hexadecimal. */ }
    return '0x' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  return JSON.stringify(value, null, 2)
}

export function csvCell(value: unknown): string {
  const text = value == null ? '' : formatCellValue(value)
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
}
