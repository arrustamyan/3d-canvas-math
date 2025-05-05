import { fetchPositions } from './utils/fetchPositions.js'
import './style.css'

async function main() {
  const positions = await fetchPositions('/thpwp2IcJ8ZBoe9M5Rau')
  const adapter = await navigator.gpu?.requestAdapter()
  const device = await adapter?.requestDevice()

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

  const time = new Float32Array(1)
  time[0] = 0.0

  const metaBuffer = device.createBuffer({
    label: 'uniform buffer',
    size: 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })

  const storageBuffer = device.createBuffer({
    label: 'vertex buffer',
    size: positions.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  })

  const module = device.createShaderModule({
    label: 'our box shaders',
    code: /* wgsl */`
      const pi = 3.1415926;
      const w = 1280.0;
      const h = 434.0;
      const aspect = w / h;
      const fov = 65.0;
      const zoomX = 1.0 / tan(fov * pi / 360.0);
      const zoomY = aspect * zoomX;
      const near = 0.1;
      const far = 100.0;

      const c = cos(pi / 4.0);
      const s = sin(pi / 4.0);

      const projection = mat4x4<f32>(
        vec4<f32>(zoomX, 0.0, 0.0, 0.0),
        vec4<f32>(0.0, zoomY, 0.0, 0.0),
        vec4<f32>(0.0, 0.0, (far + near) / (far - near), -1.0),
        vec4<f32>(0.0, 0.0, -(2.0 * far * near) / (near - far), 0.0)
      );

      @group(0) @binding(0) var<uniform> time: f32;

      struct Vertex {
        @location(0) position: vec3f,
      }

      @vertex fn vs(vert: Vertex) -> @builtin(position) vec4f {
        var c = cos(time / 1000.0);
        var s = sin(time / 1000.0);

        var transformation = mat4x4<f32>(
          vec4<f32>(c, 0.0, s, 0.0),
          vec4<f32>(0.0, 1.0, 0.0, 0.0),
          vec4<f32>(-s, 0.0, c, 10.0),
          vec4<f32>(0.0, 0.0, 0.0, 1.0)
        );

        var tv = vec4f(vert.position, 1) * transformation * projection;
        return vec4f(tv.xyz, tv.z);
      }

      @fragment fn fs() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }
    `,
  })

  const pipeline = device.createRenderPipeline({
    label: 'pipeline',
    layout: 'auto',
    vertex: {
      entryPoint: 'vs',
      module,
      buffers: [
        {
          arrayStride: 3 * 4,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
          ],
        },
      ],
    },
    fragment: {
      entryPoint: 'fs',
      module,
      targets: [{ format: presentationFormat }],
    },
  })

  const bindGroup = device.createBindGroup({
    label: 'time bind group',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: metaBuffer } },
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

  device.queue.writeBuffer(storageBuffer, 0, positions);

  function render(t) {
    time[0] = t
    device.queue.writeBuffer(metaBuffer, 0, time)

    // Get the current texture from the canvas context and
    // set it as the texture to render to.
    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView()

    // make a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({ label: 'our encoder' })

    // make a render pass encoder to encode render specific commands
    const pass = encoder.beginRenderPass(renderPassDescriptor)
    pass.setPipeline(pipeline)
    pass.setVertexBuffer(0, storageBuffer)
    pass.setBindGroup(0, bindGroup)
    pass.draw(positions.length / 3)  // call our vertex shader 3 times
    pass.end()

    const commandBuffer = encoder.finish()
    device.queue.submit([commandBuffer])

    requestAnimationFrame(render)
  }

  render()
}
main()
