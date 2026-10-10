import bpy
import bmesh
import math
import os
import random
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\Raahim Syed\neon-harbor\tools"
OUT = os.path.join(os.path.dirname(ROOT), "assets", "models")


class Part:
    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.col = self.bm.loops.layers.color.new("Col")
        self.rng = random.Random(hash(name) & 0xffff)

    def _paint(self, verts, color, jitter=0.0):
        faces = {f for v in verts for f in v.link_faces}
        j = 1.0 + self.rng.uniform(-jitter, jitter)
        c = (min(1, color[0] * j), min(1, color[1] * j), min(1, color[2] * j), 1.0)
        for f in faces:
            for l in f.loops:
                l[self.col] = c

    def box(self, cx, cy, cz, sx, sy, sz, color, rot=(0, 0, 0), jitter=0.04):
        m = Matrix.Translation((cx, cy, cz)) @ Matrix.Rotation(rot[2], 4, "Z") @ Matrix.Rotation(rot[1], 4, "Y") @ Matrix.Rotation(rot[0], 4, "X") @ Matrix.Diagonal((sx, sy, sz, 1))
        r = bmesh.ops.create_cube(self.bm, size=1.0, matrix=m)
        self._paint(r["verts"], color, jitter)

    def cyl(self, cx, cy, z0, r1, r2, h, color, sides=14, smooth=True, jitter=0.03, cap=True, rot=None):
        m = Matrix.Translation((cx, cy, z0 + h / 2))
        if rot:
            m = Matrix.Translation((cx, cy, z0)) @ Matrix.Rotation(rot[2], 4, "Z") @ Matrix.Rotation(rot[1], 4, "Y") @ Matrix.Rotation(rot[0], 4, "X") @ Matrix.Translation((0, 0, h / 2))
        r = bmesh.ops.create_cone(self.bm, cap_ends=cap, cap_tris=False, segments=sides, radius1=r1, radius2=r2, depth=h, matrix=m)
        self._paint(r["verts"], color, jitter)
        if smooth:
            faces = {f for v in r["verts"] for f in v.link_faces}
            for f in faces:
                if len(f.verts) == 4:
                    f.smooth = True
            for e in {e for v in r["verts"] for e in v.link_edges}:
                if all(not f.smooth for f in e.link_faces) or any(not f.smooth for f in e.link_faces):
                    e.smooth = False if any(not f.smooth for f in e.link_faces) else True

    def sphere_cap(self, cx, cy, cz, radius, color, cut=0.55, rot=(0, 0, 0), u=14, v=8):
        m = Matrix.Translation((cx, cy, cz)) @ Matrix.Rotation(rot[2], 4, "Z") @ Matrix.Rotation(rot[1], 4, "Y") @ Matrix.Rotation(rot[0], 4, "X")
        r = bmesh.ops.create_uvsphere(self.bm, u_segments=u, v_segments=v, radius=radius, matrix=m)
        inv = m.inverted()
        kill = [vv for vv in r["verts"] if (inv @ vv.co).z < -radius * cut]
        bmesh.ops.delete(self.bm, geom=kill, context="VERTS")
        left = [vv for vv in r["verts"] if vv.is_valid]
        self._paint(left, color, 0.02)
        for f in {f for vv in left for f in vv.link_faces}:
            f.smooth = True

    def finish(self, mat):
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me)
        self.bm.free()
        me.materials.append(mat)
        ob = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(ob)
        return ob


IRON = (0.04, 0.045, 0.05)
STEEL = (0.32, 0.34, 0.36)
LIGHT = (0.55, 0.57, 0.58)
WOOD = (0.2, 0.12, 0.06)
DARKWOOD = (0.1, 0.06, 0.03)
ROOFG = (0.07, 0.075, 0.08)
RED = (0.55, 0.06, 0.05)
CREAM = (0.62, 0.58, 0.48)


