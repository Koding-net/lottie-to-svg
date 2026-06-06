/**
 * @kodeking/lottie-to-svg
 *
 * Extract SVG frames from a Lottie JSON animation.
 * Runs entirely in the browser — no server required.
 *
 * Uses lottie-web's SVG renderer to snapshot any frame of the animation
 * as a standalone, transparency-preserving SVG string.
 */

import lottie, { type AnimationItem } from 'lottie-web';

export interface LottieJson {
  v?: string;
  fr?: number;
  ip?: number;
  op?: number;
  w?: number;
  h?: number;
  [key: string]: unknown;
}

export interface ExtractOptions {
  /** Frame number to extract (default: 0 = first frame) */
  frame?: number;
  /** Container width in px used for rendering (default: animation width or 512) */
  width?: number;
  /** Container height in px used for rendering (default: animation height or 512) */
  height?: number;
}

/**
 * Extract a single SVG frame from a Lottie JSON animation.
 *
 * @param lottieJson  Parsed Lottie JSON object
 * @param options     Extraction options
 * @returns           SVG markup string
 *
 * @example
 * ```ts
 * import { extractSvgFrame } from '@kodeking/lottie-to-svg';
 * import fs from 'fs'; // or fetch() in the browser
 *
 * const json = JSON.parse(fs.readFileSync('animation.json', 'utf8'));
 * const svg  = await extractSvgFrame(json, { frame: 0 });
 * document.body.innerHTML = svg;
 * ```
 */
export async function extractSvgFrame(
  lottieJson: LottieJson,
  options: ExtractOptions = {},
): Promise<string> {
  const { frame = 0 } = options;
  const w = options.width  ?? (lottieJson.w as number | undefined) ?? 512;
  const h = options.height ?? (lottieJson.h as number | undefined) ?? 512;

  return new Promise((resolve, reject) => {
    const container = document.createElement('div');
    container.style.cssText = `position:fixed;left:-9999px;top:0;width:${w}px;height:${h}px;overflow:hidden;`;
    document.body.appendChild(container);

    let anim: AnimationItem | null = null;

    const cleanup = () => {
      try { anim?.destroy(); } catch { /* noop */ }
      try { document.body.removeChild(container); } catch { /* noop */ }
    };

    try {
      anim = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: lottieJson as object,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: false,
        },
      });

      const onReady = () => {
        try {
          anim!.goToAndStop(frame, true);

          requestAnimationFrame(() => {
            try {
              const svgEl = container.querySelector('svg');
              if (!svgEl) {
                cleanup();
                reject(new Error('SVG element not found after rendering.'));
                return;
              }

              if (!svgEl.getAttribute('xmlns')) {
                svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
              }
              if (!svgEl.getAttribute('width'))  svgEl.setAttribute('width',  String(w));
              if (!svgEl.getAttribute('height')) svgEl.setAttribute('height', String(h));

              const svgText = svgEl.outerHTML;
              cleanup();
              resolve(svgText);
            } catch (e) {
              cleanup();
              reject(e);
            }
          });
        } catch (e) {
          cleanup();
          reject(e);
        }
      };

      anim.addEventListener('DOMLoaded', onReady);
      anim.addEventListener('error', () => {
        cleanup();
        reject(new Error('Lottie animation failed to load.'));
      });
    } catch (e) {
      cleanup();
      reject(e);
    }
  });
}

/**
 * Get the total number of frames in a Lottie animation.
 */
export function getFrameCount(lottieJson: LottieJson): number {
  const ip = (lottieJson.ip as number | undefined) ?? 0;
  const op = (lottieJson.op as number | undefined) ?? 60;
  return Math.max(1, op - ip);
}

/** Get the in-point (first frame index) */
export function getInPoint(lottieJson: LottieJson): number {
  return (lottieJson.ip as number | undefined) ?? 0;
}

/** Get the out-point (last frame index, exclusive) */
export function getOutPoint(lottieJson: LottieJson): number {
  return (lottieJson.op as number | undefined) ?? 60;
}

/**
 * Trigger a browser download of an SVG string.
 */
export function downloadSvg(svgText: string, filename = 'frame.svg'): void {
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
