import { Interval } from "./interval"
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

  /**
   *
   * @param {Ray} r
   */
  copy(r) {
    this.origin = r.origin
    this.direction = r.direction
  }
}

export class HitRecord {
  constructor() {
    this.p = new Vector3(0, 0, 0)
    this.normal = new Vector3(0, 0, 0)
    this.t = 0
    this.frontFace = false
    this.material = null
  }

  /**
   *
   * @param {Ray} ray
   * @param {Vector3} outwardNormal
   */
  setFaceNormal(ray, outwardNormal) {
    this.frontFace = ray.direction.dot(outwardNormal) < 0
    this.normal = this.frontFace ? outwardNormal : outwardNormal.multiplyScalar(-1)
  }

  /**
   *
   * @param {HitRecord} record
   */
  cloneTo(record) {
    record.p = this.p
    record.normal = this.normal
    record.t = this.t
    record.frontFace = this.frontFace
    record.material = this.material
  }
}

export class Hittable {
  hit() {
    throw new Error("Method 'hit' must be implemented.")
  }
}

export class HittableList extends Hittable {
  constructor() {
    super()
    this.hittables = []
  }

  /**
   *
   * @param {Hittable} hittable
   */
  add(hittable) {
    this.hittables.push(hittable)
  }

  clear() {
    this.hittables = []
  }

  /**
   *
   * @param {Ray} ray
   * @param {Interval} interval
   * @param {HitRecord} rec
   * @returns boolean
   */
  hit(ray, interval, rec) {
    const tempRec = new HitRecord()
    let hitAnything = false
    let closestSoFar = interval.max

    for (const hittable of this.hittables) {
      if (hittable.hit(ray, new Interval(interval.min, closestSoFar), tempRec)) {
        hitAnything = true
        closestSoFar = rec.t

        tempRec.cloneTo(rec)
      }
    }

    return hitAnything
  }
}

export class Sphere extends Hittable {
  constructor(center, radius, material) {
    super()
    this.center = center
    this.radius = radius
    this.material = material
  }

  /**
   *
   * @param {Ray} ray
   * @param {Interval} interval
   * @param {HitRecord} rec
   * @returns boolean
   */
  hit(ray, interval, rec) {
    const oc = this.center.sub(ray.origin)
    const a = Math.pow(ray.direction.length(), 2)
    const h = ray.direction.dot(oc)
    const c = Math.pow(oc.length(), 2) - Math.pow(this.radius, 2)

    const discriminant = h * h - a * c

    if (discriminant < 0) {
      return false;
    }

    const sqrtd = Math.sqrt(discriminant)
    let root = (h - sqrtd) / a

    if (!interval.surrounds(root)) {
      root = (h + sqrtd) / a
      if (!interval.surrounds(root)) {
        return false;
      }
    }

    rec.t = root
    rec.p = ray.at(rec.t)
    const outwardNormal = rec.p.sub(this.center).divideScalar(this.radius)
    rec.setFaceNormal(ray, outwardNormal)
    rec.material = this.material

    return true
  }

}
