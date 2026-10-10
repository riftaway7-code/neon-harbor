import bpy
import bmesh
import math
import os
import random
import numpy as np
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\Raahim Syed\neon-harbor\tools"
TEX = os.path.join(ROOT, "tex")
OUT = os.path.join(os.path.dirname(ROOT), "assets", "models")

FIR_RECTS = [(190, 36, 440, 330), (665, 36, 970, 385), (310, 405, 665, 800), (645, 460, 985, 855), (495, 260, 650, 415)]
SHRUB_RECTS = [(455, 25, 700, 360), (210, 425, 480, 780), (735, 410, 945, 720), (765, 135, 900, 335), (590, 730, 680, 900), (305, 245, 372, 352)]


def prep_atlas(name, diff, alpha, size=512):
    d = bpy.data.images.load(os.path.join(TEX, diff), check_existing=False)
    a = bpy.data.images.load(os.path.join(TEX, alpha), check_existing=False)
    n = d.size[0]
    dp = np.array(d.pixels[:], dtype=np.float32).reshape(n, n, 4)
    ap = np.array(a.pixels[:], dtype=np.float32).reshape(a.size[1], a.size[0], 4)[..., 0]
    out = dp.copy()
    out[..., 3] = ap
    solid = ap > 0.5
    fill = out[solid][:, :3].mean(axis=0) if solid.any() else np.array([0.2, 0.35, 0.1])
    out[~solid, 0:3] = fill
    img = bpy.data.images.new(name, n, n, alpha=True)
    img.pixels = out.ravel().tolist()
    img.scale(size, size)
    img.filepath_raw = os.path.join(TEX, name + ".png")
    img.file_format = "PNG"
    img.save()
    bpy.data.images.remove(d)
    bpy.data.images.remove(a)
    bpy.data.images.remove(img)


class B:
    def __init__(self):
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new("UVMap")
        self.col = self.bm.loops.layers.color.new("Col")
        self.normals = {}
        self.slots = {}

    def quad(self, pts, rect, size, mat, normal_hint, color=(1, 1, 1)):
        x0, y0, x1, y1 = rect
        u0, u1 = x0 / size, x1 / size
        vb, vt = 1 - y1 / size, 1 - y0 / size
        vs = [self.bm.verts.new(p) for p in pts]
        f = self.bm.faces.new(vs)
        f.material_index = mat
        for loop, (u, v) in zip(f.loops, ((u0, vb), (u1, vb), (u1, vt), (u0, vt))):
            loop[self.uv].uv = (u, v)
            loop[self.col] = (*color, 1.0)
        for v in vs:
            self.normals[v.index] = normal_hint

    def tube(self, pts, radii, sides, mat, color):
        rings = []
        for i, p in enumerate(pts):
            if i == 0:
                t = pts[1] - pts[0]
            elif i == len(pts) - 1:
                t = pts[-1] - pts[-2]
            else:
                t = pts[i + 1] - pts[i - 1]
            t.normalize()
            ref = Vector((0, 1, 0)) if abs(t.y) < 0.9 else Vector((1, 0, 0))
            a = t.cross(ref).normalized()
            b = t.cross(a).normalized()
            ring = []
            for k in range(sides):
                ang = k / sides * math.tau
                nrm = a * math.cos(ang) + b * math.sin(ang)
                v = self.bm.verts.new(p + nrm * radii[i])
                self.normals[v.index] = nrm
                ring.append(v)
            rings.append(ring)
        for i in range(len(rings) - 1):
            for k in range(sides):
                k2 = (k + 1) % sides
                f = self.bm.faces.new((rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]))
                f.material_index = mat
                f.smooth = True
                u0, u1 = k / sides * 2, (k + 1) / sides * 2
                v0, v1 = i * 0.5, (i + 1) * 0.5
                for loop, (u, v) in zip(f.loops, ((u0, v0), (u1, v0), (u1, v1), (u0, v1))):
                    loop[self.uv].uv = (u, v)
                    loop[self.col] = (*color, 1.0)

    def tri(self, pts, mat, color_list, normal_hint):
        vs = [self.bm.verts.new(p) for p in pts]
        f = self.bm.faces.new(vs)
        f.material_index = mat
        for loop, c in zip(f.loops, color_list):
            loop[self.col] = (*c, 1.0)
            loop[self.uv].uv = (0, 0)
        for v in vs:
            self.normals[v.index] = normal_hint

    def finish(self, name, mats):
        self.bm.normal_update()
        bm = self.bm
        bm.verts.ensure_lookup_table()
        normals = [self.normals.get(v.index, v.normal) for v in bm.verts]
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        for m in mats:
            me.materials.append(m)
        me.normals_split_custom_set_from_vertices([tuple(n) for n in normals])
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        return ob


