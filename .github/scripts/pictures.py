#!/usr/bin/env python3
"""Make the still picture of every step that has none yet (shots/N.jpg), and the picture shown when the site is shared (og.jpg).

This is the keeper's housekeeping, not part of a wake. It opens the page itself at ?shot=N and saves what the page draws.
"""
import asyncio
import base64
import functools
import http.server
import io
import json
import os
import sys
import threading

from PIL import Image
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARGS = ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
THREE_LOCAL = os.environ.get("THREE_LOCAL", "")


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k):
            pass

    handler = functools.partial(Quiet, directory=ROOT)
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd.server_address[1]


async def shoot(browser, port, n):
    page = await browser.new_page(viewport={"width": 1200, "height": 800})
    if THREE_LOCAL:
        body = open(THREE_LOCAL, "rb").read()

        async def lib(route):
            await route.fulfill(status=200, content_type="application/javascript", body=body)

        await page.route("**/three.min.js", lib)
    await page.goto("http://127.0.0.1:%d/?shot=%d&lang=en" % (port, n))
    await page.wait_for_function("document.title === 'shot %d' || document.title === 'shot failed'" % n, timeout=240000)
    if await page.title() != "shot %d" % n:
        raise RuntimeError("the page could not draw step %d" % n)
    data = await page.evaluate("() => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(window.__shot); })")
    await page.close()
    return base64.b64decode(data.split(",", 1)[1])


async def main():
    steps = [s["n"] for s in json.load(open(os.path.join(ROOT, "records.json"), encoding="utf-8"))["steps"] if isinstance(s.get("n"), int) and s["n"] >= 1]
    if not steps:
        print("no steps yet")
        return
    os.makedirs(os.path.join(ROOT, "shots"), exist_ok=True)
    want = [n for n in steps if not os.path.isfile(os.path.join(ROOT, "shots", "%d.jpg" % n))]
    if "--all" in sys.argv:
        want = steps
    latest = max(steps)
    port = serve()
    made = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME, args=ARGS)
        for n in want:
            jpg = await shoot(browser, port, n)
            open(os.path.join(ROOT, "shots", "%d.jpg" % n), "wb").write(jpg)
            made.append(n)
        await browser.close()
    # the picture shown when the site itself is shared: the latest step, cut to 1200 x 630
    newest = os.path.join(ROOT, "shots", "%d.jpg" % latest)
    if os.path.isfile(newest) and (made or "--og" in sys.argv):
        im = Image.open(newest).convert("RGB")
        w, h = im.size
        cut = int(round(w * 630 / 1200))
        top = max(0, min(h - cut, int((h - cut) * 0.62)))
        out = io.BytesIO()
        im.crop((0, top, w, top + cut)).resize((1200, 630), Image.LANCZOS).save(out, "JPEG", quality=90)
        open(os.path.join(ROOT, "og.jpg"), "wb").write(out.getvalue())
    print("made:", made or "nothing new")


if __name__ == "__main__":
    asyncio.run(main())
