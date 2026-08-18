export interface HsvRange {
  lower: [number, number, number];
  upper: [number, number, number];
}

export interface AutoTunedParameters {
  medianHsv: [number, number, number];
  rgbHex: string;
  hsvRanges: HsvRange[];
  bgSensitivity: number;
}

export interface BackgroundQualityResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Converts RGB values (0..255) to OpenCV-compatible HSV ranges:
 * H: 0..180, S: 0..255, V: 0..255
 */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    if (h < 0) h += 6;
  }

  return [
    Math.round((h / 6) * 180),
    Math.round(s * 255),
    Math.round(v * 255)
  ];
}

/**
 * Automatically inspects captured background image data for usability.
 * Checks for dark frame, overexposure, or sensor occlusion.
 */
export function validateBackgroundQuality(imageData: ImageData): BackgroundQualityResult {
  const data = imageData.data;
  const totalPixels = imageData.width * imageData.height;

  let totalLuminance = 0;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Standard ITU-R BT.601 Relative Luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += lum;
  }

  const avgLuminance = totalLuminance / totalPixels;

  if (avgLuminance < 15) {
    return {
      isValid: false,
      reason: 'Background image is too dark. Please ensure sufficient room lighting.'
    };
  }

  if (avgLuminance > 240) {
    return {
      isValid: false,
      reason: 'Background image is overexposed. Avoid direct blinding lights into the camera.'
    };
  }

  return { isValid: true };
}

/**
 * Automatically samples cloak color and calculates internal adaptive parameters:
 * 1. Computes Median HSV & Standard Deviation (Hue variance)
 * 2. Adaptively expands tolerance for cloth folds/shadows or tightens for uniform colors
 * 3. Handles Red Hue wrap-around (0..180)
 * 4. Automatically estimates optimal background difference sensitivity
 */
export function autoTuneCloakColor(
  imageData: ImageData,
  clickX: number,
  clickY: number,
  radius: number = 3
): AutoTunedParameters {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const hsvSamples: [number, number, number][] = [];
  const rgbSamples: [number, number, number][] = [];

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = Math.min(Math.max(0, clickX + dx), width - 1);
      const py = Math.min(Math.max(0, clickY + dy), height - 1);
      const idx = (py * width + px) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const [h, s, v] = rgbToHsv(r, g, b);

      if (s >= 30 && v >= 30) {
        hsvSamples.push([h, s, v]);
      }
      rgbSamples.push([r, g, b]);
    }
  }

  const targetHsvSamples = hsvSamples.length > 0 ? hsvSamples : rgbSamples.map(([r, g, b]) => rgbToHsv(r, g, b));

  // Compute Median H, S, V
  const hVals = targetHsvSamples.map(s => s[0]).sort((a, b) => a - b);
  const sVals = targetHsvSamples.map(s => s[1]).sort((a, b) => a - b);
  const vVals = targetHsvSamples.map(s => s[2]).sort((a, b) => a - b);

  const mid = Math.floor(targetHsvSamples.length / 2);
  const medianHsv: [number, number, number] = [hVals[mid], sVals[mid], vVals[mid]];

  // Compute Hue Standard Deviation for adaptive tolerance tuning
  const meanH = hVals.reduce((acc, val) => acc + val, 0) / hVals.length;
  const hVariance = hVals.reduce((acc, val) => acc + Math.pow(val - meanH, 2), 0) / hVals.length;
  const hStdDev = Math.sqrt(hVariance);

  // Dynamic Adaptive Tolerance: Expand if folds/shadows cause high variance, tighten if uniform
  let adaptiveTolerance = 16;
  if (hStdDev > 6) {
    adaptiveTolerance = Math.min(26, Math.round(16 + hStdDev * 0.8));
  } else {
    adaptiveTolerance = 14;
  }

  // Median RGB for Swatch Preview
  const rVals = rgbSamples.map(s => s[0]).sort((a, b) => a - b);
  const gVals = rgbSamples.map(s => s[1]).sort((a, b) => a - b);
  const bVals = rgbSamples.map(s => s[2]).sort((a, b) => a - b);

  const medR = rVals[Math.floor(rgbSamples.length / 2)];
  const medG = gVals[Math.floor(rgbSamples.length / 2)];
  const medB = bVals[Math.floor(rgbSamples.length / 2)];

  const rgbHex = `#${((1 << 24) + (medR << 16) + (medG << 8) + medB).toString(16).slice(1)}`;

  // Calculate HSV Ranges supporting Red wrap-around
  const hsvRanges = calculateAdaptiveHsvRanges(medianHsv, adaptiveTolerance);

  // Automatically determine Background Difference Threshold based on median Saturation/Value
  let bgSensitivity = 22;
  if (medianHsv[1] < 60) {
    bgSensitivity = 28; // Require higher diff sensitivity for desaturated colors
  } else {
    bgSensitivity = 20;
  }

  return {
    medianHsv,
    rgbHex,
    hsvRanges,
    bgSensitivity
  };
}

