const pi = 3.1415926;
const screenWidth = 858.0;
const screenHeight = 400.0;
const aspect = screenWidth / screenHeight;
const fov = 65.0 * pi / 180.0;
const lookFrom = vec3f(2.0, 0.0, - 4.2);
const lookAt = vec3f(0.0, 0.0, 0.0);
const vup = vec3f(0.0, 1.0, 0.0);
const w = normalize(lookFrom - lookAt);
const u = normalize(cross(vup, w));
const v = cross(w, u);
const focalLength = length(lookFrom - lookAt);
const h = tan(fov / 2.0);
const viewportHeight = 2.0 * h * focalLength;
const viewportWidth = viewportHeight * (screenWidth / screenHeight);
const viewportU = u * viewportWidth;
const viewportV = v * - viewportHeight;
const pixelDeltaU = viewportU / screenWidth;
const pixelDeltaV = viewportV / screenHeight;
const viewportUpperLeft = lookFrom - w * focalLength - viewportU / 2.0 - viewportV / 2.0;
const pixel00Location = viewportUpperLeft + pixelDeltaU / 2.0 + pixelDeltaV / 2.0;

@group(0) @binding(0)
var<storage, read> scene: array<f32>;
@group(0) @binding(1)
var ourSampler: sampler;
@group(0) @binding(2)
var blueNoiseTexture: texture_2d<f32>;

const pos = array(vec2f(- 1.0, - 1.0), vec2f(3.0, - 1.0), vec2f(- 1.0, 3.0));

fn intersectTriangle(rayOrigin: vec3f, rayDirection: vec3f, p0: vec3f, p1: vec3f, p2: vec3f, rec: ptr<function, HitRecord>) -> bool {
    var edge1 = p1 - p0;
    var edge2 = p2 - p0;
    var h = cross(rayDirection, edge2);
    var a = dot(edge1, h);

    if (a > - 1e-8 && a < 1e-8) {
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

    (*rec).t = t;
    (*rec).u = u;
    (*rec).v = v;

    return true;
}

fn hit(rayOrigin: vec3f, rayDirection: vec3f, record: ptr<function, HitRecord>) -> bool {
    var tempRecord: HitRecord;
    var closestSoFar = 1e8;
    var hitSomething = false;

    for (var k: u32 = 0; k < arrayLength(&scene); k += 9) {
        var p0 = vec3f(scene[k], scene[k + 1], scene[k + 2]);
        var p1 = vec3f(scene[k + 3], scene[k + 4], scene[k + 5]);
        var p2 = vec3f(scene[k + 6], scene[k + 7], scene[k + 8]);

        if (intersectTriangle(rayOrigin, rayDirection, p0, p1, p2, & tempRecord)) {
            hitSomething = true;

            if (tempRecord.t < closestSoFar && tempRecord.t > 0.001) {
                var normal = cross(p1 - p0, p2 - p0);

                closestSoFar = tempRecord.t;

                (*record).t = tempRecord.t;
                (*record).u = tempRecord.u;
                (*record).v = tempRecord.v;
                (*record).normal = normalize(normal);
            }
        }
    }

    return hitSomething;
}

fn rayColor(rayOrigin: vec3f, rayDirection: vec3f, screenCoord: vec2f) -> vec4f {
    var noise = textureSample(blueNoiseTexture, ourSampler, screenCoord);
    let azimuth = noise.r * 2.0 * 3.14159265359;
    let elevation = noise.g * 3.14159265359;
    let rand = noise.r * 2 - 1;

    // let perturbation = vec3<f32>(sin(elevation) * cos(azimuth), sin(elevation) * sin(azimuth), cos(elevation));
    let perturbation = vec3<f32>(rand, rand, rand);
    var record: HitRecord;

    var attenuation = vec3f(0.0, 0.0, 0.0);
    var currentOrigin = rayOrigin;
    var currentDirection = rayDirection;
    var bounceCount = 0.0;
    var hitSky = false;

    for (var i: u32 = 0; i < 10; i += 1) {
        var bounceColor = vec3f(0.0, 0.0, 0.0);
        if (hit(rayOrigin, currentDirection, & record)) {

            currentOrigin = currentOrigin + currentDirection * record.t;
            currentDirection = normalize((record.normal + perturbation)) - currentOrigin;

            // if (length(currentDirection) < 0.001) {
            //     currentDirection = record.normal - currentOrigin;
            // }

            bounceColor = vec3f(0.5, 0.5, 0.5);
        }
        else {
            var a = 0.5 * (rayDirection.y + 1.0);
            bounceColor = (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0);
            hitSky = true;
        }

        bounceCount += 1.0;

        if (bounceCount == 1.0) {
            attenuation = bounceColor;
        }
        else {
            attenuation *= bounceColor;
        }

        if (hitSky) {
            break;
        }
    }

    // return noise;
    // return vec4f(perturbation, 1.0);
    return vec4f(attenuation, 1.0);
}

struct Vertex {
    @builtin(vertex_index) vertex_index: u32,
}

struct HitRecord {
    t: f32,
    u: f32,
    v: f32,
    normal: vec3f,
}

@vertex
fn vs(vert: Vertex) -> @builtin(position) vec4f {
    return vec4f(pos[vert.vertex_index], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) position: vec4f) -> @location(0) vec4f {
    var i = position.x;
    var j = position.y;

    var rayOrigin = lookFrom;
    var rayDirection = normalize((pixel00Location + pixelDeltaU * i + pixelDeltaV * j) - rayOrigin);

    var uv = vec2f(position.x / screenWidth * aspect, 1 - position.y / screenHeight);

    return rayColor(rayOrigin, rayDirection, uv);
    // return textureSample(blueNoiseTexture, ourSampler, uv);
}
