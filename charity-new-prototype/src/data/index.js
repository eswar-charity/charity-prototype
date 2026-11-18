// Joins the JSON generated from the existing project's seed data
// (scripts/build-data.py → backend/seed + the 20-nonprofit XLSX).
import rawEvents from './events.json'
import rawNonprofits from './nonprofits.json'
import categories from './categories.json'
import timelines from './timelines.json'
import { goalFor, eventStart } from '../lib/format.js'

export const PHOTO_COUNT = 8

export const nonprofits = rawNonprofits
export const nonprofitBySlug = Object.fromEntries(nonprofits.map((n) => [n.slug, n]))
export { categories, timelines }
export const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c]))

export const photoUrls = (key, count = PHOTO_COUNT) =>
  Array.from({ length: count }, (_, i) => `/events/${key}/img${i + 1}.jpg`)

export const events = rawEvents
  .map((e) => ({
    ...e,
    goal: goalFor(e.raised),
    nonprofitName: nonprofitBySlug[e.nonprofit]?.name ?? e.nonprofit,
    cover: `/events/${e.key}/img1.jpg`,
    photos: photoUrls(e.key),
    startsAt: eventStart(e.date, e.start),
  }))
  .sort((a, b) => a.startsAt - b.startsAt)

export const eventByKey = Object.fromEntries(events.map((e) => [e.key, e]))

export const eventsForNonprofit = (slug) => events.filter((e) => e.nonprofit === slug)

export function nonprofitStats(slug) {
  const list = eventsForNonprofit(slug)
  return {
    eventsHosted: list.length,
    totalRaised: list.reduce((s, e) => s + e.raised, 0),
    totalBacked: list.reduce((s, e) => s + e.backed, 0),
  }
}

export const totals = {
  raised: events.reduce((s, e) => s + e.raised, 0),
  backed: events.reduce((s, e) => s + e.backed, 0),
  events: events.length,
  nonprofits: nonprofits.length,
}
