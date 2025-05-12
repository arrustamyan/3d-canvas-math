import { fetchPositions } from './utils/fetchPositions.js'
import './style.css'

async function main() {
  const positions = await fetchPositions('/thpwp2IcJ8ZBoe9M5Rau')
  const adapter = await navigator.gpu?.requestAdapter()
  const device = await adapter?.requestDevice()

  console.log(positions)

  if (!device) {
    throw new Error('need a browser that supports WebGPU')
  }

  const canvas = document.querySelector('#main')
  canvas.width = Math.max(1, Math.min(window.innerWidth, device.limits.maxTextureDimension2D))
  canvas.height = Math.max(1, Math.min(window.innerHeight, device.limits.maxTextureDimension2D))
  const context = canvas.getContext('webgpu')
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
  context.configure({
    device,
    format: presentationFormat,
  })

  const positionsBuffer = device.createBuffer({
    label: 'positions buffer',
    size: positions.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  })

  const module = device.createShaderModule({
    label: 'our box shaders',
    code: /* wgsl */`
      const pi = 3.1415926;
      const screenWidth = 858.0;
      const screenHeight = 400.0;
      const aspect = screenWidth / screenHeight;
      const fov = 65.0 * pi / 180.0;
      const lookFrom = vec3f(0.0, 0.0, 3.2);
      const lookAt = vec3f(0.0, 0.0, -1.0);
      const vup = vec3f(0.0, 1.0, 0.0);
      const w = normalize(lookFrom - lookAt);
      const u = normalize(cross(vup, w));
      const v = cross(w, u);
      const focalLength = length(lookFrom - lookAt);
      const h = tan(fov / 2.0);
      const viewportHeight = 2.0 * h * focalLength;
      const viewportWidth = viewportHeight * (screenWidth / screenHeight);
      const viewportU = u * viewportWidth;
      const viewportV = v * -viewportHeight;
      const pixelDeltaU = viewportU / screenWidth;
      const pixelDeltaV = viewportV / screenHeight;
      const viewportUpperLeft = lookFrom - w * focalLength - viewportU / 2.0 - viewportV / 2.0;
      const pixel00Location = viewportUpperLeft + pixelDeltaU / 2.0 + pixelDeltaV / 2.0;

      @group(0) @binding(0) var<storage, read> scene: array<f32>;

      const pos = array(
        vec2f(-1.0, -1.0),
        vec2f(3.0, -1.0),
        vec2f(-1.0, 3.0),
      );

      const tri = array(
        vec3f(-0.2, -0.2, -0.2),
        vec3f(0.2, -0.2, -0.2),
        vec3f(0.2, 0.2, -0.2),
      );

      struct Vertex {
        @builtin(vertex_index) vertex_index: u32,
      }

      @vertex fn vs(vert: Vertex) -> @builtin(position) vec4f {
        return vec4f(pos[vert.vertex_index], 0.0, 1.0);
      }

      fn hit(rayOrigin: vec3f, rayDirection: vec3f, p0: vec3f, p1: vec3f, p2: vec3f) -> bool {
        var edge1 = p1 - p0;
        var edge2 = p2 - p0;
        var h = cross(rayDirection, edge2);
        var a = dot(edge1, h);

        if (a > -1e-8 && a < 1e-8) {
          return false;
        }

        var f = 1.0 / a;
        var s = rayOrigin - p0;
        var u = f * dot(s, h);
        if (u <= 0.0 || u > 1.0) {
          return false;
        }

        var q = cross(s, edge1);
        var v = f * dot(rayDirection, q);
        if (v <= 0.0 || u + v > 1.0) {
          return false;
        }

        var t = f * dot(edge2, q);
        if (t < 0.001) {
          return false;
        }

        return true;
      }

      @fragment fn fs(@builtin(position) position: vec4f) -> @location(0) vec4f {
        var i = position.x;
        var j = position.y;

        var rayOrigin = lookFrom;
        var rayDirection = normalize((pixel00Location + pixelDeltaU * i + pixelDeltaV * j) - rayOrigin);

        // scene is a list of coordinates. loop through the list and find the closest intersection using moller-trumbore algorithm
        for (var k: u32 = 0; k < arrayLength(&scene); k += 9) {
          var p0 = vec3f(scene[k], scene[k + 1], scene[k + 2]);
          var p1 = vec3f(scene[k + 3], scene[k + 4], scene[k + 5]);
          var p2 = vec3f(scene[k + 6], scene[k + 7], scene[k + 8]);

          if (hit(rayOrigin, rayDirection, p0, p1, p2)) {
            return vec4f(1, 0, 0, 1.0); // red color for intersection
          }
        }

        // if (hit(rayOrigin, rayDirection, tri[0], tri[1], tri[2])) {
        //   return vec4f(1, 0, 0, 1.0); // red color for intersection
        // }

        return vec4f(rayDirection, 1.0);
      }
    `,
  })

  const pipeline = device.createRenderPipeline({
    label: 'pipeline',
    layout: 'auto',
    vertex: {
      entryPoint: 'vs',
      module,
    },
    fragment: {
      entryPoint: 'fs',
      module,
      targets: [{ format: presentationFormat }],
    },
  })

  const bindGroup = device.createBindGroup({
    label: 'bind group',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: positionsBuffer } },
    ],
  })

  const renderPassDescriptor = {
    label: 'our basic canvas renderPass',
    colorAttachments: [
      {
        // view: <- to be filled out when we render
        clearValue: [0.3, 0.3, 0.3, 1],
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  }

  device.queue.writeBuffer(positionsBuffer, 0, positions);

  function render(t) {
    // Get the current texture from the canvas context and
    // set it as the texture to render to.
    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView()

    // make a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({ label: 'our encoder' })

    // make a render pass encoder to encode render specific commands
    const pass = encoder.beginRenderPass(renderPassDescriptor)
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.draw(3)  // call our vertex shader 3 times
    pass.end()

    const commandBuffer = encoder.finish()
    device.queue.submit([commandBuffer])

    requestAnimationFrame(render)
  }

  render()
}
main()
