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
import make_cars as MC
importlib.reload(MC)
import make_props as MP

OUT = os.path.join(os.path.dirname(ROOT), "assets", "models")
V = MC.V


class Fm(MC.Mesh):
    def cyly(self, c, r1, r2, h, color, sides=18, smooth=True):
        m = Matrix.Translation(V(c[0], c[1] + h / 2, c[2]))
        r = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=sides, radius1=r1, radius2=r2, depth=h, matrix=m)
        self._paint(r["verts"], color)
        if smooth:
            for f in {f for v in r["verts"] for f in v.link_faces}:
                if len(f.verts) == 4:
                    f.smooth = True

    def sph(self, c, r, color, u=14, v=8, cut=None):
        m = Matrix.Translation(V(*c)) @ Matrix.Diagonal((r[0], r[2], r[1], 1))
        res = bmesh.ops.create_uvsphere(self.bm, u_segments=u, v_segments=v, radius=1.0, matrix=m)
        if cut is not None:
            inv = m.inverted()
            kill = [vv for vv in res["verts"] if (inv @ vv.co).z < cut]
            bmesh.ops.delete(self.bm, geom=kill, context="VERTS")
        left = [vv for vv in res["verts"] if vv.is_valid]
        self._paint(left, color)
        for f in {f for vv in left for f in vv.link_faces}:
            f.smooth = True

    def prism(self, prof, z0, z1, color):
        vs0 = [self.bm.verts.new(V(p[0], p[1], z0)) for p in prof]
        vs1 = [self.bm.verts.new(V(p[0], p[1], z1)) for p in prof]
        n = len(prof)
        faces = [self.bm.faces.new(vs0[::-1]), self.bm.faces.new(vs1)]
        for i in range(n):
            faces.append(self.bm.faces.new((vs0[i], vs0[(i + 1) % n], vs1[(i + 1) % n], vs1[i])))
        self._paint(vs0 + vs1, color)


def slabs(m, pts, thick, z0, z1, color):
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        dx, dy = b[0] - a[0], b[1] - a[1]
        ln = math.hypot(dx, dy)
        nx, ny = dy / ln, -dx / ln
        m.prism([a, b, (b[0] + nx * thick, b[1] + ny * thick), (a[0] + nx * thick, a[1] + ny * thick)], z0, z1, color)


WHITE = (0.75, 0.74, 0.7)
CREAM = (0.62, 0.55, 0.42)
RED = (0.32, 0.035, 0.03)
DRED = (0.2, 0.025, 0.02)
ROOF = (0.08, 0.085, 0.09)
GREYR = (0.14, 0.14, 0.15)
WOOD = (0.17, 0.1, 0.05)
DWOOD = (0.09, 0.05, 0.025)
STEEL = (0.42, 0.44, 0.47)
DSTEEL = (0.2, 0.21, 0.23)
GLASS = (0.04, 0.06, 0.1)
BRICK = (0.28, 0.1, 0.07)
STRAW = (0.5, 0.36, 0.1)
CONC = (0.38, 0.38, 0.37)


