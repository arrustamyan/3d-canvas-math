import './style.css'
import { Vector3 } from './utils/vector3'
import { HittableList, InfinitePlane, Sphere } from './utils/ray'

import { Camera } from './utils/camera'
import { Dielectric, Lambertian, Metal } from './utils/material'

const width = window.innerWidth
const height = window.innerHeight

const canvas = document.querySelector('#main')
const ctx = canvas.getContext('2d')
const imageData = ctx.createImageData(width, height)

canvas.width = width
canvas.height = height

const camera = new Camera(width, height, imageData)

const groundMaterial = new Lambertian(new Vector3(0.8, 0.8, 0))
const centerMaterial = new Lambertian(new Vector3(0.7, 0.3, 0.3))
const metalMaterial = new Metal(new Vector3(0.8, 0.8, 0.8))
const dielectricMaterial = new Dielectric(1.5)

const world = new HittableList()
world.add(new Sphere(new Vector3(0, 0, -1.2), 0.5, centerMaterial))
world.add(new Sphere(new Vector3(-1.0, 0.0, -1.0), 0.5, dielectricMaterial))
world.add(new Sphere(new Vector3(1.0, 0.0, -1.0), 0.5, metalMaterial))
// world.add(new Sphere(new Vector3(0, -100.5, -1), 100, groundMaterial))
world.add(new InfinitePlane(-1, groundMaterial))

const now = performance.now()

const worker1 = new Worker('./src/incrementalRenderWorker.js')
const worker2 = new Worker('./src/incrementalRenderWorker.js')
const worker3 = new Worker('./src/incrementalRenderWorker.js')
const worker4 = new Worker('./src/incrementalRenderWorker.js')

function onMessage(event) {
  const {
    hRangeStart,
    hRangeEnd,
    vRangeStart,
    vRangeEnd,
    imageData,
  } = event.data

  // console.log('received from worker', imageData)
  ctx.putImageData(imageData, hRangeStart, vRangeStart)

  // console.log('worker render time', performance.now() - now)
}

worker1.onmessage = onMessage
worker2.onmessage = onMessage
worker3.onmessage = onMessage
worker4.onmessage = onMessage

worker1.postMessage({
  width,
  height,
  hRangeStart: 0,
  hRangeEnd: width / 2,
  vRangeStart: 0,
  vRangeEnd: height / 2,
  world,
})

worker2.postMessage({
  width,
  height,
  hRangeStart: width / 2,
  hRangeEnd: width,
  vRangeStart: 0,
  vRangeEnd: height / 2,
})

worker3.postMessage({
  width,
  height,
  hRangeStart: 0,
  hRangeEnd: width / 2,
  vRangeStart: height / 2,
  vRangeEnd: height,
  world,
})

worker4.postMessage({
  width,
  height,
  hRangeStart: width / 2,
  hRangeEnd: width,
  vRangeStart: height / 2,
  vRangeEnd: height,
})

// camera.render(world)

// ctx.putImageData(camera.imageData, 0, 0)

console.log('render time', performance.now() - now)
