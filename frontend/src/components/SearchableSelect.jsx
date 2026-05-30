import { useState, useRef, useEffect, useMemo } from 'react'

export default function SearchableSelect({ value, onChange, options, placeholder = '—', disabled = false }) {
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setBusca('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = useMemo(() => {
    const q = busca.toLowerCase().trim()
    if (!q) return options
    return options.filter((o) => (o.label || '').toLowerCase().includes(q))
  }, [options, busca])

  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className="pokemon-edit-input"
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1,
          userSelect: 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{selectedLabel}</span>
        <span style={{ marginLeft: '0.5rem', flexShrink: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>▾</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 200,
          background: 'var(--surface)',
          border: '1px solid rgba(168,85,247,0.35)',
          borderRadius: 'var(--radius)',
          marginTop: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '0.4rem' }}>
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar..."
              style={{ width: '100%', margin: 0 }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            <div
              style={{ padding: '0.4rem 0.75rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem' }}
              onMouseDown={() => { onChange(''); setOpen(false); setBusca('') }}
            >
              {placeholder}
            </div>
            {filtered.map((o) => (
              <div
                key={o.value}
                style={{
                  padding: '0.4rem 0.75rem',
                  cursor: 'pointer',
                  background: o.value === value ? 'rgba(168,85,247,0.22)' : 'transparent',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                }}
                onMouseEnter={(e) => { if (o.value !== value) e.currentTarget.style.background = 'rgba(168,85,247,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = o.value === value ? 'rgba(168,85,247,0.22)' : 'transparent' }}
                onMouseDown={() => { onChange(o.value); setOpen(false); setBusca('') }}
              >
                {o.label}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '0.4rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum resultado</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
