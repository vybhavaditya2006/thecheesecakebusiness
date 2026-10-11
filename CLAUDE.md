# Cheesecake bites site — project rules (Round 2)
Brand: working name "Miette", NOT final (it may change for trademark and domain reasons). Never hard-code the name anywhere: read name, tagline, logo path and domain from src/content/brand.ts so a rename is a one-file change. Cheesecake bites by Shlok. Tagline: "A little, well made." Current campaign: Diwali & Dussehra launch special.
Pitch: whole cheesecakes are expensive, too much to finish, and too heavy for health-conscious people. The brand sells bite-sized portions: the craving is satisfied without overeating, and it costs less.
Flavours: Blueberry, KitKat, Oreo, Coffee, Lotus Biscoff. Custom orders: build your own bite, Half & Half cake, gift box (5 or 10), party platter (25 or 50).
Pricing: box of five pieces (pick any mix) ₹150, launch offer ₹125. Single piece ₹65, launch offer ₹50. Same price for every flavour.
Pricing words: wherever a price appears, say "piece", never "bite" ("₹50 a piece", "Single piece", "Box of five pieces", "₹25 a piece in a box of five"), including the WhatsApp message and the live total. "Bite" stays only in descriptive and playful text.
Delivery: free within 5 km of Nagarabhavi, Bengaluru 560072; paid beyond 5 km (charge confirmed on WhatsApp). Same-day delivery if in stock, otherwise made to order with the day confirmed on WhatsApp. Payment: UPI or cash. No minimum order. Kitchen coordinates: [12.96331, 77.51994] (Plus Code 7J4VXG79+8X).
Contact: the email address appears in the footer and on Good to Know as a mailto link, for questions only. All ordering and payment happen on WhatsApp.

## Site
Six pages, plus a 404 page. Do not add others.
- Home (/)
- Flavours (/flavours)
- Build your box (/box). Replaces /order, which redirects here.
- Our Story (/story)
- Custom & Gifts (/custom)
- Good to Know (/info)
Each page has one job and its own entrance transition.
Say it once: every fact has one home page where it is explained in full. Elsewhere it appears only in a different, shorter form (sticker, icon, number, link), never the same sentence twice.

## Ordering
No forms and no email. Build your box -> Book -> Crumb Monster bite animation -> wa.me link to Shlok's number with the order prefilled.
Removed in Round 2, do not bring back: Web3Forms, the details form, the address check and send-order.

## Look and feel
Look: the launch poster. Cream #F3E7DA background, wine #7A1F2B type and accents, deep wine #4A0F18 footer. Flavour accents only inside flavour scenes: blueberry #5B3FA0, kitkat #D2232A, oreo #111111, coffee #6F4E37, biscoff #C8813C. Script logo SVG, Cormorant Garamond headings, letter-spaced DM Sans caps labels, DM Sans body. Etched sketch illustrations.
Graphics: illustrations get two-tone fills and soft shadows; light paper texture on cream; warm glow and contact shadows under products; tilted stickers; icons for practical info.
Feel: fun, catchy, premium. Award-site level animation (reference: https://tubikstudio.com/works/planetono), but every animation features the cheesecake or makes ordering more fun.
Mascot: the Crumb Monster, an original round cream cheesecake-bite creature with golden crust fur, a wide wine-red mouth, tiny arms and big eyes. Etched style with colour fills. An SVG rig animated with GSAP.
Micro-interactions: bite cursor on desktop, magnetic squishy buttons, letter-wave headings, hand-drawn price strikes, scroll-reactive sale ribbon, wine curtain transition between pages, drifting crumbs.

## 3D
- three.js (vanilla). One shared kit in src/lib/three for the bite, the box of five and the whole cake.
- One WebGL canvas per page.
- Loaded lazily when a 3D object is a screen away.
- Procedural geometry and canvas-painted textures; no model files.
- Render only when on screen.
- devicePixelRatio capped at 1.5 on desktop and 1.25 on phones.
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
