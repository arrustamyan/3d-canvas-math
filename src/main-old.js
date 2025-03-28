import './style.css'

const canvas = document.querySelector('#main')
const ctx = canvas.getContext('2d')
const unitPhysicalSizePx = 20

function cofactor(m, i, j) {}

class Vector3 {
  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  /**
   * Multiply by the matrix and return the new vector
   * @param {Matrix3} m
   */
  multiplyBy(m) {
    const x = this.x * m.e11 + this.y * m.e21 + this.z * m.e31 + m.e41
    const y = this.x * m.e12 + this.y * m.e22 + this.z * m.e32 + m.e42
    const z = this.x * m.e13 + this.y * m.e23 + this.z * m.e33 + m.e43
    return new Vector3(x, y, z)
  }
}

class Matrix4 {
  constructor(
    e11 = 1, e12 = 0, e13 = 0, e14 = 0,
    e21 = 0, e22 = 1, e23 = 0, e24 = 0,
    e31 = 0, e32 = 0, e33 = 1, e34 = 0,
    e41 = 0, e42 = 0, e43 = 0, e44 = 1,
  ) {
    this.e11 = e11
    this.e12 = e12
    this.e13 = e13
    this.e14 = e14
    this.e21 = e21
    this.e22 = e22
    this.e23 = e23
    this.e24 = e24
    this.e31 = e31
    this.e32 = e32
    this.e33 = e33
    this.e34 = e34
    this.e41 = e41
    this.e42 = e42
    this.e43 = e43
    this.e44 = e44
  }

  /**
   * Multiply by a matrix and return the new matrix
   * @param {Matrix4} m 
   */
  multiplyBy(m) {
    const n = new Matrix4()

    n.e11 = this.e11 * m.e11 + this.e12 * m.e21 + this.e13 * m.e31 + this.e14 * m.e41
    n.e12 = this.e11 * m.e12 + this.e12 * m.e22 + this.e13 * m.e32 + this.e14 * m.e42
    n.e13 = this.e11 * m.e13 + this.e12 * m.e23 + this.e13 * m.e33 + this.e14 * m.e43
    n.e14 = this.e11 * m.e14 + this.e12 * m.e24 + this.e13 * m.e34 + this.e14 * m.e44

    n.e21 = this.e21 * m.e11 + this.e22 * m.e21 + this.e23 * m.e31 + this.e24 * m.e41
    n.e22 = this.e21 * m.e12 + this.e22 * m.e22 + this.e23 * m.e32 + this.e24 * m.e42
    n.e23 = this.e21 * m.e13 + this.e22 * m.e23 + this.e23 * m.e33 + this.e24 * m.e43
    n.e24 = this.e21 * m.e14 + this.e22 * m.e24 + this.e23 * m.e34 + this.e24 * m.e44

    n.e31 = this.e31 * m.e11 + this.e32 * m.e21 + this.e33 * m.e31 + this.e34 * m.e41
    n.e32 = this.e31 * m.e12 + this.e32 * m.e22 + this.e33 * m.e32 + this.e34 * m.e42
    n.e33 = this.e31 * m.e13 + this.e32 * m.e23 + this.e33 * m.e33 + this.e34 * m.e43
    n.e34 = this.e31 * m.e14 + this.e32 * m.e24 + this.e33 * m.e34 + this.e34 * m.e44

    n.e41 = this.e41 * m.e11 + this.e42 * m.e21 + this.e43 * m.e31 + this.e44 * m.e41
    n.e42 = this.e41 * m.e12 + this.e42 * m.e22 + this.e43 * m.e32 + this.e44 * m.e42
    n.e43 = this.e41 * m.e13 + this.e42 * m.e23 + this.e43 * m.e33 + this.e44 * m.e43
    n.e44 = this.e41 * m.e14 + this.e42 * m.e24 + this.e43 * m.e34 + this.e44 * m.e44

    return n
  }

  setPosition(x, y, z) {
    this.e41 = x
    this.e42 = y
    this.e43 = z
  }

  rotateX(theta) {
    this.e22 = Math.cos(theta)
    this.e23 = Math.sin(theta)
    this.e32 = -Math.sin(theta)
    this.e33 = Math.cos(theta)
  }

  rotateY(theta) {
    this.e11 = Math.cos(theta)
    this.e13 = -Math.sin(theta)
    this.e31 = Math.sin(theta)
    this.e33 = Math.cos(theta)
  }

  rotateZ(theta) {
    this.e11 = Math.cos(theta)
    this.e12 = Math.sin(theta)
    this.e21 = -Math.sin(theta)
    this.e22 = Math.cos(theta)
  }

  determinant() {
    return this.e11 * (this.e22 * (this.e33 * this.e44 - this.e34 * this.e43) + this.e23 * (this.e34 * this.e42 - this.e32 * this.e44) + this.e24 * (this.e32 * this.e43 - this.e33 * this.e42))
         - this.e12 * (this.e21 * (this.e33 * this.e44 - this.e34 * this.e43) + this.e23 * (this.e34 * this.e41 - this.e31 * this.e44) + this.e24 * (this.e31 * this.e43 - this.e33 * this.e41))
         + this.e13 * (this.e21 * (this.e32 * this.e44 - this.e34 * this.e42) + this.e22 * (this.e34 * this.e41 - this.e31 * this.e44) + this.e24 * (this.e31 * this.e42 - this.e32 * this.e41))
         - this.e14 * (this.e21 * (this.e32 * this.e43 - this.e33 * this.e42) + this.e22 * (this.e33 * this.e41 - this.e31 * this.e43) + this.e23 * (this.e31 * this.e42 - this.e32 * this.e41))
  }

  transpose() {
    return new Matrix4()
  }

  invert() {
    return new Matrix4()
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
    this.transformationMatrixInverse.setPosition(-x, -y, -z)
  }

  setRotationX(theta) {
    this.transformationMatrix.rotateX(theta)
    this.transformationMatrixInverse.rotateX(-theta)
  }

  setRotationY(theta) {
    this.transformationMatrix.rotateY(theta)
    this.transformationMatrixInverse.rotateY(-theta)
  }

  setRotationZ(theta) {
    this.transformationMatrix.rotateZ(theta)
    this.transformationMatrixInverse.rotateZ(-theta)
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
// camera.setRotationX(Math.PI / 16)
camera.setPosition(0, 0, -3)

function start(e) {
  camera.setRotationY(e / 1000)
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
  ctx.fillStyle = "green";
  const points = []
  const modelViewTransform = group.transformationMatrix.multiplyBy(camera.transformationMatrixInverse)
  group.points.forEach((point) => {
    points.push(point.multiplyBy(modelViewTransform))
  })
  points.forEach((point) => {
    ctx.fillRect(point.x * unitPhysicalSizePx + canvas.clientWidth / 2, -(point.y * unitPhysicalSizePx) + canvas.clientHeight / 2, 4, 4);
  })
  // ctx.drawImage(image, origin.x, origin.y, d.x, d.y);
  requestAnimationFrame(start)
}

start()
