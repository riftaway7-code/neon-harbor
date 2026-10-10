import bpy
import bmesh
import math
import os
import sys
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\Raahim Syed\neon-harbor\tools"
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
import importlib
import make_props as MP
importlib.reload(MP)

OUT = os.path.join(os.path.dirname(ROOT), "assets", "models")

METAL = (0.09, 0.1, 0.13)
METAL2 = (0.16, 0.17, 0.2)
IRON = (0.04, 0.045, 0.05)
STEEL = (0.38, 0.4, 0.43)
BLACK = (0.02, 0.022, 0.025)
RED = (0.62, 0.07, 0.05)
BLUE = (0.1, 0.22, 0.55)
GREEN = (0.05, 0.28, 0.14)
WOOD = (0.32, 0.18, 0.08)
CREAM = (0.75, 0.72, 0.62)
WHITE = (0.85, 0.85, 0.82)


def between(p, a, b, r1, r2, color, sides=8):
    a = Vector(a)
    b = Vector(b)
    d = b - a
    ln = d.length
    if ln < 1e-5:
        return
    z = Vector((0, 0, 1))
    q = z.rotation_difference(d.normalized())
    m = Matrix.Translation(a) @ q.to_matrix().to_4x4() @ Matrix.Translation((0, 0, ln / 2))
    r = bmesh.ops.create_cone(p.bm, cap_ends=True, cap_tris=False, segments=sides, radius1=r1, radius2=r2, depth=ln, matrix=m)
    p._paint(r["verts"], color, 0.02)
    for f in {f for v in r["verts"] for f in v.link_faces}:
        if len(f.verts) == 4:
            f.smooth = True


def street_lamp():
    p = MP.Part("street_lamp")
    p.cyl(0, 0, 0, 0.3, 0.3, 0.42, METAL2, sides=12)
    p.cyl(0, 0, 0.42, 0.22, 0.15, 0.4, METAL, sides=12)
    p.cyl(0, 0, 0.8, 0.14, 0.085, 6.4, METAL, sides=12)
    for z, r in ((1.0, 0.17), (6.7, 0.12)):
        p.cyl(0, 0, z, r, r, 0.07, METAL2, sides=12)
    p.cyl(0, 0, 3.4, 0.125, 0.12, 0.05, METAL2, sides=12)
    pts = []
    n = 8
    for i in range(n + 1):
        t = i / n
        pts.append((0, -2.15 * t, 7.0 + 0.95 * (1 - (1 - t) ** 2.4)))
    for i in range(n):
        between(p, pts[i], pts[i + 1], 0.065 - 0.012 * i / n, 0.065 - 0.012 * (i + 1) / n, METAL)
    between(p, (0, 0, 6.2), (0, -1.2, 7.35), 0.03, 0.03, METAL)
    ex, ey, ez = pts[-1]
    p.box(0, ey - 0.28, ez - 0.05, 0.46, 1.05, 0.2, METAL2)
    p.box(0, ey - 0.28, ez + 0.1, 0.4, 0.95, 0.1, METAL)
    p.box(0, ey + 0.28, ez - 0.02, 0.36, 0.28, 0.2, METAL2)
    p.cyl(0, ey - 0.78, ez - 0.05, 0.19, 0.12, 0.16, METAL2, sides=10, rot=(math.pi / 2, 0, 0))
    p.box(0, ey - 0.28, ez - 0.16, 0.42, 0.98, 0.03, IRON)
    return p


def street_lamp_glow():
    p = MP.Part("street_lamp_glow")
    ey, ez = -2.15, 7.0 + 0.95
    p.box(0, ey - 0.28, ez - 0.18, 0.36, 0.86, 0.02, (1, 0.85, 0.5), jitter=0)
    return p


