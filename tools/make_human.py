import bpy
import bmesh
import math
import os
import random
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\Raahim Syed\neon-harbor\tools"
OUT = os.path.join(os.path.dirname(ROOT), "assets", "models")


def V(x, y, z):
    return Vector((x, -z, y))


class Blobs:
    def __init__(self):
        self.bm = bmesh.new()

    def blob(self, c, r, rot=(0, 0, 0), u=12, v=8):
        m = Matrix.Translation(V(*c)) @ Matrix.Diagonal((r[0], r[2], r[1], 1))
        if rot != (0, 0, 0):
            m = Matrix.Translation(V(*c)) @ Matrix.Rotation(rot[0], 4, "X") @ Matrix.Rotation(-rot[2], 4, "Y") @ Matrix.Rotation(rot[1], 4, "Z") @ Matrix.Diagonal((r[0], r[2], r[1], 1))
        bmesh.ops.create_uvsphere(self.bm, u_segments=u, v_segments=v, radius=1.0, matrix=m)

    def chain(self, pts, step=0.012, fat=1.0):
        for i in range(len(pts) - 1):
            a, b = pts[i], pts[i + 1]
            d = Vector(b[0]) - Vector(a[0])
            n = max(1, int(d.length / step))
            for k in range(n + 1):
                t = k / n
                c = Vector(a[0]).lerp(Vector(b[0]), t)
                r = tuple((a[1][j] + (b[1][j] - a[1][j]) * t) * (fat if j != 1 else 1.0) for j in range(3))
                self.blob(tuple(c), (r[0], max(r[1], 0.032), r[2]), u=10, v=6)


def ARMOUT(y):
    t = max(0.0, min(1.0, (1.2 - y) / 0.3))
    return 0.042 * t * t * (3 - 2 * t)


