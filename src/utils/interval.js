export class Interval {
  constructor(min = -Infinity, max = Infinity) {
    this.min = min
    this.max = max
  }

  /**
   *
   * @returns {number}
   */
  size() {
    return this.max - this.min
  }

  /**
   *
   * @param {number} x
   * @returns {boolean}
   */
  contains(x) {
    return x >= this.min && x <= this.max
  }

  /**
   *
   * @param {number} x
   * @returns {boolean}
   */
  surrounds(x) {
    return x > this.min && x < this.max
  }

  /**
   *
   * @param {number} x
   * @returns {number}
   */
  clamp(x) {
    if (x < this.min) return this.min
    if (x > this.max) return this.max
    return x
  }
}
