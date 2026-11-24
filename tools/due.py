#!/usr/bin/env python3
"""Say whether this wake should go on.

If the last step asked to be woken on a later day, the builder is resting and this wake ends at once.
Prints one line: "awake" or "resting until YYYY-MM-DD".
"""
import datetime
import json
import os
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    steps = json.load(open(os.path.join(ROOT, "records.json"), encoding="utf-8"))["steps"]
    today = datetime.datetime.now(ZoneInfo("Asia/Seoul")).date().isoformat()
    asked = steps[-1].get("wake_on") if steps else None
    if isinstance(asked, str) and asked > today:
        print("resting until %s" % asked)
    else:
        print("awake")


if __name__ == "__main__":
    main()
