// Small form primitives bound to a nested draft object via dot paths.

export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

export function setPath(obj, path, value) {
  const keys = path.split('.')
  const clone = structuredClone(obj)
  let cur = clone
  keys.slice(0, -1).forEach((k) => {
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {}
    cur = cur[k]
  })
  cur[keys[keys.length - 1]] = value
  return clone
}

export function Field({ label, path, draft, onChange, type = 'text', rtl = false, full = false, textarea = false, hint, ...rest }) {
  const value = getPath(draft, path) ?? ''
  const cls = `adm-field ${rtl ? 'rtl' : ''} ${full ? 'full' : ''}`
  return (
    <div className={cls}>
      <label>{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(path, e.target.value)} {...rest} />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(path, type === 'number' ? Number(e.target.value) : e.target.value)}
          {...rest}
        />
      )}
      {hint && <span className="adm-small">{hint}</span>}
    </div>
  )
}

export function Check({ label, path, draft, onChange }) {
  return (
    <label className="adm-check">
      <input type="checkbox" checked={!!getPath(draft, path)} onChange={(e) => onChange(path, e.target.checked)} />
      {label}
    </label>
  )
}

export function Color({ label, path, draft, onChange }) {
  const value = getPath(draft, path) || '#000000'
  return (
    <div className="adm-field">
      <label>{label}</label>
      <div className="adm-color">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(e) => onChange(path, e.target.value)} />
        <input type="text" value={value} onChange={(e) => onChange(path, e.target.value)} />
      </div>
    </div>
  )
}

export function Select({ label, path, draft, onChange, options }) {
  return (
    <div className="adm-field">
      <label>{label}</label>
      <select value={getPath(draft, path) ?? ''} onChange={(e) => onChange(path, e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function Card({ title, hint, children }) {
  return (
    <div className="adm-card">
      {title && <h2>{title}</h2>}
      {hint && <p className="hint">{hint}</p>}
      {children}
    </div>
  )
}
