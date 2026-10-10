import math
import importlib
import acommon as A
importlib.reload(A)
from acommon import *

CONC = (0.66, 0.66, 0.64)
CONC2 = (0.5, 0.5, 0.5)
WHT = (0.9, 0.9, 0.9)
BLUE = (0.1, 0.24, 0.5)
SKY = (0.16, 0.3, 0.38)
GLS = (0.3, 0.46, 0.56)
STEEL = (0.45, 0.47, 0.5)
YEL = (0.95, 0.75, 0.1)
ORG = (0.95, 0.4, 0.1)
RED = (0.75, 0.12, 0.12)


def tower():
    m = M("ap_tower")
    lit = M("ap_tower_lit")
    H = 34.0
    m.box((0, 1.0, 0), (9, 9, 2.0), CONC2)
    m.cyl((0, 0, 0), (0, 0, 0), 0.01, 0.01, CONC, 3)
    rings = []
    for y, r in [(0.0, 3.4), (4.0, 3.0), (14.0, 2.4), (H - 6, 2.1), (H - 4.5, 2.1)]:
        rings.append([(math.cos(k / 10 * math.tau) * r, y, math.sin(k / 10 * math.tau) * r) for k in range(10)])
    m.loft(rings, CONC)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        m.box((math.cos(a) * 2.5, 12, math.sin(a) * 2.5), (0.4, 24, 0.4), STEEL)
    cab = []
    for y, r in [(H - 4.5, 4.6), (H - 3.6, 5.2), (H - 3.4, 5.6), (H - 0.6, 5.9)]:
        cab.append([(math.cos(k / 12 * math.tau) * r, y, math.sin(k / 12 * math.tau) * r) for k in range(12)])
    m.loft(cab, CONC)
    glass = []
    for y, r in [(H - 3.0, 5.5), (H - 0.4, 5.8)]:
        pass
    m.paint_if(lambda x, y, z, n: GLS if (H - 3.3 < y < H - 0.8 and (abs(n[1]) < 0.4)) else None)
    m.box((0, H + 0.1, 0), (13.4, 0.5, 13.4), CONC2, math.pi / 12)
    m.cyl((0, H - 0.5, 0), (0, H + 1.2, 0), 6.9, 6.4, WHT, 12)
    m.cyl((0, H + 1.2, 0), (0, H + 2.2, 0), 3.0, 2.4, CONC2, 12)
    m.cyl((0, H + 2.2, 0), (0, H + 8, 0), 0.12, 0.05, STEEL, 6)
    m.box((0, H + 4.6, 0), (2.4, 0.2, 0.2), STEEL)
    m.box((0, H + 3.4, 0), (0.2, 0.2, 2.4), STEEL)
    for k in range(12):
        a = k / 12 * math.tau
        m.box((math.cos(a) * 6.4, H - 1.6, math.sin(a) * 6.4), (0.1, 1.0, 0.1), STEEL)
    ring_pts = lambda r, y: [(math.cos(k / 24 * math.tau) * r, y, math.sin(k / 24 * math.tau) * r) for k in range(24)]
    for k in range(12):
        a = k / 12 * math.tau
        lit.box((math.cos(a) * 5.9, H - 1.8, math.sin(a) * 5.9), (0.9, 1.2, 0.9), (1.0, 0.9, 0.62))
    lit.box((0, H + 8.1, 0), (0.2, 0.2, 0.2), (1.0, 0.1, 0.1))
    m.box((0, 3, 3.5), (3, 6, 2), STEEL)
    return m, lit


