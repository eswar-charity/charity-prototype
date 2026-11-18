// Share sheet (never gated): copy link, QR, and the device's own share menu when there is one.
import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { Modal, QR, useToast } from '../../ui/kit.jsx'

export function ShareSheet({ title, text, url, onClose }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast('Link copied', 'ok')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast('Could not copy automatically. Select the link and copy it.', 'error')
      document.getElementById('share-url')?.select()
    }
  }
  const nativeShare = async () => {
    try { await navigator.share({ title, text, url }) } catch { /* the person closed the share menu */ }
  }

  return (
    <Modal title={`Share ${title}`} onClose={onClose} labelledBy="share-t">
      <div className="stack">
        <p className="ch-muted">{text}</p>
        <div className="ch-field">
          <label className="ch-field__label" htmlFor="share-url">Link</label>
          <div className="share__row">
            <input id="share-url" className="ch-field__input" readOnly value={url} onFocus={(e) => e.target.select()} />
            <button type="button" className="ch-btn ch-btn--secondary" onClick={copy}>
              {copied ? <><Check size={16} aria-hidden="true" /> Copied</> : <><Copy size={16} aria-hidden="true" /> Copy link</>}
            </button>
          </div>
        </div>
        <div className="share__qr">
          <QR value={url} size={176} label={`QR code for ${title}`} />
          <p className="ch-muted gate-fine">Scan to open this page on another phone.</p>
        </div>
        <div className="dialog-actions">
          {canShare && <button type="button" className="ch-btn ch-btn--secondary" onClick={nativeShare}><Share2 size={16} aria-hidden="true" /> Share with your apps</button>}
          <button type="button" className="ch-btn ch-btn--primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </Modal>
  )
}