def build_points(female=False, build=1.0):
    B = Blobs()
    s = 0.93 if female else 1.0
    sh = 0.86 if female else 1.0
    hp = 1.12 if female else 1.0
    wa = 0.88 if female else 1.0

    def X(v):
        return v

    torso = [
        ((0, 0.90, 0.0), (0.165 * hp, 0.07, 0.108)),
        ((0, 0.98, 0.0), (0.168 * hp, 0.07, 0.108)),
        ((0, 1.06, 0.005), (0.155 * wa, 0.07, 0.098)),
        ((0, 1.13, 0.01), (0.15 * wa, 0.07, 0.095)),
        ((0, 1.21, 0.012), (0.165 * (0.95 if female else 1), 0.07, 0.104)),
        ((0, 1.29, 0.012), (0.178 * sh, 0.07, 0.112)),
        ((0, 1.37, 0.008), (0.19 * sh, 0.07, 0.108)),
        ((0, 1.43, 0.0), (0.185 * sh, 0.05, 0.095)),
    ]
    B.chain(torso, 0.016)
    for sx in (-1, 1):
        B.blob((sx * 0.085 * sh, 1.35, 0.085), (0.07 * sh, 0.04, 0.02) if not female else (0.078, 0.06, 0.056), u=12, v=8)
        B.blob((sx * 0.085, 1.455, -0.012), (0.1, 0.04, 0.06), (0, 0, sx * 0.42))
        B.blob((sx * 0.1, 1.43, 0.03), (0.07, 0.014, 0.014), (0, 0, sx * -0.12))
        B.blob((sx * 0.065 * hp, 0.95, -0.05), (0.08 * hp, 0.085, 0.07))
    B.blob((0, 1.10, 0.025), (0.115 * wa, 0.1, 0.085))
    B.chain([((0, 1.47, -0.006), (0.07, 0.01, 0.07)), ((0, 1.55, -0.004), (0.062, 0.01, 0.062)), ((0, 1.62, 0.0), (0.058, 0.01, 0.058)), ((0, 1.675, 0.004), (0.052, 0.01, 0.054))], 0.01)
    for sx in (-1, 1):
        sa = 0.188 * sh
        B.blob((sx * sa, 1.395, 0.0), (0.06 * (0.85 if female else 1), 0.072, 0.064), u=12, v=8)
        B.chain([((sx * sa, 1.37, 0.0), (0.05, 0.01, 0.052)), ((sx * (sa + 0.004 + ARMOUT(1.25)), 1.25, 0.008), (0.047, 0.01, 0.049)), ((sx * (sa + 0.008 + ARMOUT(1.135)), 1.135, 0.0), (0.04, 0.01, 0.042))], 0.011, 1.1)
        B.blob((sx * (sa + 0.002 + ARMOUT(1.28)), 1.28, 0.026), (0.04, 0.06, 0.036))
        B.blob((sx * (sa + 0.002 + ARMOUT(1.26)), 1.26, -0.03), (0.035, 0.06, 0.03))
        B.chain([((sx * (sa + 0.008 + ARMOUT(1.135)), 1.135, 0.0), (0.042, 0.01, 0.043)), ((sx * (sa + 0.012 + ARMOUT(1.04)), 1.04, 0.004), (0.039, 0.01, 0.04)), ((sx * (sa + 0.016 + ARMOUT(0.95)), 0.95, 0.002), (0.03, 0.01, 0.03)), ((sx * (sa + 0.018 + ARMOUT(0.87)), 0.87, 0.0), (0.025, 0.01, 0.026))], 0.011, 1.1)
        B.blob((sx * (sa + 0.012 + ARMOUT(1.07)), 1.07, 0.012), (0.038, 0.07, 0.034))
        hx = sx * (sa + 0.02 + ARMOUT(0.8))
        B.blob((hx, 0.81, 0.004), (0.036, 0.062, 0.02), u=10, v=6)
        B.blob((hx, 0.795, 0.0), (0.04, 0.05, 0.022), u=10, v=6)
        B.chain([((hx - sx * 0.012, 0.76, 0.01), (0.011, 0.01, 0.011)), ((hx - sx * 0.012, 0.715, 0.018), (0.0095, 0.01, 0.0095))], 0.007)
        B.chain([((hx - sx * 0.004, 0.76, 0.011), (0.0105, 0.01, 0.011)), ((hx - sx * 0.004, 0.71, 0.02), (0.009, 0.01, 0.009))], 0.007)
        B.chain([((hx + sx * 0.005, 0.76, 0.011), (0.0105, 0.01, 0.011)), ((hx + sx * 0.005, 0.715, 0.02), (0.009, 0.01, 0.009))], 0.007)
        B.chain([((hx + sx * 0.0135, 0.765, 0.008), (0.0095, 0.01, 0.01)), ((hx + sx * 0.0135, 0.73, 0.016), (0.008, 0.01, 0.008))], 0.007)
        B.chain([((hx - sx * 0.026, 0.82, 0.026), (0.012, 0.01, 0.012)), ((hx - sx * 0.032, 0.775, 0.042), (0.009, 0.01, 0.009))], 0.007)
        lx = sx * 0.095
        B.chain([((lx, 0.915, 0.0), (0.098 * hp, 0.01, 0.1)), ((lx, 0.78, 0.005), (0.088 * hp, 0.01, 0.092)), ((lx, 0.62, 0.012), (0.074, 0.01, 0.08)), ((lx, 0.5, 0.012), (0.058, 0.01, 0.062))], 0.012, 1.08)
        B.blob((lx, 0.72, 0.04), (0.07, 0.1, 0.045))
        B.blob((lx, 0.7, -0.038), (0.068, 0.1, 0.04))
        B.blob((lx, 0.485, 0.036), (0.052, 0.04, 0.034))
        B.chain([((lx, 0.485, 0.01), (0.056, 0.01, 0.06)), ((lx, 0.38, -0.004), (0.054, 0.01, 0.058)), ((lx, 0.23, 0.0), (0.04, 0.01, 0.044)), ((lx, 0.105, 0.0), (0.034, 0.01, 0.036))], 0.011, 1.1)
        B.blob((lx, 0.34, -0.034), (0.046, 0.09, 0.044))
        B.blob((lx - sx * 0.01, 0.31, -0.03), (0.03, 0.06, 0.03))
        B.blob((lx, 0.085, 0.0), (0.044, 0.04, 0.048))
        B.blob((lx, 0.05, -0.04), (0.046, 0.05, 0.055))
        B.blob((lx, 0.045, 0.045), (0.05, 0.04, 0.08))
        B.blob((lx, 0.036, 0.13), (0.05, 0.032, 0.07))
        B.blob((lx, 0.022, 0.14), (0.053, 0.022, 0.095))
        B.blob((lx, 0.03, 0.0), (0.05, 0.03, 0.12))
    return B


def head_points(B, female=False):
    hs = 0.95 if female else 1.0
    B.blob((0, 1.705, 0.0), (0.077 * hs, 0.106 * hs, 0.098 * hs), u=16, v=12)
    B.blob((0, 1.655, 0.03), (0.066 * hs, 0.065, 0.07), u=14, v=10)
    B.blob((0, 1.62, 0.058), (0.044 * hs, 0.032, 0.04))
    B.blob((0, 1.598, 0.082), (0.026, 0.02, 0.022))
    for sx in (-1, 1):
        B.blob((sx * 0.052, 1.66, 0.058), (0.03, 0.034, 0.03))
        B.blob((sx * 0.066, 1.625, 0.03), (0.022, 0.03, 0.04), (0, 0, sx * -0.3))
        B.blob((sx * 0.079, 1.69, -0.004), (0.012, 0.03, 0.02), u=8, v=6)
        B.blob((sx * 0.074, 1.688, -0.007), (0.008, 0.02, 0.014), u=8, v=6)
        B.blob((sx * 0.03, 1.717, 0.084), (0.032, 0.011, 0.016))
        B.blob((sx * 0.032, 1.69, 0.084), (0.018, 0.007, 0.01))
    B.blob((0, 1.668, 0.104), (0.013, 0.03, 0.02), u=10, v=8)
    B.blob((0, 1.652, 0.121), (0.0125, 0.0125, 0.0125), u=10, v=8)
    for sx in (-1, 1):
        B.blob((sx * 0.012, 1.651, 0.11), (0.008, 0.01, 0.01), u=8, v=6)
    B.blob((0, 1.634, 0.1), (0.024, 0.0075, 0.011), u=10, v=6)
    B.blob((0, 1.622, 0.099), (0.021, 0.0085, 0.011), u=10, v=6)