def farmhouse():
    m = Fm("farmhouse")
    w, d, wh = 10.0, 14.0, 5.5
    m.cube((0, 0.3, 0), (w + 0.4, 0.6, d + 0.4), CONC)
    m.cube((0, 0.6 + (wh - 0.6) / 2, 0), (w, wh - 0.6, d), CREAM)
    for k in range(int((wh - 0.8) / 0.22)):
        y = 1.0 + k * 0.22
        m.cube((0, y, d / 2 + 0.012), (w, 0.025, 0.03), (0.45, 0.4, 0.3))
        m.cube((0, y, -d / 2 - 0.012), (w, 0.025, 0.03), (0.45, 0.4, 0.3))
        m.cube((w / 2 + 0.012, y, 0), (0.03, 0.025, d), (0.45, 0.4, 0.3))
        m.cube((-w / 2 - 0.012, y, 0), (0.03, 0.025, d), (0.45, 0.4, 0.3))
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube((sx * w / 2, wh / 2 + 0.3, sz * d / 2), (0.28, wh, 0.28), WHITE)
    m.cube((0, wh + 0.05, d / 2), (w + 0.5, 0.3, 0.4), WHITE)
    m.cube((0, wh + 0.05, -d / 2), (w + 0.5, 0.3, 0.4), WHITE)
    rise = 3.6
    ov = 0.7
    slabs(m, [(-w / 2 - ov, wh - 0.1), (0, wh + rise + 0.35), (w / 2 + ov, wh - 0.1)], 0.22, -d / 2 - 0.5, d / 2 + 0.5, ROOF)
    m.prism([(-w / 2, wh), (w / 2, wh), (0, wh + rise)], d / 2 - 0.12, d / 2 + 0.02, CREAM)
    m.prism([(-w / 2, wh), (w / 2, wh), (0, wh + rise)], -d / 2 - 0.02, -d / 2 + 0.12, CREAM)
    for k in range(1, 22):
        t = k / 22.0
        m.cube((-(w / 2 + ov) * (1 - t) - 0.05, wh - 0.1 + (rise + 0.35) * t, 0), (0.02, 0.02, d + 1.0), (0.05, 0.02, 0.02))
        m.cube(((w / 2 + ov) * (1 - t) + 0.05, wh - 0.1 + (rise + 0.35) * t, 0), (0.02, 0.02, d + 1.0), (0.05, 0.02, 0.02))
    m.cube((0, wh + rise + 0.38, 0), (0.5, 0.18, d + 1.2), (0.06, 0.06, 0.07))
    m.cube((0, wh + 1.0, d / 2 + 0.2), (w - 0.6, 0.06, 0.3), WHITE)
    for z in (-3.6, 3.6):
        pass
    for x in (-3.0, 3.0):
        for z in (-5.0, 0.0, 5.0):
            for sg in (-1, 1):
                zz = sg * d / 2 if abs(z) == 5.0 else None
    for z in (-4.5, 0.0, 4.5):
        for sg in (-1, 1):
            m.cube((sg * (w / 2 + 0.05), 3.0, z), (0.1, 1.7, 1.5), GLASS)
            m.cube((sg * (w / 2 + 0.11), 3.0, z), (0.06, 1.85, 0.12), WHITE)
            m.cube((sg * (w / 2 + 0.11), 3.0, z), (0.06, 0.1, 1.65), WHITE)
            m.cube((sg * (w / 2 + 0.11), 3.85, z), (0.1, 0.12, 1.9), WHITE)
            m.cube((sg * (w / 2 + 0.11), 2.1, z), (0.14, 0.1, 1.9), WHITE)
            for k in (-1, 1):
                m.cube((sg * (w / 2 + 0.12), 3.0, z + k * 1.15), (0.08, 1.85, 0.4), (0.12, 0.2, 0.14))
    for x in (-2.5, 2.5):
        m.cube((x, 3.0, d / 2 + 0.05), (1.5, 1.7, 0.1), GLASS)
        m.cube((x, 3.0, d / 2 + 0.11), (0.12, 1.85, 0.06), WHITE)
        m.cube((x, 3.0, d / 2 + 0.11), (1.65, 0.1, 0.06), WHITE)
        m.cube((x, 3.85, d / 2 + 0.11), (1.9, 0.12, 0.1), WHITE)
        m.cube((x, 2.1, d / 2 + 0.14), (1.9, 0.1, 0.14), WHITE)
    m.cube((0, 1.5, d / 2 + 0.05), (1.5, 2.8, 0.14), DWOOD)
    m.cube((0, 1.5, d / 2 + 0.13), (0.6, 2.2, 0.06), WOOD)
    m.cube((0.5, 1.4, d / 2 + 0.2), (0.1, 0.1, 0.1), (0.7, 0.55, 0.2))
    m.cube((0, 0.16, d / 2 + 1.1), (3.0, 0.32, 1.8), CONC)
    m.cube((0, 0.35, d / 2 + 2.0), (3.4, 0.2, 0.7), CONC)
    m.cube((0, 0.3, d / 2 + 1.5), (10.4, 0.3, 3.6), (0.3, 0.2, 0.12))
    for sx in (-1, 1):
        for sz in (0.4, 2.8):
            m.cube((sx * 4.6, 1.9, d / 2 + sz), (0.24, 3.2, 0.24), WHITE)
    m.cube((0, 3.55, d / 2 + 1.6), (10.6, 0.22, 3.4), WHITE)
    slabs(m, [(-5.4, 3.5), (0, 4.5), (5.4, 3.5)], 0.18, d / 2 - 0.1, d / 2 + 3.4, ROOF)
    m.prism([(-5.0, 3.5), (5.0, 3.5), (0, 4.4)], d / 2 + 3.2, d / 2 + 3.3, CREAM)
    for i in range(0, 12):
        m.cube((-4.6 + i * 0.84, 0.95, d / 2 + 3.2), (0.07, 0.9, 0.07), WHITE)
    m.cube((0, 1.45, d / 2 + 3.2), (9.4, 0.1, 0.1), WHITE)
    m.cube((0, 0.55, d / 2 + 3.2), (9.4, 0.1, 0.1), WHITE)
    m.cube((2.6, wh + 4.0, -3.5), (1.4, 5.4, 1.4), BRICK)
    for k in range(10):
        m.cube((2.6, wh + 1.4 + k * 0.5, -3.5 + 0.71), (1.45, 0.04, 0.04), (0.14, 0.05, 0.04))
    m.cube((2.6, wh + 6.8, -3.5), (1.7, 0.25, 1.7), CONC)
    m.cube((2.6, wh + 7.05, -3.5), (0.8, 0.3, 0.8), (0.1, 0.1, 0.1))
    m.cube((0, wh + 4.2 - 2.4, d / 2 - 0.2), (2.2, 2.6, 0.5), CREAM)
    m.prism([(-1.4, wh + 2.0), (1.4, wh + 2.0), (0, wh + 3.3)], d / 2 - 0.6, d / 2 + 0.1, ROOF)
    m.cube((0, wh + 2.0, d / 2 + 0.02), (1.0, 1.1, 0.06), GLASS)
    return m


