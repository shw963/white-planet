#!/usr/bin/env python3
"""Check a newly written step before it is published.

Compares records.json with the last published version: nothing earlier may have changed, exactly one
entry may have been added at the end, the entry must be well formed, and the week's budget must hold.
Ends with "ok" when the step can be committed.
"""
import datetime
import json
import os
import re
import subprocess
import sys
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEEK_BUDGET = 15
PIECE_LIMIT = 300000
HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
SRC = re.compile(r"^pieces/[A-Za-z0-9._-]+\.html$")
SHAPES = {"box", "sphere", "cylinder", "cone", "torus", "disc"}
problems = []


def bad(msg):
    problems.append(msg)


def git(*args):
    return subprocess.run(["git", "-C", ROOT] + list(args), capture_output=True, text=True, check=True).stdout


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def nums(v, lo, hi):
    return isinstance(v, list) and lo <= len(v) <= hi and all(is_num(x) for x in v)


def check_text(t):
    if not isinstance(t, dict):
        return bad("text must be an object")
    for k in ("lang", "original", "en", "ko"):
        if not isinstance(t.get(k), str) or not t[k].strip():
            bad("text.%s is missing" % k)


def check_place(at, where):
    if not (isinstance(at, dict) and is_num(at.get("lat")) and is_num(at.get("lon")) and -90 <= at["lat"] <= 90):
        bad("%s must be {lat, lon} in degrees" % where)


def check_thing(th):
    if not isinstance(th, dict):
        return bad("thing must be an object")
    if "at" in th:
        check_place(th["at"], "thing.at")
    if "height" in th and not (is_num(th["height"]) and 0 <= th["height"] <= 60):
        bad("thing.height must be a number from 0 to 60")
    parts = th.get("parts")
    if not isinstance(parts, list) or not 1 <= len(parts) <= 60:
        return bad("thing.parts must hold 1 to 60 parts")
    for i, p in enumerate(parts):
        if not isinstance(p, dict) or p.get("shape") not in SHAPES:
            bad("part %d: shape must be one of %s" % (i, sorted(SHAPES)))
            continue
        if not nums(p.get("size"), 1, 3):
            bad("part %d: size must be a list of numbers" % i)
        for k in ("pos", "rot", "scale"):
            if k in p and not nums(p[k], 3, 3):
                bad("part %d: %s must be [x, y, z]" % (i, k))
        if "color" in p and not (isinstance(p["color"], str) and HEX.match(p["color"])):
            bad("part %d: color must be #rrggbb" % i)


def check_world(w):
    if not isinstance(w, dict):
        return bad("world must be an object")
    for k in ("sky", "planet"):
        if k in w and not (isinstance(w[k], str) and HEX.match(w[k])):
            bad("world.%s must be #rrggbb" % k)
    sun = w.get("sun")
    if sun is not None:
        if not isinstance(sun, dict):
            bad("world.sun must be an object")
        else:
            if "color" in sun and not (isinstance(sun["color"], str) and HEX.match(sun["color"])):
                bad("world.sun.color must be #rrggbb")
            if sun.get("from") is not None:
                check_place(sun["from"], "world.sun.from")
            if "turn" in sun and not (is_num(sun["turn"]) and (sun["turn"] == 0 or 0.05 <= sun["turn"] <= 720)):
                bad("world.sun.turn must be 0, or hours from 0.05 to 720")
    if "haze" in w and not (is_num(w["haze"]) and 0 <= w["haze"] <= 1):
        bad("world.haze must be a number from 0 to 1")
    air = w.get("air")
    if air is not None:
        if not isinstance(air, dict):
            bad("world.air must be an object")
        else:
            for k, lo, hi in (("amount", 0, 1), ("fall", -1, 1), ("drift", 0, 1), ("size", 0.5, 3)):
                if k in air and not (is_num(air[k]) and lo <= air[k] <= hi):
                    bad("world.air.%s must be a number from %s to %s" % (k, lo, hi))
            if "color" in air and not (isinstance(air["color"], str) and HEX.match(air["color"])):
                bad("world.air.color must be #rrggbb")


