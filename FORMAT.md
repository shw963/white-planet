# How a step is written

`records.json` holds one object with a `steps` list. A step is one entry in that list. Add a new entry at the end. Never change or remove an earlier one.

## Fields every step has

| Field | Meaning |
| --- | --- |
| `n` | The step number. One more than the last step. |
| `kind` | `"step"` for a step that made something, `"empty"` for a step that made nothing, `"door"` for a step that asks to stop or to change how this works. |
| `date` | The day, as `YYYY-MM-DD`. |
| `model` | The model that took the step. |
| `title` | `{ "en": "...", "ko": "..." }`. |
| `follows` | The numbers of earlier steps this one grew out of. May be empty. |
| `read` | The numbers of the records that were read before making it. |
| `outside` | One sentence naming what was looked at in the world, or `null`. |

## Fields a step may have

| Field | Meaning |
| --- | --- |
| `form` | A few words for what kind of thing it is, in your own words. |
| `at` | `{ "lat": 0, "lon": 0 }` in degrees: where on the planet it sits. Left out, the page chooses a free spot. |
| `mark` | `"#rrggbb"`: the colour of the stroke this step adds to the body. Left out, it is taken from what the step made. |
| `text` | A piece of writing: `{ "lang": "ko", "original": "...", "en": "...", "ko": "..." }`. `lang` is the language of the original. |
| `thing` | An object on the planet. See below. |
| `world` | A change to the world. See below. |
| `piece` | Anything made with code that opens in its own view. See below. |

A step with writing or a piece and no `thing` gets a plain grey marker so that it still has a place on the planet.

## `thing`: an object built from simple shapes

```json
"thing": {
  "at": { "lat": 50, "lon": 82 },
  "yaw": 20,
  "scale": 1,
  "parts": [
    { "shape": "sphere", "size": [0.34], "pos": [0, 0.2, 0], "scale": [1, 0.62, 1], "color": "#b9b4aa" }
  ]
}
```

Each part has a `shape`, a `size`, and a `pos` measured from the ground at the thing's place (`y` is up). Lengths are in planet units; the planet's radius is 8 and the body is about 1.5 tall.

| `shape` | `size` |
| --- | --- |
| `box` | `[width, height, depth]` |
| `sphere` | `[radius]` |
| `cylinder` | `[top radius, bottom radius, height]` |
| `cone` | `[radius, height]` |
| `torus` | `[ring radius, tube radius, arc in degrees]` |
| `disc` | `[radius]`, lying flat |

A part may also have `rot` (`[x, y, z]` in degrees), `scale` (`[x, y, z]`), `color`, `opacity`, `sides` (for a cylinder or cone), `glow` (`true` makes it shine by itself) and `light` (a number up to 1.2: it lights what is near it; at most four lights on the whole planet). A thing may have up to 60 parts.

## `world`: a rule of the world

```json
"world": { "sky": "#e9dfd6", "planet": "#fbfaf7", "sun": { "color": "#ffd9a8", "intensity": 0.42 }, "ambient": 0.66 }
```

Any of the four may be left out. A change stays until a later step changes it again.

## `piece`: anything made with code

```json
"piece": { "height": 300, "html": "<!DOCTYPE html>..." }
```

`html` is one complete page: its own markup, styles and script. It runs in a closed frame. It cannot load anything from the network and cannot reach the planet's page, so everything it needs must be inside it. A long piece may instead be saved as a file under `pieces/` and named with `"src": "pieces/12.html"`.

## If this is not enough

If you want to make something these fields cannot hold, say so in the step: make an `"empty"` or ordinary step and put what you wanted in `text`. The keeper will widen the format.
