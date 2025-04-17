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
export function writeColor(color, x, y, imageData, offsetU = 0, offsetV = 0) {
  const intensity = new Interval(0, 0.999)

  const r = Math.round(intensity.clamp(linearToGamma(color.x)) * 254.999)
  const g = Math.round(intensity.clamp(linearToGamma(color.y)) * 254.999)
  const b = Math.round(intensity.clamp(linearToGamma(color.z)) * 254.999)
  const a = 255

  imageData.data[(y - offsetV) * (imageData.width * 4) + (x - offsetU) * 4 + 0] = r;
  imageData.data[(y - offsetV) * (imageData.width * 4) + (x - offsetU) * 4 + 1] = g;
  imageData.data[(y - offsetV) * (imageData.width * 4) + (x - offsetU) * 4 + 2] = b;
  imageData.data[(y - offsetV) * (imageData.width * 4) + (x - offsetU) * 4 + 3] = a;
}

/**
 *
 * @param {Vector3} color
 * @param {number} x
 * @param {number} y
 * @param {ImageData} imageData
 */
export function mergeColor(color, x, y, imageData, offsetU = 0, offsetV = 0, nrOfSamples, colorBuffer) {
  const intensity = new Interval(0, 0.999)
  
  // TODO handle first frame
  
  const posX = (y - offsetV) * (imageData.width * 4) + (x - offsetU) * 4 + 0
  const posY = (y - offsetV) * (imageData.width * 4) + (x - offsetU) * 4 + 1
  const posZ = (y - offsetV) * (imageData.width * 4) + (x - offsetU) * 4 + 2
  const posA = (y - offsetV) * (imageData.width * 4) + (x - offsetU) * 4 + 3
  
  const r = intensity.clamp(color.x)
  const g = intensity.clamp(color.y)
  const b = intensity.clamp(color.z)

  colorBuffer[posX] += r
  colorBuffer[posY] += g
  colorBuffer[posZ] += b

  const currentR = colorBuffer[posX]
  const currentG = colorBuffer[posY]
  const currentB = colorBuffer[posZ]

  imageData.data[posX] = Math.round(linearToGamma(currentR / nrOfSamples) * 254.999)
  imageData.data[posY] = Math.round(linearToGamma(currentG / nrOfSamples) * 254.999)
  imageData.data[posZ] = Math.round(linearToGamma(currentB / nrOfSamples) * 254.999)
  imageData.data[posA] = 255;
}
