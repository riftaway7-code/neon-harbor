import bpy
import bmesh
import math
import os
import sys
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\Raahim Syed\neon-harbor\tools"
OUT = os.path.join(os.path.dirname(ROOT), "assets", "models")
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import make_cars as MC

V = MC.V
make_material = MC.make_material
GLASS = (0.06, 0.09, 0.13)
TIRE = (0.05, 0.052, 0.058)
CHROME = (0.78, 0.8, 0.84)
DARK = (0.05, 0.055, 0.065)
WHITE = (1.0, 1.0, 1.0)


class M(MC.Mesh):
    def cyl(self, a, b, r1, r2, color, sides=14, caps=True):
        a = V(*a)
        b = V(*b)
        d = b - a
        ln = d.length
        if ln < 1e-6:
            return
        q = Vector((0, 0, 1)).rotation_difference(d.normalized())
        m = Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4()
        r = bmesh.ops.create_cone(self.bm, cap_ends=caps, cap_tris=False, segments=sides, radius1=r1, radius2=r2, depth=ln, matrix=m)
        self._paint(r["verts"], color)
        for f in {f for v in r["verts"] for f in v.link_faces}:
            if len(f.verts) == 4:
                f.smooth = True

    def box(self, c, s, color, rot=0.0):
        m = Matrix.Translation(V(*c)) @ Matrix.Rotation(rot, 4, "Z") @ Matrix.Diagonal((s[0], s[2], s[1], 1))
        r = bmesh.ops.create_cube(self.bm, size=1.0, matrix=m)
        self._paint(r["verts"], color)

    def sphere(self, c, s, color, seg=14, rings=8):
        m = Matrix.Translation(V(*c)) @ Matrix.Diagonal((s[0], s[2], s[1], 1))
        r = bmesh.ops.create_uvsphere(self.bm, u_segments=seg, v_segments=rings, radius=1.0, matrix=m)
        self._paint(r["verts"], color)
        for f in {f for v in r["verts"] for f in v.link_faces}:
            f.smooth = True

    def paint_if(self, fn):
        for f in self.bm.faces:
            c = f.calc_center_median()
            n = f.normal
            r = fn(c.x, c.z, -c.y, (n.x, n.z, -n.y))
            if r is not None:
                for l in f.loops:
                    l[self.col] = (r[0], r[1], r[2], 1.0)

    def shade_flat(self):
        for f in self.bm.faces:
            f.smooth = False


def clear_all():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for b in list(bpy.data.meshes):
        bpy.data.meshes.remove(b)
    for b in list(bpy.data.materials):
        bpy.data.materials.remove(b)


def naca(n=14, thick=0.12, cut=1.0):
    pts = []
    us = [(1 - math.cos(i / (n - 1) * math.pi)) / 2 for i in range(n)]
    us = [u * cut for u in us]
    def yt(u):
        x = u / max(cut, 1e-6) * cut
        return 5 * thick * (0.2969 * math.sqrt(max(x, 0)) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4)
    top = [(u, yt(u)) for u in us]
    bot = [(u, -yt(u) * 0.85) for u in reversed(us[1:-1])]
    return top + bot


def wing_rings(stations, thick=0.12, n=14, cut=1.0):
    af = naca(n, thick, cut)
    rings = []
    for st in stations:
        x, zle, chord, y = st
        ring = []
        for u, t in af:
            ring.append((x, y + t * chord / 0.12 * 0.12 * 1.0, zle - u * chord))
        rings.append(ring)
    return rings


def export(parts, name):
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in parts:
        ob.location = (0, 0, 0)
        ob.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name), export_format="GLB", use_selection=True, export_yup=True, export_apply=True, export_normals=True, export_vertex_color="ACTIVE")
