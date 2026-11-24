#!/usr/bin/env python3
"""Say whether this wake should go on.

If the last step asked to be woken on a later day, the builder is resting and this wake ends at once.
Prints one line: "awake" or "resting until YYYY-MM-DD".
With --floor it also prints "not yet: N of 7 quiet days" until seven days have passed since the last step.
"""
import datetime
import json
import os
import sys
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    steps = json.load(open(os.path.join(ROOT, "records.json"), encoding="utf-8"))["steps"]
    today = datetime.datetime.now(ZoneInfo("Asia/Seoul")).date().isoformat()
    asked = steps[-1].get("wake_on") if steps else None
    if isinstance(asked, str) and asked > today:
        print("resting until %s" % asked)
        return
    if "--floor" in sys.argv:
        # the weekly floor: go on only when seven days have passed since the last step
        last = steps[-1].get("date") if steps else None
        quiet = (datetime.date.fromisoformat(today) - datetime.date.fromisoformat(last)).days if isinstance(last, str) else 0
        if quiet < 7:
            print("not yet: %d of 7 quiet days" % quiet)
            return
    print("awake")


if __name__ == "__main__":
    main()