def mat_tex(name, path):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for nd in list(nt.nodes):
        if nd.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(nd)
    out = next(nd for nd in nt.nodes if nd.type == "OUTPUT_MATERIAL")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(os.path.join(TEX, path), check_existing=True)
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


def mat_vc(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for nd in list(nt.nodes):
        if nd.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(nd)
    out = next(nd for nd in nt.nodes if nd.type == "OUTPUT_MATERIAL")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


def mat_bark(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for nd in list(nt.nodes):
        if nd.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(nd)
    out = next(nd for nd in nt.nodes if nd.type == "OUTPUT_MATERIAL")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(os.path.join(TEX, "bark.jpg"), check_existing=True)
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs[0].default_value = 1.0
    mix.inputs[7].default_value = (0.5, 0.4, 0.3, 1.0)
    nt.links.new(tex.outputs["Color"], mix.inputs[6])
    nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


def frame_from(direction):
    d = direction.normalized()
    ref = Vector((0, 0, 1)) if abs(d.z) < 0.95 else Vector((1, 0, 0))
    s = d.cross(ref).normalized()
    n = s.cross(d).normalized()
    return d, s, n


def conifer(name, seed, H, Rmax, lean=0.0, mats=None):
    rng = random.Random(seed)
    b = B()
    pts = []
    radii = []
    segs = 8
    for i in range(segs + 1):
        t = i / segs
        pts.append(Vector((lean * t * t * 0.5, 0, H * t)))
        radii.append(0.2 * (1 - t) ** 0.8 + 0.025)
    b.tube(pts, radii, 8, 1, (1, 1, 1))
    y = 1.4
    k = 0
    center = Vector((0, 0, H * 0.45))
    while y < H * 0.985:
        t = (y - 1.4) / (H - 1.4)
        R = Rmax * (1 - t) ** 0.9 * (0.82 + 0.18 * math.sin(k * 1.7))
        nb = 8 if t < 0.6 else 6 if t < 0.85 else 5
        az0 = rng.uniform(0, math.tau)
        for j in range(nb):
            az = az0 + j / nb * math.tau + rng.uniform(-0.2, 0.2)
            droop = -0.32 + 0.45 * t + rng.uniform(-0.07, 0.07)
            d = Vector((math.cos(az) * math.cos(droop), math.sin(az) * math.cos(droop), math.sin(droop)))
            base = Vector((lean * (y / H) ** 2 * 0.5, 0, y))
            L = max(0.5, R * rng.uniform(0.85, 1.05))
            tip = base + d * L
            bp = [base, base.lerp(tip, 0.5) + Vector((0, 0, -0.04 * L)), tip + Vector((0, 0, -0.1 * L))]
            b.tube(bp, [0.028, 0.02, 0.008], 4, 1, (1, 1, 1))
            n = max(3, int(L / 0.3))
            for s in range(n):
                f = (s + 0.6) / n
                pos = base.lerp(tip, f) + Vector((0, 0, -0.1 * L * f * f))
                size = (1.45 - 0.5 * t) * (1.0 - 0.3 * f) * rng.uniform(0.95, 1.25)
                dd, side, nrm = frame_from(d + Vector((0, 0, -0.1 * f)))
                rect = FIR_RECTS[rng.randrange(len(FIR_RECTS))]
                asp = (rect[2] - rect[0]) / (rect[3] - rect[1])
                for roll in (0.0, 1.05, -1.05):
                    r = Matrix.Rotation(roll + rng.uniform(-0.2, 0.2), 3, dd)
                    sv = (r @ side) * (size * asp * 0.5)
                    nv = r @ nrm
                    p0 = pos - sv
                    p1 = pos + sv
                    p2 = pos + sv + dd * size
                    p3 = pos - sv + dd * size
                    hint = ((pos - center).normalized() * 0.5 + Vector((0, 0, 0.7))).normalized()
                    b.quad([p0, p1, p2, p3], rect, 1024, 0, hint)
        y += 0.42 + 0.08 * t
        k += 1
    for j in range(5):
        az = j / 5 * math.tau
        d = Vector((math.cos(az) * 0.25, math.sin(az) * 0.25, 1)).normalized()
        base = Vector((lean * 0.5, 0, H * 0.95))
        dd, side, nrm = frame_from(d)
        rect = FIR_RECTS[3]
        asp = (rect[2] - rect[0]) / (rect[3] - rect[1])
        sv = side * 0.45 * asp
        b.quad([base - sv, base + sv, base + sv + dd * 0.95, base - sv + dd * 0.95], rect, 1024, 0, Vector((0, 0, 1)))
    return b.finish(name, mats)


def palm(name, seed, H, lean, mats):
    rng = random.Random(seed)
    b = B()
    pts = []
    radii = []
    n = 34
    for i in range(n + 1):
        t = i / n
        pts.append(Vector((lean * t * t, 0.0, H * t)))
        rr = 0.19 * (1 - t) ** 0.35 + 0.1 * (1 - t) ** 3 + 0.07
        radii.append(rr * (1 + 0.1 * math.sin(i * 2.2)))
    b.tube(pts, radii, 10, 0, (0.45, 0.36, 0.27))
    top = pts[-1]
    nf = 15
    for k in range(nf):
        az = k * 2.39996 + rng.uniform(-0.15, 0.15)
        elev = math.radians(rng.uniform(55, 75) - 100 * (k / nf) ** 0.8 + rng.uniform(-6, 6))
        d0 = Vector((math.cos(az) * math.cos(elev), math.sin(az) * math.cos(elev), math.sin(elev)))
        L = rng.uniform(2.9, 3.7)
        droop = 1.2 + 1.3 * (k / nf)
        rib = []
        steps = 18
        for i in range(steps + 1):
            t = i / steps
            rib.append(top + d0 * (L * t) + Vector((0, 0, -droop * t * t)))
        b.tube(rib, [0.035 * (1 - i / steps) + 0.008 for i in range(steps + 1)], 4, 0, (0.45, 0.6, 0.25))
        for i in range(2, steps + 1):
            t = i / steps
            p = rib[i]
            tang = (rib[i] - rib[i - 1]).normalized()
            side = tang.cross(Vector((0, 0, 1)))
            if side.length < 1e-3:
                side = Vector((1, 0, 0))
            side.normalize()
            ln = 1.05 * math.sin(math.pi * min(1.0, t * 0.95) ** 0.8) + 0.22
            for sgn in (-1, 1):
                dirv = (side * sgn * 0.85 + tang * 0.55 + Vector((0, 0, -0.55))).normalized()
                base = p
                tip = p + dirv * ln
                w = 0.075 * (1.0 - 0.4 * t)
                a = base + tang * w
                c = base - tang * w
                shade = 0.25 + 0.3 * t
                col_b = (0.08, 0.2 + 0.1 * shade, 0.05)
                col_t = (0.2, 0.42 + 0.2 * shade, 0.1)
                b.tri([a, tip, c], 0, [col_b, col_t, col_b], Vector((0, 0, 1)))
    return b.finish(name, mats)


def shrub(name, seed, R, hgt, count, mats):
    rng = random.Random(seed)
    b = B()
    for i in range(4):
        a = i / 4 * math.tau
        b.tube([Vector((0, 0, 0)), Vector((math.cos(a) * R * 0.3, math.sin(a) * R * 0.3, hgt * 0.5)), Vector((math.cos(a) * R * 0.55, math.sin(a) * R * 0.55, hgt * 0.9))], [0.022, 0.016, 0.008], 4, 1, (1, 1, 1))
    for _ in range(count):
        th = rng.uniform(0, math.tau)
        ph = math.acos(rng.uniform(0.0, 1.0)) * 0.95
        r = R * rng.uniform(0.55, 1.0)
        c = Vector((math.cos(th) * math.sin(ph) * r, math.sin(th) * math.sin(ph) * r, hgt * (0.12 + 0.88 * math.cos(ph))))
        out = (c - Vector((0, 0, hgt * 0.35))).normalized()
        d, side, nrm = frame_from(out)
        rect = SHRUB_RECTS[rng.randrange(len(SHRUB_RECTS))]
        asp = (rect[2] - rect[0]) / (rect[3] - rect[1])
        size = rng.uniform(0.32, 0.52) * (0.6 + 0.5 * R)
        r2 = Matrix.Rotation(rng.uniform(0, math.tau), 3, d)
        sv = (r2 @ side) * size * asp * 0.5
        dv = (r2 @ nrm.cross(side).normalized()) * size if False else d.cross(sv).normalized() * size
        p0 = c - sv
        p1 = c + sv
        b.quad([p0, p1, p1 + dv, p0 + dv], rect, 1024, 0, (out * 0.6 + Vector((0, 0, 0.6))).normalized())
    return b.finish(name, mats)


def run(export=True):
    for o in list(bpy.data.objects):
        if o.type == "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    prep_atlas("fir_rgba", "fir_tree_01_twig_diff_1k.png", "fir_tree_01_twig_alpha_1k.png", 512)
    prep_atlas("shrub_rgba", "shrub_01_diff_1k.jpg", "shrub_01_alpha_1k.png", 512)
    twig = mat_tex("twig", "fir_rgba.png")
    leafm = mat_tex("shrub", "shrub_rgba.png")
    bark = mat_bark("bark")
    vc = mat_vc("prop")
    made = []
    specs = [("conifer_a", 21, 9.0, 2.4, 0.3), ("conifer_b", 33, 7.2, 2.0, -0.2), ("conifer_c", 47, 11.0, 2.7, 0.15)]
    for i, (nm, sd, H, R, ln) in enumerate(specs):
        ob = conifer(nm, sd, H, R, ln, [twig, bark])
        ob.location = (i * 7, 0, 0)
        made.append(ob)
    for i, (nm, sd, H, ln) in enumerate([("palm_a", 5, 8.5, 1.1), ("palm_b", 9, 10.5, -1.4), ("palm_c", 13, 7.0, 0.7)]):
        ob = palm(nm, sd, H, ln, [vc, bark])
        ob.location = (i * 7, 9, 0)
        made.append(ob)
    for i, (nm, sd, R, h, c) in enumerate([("shrub_a", 2, 0.9, 0.9, 260), ("shrub_b", 4, 0.7, 1.2, 220), ("shrub_c", 6, 1.2, 0.8, 340)]):
        ob = shrub(nm, sd, R, h, c, [leafm, bark])
        ob.location = (i * 7, 18, 0)
        made.append(ob)
    for ob in made:
        print(ob.name, sum(len(p.vertices) - 2 for p in ob.data.polygons))
    if export:
        os.makedirs(OUT, exist_ok=True)
        locs = [o.location.copy() for o in made]
        for ob in made:
            ob.location = (0, 0, 0)
        bpy.ops.object.select_all(action="DESELECT")
        for ob in made:
            ob.select_set(True)
        bpy.context.view_layer.objects.active = made[0]
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "plants.glb"), export_format="GLB", use_selection=True, export_yup=True, export_apply=True, export_normals=True, export_vertex_color="ACTIVE")
        for ob, l in zip(made, locs):
            ob.location = l
    return made
