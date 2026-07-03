# Prompt — MBS Studio Homepage (Next.js + Tailwind + GSAP)

Create a homepage for "Mr. Big Stuff Studio", a branding agency based in Casablanca, Morocco. Use Next.js with Tailwind CSS and GSAP for animations.

## Tech Stack
- Next.js 15 (App Router, static export via `output: 'export'`)
- React 19
- Tailwind CSS 4
- GSAP + ScrollTrigger (animations)
- TypeScript
- HTML5 Canvas API (for drawing feature)

## Design Direction (from Figma)
- Clean, minimal, white background
- Black text (#000000), dark footer (#1E1E1E)
- No green accent — strictly black & white
- Typography: **Instrument Sans** (Regular, Medium) from Google Fonts for body/nav
- Hero text: NOT a font — it's hand-drawn lettering exported as images/SVGs from Figma
- Logo "Mr. Big Stuff" is a raster image (PNG embedded in SVG), placed in public/logo.svg

## Page Structure

### 1. Header (sticky, fixed top)
- Left: Logo "Mr. Big Stuff" (image, ~135x55px)
- Small white rectangle below logo to mask the bottom edge (as per Figma)
- Right: Navigation links in Instrument Sans Regular 16px — "Juice", "About", "Work", "Book a call"
- Background: white
- Width: full viewport
- Height: 71px

### 2. Hero Section (full viewport height, sticky)
- Centered hand-drawn lettering: "Ideas and power branding for pioneering founders and bold marketing teams"
- The text is composed of multiple image fragments arranged to look handwritten (see Figma assets: "À partir de la sélection" images)
- These are NOT fonts — they are raster images of hand-drawn letters
- The hero section is STICKY — it stays in view while the user scrolls, and the projects section scrolls OVER it
- Below the hero text, two lines of small uppercase text (Instrument Sans, 13px):
  - Left: "CASABLANCA BASED. OPEN TO THE WORLD"
  - Right: "WE CONNECT STRATEGY WITH STORYTELLING, DESIGN, AND CONTENT TO BUILD BRANDS THAT MATTER."

### 3. Projects Section (scrolls over the sticky hero)
- Asymmetric masonry-like layout with 7 project cards
- Cards are different sizes (large ~506x633px, medium ~409x512px, small ~290x363px)
- Scattered/organic positioning (not a rigid grid)
- Each card shows a project image
- Cards are DRAGGABLE (see Interactive Features below)
- Single click on card → navigates to project page
- Click + hold + drag → moves the card freely on the page
- Use GSAP ScrollTrigger for initial reveal animations (stagger, fade up)

### 4. "See More" Button
- Centered below projects
- Black pill-shaped button (rounded-full, bg-black, text-white)
- Text: "See more" in Instrument Sans Medium 17px
- Width: 195px, Height: 59px

### 5. Contact/CTA Section ("Want a coffee with us? Let us talk!")
- Dark background (#1E1E1E), full width, ~962px height
- Centered hand-drawn white text (images, not fonts): "Want a coffee with us? Let us talk!"
- White pill-shaped "Book a call" button (bg-white, text-black, rounded-full)
- Same dimensions as "See more" button

### 6. Footer
- Still inside the dark section
- Bottom left: Logo (white version, masked)
- Bottom right two columns:
  - Column 1: email (bigstuff@gmail.com), Instagram (@Mr.Bigstuff Studio)
  - Column 2: address (23, résidence Passadena 20000, Casablanca), phone (+212 123 45 678 9)
- All text: Instrument Sans Medium 15.58px, white

## Interactive Features (CRITICAL — from client brief)

### A. Custom Cursor — Pencil Mode (entire site)
- Replace the default cursor with a custom SVG pencil cursor on the entire site
- CSS: `cursor: none;` on body, then a div following the mouse with a pencil SVG
- The pencil cursor should feel natural and responsive (use requestAnimationFrame or GSAP quickTo)

### B. Drawing on the Page (entire site)
- Full-page transparent HTML5 Canvas overlay (pointer-events: auto for drawing, but pass-through for clicks on elements below)
- When user clicks and drags WITH the pencil cursor (on empty areas, not on project cards), it draws black lines on the canvas
- Lines persist during the session (cleared on page reload)
- Implementation: Canvas with composite events — detect if the click target is a project card or empty space
- On mobile: disable drawing, use normal touch interactions

### C. Cursor Transform on Project Hover — Inverted Circle (like Locomotive site)
- When the pencil cursor hovers over a project card, it transforms into a CIRCLE
- The circle uses `mix-blend-mode: difference` to create an inverted color effect
- Circle size: ~60-80px diameter
- Smooth transition between pencil and circle (scale animation)
- Reference: https://brutal-gallery.framer.website/website/locomotive — the cursor effect on hover

### D. Draggable Projects + Click to Open
- Project cards can be DRAGGED freely on the page
- Distinguish between click and drag using a timer/distance threshold:
  - If mousedown + mouseup < 200ms and mouse moved < 5px → it's a CLICK → navigate to project page
  - If mousedown held > 200ms OR mouse moved > 5px → it's a DRAG → move the card
- While dragging, the card follows the cursor with slight inertia
- Cards stay where the user drops them (position persists during session)
- Use GSAP Draggable or custom implementation with pointer events
- On mobile: single tap opens project, long press + drag moves it

## File Structure
```
app/
  layout.tsx              (root layout, head, fonts, global styles, canvas overlay)
  page.tsx                (homepage assembling all components)
  projects/
    [slug]/
      page.tsx            (project page template)
components/
  Header.tsx              (sticky nav, 71px)
  Hero.tsx                (sticky hero with hand-drawn text images)
  ProjectsSection.tsx     (draggable project cards, masonry layout)
  ContactSection.tsx      (dark CTA section with hand-drawn text)
  Footer.tsx              (inside dark section, contacts)
  CustomCursor.tsx        (pencil cursor + circle hover + drawing logic)
  BookACallModal.tsx      (popup modal with form)
hooks/
  useCursor.ts            (cursor logic: pencil, circle, blend mode)
  useDrawing.ts           (canvas drawing logic)
  useDraggable.ts         (project cards drag + click detection)
styles/
  globals.css             (Tailwind imports, custom cursor, fonts)
public/
  logo.svg                (MBS logo)
  hero/                   (hand-drawn text images from Figma)
  projects/               (project images, placeholders for now)
  fonts/                  (Instrument Sans if self-hosted)
```

## Important Notes
- All interactive components must be "use client" (cursor, canvas, draggable, modal)
- The interactive features (drawing, dragging, custom cursor) are DESKTOP ONLY
- On mobile: normal cursor, no drawing, tap to open projects, no drag
- Mobile: header becomes hamburger menu, grid becomes single column stack
- Use placeholder images (gray boxes or https://placehold.co/) for project cards
- Keep canvas drawing performant — limit stroke recording, use requestAnimationFrame
- GSAP Draggable plugin may require GSAP Club — alternatively implement with vanilla pointer events + React refs
- Use Next.js static export (`output: 'export'` in next.config.ts) for VPS deployment
- Site must score 90+ on Lighthouse (canvas overlay should not block rendering)
- Add comments in code for sections needing real content/images later
