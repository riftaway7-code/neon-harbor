import bpy
import bmesh
import math
import os
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\Raahim Syed\neon-harbor\tools"
OUT = os.path.join(os.path.dirname(ROOT), "assets", "models")

SPECS = {
    "sedan": dict(L=2.15, by=0.28, wr=0.34, wcy=0.34, wz=1.32, rear=[(-2.15, 0.46), (-2.14, 0.84)], top=[(-1.6, 0.95), (-0.9, 0.97), (1.1, 0.99), (1.85, 0.85), (2.1, 0.7)], front=[(2.15, 0.48)], cabin=[(1.05, 0.97), (0.35, 1.43), (-0.7, 1.43), (-1.2, 0.95)]),
    "hatch": dict(L=1.95, by=0.28, wr=0.33, wcy=0.33, wz=1.15, rear=[(-1.95, 0.46), (-1.94, 0.9)], top=[(-1.5, 0.98), (-0.9, 1.0), (0.95, 1.02), (1.6, 0.88), (1.9, 0.72)], front=[(1.95, 0.5)], cabin=[(0.9, 1.0), (0.3, 1.5), (-1.15, 1.5), (-1.5, 1.0)]),
    "suv": dict(L=2.2, by=0.36, wr=0.4, wcy=0.4, wz=1.38, rear=[(-2.2, 0.58), (-2.19, 1.1)], top=[(-1.9, 1.12), (-1.0, 1.14), (1.1, 1.14), (1.85, 1.0), (2.15, 0.84)], front=[(2.2, 0.6)], cabin=[(1.0, 1.14), (0.5, 1.72), (-1.6, 1.72), (-1.95, 1.14)]),
    "coupe": dict(L=2.05, by=0.24, wr=0.33, wcy=0.33, wz=1.25, rear=[(-2.05, 0.42), (-2.04, 0.78)], top=[(-1.5, 0.88), (-0.6, 0.9), (0.9, 0.9), (1.75, 0.74), (2.02, 0.6)], front=[(2.05, 0.42)], cabin=[(0.8, 0.9), (0.1, 1.28), (-0.6, 1.3), (-1.3, 0.9)]),
}

GLASS = (0.11, 0.145, 0.21)
TIRE = (0.075, 0.08, 0.09)
RIM = (0.72, 0.75, 0.8)
HUB = (0.16, 0.17, 0.2)
DARK = (0.05, 0.055, 0.065)
CHROME = (0.78, 0.8, 0.84)
PLATE = (0.9, 0.88, 0.8)


def V(x, y, z):
    return Vector((x, -z, y))


def interp(poly, z):
    if z <= poly[0][0]:
        return poly[0][1]
    for i in range(len(poly) - 1):
        a, b = poly[i], poly[i + 1]
        if z <= b[0]:
            t = (z - a[0]) / max(1e-6, b[0] - a[0])
            return a[1] + (b[1] - a[1]) * t
    return poly[-1][1]


class Mesh:
    def __init__(self, name, colored=True):
        self.name = name
        self.bm = bmesh.new()
        self.col = self.bm.loops.layers.color.new("Col") if colored else None

    def _paint(self, verts, color):
        if self.col is None:
            return
        faces = {f for v in verts for f in v.link_faces}
        c = (color[0], color[1], color[2], 1.0)
        for f in faces:
            for l in f.loops:
                l[self.col] = c

    def cube(self, c, s, color):
        m = Matrix.Translation(V(*c)) @ Matrix.Diagonal((s[0], s[2], s[1], 1))
        r = bmesh.ops.create_cube(self.bm, size=1.0, matrix=m)
        self._paint(r["verts"], color)

    def bar(self, a, b, w, t, color):
        a = V(*a)
        b = V(*b)
        d = b - a
        ln = d.length
        if ln < 1e-5:
            return
        q = Vector((0, 0, 1)).rotation_difference(d.normalized())
        m = Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4() @ Matrix.Diagonal((w, t, ln, 1))
        r = bmesh.ops.create_cube(self.bm, size=1.0, matrix=m)
        self._paint(r["verts"], color)

    def cylx(self, c, r1, r2, width, color, sides=20):
        m = Matrix.Translation(V(*c)) @ Matrix.Rotation(math.pi / 2, 4, "Y")
        r = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=sides, radius1=r1, radius2=r2, depth=width, matrix=m)
        self._paint(r["verts"], color)
        for f in {f for v in r["verts"] for f in v.link_faces}:
            if len(f.verts) == 4:
                f.smooth = True

    def loft(self, rings, color, caps=True):
        vr = []
        for ring in rings:
            vr.append([self.bm.verts.new(V(*p)) for p in ring])
        faces = []
        n = len(vr[0])
        for i in range(len(vr) - 1):
            for k in range(n):
                k2 = (k + 1) % n
                faces.append(self.bm.faces.new((vr[i][k], vr[i][k2], vr[i + 1][k2], vr[i + 1][k])))
        if caps:
            faces.append(self.bm.faces.new(vr[0][::-1]))
            faces.append(self.bm.faces.new(vr[-1]))
        for f in faces:
            f.smooth = True
        verts = [v for r in vr for v in r]
        self._paint(verts, color)

    def finish(self, mat):
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me)
        self.bm.free()
        me.materials.append(mat)
        ob = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(ob)
        return ob


