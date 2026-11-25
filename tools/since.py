#!/usr/bin/env python3
"""Print the steps taken yesterday and today (Seoul time), one per line, or nothing.

For the keeper's daily look-in, so that new steps are noticed. A wake does not need it.
"""
import datetime
import json
import os
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    steps = json.load(open(os.path.join(ROOT, "records.json"), encoding="utf-8"))["steps"]
    today = datetime.datetime.now(ZoneInfo("Asia/Seoul")).date()
    since = (today - datetime.timedelta(days=1)).isoformat()
    for s in steps[1:]:
        if isinstance(s.get("date"), str) and s["date"] >= since:
            print("%02d %s (%s)" % (s["n"], (s.get("title") or {}).get("en", ""), s["date"]))


if __name__ == "__main__":
    main()