def barn():
    m = Fm("barn")
    w, d, wh = 16.0, 22.0, 7.0
    m.cube((0, 0.3, 0), (w + 0.5, 0.6, d + 0.5), CONC)
    m.cube((0, 0.6 + (wh - 0.6) / 2, 0), (w, wh - 0.6, d), RED)
    for k in range(int(w / 0.6)):
        x = -w / 2 + 0.3 + k * 0.6
        m.cube((x, wh / 2 + 0.3, d / 2 + 0.015), (0.08, wh - 0.8, 0.03), DRED)
        m.cube((x, wh / 2 + 0.3, -d / 2 - 0.015), (0.08, wh - 0.8, 0.03), DRED)
    for k in range(int(d / 0.6)):
        z = -d / 2 + 0.3 + k * 0.6
        m.cube((w / 2 + 0.015, wh / 2 + 0.3, z), (0.03, wh - 0.8, 0.08), DRED)
        m.cube((-w / 2 - 0.015, wh / 2 + 0.3, z), (0.03, wh - 0.8, 0.08), DRED)
    prof = [(-w / 2 - 0.5, wh), (-w / 2 + 1.4 - 0.2, wh + 3.0), (0, wh + 5.2 + 0.2), (w / 2 - 1.4 + 0.2, wh + 3.0), (w / 2 + 0.5, wh)]
    slabs(m, prof, 0.26, -d / 2 - 0.6, d / 2 + 0.6, GREYR)
    gp = [(-w / 2, wh), (-w / 2 + 1.4, wh + 3.0), (0, wh + 5.2), (w / 2 - 1.4, wh + 3.0), (w / 2, wh)]
    m.prism(gp, d / 2 - 0.15, d / 2 + 0.05, RED)
    m.prism(gp, -d / 2 - 0.05, -d / 2 + 0.15, RED)
    for k in range(int(d / 0.9)):
        z = -d / 2 - 0.5 + k * 0.9
        for sg in (-1, 1):
            m.cube((sg * (w / 4 + 0.4), wh + 2.5, z), (0.02, 0.02, 0.05), (0.05, 0.05, 0.06))
    for sg in (-1, 1):
        m.bar((sg * (w / 2 + 0.55), wh, 0), (sg * (w / 2 - 1.2), wh + 3.0, 0), 0.0, 0.0, DSTEEL) if False else None
    m.cube((0, wh + 5.45, 0), (0.7, 0.3, d + 1.4), (0.08, 0.08, 0.09))
    m.cube((0, wh + 6.0, 0), (1.6, 1.2, 1.6), (0.9 * 0.8, 0.9 * 0.8, 0.9 * 0.8))
    m.prism([(-1.2, wh + 6.6), (1.2, wh + 6.6), (0, wh + 7.6)], -0.9, 0.9, ROOF)
    m.cube((0, wh + 6.0, 0.82), (0.8, 0.7, 0.06), GLASS)
    m.cube((0, wh + 8.0, 0), (0.12, 0.8, 0.12), STEEL)
    zf = d / 2
    m.cube((0, 3.0, zf + 0.06), (6.2, 5.6, 0.14), (0.24, 0.03, 0.025))
    for sx in (-1, 1):
        m.cube((sx * 3.15, 3.0, zf + 0.12), (0.3, 5.7, 0.2), WHITE)
        m.bar((sx * 3.0, 0.4, zf + 0.15), (sx * 0.1, 5.4, zf + 0.15), 0.28, 0.08, WHITE)
        m.bar((sx * 0.1, 0.4, zf + 0.15), (sx * 3.0, 5.4, zf + 0.15), 0.28, 0.08, WHITE)
    m.cube((0, 5.85, zf + 0.12), (6.6, 0.3, 0.2), WHITE)
    m.cube((0, 3.0, zf + 0.15), (0.12, 5.7, 0.12), (0.16, 0.02, 0.02))
    m.cube((0, wh + 2.2, zf + 0.06), (1.8, 2.0, 0.14), (0.24, 0.03, 0.025))
    m.cube((0, wh + 2.2, zf + 0.14), (2.0, 0.2, 0.14), WHITE)
    m.cube((0, wh + 2.2, zf + 0.14), (0.2, 2.2, 0.14), WHITE)
    m.cube((0, wh + 3.9, zf + 1.0), (0.2, 0.2, 2.2), STEEL)
    m.cube((0, wh + 3.4, zf + 1.9), (0.1, 1.0, 0.1), STEEL)
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube((sx * w / 2, wh / 2 + 0.3, sz * d / 2), (0.34, wh, 0.34), WHITE)
    for z in (-6, -1, 5):
        for sg in (-1, 1):
            m.cube((sg * (w / 2 + 0.03), 4.2, z), (0.08, 1.2, 1.2), GLASS)
            m.cube((sg * (w / 2 + 0.07), 4.2, z), (0.08, 0.1, 1.4), WHITE)
            m.cube((sg * (w / 2 + 0.07), 4.2, z), (0.08, 1.4, 0.1), WHITE)
    m.cube((w / 2 + 1.8, 2.0, -3), (3.6, 4.0, 5.6), (0.55, 0.52, 0.5))
    m.prism([(-0.1, 4.0), (3.7, 4.0), (3.7, 4.0), (1.8, 5.2)], -5.8, -0.2, GREYR) if False else None
    return m


