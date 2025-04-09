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
  devideScalar(t) {
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
    return this.devideScalar(length)
  }
}
