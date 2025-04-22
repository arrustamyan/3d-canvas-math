import { Vector3 } from "./vector3.js"

export class Texture { }

export class SolidColor extends Texture {
  constructor(albedo) {
    super()
    this.albedo = albedo
  }

  value(u, v, p) {
    return this.albedo
  }
}

export class CheckerTexture extends Texture {
  constructor(scale, odd, even) {
    super()
    this.scale = scale
    this.odd = odd
    this.even = even
  }
  value(u, v, p) {
    const sines = Math.sin(this.scale * p.x) * Math.sin(this.scale * p.y) * Math.sin(this.scale * p.z)
    return sines < 0 ? this.odd : this.even
  }
}

export class ImageTexture extends Texture {
  constructor(imageURL, width, height) {
    super()
    this.imageURL = imageURL
    this.width = width
    this.height = height
  }

  load() {
    return new Promise((resolve, reject) => {
      fetch(this.imageURL, {
        method: "GET",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          return response.blob();
        })
        .then((blob) => {
          const reader = new FileReader();
          reader.onload = () => {
            createImageBitmap(blob).then((bitmap) => {
              this.prepareImageData(bitmap);
              resolve();
            });
          };
          reader.onerror = () => reject(new Error("Failed to read image blob"));
          reader.readAsArrayBuffer(blob);
        })
        .catch((err) => reject(err));
    })
  }

  prepareImageData(bitmap) {
    const canvas = new OffscreenCanvas(this.width, this.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, this.width, this.height);
    const imageData = ctx.getImageData(0, 0, this.width, this.height);
    this.imageData = imageData.data; // Store pixel data
  }

  value(u, v, o) {
    //u = i * u2 + j * u3 + (1 - i - j) * u1
    //v = i * v2 + j * v3 + (1 - i - j) * v1

    const localU = (u + v) * 1
    const localV = v * 1

    // return new Vector3(localU, localV, 0)
    const i = Math.floor(localU * this.width)
    const j = Math.floor((1 - localV) * this.height - 0.001)
    if (i < 0 || i >= this.width || j < 0 || j >= this.height) {
      return new Vector3(1, 1, 1)
    }
    const pixelIndex = (j * this.width + i) * 4
    return new Vector3(
      this.imageData[pixelIndex] / 255,
      this.imageData[pixelIndex + 1] / 255,
      this.imageData[pixelIndex + 2] / 255,
    )
  }
}
