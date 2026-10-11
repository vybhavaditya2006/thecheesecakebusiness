# Cheesecake bites site — project rules
Brand: working name "Miette", NOT final (it may change for trademark and domain reasons). Never hard-code the name anywhere: read name, tagline, logo path and domain from src/content/brand.ts so a rename is a one-file change. Cheesecake bites by Shlok. Tagline: "A little, well made." Current campaign: Diwali & Dussehra launch special.
Pitch: whole cheesecakes are expensive, too much to finish, and too heavy for health-conscious people. The brand sells bite-sized portions: the craving is satisfied without overeating, and it costs less.
Flavours: Blueberry, KitKat, Oreo, Coffee, Lotus Biscoff. Custom orders: build your own bite, Half & Half cake, gift box (5 or 10), party platter (25 or 50).
Pricing: box of 5 (pick any mix) ₹150, launch offer ₹125. Single bite ₹65, launch offer ₹50. Same price for every flavour.
Delivery: free within 5 km of Nagarabhavi, Bengaluru 560072; paid beyond 5 km (charge confirmed on WhatsApp). Payment: UPI or cash on delivery. No minimum order. Kitchen coordinates: [12.96331, 77.51994] (Plus Code 7J4VXG79+8X).
Site: two pages only. Home (/) and Order (/order). Do not add pages.
Look: the launch poster. Cream #F3E7DA background, wine #7A1F2B type and accents, deep wine #4A0F18 footer. Flavour accents only inside flavour scenes: blueberry #5B3FA0, kitkat #D2232A, oreo #111111, coffee #6F4E37, biscoff #C8813C. Script logo SVG, Cormorant Garamond headings, letter-spaced DM Sans caps labels, DM Sans body. Etched sketch illustrations.
Feel: fun, catchy, premium. Award-site level animation (reference: https://tubikstudio.com/works/planetono), but every animation features the cheesecake or makes ordering more fun.
Five scenes: (1) hero box drop, (2) Why bites slice, (3) flavour worlds, (4) story timeline with self-drawing sketches, (5) pack-your-box on /order. Plus micro-interactions: bite cursor on desktop, magnetic squishy buttons, letter-wave headings, hand-drawn price strikes, scroll-reactive sale ribbon, wine curtain transition between pages, drifting crumbs.
Stack: Astro (static output) + TypeScript + Tailwind. GSAP with ScrollTrigger, SplitText and DrawSVG; Lenis smooth scroll; Astro View Transitions. The only React is one island on /order (Framer Motion allowed there). nanostores for the order. Web3Forms for order emails. Hosting: Cloudflare Pages.
Performance rules (non-negotiable):
- Animate only transform and opacity; never layout properties.
- Lazy-init each scene's ScrollTriggers when it nears the viewport; clean them up on page change.
- Cursor and particles only on pointer-fine devices with enough cores; otherwise skip them.
- Respect prefers-reduced-motion with a calm version of every scene.
- Home under 150 KB of JavaScript, hero image under 150 KB, all images through Astro's <Image> as AVIF/WebP.
- Hold 60fps on a mid-range Android phone; test at 375px wide.
Other rules:
- All prices, flavours, custom options, delivery and contact details come from src/content/*.ts.
- Until real photos exist, use cream circles with the flavour name as placeholders.
