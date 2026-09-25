#!/usr/bin/env python3
"""Report gaps between the pages and the Tamil dictionary.

    python3 tools/i18n_audit.py            summary + missing keys
    python3 tools/i18n_audit.py --unused   also list dictionary entries no page uses

Every <span data-i18n>English</span> is looked up in assets/js/i18n-data.js by
its whitespace-normalised English text. Change a sentence in the HTML and its
Tamil silently stops showing (the English stays), which is what "missing"
catches. Generated case-archive text carries its own data-ta and is skipped.
Also flags Latin letters glued to Tamil letters (a typo class that has
happened: "pல்").
"""
import glob, html, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)


def load_dict():
    out = subprocess.check_output([
        "node", "-e",
        'global.window={};require("./assets/js/i18n-data.js");'
        "process.stdout.write(JSON.stringify(window.SDCC_I18N))",
    ])
    return json.loads(out)


def used_keys():
    used = {}
    # Scripts count too: labels main.js builds (the page index) carry
    # data-i18n and are translated like any other.
    for page in sorted(glob.glob("*.html")) + ["assets/js/main.js"]:
        text = open(page, encoding="utf-8").read()
        for m in re.finditer(r"<span data-i18n>(.*?)</span>", text, re.S):
            key = re.sub(r"\s+", " ", html.unescape(m.group(1))).strip()
            used.setdefault(key, set()).add(page)
    return used


def main():
    d = load_dict()
    used = used_keys()
    missing = sorted(k for k in used if k not in d)
    unused = sorted(k for k in d if k not in used)
    glued = sorted(k for k, v in d.items() if re.search(r"[A-Za-z][஀-௿]|[஀-௿][A-Za-z]", v))
    print("dictionary: %d entries, pages use %d keys" % (len(d), len(used)))
    print("missing (English shows in Tamil mode): %d" % len(missing))
    for k in missing:
        print("   %-70s %s" % (k[:70], ", ".join(sorted(used[k]))[:40]))
    if glued:
        print("latin letter glued to Tamil: %d" % len(glued))
        for k in glued:
            print("   " + k[:70])
    if "--unused" in sys.argv:
        print("unused: %d" % len(unused))
        for k in unused:
            print("   " + k[:90])
    else:
        print("unused: %d (pass --unused to list)" % len(unused))


if __name__ == "__main__":
    main()
