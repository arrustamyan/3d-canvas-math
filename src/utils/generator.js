export function createCube(center) {
    // stride: 3 + 2 for each vertex
    // return new Float32Array([])
    return new Float32Array([
        // Front face
        center[0] + 0.5, center[1] - 0.5, center[2] + 0.5, 1, 0,
        center[0] + 0.5, center[1] + 0.5, center[2] + 0.5, 1, 1,
        center[0] - 0.5, center[1] - 0.5, center[2] + 0.5, 0, 0,

        center[0] - 0.5, center[1] + 0.5, center[2] + 0.5, 0, 1,
        center[0] - 0.5, center[1] - 0.5, center[2] + 0.5, 0, 0,
        center[0] + 0.5, center[1] + 0.5, center[2] + 0.5, 1, 1,

        // Back face
        center[0] - 0.5, center[1] - 0.5, center[2] - 0.5, 1, 0,
        center[0] - 0.5, center[1] + 0.5, center[2] - 0.5, 1, 1,
        center[0] + 0.5, center[1] - 0.5, center[2] - 0.5, 0, 0,

        center[0] + 0.5, center[1] + 0.5, center[2] - 0.5, 0, 1,
        center[0] + 0.5, center[1] - 0.5, center[2] - 0.5, 0, 0,
        center[0] - 0.5, center[1] + 0.5, center[2] - 0.5, 1, 1,

        // Top face
        center[0] + 0.5, center[1] + 0.5, center[2] + 0.5, 1, 0,
        center[0] + 0.5, center[1] + 0.5, center[2] - 0.5, 1, 1,
        center[0] - 0.5, center[1] + 0.5, center[2] + 0.5, 0, 0,

        center[0] - 0.5, center[1] + 0.5, center[2] - 0.5, 0, 1,
        center[0] - 0.5, center[1] + 0.5, center[2] + 0.5, 0, 0,
        center[0] + 0.5, center[1] + 0.5, center[2] - 0.5, 1, 1,

        // Bottom face
        center[0] + 0.5, center[1] - 0.5, center[2] + 0.5, 0, 0,
        center[0] - 0.5, center[1] - 0.5, center[2] + 0.5, 1, 0,
        center[0] + 0.5, center[1] - 0.5, center[2] - 0.5, 0, 1,

        center[0] - 0.5, center[1] - 0.5, center[2] - 0.5, 1, 1,
        center[0] + 0.5, center[1] - 0.5, center[2] - 0.5, 0, 1,
        center[0] - 0.5, center[1] - 0.5, center[2] + 0.5, 1, 0,

        // Left face
        center[0] - 0.5, center[1] - 0.5, center[2] + 0.5, 1, 0,
        center[0] - 0.5, center[1] + 0.5, center[2] + 0.5, 1, 1,
        center[0] - 0.5, center[1] - 0.5, center[2] - 0.5, 0, 0,

        center[0] - 0.5, center[1] + 0.5, center[2] - 0.5, 0, 1,
        center[0] - 0.5, center[1] - 0.5, center[2] - 0.5, 0, 0,
        center[0] - 0.5, center[1] + 0.5, center[2] + 0.5, 1, 1,

        // Right face
        center[0] + 0.5, center[1] - 0.5, center[2] - 0.5, 1, 0,
        center[0] + 0.5, center[1] + 0.5, center[2] - 0.5, 1, 1,
        center[0] + 0.5, center[1] - 0.5, center[2] + 0.5, 0, 0,

        center[0] + 0.5, center[1] + 0.5, center[2] + 0.5, 0, 1,
        center[0] + 0.5, center[1] - 0.5, center[2] + 0.5, 0, 0,
        center[0] + 0.5, center[1] + 0.5, center[2] - 0.5, 1, 1,
    ])
}