def water_tower():
    p = Part("water_tower")
    for i in range(6):
        a = i / 6 * math.tau + 0.26
        x, y = math.cos(a) * 1.25, math.sin(a) * 1.25
        p.box(x, y, 1.6, 0.14, 0.14, 3.2, IRON, rot=(0, 0, a))
    for z in (0.7, 1.7):
        for i in range(6):
            a = i / 6 * math.tau + 0.26
            b = (i + 1) / 6 * math.tau + 0.26
            x1, y1, x2, y2 = math.cos(a) * 1.25, math.sin(a) * 1.25, math.cos(b) * 1.25, math.sin(b) * 1.25
            ln = math.hypot(x2 - x1, y2 - y1)
            p.box((x1 + x2) / 2, (y1 + y2) / 2, z, ln, 0.07, 0.07, IRON, rot=(0, 0, math.atan2(y2 - y1, x2 - x1)))
    p.cyl(0, 0, 3.15, 1.62, 1.62, 0.18, DARKWOOD, sides=20)
    p.cyl(0, 0, 3.3, 1.55, 1.5, 2.5, WOOD, sides=24, jitter=0.1)
    for z in (3.65, 4.4, 5.15):
        p.cyl(0, 0, z, 1.6, 1.6, 0.09, IRON, sides=24)
    p.cyl(0, 0, 5.8, 1.62, 0.12, 1.15, ROOFG, sides=24)
    p.cyl(0, 0, 6.95, 0.18, 0.18, 0.3, IRON, sides=8)
    p.box(1.65, 0, 3.9, 0.08, 0.5, 3.2, IRON)
    for z in [3.6 + 0.35 * k for k in range(8)]:
        p.box(1.7, 0, z, 0.06, 0.44, 0.05, IRON)
    p.cyl(0, 1.5, 3.25, 0.18, 0.18, 0.9, STEEL, sides=8, rot=(math.pi / 2 - 0.9, 0, 0))
    return p


def hvac_unit():
    p = Part("hvac_unit")
    p.box(0, 0, 0.12, 2.2, 1.2, 0.24, IRON)
    p.box(0, 0, 0.24 + 0.55, 2.0, 1.05, 1.1, LIGHT, jitter=0.08)
    p.box(0, 0, 1.38, 2.05, 1.1, 0.07, STEEL)
    p.cyl(0.45, 0, 1.4, 0.42, 0.42, 0.05, IRON, sides=18)
    for i in range(6):
        a = i / 6 * math.tau
        p.box(0.45 + math.cos(a) * 0.2, math.sin(a) * 0.2, 1.46, 0.36, 0.07, 0.02, STEEL, rot=(0, 0, a))
    p.cyl(0.45, 0, 1.43, 0.06, 0.06, 0.1, IRON, sides=8)
    for i in range(7):
        p.box(-0.5, -0.545, 0.4 + i * 0.11, 0.9, 0.03, 0.04, STEEL)
    p.box(0.9, 0.58, 0.8, 0.12, 0.08, 0.5, IRON)
    p.box(-0.85, 0.65, 0.5, 0.1, 0.4, 0.1, STEEL)
    p.cyl(-0.85, 0.85, 0.2, 0.07, 0.07, 0.7, STEEL, sides=8)
    return p


def vent_stack():
    p = Part("vent_stack")
    p.cyl(0, 0, 0, 0.32, 0.3, 1.6, STEEL, sides=14)
    p.cyl(0, 0, 0, 0.42, 0.42, 0.14, IRON, sides=14)
    p.cyl(0, 0, 1.6, 0.55, 0.12, 0.38, LIGHT, sides=14)
    p.cyl(0, 0, 1.6, 0.36, 0.36, 0.05, IRON, sides=14)
    p.cyl(0.7, 0, 0, 0.12, 0.12, 1.1, STEEL, sides=10)
    p.cyl(0.7, 0, 1.1, 0.2, 0.2, 0.05, IRON, sides=10)
    p.box(0.7, 0, 1.3, 0.4, 0.04, 0.04, STEEL, rot=(0, 0, 0.3))
    return p


