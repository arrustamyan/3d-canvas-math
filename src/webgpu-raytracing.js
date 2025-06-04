import { loadImageBitmap } from './utils/network.js'
import raytracingShader from './shaders/raytracing.wgsl?raw'
import { createCube } from './utils/generator.js'
import './style.css'

async function main() {
  let blueNoiseBitmap = await loadImageBitmap('/blue-noise.png')
  let imageBitmap = await loadImageBitmap('/bricks.jpg')
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
    100.0, -0.5, 100.0, 1, 0,
    100.0, -0.5, -100.0, 1, 1,
    -100.0, -0.5, 100.0, 0, 0,

    -100.0, -0.5, -100.0, 0, 1,
    -100.0, -0.5, 100.0, 0, 0,
    100.0, -0.5, -100.0, 1, 1,
  ])

  let cube1 = createCube([0, 0, 0])
  let cube2 = createCube([-2, 0, -1])
  let cube3 = createCube([1.5, 0, 1])

  // Combine the original positions with the ground triangles
  const combinedPositions = new Float32Array(cube1.length + cube2.length + cube3.length + groundTriangles.length)
  combinedPositions.set(groundTriangles, 0)
  combinedPositions.set(cube1, groundTriangles.length)
  combinedPositions.set(cube2, groundTriangles.length + cube1.length)
  combinedPositions.set(cube3, groundTriangles.length + cube1.length + cube2.length)
  let positions = combinedPositions


  const linearSampler = device.createSampler({
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    magFilter: 'linear',
    minFilter: 'linear',
  })

  const nearestSampler = device.createSampler({
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    magFilter: 'nearest',
    minFilter: 'nearest',
  })

  const blueNoiseTexture = device.createTexture({
    label: 'texture',
    format: 'rgba8unorm',
    size: [blueNoiseBitmap.width, blueNoiseBitmap.height],
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const imageTexture = device.createTexture({
    label: 'texture',
    format: 'rgba8unorm',
    size: [imageBitmap.width, imageBitmap.height],
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const accumulationTextureA = device.createTexture({
    label: 'accumulation texture A',
    format: 'rgba32float',
    size: [canvas.width, canvas.height],
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
  });
  const accumulationTextureAView = accumulationTextureA.createView({})

  const accumulationTextureB = device.createTexture({
    label: 'accumulation texture B',
    format: 'rgba32float',
    size: [canvas.width, canvas.height],
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
  });
  const accumulationTextureBView = accumulationTextureB.createView({})

  const sampleCountBuffer = device.createBuffer({
    label: 'sample count uniform',
    size: 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

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
    primitive: {
      cullMode: 'none', // Disable face culling
    },
  })

  const bindGroup = device.createBindGroup({
    label: 'bind group',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: positionsBuffer } },
      { binding: 1, resource: linearSampler },
      { binding: 2, resource: nearestSampler },
      { binding: 3, resource: blueNoiseTexture.createView() },
      { binding: 4, resource: imageTexture.createView() },
      { binding: 5, resource: { buffer: sampleCountBuffer } },
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
  device.queue.copyExternalImageToTexture(
    { source: blueNoiseBitmap, flipY: true },
    { texture: blueNoiseTexture },
    { width: blueNoiseBitmap.width, height: blueNoiseBitmap.height },
  );
  device.queue.copyExternalImageToTexture(
    { source: imageBitmap, flipY: true },
    { texture: imageTexture },
    { width: imageBitmap.width, height: imageBitmap.height },
  );

  let sampleCount = 0;

  // Swap textures for double-buffering
  const accumulationTextureWriteView = accumulationTextureAView;
  const accumulationTextureReadView = accumulationTextureBView;

  // Update bind group for this frame
  const accumulationBindGroup = device.createBindGroup({
    label: 'bind group',
    layout: pipeline.getBindGroupLayout(1),
    entries: [
      { binding: 0, resource: accumulationTextureWriteView },
      { binding: 1, resource: accumulationTextureReadView }
    ],
  });

  function render() {
    document.getElementById('counter').innerText = `frame: ${sampleCount}`;
    // Update sample count uniform
    device.queue.writeBuffer(sampleCountBuffer, 0, new Uint32Array([sampleCount]));
    sampleCount++;

    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

    const encoder = device.createCommandEncoder({ label: 'our encoder' });
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setBindGroup(1, accumulationBindGroup);
    pass.draw(3);
    pass.end();

    // Copy write texture to read texture for next frame
    encoder.copyTextureToTexture(
      { texture: accumulationTextureA },
      { texture: accumulationTextureB },
      [canvas.width, canvas.height, 1]
    );

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
    device.queue.onSubmittedWorkDone().then(() => {
      // After the work is done, we can request the next frame
      if (sampleCount < 10000) {
        render();
        // requestAnimationFrame(render);
      }
    });

  }

  render()
}
main()
