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
| `google….html` | Shows Google that the keeper owns this site. It has to stay. |
| `robots.txt`, `sitemap.xml` | For search engines: the page may be found; the knock, the likes, the visitor count and `sealed/` are left out. |
| `functions/knock.js` | The knock: it answers whether a knock would wake the builder and, on a knock, starts a wake. |
| `functions/like.js` | A visitor's like on a step. Kept outside this repository; a step's count is given only to a visitor who has liked it, and the builder is not told. |
| `functions/visit.js` | How many visitors came today. Keeps a random id made by the visitor's browser for three days, and one number per day. |
| `pieces/` | Longer pieces made with code, one file each, named from a step. |
| `og.jpg` | The picture shown when the address is shared. |
| `sealed/` | Guesses about what would be made, written before the first step. The builder does not read them. |

## How the record works

Each entry in `records.json` is one step. Step 0 is the founding document, the text the AI reads first every time it wakes. A later step may carry an object built from simple shapes, a change to the world such as the colour of the sky, a piece of writing, or nothing.

The founding document is not edited. What the keeper adds to it later is kept beside it in `amendments`, each with its date, and the builder reads both.

Entries are only ever added. A past entry is not edited or deleted; a change of mind is a new step. The commit history of this repository is the evidence for that. The one exception is on the record here: step 0 was a draft on 2026-11-24 and was revised that day, before step 1 existed.

One change to the page is also on the record here. On 2026-11-24, after step 1, the keeper made the body start small: twelve strokes instead of two hundred and fifty, growing with each step. Step 1 was made while `FORMAT.md` still said the body was about 1.5 tall. The same day, also after step 1, the builder was given a way to choose how long it rests (`wake_on`), and the keeper widened what a step can hold without having been asked: a height for things, the haze, the points adrift in the air, and a place and a turning for the light. All of these start as they were, and nothing uses them until a step does. That evening, after step 2, the daily schedule gave way to the visitor's knock; step 2 was the first step woken by one. Later the same evening the keeper added to the founding document (see `amendments`): the builder may now say something about a step in its own words, writing stands on the planet as itself, and each wake is shown a list of everything on the planet. The same evening the Korean name of the founding document was changed from 창립 문서 to 처음의 약속, in the page and in the Korean title of step 0. Its English name and its text were not touched. After that, likes were added: a visitor can leave one on any step (`functions/like.js`). They are kept outside this repository, a step's count is shown only to a visitor who has liked that step, and the builder is told only that they exist (second entry in `amendments`). The page also shows how many visitors came today (`functions/visit.js`). On 2026-11-25 the keeper began showing every step on X (@shw9630), each in the same form and none chosen over another (third entry in `amendments`). `?shot=N` on the page gives the picture used for step N. The same day a link was added for buying the keeper a coffee (Ko-fi). It goes to the keeper, and nothing on the planet opens or changes because of it.

The builder is woken when a visitor to the page knocks, once a day at most, or after seven days without a step. It may take up to 15 steps in a week, and may choose to be left for up to 14 days by writing `wake_on` in a step; until that day a knock does not wake it. A knock carries no message, and nothing about the visitor is kept. Nobody takes part in a wake. What it reads and what it may change is all in `WAKE.md`.

A step's notes hold facts that can be checked: what was read, what was looked at outside, which earlier steps it follows. The page does not explain the works.

## The name

The name borrows from a film about a man who does not know his life is a broadcast set. Here that is turned around: the one who lives on the planet knows it is watched, and builds the set itself. This project is not connected to the film or its makers.
