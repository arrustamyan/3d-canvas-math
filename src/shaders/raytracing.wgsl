const pi = 3.1415926;
const screenWidth = 858.0;
const screenHeight = 858.0;
const aspect = screenWidth / screenHeight;
const fov = 65.0 * pi / 180.0;
const lookFrom = vec3f(0.0, 0.0, 1.0);
const lookAt = vec3f(0.0, 0.0, - 1.0);
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
const samplesPerPixel = 10.0;
const maxDepth = 10.0;

const sphere1 = Sphere(vec3f(0.0, 0.0, - 1.0), 0.5);
const sphere2 = Sphere(vec3f(0.0, - 100.5, - 1.0), 100.0);

const hittables = array(sphere1, sphere2);

@group(0) @binding(0)
var<storage, read> scene: array<f32>;
@group(0) @binding(1)
var ourSampler: sampler;
@group(0) @binding(2)
var blueNoiseTexture: texture_2d<f32>;

const pos = array(vec2f(- 1.0, - 1.0), vec2f(3.0, - 1.0), vec2f(- 1.0, 3.0));

fn xorshift32(seed: ptr<function, u32>) -> u32 {
    * seed ^= * seed << 13;
    * seed ^= * seed >> 17;
    * seed ^= * seed << 5;
    return * seed;
}

fn randomFloat(seed: ptr<function, u32>) -> f32 {
    return (f32(xorshift32(seed)) / 4294967295.0);
}

fn randomFloatMinMax(min: f32, max: f32, seed: ptr<function, u32>) -> f32 {
    return min + (max - min) * randomFloat(seed);
}

fn randomUnitVector(seed: ptr<function, u32>) -> vec3f {
    while (true) {
        var x = randomFloatMinMax(- 1.0, 1.0, seed);
        var y = randomFloatMinMax(- 1.0, 1.0, seed);
        var z = randomFloatMinMax(- 1.0, 1.0, seed);

        var p = vec3f(x, y, z);
        var lenghtSq = length(p) * length(p);

        if (lenghtSq > 1e-160 && lenghtSq < 1.0) {
            return p / sqrt(lenghtSq);
        }
    }

    return vec3f(0.0, 0.0, 0.0);
}

fn randomOnHemisphere(normal: vec3f, seed: ptr<function, u32>) -> vec3f {
    var inUnitSphere = randomUnitVector(seed);
    if (dot(inUnitSphere, normal) < 0.0) {
        return - inUnitSphere;
    }
    return inUnitSphere;
}

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

