import bpy
import bmesh
import math
import os
import random
import numpy as np
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\Raahim Syed\neon-harbor\tools"
TEX = os.path.join(ROOT, "tex")
OUT = os.path.join(os.path.dirname(ROOT), "assets", "models")

LEAF_RECTS = [
    (12, 16, 154, 414), (166, 16, 349, 409), (366, 26, 499, 374), (526, 46, 669, 376),
    (706, 16, 839, 429), (12, 636, 189, 1004), (218, 586, 366, 1010), (428, 611, 579, 1010),
]

STYLES = {
    "oak": dict(
        height=5.6, trunk_r=0.24, trunk_tip=0.07, trunk_sides=10, trunk_segs=8, trunk_lean=0.3,
        limbs=9, limb_angle=(26, 56), limb_len=(3.0, 4.4), limb_start=(0.34, 0.98),
        twigs=8, twig_len=(1.2, 2.0), leaves_per_twig=19, leaf_size=(0.8, 1.2),
        droop=0.16, tint=(1.0, 1.0, 1.0), seed=11,
    ),
    "oak_b": dict(
        height=6.4, trunk_r=0.2, trunk_tip=0.05, trunk_sides=10, trunk_segs=8, trunk_lean=0.5,
        limbs=8, limb_angle=(22, 48), limb_len=(2.8, 4.0), limb_start=(0.4, 0.98),
        twigs=8, twig_len=(1.1, 1.8), leaves_per_twig=18, leaf_size=(0.78, 1.15),
        droop=0.08, tint=(0.92, 1.02, 0.86), seed=29,
    ),
    "oak_c": dict(
        height=4.4, trunk_r=0.3, trunk_tip=0.09, trunk_sides=10, trunk_segs=7, trunk_lean=0.2,
        limbs=10, limb_angle=(40, 72), limb_len=(3.0, 4.2), limb_start=(0.28, 0.92),
        twigs=8, twig_len=(1.2, 1.9), leaves_per_twig=19, leaf_size=(0.8, 1.18),
        droop=0.28, tint=(1.06, 0.98, 0.78), seed=47,
    ),
}


def prep_textures():
    os.makedirs(TEX, exist_ok=True)
    d = bpy.data.images.load(os.path.join(TEX, "island_tree_01_leaves_diff_1k.jpg"), check_existing=False)
    a = bpy.data.images.load(os.path.join(TEX, "island_tree_01_leaves_alpha_1k.png"), check_existing=False)
    n = d.size[0]
    dp = np.array(d.pixels[:], dtype=np.float32).reshape(n, n, 4)
    ap = np.array(a.pixels[:], dtype=np.float32).reshape(n, n, 4)[..., 0]
    out = dp.copy()
    out[..., 3] = ap
    solid = ap > 0.5
    fill = out[solid][:, :3].mean(axis=0) if solid.any() else np.array([0.3, 0.4, 0.1])
    out[~solid, 0:3] = fill
    img = bpy.data.images.new("leaf_rgba", n, n, alpha=True)
    img.pixels = out.ravel().tolist()
    img.scale(512, 512)
    img.filepath_raw = os.path.join(TEX, "leaf_rgba.png")
    img.file_format = "PNG"
    img.save()
    b = bpy.data.images.load(os.path.join(TEX, "island_tree_01_branches_diff_1k.jpg"), check_existing=False)
    b.scale(512, 512)
    b.filepath_raw = os.path.join(TEX, "bark.jpg")
    b.file_format = "JPEG"
    b.save()
    for im in (d, a, b, img):
        bpy.data.images.remove(im)


def make_materials(tint):
    mats = []
    for name, path, alpha in (("bark", "bark.jpg", False), ("leaf", "leaf_rgba.png", True)):
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        nt = m.node_tree
        for nd in list(nt.nodes):
            if nd.type != "OUTPUT_MATERIAL":
                nt.nodes.remove(nd)
        out = next(nd for nd in nt.nodes if nd.type == "OUTPUT_MATERIAL")
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        bsdf.inputs["Roughness"].default_value = 0.9
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(os.path.join(TEX, path), check_existing=True)
        if alpha:
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.blend_type = "MULTIPLY"
            mix.inputs[0].default_value = 1.0
            mix.inputs[7].default_value = (tint[0], tint[1], tint[2], 1.0)
            nt.links.new(tex.outputs["Color"], mix.inputs[6])
            nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
            nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
        else:
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.blend_type = "MULTIPLY"
            mix.inputs[0].default_value = 1.0
            mix.inputs[7].default_value = (0.5, 0.42, 0.34, 1.0)
            nt.links.new(tex.outputs["Color"], mix.inputs[6])
            nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
        mats.append(m)
    return mats


