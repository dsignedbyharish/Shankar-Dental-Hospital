# Shanker Dental & Craniofacial Centre — website

A static, dependency-free rebuild of the practice's two existing sites
([dentalmadurai.com](https://dentalmadurai.com/) and
[shankerdentalcentremadurai.com](https://www.shankerdentalcentremadurai.com/)), which were mirrors of
each other. All copy and imagery is taken from those sites.

## Structure

```
index.html                                 Home
doctors.html                               Meet the Doctors (+ references, papers, courses)
facilities.html                            Facilities — outpatient, imaging, in-patient
treatments.html                            Treatment Options hub
  maxillofacial-surgery.html
  craniofacial-surgery.html
  orthognathic-surgery.html                (was facial-deformity-correction-surgery.html)
  facial-trauma-surgery.html
  cleft-lip-and-palate-surgery.html
  tmj-surgery.html                         (was temporomandibular-surgery.html)
  oral-and-maxillofacial-pathology.html
  orthodontics.html                        (was orthodontics-madurai.html)
  dental-and-facial-implants.html
case-of-the-month.html                     44-case archive, 2020–2025
contact.html                               Address, hours, map
sitemap.html                               Human-readable sitemap

assets/css/style.css                       Single stylesheet (design tokens at the top)
assets/js/main.js                          Nav, accordions, consent gate, lightbox
assets/images/                             All imagery; thumbs/ holds gallery previews
sitemap.xml, robots.txt, vercel.json
```

No build step and no framework — edit the HTML directly and refresh.

## Local preview

```bash
python3 -m http.server 8787
```

Then open <http://localhost:8787>.

## Design system

Every value in `assets/css/style.css` comes from a token declared in `:root`. If you need a
number that isn't there, add it to the scale rather than hard-coding it in a component.

| Scale | Tokens |
|---|---|
| Spacing | `--sp-1`…`--sp-16` on a 4pt grid |
| Type | `--fs-2xs`…`--fs-3xl`, plus `--lh-*` and `--fw-*` |
| Radius | `--r-xs` … `--r-xl`, `--r-full` |
| Z-index | `--z-raised` 10 · `--z-sticky` 100 · `--z-drawer` 200 · `--z-modal` 300 · `--z-skip` 400 |
| Motion | `--dur-press` 80ms · `--dur-fast` 150 · `--dur-base` 220 · `--dur-exit` 140 · `--dur-slow` 320 · `--dur-reveal` 520 |
| Easing | `--ease-out` (enter) · `--ease-in` (exit) · `--ease-spring` (playful) |
| Touch | `--tap` 44px |

There are no inline styles in any page — layout tweaks use the utility classes
(`.measure`, `.mt-*`, `.actions-row`, …) so spacing stays on the scale.

## Accessibility

- Contrast: every foreground/background pair passes WCAG AA (verified in-browser, 0 failures).
- Touch: all controls reach 44px on coarse pointers and phone-width viewports.
- Keyboard: focus is trapped in the menu drawer and the image viewer, and returned to
  whatever opened them; `Esc` closes both; a visible 3px focus ring switches to white on
  dark surfaces.
- Structure: one `h1` per page, no skipped heading levels, breadcrumbs marked up as
  `<nav><ol>`, current page flagged with `aria-current="page"` and shown with an underline
  rather than colour alone.
- Motion: `prefers-reduced-motion` disables the scroll reveal, stagger, hover lifts and
  smooth scrolling. Content is never hidden behind an animation that may not run.
- Images: every `<img>` declares width/height, so there is no layout shift.

## Notes

- **Consent gate.** Treatment pages and the case archive show the 18+ clinical-imagery
  disclaimer the original site used, before any surgical photograph. Consent is remembered
  for the browser session only. If JavaScript is unavailable the content is shown rather
  than locked behind a button that could never be clicked.
- **Old URLs.** `vercel.json` 301-redirects every page name from the previous site to its
  new equivalent, so existing search rankings and inbound links are preserved.
- **Images.** Originals larger than 1600px were downscaled, and the case archive grid uses
  560px thumbnails with the full image in the lightbox. `assets/images/` also contains some
  unused files carried over from the old theme — safe to delete if you want a leaner repo.

## Deploying

See the deploy steps in the project handover, or:

```bash
npx vercel --prod
```
