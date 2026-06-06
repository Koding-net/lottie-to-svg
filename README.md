# @koding-net/lottie-to-svg

> Extract SVG frames from Lottie JSON animations — **browser only, no server required**

[![npm](https://img.shields.io/npm/v/@koding-net/lottie-to-svg)](https://www.npmjs.com/package/@koding-net/lottie-to-svg)
[![license](https://img.shields.io/npm/l/@koding-net/lottie-to-svg)](LICENSE)

Powered by [lottie-web](https://github.com/airbnb/lottie-web)'s SVG renderer. Pick any frame from an animation and get back clean, transparency-preserving SVG markup. Try it live at [iconking.net/tools/lottie-to-svg](https://iconking.net/tools/lottie-to-svg).

---

## Install

```bash
npm install @koding-net/lottie-to-svg lottie-web
# or
pnpm add @koding-net/lottie-to-svg lottie-web
```

`lottie-web` is a peer dependency — install it alongside this package.

---

## Usage

### Extract the first frame

```ts
import { extractSvgFrame } from '@koding-net/lottie-to-svg';

const response = await fetch('/animation.json');
const lottieJson = await response.json();

const svg = await extractSvgFrame(lottieJson, { frame: 0 });
document.body.innerHTML = svg;
```

### Extract a specific frame and download it

```ts
import { extractSvgFrame, getFrameCount, downloadSvg } from '@koding-net/lottie-to-svg';

const lottieJson = await fetch('/animation.json').then(r => r.json());
const totalFrames = getFrameCount(lottieJson); // e.g. 60

// Extract the middle frame
const svg = await extractSvgFrame(lottieJson, { frame: Math.floor(totalFrames / 2) });
downloadSvg(svg, 'midpoint.svg');
```

### React example

```tsx
import { useState } from 'react';
import { extractSvgFrame } from '@koding-net/lottie-to-svg';

export default function FramePicker({ lottieJson }: { lottieJson: object }) {
  const [frame, setFrame] = useState(0);
  const [svg, setSvg] = useState<string | null>(null);

  const extract = async () => {
    const result = await extractSvgFrame(lottieJson, { frame });
    setSvg(result);
  };

  return (
    <div>
      <input type="number" value={frame} onChange={e => setFrame(Number(e.target.value))} />
      <button onClick={extract}>Extract SVG</button>
      {svg && <div dangerouslySetInnerHTML={{ __html: svg }} />}
    </div>
  );
}
```

---

## API

### `extractSvgFrame(lottieJson, options?): Promise<string>`

Renders the animation in a hidden off-screen container and snapshots the SVG DOM at the requested frame.

| Parameter | Type | Description |
|---|---|---|
| `lottieJson` | `object` | Parsed Lottie JSON |
| `options.frame` | `number` | Frame index to extract (default `0`) |
| `options.width` | `number` | Container width in px (default: animation width or `512`) |
| `options.height` | `number` | Container height in px (default: animation height or `512`) |

Returns a `Promise<string>` — the full SVG markup including `xmlns` and dimension attributes.

### `getFrameCount(lottieJson): number`

Returns the total number of frames (`op - ip`).

### `getInPoint(lottieJson): number`

Returns the animation's in-point (first frame index).

### `getOutPoint(lottieJson): number`

Returns the animation's out-point (last frame index, exclusive).

### `downloadSvg(svgText, filename?): void`

Triggers a browser download of the SVG string. `filename` defaults to `"frame.svg"`.

---

## Browser support

Requires a modern browser with DOM support (Chrome, Firefox, Safari, Edge). **Does not run in Node.js** — use a headless browser (Puppeteer/Playwright) if you need server-side extraction.

---

## How it works

1. Creates a hidden `512×512` (or custom size) `<div>` off-screen
2. Loads the Lottie animation with `lottie-web` in SVG renderer mode
3. Seeks to the requested frame with `goToAndStop(frame, true)`
4. Reads the SVG element's `outerHTML` after a `requestAnimationFrame` tick
5. Adds `xmlns`, `width`, and `height` attributes if missing
6. Destroys the animation and removes the container

The extraction is transparent-preserving — no background is added, so the SVG retains any alpha transparency from the original animation.

---

## License

MIT © [KodeKing](https://github.com/Koding-net)

---

## Related packages

| Package | Description |
|---|---|
| [@koding-net/svg-to-lottie](https://github.com/Koding-net/svg-to-lottie) | Wrap an SVG as a Lottie JSON animation |
| [@koding-net/lottie-to-dotlottie](https://github.com/Koding-net/lottie-to-dotlottie) | Convert Lottie JSON to .lottie binary format |
| [@koding-net/lottie-to-gif](https://github.com/Koding-net/lottie-to-gif) | Render Lottie to animated GIF (Node.js) |
| [@koding-net/lottie-to-mp4](https://github.com/Koding-net/lottie-to-mp4) | Render Lottie to MP4 video (Node.js) |

See all tools at [github.com/Koding-net/lottie-tools](https://github.com/Koding-net/lottie-tools).