def hangar():
    m = M("ap_hangar")
    W, D, H = 38.0, 34.0, 11.0
    rings = []
    arch = []
    n = 14
    arch.append((-W / 2, 0))
    arch.append((-W / 2, 5.4))
    for k in range(1, n):
        a = math.pi * (1 - k / n)
        arch.append((math.cos(a) * W / 2, 5.4 + math.sin(a) * (H - 5.4)))
    arch.append((W / 2, 5.4))
    arch.append((W / 2, 0))
    for z in (-D / 2, D / 2):
        rings.append([(x, y, z) for x, y in arch])
    m.loft(rings, (0.78, 0.8, 0.82))
    m.paint_if(lambda x, y, z, n: (0.7, 0.72, 0.75) if n[1] > 0.5 else None)
    for i in range(1, 9):
        z = -D / 2 + i * D / 9
        r2 = [(x * 1.004, y + (0.1 if y > 5 else 0), z) for x, y in arch]
        rr = []
        for dz in (-0.2, 0.2):
            rr.append([(x * 1.012, y * 1.0 + (0.04 if y > 5.4 else 0), z + dz) for x, y in arch])
        m.loft(rr, (0.6, 0.62, 0.66))
    m.box((0, 4.5, D / 2 + 0.2), (W - 6, 9, 0.3), (0.55, 0.57, 0.6))
    m.box((0, 0.4, D / 2 + 0.4), (W - 4, 0.8, 0.5), CONC)
    m.box((0, 9.2, D / 2 + 0.35), (W - 5, 0.4, 0.6), BLUE)
    for i in range(7):
        m.box((-W / 2 + 4.5 + i * (W - 9) / 6, 4.5, D / 2 + 0.38), (0.25, 9, 0.3), (0.42, 0.44, 0.47))
    m.box((W / 2 - 3, 1.2, D / 2 + 0.3), (1.2, 2.4, 0.3), (0.3, 0.32, 0.35))
    m.box((0, 10.2, D / 2 + 1.0), (14, 1.8, 0.4), BLUE)
    m.box((0, 0.2, 0), (W + 1, 0.4, D + 1), CONC)
    return m


def terminal_mod():
    m = M("ap_terminal")
    lit = M("ap_terminal_lit")
    L, D, H = 40.0, 40.0, 13.0
    m.box((0, H + 0.4, 0), (L + 0.4, 0.8, D + 8), (0.82, 0.82, 0.8))
    m.box((0, H + 1.0, 0), (L + 0.4, 0.4, D + 8.4), (0.74, 0.76, 0.78))
    for sz in (-1, 1):
        m.box((0, H + 0.5, sz * (D / 2 + 4.1)), (L + 0.6, 1.4, 0.4), BLUE)
    m.box((0, 0.3, 0), (L, 0.6, D), CONC)
    for sz in (-1, 1):
        zf = sz * D / 2
        m.box((0, H / 2, zf), (L, H, 0.4), GLS)
        for i in range(0, 11):
            m.box((-L / 2 + i * L / 10, H / 2, zf + sz * 0.15), (0.35, H, 0.5), (0.7, 0.72, 0.75))
        for k in range(1, 4):
            m.box((0, k * H / 4, zf + sz * 0.1), (L, 0.2, 0.4), (0.7, 0.72, 0.75))
    for sx in (-1, 1):
        m.box((sx * L / 2, H / 2, 0), (0.6, H, D), (0.78, 0.78, 0.76))
    for sz in (-1, 1):
        for i in range(0, 5):
            m.box((-L / 2 + 4 + i * (L - 8) / 4, H / 2, sz * (D / 2 + 3.6)), (0.8, H, 0.8), (0.82, 0.82, 0.8))
    m.box((0, 5.2, 0), (L - 1, 0.5, D - 1), (0.6, 0.6, 0.6))
    m.box((0, 0.7, 0), (L - 1, 0.2, D - 1), (0.85, 0.85, 0.82))
    for i in range(0, 5):
        lit.box((-L / 2 + 4 + i * (L - 8) / 4, 10.5, 0), (1.5, 0.3, D - 4), (1.0, 0.95, 0.8))
        lit.box((-L / 2 + 4 + i * (L - 8) / 4, 4.5, 0), (1.5, 0.3, D - 4), (1.0, 0.95, 0.8))
    for sz in (-1, 1):
        for i in range(0, 10):
            lit.box((-L / 2 + 2 + i * 4.0, 7.0, sz * (D / 2 - 0.4)), (3.2, 4.5, 0.12), (1.0, 0.88, 0.62))
    return m, lit