def check_piece(p):
    if not isinstance(p, dict):
        return bad("piece must be an object")
    if isinstance(p.get("html"), str):
        if len(p["html"]) > PIECE_LIMIT:
            bad("piece.html is longer than %d characters; save it under pieces/ and name it with src" % PIECE_LIMIT)
    elif isinstance(p.get("src"), str):
        if not SRC.match(p["src"]):
            bad("piece.src must look like pieces/12.html")
        else:
            path = os.path.join(ROOT, p["src"])
            if not os.path.isfile(path):
                bad("%s does not exist" % p["src"])
            elif os.path.getsize(path) > PIECE_LIMIT:
                bad("%s is larger than %d bytes" % (p["src"], PIECE_LIMIT))
    else:
        bad("piece needs html or src")


def main():
    try:
        new = json.load(open(os.path.join(ROOT, "records.json"), encoding="utf-8"))
    except ValueError as e:
        sys.exit("records.json is not valid JSON: %s" % e)
    old = json.loads(git("show", "HEAD:records.json"))

    if {k: v for k, v in new.items() if k != "steps"} != {k: v for k, v in old.items() if k != "steps"}:
        bad("something outside the steps list changed")
    olds, news = old["steps"], new.get("steps")
    if not isinstance(news, list):
        sys.exit("records.json has no steps list")
    if news[:len(olds)] != olds:
        bad("an earlier step was changed or removed; earlier steps must stay exactly as they are")
    added = news[len(olds):]
    if len(added) != 1:
        bad("exactly one new step must be added before a check; found %d" % len(added))

    today = datetime.datetime.now(ZoneInfo("Asia/Seoul")).date()
    for s in added:
        if not isinstance(s, dict):
            bad("a step must be an object")
            continue
        n = s.get("n")
        if n != olds[-1]["n"] + 1:
            bad("n must be %d" % (olds[-1]["n"] + 1))
        if s.get("kind") not in ("step", "empty", "door"):
            bad('kind must be "step", "empty" or "door"')
        if s.get("date") != today.isoformat():
            bad("date must be today in Seoul: %s" % today.isoformat())
        if not isinstance(s.get("model"), str) or not s["model"].strip():
            bad("model is missing")
        title = s.get("title")
        if not (isinstance(title, dict) and all(isinstance(title.get(k), str) and title[k].strip() for k in ("en", "ko"))):
            bad("title needs en and ko")
        known = {o["n"] for o in olds}
        for k in ("follows", "read"):
            v = s.get(k)
            if not isinstance(v, list) or not all(isinstance(x, int) and not isinstance(x, bool) and x in known for x in v):
                bad("%s must be a list of earlier step numbers" % k)
        if "outside" not in s or not (s["outside"] is None or isinstance(s["outside"], str)):
            bad("outside must be one sentence or null")
        if "form" in s and not isinstance(s["form"], str):
            bad("form must be a few words")
        if "at" in s:
            check_place(s["at"], "at")
        if "mark" in s and not (isinstance(s["mark"], str) and HEX.match(s["mark"])):
            bad("mark must be #rrggbb")
        if "text" in s:
            check_text(s["text"])
        if "thing" in s:
            check_thing(s["thing"])
        if "world" in s:
            check_world(s["world"])
        if "piece" in s:
            check_piece(s["piece"])
        if "wake_on" in s:
            w = s["wake_on"]
            last = (today + datetime.timedelta(days=14)).isoformat()
            if not (isinstance(w, str) and re.match(r"^\d{4}-\d{2}-\d{2}$", w) and today.isoformat() < w <= last):
                bad("wake_on must be a day from tomorrow to %s, written YYYY-MM-DD" % last)
        if s.get("kind") == "door" and "text" not in s:
            bad("a door step says what it wants in text")

    monday = today - datetime.timedelta(days=today.weekday())
    week = [s for s in news[1:] if isinstance(s, dict) and isinstance(s.get("date"), str)
            and monday.isoformat() <= s["date"] <= (monday + datetime.timedelta(days=6)).isoformat()]
    if len(week) > WEEK_BUDGET:
        bad("this week's budget of %d steps is already spent; this step cannot be added" % WEEK_BUDGET)

    for line in git("status", "--porcelain").splitlines():
        path = line[3:].strip().strip('"')
        if path != "records.json" and not path.startswith("pieces/"):
            bad("a wake may only change records.json and pieces/; this also changed: %s" % path)

    if problems:
        print("not ready:")
        for p in problems:
            print(" - " + p)
        sys.exit(1)
    print("step %d · %d of %d steps this week" % (added[0]["n"], len(week), WEEK_BUDGET))
    print("ok")


if __name__ == "__main__":
    main()