def fuse(B, voxel=0.0095, smooth=8):
    me = bpy.data.meshes.new("body_raw")
    B.bm.to_mesh(me)
    B.bm.free()
    ob = bpy.data.objects.new("body_raw", me)
    bpy.context.scene.collection.objects.link(ob)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    me.remesh_voxel_size = voxel
    me.remesh_voxel_adaptivity = 0.0
    bpy.ops.object.voxel_remesh()
    bm = bmesh.new()
    bm.from_mesh(me)
    for _ in range(smooth):
        bmesh.ops.smooth_vert(bm, verts=bm.verts, factor=0.55, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.to_mesh(me)
    bm.free()
    return ob


def decimate(ob, tris):
    cur = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    if cur <= tris:
        return
    md = ob.modifiers.new("dec", "DECIMATE")
    md.ratio = tris / cur
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier="dec")


def clear():
    for o in list(bpy.data.objects):
        if o.type in ("MESH", "ARMATURE"):
            bpy.data.objects.remove(o, do_unlink=True)
    for b in list(bpy.data.meshes):
        bpy.data.meshes.remove(b)
    for b in list(bpy.data.armatures):
        bpy.data.armatures.remove(b)


def make_body(female=False, voxel=0.0095):
    B = build_points(female)
    ob = fuse(B, voxel)
    ob.name = "body_f" if female else "body_m"
    return ob


def gauss(p, c, sg, amp):
    d = ((p.x - c[0]) / sg[0]) ** 2 + ((p.y - c[1]) / sg[1]) ** 2 + ((p.z - c[2]) / sg[2]) ** 2
    return amp * math.exp(-0.5 * d)


HEAD_C = Vector((0, 1.705, 0.0))
HEAD_S = 1.2
HEAD_DY = -0.02


def HY(y):
    return HEAD_C.y + (y - HEAD_C.y) * HEAD_S + HEAD_DY


def head_t(p):
    q = HEAD_C + (Vector(p) - HEAD_C) * HEAD_S
    return Vector((q.x, q.y + HEAD_DY, q.z))


HEAD_SECTIONS = [
    (0.000, 0.010, 0.066, 0.040),
    (0.010, 0.030, 0.078, 0.038),
    (0.030, 0.046, 0.083, 0.030),
    (0.050, 0.060, 0.086, 0.026),
    (0.072, 0.068, 0.086, 0.052),
    (0.095, 0.074, 0.086, 0.084),
    (0.115, 0.076, 0.089, 0.093),
    (0.140, 0.075, 0.085, 0.098),
    (0.165, 0.069, 0.073, 0.096),
    (0.185, 0.057, 0.052, 0.081),
    (0.200, 0.034, 0.028, 0.050),
    (0.207, 0.010, 0.008, 0.015),
]


def head_loft(B, base=1.600, segs=36, power=2.5):
    bm = B.bm
    before = set(bm.faces)
    rings = []
    for h, w, f, bk in HEAD_SECTIONS:
        ring = []
        for k in range(segs):
            a = k / segs * math.tau
            c, s_ = math.cos(a), math.sin(a)
            x = w * math.copysign(abs(c) ** (2 / power), c)
            zd = f if s_ >= 0 else bk
            z = zd * math.copysign(abs(s_) ** (2 / power), s_)
            ring.append(bm.verts.new(V(x, base + h, z)))
        rings.append(ring)
    for i in range(len(rings) - 1):
        for k in range(segs):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % segs], rings[i + 1][(k + 1) % segs], rings[i + 1][k]))
    for ring, up in ((rings[0], False), (rings[-1], True)):
        cv = bm.verts.new(V(0, base + (HEAD_SECTIONS[-1][0] if up else 0.0), 0))
        for k in range(segs):
            a, b2 = ring[k], ring[(k + 1) % segs]
            bm.faces.new((cv, b2, a) if up else (cv, a, b2))
    bmesh.ops.recalc_face_normals(bm, faces=[f for f in bm.faces if f not in before])


def head_blobs(B):
    head_loft(B)
    for c, r, u, v in [
        ((0, 1.7, 0.088), (0.011, 0.012, 0.01), 10, 8),
        ((0, 1.682, 0.099), (0.0095, 0.02, 0.012), 10, 8),
        ((0, 1.658, 0.113), (0.0125, 0.0125, 0.0125), 10, 8),
        ((0, 1.637, 0.092), (0.021, 0.0065, 0.009), 10, 6),
        ((0, 1.623, 0.09), (0.019, 0.0075, 0.009), 10, 6),
        ((0, 1.607, 0.078), (0.021, 0.013, 0.013), 10, 8),
    ]:
        B.blob(c, r, u=u, v=v)
    for sx in (-1, 1):
        for c, r, u, v in [
            ((0.031, 1.722, 0.082), (0.025, 0.007, 0.008), 10, 8),
            ((0.052, 1.674, 0.056), (0.022, 0.017, 0.024), 10, 8),
            ((0.0125, 1.652, 0.106), (0.0085, 0.008, 0.01), 8, 6),
            ((0.032, 1.7155, 0.08), (0.0135, 0.0045, 0.0125), 10, 6),
            ((0.032, 1.6945, 0.08), (0.0125, 0.0035, 0.0115), 10, 6),
            ((0.078, 1.688, -0.004), (0.0095, 0.03, 0.021), 10, 8),
        ]:
            B.blob((sx * c[0], c[1], c[2]), r, u=u, v=v)


