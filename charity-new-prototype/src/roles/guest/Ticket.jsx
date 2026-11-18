// "Your ticket" modal: the code the host scans at check-in, with a QR of the same code.
import { CalendarDays, MapPin, Ticket as TicketIcon } from 'lucide-react'
import { Modal, QR, useConfirm, useRun } from '../../ui/kit.jsx'
import { useDomain, useSession } from '../../domain/store.jsx'
import { whenFor } from './lib.js'

export default function TicketModal({ event, onClose }) {
  const s = useDomain()
  const { user } = useSession()
  const run = useRun()
  const confirm = useConfirm()
  const ev = s.events[event.key] ?? event
  const code = user ? ev.tickets?.[user.id] : null
  const going = !!user && ev.joinedIds.includes(user.id)

  const leave = async () => {
    const ok = await confirm({ title: 'Give up your spot?', body: `You will no longer be on the list for ${ev.title}. You can join again while it is open.`, confirm: 'Give up my spot', cancel: 'Keep my spot', danger: true })
    if (ok) run('leaveEvent', { eventKey: ev.key }, { success: 'You left the event', onOk: onClose })
  }

  return (
    <Modal title="Your ticket" onClose={onClose} labelledBy="ticket-t">
      {going && code ? (
        <div className="ticket stack">
          <p className="ch-muted">You are going. Show this code at the door and the host will check you in.</p>
          <article className="ticket__card" aria-label={`Ticket for ${ev.title}`}>
            <div className="ticket__top">
              <p className="ch-eyebrow"><TicketIcon size={14} aria-hidden="true" /> Admit one</p>
              <h3 className="ticket__title">{ev.title}</h3>
              <p className="ticket__line"><CalendarDays size={16} aria-hidden="true" /> {whenFor(s, ev)}</p>
              {ev.location && <p className="ticket__line"><MapPin size={16} aria-hidden="true" /> {ev.location}</p>}
              <p className="ticket__who">{user.name}</p>
            </div>
            <div className="ticket__stub">
              <QR value={code} size={168} label={`QR code for ticket ${code}`} />
              <p className="ticket__code" aria-label={`Ticket code ${code}`}>{code}</p>
            </div>
          </article>
          <p className="ch-muted gate-fine">You can find this ticket any time under Saved. Demo ticket: it only works inside this prototype.</p>
          <div className="dialog-actions">
            <button type="button" className="ch-btn ch-btn--text" onClick={leave}>Give up my spot</button>
            <button type="button" className="ch-btn ch-btn--primary" onClick={onClose}>Done</button>
          </div>
        </div>
      ) : (
        <div className="stack">
          <p className="ch-muted">You are not on the list for this event yet.</p>
          <div className="dialog-actions"><button type="button" className="ch-btn ch-btn--primary" onClick={onClose}>Close</button></div>
        </div>
      )}
    </Modal>
  )
}
