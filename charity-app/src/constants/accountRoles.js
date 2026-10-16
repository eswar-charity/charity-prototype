// Sign-in role chooser on the landing screen. This is navigation copy, not domain
// data: Social Entrepreneurs can sign up; nonprofit and admin accounts are
// invite-only, so those entries sign in to an account that already exists.
export const accountRoles = [
  { id: 'se', label: 'Social Entrepreneur', route: '/about-you', title: 'Create your account', subtitle: "You're one step from starting your first event." },
  { id: 'guest', label: 'Guest', route: '/guest/feed', title: 'Continue as a guest', subtitle: 'Discover and support events happening near you.' },
  { id: 'np', label: 'Non-profit', route: '/np/home', title: 'Sign in as a nonprofit', subtitle: 'Nonprofit accounts are by invitation. Use the link your Charity Hub contact sent, or sign in below.' },
  { id: 'admin', label: 'Charity Hub Admin', route: '/admin', title: 'Continue as an admin', subtitle: 'Governance, approvals, and platform operations.' },
];
