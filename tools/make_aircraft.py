import math
import importlib
import acommon as A
importlib.reload(A)
from acommon import *


def ring(z, y0, y1, hw, n=22, p=2.5, tumble=0.0):
    pts = []
    ym = (y0 + y1) / 2
    hh = max(0.01, (y1 - y0) / 2)
    for k in range(n):
        a = k / n * math.tau
        c, s = math.cos(a), math.sin(a)
        x = hw * math.copysign(abs(c) ** (2 / p), c)
        y = ym + hh * math.copysign(abs(s) ** (2 / p), s)
        if s > 0:
            x *= 1 - tumble * s ** 1.5
        pts.append((x, y, z))
    return pts


def lerp(a, b, t):
    return a + (b - a) * t


def fuselage_cessna(m):
    st = [
        (3.05, 0.98, 1.5, 0.5, 0.0), (2.85, 0.92, 1.58, 0.58, 0.0), (2.4, 0.86, 1.66, 0.64, 0.05), (1.7, 0.78, 1.78, 0.62, 0.1),
        (1.1, 0.74, 2.05, 0.6, 0.22), (0.4, 0.72, 2.2, 0.6, 0.28), (-0.5, 0.72, 2.18, 0.58, 0.3), (-1.4, 0.76, 2.0, 0.52, 0.3),
        (-2.4, 0.86, 1.78, 0.4, 0.2), (-3.5, 0.98, 1.6, 0.27, 0.1), (-4.5, 1.12, 1.52, 0.14, 0.0), (-5.0, 1.2, 1.48, 0.07, 0.0)
    ]
    rings = [ring(z, y0, y1, hw, 22, 2.6, t) for z, y0, y1, hw, t in st]
    m.loft(rings, WHITE)


def airfoil_rings(sections, thick, n=14):
    af = naca(n, thick)
    rings = []
    for (x, zle, chord, y) in sections:
        rings.append([(x, y + t * chord, zle - u * chord) for u, t in af])
    return rings


