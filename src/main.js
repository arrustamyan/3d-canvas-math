import { identity, inv, log, matrix, multiply } from 'mathjs'
import './style.css'

const canvas = document.querySelector('#main')
const ctx = canvas.getContext('2d')
const unitPhysicalSizePx = 20

class Vector3 {
  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  /**
   * Multiply by the matrix and return the new vector
   * @param {Matrix4} n
   */
  multiply(n) {
    const result = multiply(matrix([this.x, this.y, this.z, 1]), n.m)
    return new Vector3(...result.valueOf())
  }
}

class Matrix4 {
  constructor() {
    this.m = identity(4)
  }

  inverse() {
    const r = new Matrix4()
    r.m = inv(this.m)
    return r
  }

  setPosition(x, y, z) {
    this.m.set([3, 0], x)
    this.m.set([3, 1], y)
    this.m.set([3, 2], z)
  }

  applyMatrix(n) {
    this.m = multiply(this.m, n.m)
  }

  multiply(n) {
    const r = new Matrix4()
    r.m = multiply(this.m, n.m)
    return r
  }

  setRotationX(theta) {
    const c = Math.cos(theta)
    const s = Math.sin(theta)

    this.m.set([1, 1], c)
    this.m.set([1, 2], s)
    this.m.set([2, 1], -s)
    this.m.set([2, 2], c)
  }

  setRotationY(theta) {
    const c = Math.cos(theta)
    const s = Math.sin(theta)

    this.m.set([0, 0], c)
    this.m.set([0, 2], -s)
    this.m.set([2, 0], s)
    this.m.set([2, 2], c)
  }
}

class Group {
  points = []
  transformationMatrix = new Matrix4()

  /**
   * Add a point to the group
   * @param {Vector3} point point to be added
   */
  add(point) {
    this.points.push(point)
  }
}

class Camera {
  transformationMatrix = new Matrix4()
  transformationMatrixInverse = new Matrix4()

  setPosition(x, y, z) {
    this.transformationMatrix.setPosition(x, y, z);
    this.transformationMatrixInverse = this.transformationMatrix.inverse()
  }

  setRotationX(theta) {
    this.transformationMatrix.setRotationX(theta)
    this.transformationMatrixInverse = this.transformationMatrix.inverse()
  }

  setRotationY(theta) {
    this.transformationMatrix.setRotationY(theta)
    this.transformationMatrixInverse = this.transformationMatrix.inverse()
  }

}

class Renderer {
  render() { }
}

const group = new Group()
group.transformationMatrix.setPosition(1, 1, 5)
group.add(new Vector3(-1, 1, 1))
group.add(new Vector3(-1, 1, -1))
group.add(new Vector3(-1, -1, 1))
group.add(new Vector3(-1, -1, -1))
group.add(new Vector3(1, 1, 1))
group.add(new Vector3(1, -1, 1))
group.add(new Vector3(1, 1, -1))
group.add(new Vector3(1, -1, -1))

const camera = new Camera()
camera.setPosition(0, 0, 0)

function start(e) {
  camera.setRotationY(e / 1000)

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
  ctx.fillStyle = "green";
  const points = []
  const modelViewTransform = group.transformationMatrix.multiply(camera.transformationMatrixInverse)
  group.points.forEach((point) => {
    points.push(point.multiply(modelViewTransform))
  })
  points.forEach((point) => {
    ctx.fillRect(point.x * unitPhysicalSizePx + canvas.clientWidth / 2, -(point.y * unitPhysicalSizePx) + canvas.clientHeight / 2, 4, 4);
  })
  requestAnimationFrame(start)
}

start(0)
