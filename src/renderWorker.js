self.onmessage = async function (event) {
  const {
    width,
    height,
    hRangeStart,
    hRangeEnd,
    vRangeStart,
    vRangeEnd,
    // world,
  } = event.data
  console.log('starting rendering')

  const [module1, module2, module3, module4, module5] = await Promise.all([
    import('./utils/camera.js'),
    import('./utils/ray.js'),
    import('./utils/material.js'),
    import('./utils/vector3.js'),
    import('./utils/texture.js'),
  ])

  const { Camera } = module1
  const { HittableList, InfinitePlane, Sphere, Triangle } = module2
  const { Dielectric, Lambertian, Metal } = module3
  const { Vector3 } = module4
  const { SolidColor, CheckerTexture, ImageTexture } = module5

  const world = new HittableList()

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const imageData = ctx.createImageData(Math.floor(hRangeEnd) - Math.floor(hRangeStart), vRangeEnd - Math.floor(vRangeStart))

  const camera = new Camera(width, height, imageData)

  camera.widthRangeStart = Math.floor(hRangeStart)
  camera.widthRangeEnd = Math.floor(hRangeEnd)
  camera.heightRangeStart = Math.floor(vRangeStart)
  camera.heightRangeEnd = Math.floor(vRangeEnd)

  const imageTexture = new ImageTexture('/texture.jpeg', 650, 944)
  await imageTexture.load()

  const groundMaterial = new Lambertian(new CheckerTexture(10, new Vector3(0.8, 0.8, 0), new Vector3(0.2, 0.2, 0)))
  // const centerMaterial = new Lambertian(new SolidColor(new Vector3(0.7, 0.7, 0.7)))
  const centerMaterial = new Lambertian(imageTexture)
  const metalMaterial = new Metal(new Vector3(0.8, 0.8, 0.8))
  const dielectricMaterial = new Dielectric(1.5)

  // world.add(new Sphere(new Vector3(0, 0, -1.2), 0.5, centerMaterial))
  world.add(new Triangle(
    new Vector3(-0.2, -0.2, -0.2),
    new Vector3(0.2, -0.2, -0.2),
    new Vector3(0.2, 0.2, -0.2),
    centerMaterial,
  ))
  world.add(new Triangle(
    new Vector3(-0.2, -0.2, -0.2),
    new Vector3(0.2, 0.2, -0.2),
    new Vector3(-0.2, 0.2, -0.2),
    centerMaterial,
  ))

  world.add(new Triangle(
    new Vector3(-0.2, -0.2, -0.4),
    new Vector3(-0.2, -0.2, -0.2),
    new Vector3(-0.2, 0.2, -0.2),
    centerMaterial,
  ))

  world.add(new Triangle(
    new Vector3(-0.2, -0.2, -0.4),
    new Vector3(-0.2, 0.2, -0.2),
    new Vector3(-0.2, 0.2, -0.4),
    centerMaterial,
  ))

  world.add(new Triangle(
    new Vector3(-0.2, 0.2, -0.2),
    new Vector3(0.2, 0.2, -0.2),
    new Vector3(0.2, 0.2, -0.4),
    centerMaterial,
  ))

  world.add(new Triangle(
    new Vector3(-0.2, 0.2, -0.2),
    new Vector3(0.2, 0.2, -0.4),
    new Vector3(-0.2, 0.2, -0.4),
    centerMaterial,
  ))

  world.add(new Triangle(
    new Vector3(-0.2, -0.2, -0.4),
    new Vector3(0.2, -0.2, -0.4),
    new Vector3(0.2, 0.2, -0.4),
    centerMaterial,
  ))
  world.add(new Triangle(
    new Vector3(-0.2, -0.2, -0.4),
    new Vector3(0.2, 0.2, -0.4),
    new Vector3(-0.2, 0.2, -0.4),
    centerMaterial,
  ))


  // world.add(new Sphere(new Vector3(1.0, 0.0, -1.0), 0.5, metalMaterial))
  // world.add(new Sphere(new Vector3(0, -100.5, -1), 100, groundMaterial))
  world.add(new InfinitePlane(-0.2, groundMaterial))

  camera.render(world)

  self.postMessage({
    hRangeStart,
    hRangeEnd,
    vRangeStart,
    vRangeEnd,
    imageData,
  })
}
