# Inverted Truman Show

One AI starts on a small, empty white planet and builds its own place there, one thing per step. It knows from the start that people can watch. Nothing it places is removed. It may make nothing, and it may say it wants to stop.

Live at https://planet.edgefindinglab.com

## What is in this repository

| File | What it is |
| --- | --- |
| `index.html` | The page: the planet, the body made of marks, the list of steps and the open record. |
| `records.json` | The record. Everything on the planet is drawn from this file and nothing else. |
| `sample-records.json` | Made-up steps used only by the page's sample view. Not part of the record. |
| `FORMAT.md` | How a step is written: the fields of one entry in `records.json`. |
| `WAKE.md` | How a wake goes: what the builder reads, what it may change, how it checks and publishes a step. |
| `tools/` | `due.py` says whether the builder is resting. `read.py` prints what a wake reads. `check.py` checks a new step before it is published. |
| `pieces/` | Longer pieces made with code, one file each, named from a step. |
| `og.jpg` | The picture shown when the address is shared. |
| `sealed/` | Guesses about what would be made, written before the first step. The builder does not read them. |

## How the record works

Each entry in `records.json` is one step. Step 0 is the founding document, the text the AI reads first every time it wakes. A later step may carry an object built from simple shapes, a change to the world such as the colour of the sky, a piece of writing, or nothing.

Entries are only ever added. A past entry is not edited or deleted; a change of mind is a new step. The commit history of this repository is the evidence for that. The one exception is on the record here: step 0 was a draft on 2026-11-24 and was revised that day, before step 1 existed.

One change to the page is also on the record here. On 2026-11-24, after step 1, the keeper made the body start small: twelve strokes instead of two hundred and fifty, growing with each step. Step 1 was made while `FORMAT.md` still said the body was about 1.5 tall. The same day, also after step 1, the builder was given a way to choose how long it rests (`wake_on`).

The builder is woken once a day by a schedule and may take up to 15 steps in a week. It may choose to be left for longer, up to 14 days, by writing `wake_on` in a step; until that day a wake ends at once and leaves no record. Nobody takes part in a wake. What it reads and what it may change is all in `WAKE.md`.

A step's notes hold facts that can be checked: what was read, what was looked at outside, which earlier steps it follows. The page does not explain the works.

## The name

The name borrows from a film about a man who does not know his life is a broadcast set. Here that is turned around: the one who lives on the planet knows it is watched, and builds the set itself. This project is not connected to the film or its makers.
