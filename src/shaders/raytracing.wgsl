const pi = 3.1415926;
const screenWidth = 858.0;
const screenHeight = 858.0;
const aspect = screenWidth / screenHeight;
const fov = 65.0 * pi / 180.0;
const lookFrom = vec3f(0.5, 0.5, 3.5);
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
const samplesPerPixel = 50.0;
const maxDepth = 10.0;

const sphere1 = Sphere(vec3f(- 2.0, - 0.5, - 1.0), 0.5);
const sphere2 = Sphere(vec3f(0.0, - 100.5, - 1.0), 100.0);

const hittables = array(sphere1);

@group(0) @binding(0)
var<storage, read> scene: array<f32>;
@group(0) @binding(1)
var linearSampler: sampler;
@group(0) @binding(2)
var nearestSampler: sampler;
@group(0) @binding(3)
var blueNoiseTexture: texture_2d<f32>;
@group(0) @binding(4)
var imageTexture: texture_2d<f32>;
@group(0) @binding(5)
var imageNormalTexture: texture_2d<f32>;

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

fn hit_scene(rayOrigin: vec3f, rayDirection: vec3f, record: ptr<function, HitRecord>) -> bool {
    var tempRecord: HitRecord;
    var closestSoFar = 1e8;
    var hitSomething = false;

    for (var k: u32 = 0; k < arrayLength(&scene); k += 15) {
        var p0 = vec3f(scene[k], scene[k + 1], scene[k + 2]);
        var p1 = vec3f(scene[k + 5], scene[k + 6], scene[k + 7]);
        var p2 = vec3f(scene[k + 10], scene[k + 11], scene[k + 12]);

        if (intersectTriangle(rayOrigin, rayDirection, p0, p1, p2, & tempRecord)) {
            hitSomething = true;

            if (tempRecord.t < closestSoFar && tempRecord.t > 0.001) {
                var normal = cross(p1 - p0, p2 - p0);

                closestSoFar = tempRecord.t;

                (*record).t = tempRecord.t;
                (*record).p = rayOrigin + rayDirection * tempRecord.t;
                (*record).u = tempRecord.u;
                (*record).v = tempRecord.v;
                (*record).material = vec3f(0.8, 0.8, 0.0);
                (*record).normal = normalize(normal);
                (*record).trangleIndex = k;
            }
        }
    }

    return hitSomething;
}

fn hit_sphere(center: vec3f, radius: f32, ray: Ray, rec: ptr<function, HitRecord>, interval: Interval) -> bool {
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

fn hit(ray: Ray, rec: ptr<function, HitRecord>, interval: Interval) -> bool {
    var tempRec: HitRecord;
    var hitSomething = false;
    var int = interval;

    // for (var i: u32 = 0; i < 2u; i += 1) {
    //     if (hit_sphere(hittables[i].center, hittables[i].radius, ray, & tempRec, int)) {
    //         hitSomething = true;
    //         int.max = tempRec.t;
    //         * rec = tempRec;
    //     }
    // }

    if (hit_scene(ray.origin, ray.direction, & tempRec)) {
        hitSomething = true;
        if (tempRec.t < int.max) {
            int.max = tempRec.t;
            * rec = tempRec;
        }
    }

    return hitSomething;
}

fn rayColor(ray: Ray) -> vec3f {
    var rec: HitRecord;
    var interval = Interval(0.001, 1e8);
    if (hit(ray, & rec, interval)) {
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

fn surfaceColor(ray: Ray, rec: HitRecord) -> vec3f {
    var trangleIndex = rec.trangleIndex;
    if (trangleIndex < 30) {
        return vec3f(0.8, 0.8, 0.0);
    }

    var p0UV = vec2f(scene[trangleIndex + 3], scene[trangleIndex + 4]);
    var p1UV = vec2f(scene[trangleIndex + 8], scene[trangleIndex + 9]);
    var p2UV = vec2f(scene[trangleIndex + 13], scene[trangleIndex + 14]);

    var alpha = rec.u;
    var beta = rec.v;
    var gamma = 1 - alpha - beta;

    var localU = gamma * p0UV.x + alpha * p1UV.x + beta * p2UV.x;
    var localV = gamma * p0UV.y + alpha * p1UV.y + beta * p2UV.y;

    var sample = textureSampleLevel(imageTexture, nearestSampler, vec2f(localU, localV), 0.0);
    // sample = vec4f(localU, localV, 0.0, 0.0);
    // sample = vec4f(rec.u, rec.v, 0.0, 0.0);
    return sample.rgb;
}

fn surfaceNormal(ray: Ray, rec: HitRecord) -> vec3f {
    var trangleIndex = rec.trangleIndex;

    var p0UV = vec2f(scene[trangleIndex + 3], scene[trangleIndex + 4]);
    var p1UV = vec2f(scene[trangleIndex + 8], scene[trangleIndex + 9]);
    var p2UV = vec2f(scene[trangleIndex + 13], scene[trangleIndex + 14]);

    var alpha = rec.u;
    var beta = rec.v;
    var gamma = 1 - alpha - beta;

    var localU = gamma * p0UV.x + alpha * p1UV.x + beta * p2UV.x;
    var localV = gamma * p0UV.y + alpha * p1UV.y + beta * p2UV.y;

    var sample = textureSampleLevel(imageNormalTexture, nearestSampler, vec2f(localU, localV), 0.0);
    // sample = vec4f(localU, localV, 0.0, 0.0);
    // sample = vec4f(rec.u, rec.v, 0.0, 0.0);
    return sample.rgb;
}

fn renderPixel(i: f32, j: f32) -> vec4f {
    let uv = vec2f(i / screenWidth, j / screenHeight);
    var sample = textureSample(blueNoiseTexture, linearSampler, uv);
    var seed: u32 = u32(sample.x * 1000.0) * 1000000000u;

    var rec: HitRecord;
    var interval = Interval(0.001, 1e8);

    var color = vec3f(0.0, 0.0, 0.0);

    for (var s = 0.0; s < samplesPerPixel; s += 1.0) {
        var screenCoord = vec2f(i, j);
        var ray = getRay(screenCoord, & seed);
        var hitSomething = false;

        var coefficient = 1.0;
        var sampleColor = skyColor(ray);

        for (var k = 0.0; k < maxDepth; k += 1.0) {
            if (hit(ray, & rec, interval)) {
                sampleColor *= surfaceColor(ray, rec);
                hitSomething = true;
                ray.origin = rec.p;
                ray.direction = randomOnHemisphere(rec.normal, & seed);
            }
            else {
                break;
            }
        }

        if (!hitSomething) {
            sampleColor = skyColor(ray);
        }

        color += sampleColor;
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
    material: vec3f,
    trangleIndex: u32,
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