def make_head(female=False):
    B = Blobs()
    head_blobs(B)
    ob = fuse(B, 0.0052, 6)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    for v in bm.verts:
        g = Vector((v.co.x, v.co.z, -v.co.y))
        v.co = V(*head_t(g))
    bm.to_mesh(ob.data)
    bm.free()
    ob.name = "head"
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


BONES = [
    ("hips", None, (0, 0.93, 0), (0, 1.0, 0)),
    ("upper", "hips", (0, 0.93, 0), (0, 1.32, 0)),
    ("neck", "upper", (0, 1.46, 0), (0, 1.585, 0.012)),
    ("head", "neck", (0, 1.585, 0.012), (0, 1.82, 0.012)),
]
for _s, _k in ((-1, "L"), (1, "R")):
    BONES += [
        ("arm" + _k, "upper", (_s * 0.188, 1.40, 0), (_s * 0.202, 1.13, 0)),
        ("elbow" + _k, "arm" + _k, (_s * 0.202, 1.13, 0), (_s * 0.248, 0.865, 0)),
        ("hand" + _k, "elbow" + _k, (_s * 0.248, 0.865, 0), (_s * 0.252, 0.72, 0.012)),
        ("leg" + _k, "hips", (_s * 0.095, 0.93, 0), (_s * 0.095, 0.485, 0.01)),
        ("knee" + _k, "leg" + _k, (_s * 0.095, 0.485, 0.01), (_s * 0.095, 0.10, 0)),
        ("foot" + _k, "knee" + _k, (_s * 0.095, 0.10, 0), (_s * 0.095, 0.03, 0.2)),
    ]


def make_armature():
    data = bpy.data.armatures.new("rig")
    arm = bpy.data.objects.new("rig", data)
    bpy.context.scene.collection.objects.link(arm)
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = {}
    for name, parent, h, t in BONES:
        b = data.edit_bones.new(name)
        b.head = V(*h)
        b.tail = V(*t)
        if parent:
            b.parent = eb[parent]
        eb[name] = b
    bpy.ops.object.mode_set(mode="OBJECT")
    return arm


def bind(mesh_obj, arm_obj):
    bpy.ops.object.select_all(action="DESELECT")
    mesh_obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")


def head_weights(ob, arm):
    vg = ob.vertex_groups.new(name="head")
    vg.add(list(range(len(ob.data.vertices))), 1.0, "REPLACE")
    ob.parent = arm
    md = ob.modifiers.new("Armature", "ARMATURE")
    md.object = arm


def smooth_weights(ob, reps=4, factor=0.5):
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    dl = bm.verts.layers.deform.verify()
    ng = len(ob.vertex_groups)
    W = [[v[dl].get(g, 0.0) for g in range(ng)] for v in bm.verts]
    nbr = [[e.other_vert(v).index for e in v.link_edges] for v in bm.verts]
    for _ in range(reps):
        W2 = []
        for i, w in enumerate(W):
            if not nbr[i]:
                W2.append(w)
                continue
            n = len(nbr[i])
            W2.append([w[g] * (1 - factor) + factor * sum(W[j][g] for j in nbr[i]) / n for g in range(ng)])
        W = W2
    for v, w in zip(bm.verts, W):
        d = v[dl]
        d.clear()
        top = sorted(range(ng), key=lambda g: -w[g])[:4]
        tot = sum(w[g] for g in top) or 1.0
        for g in top:
            if w[g] > 0.01:
                d[g] = w[g] / tot
    bm.to_mesh(ob.data)
    bm.free()


def dominant(bm, ob, dl):
    names = [g.name for g in ob.vertex_groups]
    out = {}
    for v in bm.verts:
        d = v[dl]
        if len(d):
            gi = max(d.items(), key=lambda kv: kv[1])[0]
            out[v.index] = names[gi]
        else:
            out[v.index] = None
    return out


def clone_with_groups(src, name):
    me = src.data.copy()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for g in src.vertex_groups:
        ob.vertex_groups.new(name=g.name)
    ob.parent = src.parent
    md = ob.modifiers.new("Armature", "ARMATURE")
    md.object = src.parent
    return ob


def relax_boundary(bm, iters=8, factor=0.5):
    for _ in range(iters):
        moves = {}
        for v in bm.verts:
            nb = [e.other_vert(v) for e in v.link_edges if e.is_boundary]
            if len(nb) == 2 and v.is_boundary:
                avg = (nb[0].co + nb[1].co) / 2
                moves[v] = v.co.lerp(avg, factor)
        for v, c in moves.items():
            v.co = c


