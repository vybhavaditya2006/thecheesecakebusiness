# Cheesecake bites site — project rules (v3)
Brand: working name "Miette", NOT final (it may change for trademark and domain reasons). Never hard-code the name anywhere: read name, tagline, logo path and domain from src/content/brand.ts so a rename is a one-file change. Cheesecake bites by Shlok. Tagline: "A little, well made." Current campaign: Diwali & Dussehra launch special.
Pitch: whole cheesecakes are expensive, too much to finish, and too heavy for health-conscious people. The brand sells bite-sized portions: the craving is satisfied without overeating, and it costs less.
Flavours: Blueberry, KitKat, Oreo, Coffee, Lotus Biscoff. Custom orders: build your own bite, Half & Half cake, gift box (5 or 10), party platter (25 or 50). Whole cheesecakes (src/content/whole-cakes.ts): all five flavours; their home is /flavours#whole ("Whole Cakes" in the nav), and they are ordered on the Whole cheesecake tab of /box with a flavour, a size once sizes exist, a preferred date (confirmed on WhatsApp) and an optional message for the cake. Sizes and prices stay null until Shlok confirms them; until then they read "Sizes and price on WhatsApp".
Pricing: box of five pieces (pick any mix) ₹150, launch offer ₹125. Single piece ₹65, launch offer ₹50. Same price for every flavour.
The pack: a long white paper tray with five round cups in a single row, and a clear plastic (PET) sleeve the tray slides into. It has no ribbon or bow; draw and model it that way. The shape is provisional until Shlok's packaging photos arrive. Coffee is light brown all through with nothing on top.
Pricing words: wherever a price appears, say "piece", never "bite" ("₹50 a piece", "Single piece", "Box of five pieces", "₹25 a piece in a box of five"), including the WhatsApp message and the live total. "Bite" stays only in descriptive and playful text.
Delivery: free within 5 km of Nagarabhavi, Bengaluru 560072; paid beyond 5 km (charge confirmed on WhatsApp). Same-day delivery if in stock, otherwise made to order with the day confirmed on WhatsApp. Payment: UPI or cash. No minimum order. Kitchen coordinates: [12.96331, 77.51994] (Plus Code 7J4VXG79+8X).
Contact: the email address appears in the footer and on Good to Know as a mailto link, for questions only. The phone number for calls is the WhatsApp number. All ordering and payment happen on WhatsApp.

## Site
Six pages, plus a 404 page. Do not add others.
- Home (/)
- Flavours (/flavours)
- Build your box (/box). Replaces /order, which redirects here.
- Our Story (/story)
- Custom & Gifts (/custom)
- Good to Know (/info)
Each page has one job. All pages share one horizontal slide page transition.
Say it once: every fact has one home page where it is explained in full. Elsewhere it appears only in a different, shorter form (label, icon, number, link), never the same sentence twice.

## Ordering
No forms and no email. Build your box -> Book -> wa.me link to Shlok's number with the order prefilled.
Removed in Round 2, do not bring back: Web3Forms, the details form, the address check and send-order.

## Look and feel (v3)
Look: calm, photo-first and premium. Cream #F3E7DA background, wine #7A1F2B type and accents, deep wine #4A0F18 footer, light card #FAF5EF (at about 90% over photos). Gold #C89B3C only for small rules and ornaments, never body text on cream; blush #EDD3C8 for panels and bands. No further colours. Flavour accents only inside a flavour's own scene: blueberry #5B3FA0, kitkat #D2232A, oreo #111111, coffee #6F4E37, biscoff #C8813C. Script wordmark SVG, Cormorant Garamond headings, letter-spaced DM Sans small caps labels, DM Sans body.
Parts (src/components/v3): hairline frame (1px wine line round photos and cards), outlined button that fills wine on hover, card, small caps label, section. Use these rather than one-off styles.
Photos: real photos in hairline frames, through the photo pipeline (scripts/process-photos.mjs). Cut-outs for single pieces.
Feel: clean and professional; nothing that reads as made for children.
Motion: one slide-and-fade reveal for whole blocks (src/components/v3/Reveal.astro), and one horizontal slide page transition for every page. Easing is calm (power or expo out): no bounce, back or elastic.
Removed in v3, do not bring back: SplitText letter and word waves, staggered bullets, stamps, count-ups, stickers, hand-written notes, magnetic squishy buttons, the per-page entrances (lid, untie, roll, pin, turn), the Home cake dive, the pinned Why bites scene, and anything left of the Crumb Monster.
Kept: the Taste cursor (the bite cursor on desktop) and the Flavours switcher piece.
Offer banner: permanent, full width on every page, no close button and nothing saved in the browser; the text loops seamlessly with no gap or jump and is never clipped at 320 px, 375 px or desktop widths.

## Home (v3)
In order: 1) hero: a full-width photo with a light card (wordmark, tagline, one line about cheesecake pieces made in Nagarabhavi, Order and See flavours buttons); 2) directly under it, on the first screen at 375 px: a contact strip of three outlined buttons, Call (shows the number), WhatsApp, Email (shows the address); 3) three tiles: Pieces, Box of five pieces, Whole cheesecakes; 4) Why pieces: one large photo beside three short lines; 5) the five flavours as cut-outs, each linking to its flavour; 6) how ordering works in three numbered lines with one photo; 7) a Shlok photo card linking to Our Story.

## 3D
- three.js (vanilla). One shared kit in src/lib/three for the bite and the pack of five (tray and sleeve).
- One WebGL canvas per page.
- Loaded lazily when a 3D object is a screen away.
- Procedural geometry and canvas-painted textures; no model files.
- Render only when on screen.
- devicePixelRatio capped at 1.5 on desktop and 1.25 on phones. A small view (the Flavours switcher bite) may go up to 2.5 to stay sharp.
- Fall back to the existing 2D versions if WebGL2 is missing, reduced motion is on, or the first second runs under 45 fps.
- Scroll-driven 3D is deterministic and reversible.

## Stack
Astro (static output) + TypeScript + Tailwind. GSAP with ScrollTrigger, SplitText and DrawSVG; Lenis smooth scroll; Astro View Transitions; three.js for 3D. The only React is one island on /box (Framer Motion allowed there). nanostores for the order. Hosting: Cloudflare Pages.

## Performance rules (non-negotiable)
- Animate only transform and opacity; never layout properties.
- Lazy-init each scene's ScrollTriggers when it nears the viewport; clean them up on page change.
- Cursor and particles only on pointer-fine devices with enough cores; otherwise skip them.
- Respect prefers-reduced-motion with a calm version of every scene.
- Home under 150 KB of JavaScript, not counting the lazily loaded 3D; hero image under 150 KB; all images through Astro's <Image> as AVIF/WebP.
- Hold 60fps on a mid-range Android phone; test at 375px wide.

## Content rules
- All prices, flavours, custom options, delivery and contact details come from src/content/*.ts.
- Until real photos exist, use cream circles with the flavour name as placeholders.
- Content not yet confirmed by Shlok stays as clearly marked TODO placeholders. Never invent ingredients, claims, reviews or numbers.
- Eggless is mentioned once, as a plain FAQ answer, never as a sticker, badge or icon.
- Never show size, weight, allergens, shelf life, FSSAI or Instagram.