/**
 * Calculates adaptive upper and lower bounds handling Red Hue wrap-around (0..180).
 */
function calculateAdaptiveHsvRanges(targetHsv: [number, number, number], tolerance: number): HsvRange[] {
  const [h, s, v] = targetHsv;
  const satLower = Math.max(25, s - 80);
  const satUpper = 255;
  const valLower = Math.max(25, v - 80);
  const valUpper = 255;

  const lowerH = h - tolerance;
  const upperH = h + tolerance;

  const ranges: HsvRange[] = [];

  if (lowerH < 0) {
    ranges.push({
      lower: [180 + lowerH, satLower, valLower],
      upper: [180, satUpper, valUpper]
    });
    ranges.push({
      lower: [0, satLower, valLower],
      upper: [upperH, satUpper, valUpper]
    });
  } else if (upperH > 180) {
    ranges.push({
      lower: [lowerH, satLower, valLower],
      upper: [180, satUpper, valUpper]
    });
    ranges.push({
      lower: [0, satLower, valLower],
      upper: [upperH - 180, satUpper, valUpper]
    });
  } else {
    ranges.push({
      lower: [lowerH, satLower, valLower],
      upper: [upperH, satUpper, valUpper]
    });
  }

  return ranges;
}

/**
 * Fast Client-Side Invisible Cloak Image Processing Pipeline.
 * Combines Color Masking with Background Difference Masking.
 */
export function processInvisibleCloakFrame(
  currentImageData: ImageData,
  bgImageData: ImageData,
  outputImageData: ImageData,
  hsvRanges: HsvRange[],
  bgSensitivity: number
): void {
  const cData = currentImageData.data;
  const bgData = bgImageData.data;
  const outData = outputImageData.data;

  const totalPixels = currentImageData.width * currentImageData.height;
  const sensThreshold = bgSensitivity * 2.5;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;

    const r1 = cData[idx];
    const g1 = cData[idx + 1];
    const b1 = cData[idx + 2];

    const r2 = bgData[idx];
    const g2 = bgData[idx + 1];
    const b2 = bgData[idx + 2];

    // Background Difference Check
    const bgDiff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

    // Color Mask Check
    const [h, s, v] = rgbToHsv(r1, g1, b1);
    let isColorMatch = false;

    for (let r = 0; r < hsvRanges.length; r++) {
      const range = hsvRanges[r];
      if (
        h >= range.lower[0] && h <= range.upper[0] &&
        s >= range.lower[1] && s <= range.upper[1] &&
        v >= range.lower[2] && v <= range.upper[2]
      ) {
        isColorMatch = true;
        break;
      }
    }

    // Combine: Cloak is detected if COLOR MATCHES AND BACKGROUND IS DIFFERENT
    const isCloak = isColorMatch && bgDiff > sensThreshold;

    if (isCloak) {
      // Replace with stored background pixel
      outData[idx] = r2;
      outData[idx + 1] = g2;
      outData[idx + 2] = b2;
      outData[idx + 3] = 255;
    } else {
      // Keep current frame pixel
      outData[idx] = r1;
      outData[idx + 1] = g1;
      outData[idx + 2] = b1;
      outData[idx + 3] = 255;
    }
  }
}