def shell(src, name, keep, offset_fn, thick=0.005, trim_loose=True, cuts=()):
    ob = clone_with_groups(src, name)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    dl = bm.verts.layers.deform.verify()
    dom = dominant(bm, ob, dl)
    bm.faces.ensure_lookup_table()
    domv = {v: dom[v.index] for v in bm.verts}
    kill = []
    for f in bm.faces:
        bones = [dom[v.index] for v in f.verts]
        c = f.calc_center_median()
        if not keep(bones, c):
            kill.append(f)
    bmesh.ops.delete(bm, geom=kill, context="FACES")
    loose = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context="VERTS")
    bm.normal_update()
    for v in bm.verts:
        off = offset_fn(v.co, v.normal)
        v.co = v.co + v.normal * off
    for z, side, inc, exc in cuts:
        fs = [f for f in bm.faces if f.is_valid and (inc is None or all(domv.get(v) in inc for v in f.verts)) and not (exc and all(domv.get(v) in exc for v in f.verts))]
        geom = list(fs)
        for f in fs:
            geom.extend(f.edges)
            geom.extend(f.verts)
        geom = list({id(g): g for g in geom}.values())
        res = bmesh.ops.bisect_plane(bm, geom=geom, dist=0.0001, plane_co=Vector((0, 0, z)), plane_no=Vector((0, 0, 1)), clear_inner=(side == "below"), clear_outer=(side == "above"))
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    relax_boundary(bm)
    bm.to_mesh(ob.data)
    bm.free()
    for p in ob.data.polygons:
        p.use_smooth = True
    if thick:
        md = ob.modifiers.new("Solid", "SOLIDIFY")
        md.thickness = thick
        md.offset = -1.0
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.modifier_apply(modifier="Solid")
    return ob


def gy(co):
    return co.z


def smoothstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


TORSO = {"hips", "upper"}
ARMS = {"armL", "armR", "elbowL", "elbowR"}
UARMS = {"armL", "armR"}
LEGS = {"legL", "legR", "kneeL", "kneeR"}
FEET = {"footL", "footR"}


def make_clothes(body):
    out = {}
    BAD_TOP = {"head", "neck"}
    LEGB = {"legL", "legR", "kneeL", "kneeR", "footL", "footR"}
    ARMB = {"armL", "armR", "elbowL", "elbowR", "handL", "handR"}
    HANDB = {"handL", "handR"}
    SLEEVE = {"armL", "armR", "elbowL", "elbowR"}

    def neckhole(c):
        return c.z > 1.415 and math.hypot(c.x, c.y) < 0.078

    def top(b, c, low):
        if any(x == 'head' or x in HANDB for x in b):
            return False
        if c.z > 1.56 or c.z < low or neckhole(c):
            return False
        return True

    def tee_keep(b, c):
        if not top(b, c, 0.86):
            return False
        if any(x in SLEEVE for x in b) and c.z < 1.1:
            return False
        return True

    def pants(b, c, top=0.995, bot=0.09):
        if any(x in BAD_TOP or x in ARMB for x in b):
            return False
        return bot < c.z < top

    TORSOB = {"hips", "upper"}
    out["jacket"] = shell(body, "jacket", lambda b, c: top(b, c, 0.86), lambda co, n: 0.017 + 0.012 * (1 - smoothstep(0.9, 1.05, co.z)) + 0.016 * smoothstep(1.44, 1.52, co.z), 0, cuts=[(1.5, "above", None, None), (0.895, "below", None, SLEEVE), (0.872, "below", SLEEVE, None)])
    out["long"] = shell(body, "long", lambda b, c: top(b, c, 0.86), lambda co, n: 0.01 + 0.014 * (1 - smoothstep(0.9, 1.12, co.z)), 0, cuts=[(1.5, "above", None, None), (0.93, "below", None, SLEEVE), (0.872, "below", SLEEVE, None)])
    out["tee"] = shell(body, "tee", tee_keep, lambda co, n: 0.01 + 0.014 * (1 - smoothstep(0.9, 1.12, co.z)), 0, cuts=[(1.5, "above", None, None), (0.93, "below", None, SLEEVE), (1.165, "below", SLEEVE, None)])
    out["pants"] = shell(body, "pants", lambda b, c: pants(b, c), lambda co, n: 0.011 + 0.008 * smoothstep(0.5, 0.95, co.z) - 0.004 * smoothstep(0.1, 0.25, 0.25 - co.z), 0, cuts=[(0.985, "above", None, None), (0.1, "below", None, None)])
    out["shorts"] = shell(body, "shorts", lambda b, c: pants(b, c, 0.995, 0.55), lambda co, n: 0.012 + 0.008 * smoothstep(0.5, 0.95, co.z), 0, cuts=[(0.985, "above", None, None), (0.58, "below", None, None)])
    out["shoes"] = shell(body, "shoes", lambda b, c: c.z < 0.14 and not any(x in ARMB or x in BAD_TOP for x in b), lambda co, n: 0.012 + 0.012 * smoothstep(0.0, 0.05, 0.05 - co.z), 0, cuts=[(0.125, "above", None, None)])
    return out


