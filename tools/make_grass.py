import bpy
import bmesh
import math
import os
import random
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\Raahim Syed\neon-harbor\tools"
OUT = os.path.join(os.path.dirname(ROOT), "assets", "models")

VARIANTS = {
    "grass_short": dict(blades=26, radius=0.16, h=(0.16, 0.3), w=0.018, bend=(0.15, 0.5), seed=3, base=(0.05, 0.14, 0.03), tip=(0.30, 0.50, 0.12), dry=0.0),
    "grass_mid": dict(blades=34, radius=0.2, h=(0.28, 0.5), w=0.022, bend=(0.25, 0.8), seed=8, base=(0.05, 0.13, 0.03), tip=(0.36, 0.55, 0.14), dry=0.12),
    "grass_tall": dict(blades=30, radius=0.24, h=(0.45, 0.85), w=0.026, bend=(0.4, 1.1), seed=15, base=(0.06, 0.12, 0.03), tip=(0.42, 0.5, 0.14), dry=0.35),
}


def blade(bm, col_layer, rng, st, cx, cy):
    h = rng.uniform(*st["h"])
    w = st["w"] * rng.uniform(0.8, 1.3)
    az = rng.uniform(0, math.tau)
    lean = rng.uniform(0.0, 0.35)
    bend = rng.uniform(*st["bend"])
    d = Vector((math.cos(az), math.sin(az), 0))
    side = Vector((-d.y, d.x, 0))
    dry = rng.random() < st["dry"]
    tint = rng.uniform(0.8, 1.2)
    segs = 4
    verts = []
    colors = []
    for i in range(segs + 1):
        t = i / segs
        off = d * (lean * h * t + bend * h * t * t * 0.55)
        z = h * t * (1 - 0.18 * bend * t)
        p = Vector((cx, cy, 0)) + off + Vector((0, 0, z))
        half = w * (1 - t) ** 0.8 * (0.5 if i < segs else 0.0)
        a = p - side * half
        b = p + side * half
        if i == segs:
            vs = [bm.verts.new(p)]
            cols = [None]
        else:
            vs = [bm.verts.new(a), bm.verts.new(b)]
            cols = [None, None]
        verts.append(vs)
        if dry:
            c = (0.28 * tint, 0.22 * tint, 0.1 * tint) if t > 0.45 else (0.07, 0.1, 0.03)
        else:
            c = tuple((st["base"][k] + (st["tip"][k] - st["base"][k]) * t ** 0.8) * tint for k in range(3))
        colors.append(c)
    faces = []
    for i in range(segs):
        lo, hi = verts[i], verts[i + 1]
        if len(hi) == 1:
            faces.append((bm.faces.new((lo[0], lo[1], hi[0])), (i, i, i + 1)))
        else:
            faces.append((bm.faces.new((lo[0], lo[1], hi[1], hi[0])), (i, i, i + 1, i + 1)))
    for f, idx in faces:
        for loop, ci in zip(f.loops, idx):
            loop[col_layer] = (*colors[ci], 1.0)
    return verts


def build_clump(name, st):
    rng = random.Random(st["seed"])
    bm = bmesh.new()
    cl = bm.loops.layers.color.new("Col")
    for _ in range(st["blades"]):
        r = st["radius"] * math.sqrt(rng.random())
        a = rng.uniform(0, math.tau)
        blade(bm, cl, rng, st, r * math.cos(a), r * math.sin(a))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    normals = []
    for v in me.vertices:
        radial = Vector((v.co.x, v.co.y, 0))
        radial = radial.normalized() if radial.length > 1e-4 else Vector((0, 0, 0))
        n = (Vector((0, 0, 1)) * 0.75 + radial * 0.35).normalized()
        normals.append(tuple(n))
    me.normals_split_custom_set_from_vertices(normals)
    return me


def make_material():
    m = bpy.data.materials.new("grass")
    m.use_nodes = True
    nt = m.node_tree
    for nd in list(nt.nodes):
        if nd.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(nd)
    out = next(nd for nd in nt.nodes if nd.type == "OUTPUT_MATERIAL")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.8
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
    for i, (name, st) in enumerate(VARIANTS.items()):
        me = build_clump(name, st)
        me.materials.append(mat)
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        ob.location = (i * 1.2, 0, 0)
        made.append(ob)
        print(name, sum(len(p.vertices) - 2 for p in me.polygons))
    if export:
        os.makedirs(OUT, exist_ok=True)
        for ob in made:
            ob.location = (0, 0, 0)
        bpy.ops.object.select_all(action="DESELECT")
        for ob in made:
            ob.select_set(True)
        bpy.context.view_layer.objects.active = made[0]
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "grass.glb"), export_format="GLB", use_selection=True, export_yup=True, export_apply=True, export_normals=True, export_vertex_color="ACTIVE")
        for i, ob in enumerate(made):
            ob.location = (i * 1.2, 0, 0)
    return made