def traffic_signal():
    p = MP.Part("traffic_signal")
    p.cyl(0, 0, 0, 0.26, 0.26, 0.3, METAL2, sides=10)
    p.cyl(0, 0, 0.3, 0.17, 0.1, 0.35, METAL, sides=10)
    p.cyl(0, 0, 0.6, 0.1, 0.085, 5.5, METAL, sides=10)
    p.cyl(0, 0, 6.05, 0.09, 0.09, 0.12, METAL2, sides=10)
    between(p, (0, 0, 6.0), (0, -5.15, 6.0), 0.075, 0.05, METAL)
    between(p, (0, 0, 5.1), (0, -2.5, 5.95), 0.035, 0.03, METAL)
    p.box(0, -5.0, 5.82, 0.1, 0.1, 0.22, METAL2)
    p.box(0, -5.0, 5.3, 0.34, 0.44, 1.28, METAL)
    p.box(-0.16, -5.0, 5.3, 0.04, 0.9, 1.7, IRON)
    for z in (5.7, 5.3, 4.9):
        p.box(0.2, -5.0, z, 0.06, 0.34, 0.34, IRON)
        p.box(0.28, -5.0, z + 0.2, 0.26, 0.36, 0.035, METAL2)
        p.box(0.28, -5.17, z + 0.02, 0.26, 0.035, 0.36, METAL2)
        p.box(0.28, -4.83, z + 0.02, 0.26, 0.035, 0.36, METAL2)
    p.box(0.2, 0, 2.75, 0.3, 0.32, 0.4, METAL)
    p.box(0.36, 0, 2.85, 0.02, 0.22, 0.18, (0.9, 0.35, 0.1))
    p.box(0.36, 0, 2.65, 0.02, 0.22, 0.14, (0.8, 0.8, 0.8))
    p.box(0, -1.15, 6.3, 0.05, 1.5, 0.28, GREEN)
    p.box(0, -1.15, 6.3, 0.06, 1.4, 0.04, WHITE)
    return p


def hydrant():
    p = MP.Part("hydrant")
    p.cyl(0, 0, 0, 0.22, 0.22, 0.08, RED, sides=12)
    p.cyl(0, 0, 0.08, 0.16, 0.14, 0.5, RED, sides=12)
    p.cyl(0, 0, 0.58, 0.19, 0.19, 0.07, (0.5, 0.05, 0.04), sides=12)
    p.sphere_cap(0, 0, 0.62, 0.15, RED, cut=-0.05, u=12, v=6)
    p.cyl(0, 0, 0.78, 0.04, 0.04, 0.05, STEEL, sides=8)
    p.cyl(0.0, -0.1, 0.38, 0.08, 0.08, 0.2, RED, sides=10, rot=(math.pi / 2, 0, 0))
    p.cyl(-0.12, 0, 0.38, 0.06, 0.06, 0.12, RED, sides=10, rot=(0, -math.pi / 2, 0))
    p.cyl(0.12, 0, 0.38, 0.06, 0.06, 0.12, RED, sides=10, rot=(0, math.pi / 2, 0))
    p.cyl(0, -0.2, 0.38, 0.075, 0.075, 0.03, STEEL, sides=10, rot=(math.pi / 2, 0, 0))
    return p


def trash_can():
    p = MP.Part("trash_can")
    p.cyl(0, 0, 0.0, 0.3, 0.3, 0.06, IRON, sides=14)
    p.cyl(0, 0, 0.06, 0.3, 0.34, 0.82, GREEN, sides=16)
    for z in (0.25, 0.55, 0.85):
        p.cyl(0, 0, z, 0.32 + 0.02 * (z / 0.9), 0.32 + 0.02 * (z / 0.9), 0.04, METAL2, sides=16)
    p.cyl(0, 0, 0.9, 0.37, 0.37, 0.05, METAL, sides=16)
    p.cyl(0, 0, 0.95, 0.35, 0.24, 0.1, METAL, sides=16)
    p.cyl(0, 0, 1.05, 0.12, 0.12, 0.03, IRON, sides=10)
    p.box(0, -0.31, 0.55, 0.2, 0.02, 0.3, (0.7, 0.7, 0.7))
    return p


def bench():
    p = MP.Part("bench")
    for i in range(5):
        p.box(0, -0.24 + i * 0.1, 0.46, 1.8, 0.08, 0.045, WOOD)
    for i in range(3):
        p.box(0, 0.26, 0.64 + i * 0.12, 1.8, 0.045, 0.09, WOOD)
    for sx in (-0.8, 0.8):
        p.box(sx, 0.02, 0.2, 0.06, 0.62, 0.05, IRON)
        p.box(sx, -0.26, 0.22, 0.06, 0.05, 0.44, IRON)
        p.box(sx, 0.27, 0.5, 0.06, 0.05, 0.98, IRON, rot=(0.08, 0, 0))
        p.box(sx, -0.1, 0.68, 0.06, 0.5, 0.05, IRON)
        p.box(sx, -0.33, 0.62, 0.06, 0.05, 0.2, IRON)
    return p


def mailbox():
    p = MP.Part("mailbox")
    p.box(0, 0, 0.05, 0.5, 0.42, 0.1, METAL)
    p.box(0, 0, 0.45, 0.14, 0.14, 0.75, METAL)
    p.box(0, 0, 0.85, 0.5, 0.42, 0.62, BLUE)
    p.cyl(0, 0, 1.16, 0.0, 0.0, 0.01, BLUE, sides=4)
    p.cyl(-0.0, 0.0, 1.14, 0.25, 0.25, 0.42, BLUE, sides=16, rot=(0, math.pi / 2, 0))
    p.box(0, -0.215, 1.0, 0.36, 0.02, 0.07, BLACK)
    p.box(0, -0.215, 0.7, 0.3, 0.02, 0.2, STEEL)
    p.box(0.28, 0, 1.05, 0.03, 0.03, 0.22, RED)
    return p