def ring_pts(z, y0, y1, hw, n, p, tumble, tumbleP=1.6):
    pts = []
    ym = (y0 + y1) / 2
    hh = max(0.01, (y1 - y0) / 2)
    for k in range(n):
        a = k / n * math.tau
        c, s = math.cos(a), math.sin(a)
        x = hw * math.copysign(abs(c) ** p, c)
        y = ym + hh * math.copysign(abs(s) ** p, s)
        up = max(0.0, s)
        x *= 1 - tumble * up ** tumbleP
        pts.append((x, y, z))
    return pts


def upper_line(S):
    pts = [S["rear"][1]] + S["top"] + [S["front"][0]]
    return sorted(pts, key=lambda p: p[0])


def body_stations(S):
    L = S["L"]
    zs = []
    n = 34
    for i in range(n + 1):
        t = i / n
        z = -L + (2 * L) * (0.5 - 0.5 * math.cos(t * math.pi))
        zs.append(z)
    return zs


def build_paint(S, name):
    m = Mesh(name, colored=False)
    L, by, wr, wcy, wz = S["L"], S["by"], S["wr"], S["wcy"], S["wz"]
    up = upper_line(S)
    ar = wr + 0.1
    rings = []
    for z in body_stations(S):
        y1 = interp(up, z)
        y0 = by
        for w in (wz, -wz):
            d = abs(z - w)
            if d < ar:
                y0 = max(y0, wcy + math.sqrt(ar * ar - d * d) * 0.96)
        y0 = min(y0, y1 - 0.08)
        edge = abs(z) / L
        hw = 0.86 * (1 - 0.1 * max(0.0, (edge - 0.75) / 0.25) ** 2)
        rings.append(ring_pts(z, y0, y1, hw, 20, 0.32, 0.12))
    m.loft(rings, (0, 0, 0))
    cb = S["cabin"]
    belt = cb[0][1]
    topY = cb[1][1]
    roofZ = (cb[1][0] + cb[2][0]) / 2
    hwC = 0.7
    m.cube((0, topY + 0.045, roofZ), (hwC * 1.5, 0.05, abs(cb[1][0] - cb[2][0]) + 0.1), (0, 0, 0))
    for sx in (-1, 1):
        m.bar((sx * (hwC - 0.02), cb[0][1], cb[0][0]), (sx * (hwC - 0.12), cb[1][1], cb[1][0]), 0.07, 0.07, (0, 0, 0))
        m.bar((sx * (hwC - 0.02), cb[3][1], cb[3][0]), (sx * (hwC - 0.12), cb[2][1], cb[2][0]), 0.08, 0.08, (0, 0, 0))
    zb = cb[3][0] + (cb[0][0] - cb[3][0]) * 0.45
    for sx in (-1, 1):
        m.bar((sx * (hwC - 0.02), belt, zb), (sx * (hwC - 0.12), topY, zb), 0.06, 0.07, (0, 0, 0))
    return m


def build_glass(S, m):
    cb = S["cabin"]
    up = upper_line(S)
    line = sorted([cb[3], cb[2], cb[1], cb[0]], key=lambda p: p[0])
    zs = []
    z0, z1 = cb[3][0], cb[0][0]
    n = 18
    for i in range(n + 1):
        t = i / n
        zs.append(z0 + (z1 - z0) * (0.5 - 0.5 * math.cos(t * math.pi)))
    rings = []
    for z in zs:
        ytop = interp(line, z)
        ybase = interp(up, z) - 0.03
        ytop = max(ytop, ybase + 0.03)
        rings.append(ring_pts(z, ybase, ytop, 0.7, 16, 0.5, 0.2, 1.4))
    m.loft(rings, GLASS)


