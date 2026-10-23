/** Parse COLUMN_TYPE metadata, never infer choices from sampled row values. */
export function enumOptions(type: string): string[] | null {
  const match = /^enum\s*\(([\s\S]*)\)$/i.exec(type.trim())
  if (!match) return null
  const source = match[1], values: string[] = []
  let index = 0
  const spaces = () => { while (/\s/.test(source[index] ?? '') && index < source.length) index++ }
  spaces()
  while (index < source.length) {
    if (source[index++] !== "'") return null
    let value = '', closed = false
    while (index < source.length) {
      const char = source[index++]
      if (char === '\\') {
        if (index === source.length) return null
        const escaped = source[index++]
        value += ({ '0': '\0', n: '\n', r: '\r', t: '\t', b: '\b', Z: '\x1a' } as Record<string, string>)[escaped] ?? escaped
      } else if (char === "'") {
        if (source[index] === "'") { value += "'"; index++ }
        else { closed = true; break }
      } else value += char
    }
    if (!closed) return null
    values.push(value); spaces()
    if (index === source.length) return values
    if (source[index++] !== ',') return null
    spaces()
    if (index === source.length) return null
  }
  return null
}

export function enumTone(value: string, options: string[]): number {
  return Math.max(0, options.indexOf(value)) % 5
}

/** Hex text literals preserve apostrophes, backslashes, empty text and the literal "NULL". */
export function enumSqlValue(value: string | null, options: string[], nullable: boolean): string {
  if (value === null) {
    if (!nullable) throw new Error('该枚举字段不允许 NULL')
    return 'NULL'
  }
  if (!options.includes(value)) throw new Error('请选择数据库声明的枚举值')
  if (!value) return "''"
  return `CONVERT(0x${Array.from(new TextEncoder().encode(value), byte => byte.toString(16).padStart(2, '0')).join('')} USING utf8mb4)`
}

export function enumUpdateSql(db: string, table: string, field: string, value: string | null, structure: {field: string; type: string; null: string; key: string}[], columns: string[], row: unknown[] | Record<string, unknown>): string {
  const column = structure.find(column => column.field === field)
  const options = column && enumOptions(column.type)
  if (!column || !options) throw new Error('无法读取枚举字段定义，请刷新表结构')
  const keys = structure.filter(column => column.key === 'PRI')
  if (!keys.length) throw new Error('表没有主键，无法编辑')
  const identifier = (name: string) => '`' + name.replace(/`/g, '``') + '`'
  const keyLiteral = (value: unknown): string => {
    if (typeof value === 'string') return value ? `CONVERT(0x${Array.from(new TextEncoder().encode(value), byte => byte.toString(16).padStart(2, '0')).join('')} USING utf8mb4)` : "''"
    if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value)
    if (typeof value === 'object' && value !== null) {
      const binary = value as {type?: unknown; data?: unknown}
      if (binary.type === 'Buffer' && Array.isArray(binary.data) && binary.data.length && binary.data.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)) return '0x' + binary.data.map(byte => byte.toString(16).padStart(2, '0')).join('')
    }
    throw new Error('无法安全识别该行主键，已取消保存')
  }
  const where = keys.map(key => `${identifier(key.field)} = ${keyLiteral(Array.isArray(row) ? row[columns.indexOf(key.field)] : row[key.field])}`).join(' AND ')
  return `UPDATE ${identifier(db)}.${identifier(table)} SET ${identifier(field)} = ${enumSqlValue(value, options, column.null === 'YES')} WHERE ${where} LIMIT 1`
}
