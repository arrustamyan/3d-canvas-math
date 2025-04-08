import { cross, dot, identity, inv, log, matrix, multiply, norm } from 'mathjs'
import './style.css'

const canvas = document.querySelector('#main')
const ctx = canvas.getContext('2d')
const unitPhysicalSizePx = 20

canvas.width = window.innerWidth
canvas.height = window.innerHeight

class Vector4 {
  constructor(x, y, z, w = 1) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  /**
   * Multiply by the matrix and return the new vector
   * @param {Matrix4} n
   */
  multiply(n) {
    const result = multiply(matrix([this.x, this.y, this.z, this.w]), n.m)
    return new Vector4(...result.valueOf())
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
   * @param {Vector4} point point to be added
   */
  add(point) {
    this.points.push(point)
  }
}

class Camera {
  fov = 65
  transformationMatrix = new Matrix4()
  transformationMatrixInverse = new Matrix4()
  projectionMatrix = new Matrix4()

  constructor() {
    this.transformationMatrix.setPosition(0, 0, 0)
    this.transformationMatrixInverse = this.transformationMatrix.inverse()

    const aspectRatio = canvas.width / canvas.height
    const near = 0.1
    const far = 1000

    this.zoomX = 1 / Math.tan((this.fov * Math.PI) / 360)
    this.zoomY = this.zoomX * aspectRatio

    this.projectionMatrix.m.set([0, 0], this.zoomX)
    this.projectionMatrix.m.set([1, 1], this.zoomY)
    this.projectionMatrix.m.set([2, 2], (far + near) / (near - far))
    this.projectionMatrix.m.set([3, 2], (-2 * far * near) / (near - far))
    this.projectionMatrix.m.set([2, 3], -1)
  }

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
group.transformationMatrix.setPosition(0, 0, 0)
group.add(new Vector4(1, 1, 1))
group.add(new Vector4(-1, 1, 1))
group.add(new Vector4(-1, -1, 1))

group.add(new Vector4(-1, -1, 1))
group.add(new Vector4(1, -1, 1))
group.add(new Vector4(1, 1, 1))

group.add(new Vector4(-1, -1, -1))
group.add(new Vector4(-1, 1, -1))
group.add(new Vector4(1, 1, -1))

group.add(new Vector4(1, 1, -1))
group.add(new Vector4(1, -1, -1))
group.add(new Vector4(-1, -1, -1))

const camera = new Camera()
camera.setPosition(0, 0, 8)

const lightNormal = new Vector4(0, 0, -1)

function start(e) {
  // group.transformationMatrix.setRotationY(0)
  group.transformationMatrix.setRotationY(e / 1000)

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
  ctx.fillStyle = "white";
  const points = []
  const modelViewTransform = group.transformationMatrix.multiply(camera.transformationMatrixInverse).multiply(camera.projectionMatrix)
  group.points.forEach((point) => {
    points.push(point.multiply(modelViewTransform))
  })
  points.forEach((point) => {
    // console.log(point.x, point.y, point.z, point.w)
    ctx.fillRect(point.x * canvas.width / (2 * point.w) + canvas.width / 2 - 1, -(point.y * canvas.height / (2 * point.w)) + canvas.height / 2 - 1, 2, 2);
  })

  ctx.fillStyle = "red";

  for (let i = 0; i < points.length; i += 3) {

    const side1Vector = new Vector4(
      points[i + 1].x - points[i].x,
      points[i + 1].y - points[i].y,
      points[i + 1].z - points[i].z,
    )
    const side2Vector = new Vector4(
      points[i + 2].x - points[i].x,
      points[i + 2].y - points[i].y,
      points[i + 2].z - points[i].z,
    )

    const triNormal = cross([side1Vector.x, side1Vector.y, side1Vector.z], [side2Vector.x, side2Vector.y, side2Vector.z])
    const lightDotTriNormal = dot([lightNormal.x, lightNormal.y, lightNormal.z], triNormal)
    // const angle = Math.acos(Math.abs(lightDotTriNormal)) * (180 / Math.PI)

    // console.log(triNorsmal, lightDotTriNormal)

    if (lightDotTriNormal >= 0) {
      continue
    }

    ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(lightDotTriNormal / 40)})`

    ctx.beginPath()
    ctx.moveTo(points[i].x * canvas.width / (2 * points[i].w) + canvas.width / 2, -(points[i].y * canvas.height / (2 * points[i].w)) + canvas.height / 2)
    ctx.lineTo(points[i + 1].x * canvas.width / (2 * points[i + 1].w) + canvas.width / 2, -(points[i + 1].y * canvas.height / (2 * points[i + 1].w)) + canvas.height / 2)
    ctx.lineTo(points[i + 2].x * canvas.width / (2 * points[i + 2].w) + canvas.width / 2, -(points[i + 2].y * canvas.height / (2 * points[i + 2].w)) + canvas.height / 2)
    ctx.closePath()
    ctx.fill()
  }

  requestAnimationFrame(start)
}

start(0)
