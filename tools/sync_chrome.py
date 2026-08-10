#!/usr/bin/env python3
"""Propagate the shared page chrome (top bar + header/nav, and footer +
back-to-top + lightbox) from one source page to every other page.

The site is plain static HTML with no build step, so this chrome is physically
duplicated in all 16 pages. Edit it once in the source page, run this, and the
rest follow. Everything else — <head>, <main>, body classes — is left alone.

    python3 tools/sync_chrome.py            # sync from index.html
    python3 tools/sync_chrome.py --check    # report drift, change nothing
    python3 tools/sync_chrome.py --source doctors.html
"""
import argparse, glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (start marker, end marker, inclusive-of-end) for each shared region.
REGIONS = [
    ('<div class="topbar">', '</header>', True),
    ('<footer class="site-footer">', '<script src="assets/js/main.js', False),
]

# Which nav item should be marked current on each page.
NAV_CURRENT = {
    "index.html": "index.html",
    "doctors.html": "doctors.html",
    "facilities.html": "facilities.html",
    "treatments.html": "treatments.html",
    "case-of-the-month.html": "case-of-the-month.html",
    "contact.html": "contact.html",
    "sitemap.html": None,
}
# Every treatment detail page now has its own link inside the "Treatment
# Options" dropdown, so each maps to itself — that highlights the specific
# item in the panel, and the .nav-more:has() rule in CSS lights up the
# toggle button as the current section from that alone.
TREATMENT_PAGES = [
    "maxillofacial-surgery.html", "craniofacial-surgery.html",
    "orthognathic-surgery.html", "facial-trauma-surgery.html",
    "cleft-lip-and-palate-surgery.html", "tmj-surgery.html",
    "oral-and-maxillofacial-pathology.html", "orthodontics.html",
    "dental-and-facial-implants.html",
]
for _p in TREATMENT_PAGES:
    NAV_CURRENT[_p] = _p


def slice_region(html, start, end, include_end):
    i = html.find(start)
    if i == -1:
        return None
    j = html.find(end, i)
    if j == -1:
        return None
    return (i, j + len(end) if include_end else j)


def set_nav_current(chrome, target):
    """Rewrite aria-current inside the primary nav for this page."""
    def strip(m):
        return m.group(0).replace(' aria-current="page"', '')

    nav_m = re.search(r'<nav class="nav"[^>]*>.*?</nav>', chrome, re.S)
    if not nav_m:
        return chrome
    nav = re.sub(r'<a\s[^>]*>', strip, nav_m.group(0))
    if target:
        nav = re.sub(
            r'(<a href="%s")' % re.escape(target),
            r'\1 aria-current="page"', nav, count=1)
    return chrome[:nav_m.start()] + nav + chrome[nav_m.end():]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default="index.html")
    ap.add_argument("--check", action="store_true",
                    help="report pages that differ; write nothing")
    args = ap.parse_args()

    src_path = os.path.join(ROOT, args.source)
    src = open(src_path, encoding="utf-8").read()

    blocks = []
    for start, end, inc in REGIONS:
        span = slice_region(src, start, end, inc)
        if not span:
            sys.exit("source %s is missing region %r" % (args.source, start))
        blocks.append(src[span[0]:span[1]])

    changed, checked = [], 0
    for path in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        name = os.path.basename(path)
        if name == args.source:
            continue
        html = open(path, encoding="utf-8").read()
        original = html
        ok = True
        for (start, end, inc), block in zip(REGIONS, blocks):
            span = slice_region(html, start, end, inc)
            if not span:
                print("  skip %s — region %r not found" % (name, start))
                ok = False
                break
            new = set_nav_current(block, NAV_CURRENT.get(name)) \
                if start.startswith('<div class="topbar"') else block
            html = html[:span[0]] + new + html[span[1]:]
        if not ok:
            continue
        checked += 1
        if html != original:
            changed.append(name)
            if not args.check:
                open(path, "w", encoding="utf-8").write(html)

    verb = "differ from" if args.check else "synced from"
    print("%d/%d pages %s %s" % (len(changed), checked, verb, args.source))
    for c in changed:
        print("   ", c)
    if args.check and changed:
        sys.exit(1)


if __name__ == "__main__":
    main()
