import './style.css'
import { Vector3 } from './utils/vector3'
import { HittableList, Sphere } from './utils/ray'

import { Camera } from './utils/camera'
import { Dielectric, Lambertian, Metal } from './utils/material'

const camera = new Camera()

const groundMaterial = new Lambertian(new Vector3(0.8, 0.8, 0))
const centerMaterial = new Lambertian(new Vector3(0.7, 0.3, 0.3))
const metalMaterial = new Metal(new Vector3(0.8, 0.8, 0.8))
const dielectricMaterial = new Dielectric(1.5)

const world = new HittableList()
world.add(new Sphere(new Vector3(0, 0, -1.2), 0.5, centerMaterial))
world.add(new Sphere(new Vector3(-1.0, 0.0, -1.0), 0.5, dielectricMaterial))
world.add(new Sphere(new Vector3(1.0, 0.0, -1.0), 0.5, metalMaterial))
world.add(new Sphere(new Vector3(0, -100.5, -1), 100, groundMaterial))

const now = performance.now()

camera.render(world)

console.log('render time', performance.now() - now)
