import { Interval } from "./interval";
import { Vector3 } from "./vector3";

function linearToGamma(value) {
  if (value > 0) {
    return Math.sqrt(value)
  }

  return 0
}

/**
 *
 * @param {Vector3} color
 * @param {number} x
 * @param {number} y
 * @param {ImageData} imageData
 */
export function writeColor(color, x, y, imageData) {
  const intensity = new Interval(0, 0.999)

  const r = Math.round(intensity.clamp(linearToGamma(color.x)) * 254.999)
  const g = Math.round(intensity.clamp(linearToGamma(color.y)) * 254.999)
  const b = Math.round(intensity.clamp(linearToGamma(color.z)) * 254.999)
  const a = 255

  imageData.data[y * (imageData.width * 4) + x * 4 + 0] = r;
  imageData.data[y * (imageData.width * 4) + x * 4 + 1] = g;
  imageData.data[y * (imageData.width * 4) + x * 4 + 2] = b;
  imageData.data[y * (imageData.width * 4) + x * 4 + 3] = a;
}