def terminal_core():
    m = M("ap_core")
    lit = M("ap_core_lit")
    L, D, H = 40.0, 44.0, 20.0
    m.box((0, 0.3, 0), (L, 0.6, D), CONC)
    for sz in (-1, 1):
        zf = sz * D / 2
        m.box((0, H / 2, zf), (L, H, 0.4), GLS)
        for i in range(0, 9):
            m.box((-L / 2 + i * L / 8, H / 2, zf + sz * 0.15), (0.4, H, 0.6), (0.75, 0.77, 0.8))
        for k in range(1, 5):
            m.box((0, k * H / 5, zf + sz * 0.1), (L, 0.25, 0.5), (0.75, 0.77, 0.8))
    for sx in (-1, 1):
        m.box((sx * L / 2, H / 2, 0), (0.6, H, D), (0.78, 0.78, 0.76))
    rings = []
    for z in (-D / 2 - 5, D / 2 + 5):
        rings.append([(-L / 2 - 1, H, z), (L / 2 + 1, H, z), (L / 2 + 1, H + 1.0, z), (-L / 2 - 1, H + 1.0, z)])
    m.loft(rings, (0.82, 0.82, 0.8))
    m.box((0, H + 1.2, 0), (L + 2, 0.4, D + 11), (0.74, 0.76, 0.78))
    for sz in (-1, 1):
        m.box((0, H + 0.8, sz * (D / 2 + 5.4)), (L + 2.2, 1.4, 0.4), BLUE)
    m.box((0, H + 3.5, D / 2 + 3), (12, 3, 0.3), (0.95, 0.95, 0.95))
    m.box((0, 7.0, D / 2 + 6), (L - 6, 0.8, 12), (0.8, 0.8, 0.78))
    for i in range(0, 5):
        m.box((-L / 2 + 5 + i * (L - 10) / 4, 3.5, D / 2 + 11.4), (0.9, 7, 0.9), (0.82, 0.82, 0.8))
    for sx in range(-5, 6):
        lit.box((sx * 3.4, 6.5, D / 2 - 0.4), (2.6, 8, 0.12), (1.0, 0.88, 0.62))
        lit.box((sx * 3.4, 6.5, -D / 2 + 0.4), (2.6, 8, 0.12), (1.0, 0.88, 0.62))
    lit.box((0, 6.55, D / 2 + 11.4), (L - 7, 0.15, 0.2), (1.0, 0.95, 0.8))
    return m, lit


def jetbridge():
    m = M("ap_jetbridge")
    m.cyl((0, 4.6, 2.0), (0, 4.6, 2.0), 0.01, 0.01, STEEL, 3)
    m.cyl((0, 2.5, 1.0), (0, 5.6, 1.0), 2.4, 2.4, (0.8, 0.8, 0.8), 14)
    m.box((0, 4.0, -8), (3.3, 3.4, 15), (0.84, 0.84, 0.82))
    m.box((0, 4.0, -8), (3.45, 0.3, 15.2), BLUE)
    m.box((0, 4.2, -8), (3.4, 1.2, 15.15), (0.1, 0.17, 0.22))
    m.box((0, 4.0, -17), (3.0, 3.2, 3.0), (0.86, 0.86, 0.84))
    m.box((0, 3.55, -19.4), (3.4, 3.5, 2.4), (0.15, 0.15, 0.16))
    m.box((0, 3.55, -19.6), (3.9, 3.9, 1.0), (0.1, 0.1, 0.1))
    for sx in (-1, 1):
        m.box((sx * 1.0, 1.0, -12.5), (0.35, 3.6, 0.35), STEEL)
        m.box((sx * 1.0, 0.25, -12.5), (0.6, 0.5, 1.4), (0.1, 0.1, 0.1))
    m.box((0, 2.0, -12.5), (2.4, 0.3, 0.4), STEEL)
    m.box((0, 5.9, -19.2), (3.8, 0.35, 3.2), (0.75, 0.76, 0.78))
    return m