def grow(rng, pos, d, length, r0, r1, segs, tropism, curl, lean=0.0):
    pts = []
    radii = []
    p = pos.copy()
    d = d.normalized()
    for i in range(segs + 1):
        t = i / segs
        pts.append(p.copy())
        radii.append(r0 + (r1 - r0) * t)
        bend = Vector((rng.gauss(0, curl), rng.gauss(0, curl), rng.gauss(0, curl * 0.4)))
        d = (d + bend + Vector((0, 0, tropism)) + Vector((lean * 0.06, 0, 0))).normalized()
        p = p + d * (length / segs)
    return pts, radii


class Builder:
    def __init__(self):
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new("UVMap")
        self.normals = {}

    def tube(self, pts, radii, sides, flare=0.0):
        rings = []
        dist = 0.0
        dists = [0.0]
        for i in range(1, len(pts)):
            dist += (pts[i] - pts[i - 1]).length
            dists.append(dist)
        total = max(dist, 1e-4)
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
            r = radii[i]
            if flare and i < 3:
                r *= 1 + flare * (1 - i / 3) ** 2
            ring = []
            for k in range(sides):
                ang = k / sides * math.tau
                nrm = a * math.cos(ang) + b * math.sin(ang)
                v = self.bm.verts.new(p + nrm * r)
                self.normals[v.index] = nrm
                ring.append(v)
            rings.append(ring)
        self.bm.verts.ensure_lookup_table()
        ur = max(1, round(math.tau * sum(radii) / len(radii) / 0.4))
        for i in range(len(rings) - 1):
            for k in range(sides):
                k2 = (k + 1) % sides
                f = self.bm.faces.new((rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]))
                f.material_index = 0
                u0 = k / sides * ur
                u1 = (k + 1) / sides * ur
                v0 = dists[i] / 0.45
                v1 = dists[i + 1] / 0.45
                for loop, (u, v) in zip(f.loops, ((u0, v0), (u1, v0), (u1, v1), (u0, v1))):
                    loop[self.uv].uv = (u, v)
                f.smooth = True

    def leaf(self, base, axis, side, normal, h, w, rect, cup, crown, bias):
        x0, y0, x1, y1 = rect
        u0, u1 = x0 / 1024, x1 / 1024
        vb, vt = 1 - y1 / 1024, 1 - y0 / 1024
        vm = (vb + vt) / 2
        mid = base + axis * (h * 0.5)
        tip = base + axis * h
        verts = []
        specs = (
            (base - side * (w * 0.08), u0 + (u1 - u0) * 0.42, vb, 0.0),
            (base + side * (w * 0.08), u0 + (u1 - u0) * 0.58, vb, 0.0),
            (mid - side * (w * 0.5) + normal * cup, u0, vm, 1.0),
            (mid + side * (w * 0.5) + normal * cup, u1, vm, 1.0),
            (tip - side * (w * 0.08) + normal * cup * 0.4, u0 + (u1 - u0) * 0.42, vt, 2.0),
            (tip + side * (w * 0.08) + normal * cup * 0.4, u0 + (u1 - u0) * 0.58, vt, 2.0),
        )
        uvs = []
        for co, u, v, _ in specs:
            nv = self.bm.verts.new(co)
            n = ((co - crown).normalized() + Vector((0, 0, bias))).normalized()
            self.normals[nv.index] = n
            verts.append(nv)
            uvs.append((u, v))
        quads = ((0, 1, 3, 2), (2, 3, 5, 4))
        for q in quads:
            f = self.bm.faces.new([verts[i] for i in q])
            f.material_index = 1
            for loop, i in zip(f.loops, q):
                loop[self.uv].uv = uvs[i]