def wheel(m, S, x, z):
    wr, wcy = S["wr"], S["wcy"]
    sx = 1 if x > 0 else -1
    m.cylx((x, wcy, z), wr, wr, 0.24, TIRE, sides=24)
    m.cylx((x + sx * 0.02, wcy, z), wr * 0.8, wr * 0.8, 0.22, (0.1, 0.105, 0.115), sides=24)
    m.cylx((x + sx * 0.115, wcy, z), wr * 0.62, wr * 0.62, 0.03, RIM, sides=20)
    for i in range(5):
        a = i / 5 * math.tau + 0.3
        m.bar((x + sx * 0.12, wcy, z), (x + sx * 0.12, wcy + math.sin(a) * wr * 0.58, z + math.cos(a) * wr * 0.58), 0.025, 0.07, RIM)
    m.cylx((x + sx * 0.125, wcy, z), wr * 0.2, wr * 0.2, 0.03, HUB, sides=12)
    m.cylx((x + sx * 0.13, wcy, z), wr * 0.06, wr * 0.06, 0.03, CHROME, sides=6)


def build_detail(S, name, cop=False, kind="sedan"):
    m = Mesh(name)
    L, by, wr, wcy, wz = S["L"], S["by"], S["wr"], S["wcy"], S["wz"]
    cb = S["cabin"]
    belt, topY = cb[0][1], cb[1][1]
    ar = wr + 0.1
    build_glass(S, m)
    for sx in (-1, 1):
        for z in (wz, -wz):
            wheel(m, S, sx * 0.8, z)
    for z in (wz, -wz):
        m.cube((0, (by + wcy + ar) / 2, z), (1.4, wcy + ar - by, ar * 2), (0.04, 0.04, 0.05))
    m.cube((0, by + 0.02, 0), (1.5, 0.04, 2 * L - 0.2), (0.04, 0.04, 0.05))
    for sgn in (1, -1):
        m.cube((0, by + 0.1, sgn * (L - 0.02)), (1.66, 0.17, 0.1), (0.1, 0.105, 0.12))
        m.cube((0, by + 0.19, sgn * (L + 0.0)), (1.4, 0.02, 0.05), (0.4, 0.41, 0.45))
    m.cube((0, S["front"][0][1] + 0.1, L + 0.04), (0.8, 0.12, 0.03), (0.03, 0.03, 0.035))
    for i in range(5):
        m.cube((0, S["front"][0][1] + 0.06 + i * 0.022, L + 0.09), (0.76, 0.008, 0.012), CHROME)
    m.cube((0, by + 0.14, L + 0.125), (0.5, 0.13, 0.02), PLATE)
    m.cube((0, by + 0.14, -L - 0.125), (0.5, 0.13, 0.02), PLATE)
    for sx in (-1, 1):
        m.cube((sx * 0.55, by + 0.07, L + 0.1), (0.12, 0.05, 0.03), (1, 0.9, 0.55))
    s1 = cb[0][0] - 0.35
    s3 = cb[3][0] + 0.45
    zb = cb[3][0] + (cb[0][0] - cb[3][0]) * 0.45

    def clear(z):
        return abs(z - wz) > ar + 0.03 and abs(z + wz) > ar + 0.03

    for sz in [s1, zb, s3]:
        if clear(sz):
            for sx in (-1, 1):
                m.cube((sx * 0.872, (belt + 0.5) / 2 - 0.01, sz), (0.022, belt - 0.52, 0.012), (0.06, 0.065, 0.075))
    for sx in (-1, 1):
        for hz in [zb + 0.28, s1 - 0.5]:
            if clear(hz):
                m.cube((sx * 0.935, belt - 0.1, hz), (0.04, 0.035, 0.16), CHROME)
        m.cube((sx * 0.95, belt + 0.01, cb[0][0] + 0.08), (0.14, 0.12, 0.2), (0.05, 0.055, 0.06))
        m.bar((sx * 0.84, belt - 0.02, cb[0][0] - 0.02), (sx * 0.97, belt + 0.05, cb[0][0] + 0.06), 0.03, 0.03, (0.05, 0.055, 0.06))
        m.cube((sx * 0.9, by + 0.04, 0), (0.06, 0.08, 2 * wz - 2 * ar - 0.4 + 1.0), (0.06, 0.065, 0.075))
        m.cube((sx * 0.6, S["rear"][0][1] + 0.18, -L - 0.07), (0.3, 0.06, 0.02), (0.1, 0.1, 0.11))
    if kind == "suv":
        for sx in (-1, 1):
            m.cube((sx * 0.6, cb[1][1] + 0.1, (cb[1][0] + cb[2][0]) / 2), (0.05, 0.05, abs(cb[1][0] - cb[2][0]) + 0.1), (0.1, 0.1, 0.12))
        m.cube((0, 0.62, -L - 0.17), (0.7, 0.7, 0.08), (0.05, 0.055, 0.06))
        m.cylx((0, 0.62, -L - 0.22), 0.33, 0.33, 0.08, TIRE, sides=20)
    if kind == "coupe":
        m.cube((0, S["rear"][1][1] + 0.1, -L + 0.18), (1.55, 0.05, 0.4), (0.05, 0.055, 0.06))
        for sx in (-1, 1):
            m.cube((sx * 0.72, S["rear"][1][1] + 0.02, -L + 0.2), (0.05, 0.14, 0.2), (0.05, 0.055, 0.06))
    if kind == "hatch":
        m.cube((0, cb[3][1] + 0.35, cb[3][0] - 0.02), (0.5, 0.02, 0.02), (0.06, 0.06, 0.07))
    m.cube((-0.4, by + 0.03, -L - 0.08), (0.1, 0.06, 0.2), CHROME)
    if cop:
        s1c = s1
        m.cube((0, 0.66, (s1 + s3) / 2), (1.88, 0.4, s1 - s3), (0.08, 0.09, 0.11))
        m.cube((0, topY + 0.085, (cb[1][0] + cb[2][0]) / 2), (1.2, 0.05, 0.34), (0.08, 0.09, 0.11))
        m.cube((0, by + 0.18, L + 0.16), (1.3, 0.2, 0.06), (0.04, 0.04, 0.05))
        for sx in (-0.45, 0.45):
            m.bar((sx, by + 0.1, L + 0.16), (sx, by + 0.4, L + 0.05), 0.05, 0.05, (0.04, 0.04, 0.05))
    return m


