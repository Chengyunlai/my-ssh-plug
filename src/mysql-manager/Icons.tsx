interface IconProps { size?: number; className?: string }

export function ConnectionIcon({ size = 16, className }: IconProps): React.JSX.Element {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="3.5" width="16" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.6" /><rect x="4" y="10.5" width="16" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.6" /><path d="M7.5 6h.01M7.5 13h.01M4 19.5h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
}

export function PowerIcon({ size = 15, className }: IconProps): React.JSX.Element {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M7.05 5.95a7 7 0 1 0 9.9 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}

export function EditIcon({ size = 14, className }: IconProps): React.JSX.Element {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 16.5-.7 4.2 4.2-.7L19.3 8.2a2 2 0 0 0-2.8-2.8L4 16.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="m14.8 6.8 2.8 2.8" stroke="currentColor" strokeWidth="1.7" /></svg>
}

export function TrashIcon({ size = 14, className }: IconProps): React.JSX.Element {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M10 4h4l1 3H9l1-3ZM8 10v7m4-7v7m4-7v7M6.5 7l.8 13h9.4l.8-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function SearchIcon({ size = 14, className }: IconProps): React.JSX.Element {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.2" stroke="currentColor" strokeWidth="1.7" /><path d="m15.5 15.5 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
}

export function QueryIcon({ size = 13, className }: IconProps): React.JSX.Element {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h12M13 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function SqlIcon({ size = 14, className }: IconProps): React.JSX.Element {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5.5h14M5 10h9M5 14.5h6M5 19h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><path d="m16 10 3 2.5-3 2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function PlusIcon({ size = 16, className }: IconProps): React.JSX.Element {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}

export function DatabaseIcon({ size = 15, className }: IconProps): React.JSX.Element {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><ellipse cx="12" cy="5" rx="7.5" ry="3" stroke="currentColor" strokeWidth="1.6" /><path d="M4.5 5v7c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V5M4.5 12v7c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-7" stroke="currentColor" strokeWidth="1.6" /></svg>
}

export function TableIcon({ size = 14, className }: IconProps): React.JSX.Element {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3.5 9h17M9 4v16" stroke="currentColor" strokeWidth="1.6" /></svg>
}

export function ChevronIcon({ open, size = 13, className }: IconProps & { open: boolean }): React.JSX.Element {
  return <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d={open ? 'm3.5 6 4.5 4 4.5-4' : 'm6 3.5 4 4.5-4 4.5'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