def rooftop_shed():
    p = Part("rooftop_shed")
    p.box(0, 0, 1.3, 3.0, 2.4, 2.6, CREAM, jitter=0.07)
    p.box(0, 0, 2.67, 3.3, 2.7, 0.14, ROOFG)
    p.box(0, 0, 2.78, 3.0, 2.4, 0.08, (0.12, 0.125, 0.13))
    p.box(0, -1.22, 0.95, 1.0, 0.06, 1.9, IRON)
    p.box(0, -1.26, 0.95, 0.88, 0.04, 1.78, (0.2, 0.25, 0.22))
    p.box(0.33, -1.3, 0.95, 0.06, 0.06, 0.1, STEEL)
    p.box(0, -1.4, 0.05, 1.5, 0.5, 0.1, (0.3, 0.3, 0.3))
    p.box(0, -1.33, 2.12, 1.25, 0.1, 0.08, IRON)
    p.box(1.52, 0.3, 1.6, 0.04, 0.8, 0.5, IRON)
    for i in range(5):
        p.box(1.54, 0.3, 1.4 + i * 0.09, 0.03, 0.72, 0.04, STEEL)
    p.cyl(-0.9, 0.4, 2.8, 0.1, 0.1, 0.55, STEEL, sides=8)
    p.cyl(-0.9, 0.4, 3.35, 0.2, 0.2, 0.04, IRON, sides=8)
    return p


def antenna_mast():
    p = Part("antenna_mast")
    h = 9.0
    for i in range(4):
        a = i / 4 * math.tau + math.pi / 4
        p.box(math.cos(a) * 0.32, math.sin(a) * 0.32, h / 2, 0.06, 0.06, h, STEEL, jitter=0.02)
    for k in range(9):
        z0, z1 = k * 1.0, (k + 1) * 1.0
        for i in range(4):
            a = i / 4 * math.tau + math.pi / 4
            b = (i + 1) / 4 * math.tau + math.pi / 4
            x1, y1, x2, y2 = math.cos(a) * 0.32, math.sin(a) * 0.32, math.cos(b) * 0.32, math.sin(b) * 0.32
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            ln = math.hypot(x2 - x1, y2 - y1)
            tilt = math.atan2(1.0, ln) * (1 if (k + i) % 2 == 0 else -1)
            ang = math.atan2(y2 - y1, x2 - x1)
            p.box(mx, my, (z0 + z1) / 2, math.hypot(ln, 1.0), 0.035, 0.035, STEEL, rot=(0, 0, ang))
    p.cyl(0, 0, h, 0.04, 0.04, 1.4, STEEL, sides=6)
    p.cyl(0, 0, 0, 0.55, 0.55, 0.12, IRON, sides=12)
    p.box(0, 0.3, 6.5, 0.9, 0.05, 0.05, STEEL)
    p.box(0, 0.3, 5.2, 0.9, 0.05, 0.05, STEEL)
    p.sphere_cap(0, 0, h + 1.5, 0.12, RED, cut=-1.0, u=8, v=6)
    return p


def sat_dish():
    p = Part("sat_dish")
    p.cyl(0, 0, 0, 0.08, 0.08, 1.0, STEEL, sides=8)
    p.cyl(0, 0, 0, 0.28, 0.28, 0.06, IRON, sides=10)
    p.box(0, -0.12, 1.05, 0.06, 0.34, 0.06, STEEL, rot=(0.5, 0, 0))
    p.sphere_cap(0, -0.32, 1.2, 0.62, LIGHT, cut=0.82, rot=(math.pi / 2 + 0.5, 0, 0), u=20, v=10)
    p.box(0, -0.62, 1.42, 0.04, 0.04, 0.55, STEEL, rot=(-0.5, 0, 0))
    p.cyl(0, -0.82, 1.48, 0.06, 0.06, 0.1, IRON, sides=8)
    return p


