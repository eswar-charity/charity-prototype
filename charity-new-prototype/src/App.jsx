import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import EventPage from './pages/EventPage.jsx'
import { NonprofitsPage, NonprofitPage, CausesPage } from './pages/Nonprofits.jsx'
import Create from './pages/Create.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="events/:key" element={<EventPage />} />
        <Route path="nonprofits" element={<NonprofitsPage />} />
        <Route path="nonprofits/:slug" element={<NonprofitPage />} />
        <Route path="causes" element={<CausesPage />} />
        <Route path="create" element={<Create />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