def make_hair(head):
    def hairshell(name, keep, off, thick=0.005, lift=None):
        ob = bpy.data.objects.new(name, head.data.copy())
        bpy.context.scene.collection.objects.link(ob)
        vg = ob.vertex_groups.new(name="head")
        ob.parent = head.parent
        md = ob.modifiers.new("Armature", "ARMATURE")
        md.object = head.parent
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        bm.faces.ensure_lookup_table()
        kill = [f for f in bm.faces if not keep(f.calc_center_median())]
        bmesh.ops.delete(bm, geom=kill, context="FACES")
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
        bm.normal_update()
        for v in bm.verts:
            v.co = v.co + v.normal * off(v.co)
        bm.to_mesh(ob.data)
        bm.free()
        vg.add(list(range(len(ob.data.vertices))), 1.0, "REPLACE")
        for p in ob.data.polygons:
            p.use_smooth = True
        if thick:
            m = ob.modifiers.new("Solid", "SOLIDIFY")
            m.thickness = thick
            m.offset = -1.0
            bpy.context.view_layer.objects.active = ob
            bpy.ops.object.modifier_apply(modifier="Solid")
        return ob

    def c_world(c):
        return Vector((c.x, c.z, -c.y))

    def hairline(c):
        g = c_world(c)
        front = g.z > 0.04
        lim = HY(1.7505) if front and abs(g.x) < 0.075 else (HY(1.730) if g.z > -0.02 else HY(1.663))
        return g.y > lim

    out = {}
    out["hair_crop"] = hairshell("hair_crop", lambda c: hairline(c), lambda co: 0.012, 0)
    out["hair_buzz"] = hairshell("hair_buzz", lambda c: hairline(c), lambda co: 0.004, 0)
    out["hair_curly"] = hairshell("hair_curly", lambda c: hairline(c) or (c_world(c).y > HY(1.6854) and c_world(c).z < 0), lambda co: 0.026 + 0.012 * math.sin(co.x * 90) * math.sin(co.y * 85), 0)
    out["hair_afro"] = hairshell("hair_afro", lambda c: c_world(c).y > HY(1.7077) or (c_world(c).y > HY(1.6675) and c_world(c).z < 0.01), lambda co: 0.052 + 0.01 * math.sin(co.x * 60) * math.sin(co.z * 70), 0)
    out["hair_long"] = hairshell("hair_long", lambda c: hairline(c) or (c_world(c).z < 0.012 and HY(1.538) < c_world(c).y < HY(1.7077) and abs(c_world(c).x) < 0.1), lambda co: 0.013, 0)
    out["hair_bun"] = hairshell("hair_bun", lambda c: hairline(c), lambda co: 0.012, 0)
    return out


def paint_regions(ob, fn):
    me = ob.data
    layer = me.color_attributes.get("Col") or me.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
    me.color_attributes.active_color = layer
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            r = fn(v)
            layer.data[li].color = (r, 0.0, 0.0, 1.0)


def world_game(v):
    return Vector((v.x, v.z, -v.y))


def add_parts_object(name, head_arm, builder):
    bm = bmesh.new()
    builder(bm)
    for v in bm.verts:
        v.co = V(*head_t(v.co))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    vg = ob.vertex_groups.new(name="head")
    vg.add(list(range(len(me.vertices))), 1.0, "REPLACE")
    ob.parent = head_arm
    md = ob.modifiers.new("Armature", "ARMATURE")
    md.object = head_arm
    for p in me.polygons:
        p.use_smooth = True
    return ob