def parking_meter():
    p = MP.Part("parking_meter")
    p.cyl(0, 0, 0, 0.06, 0.06, 0.08, IRON, sides=8)
    p.cyl(0, 0, 0.08, 0.035, 0.035, 1.05, STEEL, sides=8)
    p.box(0, 0, 1.27, 0.2, 0.14, 0.34, METAL2)
    p.cyl(0, 0, 1.43, 0.1, 0.1, 0.06, METAL, sides=12, rot=(math.pi / 2, 0, 0))
    p.box(0, -0.076, 1.3, 0.14, 0.012, 0.1, (0.55, 0.62, 0.45))
    p.box(0, -0.076, 1.16, 0.05, 0.012, 0.04, IRON)
    return p


def newspaper_box():
    p = MP.Part("newspaper_box")
    p.box(0, 0, 0.45, 0.46, 0.42, 0.9, RED)
    p.box(0, -0.215, 0.62, 0.34, 0.02, 0.3, (0.85, 0.85, 0.8))
    p.box(0, -0.22, 0.3, 0.4, 0.02, 0.22, METAL)
    p.box(0, 0, 0.92, 0.5, 0.46, 0.05, METAL2)
    p.box(0, -0.23, 0.82, 0.12, 0.03, 0.04, STEEL)
    return p


def bus_shelter():
    p = MP.Part("bus_shelter")
    w, d = 3.4, 1.4
    p.box(0, 0, 2.6, w + 0.3, d + 0.3, 0.12, METAL)
    p.box(0, 0, 2.7, w + 0.1, d + 0.1, 0.05, METAL2)
    for sx in (-w / 2, w / 2):
        for sy in (-d / 2 + 0.05, d / 2 - 0.05):
            p.box(sx, sy, 1.3, 0.08, 0.08, 2.6, METAL)
    p.box(0, d / 2 - 0.04, 1.3, w - 0.1, 0.05, 2.5, (0.2, 0.3, 0.35))
    p.box(0, d / 2 - 0.07, 1.4, 1.5, 0.03, 1.7, (0.85, 0.55, 0.15))
    p.box(0, d / 2 - 0.09, 1.4, 1.36, 0.02, 1.56, (0.95, 0.9, 0.7))
    p.box(-w / 2, 0, 1.3, 0.05, d - 0.1, 2.5, (0.2, 0.3, 0.35))
    p.box(0, 0.35, 0.5, 2.2, 0.4, 0.05, WOOD)
    for sx in (-1.0, 1.0):
        p.box(sx, 0.35, 0.25, 0.05, 0.4, 0.5, IRON)
    p.box(w / 2 - 0.5, -d / 2 - 0.1, 1.2, 0.08, 0.08, 2.4, METAL)
    p.box(w / 2 - 0.5, -d / 2 - 0.1, 2.1, 0.6, 0.04, 0.5, GREEN)
    p.box(w / 2 - 0.5, -d / 2 - 0.13, 2.1, 0.5, 0.02, 0.4, WHITE)
    return p


def bollard():
    p = MP.Part("bollard")
    p.cyl(0, 0, 0, 0.1, 0.1, 0.85, METAL2, sides=12)
    p.sphere_cap(0, 0, 0.85, 0.1, METAL2, cut=-0.05, u=12, v=5)
    p.cyl(0, 0, 0.55, 0.103, 0.103, 0.06, (0.85, 0.75, 0.1), sides=12)
    return p


BUILDERS = [street_lamp, street_lamp_glow, traffic_signal, hydrant, trash_can, bench, mailbox, parking_meter, newspaper_box, bus_shelter, bollard]


def run(export=True):
    for o in list(bpy.data.objects):
        if o.type == "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    for b in list(bpy.data.meshes):
        bpy.data.meshes.remove(b)
    for b in list(bpy.data.materials):
        bpy.data.materials.remove(b)
    mat = MP.make_material()
    made = []
    for i, fn in enumerate(BUILDERS):
        ob = fn().finish(mat)
        ob.location = ((i % 6) * 6.0, -(i // 6) * 7.0, 0)
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
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "street_kit.glb"), export_format="GLB", use_selection=True, export_yup=True, export_apply=True, export_normals=True, export_vertex_color="ACTIVE")
        for ob, l in zip(made, locs):
            ob.location = l
    return made