def truck_fuel():
    m = M("ap_fueltruck")
    m.box((0, 0.9, 0), (2.5, 0.5, 8.6), (0.2, 0.2, 0.22))
    m.cyl((0, 2.2, -0.8), (0, 2.2, -0.8), 0.01, 0.01, WHT, 3)
    m.cylx((0, 0, 0), 0.01, 0.01, 0.01, WHT, 3)
    rings = []
    for z, r in [(-4.0, 0.0), (-3.7, 1.15), (-2.5, 1.22), (2.8, 1.22), (3.4, 1.0), (3.6, 0.0)]:
        pass
    m.cyl((0, 2.15, 0.2), (0, 2.15, 6.0 - 5.8), 1.25, 1.25, WHT, 20)
    m.cyl((0, 2.15, -3.7), (0, 2.15, 3.4), 1.25, 1.25, WHT, 22)
    m.cyl((0, 2.15, -3.7), (0, 2.15, -3.85), 1.2, 1.1, STEEL, 22)
    m.cyl((0, 2.15, 3.4), (0, 2.15, 3.55), 1.2, 1.1, STEEL, 22)
    m.box((0, 1.05, -3.9), (2.6, 0.5, 0.5), CONC2)
    m.box((0, 2.2, 0), (2.62, 0.5, 6.0), (0.9, 0.12, 0.1))
    m.box((0, 3.45, 0), (0.7, 0.2, 5.0), STEEL)
    m.box((0, 1.9, 4.9), (2.4, 2.0, 2.3), ORG)
    m.box((0, 2.5, 5.9), (2.2, 0.9, 0.2), GLS)
    m.box((0, 3.1, 5.0), (2.0, 0.6, 1.8), ORG)
    m.box((0, 2.5, 4.3), (2.2, 1.0, 0.1), GLS)
    m.box((1.15, 1.8, -2.0), (0.1, 0.9, 1.4), STEEL)
    for z in (-3.0, -1.8, 4.5):
        for sx in (-1, 1):
            m.cylx((sx * 1.15, 0.5, z), 0.5, 0.5, 0.3, TIRE, 14)
    m.box((-1.15, 0.8, 0), (0.1, 0.1, 8), (0.9, 0.9, 0.9))
    return m


def tug():
    m = M("ap_tug")
    m.box((0, 0.8, 0), (1.5, 0.4, 2.8), (0.18, 0.18, 0.2))
    m.box((0, 1.0, -0.3), (1.4, 0.5, 1.6), (0.92, 0.75, 0.1))
    m.box((0, 1.65, 0.0), (1.2, 0.2, 1.0), (0.15, 0.15, 0.16))
    for sx in (-1, 1):
        m.bar((sx * 0.55, 1.1, 0.55), (sx * 0.55, 2.2, 0.55), 0.06, 0.06, STEEL)
        m.bar((sx * 0.55, 1.1, -0.1), (sx * 0.55, 2.2, -0.1), 0.06, 0.06, STEEL)
        m.cylx((sx * 0.7, 0.35, 0.8), 0.35, 0.35, 0.25, TIRE, 14)
        m.cylx((sx * 0.7, 0.35, -0.9), 0.35, 0.35, 0.25, TIRE, 14)
    m.box((0, 2.25, 0.2), (1.35, 0.1, 1.0), (0.92, 0.75, 0.1))
    m.box((0, 0.9, -1.5), (0.3, 0.2, 0.4), STEEL)
    m.box((0, 1.5, 0.6), (0.9, 0.4, 0.15), (0.12, 0.12, 0.14))
    return m


def cart():
    m = M("ap_cart")
    m.box((0, 0.55, 0), (1.8, 0.1, 3.0), STEEL)
    for sx in (-1, 1):
        m.box((sx * 0.9, 1.1, 0), (0.06, 1.0, 3.0), (0.55, 0.57, 0.6))
        m.cylx((sx * 0.8, 0.28, 1.1), 0.28, 0.28, 0.16, TIRE, 12)
        m.cylx((sx * 0.8, 0.28, -1.1), 0.28, 0.28, 0.16, TIRE, 12)
    for z in (-1.5, 1.5):
        m.box((0, 1.1, z), (1.8, 1.0, 0.06), (0.55, 0.57, 0.6))
    m.box((0, 0.9, 0.2), (1.4, 0.7, 1.2), (0.35, 0.25, 0.18))
    m.box((0.2, 1.3, -0.5), (0.9, 0.5, 0.8), (0.12, 0.2, 0.4))
    m.box((-0.3, 1.2, 0.8), (0.7, 0.5, 0.7), (0.5, 0.15, 0.12))
    m.bar((0, 0.5, 1.4), (0, 0.5, 2.3), 0.1, 0.1, STEEL)
    return m


