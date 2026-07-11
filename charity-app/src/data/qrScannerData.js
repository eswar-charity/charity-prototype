export const QR_SCANNER_ROLES = {
  se: {
    title: 'Check in attendee',
    subtitle: 'Scan a Charity Hub badge or mobile ticket at the door',
    successLabel: 'Checked in',
    successDetail: (name, event) => `${name} is now counted in your Joined total for ${event}.`,
    statLabel: 'Checked in this session',
    simulateLabel: 'Simulate scan',
    alreadyLabel: 'Already checked in',
  },
  admin: {
    title: 'Audit check-in scan',
    subtitle: 'Verify physical attendance against platform records for governance',
    successLabel: 'Audit logged',
    successDetail: (name, event) => `${name} at ${event} — recorded in the platform audit trail.`,
    statLabel: 'Audit scans this session',
    simulateLabel: 'Simulate audit scan',
    alreadyLabel: 'Already logged',
  },
};

export const QR_ATTENDEES = [
  { id: 'ch-48291', name: 'Michael R.', initials: 'MR', color: '#1976D2', ticket: 'Backer · $50', backed: true },
  { id: 'ch-77302', name: 'Priya M.', initials: 'PM', color: '#7B1FA2', ticket: 'General admission', backed: false },
  { id: 'ch-91044', name: 'James L.', initials: 'JL', color: '#0D7377', ticket: 'Backer · $100', backed: true },
  { id: 'ch-33817', name: 'Emma T.', initials: 'ET', color: '#D32F2F', ticket: 'Volunteer crew', backed: false },
  { id: 'ch-55290', name: 'David K.', initials: 'DK', color: '#F57C00', ticket: 'Backer · $25', backed: true },
  { id: 'ch-66103', name: 'Aisha N.', initials: 'AN', color: '#5E35B1', ticket: 'General admission', backed: false },
];

let scanCursor = 0;

export function nextAttendee() {
  const attendee = QR_ATTENDEES[scanCursor % QR_ATTENDEES.length];
  scanCursor += 1;
  return attendee;
}

export function resetScanCursor() {
  scanCursor = 0;
}
