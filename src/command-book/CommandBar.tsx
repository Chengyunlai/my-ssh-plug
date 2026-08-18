import { useMemo, useRef, useState } from 'react'
import { categories, type CommandEntry } from './data'

interface FlatEntry extends CommandEntry {
  category: string
}

function buildIndex(): FlatEntry[] {
  return categories.flatMap<FlatEntry>((c) =>
    c.commands.map((cmd) => ({ ...cmd, category: c.name }))
  )
}

const INDEX = buildIndex()

export default function CommandBar(): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return INDEX.filter(
      (c) => c.cmd.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [query])

  const copy = (cmd: string): void => {
    window.ssh.copyText(cmd)
    setCopied(cmd)
    window.setTimeout(() => setCopied((cur) => (cur === cmd ? null : cur)), 1200)
  }

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && matches.length > 0) {
      copy(matches[0].cmd)
      setQuery('')
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="cmd-bar">
      <span className="cmd-bar-icon">⌘</span>
      <input
        ref={inputRef}
        placeholder="命令手册:输入关键字,如 grep / 压缩 / 进程"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {open && query.trim() && (
        <div className="cmd-bar-pop">
          {matches.length === 0 ? (
            <div className="cmd-bar-hint">没有匹配的命令</div>
          ) : (
            matches.map((m) => (
              <button
                key={`${m.category}:${m.cmd}`}
                className="cmd-bar-item"
                onMouseDown={(e) => {
                  e.preventDefault()
                  copy(m.cmd)
                }}
              >
                <code>{m.cmd}</code>
                <span className="cmd-bar-desc">{m.desc}</span>
                <span className="cmd-bar-cat">{m.category}</span>
                {copied === m.cmd && <span className="cmd-bar-copied">已复制</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
