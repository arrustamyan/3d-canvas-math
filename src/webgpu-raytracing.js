import { fetchPositions } from './utils/fetchPositions.js'
import raytracingShader from './shaders/raytracing.wgsl?raw'
import './style.css'

async function main() {
  let positions = await fetchPositions('/thpwp2IcJ8ZBoe9M5Rau')
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

  // Add two triangles to form a ground
  const groundTriangles = new Float32Array([
    // First triangle
    -10.0, -10.0, -2.0,  // Bottom-left
    10.0, -10.0, -2.0,  // Bottom-right
    -10.0, 10.0, -2.0,  // Top-left

    // Second triangle
    1.0, -1.0, -2.0,  // Bottom-right
    1.0, 0.0, -2.0,  // Top-right
    -1.0, 0.0, -2.0,  // Top-left
  ])

  // Combine the original positions with the ground triangles
  const combinedPositions = new Float32Array(positions.length + groundTriangles.length)
  combinedPositions.set(positions)
  combinedPositions.set(groundTriangles, positions.length)
  positions = combinedPositions

  const positionsBuffer = device.createBuffer({
    label: 'positions buffer',
    size: positions.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  })

  const module = device.createShaderModule({
    label: 'our box shaders',
    code: raytracingShader,
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
