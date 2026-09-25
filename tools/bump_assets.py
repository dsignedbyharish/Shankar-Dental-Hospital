#!/usr/bin/env python3
"""Stamp every local CSS/JS reference with a hash of that file's contents.

/assets/* is served `immutable` for a year (vercel.json), so a changed file
must change its URL or returning visitors keep the old one forever. Each
file gets its own hash, so editing one stylesheet does not bust the cache
for every script on the site.

    python3 tools/bump_assets.py          rewrite ?v= in every page
    python3 tools/bump_assets.py --check  exit 1 if any ?v= is missing or stale

Run it after editing anything under assets/css or assets/js. check.py runs
the --check half of this on every validation.
"""
import glob, hashlib, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

PAGES = sorted(glob.glob("*.html") + glob.glob("admin/*.html"))
REF = re.compile(r'((?:\.\./)?assets/(?:css|js)/[\w.-]+\.(?:css|js))(\?v=[0-9a-f]*)?(?=")')

_cache = {}


def digest(ref):
    path = os.path.normpath(os.path.join(ROOT, ref.replace("../", "")))
    if path not in _cache:
        with open(path, "rb") as f:
            _cache[path] = hashlib.sha256(f.read()).hexdigest()[:8]
    return _cache[path]


def stamp(html):
    return REF.sub(lambda m: "%s?v=%s" % (m.group(1), digest(m.group(1))), html)


def main():
    check = "--check" in sys.argv
    stale = []
    for page in PAGES:
        html = open(page, encoding="utf-8").read()
        new = stamp(html)
        if new != html:
            stale.append(page)
            if not check:
                open(page, "w", encoding="utf-8").write(new)
    if check:
        if stale:
            print("Stale or missing asset versions in: " + ", ".join(stale))
            print("Run: python3 tools/bump_assets.py")
            return 1
        print("Asset versions are current.")
        return 0
    print("Updated %d page(s)." % len(stale) if stale else "Already current.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
