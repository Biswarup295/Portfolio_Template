# Biswarup — 3D Parallax Portfolio

A single-page portfolio with layered depth: parallax hero, particle field, 3D tilt cards and
scroll-driven reveals. Written in plain HTML, CSS and JavaScript — no frameworks, no build step,
no runtime dependencies and no network requests.

Open `index.html` in a browser and it runs; `npm run dev` only exists to serve the same
files over HTTP.

## Quick start

```bash
npm run dev        # http://127.0.0.1:5173
npm run dev:open   # same, and opens your browser
```

There is nothing to install. `npm run dev` starts `scripts/dev-server.js`, a small static
server written against Node's built-in `http` module, so the project stays dependency-free:
no `node_modules`, no lockfile, no build step. Choose a different port when you need one:

```bash
npm run dev -- --port 8080
```

You can also skip tooling entirely and double-click `index.html`. Every feature works straight
from the file system; serving over HTTP is only preferable because a real origin is friendlier
to clipboard permissions.

## Files

```
index.html              markup for every section (hero, about, skills, work, experience, contact)
assets/css/styles.css   design tokens, themes, layout, 3D transforms, motion
assets/js/main.js       parallax engine, particle field, tilt, navigation, form handling
assets/favicon.svg      gradient monogram
scripts/dev-server.js   zero-dependency static server behind npm run dev
package.json            dev and start scripts only, no dependencies
preview/                reference screenshots (desktop, mobile, light and dark)
```

## How the depth works

Three separate systems, all driven by one animation frame loop each:

1. **Parallax layers.** Any element with `data-depth="0.25"` gets `--tx`, `--ty`, `--tz`, `--rx`
   and `--ry` custom properties from `main.js`. The CSS applies them with `transform`, so pointer
   movement and scroll position translate and rotate that element inside the hero's `perspective`
   container. Higher numbers move further. The hero currently uses `0.06` (far glow) up to `0.4`
   (the rotating cube).
2. **Particle field.** `#scene` is a 2D canvas with fake depth: every star carries a `z` value
   between `0.18` and `0.82` that scales its size, alpha and drift speed, which produces the
   layered movement without a WebGL dependency. Star count scales with viewport area and the
   canvas is capped at 2x device pixel ratio.
3. **Tilt and reveal.** `.tilt` / `.tilt-card` elements rotate toward the pointer (or lift on
   keyboard focus), with a radial glare that follows the cursor. `.reveal` elements animate in once
   a single rAF-throttled scroll sweep finds them, so a fast scroll or an anchor jump can never
   leave an element stuck invisible.

Everything respects `prefers-reduced-motion: reduce`: parallax, particles, tilt and travel
animations switch off, and content renders in place.

## Make it yours

Search for these placeholders and swap in your own details.

| What | Where |
| --- | --- |
| Name, page title, meta description | `index.html` head, `.brand`, `.hero-title` |
| Email address | `#emailLink` text **and** the `data-copy` attribute on `#copyEmail` |
| Social links | `.socials` in the contact section |
| Resume button | the `Download resume` link in the `About` panel |
| Projects | the four `<article class="tilt-card">` blocks; each arrow currently points at `#work` |
| Experience | the `.timeline` list |
| Numbers in the hero | `data-count` attributes on `.count` spans |
| Skill levels | `style="--level:95%"` on each `.bar > i` |
| Colours | the custom properties in `:root` and `[data-theme="light"]` |

The theme toggle stores the visitor's choice in `localStorage` under `portfolio-theme` and falls
back to the operating system preference.

## Notes

- **Form.** The contact form validates in the browser, then hands the message to the visitor's mail
  client with a prefilled `mailto:` link. There is no backend, which is why the page can be hosted
  anywhere as static files. To collect submissions instead, point the form at a service such as
  Formspree or Netlify Forms and drop the `mailto:` handoff in section 10 of `main.js`.
- **Accessibility.** Skip link, semantic landmarks, labelled form fields, `aria-live` status
  messages, visible focus rings, keyboard-operable navigation, and a `prefers-reduced-motion` path.
- **Browser support.** Modern evergreen browsers. The `translate` property used for reveal travel
  needs Chrome 104+, Safari 14.1+ or Firefox 72+.
- **Deployment.** Drag the folder into Netlify, or push it to a repository and enable GitHub Pages.
  No build command and no output directory are required.

## Verified behaviour

Checked in headless Chrome via the DevTools protocol at 1440x900 and 390x844 (touch emulation):

- no horizontal overflow at either width, and 38/38 reveal elements animate in after a jump-scroll
  straight to the footer
- hero parallax layer, glow, headline and portrait all receive pointer-driven transforms
- counters reach `6`, `48`, `98`; all six skill bars fill
- project card tilt applies a real rotation matrix and resets on pointer leave (pointer devices only)
- theme toggle switches palettes and persists; mobile navigation opens, locks scroll and closes on
  `Escape`
- form validation reports every empty field, clears errors on input, and blocks submission until valid
