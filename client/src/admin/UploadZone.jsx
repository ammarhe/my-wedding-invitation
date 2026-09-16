import { useRef, useState } from 'react'

export default function UploadZone({ accept, label, onFiles, multiple = false, busy = false }) {
  const [over, setOver] = useState(false)
  const inputRef = useRef(null)

  const handle = (files) => {
    const list = Array.from(files || []).filter(Boolean)
    if (list.length) onFiles(multiple ? list : [list[0]])
  }

  return (
    <div
      className={`adm-drop ${over ? 'over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        handle(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={(e) => handle(e.target.files)} />
      {busy ? 'Uploading…' : label}
    </div>
  )
}
