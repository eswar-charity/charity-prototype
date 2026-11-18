import { useId, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from 'lucide-react'
import { useDomain } from '../../../domain/store.jsx'
import { MAX_PHOTOS } from './helpers.js'

const sampleUrl = (key, i) => `/photos/${key}/img${i}.jpg`

/**
 * Step 1 photo field: upload from the device (object URLs) or pick from the sample library of seeded photos.
 * Remove and reorder; the first photo is the cover. `error` is the inline validation message.
 */
export default function PhotoPicker({ photos, onChange, disabled = false, error }) {
  const s = useDomain()
  const uid = useId()
  const fileRef = useRef(null)
  const [note, setNote] = useState('')
  const [broken, setBroken] = useState(() => new Set())
  // The seeded events own the sample photos: /photos/<key>/img1..8.jpg
  const sets = useMemo(
    () => Object.values(s.events).filter((e) => e.photoKey && e.key === e.photoKey).map((e) => ({ key: e.key, title: e.title })),
    [s.events],
  )
  const [setKey, setSetKey] = useState(sets[0]?.key ?? '')

  const full = photos.length >= MAX_PHOTOS
  const add = (urls) => {
    const room = MAX_PHOTOS - photos.length
    if (urls.length > room) setNote(`You can add up to ${MAX_PHOTOS} photos. Extra photos were skipped.`)
    else setNote(urls.length ? `${urls.length === 1 ? 'Photo' : 'Photos'} added.` : '')
    if (room > 0 && urls.length) onChange([...photos, ...urls.slice(0, room)])
  }
  const onFiles = (e) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    const images = files.filter((f) => f.type.startsWith('image/'))
    if (images.length < files.length) setNote('Only image files can be added.')
    const urls = images.map((f) => (typeof URL.createObjectURL === 'function' ? URL.createObjectURL(f) : '')).filter(Boolean)
    if (urls.length) add(urls)
  }
  const toggleSample = (url) => {
    if (photos.includes(url)) { onChange(photos.filter((p) => p !== url)); setNote('Photo removed.') } else if (full) setNote(`You can add up to ${MAX_PHOTOS} photos.`)
    else add([url])
  }
  const move = (i, d) => {
    const next = [...photos]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
    setNote(`Photo moved to position ${i + d + 1}.`)
  }
  const remove = (i) => { onChange(photos.filter((_, x) => x !== i)); setNote('Photo removed.') }

  return (
    <div className={`se-photofield ${error ? 'is-invalid' : ''}`} id="se-w-photos" tabIndex={-1} aria-describedby={error ? `${uid}-err` : `${uid}-hint`}>
      <div className="se-photofield__head">
        <span className="ch-field__label" id={`${uid}-label`}>Photos</span>
        <span className="ch-field__hint" id={`${uid}-hint`}>Add at least one. The first photo is the cover. Up to {MAX_PHOTOS}.</span>
      </div>

      {!disabled && (
        <div className="row">
          <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" onClick={() => fileRef.current?.click()} disabled={full}>
            <ImagePlus size={18} aria-hidden="true" /> Upload photos
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden aria-label="Upload photos from your device" data-testid="photo-upload" onChange={onFiles} />
        </div>
      )}

      {photos.length > 0 ? (
        <ol className="se-photos" aria-labelledby={`${uid}-label`}>
          {photos.map((url, i) => (
            <li key={`${url}-${i}`} className="se-photo">
              {broken.has(url)
                ? <span className="se-photo__gone">This photo is no longer available. Remove it and add it again.</span>
                : <img src={url} alt={`Photo ${i + 1}${i === 0 ? ', the cover' : ''}`} onError={() => setBroken((b) => new Set(b).add(url))} />}
              {i === 0 && <span className="se-photo__cover badge badge--info">Cover</span>}
              {!disabled && (
                <span className="se-photo__tools">
                  <button type="button" className="icon-btn" aria-label={`Move photo ${i + 1} earlier`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowLeft size={18} aria-hidden="true" /></button>
                  <button type="button" className="icon-btn" aria-label={`Move photo ${i + 1} later`} disabled={i === photos.length - 1} onClick={() => move(i, 1)}><ArrowRight size={18} aria-hidden="true" /></button>
                  <button type="button" className="icon-btn" aria-label={`Remove photo ${i + 1}`} onClick={() => remove(i)}><Trash2 size={18} aria-hidden="true" /></button>
                </span>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="se-photofield__none ch-muted">No photos yet.</p>
      )}

      {!disabled && sets.length > 0 && (
        <fieldset className="se-samples">
          <legend>Sample library</legend>
          <p className="ch-field__hint">Demo photos from the seeded events. Pick any to try the flow without uploading.</p>
          <div className="ch-field">
            <label className="ch-field__label" htmlFor={`${uid}-set`}>Sample set</label>
            <select id={`${uid}-set`} className="ch-field__input" value={setKey} onChange={(e) => setSetKey(e.target.value)}>
              {sets.map((x) => <option key={x.key} value={x.key}>{x.title}</option>)}
            </select>
          </div>
          <ul className="se-samples__grid">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((i) => {
              const url = sampleUrl(setKey, i)
              const on = photos.includes(url)
              return (
                <li key={url}>
                  <button type="button" className={`se-sample ${on ? 'is-on' : ''}`} aria-pressed={on} aria-label={`Sample photo ${i} from ${sets.find((x) => x.key === setKey)?.title}${on ? ', added' : ''}`} onClick={() => toggleSample(url)}>
                    <img src={url} alt="" loading="lazy" />
                    {on && <span className="se-sample__tick badge badge--ok">Added</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </fieldset>
      )}

      <p className="ch-sr" role="status">{note}</p>
      {note && <p className="ch-field__hint" aria-hidden="true">{note}</p>}
      {error && <span className="ch-field__hint se-err" id={`${uid}-err`}>{error}</span>}
    </div>
  )
}
