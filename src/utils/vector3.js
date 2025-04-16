import { randomNumber } from "./math"

export class Vector3 {
  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  /**
   *
   * @param {Vector3} v
   * @returns {Vector3}
   */
  add(v) {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z)
  }

  /**
   *
   * @param {Vector3} v
   * @returns {Vector3}
   */
  sub(v) {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z)
  }

  /**
   *
   * @param {number} t
   * @returns {Vector3}
   */
  multiplyScalar(t) {
    return new Vector3(this.x * t, this.y * t, this.z * t)
  }

  /**
   *
   * @param {number} t
   * @returns {Vector3}
   */
  divideScalar(t) {
    return new Vector3(this.x / t, this.y / t, this.z / t)
  }

  /**
   *
   * @param {Vector3} v
   * @returns number
   */
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }

  /**
   *
   * @param {Vector3} v
   * @returns {Vector3}
   */
  multiply(v) {
    return new Vector3(this.x * v.x, this.y * v.y, this.z * v.z)
  }

  /**
   *
   * @returns number
   */
  length() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2))
  }

  /**
   *
   * @returns {Vector3}
   */
  unit() {
    const length = this.length()
    return this.divideScalar(length)
  }

  random(min = 0, max = 1) {
    return new Vector3(randomNumber(min, max), randomNumber(min, max), randomNumber(min, max))
  }

  randomUnit() {
    while (true) {
      const p = this.random(-1, 1)
      const lengthSquared = Math.pow(p.length(), 2)
      if (lengthSquared > Number.MIN_VALUE && lengthSquared <= 1)
        return p.unit()
    }
  }

  randomOnHemisphere(normal) {
    const onUnitSphere = this.randomUnit()
    if (onUnitSphere.dot(normal) > 0.0) {
      return onUnitSphere
    } else {
      return onUnitSphere.multiplyScalar(-1)
    }
  }

  copy(v) {
    this.x = v.x
    this.y = v.y
    this.z = v.z
  }

  isNearZero() {
    return this.length() < Number.MIN_VALUE
  }

  reflect(normal) {
    return this.sub(normal.multiplyScalar(2 * this.dot(normal)))
  }

  /**
   *
   * @param {Vector3} uv
   * @param {Vector3} n
   * @param {number} etaiOverEtat
   * @returns {Vector3}
   */
  refract(n, etaiOverEtat) {
    const cosTheta = Math.min(this.multiplyScalar(-1).dot(n), 1.0)
    const rOutPerpendicular = this.add(n.multiplyScalar(cosTheta)).multiplyScalar(etaiOverEtat)
    const rOutParallel = n.multiplyScalar(-Math.sqrt(Math.abs(1.0 - Math.pow(rOutPerpendicular.length(), 2))))
    return rOutPerpendicular.add(rOutParallel)
  }
}