def build(name, st):
    rng = random.Random(st["seed"])
    B = Builder()
    pts, radii = grow(rng, Vector((0, 0, 0)), Vector((rng.uniform(-0.1, 0.1), rng.uniform(-0.1, 0.1), 1)), st["height"], st["trunk_r"], st["trunk_tip"], st["trunk_segs"], 0.04, 0.12, st["trunk_lean"])
    B.tube(pts, radii, st["trunk_sides"], flare=0.45)
    twig_tips = []
    n = len(pts) - 1
    for li in range(st["limbs"]):
        t = st["limb_start"][0] + (st["limb_start"][1] - st["limb_start"][0]) * (li + rng.uniform(-0.2, 0.2)) / max(1, st["limbs"] - 1)
        t = min(max(t, 0.05), 1.0)
        fi = t * n
        i0 = min(int(fi), n - 1)
        fr = fi - i0
        origin = pts[i0].lerp(pts[i0 + 1], fr)
        rad = radii[i0] * (1 - fr) + radii[i0 + 1] * fr
        az = li * 2.39996 + rng.uniform(-0.3, 0.3)
        ang = math.radians(rng.uniform(*st["limb_angle"]))
        dv = Vector((math.sin(ang) * math.cos(az), math.sin(ang) * math.sin(az), math.cos(ang)))
        ln = rng.uniform(*st["limb_len"]) * (1.15 - 0.45 * t)
        lp, lr = grow(rng, origin, dv, ln, max(rad * 0.62, 0.05), 0.02, 5, 0.09 - st["droop"] * 0.2, 0.14)
        B.tube(lp, lr, 6)
        ln_n = len(lp) - 1
        for ti in range(st["twigs"]):
            tt = 0.3 + 0.7 * (ti + rng.uniform(0, 0.5)) / st["twigs"]
            tf = tt * ln_n
            j0 = min(int(tf), ln_n - 1)
            fr2 = tf - j0
            tor = lp[j0].lerp(lp[j0 + 1], fr2)
            side_az = az + (1 if ti % 2 else -1) * rng.uniform(0.6, 1.5)
            tang = math.radians(rng.uniform(35, 70))
            base_dir = (lp[-1] - lp[0]).normalized()
            perp = base_dir.cross(Vector((0, 0, 1)))
            if perp.length < 1e-3:
                perp = Vector((1, 0, 0))
            perp.normalize()
            up2 = perp.cross(base_dir).normalized()
            td = (base_dir * math.cos(tang) + (perp * math.cos(side_az) + up2 * math.sin(side_az)) * math.sin(tang)).normalized()
            tl = rng.uniform(*st["twig_len"]) * (1.1 - 0.5 * tt)
            tp, tr = grow(rng, tor, td, tl, 0.026, 0.004, 3, -st["droop"] * 0.15, 0.1)
            B.tube(tp, tr, 4)
            twig_tips.append((tp, td))
        twig_tips.append((lp, dv))
    crown = Vector((0, 0, st["height"] * 0.62))
    for tp, td in twig_tips:
        cnt = st["leaves_per_twig"]
        for k in range(cnt):
            t = 0.25 + 0.75 * k / max(1, cnt - 1)
            fi = t * (len(tp) - 1)
            i0 = min(int(fi), len(tp) - 2)
            fr = fi - i0
            base = tp[i0].lerp(tp[i0 + 1], fr)
            rnd = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1) * 0.6)).normalized()
            axis = (td * 0.45 + rnd * 0.9 + Vector((0, 0, -st["droop"]))).normalized()
            ref = Vector((0, 0, 1))
            side = axis.cross(ref)
            if side.length < 1e-3:
                side = Vector((1, 0, 0))
            side.normalize()
            nrm = side.cross(axis).normalized()
            if nrm.z < 0:
                nrm = -nrm
            rot = rng.uniform(-0.5, 0.5)
            side = (side * math.cos(rot) + nrm * math.sin(rot)).normalized()
            nrm = side.cross(axis).normalized()
            if nrm.z < 0:
                nrm = -nrm
            h = rng.uniform(*st["leaf_size"])
            rect = LEAF_RECTS[rng.randrange(len(LEAF_RECTS))]
            aspect = (rect[2] - rect[0]) / (rect[3] - rect[1])
            B.leaf(base, axis, side, nrm, h, h * aspect, rect, h * 0.06, crown, 0.35)
    mesh = bpy.data.meshes.new(name)
    B.bm.normal_update()
    bm = B.bm
    bm.verts.ensure_lookup_table()
    normals = [B.normals.get(v.index, v.normal) for v in bm.verts]
    bm.to_mesh(mesh)
    bm.free()
    mesh.normals_split_custom_set_from_vertices([tuple(n) for n in normals])
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def run(styles=None, export=True):
    for o in list(bpy.data.objects):
        if o.type == "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    prep_textures()
    os.makedirs(OUT, exist_ok=True)
    made = []
    shared = make_materials((1.0, 1.0, 1.0))
    for i, (name, st) in enumerate(STYLES.items()):
        if styles and name not in styles:
            continue
        ob = build("tree_" + name, st)
        for m in shared:
            ob.data.materials.append(m)
        ob.location = (i * 9.0, 0, 0)
        made.append(ob)
    bpy.context.view_layer.update()
    for ob in made:
        tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
        print(ob.name, "tris", tris, "dims", tuple(round(x, 2) for x in ob.dimensions))
    if export:
        for ob in made:
            ob.location = (0, 0, 0)
        bpy.ops.object.select_all(action="DESELECT")
        for ob in made:
            ob.select_set(True)
        bpy.context.view_layer.objects.active = made[0]
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "trees_broadleaf.glb"), export_format="GLB", use_selection=True, export_yup=True, export_apply=True, export_image_format="AUTO", export_normals=True)
        for i, ob in enumerate(made):
            ob.location = (i * 9.0, 0, 0)
    return made