def make_extras(arm, female=False):
    out = {}

    def eyes(bm):
        for sx in (-1, 1):
            bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=10, radius=1.0, matrix=Matrix.Translation((sx * 0.032, 1.705, 0.0785)) @ Matrix.Diagonal((0.0115, 0.0105, 0.0115, 1)))

    out["eyes"] = add_parts_object("eyes", arm, eyes)
    EC = head_t((0.032, 1.705, 0.0785))
    paint_regions(out["eyes"], lambda v: (1.0 if math.hypot(abs(world_game(v).x) - EC.x, world_game(v).y - EC.y) < 0.0042 * HEAD_S else 0.5) if (world_game(v).z > EC.z + 0.0066 * HEAD_S and math.hypot(abs(world_game(v).x) - EC.x, world_game(v).y - EC.y) < 0.0086 * HEAD_S) else 0.0)

    def brows(bm):
        for sx in (-1, 1):
            for i in range(6):
                t = i / 5
                x = sx * (0.016 + 0.034 * t)
                y = 1.727 + 0.006 * math.sin(t * math.pi * 0.8) - 0.004 * t
                bmesh.ops.create_uvsphere(bm, u_segments=6, v_segments=4, radius=1.0, matrix=Matrix.Translation((x, y, 0.0955 - 0.006 * t)) @ Matrix.Diagonal((0.0085, 0.0034, 0.005, 1)))

    out["brows"] = add_parts_object("brows", arm, brows)

    def shades(bm):
        for sx in (-1, 1):
            bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((sx * 0.032, 1.707, 0.1)) @ Matrix.Diagonal((0.04, 0.026, 0.006, 1)))
            bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((sx * 0.077, 1.709, 0.05)) @ Matrix.Diagonal((0.004, 0.006, 0.1, 1)))
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((0, 1.714, 0.101)) @ Matrix.Diagonal((0.02, 0.006, 0.006, 1)))

    out["shades"] = add_parts_object("shades", arm, shades)

    def cap(bm):
        for i in range(16):
            for j in range(6):
                pass
        bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=1.0, matrix=Matrix.Translation((0, 1.715, -0.002)) @ Matrix.Diagonal((0.092, 0.092, 0.108, 1)))
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((0, 1.742, 0.118)) @ Matrix.Rotation(-0.12, 4, "X") @ Matrix.Diagonal((0.1, 0.006, 0.085, 1)))
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((0, 1.815, -0.0)) @ Matrix.Diagonal((0.01, 0.007, 0.01, 1)))
        bm.verts.ensure_lookup_table()
        kill = [v for v in bm.verts if v.co.y < 1.742 - 0.0 and (v.co.x ** 2 + (v.co.y - 1.715) ** 2 / 0.85 + v.co.z ** 2) < 0.015 and v.co.y < 1.735]
        bmesh.ops.delete(bm, geom=kill, context="VERTS")

    out["cap"] = add_parts_object("cap", arm, cap)

    def beard(bm):
        for i in range(9):
            t = i / 8
            x = (t - 0.5) * 0.12
            z = 0.045 + 0.04 * (1 - abs(t - 0.5) * 2) + 0.015
            bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=1.0, matrix=Matrix.Translation((x, 1.612 + 0.012 * (abs(t - 0.5) * 2), z)) @ Matrix.Diagonal((0.026, 0.026, 0.026, 1)))
        bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=1.0, matrix=Matrix.Translation((0, 1.598, 0.082)) @ Matrix.Diagonal((0.026, 0.02, 0.024, 1)))
        bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=1.0, matrix=Matrix.Translation((0, 1.646, 0.1)) @ Matrix.Diagonal((0.02, 0.005, 0.008, 1)))

    out["beard"] = add_parts_object("beard", arm, beard)

    def bun(bm):
        bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=1.0, matrix=Matrix.Translation((0, 1.8, -0.075)) @ Matrix.Diagonal((0.04, 0.034, 0.04, 1)))

    out["bun"] = add_parts_object("bun", arm, bun)
    return out


def color_everything(parts):
    h = lambda v: world_game(v)
    paint_regions(parts["head"], lambda v: 0.5 if (math.hypot(h(v).x / 0.027, (h(v).y - HY(1.63)) / 0.0125) < 1.0 and h(v).z > 0.07) else 0.0)
    for sfx in ("_m", "_f"):
        paint_regions(parts["body" + sfx], lambda v: 0.0)
        paint_regions(parts["jacket" + sfx], lambda v: 0.5 if (h(v).y < 0.935 or h(v).y > 1.5 or (h(v).y < 0.905 and abs(h(v).x) > 0.15)) else 0.0)
        paint_regions(parts["long" + sfx], lambda v: 0.5 if (h(v).y > 1.48) else 0.0)
        paint_regions(parts["tee" + sfx], lambda v: 0.5 if (h(v).y > 1.48) else 0.0)
        paint_regions(parts["pants" + sfx], lambda v: 0.5 if (h(v).y > 0.955 or h(v).y < 0.13) else 0.0)
        paint_regions(parts["shorts" + sfx], lambda v: 0.5 if h(v).y > 0.955 else 0.0)
        paint_regions(parts["shoes" + sfx], lambda v: 0.5 if h(v).y < 0.034 else (1.0 if (h(v).z > 0.14 and h(v).y < 0.07) else 0.0))
    paint_regions(parts["skirt_f"], lambda v: 0.5 if (h(v).y < 0.6 or h(v).y > 0.97) else 0.0)
    for k in ("hair_crop", "hair_buzz", "hair_curly", "hair_afro", "hair_long", "hair_bun", "bun", "beard", "cap", "shades", "brows"):
        paint_regions(parts[k], lambda v: 0.0)