def stairs():
    m = M("ap_stairs")
    m.box((0, 0.9, 0), (2.4, 0.5, 6.5), (0.9, 0.9, 0.9))
    m.box((0, 1.5, 2.2), (2.2, 1.5, 1.8), (0.1, 0.35, 0.65))
    m.box((0, 2.6, 2.4), (2.0, 0.8, 0.2), GLS)
    for i in range(0, 12):
        t = i / 11
        m.box((0, 1.1 + t * 2.4, -2.2 + t * -0.0 - i * 0.18), (1.4, 0.08, 0.35), (0.7, 0.7, 0.72))
    m.box((0, 3.6, -2.7), (2.0, 0.1, 1.4), (0.7, 0.7, 0.72))
    for sx in (-1, 1):
        m.bar((sx * 0.75, 1.5, -1.4), (sx * 0.75, 4.3, -3.8), 0.05, 0.05, YEL)
        m.cylx((sx * 1.0, 0.45, 2.0), 0.45, 0.45, 0.3, TIRE, 12)
        m.cylx((sx * 1.0, 0.45, -2.0), 0.45, 0.45, 0.3, TIRE, 12)
    return m


def fuel_tank():
    m = M("ap_tank")
    m.cyl((0, 0, 0), (0, 10, 0), 6.5, 6.5, (0.88, 0.88, 0.86), 24)
    m.cyl((0, 10, 0), (0, 10.8, 0), 6.5, 5.0, (0.88, 0.88, 0.86), 24)
    m.cyl((0, 10.8, 0), (0, 11.2, 0), 1.2, 1.0, STEEL, 12)
    m.cyl((0, 0, 6.6), (0, 0, 6.6), 0.01, 0.01, STEEL, 3)
    m.bar((6.3, 0.2, 0), (6.3, 10.2, 0), 0.5, 0.2, STEEL)
    for k in range(10):
        m.bar((6.4, 0.2 + k * 1.0, 0), (5.0, 0.2 + k * 1.0, 0), 0.7, 0.05, STEEL)
    m.box((0, 5, 0), (13.04, 0.5, 13.04), BLUE) if False else None
    return m


def floodlight():
    m = M("ap_flood")
    lit = M("ap_flood_lit")
    m.cyl((0, 0, 0), (0, 28, 0), 0.5, 0.3, STEEL, 8)
    m.box((0, 28.4, 0), (5.0, 0.4, 0.5), STEEL)
    for i in range(-2, 3):
        m.box((i * 1.0, 28.9, 0.15), (0.8, 0.6, 0.3), (0.2, 0.2, 0.22))
        lit.box((i * 1.0, 28.9, 0.4), (0.7, 0.5, 0.05), (1.0, 0.96, 0.82))
    return m, lit


def windsock():
    m = M("ap_windpole")
    m.cyl((0, 0, 0), (0, 7.5, 0), 0.14, 0.09, (0.85, 0.85, 0.85), 8)
    m.cylx((0, 7.5, 0.0), 0.5, 0.5, 0.08, STEEL, 12)
    s = M("ap_sock")
    for i in range(5):
        r1 = 0.55 - i * 0.07
        r2 = 0.55 - (i + 1) * 0.07
        c = (1.0, 0.45, 0.08) if i % 2 == 0 else (0.96, 0.96, 0.96)
        s.cyl((0, 0, i * 0.6), (0, 0, (i + 1) * 0.6), r1, r2, c, 10, caps=False)
    return m, s


def radar():
    m = M("ap_radarbase")
    m.cyl((0, 0, 0), (0, 5, 0), 1.0, 0.7, STEEL, 8)
    m.box((0, 5.3, 0), (3.6, 0.5, 1.6), STEEL)
    d = M("ap_dish")
    d.box((0, 0, 0), (7.0, 2.8, 0.2), (0.85, 0.86, 0.88))
    d.box((0, 0, 0.3), (0.2, 0.2, 0.6), STEEL)
    d.box((0, 1.6, 0.5), (1.0, 0.3, 0.3), (0.2, 0.2, 0.22))
    return m, d


def run(export_it=True):
    clear_all()
    mv = make_material(True)
    made = []
    for out in (tower(), hangar(), terminal_mod(), terminal_core(), jetbridge(), truck_fuel(), tug(), cart(), stairs(), fuel_tank(), floodlight(), windsock(), radar()):
        items = out if isinstance(out, tuple) else (out,)
        for m in items:
            made.append(m.finish(mv))
    for o in made:
        print(o.name, len(o.data.polygons))
    if export_it:
        export(made, "airport_kit.glb")
    return made
