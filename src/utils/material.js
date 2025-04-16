import { randomNumber } from "./math"
import { HitRecord, Ray } from "./ray"
import { Vector3 } from "./vector3"

export class Material {
  scatter(rayIn, rec, attenuation, scattered) {
    return new Error("Method 'scatter' must be implemented.")
  }
}

export class Lambertian extends Material {
  constructor(albedo) {
    super()
    this.albedo = albedo
  }

  /**
   *
   * @param {Ray} rayIn
   * @param {HitRecord} rec
   * @param {Vector3} attenuation
   * @param {Ray} scattered
   * @returns
   */
  scatter(rayIn, rec, attenuation, scattered) {
    const scatterDirection = rec.normal.add(new Vector3().randomUnit())

    if (scatterDirection.isNearZero()) {
      scatterDirection.copy(rec.normal)
    }
    scattered.copy(new Ray(rec.p, scatterDirection.sub(rec.p)))
    attenuation.copy(this.albedo)
    return true
  }
}

export class Metal extends Material {
  constructor(albedo) {
    super()
    this.albedo = albedo
  }

  /**
   *
   * @param {Ray} rayIn
   * @param {HitRecord} rec
   * @param {Vector3} attenuation
   * @param {Ray} scattered
   * @returns
   */
  scatter(rayIn, rec, attenuation, scattered) {
    const reflected = rayIn.direction.reflect(rec.normal)

    scattered.copy(new Ray(rec.p, reflected))
    attenuation.copy(this.albedo)
    return true
  }
}

/**
 *      attenuation = color(1.0, 1.0, 1.0);
        double ri = rec.front_face ? (1.0/refraction_index) : refraction_index;

        vec3 unit_direction = unit_vector(r_in.direction());
        vec3 refracted = refract(unit_direction, rec.normal, ri);

        scattered = ray(rec.p, refracted);
        return true;
 */

export class Dielectric extends Material {
  constructor(refractionIndex) {
    super()
    this.refractionIndex = refractionIndex
  }

  /**
   *
   * @param {Ray} rayIn
   * @param {HitRecord} rec
   * @param {Vector3} attenuation
   * @param {Ray} scattered
   * @returns
   */
  scatter(rayIn, rec, attenuation, scattered) {
    attenuation.copy(new Vector3(1.0, 1.0, 1.0))
    const refractionIndex = rec.frontFace ? 1.0 / this.refractionIndex : this.refractionIndex
    const unitDirection = rayIn.direction.unit()

    const cosTheta = Math.min(unitDirection.multiplyScalar(-1).dot(rec.normal), 1.0)
    const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta)

    const cannotRefract = refractionIndex * sinTheta > 1.0
    let direction

    if (cannotRefract || this.reflectance(cosTheta, refractionIndex) > randomNumber()) {
      direction = unitDirection.reflect(rec.normal)
    } else {
      direction = unitDirection.refract(rec.normal, refractionIndex)
    }

    scattered.copy(new Ray(rec.p, direction))
    return true
  }

  reflectance(cosine, refractionIndex) {
    // Schlick's approximation for reflectance
    const r0 = ((1 - refractionIndex) / (1 + refractionIndex)) ** 2
    return r0 + (1 - r0) * (1 - cosine) ** 5
  }
}
