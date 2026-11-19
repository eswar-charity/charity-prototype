// The wizard's stepper: connected states, jumping back, attention, locked steps, direction of travel.
import { describe, it, expect } from 'vitest'
import { screen, within, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp, makeEngine, EMAILS } from '../../../test-utils.jsx'

const user = userEvent.setup()
const rail = () => within(screen.getByRole('navigation', { name: 'Wizard steps' }))
const stateOf = (label) => within(rail().getByText(label).closest('li')).getAllByText(/^(Current step|Done|Not done|Locked|Needs attention)$/)[0].textContent
const body = () => document.querySelector('.wz-body')

describe('stepper', () => {
  it('starts with step 1 current and the rest still to do, as a connected ordered list', async () => {
    renderApp('/se/create', { as: EMAILS.mike })
    await screen.findByRole('heading', { name: 'Photos and story' })
    const items = rail().getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items[0]).toHaveAttribute('aria-current', 'step')
    expect(stateOf('Photos and story')).toBe('Current step')
    for (const l of ['Nonprofit', 'Date and place', 'Preview and submit']) expect(stateOf(l)).toBe('Not done')
    expect(items.every((li) => /wz__step/.test(li.className))).toBe(true)
    expect(rail().queryAllByRole('button')).toHaveLength(0) // nothing reached yet, nothing to jump to
  })

  it('marks finished steps Done, lets you jump back to them, and keeps steps you have not reached unclickable', async () => {
    renderApp('/se/create/spring-sprint/2', { as: EMAILS.mike }) // seeded draft saved at step 2
    await screen.findByRole('heading', { name: 'Nonprofit' })
    expect(stateOf('Photos and story')).toBe('Done')
    expect(rail().getByText('Photos and story').closest('li')).toHaveClass('is-done')
    expect(stateOf('Nonprofit')).toBe('Current step')
    expect(stateOf('Date and place')).toBe('Not done')
    expect(rail().getAllByRole('button').map((b) => b.textContent)).toEqual([expect.stringContaining('Photos and story')])
    await user.click(rail().getByRole('button', { name: /Photos and story/ }))
    expect(await screen.findByRole('heading', { name: 'Photos and story' })).toBeInTheDocument()
    // having been to step 2 already, it can be reached again from step 1
    expect(rail().getAllByRole('button').some((b) => /Nonprofit/.test(b.textContent))).toBe(true)
  })

  it('slides forward on Continue and backward on Back, and names the step it is on', async () => {
    renderApp('/se/create/spring-sprint/2', { as: EMAILS.mike })
    await screen.findByRole('heading', { name: 'Nonprofit' })
    expect(screen.getByText('Pick the nonprofit this event supports.')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /^ASPCA/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { name: 'Date and place' })).toBeInTheDocument()
    expect(body()).toHaveClass('wz-body--fwd')
    expect(screen.getByText('Say when and where it happens.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByRole('heading', { name: 'Nonprofit' })).toBeInTheDocument()
    expect(body()).toHaveClass('wz-body--back')
    expect(stateOf('Nonprofit')).toBe('Current step')
    expect(stateOf('Date and place')).toBe('Not done') // saved at step 3, but still not completed
  })

  it('turns the current step to Needs attention when Continue finds a problem, and clears it when fixed', async () => {
    renderApp('/se/create/spring-sprint/2', { as: EMAILS.mike })
    await screen.findByRole('heading', { name: 'Nonprofit' })
    await user.click(screen.getByRole('button', { name: 'Continue' })) // nothing chosen
    await waitFor(() => expect(stateOf('Nonprofit')).toBe('Needs attention'))
    expect(rail().getByText('Nonprofit').closest('li')).toHaveClass('is-attention')
    expect(rail().queryByText('Current step')).not.toBeInTheDocument() // the word changes, not just the colour
    await user.click(screen.getByRole('radio', { name: /^ASPCA/ }))
    await waitFor(() => expect(stateOf('Nonprofit')).toBe('Current step'))
  })

  it('shows locked steps as locked, not clickable, with the flagged step current (fix mode)', async () => {
    renderApp('/se/create/book-drive-bash/1', { as: EMAILS.sam })
    await screen.findByRole('heading', { name: 'Photos and story' })
    expect(rail().getAllByText('Locked')).toHaveLength(2)
    expect(stateOf('Nonprofit')).toBe('Locked'); expect(stateOf('Date and place')).toBe('Locked')
    expect(rail().getByText('Nonprofit').closest('li')).toHaveClass('is-locked')
    expect(rail().queryAllByRole('button').some((b) => /Nonprofit|Date and place/.test(b.textContent))).toBe(false)
  })

  it('step 4 doubles as a checklist: every step with its summary and an Edit link; problems are flagged on the rail and fixable', async () => {
    const engine = makeEngine()
    const ev = engine.getState().events['spring-sprint']
    Object.assign(ev, { wizardStep: 4, nonprofitId: 'aspca', date: 'Dec 20, 2026', start: '9:00 AM', end: '12:00 PM', location: '', story: 'A 5K that ends with pancakes.' })
    renderApp('/se/create/spring-sprint/4', { as: EMAILS.mike, engine })
    await screen.findByRole('heading', { name: 'Preview and submit' })
    const list = within(screen.getByRole('list', { name: 'Checklist' }))
    expect(list.getAllByRole('listitem')).toHaveLength(3)
    expect(list.getByText('ASPCA')).toBeInTheDocument()
    expect(list.getByText(/photos? · #SpringSprint/)).toBeInTheDocument() // the seeded photo set counts: no false "add a photo"
    expect(list.getByRole('button', { name: 'Edit Photos and story' })).toBeInTheDocument()
    // the missing location is flagged on the rail, in the checklist and in the banner
    expect(stateOf('Date and place')).toBe('Needs attention')
    expect(list.getByText(/location/i)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Finish these before you submit')
    await user.click(list.getByRole('button', { name: 'Fix Date and place' }))
    expect(await screen.findByRole('heading', { name: 'Date and place' })).toBeInTheDocument()
  })

  it('has a Done track segment for every finished step on a draft at step 4', async () => {
    const engine = makeEngine()
    Object.assign(engine.getState().events['spring-sprint'], { wizardStep: 4, nonprofitId: 'aspca', date: 'Dec 20, 2026', start: '9:00 AM', end: '12:00 PM', location: 'Hoboken, NJ', guidelinesAccepted: true })
    renderApp('/se/create/spring-sprint/4', { as: EMAILS.mike, engine })
    await screen.findByRole('heading', { name: 'Preview and submit' })
    for (const l of ['Photos and story', 'Nonprofit', 'Date and place']) expect(stateOf(l)).toBe('Done')
    expect(stateOf('Preview and submit')).toBe('Current step')
    expect(document.querySelectorAll('.wz__step.is-done')).toHaveLength(3)
    fireEvent.keyDown(document, { key: 'Tab' }) // keyboard users reach the done steps as buttons
    expect(rail().getAllByRole('button')).toHaveLength(3)
  })
})
