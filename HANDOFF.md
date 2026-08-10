# Developer handoff — Shanker Dental & Craniofacial Centre

Everything a new developer (or a new AI session) needs to pick this up cold.
Read `README.md` first for the design system and file layout; this document
covers state, decisions and traps.

---

## 1. What this is

A rebuild of the practice's website, consolidating their two existing sites —
[dentalmadurai.com](https://dentalmadurai.com/) and
[shankerdentalcentremadurai.com](https://www.shankerdentalcentremadurai.com/),
which were mirrors of each other — into one modern static site.

**All copy and imagery is the client's own, taken from those two sites.**
Nothing was invented. Where a caption describes a clinical outcome, it came
from the original page.

## 2. Current state

| | |
|---|---|
| Repo | `dsignedbyharish/Shankar-Dental-Hospital` |
| Live (preview host) | https://shankar-dental-hospital.vercel.app |
| `main` | deployed, stable — everything described here is on it |
| Open branches | none — `redesign-sections` is merged and deleted |
| Pages | 16 |
| Assets | ~152 images + 44 gallery thumbnails, ~38 MB |

`main` is what is live, and it carries the editorial redesign — borderless
layout, serif display type, parallax, before/after sliders, Dr Shanker in the
hero. [PR #1](https://github.com/dsignedbyharish/Shankar-Dental-Hospital/pull/1)
merged it on 2 August 2026.

> **A trap this document itself fell into.** The handoff docs and `tools/` were
> committed to `redesign-sections` on 10 August — eight days *after* PR #1 had
> already been merged. Pushing to the branch of a merged PR does not reopen it
> and does not carry the commits to `main`, so the tooling and this file sat off
> `main` until a follow-up merge landed them. Before pushing to a branch, check
> that its PR is still open.

## 3. Running it

No build step, no dependencies, no package manager. It is plain HTML/CSS/JS.

```bash
python3 -m http.server 8787      # then open http://localhost:8787
python3 tools/check.py           # pre-deploy validation — run before every push
```

Deploy is automatic: any push to `main` triggers a Vercel build. There is
nothing to compile.

## 4. Architecture, and the one sharp edge

Every page is standalone HTML. That keeps it simple, but it means the shared
chrome — top bar, header, nav, footer, back-to-top, lightbox — is **physically
duplicated in all 16 files**.

Do not hand-edit the nav 16 times. Edit it in `index.html` and run:

```bash
python3 tools/sync_chrome.py           # push chrome from index.html to the rest
python3 tools/sync_chrome.py --check   # report drift without writing
```

It preserves each page's own `<head>`, `<main>` and body classes, and re-applies
`aria-current="page"` per page from the map at the top of the script. If you add
a page, add it to `NAV_CURRENT` there.

> **Note:** these pages were originally produced by a set of Python generator
> scripts that lived in a session scratchpad, which has since been deleted. The
> generated HTML is complete and committed, so nothing is lost from the site
> itself — but the generator is gone. `tools/sync_chrome.py` replaces the part
> that actually mattered day to day. If you ever want full generation back,
> rebuild it from the committed HTML rather than from memory.

## 5. Decisions worth not undoing

These look like things to "clean up" but each is deliberate.

**The consent gate shows content when JavaScript is off.**
Treatment pages and the case archive gate surgical photography behind the 18+
disclaimer the original site used. That gate engages *only* when scripts run
(`html.js body.needs-consent`). Without JS the content is shown rather than
locked behind a button that could never be clicked — hiding it would also hide
it from crawlers.

**Homepage specialty cards use icons, not clinical photos.**
An earlier pass used surgical thumbnails there. The original site deliberately
gated exactly those images; putting them on the landing page contradicts that.
Photos stay behind the gate.

**Asset URLs carry a content hash** (`style.css?v=7a9ec922`).
`vercel.json` serves `/assets/*` with `Cache-Control: immutable, max-age=1yr`.
Without the hash, returning visitors keep stale CSS/JS after a deploy — a
half-broken site they cannot fix without a hard refresh. `tools/check.py`
fails the build if a version is missing. If you edit CSS or JS, bump the hash
in all 16 files (search-and-replace the old `?v=` value).

**Filename case matters.**
`assets/images/IP-rooms.JPG` is uppercase. macOS is case-insensitive so a wrong
reference passes locally and 404s in production. `tools/check.py` compares
case-sensitively for this reason.

**Before/after sliders are on 6 pairs only.**
Orthognathic ×3, TMJ ×2, orthodontics ×1. Every candidate pair was checked:
these six share framing and dimensions, so the wipe compares like with like.
Other "pre/post" images only share a caption — wiping between two different
views compares nothing, so they were left as separate figures. Verify framing
before adding more.

**Old URLs are 301-redirected** in `vercel.json` (`staff_details.html` →
`doctors.html`, and 15 others). The previous site's pages are indexed; do not
remove these.

**`--ink-4` is not a text colour.** It is 2.96:1 on white. It is for borders and
disabled states only. Use `--ink-3` for secondary text (4.6:1).

**`.wrap` + `padding` shorthand is a trap.** `.page-head-inner` and
`.footer-top` sit on the *same element* as `.wrap`. A `padding: X 0 Y`
shorthand there wipes out `.wrap`'s `padding-inline` and the content goes flush
to the viewport edge. Use `padding-block`. This bug shipped unnoticed for three
commits.

## 6. Known constraints

**Image resolution is the ceiling on visual quality.** These are the largest
sources that exist:

| Asset | Native size | Used for |
|---|---|---|
| `staffimg1.jpg` (Dr Shanker) | **238 × 203** | hero portrait, doctors page |
| `staffimg2.jpg` (Dr Aijitha) | 237 × 206 | doctors page |
| `Shankar-Hospital.jpg` | 335 × 496 | hero background |

The hero portrait is framed at 268px rather than upscaled, and the hero
backdrop carries a deliberate blur so the upscale reads as depth of field.
**Ask the client for professional photography** — it is the single highest-value
improvement available and no amount of CSS substitutes for it.

**Originals were downscaled.** Images over 1600px were resized in place before
the first commit, so git history holds the reduced versions only. The true
originals still exist on the two live source sites if ever needed.

**`sitemap.xml`, `robots.txt` and the homepage `canonical` all point at
`https://www.shankerdentalcentremadurai.com/`** — correct once the domain is
pointed at Vercel, wrong until then. Do not submit the `.vercel.app` URL to
Search Console while the canonical says otherwise.

**The repo is public** and contains clinical patient photographs. They are
already published on the client's live sites, so nothing new is exposed, but a
public repo makes them bulk-downloadable in a way the gated site does not.
Worth a conversation with the client.

## 7. Access you will need

Nothing in this repo is tied to any particular Claude account — it is ordinary
files, git and a Vercel project. To continue you need:

- **GitHub** — push access to `dsignedbyharish/Shankar-Dental-Hospital`
- **Vercel** — the account the project is linked to, for deploys and the domain
- **Domain registrar** — only when pointing the live domain at Vercel

> **Recurring gotcha on this machine.** Git authenticates to GitHub through the
> macOS keychain (`credential.helper = osxkeychain`). Something — an automated
> tool session — periodically writes per-host helpers into `~/.gitconfig`
> pointing at a `gh` binary inside a temporary directory that later gets
> deleted:
>
> ```
> credential.https://github.com.helper = !/private/tmp/.../gh_2.96.0_macOS_arm64/bin/gh auth git-credential
> ```
>
> These shadow `osxkeychain`, so **every** GitHub push from **any** repo on this
> machine fails with `could not read Username`. It has come back at least twice.
> When it does:
>
> ```bash
> git config --show-origin --get-regexp '^credential'
> git config --global --unset-all "credential.https://github.com.helper"
> git config --global --unset-all "credential.https://gist.github.com.helper"
> ```

## 8. Suggested next steps

1. Add `canonical` and Open Graph tags to the other 15 pages. Only
   `index.html` carries them, while `robots.txt` allows the whole site and the
   client's two old sites are still live with the same source copy — three
   hosts, near-duplicate content, and only the homepage pointing anywhere.
2. Point the real domain at Vercel; the SEO metadata already assumes it.
3. Request professional photography of both consultants and the premises.
4. Decide whether the repo should be private.
5. Consider WebP/AVIF versions of the gallery images — currently JPEG only.