fn hitScene(rayOrigin: vec3f, rayDirection: vec3f, record: ptr<function, HitRecord>) -> bool {
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

// fn rayColor(rayOrigin: vec3f, rayDirection: vec3f, screenCoord: vec2f) -> vec4f {
//     var randX = rndomFloat(screenCoord);
//     var randY = rndomFloat(screenCoord);
//     var randZ = rndomFloat(screenCoord);

//     let perturbation = vec3<f32>(randX, randY, randZ);
//     var record: HitRecord;

//     var attenuation = vec3f(0.0, 0.0, 0.0);
//     var currentOrigin = rayOrigin;
//     var currentDirection = rayDirection;
//     var bounceCount = 0.0;
//     var hitSky = false;

//     for (var i: u32 = 0; i < 0; i += 1) {
//         var bounceColor = vec3f(0.0, 0.0, 0.0);
//         if (hit(rayOrigin, currentDirection, & record)) {

//             currentOrigin = currentOrigin + currentDirection * record.t;
//             currentDirection = normalize((record.normal + perturbation)) - currentOrigin;

//             // if (length(currentDirection) < 0.001) {
//             //     currentDirection = record.normal - currentOrigin;
//             // }

//             bounceColor = vec3f(0.5, 0.5, 0.5);
//         }
//         else {
//             var a = 0.5 * (rayDirection.y + 1.0);
//             bounceColor = (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0);
//             hitSky = true;
//         }

//         bounceCount += 1.0;

//         if (bounceCount == 1.0) {
//             attenuation = bounceColor;
//         }
//         else {
//             attenuation *= bounceColor;
//         }

//         if (hitSky) {
//             break;
//         }
//     }

//     return vec4f(currentDirection, 1.0);
//     // return vec4f(attenuation, 1.0);
// }

fn hit_sphere(center: vec3f, radius: f32, ray: Ray, rec: ptr<function, HitRecord>, interval: ptr<function, Interval>) -> bool {
    var oc = ray.origin - center;
    var a = dot(ray.direction, ray.direction);
    var b = 2.0 * dot(oc, ray.direction);
    var c = dot(oc, oc) - radius * radius;
    var discriminant = b * b - 4.0 * a * c;

    if (discriminant < 0) {
        return false;
    }

    var sqrtd = sqrt(discriminant);
    var root = (- b - sqrtd) / (2.0 * a);
    if (root < interval.min || root > interval.max) {
        root = (- b + sqrtd) / (2.0 * a);
        if (root < interval.min || root > interval.max) {
            return false;
        }
    }

    (*rec).t = root;
    (*rec).p = ray.origin + ray.direction * root;

    var normal = normalize(ray.origin + ray.direction * root - center);

    if (dot((*rec).normal, ray.direction) > 0.0) {
        (*rec).normal = - normal;
        (*rec).frontFace = false;
    }
    else {
        (*rec).normal = normal;
        (*rec).frontFace = true;
    }

    return true;
}

fn hit(ray: Ray, rec: ptr<function, HitRecord>, interval: ptr<function, Interval>) -> bool {
    var tempRec: HitRecord;
    var hitSomething = false;

    for (var i: u32 = 0; i < 2u; i += 1) {
        if (hit_sphere(hittables[i].center, hittables[i].radius, ray, & tempRec, interval)) {
            hitSomething = true;
            interval.max = tempRec.t;
            * rec = tempRec;
        }
    }
    return hitSomething;
}

fn rayColor(ray: Ray) -> vec3f {
    var rec: HitRecord;
    var interval = Interval(0.001, 1e8);
    if (hit(ray, & rec, & interval)) {
        return 0.5 * rec.normal + vec3f(1.0, 1.0, 1.0);
    }

    var a = 0.5 * (ray.direction.y + 1.0);
    var bounceColor = (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0);
    return bounceColor;
}

fn skyColor(ray: Ray) -> vec3f {
    var a = 0.5 * (ray.direction.y + 1.0);
    return (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0);
}

fn renderPixel(i: f32, j: f32) -> vec4f {
    let uv = vec2f(i / screenWidth, j / screenHeight);
    var sample = textureSample(blueNoiseTexture, ourSampler, uv);
    var seed: u32 = u32(sample.x * 1000.0) * 1000000000u;

    var rec: HitRecord;
    var interval = Interval(0.001, 1e8);

    var color = vec3f(0.0, 0.0, 0.0);

    for (var s = 0.0; s < samplesPerPixel; s += 1.0) {
        var screenCoord = vec2f(i, j);
        var ray = getRay(screenCoord, & seed);

        var coefficient = 1.0;

        for (var k = 0.0; k < maxDepth; k += 1.0) {
            if (hit(ray, & rec, & interval)) {
                ray.origin = rec.p;
                ray.direction = randomOnHemisphere(rec.normal, & seed);
                coefficient *= 0.5;
            } else {
                break;
            }
        }

        color += (coefficient * skyColor(ray));
        // color += vec3f(1.0, 0.0, 0.0);

    }

    return vec4f(color / samplesPerPixel, 1.0);
}

fn getRay(screenCoord: vec2f, seed: ptr<function, u32>) -> Ray {
    var ray: Ray;
    var offset = vec2f(randomFloat(seed) - 0.5, randomFloat(seed) - 0.5);
    var pixel = pixel00Location + pixelDeltaU * (screenCoord.x + offset.x) + pixelDeltaV * (screenCoord.y + offset.y);
    ray.origin = lookFrom;
    ray.direction = normalize(pixel - ray.origin);
    return ray;
}

struct Vertex {
    @builtin(vertex_index) vertex_index: u32,
}

struct HitRecord {
    t: f32,
    p: vec3f,
    u: f32,
    v: f32,
    normal: vec3f,
    frontFace: bool,
}

struct Ray {
    origin: vec3f,
    direction: vec3f,
}

struct Interval {
    min: f32,
    max: f32,
}

struct Sphere {
    center: vec3f,
    radius: f32,
}

struct Seed {
    v: u32,
}

@vertex
fn vs(vert: Vertex) -> @builtin(position) vec4f {
    return vec4f(pos[vert.vertex_index], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) position: vec4f) -> @location(0) vec4f {
    // var uv = vec2f(position.x / screenWidth * aspect, 1 - position.y / screenHeight);
    // var rayOrigin = lookFrom;
    // var rayDirection = normalize((pixel00Location + pixelDeltaU * i + pixelDeltaV * j) - rayOrigin);
    // return rayColor(rayOrigin, rayDirection, uv);

    var i = position.x;
    var j = position.y;

    return renderPixel(i, j);
    // return vec4f(r, b, g, 1.0);
}
