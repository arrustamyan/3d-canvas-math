import './style.css'
import { Vector3 } from './utils/vector3'
import { Ray } from './utils/ray'
import { writeColor } from './utils/color'

const canvas = document.querySelector('#main')
const ctx = canvas.getContext('2d')

const imageWidth = window.innerWidth
const imageHeight = window.innerHeight

const imageData = ctx.createImageData(imageWidth, imageHeight)

canvas.width = imageWidth
canvas.height = imageHeight
const aspectRatio = imageWidth / imageHeight

const viewportHeight = 2
const viewportWidth = viewportHeight * aspectRatio

const focalLength = 1

const cameraCenter = new Vector3(0, 0, 0)

const viewportU = new Vector3(viewportWidth, 0, 0)
const viewportV = new Vector3(0, -viewportHeight, 0)
console.log('viewportU', viewportU)
console.log('viewportV', viewportV)

const pixelDeltaU = viewportU.devideScalar(imageWidth)
const pixelDeltaV = viewportV.devideScalar(imageHeight)
console.log('pixelDeltaU', pixelDeltaU)
console.log('pixelDeltaV', pixelDeltaV)

const viewportUpperLeft = cameraCenter.sub(new Vector3(0, 0, focalLength)).sub(viewportU.devideScalar(2)).sub(viewportV.devideScalar(2))
const pixel00Location = viewportUpperLeft.add(pixelDeltaU.multiplyScalar(0.5).add(pixelDeltaV.multiplyScalar(0.5)))
console.log('upper left', viewportUpperLeft)
console.log('pixel00', pixel00Location)

console.log(imageWidth, imageHeight)

let pixelCenter, rayDirection

const heightRangeStart = 0
const heightRangeEnd = imageHeight

const widthRangeStart = 0
const widthRangeEnd = imageWidth

let nrOfIterations = 0

for (let j = heightRangeStart; j < heightRangeEnd; j++) {
  for (let i = widthRangeStart; i < widthRangeEnd; i++) {
    pixelCenter = pixel00Location.add(pixelDeltaU.multiplyScalar(i)).add(pixelDeltaV.multiplyScalar(j))
    rayDirection = pixelCenter.sub(cameraCenter)

    const ray = new Ray(cameraCenter, rayDirection)

    /**
     * 
     * @param {Ray} ray 
     * @returns {Vector3}
     */
    function rayColor(ray) {
      const t = hitSphere(new Vector3(0, 0, -1), 0.5, ray)

      if (t > 0) {
        const n = ray.at(t).sub(new Vector3(0, 0, -1)).unit()
        return new Vector3(n.x + 1, n.y + 1, n.z + 1).multiplyScalar(0.5)
      }

      const unitDirection = ray.direction.unit()
      const a = 0.5 * (unitDirection.y + 1)

      return new Vector3(1, 1, 1).multiplyScalar(1 - a).add(new Vector3(0.5, 0.7, 1.0).multiplyScalar(a))
    }

    /**
     * 
     * @param {Vector3} center 
     * @param {number} radius 
     * @param {Ray} ray 
     * @returns number
     */
    function hitSphere(center, radius, ray) {
      const oc = center.sub(ray.origin)
      const a = ray.direction.dot(ray.direction)
      const b = -2 * ray.direction.dot(oc)
      const c = oc.dot(oc) - Math.pow(radius, 2)

      const discriminant = b * b - 4 * a * c

      if (discriminant < 0) {
        return -1.0;
      } else {
        return (-b - Math.sqrt(discriminant)) / (2 * a);
      }
    }

    const color = rayColor(ray)

    writeColor(color, i, j, imageData)

    nrOfIterations++
  }
}

console.log(nrOfIterations, pixelCenter, rayDirection)
console.log(imageData)

ctx.putImageData(imageData, 0, 0);