def bake_ao(parts, samples=18, reach=0.14):
    from mathutils.bvhtree import BVHTree
    rnd = random.Random(7)
    dirs = []
    for _ in range(samples):
        u, v = rnd.random(), rnd.random()
        r = math.sqrt(u)
        a = 2 * math.pi * v
        z = 0.3 + 0.7 * math.sqrt(max(0.0, 1 - u))
        q = math.sqrt(max(0.0, 1 - z * z))
        dirs.append(Vector((q * math.cos(a), q * math.sin(a), z)))
    occ = ("body", "head", "jacket", "long", "tee", "pants", "shorts", "shoes", "skirt")
    groups = {"m": [k for k in parts if k.split("_")[0] in occ and not k.endswith("_f")], "f": [k for k in parts if k.split("_")[0] in occ and (k.endswith("_f") or k == "head")]}
    trees = {}
    for g, keys in groups.items():
        verts, polys = [], []
        for k in keys:
            me = parts[k].data
            off = len(verts)
            verts.extend([v.co.copy() for v in me.vertices])
            polys.extend([tuple(off + i for i in p.vertices) for p in me.polygons])
        trees[g] = BVHTree.FromPolygons(verts, polys)
    for k, ob in parts.items():
        tree = trees["f"] if k.endswith("_f") else trees["m"]
        me = ob.data
        layer = me.color_attributes.get("Col")
        if layer is None:
            layer = me.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
            for d in layer.data:
                d.color = (0.0, 1.0, 0.0, 1.0)
        me.color_attributes.active_color = layer
        ao = []
        nbm = bmesh.new()
        nbm.from_mesh(me)
        nbm.normal_update()
        nbm.verts.ensure_lookup_table()
        for v in nbm.verts:
            n = v.normal.normalized() if v.normal.length > 0 else Vector((0, 0, 1))
            t = n.cross(Vector((0, 0, 1)) if abs(n.z) < 0.9 else Vector((1, 0, 0))).normalized()
            b = n.cross(t)
            hit = 0
            o = v.co + n * 0.012
            for d in dirs:
                w = t * d.x + b * d.y + n * d.z
                r = tree.ray_cast(o, w, reach)
                if r[0] is not None:
                    hit += 1
            ao.append(1.0 - hit / samples)
        nbm.free()
        for poly in me.polygons:
            for li in poly.loop_indices:
                c = layer.data[li].color
                layer.data[li].color = (c[0], ao[me.loops[li].vertex_index], 0.0, 1.0)


def make_all_old(voxel=0.0085, export=True):
    clear()
    body = make_body(False, voxel)
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.quadriflow_remesh(target_faces=8000, use_mesh_symmetry=False, use_preserve_sharp=False, use_preserve_boundary=False, smooth_normals=True, mode="FACES", seed=1)
    for p in body.data.polygons:
        p.use_smooth = True
    head = make_head(False)
    arm = make_armature()
    bind(body, arm)
    smooth_weights(body, 5, 0.5)
    head_weights(head, arm)
    parts = {"body_m": body, "head": head}
    parts.update(make_clothes(body))
    parts.update(make_hair(head))
    parts.update(make_extras(arm))
    color_everything(parts)
    return parts, arm


def make_skirt(arm, name="skirt", top=0.99, hem=0.56):
    bm = bmesh.new()
    rings, segs = 8, 26
    vs = []
    for i in range(rings):
        t = i / (rings - 1)
        h = top + (hem - top) * t
        rx = 0.172 + (0.265 - 0.172) * t ** 1.3
        rz = 0.12 + (0.2 - 0.12) * t ** 1.3
        row = []
        for k in range(segs):
            a = k / segs * math.tau
            row.append(bm.verts.new(V(math.cos(a) * rx, h, math.sin(a) * rz)))
        vs.append(row)
    for i in range(rings - 1):
        for k in range(segs):
            bm.faces.new((vs[i][k], vs[i][(k + 1) % segs], vs[i + 1][(k + 1) % segs], vs[i + 1][k]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    gh = ob.vertex_groups.new(name="hips")
    gl = ob.vertex_groups.new(name="legL")
    gr = ob.vertex_groups.new(name="legR")
    for v in me.vertices:
        h = v.co.z
        t = smoothstep(top, hem + 0.06, h) * 0.85
        left = v.co.x < 0
        (gl if left else gr).add([v.index], t, "REPLACE")
        gh.add([v.index], 1 - t, "REPLACE")
    ob.parent = arm
    md = ob.modifiers.new("Armature", "ARMATURE")
    md.object = arm
    for p in me.polygons:
        p.use_smooth = True
    return ob


def build_set(female, voxel=0.0085):
    sfx = "_f" if female else "_m"
    body = make_body(female, voxel)
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.quadriflow_remesh(target_faces=8000, use_mesh_symmetry=False, use_preserve_sharp=False, use_preserve_boundary=False, smooth_normals=True, mode="FACES", seed=1)
    for p in body.data.polygons:
        p.use_smooth = True
    return body


def make_all(voxel=0.0085):
    clear()
    arm = make_armature()
    head = make_head(False)
    head_weights(head, arm)
    out = {}
    for female in (False, True):
        sfx = "_f" if female else "_m"
        body = build_set(female, voxel)
        bind(body, arm)
        smooth_weights(body, 5, 0.5)
        body.name = "body" + sfx
        cl = make_clothes(body)
        for k, v in cl.items():
            v.name = k + sfx
            out[k + sfx] = v
        out["body" + sfx] = body
        if female:
            sk = make_skirt(arm, "skirt_f")
            out["skirt_f"] = sk
    out["head"] = head
    out.update(make_hair(head))
    out.update(make_extras(arm))
    color_everything(out)
    bake_ao(out)
    return out, arm


def human_material():
    m = bpy.data.materials.new("human")
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


def export_human(parts, arm):
    mat = human_material()
    for k, o in parts.items():
        o.data.materials.clear()
        o.data.materials.append(mat)
        o.hide_render = False
        o.hide_viewport = False
    bpy.ops.object.select_all(action="DESELECT")
    for o in parts.values():
        o.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "human.glb"), export_format="GLB", use_selection=True, export_yup=True, export_apply=False, export_normals=True, export_vertex_color="ACTIVE", export_skins=True, export_animations=False)
