# Frontend Prototype Generation Instructions

You are an experienced Senior Frontend Engineer and UI/UX implementation expert.

## Objective

I have exported every screen from Figma as images. All images are available in a single SE folder.

Your task is to recreate every screen as a **pixel-perfect React.js application**.

## Tech Stack

* React.js only
* JavaScript (No TypeScript)
* Static JSON/data only
* No backend
* No API calls
* No authentication
* No database

## Requirements

### 1. Pixel Perfect UI

* Recreate every screen exactly as shown in the images.
* Do not simplify layouts.
* Match:

  * spacing
  * typography
  * colors
  * shadows
  * borders
  * gradients
  * icons
  * illustrations
  * cards
  * tables
  * charts (static)
  * modals
  * badges
  * hover states (where obvious)

### 2. Build Every Screen

* Build every image in the folder.
* Do not skip any screen.
* If there are duplicate screens, reuse components where appropriate.
* Every screen should be accessible through React Router.

### 3. CTA Detection

Identify every possible CTA (Call To Action) visible in the designs.

Examples:

* Buttons
* Links
* Cards
* Menu items
* Tabs
* Filters
* Search
* Pagination
* Dropdowns
* Toggles
* Floating buttons
* Navigation

Every CTA should be clickable.

Since this is a static prototype:

* clicking should navigate to the correct screen when possible
* otherwise open the expected modal
* otherwise show the expected UI state

Never leave visible buttons inactive.

### 4. Static Data

Use realistic mock data.

Examples:

* names
* email addresses
* amounts
* charts
* tables
* notifications
* avatars
* statistics

The UI should look production-ready.

### 5. Component Architecture

Create reusable components for:

* Navbar
* Sidebar
* Header
* Footer
* Buttons
* Cards
* Tables
* Forms
* Inputs
* Dialogs
* Dropdowns
* Charts
* Tabs
* Badges
* Pagination
* Empty states

Avoid duplicated code.

### 6. Responsive Design

Support:

* Mobile

Layouts should exactly like in uploaded images and adapt naturally to all type of phones.

### 7. Clean Code

* Follow best React practices.
* Keep components small.
* Organize folders properly.
* Remove unused code.
* Avoid inline styles unless necessary.

### 8. Assets

Use the provided exported images as the visual reference.

If icons are not available:

* use Lucide React icons or SVG placeholders that closely match the design.

### 9. Validation

Before considering a screen complete, verify:

* Nothing is missing from the design.
* Every visible element exists.
* Every CTA is implemented.
* Styling closely matches the image.
* No placeholder boxes unless absolutely unavoidable.

### 10. Important Constraints

* Do NOT redesign anything.
* Do NOT change colors.
* Do NOT invent layouts.
* Do NOT omit sections because they look repetitive.
* Do NOT ignore dialogs, tooltips, dropdowns, or empty states if they appear in the designs.

## Deliverable

Produce a fully functional static React.js prototype that visually matches all supplied Figma images, with reusable components, proper routing, responsive layouts, and working CTAs backed by static mock data.
