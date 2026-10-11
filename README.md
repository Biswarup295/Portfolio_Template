# 3D Parallax Portfolio Template

A single-page portfolio template with layered depth: a parallax hero, a particle field, 3D tilt cards and scroll-driven reveals. It is written in plain HTML, CSS and JavaScript — no frameworks, no build step, no runtime dependencies and no network requests.

Open `index.html` in a browser and it runs. `npm run dev` only exists to serve the same files over HTTP, so you can preview, fork and deploy the template exactly as it ships.

**[View the live demo](https://portfoliotemplate-rho.vercel.app)**

## Features

- Parallax hero with depth layers, a rotating cube, orbit orbs and code chips
- Canvas particle field with fake depth that scales with the viewport
- 3D tilt cards with a radial glare that follows the cursor
- Scroll-driven reveals, animated counters and a scroll progress bar
- Light and dark themes with a toggle that remembers the visitor’s choice
- Accessible by default: skip link, landmarks, labelled form fields, live status messages, visible focus rings, keyboard-operable navigation and a reduced-motion path
- No dependencies, no build step — works from the file system and deploys to any static host

## Preview

The hero ships in three screenshot variants: [desktop, dark](preview/hero-desktop.png), [desktop, light](preview/hero-desktop-light.png) and [mobile](preview/hero-mobile.png).

## Quick start

Clone or download this repository, then either open `index.html` directly or serve it locally. There is nothing to install: `npm run dev` starts `scripts/dev-server.js`, a small static server built on Node’s built-in `http` module, so the project stays dependency-free — no `node_modules`, no lockfile, no build step. Node 18+ is only needed for the dev server; double-clicking `index.html` works without it.

```bash
npm run dev        # http://127.0.0.1:5173
npm run dev:open   # same, and opens your browser
```

Choose a different port when you need one:

```bash
npm run dev -- --port 8080
```

## Make it yours

The repo ships with sample content so the layout makes sense out of the box. Search for the entries below and swap in your own details.

| What to change | Where |
| --- | --- |
| Name, page title, meta description and social meta | `index.html` head, `.brand` and the footer copyright |
| Hero headline, eyebrow and intro copy | `.hero-title`, `.eyebrow` and `.hero-lede` in `#top` |
| Hero stats (`6+`, `48+`, `98`) | `data-count` attributes on the `.count` spans |
| Email address | the `#emailLink` text **and** the `data-copy` attribute on `#copyEmail` |
| Location, availability note and social links | `.portrait-caption`, `.contact-list` and `.socials` |
| Resume button | the “Download resume” link in the About panel |
| About copy and quick facts | `#about` paragraphs and the `.fact-list` |
| Skills and levels | the `.bars` (`style="--level:95%"` on each `.bar > i`) and the `.chips` list |
| Projects | the four `<article class="tilt-card">` blocks in `#work` |
| Experience | the `.timeline` list |
| Colours | the custom properties in `:root` and `[data-theme="light"]` in `assets/css/styles.css` |
| Favicon | `assets/favicon.svg` |

The theme toggle stores the visitor’s choice in `localStorage` under `portfolio-theme` and falls back to the operating system preference.

## Project structure

```
index.html              markup for every section (hero, about, skills, work, experience, contact)
assets/css/styles.css   design tokens, themes, layout, 3D transforms, motion
assets/js/main.js       parallax engine, particle field, tilt, navigation, form handling
assets/favicon.svg      gradient monogram
scripts/dev-server.js   zero-dependency static server behind npm run dev
package.json            dev and start scripts only, no dependencies
preview/                reference screenshots used in this README
```

## How the depth works

Three separate systems, each driven by its own animation-frame loop:

1. **Parallax layers.** Any element with `data-depth="0.25"` receives `--tx`, `--ty`, `--tz`, `--rx` and `--ry` custom properties from `main.js`. CSS applies them with `transform`, so pointer movement and scroll position translate and rotate that element inside the hero’s `perspective` container. Higher numbers move further — the hero uses `0.06` (far glow) up to `0.4` (the rotating cube).
2. **Particle field.** `#scene` is a 2D canvas with fake depth: every star carries a `z` value between `0.18` and `0.82` that scales its size, alpha and drift speed, which produces layered movement without a WebGL dependency. Star count scales with viewport area and the canvas is capped at 2x device pixel ratio.
3. **Tilt and reveal.** `.tilt` / `.tilt-card` elements rotate toward the pointer (or lift on keyboard focus), with a radial glare that follows the cursor. `.reveal` elements animate in once a rAF-throttled scroll sweep finds them, so a fast scroll or an anchor jump can never leave an element stuck invisible.

Everything respects `prefers-reduced-motion: reduce`: parallax, particles, tilt and travel animations switch off, and content renders in place.

## Notes

- **Form.** The contact form validates in the browser, then hands the message to the visitor’s mail client with a prefilled `mailto:` link. There is no backend, which is why the page can be hosted anywhere as static files. To collect submissions instead, point the form at a service such as Formspree or Netlify Forms and replace the `mailto:` handoff in section 10 of `assets/js/main.js`.
- **Accessibility.** Skip link, semantic landmarks, labelled form fields, `aria-live` status messages, visible focus rings, keyboard-operable navigation and a `prefers-reduced-motion` path.
- **Browser support.** Modern evergreen browsers. The `translate` property used for reveal travel needs Chrome 104+, Safari 14.1+ or Firefox 72+.
- **Deployment.** The site is fully static: no build command, no output directory. Push the folder to a repository and enable GitHub Pages, drag it into Netlify, or run `npx vercel` — the live demo is hosted on Vercel with zero configuration.

## License

MIT — see [LICENSE](LICENSE). Use it for personal or commercial portfolios and keep the attribution if you can.