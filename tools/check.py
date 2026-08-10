#!/usr/bin/env python3
"""Static pre-deploy checks for the whole site.

Catches the things that have actually broken this project before: dead links,
missing images, filename-case mismatches that only fail on Linux, heading-level
skips, images without alt text or dimensions, and inline styles creeping back
in. Exits non-zero if anything fails, so it can gate a deploy.

    python3 tools/check.py
"""
import glob, os, re, sys
from urllib.parse import unquote, urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# The live domain, which every canonical and og: URL must be absolute against.
# Change this in one place if the domain ever changes.
CANON_BASE = "https://www.shankerdentalcentremadurai.com/"

# Exact-case index of every file. macOS is case-insensitive but the production
# host is not, so `IP-rooms.JPG` referenced as `.jpg` passes locally and 404s
# once deployed. This is why we compare case-sensitively.
FILES = set()
for base, dirs, names in os.walk("."):
    if ".git" in base:
        continue
    for n in names:
        FILES.add(os.path.normpath(os.path.join(base, n)))

problems = []


def fail(page, kind, detail=""):
    problems.append((page, kind, detail))


for path in sorted(glob.glob("*.html")):
    html = open(path, encoding="utf-8").read()
    body = html[html.find("<body"):]

    # --- structure -------------------------------------------------------
    levels = [int(m) for m in re.findall(r"<h([1-6])[\s>]", body)]
    if levels.count(1) != 1:
        fail(path, "h1 count", str(levels.count(1)))
    prev = 0
    for lv in levels:
        if prev and lv > prev + 1:
            fail(path, "heading skip", "h%d -> h%d" % (prev, lv))
        prev = lv

    if 'lang="en"' not in html:
        fail(path, "missing lang")
    if "width=device-width" not in html:
        fail(path, "missing viewport")
    if "user-scalable=no" in html or "maximum-scale" in html:
        fail(path, "zoom disabled")
    if 'aria-current="page"' not in body and path != "sitemap.html":
        fail(path, "no current nav item")

    # --- images ----------------------------------------------------------
    for tag in re.findall(r"<img[^>]*>", body):
        if "alt=" not in tag:
            fail(path, "img without alt", tag[:70])
        # the lightbox <img src=""> is filled in at runtime
        if "width=" not in tag and 'src=""' not in tag:
            fail(path, "img without dimensions", tag[:70])

    # --- house style -----------------------------------------------------
    if 'style="' in body:
        fail(path, "inline style", "use a utility class instead")
    for tag in re.findall(r"<button[^>]*>", body):
        if "type=" not in tag:
            fail(path, "button without type", tag[:60])

    # --- discoverability -------------------------------------------------
    # A canonical pointing at the wrong page is silent: nothing looks broken,
    # the page just stops ranking. Copying a <head> between pages and missing
    # this one line is the easy way to cause it, so the URL is checked against
    # the filename rather than merely being present.
    head = html[: html.find("<body")]
    canons = re.findall(r'<link rel="canonical" href="([^"]*)"', head)
    expected = CANON_BASE if path == "index.html" else CANON_BASE + path
    if len(canons) != 1:
        fail(path, "canonical count", str(len(canons)))
    elif canons[0] != expected:
        fail(path, "wrong canonical", "%s != %s" % (canons[0], expected))

    og = dict(re.findall(r'<meta property="og:([\w:]+)" content="([^"]*)"', head))
    for key in ("title", "description", "url", "image"):
        if key not in og:
            fail(path, "missing og:" + key)
    # Relative og:image and og:url do not resolve — the card renders blank.
    for key in ("url", "image"):
        if key in og and not og[key].startswith("https://"):
            fail(path, "relative og:" + key, og[key])
    if "url" in og and canons and og["url"] != canons[0]:
        fail(path, "og:url != canonical", og["url"])

    # --- references ------------------------------------------------------
    for src in re.findall(r'(?:src|data-lb)="([^"]+)"', html):
        if src.startswith(("http", "data:")) or src == "":
            continue
        if os.path.normpath(unquote(urlparse(src).path)) not in FILES:
            fail(path, "missing asset", src)
    for href in re.findall(r'href="([^"]+)"', html):
        if href.startswith(("http", "mailto:", "tel:", "#")):
            continue
        target = urlparse(href).path
        if target and os.path.normpath(unquote(target)) not in FILES:
            fail(path, "dead link", href)

# --- asset versioning ----------------------------------------------------
# /assets/* is served immutable for a year (see vercel.json), so the CSS and JS
# URLs must carry a version or returning visitors keep stale files forever.
for path in sorted(glob.glob("*.html")):
    html = open(path, encoding="utf-8").read()
    for asset in ("assets/css/style.css", "assets/js/main.js"):
        for m in re.finditer(re.escape(asset) + r'(\?v=[a-f0-9]+)?', html):
            if not m.group(1):
                fail(path, "unversioned asset", asset)
                break

pages = len(glob.glob("*.html"))
if problems:
    print("FAIL — %d problem(s) across %d pages\n" % (len(problems), pages))
    for page, kind, detail in problems:
        print("  %-38s %-24s %s" % (page, kind, detail))
    sys.exit(1)

print("OK — %d pages, %d files indexed, no problems found." % (pages, len(FILES)))
