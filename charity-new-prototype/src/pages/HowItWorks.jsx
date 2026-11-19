import { Link } from 'react-router-dom'
import { BadgeCheck, CalendarCheck, HandHeart, MessageSquare, ShieldCheck, Ticket, Trophy } from 'lucide-react'
import { Reveal } from '../components/Brand.jsx'
import { useSession } from '../domain/store.jsx'
import { hostTarget } from '../roles/guest/lib.js'

const HOST_STEPS = [
  { icon: CalendarCheck, title: 'Dream it up', text: 'Pick a verified nonprofit, add photos and tell people what the event is about. Your draft saves as you go.' },
  { icon: ShieldCheck, title: 'The nonprofit approves', text: 'The nonprofit reads your event and approves it, asks for changes or declines with a reason. Nothing goes public without that.' },
  { icon: MessageSquare, title: 'Run the room', text: 'Once it is live, post updates before, during and after. Check people in with their ticket code on the day.' },
]
const GUEST_STEPS = [
  { icon: Ticket, title: 'Join with an email', text: 'No password and no account. Add your email, get a ticket with a QR code and keep it under Saved.' },
  { icon: MessageSquare, title: 'Join the conversation', text: 'Post, reply, like and chat in the event room. Hosts carry a Host badge so you know who is speaking for the event.' },
  { icon: HandHeart, title: 'Help it win', text: 'Back the nonprofit if you like. Gifts go through Stripe and you get a receipt. Your turnout is what moves the event up the board.' },
]
const FAQ = [
  ['Do I have to give to take part?', 'No. Showing up counts most. The leaderboard counts people going, never dollars.'],
  ['What does “Competition for Good” mean?', 'Hosts compete to throw events people actually show up for. A bigger crowd moves your event up, and every event backs a verified nonprofit.'],
  ['How does an event get to the top?', 'By the number of people going. Invite friends, keep the room lively and thank people.'],
  ['Where does the money go?', 'Straight to the nonprofit through Stripe. Charity Hub does not hold it, and a card processing fee is shown before you pay.'],
  ['Can a nonprofit say no to my event?', 'Yes. It approves every event in its name, or asks for changes with a reason. Nothing goes public without that.'],
  ['Who sees my name and email?', 'Others see your first name and last initial. Your email is only used for your ticket and receipt.'],
  ['I’m new to hosting. Where do I start?', 'Pick a nonprofit, add a photo and tell your story. Your draft saves as you go.'],
  ['Is my event ever paused?', 'Charity Hub can pause an event that breaks the guidelines. The page then reads “Temporarily unavailable”.'],
  ['Do I need an account to join?', 'No. An email is enough, and you get a ticket with a QR code.'],
  ['What happens after the event?', 'It closes, the room stays open for photos and thank-yous, and the host gets an impact summary.'],
]

export default function HowItWorks() {
  const { user } = useSession()
  const host = hostTarget(user)
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <p className="ch-eyebrow">How it works</p>
          <h1 className="h-display-2">From a good idea to a full room.</h1>
          <p className="lede">Hosts bring the idea, nonprofits keep it honest and guests make it an event. Here is how each part goes.</p>
        </div>
      </section>

      <section className="section" aria-labelledby="hiw-hosts">
        <div className="wrap">
          <Reveal className="section__head section__head--stack">
            <p className="ch-eyebrow">For hosts</p>
            <h2 id="hiw-hosts" className="h-display-3">Throw an event people remember.</h2>
          </Reveal>
          <Steps steps={HOST_STEPS} />
          {host && <p className="section__more"><Link to={host} className="ch-btn ch-btn--primary">Host an event</Link></p>}
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="hiw-guests">
        <div className="wrap">
          <Reveal className="section__head section__head--stack">
            <p className="ch-eyebrow">For guests</p>
            <h2 id="hiw-guests" className="h-display-3">Show up, speak up, keep it going.</h2>
          </Reveal>
          <Steps steps={GUEST_STEPS} />
          <p className="section__more"><Link to="/#discover" className="ch-btn ch-btn--primary">Find events</Link></p>
        </div>
      </section>

      <section className="section" aria-labelledby="hiw-np">
        <div className="wrap hiw-np">
          <div>
            <p className="ch-eyebrow">For nonprofits</p>
            <h2 id="hiw-np" className="h-display-3">Verified, then in control.</h2>
            <p className="lede">Charity Hub invites each nonprofit and checks its documents and Stripe account before it can host anything. After that, it approves every event in its name.</p>
            <p className="invite__cta"><Link to="/nonprofits" className="ch-btn ch-btn--secondary">See verified partners</Link></p>
          </div>
          <ul className="proof proof--stack">
            <li className="proof__item ch-accent"><BadgeCheck size={22} aria-hidden="true" /><span>Invite-only: no nonprofit appears without Charity Hub verifying it.</span></li>
            <li className="proof__item ch-accent"><Trophy size={22} aria-hidden="true" /><span>Competition for Good<sup>®</sup>: events compete to bring the biggest crowd.</span></li>
          </ul>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="hiw-faq">
        <div className="wrap wrap--narrow">
          <h2 id="hiw-faq" className="h-display-3">Common questions</h2>
          <dl className="faq">
            {FAQ.map(([q, a]) => (
              <div key={q} className="faq__item"><dt>{q}</dt><dd>{a}</dd></div>
            ))}
          </dl>
          <p className="demo-note">This is a prototype. Events, counts and payments are demo content and no money moves.</p>
        </div>
      </section>
    </>
  )
}

function Steps({ steps }) {
  return (
    <Reveal as="ol" className="journey">
      {steps.map((st, n) => (
        <li key={st.title} className="stage">
          <span className="stage__n" aria-hidden="true">{n + 1}</span>
          <h3 className="h-heading"><st.icon size={22} aria-hidden="true" className="stage__icon" /> {st.title}</h3>
          <p className="stage__text">{st.text}</p>
        </li>
      ))}
    </Reveal>
  )
}
