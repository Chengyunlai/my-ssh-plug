import type { QueryRow } from './mysql-client'

export interface ColumnInfo {
  field: string
  type: string
  null: string
  key: string
  default: string | null
  extra: string
  comment: string
}

/** Hex literals are independent of SQL quoting modes, and read the requested schema explicitly. */
export function tableStructureSql(db: string, table: string): string {
  const literal = (value: string) => {
    if (!value) throw new Error('数据库名和表名不能为空')
    return `CONVERT(0x${Array.from(new TextEncoder().encode(value), byte => byte.toString(16).padStart(2, '0')).join('')} USING utf8mb4)`
  }
  return `SELECT c.COLUMN_NAME AS field, c.COLUMN_TYPE AS type, c.IS_NULLABLE AS nullable, c.COLUMN_KEY AS column_key, c.COLUMN_DEFAULT AS default_value, c.EXTRA AS extra, c.COLUMN_COMMENT AS comment, t.TABLE_COMMENT AS table_comment FROM information_schema.COLUMNS c LEFT JOIN information_schema.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME WHERE c.TABLE_SCHEMA = ${literal(db)} AND c.TABLE_NAME = ${literal(table)} ORDER BY c.ORDINAL_POSITION`
}

export function readTableStructure(rows: QueryRow[]): { columns: ColumnInfo[]; tableComment: string } {
  const value = (row: QueryRow, name: string, index: number) => Array.isArray(row) ? row[index] : row[name]
  return {
    tableComment: rows.length ? String(value(rows[0], 'table_comment', 7) ?? '') : '',
    columns: rows.map(row => ({
      field: String(value(row, 'field', 0) ?? ''),
      type: String(value(row, 'type', 1) ?? ''),
      null: String(value(row, 'nullable', 2) ?? ''),
      key: String(value(row, 'column_key', 3) ?? ''),
      default: value(row, 'default_value', 4) == null ? null : String(value(row, 'default_value', 4)),
      extra: String(value(row, 'extra', 5) ?? ''),
      comment: String(value(row, 'comment', 6) ?? '')
    }))
  }
}
