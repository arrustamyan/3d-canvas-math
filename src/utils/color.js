import { Vector3 } from "./vector3";

/**
 * 
 * @param {Vector3} color 
 * @param {number} x
 * @param {number} y
 * @param {ImageData} imageData
 */
export function writeColor(color, x, y, imageData) {
  imageData.data[y * (imageData.width * 4) + x * 4 + 0] = Math.round(color.x * 255.999);
  imageData.data[y * (imageData.width * 4) + x * 4 + 1] = Math.round(color.y * 255.999);
  imageData.data[y * (imageData.width * 4) + x * 4 + 2] = Math.round(color.z * 255.999);
  imageData.data[y * (imageData.width * 4) + x * 4 + 3] = 255;
}
