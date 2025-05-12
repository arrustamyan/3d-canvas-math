import { mergeColor, writeColor } from './color'
import { Interval } from "./interval";
import { randomNumber } from './math';
import { HitRecord, Hittable, Ray } from "./ray";
import { Vector3 } from "./vector3";

export class Camera {
  constructor(width, height, imageData) {
    this.imageWidth = width
    this.imageHeight = height
    this.imageData = imageData
    this.aspectRatio = width / height
    this.samplesPerPixel = 10
    this.maxDepth = 10
    this.numberOfSamples = 0
    this.colorBuffer = Array(imageData.data.byteLength).fill(0)

    this.widthRangeStart = 0
    this.widthRangeEnd = width
    this.heightRangeStart = 0
    this.heightRangeEnd = height

    this.fov = Math.PI * 65 / 180
    this.lookFrom = new Vector3(0, 0, 0.2)
    this.lookAt = new Vector3(0, 0, -1)
    this.cameraCenter = this.lookFrom

    this.w = this.lookFrom.sub(this.lookAt).unit()
    this.u = this.vup.cross(this.w).unit()
    this.v = this.w.cross(this.u)

    this.focalLength = this.lookFrom.sub(this.lookAt).length()

    const h = Math.tan(this.fov / 2)
    this.viewportHeight = 2 * h * this.focalLength
    this.viewportWidth = this.viewportHeight * (this.imageWidth / this.imageHeight)

    this.viewportU = this.u.multiplyScalar(this.viewportWidth)
    this.viewportV = this.v.multiplyScalar(-this.viewportHeight)
    this.pixelDeltaU = this.viewportU.divideScalar(this.imageWidth)
    this.pixelDeltaV = this.viewportV.divideScalar(this.imageHeight)
    this.viewportUpperLeft = this.cameraCenter.sub(this.w.multiplyScalar(this.focalLength)).sub(this.viewportU.divideScalar(2)).sub(this.viewportV.divideScalar(2))
    this.pixel00Location = this.viewportUpperLeft.add(this.pixelDeltaU.multiplyScalar(0.5).add(this.pixelDeltaV.multiplyScalar(0.5)))
  }

  /**
   *
   * @param {Hittable} world
   */
  render(world) {
    const heightRangeStart = this.heightRangeStart
    const heightRangeEnd = this.heightRangeEnd

    const widthRangeStart = this.widthRangeStart
    const widthRangeEnd = this.widthRangeEnd

    for (let j = heightRangeStart; j < heightRangeEnd; j++) {
      for (let i = widthRangeStart; i < widthRangeEnd; i++) {
        let color = new Vector3(0, 0, 0)

        for (let s = 0; s < this.samplesPerPixel; s++) {
          const ray = this.getRay(i, j)
          color = color.add(this.rayColor(ray, this.maxDepth, world))
        }

        writeColor(color.divideScalar(this.samplesPerPixel), i, j, this.imageData, widthRangeStart, heightRangeStart)
      }
    }
  }

  /**
   *
   * @param {Hittable} world
   */
  incrementalRender(world) {
    const heightRangeStart = this.heightRangeStart
    const heightRangeEnd = this.heightRangeEnd

    const widthRangeStart = this.widthRangeStart
    const widthRangeEnd = this.widthRangeEnd

    this.numberOfSamples++

    for (let j = heightRangeStart; j < heightRangeEnd; j++) {
      for (let i = widthRangeStart; i < widthRangeEnd; i++) {
        const ray = this.getRay(i, j)
        const color = this.rayColor(ray, this.maxDepth, world)


        mergeColor(color, i, j, this.imageData, widthRangeStart, heightRangeStart, this.numberOfSamples, this.colorBuffer)
      }
    }
  }

  /**
   *
   * @param {Ray} ray
   * @param {Hittable} world
   * @return {Vector3}
   */
  rayColor(ray, depth, world) {
    if (depth <= 0)
      return new Vector3(0, 0, 0);

    const rec = new HitRecord()

    if (world.hit(ray, new Interval(0.001, Infinity), rec)) {
      const scattered = new Ray()
      const attenuation = new Vector3()

      if (rec.material.scatter(ray, rec, attenuation, scattered)) {
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
