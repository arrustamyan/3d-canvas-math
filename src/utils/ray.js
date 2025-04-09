import { Vector3 } from "./vector3"

export class Ray {
  /**
   * 
   * @param {Vector3} origin 
   * @param {Vector3} direction 
   */
  constructor(origin, direction) {
    this.origin = origin
    this.direction = direction
  }

  /**
   * 
   * @param {number} t 
   * @returns {Vector3}
   */
  at(t) {
    return this.origin.add(this.direction.multiplyScalar(t))
  }
}