def awning():
    p = Part("awning")
    n = 10
    depth, drop = 1.15, 0.5
    for i in range(n):
        x0, x1 = -0.5 + i / n, -0.5 + (i + 1) / n
        c = (0.62, 0.07, 0.06) if i % 2 == 0 else (0.82, 0.78, 0.7)
        xc = (x0 + x1) / 2
        w = 1.0 / n
        p.box(xc, -depth / 2, -drop / 2 + 0.5 * drop, w, math.hypot(depth, drop), 0.025, c, rot=(math.atan2(drop, depth), 0, 0), jitter=0.01)
        p.box(xc, -depth + 0.02, -drop - 0.045, w, 0.025, 0.14, c, jitter=0.01)
    for sx in (-0.5, 0.5):
        p.box(sx, -depth / 2, -drop / 2 + 0.25 * drop, 0.02, depth, 0.02, IRON, rot=(math.atan2(drop, depth), 0, 0))
        p.box(sx, -depth + 0.02, -drop - 0.05, 0.02, 0.02, 0.2, IRON)
    p.box(0, 0.0, 0.0, 1.0, 0.06, 0.08, IRON)
    return p


def balcony():
    p = Part("balcony")
    p.box(0, -0.6, 0.0, 2.4, 1.2, 0.14, (0.5, 0.5, 0.5), jitter=0.05)
    p.box(0, -1.2, 0.0, 2.44, 0.05, 0.18, (0.42, 0.42, 0.42))
    for i in range(13):
        x = -1.15 + i * (2.3 / 12)
        p.box(x, -1.15, 0.55, 0.03, 0.03, 1.0, IRON)
    for sx in (-1.15, 1.15):
        for j in range(6):
            p.box(sx, -0.1 - j * 0.2 - 0.05, 0.55, 0.03, 0.03, 1.0, IRON)
    p.box(0, -1.15, 1.06, 2.34, 0.05, 0.05, IRON)
    p.box(0, -1.15, 0.12, 2.34, 0.04, 0.04, IRON)
    for sx in (-1.15, 1.15):
        p.box(sx, -0.6, 1.06, 0.05, 1.1, 0.05, IRON)
    p.box(0.7, -0.6, 0.38, 0.5, 0.5, 0.05, (0.22, 0.14, 0.09))
    p.cyl(0.7, -0.6, 0.07, 0.15, 0.2, 0.2, (0.45, 0.18, 0.1), sides=10)
    p.sphere_cap(0.7, -0.6, 0.45, 0.2, (0.08, 0.22, 0.07), cut=-0.4, u=8, v=6)
    return p


def fire_escape():
    p = Part("fire_escape")
    fh = 3.6
    p.box(0, -0.55, fh, 2.6, 1.1, 0.06, IRON)
    for i in range(9):
        p.box(-1.2 + i * 0.3, -0.55, fh + 0.035, 0.05, 1.04, 0.03, IRON)
    for sx in (-1.3, 1.3):
        p.box(sx, -0.55, fh + 0.5, 0.04, 1.1, 0.04, IRON)
        for j in range(4):
            p.box(sx, -0.1 - j * 0.32, fh + 0.28, 0.03, 0.03, 0.55, IRON)
    p.box(0, -1.08, fh + 0.5, 2.6, 0.04, 0.04, IRON)
    p.box(0, -1.08, fh + 0.28, 2.6, 0.03, 0.03, IRON)
    for i in range(10):
        p.box(0, -1.0, fh + 0.28 + 0.0, 0.03, 0.03, 0.03, IRON)
    steps = 12
    for i in range(steps):
        t = i / steps
        p.box(-0.9 + 0.0, -0.55 - 0.0, fh - t * fh - 0.1, 0.7, 0.26, 0.04, IRON)
    for i in range(steps):
        t = i / steps
        p.box(0.0, 0.0, 0.0, 0.0001, 0.0001, 0.0001, IRON)
    p.box(-0.9 - 0.36, -0.55, fh / 2, 0.04, 0.04, fh + 0.5, IRON, rot=(0, 0.0, 0))
    p.box(-0.9 + 0.36, -0.55, fh / 2, 0.04, 0.04, fh + 0.5, IRON)
    p.box(1.3, -0.1, fh / 2, 0.05, 0.05, fh, IRON)
    p.box(1.3, -1.05, fh / 2, 0.05, 0.05, fh, IRON)
    p.box(-1.3, -1.05, fh / 2, 0.05, 0.05, fh, IRON)
    for z in [0.3 * k for k in range(1, 12)]:
        p.box(1.0, -0.95, z, 0.4, 0.03, 0.03, IRON)
    p.box(0.8, -0.95, fh / 2, 0.03, 0.03, fh, IRON)
    p.box(1.2, -0.95, fh / 2, 0.03, 0.03, fh, IRON)
    return p


