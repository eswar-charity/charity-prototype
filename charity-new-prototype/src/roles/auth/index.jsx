// Auth routes, rendered inside the public Layout (paths are relative: no leading slash).
import { AboutYou, AcceptInvite, SignIn, SignUp } from './pages.jsx'

export const routes = [
  { path: 'signin', element: <SignIn /> },
  { path: 'signup', element: <SignUp /> },
  { path: 'about-you', element: <AboutYou /> },
  { path: 'accept-invite', element: <AcceptInvite /> },
]