def surf_rings(sections, u0, thick, hinge, n=8, grow=1.015):
    af = naca(24, thick)
    out = []
    for (x, zle, chord, y) in sections:
        pts = []
        top = [(u, t) for (u, t) in af[:len(af) // 2 + 1] if u >= u0 - 1e-6]
        bot = [(u, t) for (u, t) in af[len(af) // 2 + 1:] if u >= u0 - 1e-6]
        loop = top + bot
        for u, t in loop:
            pts.append((x - hinge[0], (y + t * chord * grow) - hinge[1], (zle - u * chord) - hinge[2]))
        out.append(pts)
    return out


def build_cessna():
    paint = M("cessna_paint")
    fuselage_cessna(paint)
    chord = lambda x: 1.65 if abs(x) < 1.7 else lerp(1.65, 1.12, (abs(x) - 1.7) / 3.8)
    xs = [-5.5, -5.2, -4.6, -3.6, -2.6, -1.7, -0.7, 0, 0.7, 1.7, 2.6, 3.6, 4.6, 5.2, 5.5]
    secs = []
    for x in xs:
        c = chord(x)
        if abs(x) > 5.1:
            c *= 0.82
        secs.append((x, 1.35, c, 2.3 + 0.0 * x))
    paint.loft(airfoil_rings(secs, 0.1), WHITE)
    stab = [(x, -4.0, lerp(1.1, 0.7, abs(x) / 1.85), 1.45 + 0.0) for x in [-1.85, -1.4, -0.8, 0, 0.8, 1.4, 1.85]]
    paint.loft(airfoil_rings(stab, 0.07, 12), WHITE)
    fin_rings = []
    for yv in [1.45, 1.8, 2.2, 2.6, 3.0, 3.2]:
        t = (yv - 1.45) / 1.75
        zle = lerp(-3.6, -4.55, t) + 0.0
        c = lerp(1.55, 0.78, t)
        af = naca(12, 0.07)
        fin_rings.append([(tt * c, yv, zle - u * c) for u, tt in af])
    paint.loft(fin_rings, WHITE)
    cowl = [ring(z, 0.96, 1.52, 0.5, 20, 2.6, 0.0) for z in [3.4, 3.3]]
    paint.paint_if(lambda x, y, z, n: (0.07, 0.09, 0.13) if (abs(x) > 0.52 and 1.5 < y < 1.95 and -0.1 < z < 1.2 and abs(n[0]) > 0.4) else None)
    paint.paint_if(lambda x, y, z, n: (0.07, 0.09, 0.13) if (1.9 < y < 2.2 and 0.9 < z < 1.45 and abs(n[0]) < 0.7 and n[2] > 0.1) else None)
    paint.paint_if(lambda x, y, z, n: (0.55, 0.57, 0.6) if (y < 0.86 and abs(x) < 0.5) else None)
    paint.paint_if(lambda x, y, z, n: (0.12, 0.13, 0.17) if (abs(x) > 0.5 and 1.25 < y < 1.36 and -3.9 < z < 2.2) else None)

    detail = M("cessna_detail")
    detail.sphere((0, 1.24, 3.05), (0.5, 0.52, 0.12), (0.85, 0.86, 0.9), 16, 8)
    detail.cyl((0, 1.24, 3.0), (0, 1.24, 3.42), 0.18, 0.04, (0.85, 0.86, 0.9), 16)
    detail.box((0, 0.88, 2.97), (0.5, 0.12, 0.1), DARK)
    for sx in (-1, 1):
        detail.cyl((sx * 0.42, 0.92, 2.6), (sx * 0.42, 0.88, 3.0), 0.07, 0.06, (0.3, 0.3, 0.32), 10)
        detail.box((sx * 0.3, 1.9, 1.55), (0.04, 0.02, 0.5), GLASS)
        detail.bar((sx * 0.55, 0.92, 0.55), (sx * 3.4, 2.18, 0.7), 0.07, 0.035, (0.82, 0.83, 0.86))
        detail.bar((sx * 0.7, 0.9, 0.35), (sx * 3.4, 2.17, 0.45), 0.05, 0.03, (0.82, 0.83, 0.86))
        detail.bar((sx * 0.3, 0.9, 0.2), (sx * 1.42, 0.38, 0.22), 0.1, 0.05, (0.6, 0.62, 0.66))
        detail.cyl((sx * 1.3, 0.38, 0.22), (sx * 1.3, 0.38, 0.22), 0.01, 0.01, DARK, 3)
        detail.box((sx * 1.28, 0.62, 0.22), (0.08, 0.5, 0.34), (0.82, 0.83, 0.86))
    detail.bar((0, 0.9, 2.2), (0, 0.4, 2.2), 0.12, 0.06, (0.6, 0.62, 0.66))
    detail.box((0, 0.5, 2.2), (0.06, 0.04, 0.4), (0.6, 0.62, 0.66))
    detail.box((0, 1.3, 0.6), (1.0, 0.45, 0.95), (0.12, 0.13, 0.15))
    for sx in (-0.28, 0.28):
        detail.box((sx, 1.62, 0.5), (0.4, 0.62, 0.1), (0.2, 0.21, 0.24))
        detail.box((sx, 1.28, 0.75), (0.4, 0.1, 0.4), (0.2, 0.21, 0.24))
        detail.box((sx, 1.36, -0.5), (0.4, 0.1, 0.36), (0.2, 0.21, 0.24))
    detail.box((0, 1.86, 1.35), (1.0, 0.3, 0.1), (0.08, 0.09, 0.1))
    detail.box((0, 1.95, 0.6), (1.0, 0.18, 0.02), (0.1, 0.1, 0.12))
    for x in (-0.18, 0, 0.18):
        detail.box((x, 1.86, 1.4), (0.1, 0.1, 0.02), (0.6, 0.85, 0.7))

    wheel = M("cessna_wheel")
    wheel.cylx((0, 0, 0), 0.3, 0.3, 0.17, TIRE, 20)
    wheel.cylx((0.02, 0, 0), 0.16, 0.16, 0.19, (0.7, 0.72, 0.76), 16)
    wheel.cylx((0.1, 0, 0), 0.05, 0.05, 0.03, DARK, 8)

    prop = M("cessna_prop")
    prop.cyl((0, 0, -0.08), (0, 0, 0.12), 0.1, 0.06, (0.18, 0.18, 0.2), 12)
    for s in (-1, 1):
        for k in range(6):
            t = k / 5
            w = lerp(0.12, 0.07, t) * (1.0 if k > 0 else 1.2)
            y0, y1 = s * (0.12 + t * 0.82), s * (0.12 + (t + 0.2) * 0.82)
            prop.bar((0.0, y0, 0), (0.0, s * (0.12 + (t + 0.17) * 0.82), 0), w, 0.018, (0.1, 0.1, 0.12))
        prop.bar((0.0, s * 0.83, 0.0), (0.0, s * 0.96, 0.0), 0.08, 0.016, (0.95, 0.8, 0.12))

    lit = M("cessna_lit")
    lit.box((5.46, 2.3, 1.0), (0.08, 0.08, 0.14), (1.0, 0.1, 0.1))
    lit.box((-5.46, 2.3, 1.0), (0.08, 0.08, 0.14), (0.1, 1.0, 0.2))
    lit.box((0, 3.18, -4.55), (0.08, 0.08, 0.14), (1.0, 1.0, 1.0))
    lit.box((0, 1.0, 3.0), (0.2, 0.1, 0.03), (1.0, 0.97, 0.85))

    ail_secs = [(x, 1.35, chord(x) * (0.82 if abs(x) > 5.1 else 1.0), 2.3) for x in [2.8, 3.4, 4.0, 4.6, 5.1]]
    aL = M("cessna_ailL")
    hl = (3.95, 2.3, 1.35 - 0.78 * 1.4)
    aL.loft(surf_rings([(x - 0, z, c, y) for (x, z, c, y) in ail_secs], 0.78, 0.1, hl), WHITE)
    aR = M("cessna_ailR")
    ail_secs_r = [(-x, z, c, y) for (x, z, c, y) in ail_secs]
    hr = (-3.95, 2.3, 1.35 - 0.78 * 1.4)
    aR.loft(surf_rings(ail_secs_r, 0.78, 0.1, hr), WHITE)
    flapL = M("cessna_flapL")
    fl_secs = [(x, 1.35, chord(x), 2.3) for x in [0.8, 1.4, 2.0, 2.6]]
    hf = (1.7, 2.3, 1.35 - 0.78 * 1.55)
    flapL.loft(surf_rings(fl_secs, 0.78, 0.1, hf), WHITE)
    flapR = M("cessna_flapR")
    hfr = (-1.7, 2.3, 1.35 - 0.78 * 1.55)
    flapR.loft(surf_rings([(-x, z, c, y) for (x, z, c, y) in fl_secs], 0.78, 0.1, hfr), WHITE)
    stab_secs = [(x, -4.0, lerp(1.1, 0.7, abs(x) / 1.85), 1.45) for x in [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8]]
    elev = M("cessna_elev")
    he = (0, 1.45, -4.0 - 0.62 * 0.9)
    elev.loft(surf_rings(stab_secs, 0.62, 0.07, he), WHITE)
    rud_rings = []
    hr_ = (0, 1.7, -4.55 + 0.0)
    rud = M("cessna_rudder")
    ys = [1.5, 1.9, 2.3, 2.7, 3.1]
    af = naca(24, 0.07)
    for yv in ys:
        t = (yv - 1.45) / 1.75
        zle = lerp(-3.6, -4.55, t)
        c = lerp(1.55, 0.78, t)
        loop = [(u, tt) for (u, tt) in af if u >= 0.62 - 1e-6]
        top = [(u, tt) for (u, tt) in af[:len(af) // 2 + 1] if u >= 0.62 - 1e-6]
        bot = [(u, tt) for (u, tt) in af[len(af) // 2 + 1:] if u >= 0.62 - 1e-6]
        rud_rings.append([(tt * c * 1.02 - 0, yv - 1.45, (zle - u * c) - (-3.6 - 0.62 * 1.55 * 0.62)) for u, tt in top + bot])
    rud.loft(rud_rings, WHITE)
    return [paint, detail, wheel, prop, lit, aL, aR, flapL, flapR, elev, rud]


def build_jet(name, accent, acc2):
    m = M(name)
    CY = 3.35
    stations = []
    def prof(z):
        if z > 12:
            t = (z - 12) / 6.9
            r = 1.98 * math.sqrt(max(0.0, 1 - t ** 2.4)) * 0.0 + 1.98 * (1 - t ** 2.2) ** 0.5
            return max(0.25, r), CY - 0.02 - 0.5 * t ** 2
        if z < -8:
            t = (-z - 8) / 10.8
            r = 1.98 * (1 - t ** 1.8) ** 0.55
            return max(0.2, r), CY + 1.1 * t ** 1.6
        return 1.98, CY
    zs = [18.9, 18.6, 18.0, 17.0, 15.5, 13.5, 12, 8, 2, -4, -8, -10, -12.5, -15, -17, -18.6]
    rings = []
    for z in zs:
        r, cy = prof(z)
        rings.append(ring(z, cy - r * 1.0, cy + r * 1.0, r * 0.99, 26, 2.1, 0.0))
    m.loft(rings, (0.96, 0.97, 0.98))
    m.paint_if(lambda x, y, z, n: (0.58, 0.6, 0.64) if y < CY - 0.9 else None)
    m.paint_if(lambda x, y, z, n: accent if (abs(x) > 1.0 and abs(y - (CY - 0.62)) < 0.14 and -15 < z < 15) else None)
    m.paint_if(lambda x, y, z, n: acc2 if (abs(x) > 1.0 and abs(y - (CY - 0.84)) < 0.05 and -15 < z < 15) else None)
    m.paint_if(lambda x, y, z, n: (0.07, 0.09, 0.12) if (z > 16.0 and z < 17.2 and y > CY + 0.1 and y < CY + 0.7 and n[2] > 0.2) else None)
    for sx in (-1, 1):
        for z in (11.8, -1.0):
            m.box((sx * 1.975, CY - 0.4, z), (0.05, 1.7, 0.95), (0.84, 0.86, 0.9))
        m.box((sx * 1.98, CY + 0.9, 16.2), (0.04, 0.34, 0.4), (0.05, 0.07, 0.1))
    m.box((0, CY + 1.0, 17.7), (1.4, 0.38, 0.4), (0.05, 0.07, 0.1))

    wing_secs = []
    for x in [-17.9, -17.2, -15.5, -12, -8, -4, -1.9, 0, 1.9, 4, 8, 12, 15.5, 17.2, 17.9]:
        ax = abs(x)
        t = ax / 17.9
        zle = lerp(2.4, -8.4, t) if ax > 1.9 else 2.4
        c = lerp(6.0, 1.5, t ** 0.85) if ax > 1.9 else 6.2
        y = 2.35 + 0.72 * t * 1.3
        wing_secs.append((x, zle, c, y))
    m.loft(airfoil_rings(wing_secs, 0.095, 16), (0.9, 0.91, 0.93))
    for sx in (-1, 1):
        m.bar((sx * 17.9, 3.4, -7.7), (sx * 17.7, 5.1, -9.4), 0.9, 0.1, (0.9, 0.91, 0.93))
        m.bar((sx * 17.9, 3.4, -8.5), (sx * 17.9, 3.4, -7.0), 0.1, 0.1, acc2)
    hs = []
    for x in [-6.8, -5.0, -3.0, -1.2, 0, 1.2, 3.0, 5.0, 6.8]:
        t = abs(x) / 6.8
        hs.append((x, lerp(-13.2, -17.2, t), lerp(3.2, 1.2, t), lerp(CY + 1.35, CY + 1.9, t)))
    m.loft(airfoil_rings(hs, 0.08, 14), (0.9, 0.91, 0.93))
    fin = []
    for yv in [CY + 1.6, CY + 3.0, CY + 4.5, CY + 6.2, CY + 8.0, CY + 8.5]:
        t = (yv - (CY + 1.6)) / 6.9
        zle = lerp(-9.6, -16.8, t ** 1.1)
        c = lerp(6.9, 2.1, t)
        af = naca(14, 0.09)
        fin.append([(tt * c * 0.8, yv, zle - u * c) for u, tt in af])
    m.loft(fin, accent)
    for sx in (-1, 1):
        ex = sx * 5.7
        m.cyl((ex, 1.55, 4.9), (ex, 1.55, 1.2), 1.08, 1.0, (0.88, 0.89, 0.92), 22)
        m.cyl((ex, 1.55, 1.2), (ex, 1.55, 0.3), 1.0, 0.55, (0.8, 0.8, 0.84), 22)
        m.cyl((ex, 1.55, 4.9), (ex, 1.55, 5.05), 0.92, 0.9, (0.1, 0.11, 0.14), 22)
        m.cyl((ex, 1.55, 5.0), (ex, 1.55, 5.1), 0.18, 0.18, (0.7, 0.72, 0.76), 12)
        m.cyl((ex, 1.55, 4.9), (ex, 1.55, 5.0), 1.1, 1.08, acc2, 22)
        m.bar((ex, 2.1, 2.4), (ex * 0.98, 2.7, 1.3), 0.35, 0.8, (0.8, 0.82, 0.86))
    return m


def jet_gear():
    m = M("jet_gear")
    for sx in (-1, 1):
        m.cylx((sx * 0.3, 0.55, 13.0), 0.38, 0.38, 0.28, TIRE, 16)
        m.cylx((sx * 0.3, 0.55, 13.0), 0.2, 0.2, 0.3, (0.7, 0.72, 0.76), 10)
        for z in (-0.5, -1.9):
            m.bar((sx * 3.7, 3.0, -1.2), (sx * 3.8, 0.9, -1.2), 0.3, 0.3, (0.6, 0.62, 0.66))
            m.cylx((sx * 3.8, 0.58, z - 0.6), 0.58, 0.58, 0.38, TIRE, 20)
            m.cylx((sx * 3.8, 0.58, z - 0.6), 0.34, 0.34, 0.4, (0.7, 0.72, 0.76), 12)
        m.bar((sx * 3.9, 1.5, -1.2), (sx * 3.9, 0.7, -1.2), 0.5, 0.2, (0.6, 0.62, 0.66))
    m.bar((0, 2.0, 13.0), (0, 0.9, 13.0), 0.18, 0.18, (0.6, 0.62, 0.66))
    m.bar((0, 1.4, 13.0), (0, 1.4, 12.5), 0.25, 0.1, (0.45, 0.47, 0.5))
    m.box((0, 2.8, 12.8), (1.2, 0.8, 1.6), (0.2, 0.2, 0.22))
    return m


def jet_lit():
    m = M("jet_lit")
    CY = 3.35
    for sx in (-1, 1):
        for i in range(48):
            z = -13.5 + i * 0.57
            if abs(z - 11.5) < 0.9 or abs(z + 1.0) < 0.9 or abs(z - 4.6) < 0.5:
                continue
            m.box((sx * 1.99, CY + 0.38, z), (0.05, 0.22, 0.3), (1.0, 0.92, 0.72))
        m.box((sx * 3.6, 1.7, 2.6), (0.5, 0.15, 0.5), (1.0, 0.98, 0.9))
    m.box((0, 2.2, 14.0), (0.5, 0.15, 0.4), (1.0, 0.98, 0.9))
    return m


def jet_nav():
    m = M("jet_nav")
    m.box((18.0, 3.4, -8.6), (0.3, 0.3, 0.4), (1.0, 0.1, 0.1))
    m.box((-18.0, 3.4, -8.6), (0.3, 0.3, 0.4), (0.1, 1.0, 0.2))
    m.box((0, 11.9, -17.2), (0.3, 0.3, 0.4), (1.0, 1.0, 1.0))
    m.box((0, 1.35, 2.0), (0.4, 0.2, 0.4), (1.0, 0.1, 0.1))
    m.box((17.6, 3.6, -9.1), (0.25, 0.25, 0.25), (1.0, 1.0, 1.0))
    m.box((-17.6, 3.6, -9.1), (0.25, 0.25, 0.25), (1.0, 1.0, 1.0))
    return m


def run(export_it=True):
    clear_all()
    mp = make_material(False)
    mv = make_material(True)
    made = []
    for ob in build_cessna():
        o = ob.finish(mv)
        made.append(o)
    for nm, acc, acc2 in (("jet_blue", (0.1, 0.2, 0.55), (0.06, 0.1, 0.3)), ("jet_red", (0.75, 0.12, 0.14), (0.4, 0.05, 0.07))):
        made.append(build_jet(nm, acc, acc2).finish(mv))
    for b in (jet_gear, jet_lit, jet_nav):
        made.append(b().finish(mv))
    for o in made:
        for p in o.data.polygons:
            pass
        print(o.name, len(o.data.polygons))
    if export_it:
        export(made, "aircraft.glb")
    return made