def window_ac():
    p = Part("window_ac")
    p.box(0, -0.25, 0.2, 0.65, 0.5, 0.4, (0.72, 0.72, 0.7), jitter=0.05)
    p.box(0, -0.505, 0.2, 0.6, 0.02, 0.33, STEEL)
    for i in range(5):
        p.box(0, -0.52, 0.08 + i * 0.065, 0.55, 0.012, 0.02, IRON)
    p.box(0, -0.25, 0.03, 0.55, 0.45, 0.04, IRON)
    return p


def blade_sign():
    p = Part("blade_sign")
    p.box(0, -0.3, 0.0, 0.06, 0.6, 0.06, IRON)
    p.box(0, -0.6, -0.55, 0.12, 0.12, 1.1, IRON)
    p.box(0, -0.6, -0.55, 0.06, 0.2, 0.96, (0.9, 0.85, 0.5))
    p.box(0, -0.15, -0.1, 0.03, 0.03, 0.4, IRON, rot=(0, 0, 0))
    return p


def street_planter():
    p = Part("street_planter")
    p.box(0, 0, 0.35, 1.2, 0.5, 0.7, (0.4, 0.4, 0.38), jitter=0.06)
    p.box(0, 0, 0.72, 1.3, 0.6, 0.06, (0.3, 0.3, 0.28))
    for k in range(7):
        a = k * 0.9
        p.sphere_cap(math.cos(a) * 0.35, math.sin(a) * 0.14, 0.9 + 0.1 * (k % 3), 0.28, (0.07, 0.2 + 0.03 * (k % 3), 0.07), cut=-0.5, u=8, v=6)
    return p


BUILDERS = [water_tower, hvac_unit, vent_stack, rooftop_shed, antenna_mast, sat_dish, awning, balcony, fire_escape, window_ac, blade_sign, street_planter]


def make_material():
    m = bpy.data.materials.new("prop")
    m.use_nodes = True
    nt = m.node_tree
    for nd in list(nt.nodes):
        if nd.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(nd)
    out = next(nd for nd in nt.nodes if nd.type == "OUTPUT_MATERIAL")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.75
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


def run(export=True):
    for o in list(bpy.data.objects):
        if o.type == "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    for b in list(bpy.data.meshes):
        bpy.data.meshes.remove(b)
    for b in list(bpy.data.materials):
        bpy.data.materials.remove(b)
    mat = make_material()
    made = []
    for i, fn in enumerate(BUILDERS):
        ob = fn().finish(mat)
        ob.location = ((i % 6) * 5.0, -(i // 6) * 6.0, 0)
        made.append(ob)
        print(ob.name, sum(len(p.vertices) - 2 for p in ob.data.polygons))
    if export:
        os.makedirs(OUT, exist_ok=True)
        locs = [ob.location.copy() for ob in made]
        for ob in made:
            ob.location = (0, 0, 0)
        bpy.ops.object.select_all(action="DESELECT")
        for ob in made:
            ob.select_set(True)
        bpy.context.view_layer.objects.active = made[0]
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "city_props.glb"), export_format="GLB", use_selection=True, export_yup=True, export_apply=True, export_normals=True, export_vertex_color="ACTIVE")
        for ob, l in zip(made, locs):
            ob.location = l
    return made