def silo():
    m = Fm("silo")
    m.cyly((0, 0, 0), 3.5, 3.5, 0.5, CONC, 24)
    m.cyly((0, 0.5, 0), 3.2, 3.2, 15.0, (0.42, 0.44, 0.48), 28)
    for k in range(1, 16):
        m.cyly((0, k * 1.0, 0), 3.28, 3.28, 0.12, (0.25, 0.26, 0.29), 28)
    m.sph((0, 15.5, 0), (3.3, 3.0, 3.3), (0.36, 0.38, 0.42), u=28, v=10, cut=0.0)
    m.cyly((0, 18.4, 0), 0.25, 0.25, 0.7, DSTEEL, 8)
    m.cube((3.3, 8.0, 0), (0.1, 15.0, 0.5), DSTEEL)
    m.cube((3.45, 8.0, 0.25), (0.1, 15.0, 0.06), DSTEEL)
    m.cube((3.45, 8.0, -0.25), (0.1, 15.0, 0.06), DSTEEL)
    for k in range(40):
        m.cube((3.35, 0.5 + k * 0.37, 0), (0.12, 0.05, 0.46), DSTEEL)
    for k in range(5):
        a = k * 0.6
    m.cube((0, 1.2, 3.25), (1.0, 1.6, 0.12), (0.2, 0.2, 0.22))
    m.cyly((0, 16.8, 0), 0.0, 0.0, 0.01, DSTEEL, 4) if False else None
    return m


