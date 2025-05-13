const pi = 3.1415926;
const screenWidth = 858.0;
const screenHeight = 400.0;
const aspect = screenWidth / screenHeight;
const fov = 65.0 * pi / 180.0;
const lookFrom = vec3f(-5.0, 2.0, 3.2);
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

@group(0) @binding(0)
var<storage, read> scene: array<f32>;

const pos = array(vec2f(- 1.0, - 1.0), vec2f(3.0, - 1.0), vec2f(- 1.0, 3.0));

fn rand() -> f32 {
    return fract(sin(dot(vec2f(0.5, 0.5), vec2f(12.9898, 78.233))) * 43758.5453);
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

fn hit(rayOrigin: vec3f, rayDirection: vec3f, record: ptr<function, HitRecord>) -> bool {
    var tempRecord: HitRecord;
    var closestSoFar = 1e8;
    var hitSomething = false;
    for (var k: u32 = 0; k < arrayLength(&scene); k += 9) {
        var p0 = vec3f(scene[k],     scene[k + 1], scene[k + 2]);
        var p1 = vec3f(scene[k + 3], scene[k + 4], scene[k + 5]);
        var p2 = vec3f(scene[k + 6], scene[k + 7], scene[k + 8]);

        if (intersectTriangle(rayOrigin, rayDirection, p0, p1, p2, &tempRecord)) {
            hitSomething = true;
            if (tempRecord.t < closestSoFar && tempRecord.t > 0.001) {
                closestSoFar = tempRecord.t;
                record.t = tempRecord.t;
                record.u = tempRecord.u;
                record.v = tempRecord.v;
                record.normal = normalize(cross(p1 - p0, p2 - p0));
            }
        }
    }

    return hitSomething;
}

fn rayColor(rayOrigin: vec3f, rayDirection: vec3f) -> vec4f {
    var record: HitRecord;

    var attenuation = vec3f(1.0, 1.0, 1.0);
    var currentOrigin = rayOrigin;
    var currentDirection = rayDirection;

    for (var i: u32 = 0; i < 10; i += 1) {
        if (hit(rayOrigin, currentDirection, &record)) {

            currentOrigin = record.t * currentDirection;
            currentDirection = record.normal + vec3f(rand(), rand(), rand());

            attenuation *= vec3f(0.5, 0.5, 0.5);
        }
        else {
            var a = 0.4 * (rayDirection.y + 1.0);
            attenuation *= (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0);
            break;
        }
    }

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

    return rayColor(rayOrigin, rayDirection);
}
