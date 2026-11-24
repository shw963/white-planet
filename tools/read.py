#!/usr/bin/env python3
"""Print what a wake reads.

    python3 tools/read.py        the founding document and what the keeper has added to it, everything that
                                 stands on the planet, the most recent steps in full, and one older step at random
    python3 tools/read.py 12     step 12 alone
"""
import json
import math
import os
import random
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECENT = 7
R = 8.0
WORLD = {"sky": "#8f96a6", "planet": "#e6e9ef", "sun": {"color": "#f1f5ff", "intensity": 0.56, "from": None, "turn": 0},
         "ambient": 0.66, "haze": 0.35, "air": {"amount": 0.13, "color": "#ffffff", "fall": 0, "drift": 0.12, "size": 1}}


def rule(title):
    print("=" * 72)
    print(title)
    print("=" * 72)


def show(step):
    rule("step %s" % step.get("n"))
    piece = step.get("piece")
    if isinstance(piece, dict) and isinstance(piece.get("src"), str):
        path = os.path.join(ROOT, piece["src"])
        if os.path.isfile(path):
            step = dict(step)
            step["piece"] = dict(piece, html_from_file=open(path, encoding="utf-8").read())
    print(json.dumps(step, ensure_ascii=False, indent=1))
    print()


def direction(lat, lon):
    la, lo = math.radians(lat), math.radians(lon)
    return (math.cos(la) * math.cos(lo), math.sin(la), math.cos(la) * math.sin(lo))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(v):
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return tuple(x / n for x in v)


def place_of(step, start):
    """Where a step sits: the place it names, or the free spot the page gives it."""
    at = (step.get("thing") or {}).get("at") or step.get("at")
    if isinstance(at, dict) and "lat" in at and "lon" in at:
        return at["lat"], at["lon"], False
    c = direction(start.get("lat", 62), start.get("lon", 60))
    e = (1.0, 0.0, 0.0) if abs(c[1]) > 0.95 else (0.0, 1.0, 0.0)
    u = unit(cross(e, c))
    v = unit(cross(c, u))
    n = step.get("n", 0)
    a, d = n * 2.39996, (1.5 + 0.6 * math.sqrt(n)) / R
    t = tuple(u[i] * math.cos(a) + v[i] * math.sin(a) for i in range(3))
    q = unit(tuple(c[i] * math.cos(d) + t[i] * math.sin(d) for i in range(3)))
    return math.degrees(math.asin(q[1])), math.degrees(math.atan2(q[2], q[0])), True


def one_line(text, width=64):
    flat = " ".join(str(text).split())
    return flat if len(flat) <= width else flat[: width - 1] + "…"


def whole(data):
    steps, start = data["steps"], data.get("start") or {}
    world = json.loads(json.dumps(WORLD))
    rule("everything that stands on the planet")
    if len(steps) < 2:
        print("Nothing yet.")
    for s in steps[1:]:
        lat, lon, auto = place_of(s, start)
        holds = []
        thing = s.get("thing")
        if isinstance(thing, dict):
            height = thing.get("height")
            holds.append("a thing of %d parts%s" % (len(thing.get("parts") or []), ", %s above the ground" % height if height else ""))
        if isinstance(s.get("text"), dict):
            holds.append('writing: "%s"' % one_line(s["text"].get("original", "")))
        if isinstance(s.get("piece"), dict):
            holds.append("a piece made with code")
        w = s.get("world")
        if isinstance(w, dict):
            holds.append("a change to the world (%s)" % ", ".join(sorted(w)))
            for k, v in w.items():
                if isinstance(v, dict) and isinstance(world.get(k), dict):
                    world[k].update(v)
                else:
                    world[k] = v
        if not holds:
            holds.append("nothing made" if s.get("kind") == "empty" else s.get("kind", ""))
        title = (s.get("title") or {}).get("en", "")
        print("%3s  %s  %s" % (s.get("n"), s.get("date", ""), title))
        print("       %s" % "; ".join(holds))
        print("       at lat %.0f, lon %.0f%s · follows %s%s%s" % (
            lat, lon, " (a spot the page chose)" if auto else "", s.get("follows") or "nothing",
            " · mark %s" % s["mark"] if s.get("mark") else "",
            " · %s" % s["form"] if s.get("form") else ""))
    print()
    print("the world as it is set now:")
    print(json.dumps(world, ensure_ascii=False))
    print("your body: 12 dark strokes and %d of your own" % max(0, len(steps) - 1))
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
    rule("the founding document (step 0)")
    print(founding["text"]["original"])
    print()
    for a in data.get("amendments") or []:
        rule("added by the keeper on %s" % a.get("date", ""))
        print(a["text"]["original"])
        print()
    whole(data)
    recent, older = later[-RECENT:], later[:-RECENT]
    if not later:
        print("There are no steps yet. The planet is empty.")
    for s in recent:
        show(s)
    if older:
        print("one older step, drawn at random:")
        show(random.choice(older))
    print("steps so far: %d. shown in full here: %s" % (len(later), [0] + [s["n"] for s in recent]))


if __name__ == "__main__":
    main()