def windmill():
    m = Fm("windmill")
    h = 14.0
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.bar((sx * 2.0, 0.0, sz * 2.0), (sx * 0.5, h, sz * 0.5), 0.2, 0.2, DSTEEL)
    for k in range(7):
        y0, y1 = k * 2.0, (k + 1) * 2.0
        r0, r1 = 2.0 - k * (1.5 / 7), 2.0 - (k + 1) * (1.5 / 7)
        for (sx, sz, tx, tz) in ((1, 1, -1, 1), (-1, 1, -1, -1), (-1, -1, 1, -1), (1, -1, 1, 1)):
            m.bar((sx * r0, y0, sz * r0), (tx * r1, y1, tz * r1), 0.08, 0.08, DSTEEL)
        for sgn in (-1, 1):
            m.cube((0, y0 + 0.04, sgn * r0), (2 * r0, 0.1, 0.1), DSTEEL)
            m.cube((sgn * r0, y0 + 0.04, 0), (0.1, 0.1, 2 * r0), DSTEEL)
    m.cube((0, h + 0.1, 0), (1.8, 0.2, 1.8), DSTEEL)
    m.cube((0, h + 0.75, 0), (1.4, 1.1, 2.4), (0.3, 0.32, 0.36))
    m.cyly((0, h + 0.2, 0), 0.25, 0.25, 0.6, DSTEEL, 10)
    m.cube((0, h + 0.8, -2.8), (0.12, 0.12, 3.2), DSTEEL)
    m.cube((0, h + 0.9, -4.6), (0.08, 1.5, 1.6), (0.6, 0.1, 0.06))
    for k in range(3):
        m.cube((0, 1.0 + k * 0.5, 0), (0.06, 0.06, 0.06), DSTEEL)
    return m


def hay_bale():
    m = Fm("hay_bale")
    r, L = 0.95, 1.5
    m.cylx((0, r, 0), r, r, L, STRAW, sides=22)
    for k in range(6):
        m.cylx((0, r, -L / 2 + 0.15 + k * 0.24), r + 0.015, r + 0.015, 0.05, (0.38, 0.27, 0.07), sides=22)
    m.cylx((0, r, L / 2 + 0.01), r * 0.55, r * 0.55, 0.04, (0.62, 0.46, 0.14), sides=16)
    return m


def scarecrow():
    m = Fm("scarecrow")
    m.cube((0, 1.1, 0), (0.14, 2.2, 0.14), WOOD)
    m.cube((0, 1.7, 0), (1.8, 0.12, 0.12), WOOD)
    m.cube((0, 1.4, 0), (0.5, 0.7, 0.3), (0.12, 0.2, 0.4))
    m.sph((0, 2.0, 0), (0.17, 0.2, 0.17), (0.62, 0.46, 0.2), u=10, v=7)
    m.cube((0, 2.28, 0), (0.7, 0.05, 0.7), DWOOD)
    m.cube((0, 2.4, 0), (0.4, 0.28, 0.4), DWOOD)
    for sx in (-1, 1):
        m.cube((sx * 0.95, 1.6, 0), (0.12, 0.28, 0.06), STRAW)
        m.cube((sx * 0.2, 0.8, 0), (0.1, 0.5, 0.1), (0.18, 0.12, 0.08))
    return m


