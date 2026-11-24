#!/usr/bin/env python3
"""Print what a wake reads: the founding document, the most recent steps, and one older step drawn at random.

    python3 tools/read.py        the usual reading
    python3 tools/read.py 12     step 12 alone
"""
import json
import os
import random
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECENT = 7


def show(step):
    print("=" * 72)
    print("step %s" % step.get("n"))
    print("=" * 72)
    piece = step.get("piece")
    if isinstance(piece, dict) and isinstance(piece.get("src"), str):
        path = os.path.join(ROOT, piece["src"])
        if os.path.isfile(path):
            step = dict(step)
            step["piece"] = dict(piece, html_from_file=open(path, encoding="utf-8").read())
    print(json.dumps(step, ensure_ascii=False, indent=1))
    print()


def main():
    data = json.load(open(os.path.join(ROOT, "records.json"), encoding="utf-8"))
    steps = data["steps"]
    if len(sys.argv) > 1:
        want = int(sys.argv[1])
        found = [s for s in steps if s.get("n") == want]
        if not found:
            sys.exit("there is no step %d" % want)
        show(found[0])
        return
    founding, later = steps[0], steps[1:]
    print("=" * 72)
    print("the founding document (step 0)")
    print("=" * 72)
    print(founding["text"]["original"])
    print()
    recent, older = later[-RECENT:], later[:-RECENT]
    if not later:
        print("There are no steps yet. The planet is empty.")
    for s in recent:
        show(s)
    if older:
        print("one older step, drawn at random:")
        show(random.choice(older))
    print("steps so far: %d. numbers shown here: %s" % (len(later), [0] + [s["n"] for s in recent]))


if __name__ == "__main__":
    main()
