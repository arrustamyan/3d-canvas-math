import { writeColor } from './color'
import { Interval } from "./interval";
import { randomNumber } from './math';
import { HitRecord, Hittable, Ray } from "./ray";
import { Vector3 } from "./vector3";

export class Camera {
  constructor() {
    this.imageWidth = window.innerWidth
    this.imageHeight = window.innerHeight
    this.canvas = document.querySelector('#main')
    this.ctx = this.canvas.getContext('2d')
    this.canvas.width = this.imageWidth
    this.canvas.height = this.imageHeight
    this.imageData = this.ctx.createImageData(this.imageWidth, this.imageHeight)
    this.viewportHeight = 2
    this.viewportWidth = this.viewportHeight * (this.imageWidth / this.imageHeight)
    this.focalLength = 1
    this.cameraCenter = new Vector3(0, 0, 0)
    this.viewportU = new Vector3(this.viewportWidth, 0, 0)
    this.viewportV = new Vector3(0, -this.viewportHeight, 0)
    this.pixelDeltaU = this.viewportU.divideScalar(this.imageWidth)
    this.pixelDeltaV = this.viewportV.divideScalar(this.imageHeight)
    this.viewportUpperLeft = this.cameraCenter.sub(new Vector3(0, 0, this.focalLength)).sub(this.viewportU.divideScalar(2)).sub(this.viewportV.divideScalar(2))
    this.pixel00Location = this.viewportUpperLeft.add(this.pixelDeltaU.multiplyScalar(0.5).add(this.pixelDeltaV.multiplyScalar(0.5)))
    this.aspectRatio = window.innerWidth / window.innerHeight
    this.samplesPerPixel = 500
    this.maxDepth = 10
  }

  /**
   *
   * @param {Hittable} world
   */
  render(world) {
    const heightRangeStart = 0
    const heightRangeEnd = this.imageHeight

    const widthRangeStart = 0
    const widthRangeEnd = this.imageWidth

    for (let j = heightRangeStart; j < heightRangeEnd; j++) {
      for (let i = widthRangeStart; i < widthRangeEnd; i++) {
        let color = new Vector3(0, 0, 0)

        for (let s = 0; s < this.samplesPerPixel; s++) {
          const ray = this.getRay(i, j)
          color = color.add(this.rayColor(ray, this.maxDepth, world))
        }

        writeColor(color.divideScalar(this.samplesPerPixel), i, j, this.imageData)
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }

  /**
   *
   * @param {Ray} ray
   * @param {Hittable} world
   * @return {Vector3}
   */
  rayColor(ray, depth, world) {
    if (depth <= 0)
      return new Vector3(0,0,0);

    const rec = new HitRecord()

    if (world.hit(ray, new Interval(0.001, Infinity), rec)) {
      const scattered = new Ray()
      const attenuation = new Vector3()

      if(rec.material.scatter(ray, rec, attenuation, scattered)) {
        return attenuation.multiply(this.rayColor(scattered, depth - 1, world))
      }

      return new Vector3(0, 0, 0)
    }

    const unitDirection = ray.direction.unit()
    const a = 0.5 * (unitDirection.y + 1)

    return new Vector3(1, 1, 1).multiplyScalar(1 - a).add(new Vector3(0.5, 0.7, 1.0).multiplyScalar(a))
  }

  getRay(i, j) {
    function sampleSquare() {
      return new Vector3(randomNumber() - 0.5, randomNumber() - 0.5, 0)
    }

    const offset = sampleSquare()
    const pixelSample = this.pixel00Location.add(this.pixelDeltaU.multiplyScalar(i + offset.x)).add(this.pixelDeltaV.multiplyScalar(j + offset.y))

    const rayOrigin = this.cameraCenter
    const rayDirection = pixelSample.sub(this.cameraCenter)

    return new Ray(rayOrigin, rayDirection)
  }
}