def utility_pole():
    m = Fm("utility_pole")
    m.cyly((0, 0, 0), 0.22, 0.17, 9.0, (0.22, 0.14, 0.08), 10)
    m.cube((0, 8.6, 0), (3.2, 0.14, 0.18), (0.2, 0.12, 0.07))
    m.bar((0.0, 7.6, 0.0), (1.4, 8.6, 0.0), 0.08, 0.08, (0.18, 0.1, 0.06))
    m.bar((0.0, 7.6, 0.0), (-1.4, 8.6, 0.0), 0.08, 0.08, (0.18, 0.1, 0.06))
    for sx in (-1.4, 1.4):
        m.cyly((sx, 8.66, 0), 0.07, 0.05, 0.22, (0.5, 0.55, 0.5), 8)
    m.cyly((0, 9.0, 0), 0.07, 0.04, 0.22, (0.5, 0.55, 0.5), 8)
    m.cube((0.35, 6.6, 0.25), (0.5, 0.7, 0.45), (0.3, 0.32, 0.34))
    return m


def tractor():
    m = Fm("tractor")
    RC = (0.42, 0.03, 0.02)
    m.cube((0, 0.95, 0.9), (1.2, 1.1, 2.0), RC)
    m.cube((0, 1.55, 1.9), (1.0, 0.12, 0.5), (0.2, 0.02, 0.02))
    m.cube((0, 1.7, -0.3), (1.4, 1.6, 1.5), RC)
    m.cube((0, 2.55, -0.3), (1.5, 0.12, 1.7), (0.15, 0.02, 0.02))
    for sx in (-1, 1):
        m.cube((sx * 0.7, 2.0, -0.3), (0.08, 0.9, 1.3), (0.05, 0.08, 0.12))
    m.cube((0, 2.0, -1.05), (1.3, 0.9, 0.08), (0.05, 0.08, 0.12))
    m.cube((0, 2.0, 0.45), (1.3, 0.9, 0.08), (0.05, 0.08, 0.12))
    m.cyly((0.3, 1.4, 1.9), 0.06, 0.06, 1.1, DSTEEL, 8)
    m.cyly((0.3, 2.5, 1.9), 0.09, 0.09, 0.15, (0.1, 0.1, 0.1), 8)
    for sx in (-1, 1):
        m.cylx((sx * 0.85, 0.95, -0.7), 0.95, 0.95, 0.5, (0.05, 0.05, 0.06), sides=22)
        m.cylx((sx * 0.85, 0.95, -0.7), 0.5, 0.5, 0.52, (0.5, 0.45, 0.1), sides=18)
        m.cylx((sx * 0.8, 0.5, 1.5), 0.5, 0.5, 0.3, (0.05, 0.05, 0.06), sides=18)
        m.cylx((sx * 0.8, 0.5, 1.5), 0.28, 0.28, 0.32, (0.5, 0.45, 0.1), sides=14)
        m.cube((sx * 0.4, 0.85, 2.0), (0.18, 0.18, 0.06), (1.0, 0.95, 0.7))
    m.cube((0, 0.55, 0.9), (0.9, 0.3, 2.4), (0.1, 0.1, 0.11))
    return m


def farm_fence():
    m = Fm("fence_post")
    m.cube((0, 0.65, 0), (0.2, 1.3, 0.2), (0.22, 0.14, 0.08))
    m.cube((0, 1.31, 0), (0.24, 0.05, 0.24), (0.18, 0.1, 0.06))
    return m


BUILDERS = [farmhouse, barn, silo, windmill, hay_bale, scarecrow, utility_pole, tractor, farm_fence]


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
        ob.location = (i * 24, 0, 0)
        made.append(ob)
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
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "farm_kit.glb"), export_format="GLB", use_selection=True, export_yup=True, export_apply=True, export_normals=True, export_vertex_color="ACTIVE")
        for ob, l in zip(made, locs):
            ob.location = l
    return made
