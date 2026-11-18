// Public site routes, rendered inside the public Layout (components/Layout.jsx). Auth lives in roles/auth.
import './guest.css'
import Home from '../../pages/Home.jsx'
import EventPage from '../../pages/EventPage.jsx'
import { NonprofitsPage, NonprofitPage, CausesPage } from '../../pages/Nonprofits.jsx'
import HowItWorks from '../../pages/HowItWorks.jsx'
import OrganizerPage from '../../pages/Organizer.jsx'
import DonateSuccess from '../../pages/DonateSuccess.jsx'
import SavedPage from '../../pages/Saved.jsx'
import NotFound from '../../pages/NotFound.jsx'

export const routes = [
  { index: true, element: <Home /> },
  { path: 'events/:key', element: <EventPage /> },
  { path: 'nonprofits', element: <NonprofitsPage /> },
  { path: 'nonprofits/:slug', element: <NonprofitPage /> },
  { path: 'causes', element: <CausesPage /> },
  { path: 'how-it-works', element: <HowItWorks /> },
  { path: 'organizers/:id', element: <OrganizerPage /> },
  { path: 'donate/success/:id', element: <DonateSuccess /> },
  { path: 'saved', element: <SavedPage /> },
  { path: '*', element: <NotFound /> },
]