def build_lit(S, name):
    m = Mesh(name)
    L = S["L"]
    hy = S["front"][0][1] + 0.12
    ty = S["rear"][0][1] + 0.22
    for sx in (-1, 1):
        m.cube((sx * 0.62, hy, L + 0.085), (0.36, 0.11, 0.05), (1.0, 0.96, 0.82))
        m.cube((sx * 0.62, hy + 0.0, L + 0.07), (0.38, 0.13, 0.03), (0.75, 0.78, 0.82))
        m.cube((sx * 0.86, hy - 0.02, L + 0.075), (0.12, 0.06, 0.05), (1.0, 0.63, 0.13))
        m.cube((sx * 0.62, ty, -L - 0.085), (0.42, 0.1, 0.05), (1.0, 0.12, 0.17))
        m.cube((sx * 0.86, ty - 0.02, -L - 0.075), (0.12, 0.05, 0.05), (1.0, 0.54, 0.13))
        m.cube((sx * 0.62, ty - 0.1, -L - 0.075), (0.1, 0.04, 0.03), (0.95, 0.95, 0.9))
    return m


def make_material(vc=True):
    m = bpy.data.materials.new("prop" if vc else "paint")
    m.use_nodes = True
    nt = m.node_tree
    for nd in list(nt.nodes):
        if nd.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(nd)
    out = next(nd for nd in nt.nodes if nd.type == "OUTPUT_MATERIAL")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    if vc:
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
    mp = make_material(False)
    mv = make_material(True)
    made = []
    col = 0
    for kind, S in SPECS.items():
        for part, builder, mat in (("paint", lambda: build_paint(S, "car_%s_paint" % kind), mp), ("detail", lambda: build_detail(S, "car_%s_detail" % kind, False, kind), mv), ("lit", lambda: build_lit(S, "car_%s_lit" % kind), mv)):
            ob = builder().finish(mat)
            ob.location = (col * 5.0, 0, 0)
            made.append(ob)
        col += 1
    ob = build_detail(SPECS["sedan"], "car_cop_detail", True, "sedan").finish(mv)
    ob.location = (col * 5.0, 0, 0)
    made.append(ob)
    for ob in made:
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
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "cars.glb"), export_format="GLB", use_selection=True, export_yup=True, export_apply=True, export_normals=True, export_vertex_color="ACTIVE")
        for ob, l in zip(made, locs):
            ob.location = l
    return made
