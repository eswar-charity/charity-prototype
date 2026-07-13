Please replace the existing implementation with a production-ready solution for event data and image rendering.

## 1. Event Data

- Remove all mock/static/hardcoded event data from the project.
- Use the data exactly as it exists inside the `event-data` folder.
- Load all event metadata, images, videos, and other assets directly from that folder.
- Do not modify or invent any event information.
- Ensure every event is correctly mapped to its corresponding assets.

### Event Mapping

Event 1
- Event Name: #NeonNight
- Nonprofit: Hoboken Homeless Home
- Mission: Let's throw back to the 80's and party for the people!

Event 2
- Event Name: #GiveNowApre'Later
- Nonprofit: Windham Mountain Conservatory
- Mission: Snowboarding + Giving makes for the best Apre'!

Event 3
- Event Name: #CharityHubGolfOuting
- Nonprofit: Center For Sight Restoration
- Mission: Bring your good times to the course and may the best shooter win.

Event 4
- Event Name: #DogDads
- Nonprofit: Bergen County Rescue Shelter
- Mission: Give some street cred to all the Dog Dads who stepped up and rescued a pooch.

Event 5
- Event Name: #BreakneckRidgeRun
- Nonprofit: Hudson Valley Trail Society
- Mission: Don't give up and don't break your neck.

---

## 2. Image Rendering

The previous implementation had black empty spaces because images were rendered with incorrect sizing.

The latest implementation fixed that by making the image container dynamic, but that is NOT the desired behavior.

### Desired Behavior

- Keep the card dimensions exactly the same for every event.
- Keep the image container height exactly the same for every card.
- Every card in the feed should have identical width and height.
- Do NOT allow the image container to resize based on image dimensions.
- Do NOT change the overall card layout.

Only modify how the image is rendered inside the existing container.

---

## 3. Image Scaling Rules

Images should:

- Occupy as much of the available container as possible.
- Maintain their original aspect ratio.
- Be responsive.
- Look natural.
- Never stretch or distort.

Avoid:

- Large black side bars.
- Large empty padding.
- Image distortion.
- Different card heights.
- Dynamic container heights.

---

## 4. Responsive Image Strategy

Implement a reusable image component used throughout the application.

The component should intelligently render images based on orientation.

Landscape images:
- Fill the available container naturally.

Portrait images:
- Scale to maximize the visible area within the fixed container.
- Reduce empty side space as much as possible.

Square images:
- Display naturally inside the same fixed container.

The rendering should be automatic.

---

## 5. Apply Everywhere

Use the same responsive image component in every location:

- Feed cards
- Hero banner
- Event detail page
- Live preview
- Video preview
- Carousel
- Modals
- Any component displaying event images

There should be only one shared implementation.

---

## 6. Layout Consistency

The feed should look like a professional social media grid.

Requirements:

- Every card has identical dimensions.
- Cards remain aligned in rows.
- No card should become taller or shorter because of its image.
- Grid spacing must remain consistent.
- Responsive behavior must be preserved across desktop, tablet, and mobile.

---

## 7. Code Quality

- Remove any remaining mock data.
- Remove duplicate image rendering logic.
- Create reusable components where appropriate.
- Keep the implementation clean, modular, and production-ready.

---

## 8. Final Verification

Before finishing, verify that:

✓ All five events use data from the `event-data` folder.
✓ No mock data exists anywhere.
✓ Every image loads correctly.
✓ Every card has the same dimensions.
✓ The image container size never changes.
✓ Images scale properly within the fixed container.
✓ No image is stretched.
✓ No large black side bars appear.
✓ The grid layout remains perfectly aligned.
✓ The implementation works consistently across the entire application.