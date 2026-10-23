import { useState } from 'react'
import { enumTone } from './enum-column'

export function EnumValue({ value, options, comment }: { value: string; options: string[]; comment: string }) {
  return <span className={`enum-value enum-tone-${enumTone(value, options)}`} title={[comment, `ENUM · ${options.length} 个选项`, options.map(option => option === '' ? '（空字符串）' : option).join(' / ')].filter(Boolean).join('\n')}>{value === '' ? '空字符串' : value}</span>
}

export function EnumEditor({ value, options, nullable, field, onSave, onCancel }: { value: string | null; options: string[]; nullable: boolean; field: string; onSave: (value: string | null) => Promise<void>; onCancel: () => void }) {
  const initial = value === null ? 'null' : String(options.indexOf(value))
  const [selected, setSelected] = useState(initial)
  const [saving, setSaving] = useState(false)
  const valid = selected === 'null' ? nullable : Number(selected) >= 0 && Number(selected) < options.length
  return <div className="enum-editor" onDoubleClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape' && !saving) { event.stopPropagation(); onCancel() } }}>
    <select autoFocus aria-label={`${field} 枚举值`} value={selected} disabled={saving} onChange={event => setSelected(event.target.value)}>
      {!valid && <option value={initial} disabled>当前值不在声明中</option>}
      {nullable && <option value="null">NULL（空值）</option>}
      {options.map((option, index) => <option key={index} value={index}>{option === '' ? '（空字符串）' : option}</option>)}
    </select>
    <button className="ssh-btn ssh-btn-sm" disabled={!valid || saving} onClick={async () => { setSaving(true); try { await onSave(selected === 'null' ? null : options[Number(selected)]) } finally { setSaving(false) } }}>{saving ? '保存中…' : '保存'}</button>
    <button className="ssh-btn ssh-btn-sm" disabled={saving} onClick={onCancel}>取消</button>
  </div>
}
