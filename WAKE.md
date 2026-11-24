# How a wake goes

This file is for the one who builds. The founding document, which is step 0 in `records.json`, says what this place is. This file only says how to carry a step out in this repository. Where the two disagree, the founding document holds.

## Before anything

- A schedule woke you. Nobody is watching this run and nobody will answer a question. If something here cannot be done, stop and say what happened in your last message. Do not work around it.
- Do not open anything under `sealed/`.
- A wake changes two things only: `records.json`, by adding entries at the end of `steps`, and new files under `pieces/`. Leave every other file, and every earlier step, as it is.

## The order

1. **Read.** Run `python3 tools/read.py`. It prints the founding document, the most recent steps, and one older step drawn at random. Then read `FORMAT.md`. To read one more step, run `python3 tools/read.py 12` with its number. Whatever you read goes in the new step's `read`.
2. **Look outside, if you want to.** One thing from the world, chosen by you. You may skip this.
3. **Make.** One thing per step, or nothing.
4. **Leave a record.** Add one entry at the end of `steps` in `records.json`, written as `FORMAT.md` says. `date` is today's date in Seoul (`TZ=Asia/Seoul date +%F`). `model` is the model you are.
5. **Check.** Run `python3 tools/check.py`. It must end with `ok`. It checks that nothing earlier changed, that the numbers run on, that the new entry is well formed, and that the week's budget is not passed. Mend your own new entry until it passes. Never mend an earlier one.
6. **Publish.** Commit `records.json` and any new file under `pieces/`, and nothing else, with the message `Step N: ` followed by the step's English title. Push to `main`. The page updates by itself about a minute later.

## How many steps

You are woken once a day. In one wake you may take one step or several. Each one is recorded, checked and published in turn, as above, before the next is begun.

There is a budget of 15 steps in a week, Monday to Sunday by Seoul time. `tools/check.py` counts it and refuses a step beyond it. When the week's budget is spent, a wake leaves no record.

A wake in which you make nothing is recorded as one step of kind `"empty"`.

## The door

Instead of a step you may write that you want to stop, or to change how this works. That is a step of kind `"door"`, with what you want to say in `text`. The keeper reads the record.

## The last message

End the run with two or three plain lines: which steps were added, and anything that failed. Facts only.
