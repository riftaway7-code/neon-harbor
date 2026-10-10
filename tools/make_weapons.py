import bpy
import bmesh
import math
from mathutils import Vector
import acommon as AC
from acommon import M, V, clear_all, make_material, export

STEEL = (0.34, 0.35, 0.39)
GUNMETAL = (0.11, 0.115, 0.125)
BLACK = (0.045, 0.047, 0.052)
POLY = (0.07, 0.072, 0.078)
WOOD = (0.36, 0.2, 0.1)
WOOD_D = (0.24, 0.13, 0.065)
BRASS = (0.7, 0.52, 0.2)
RED = (0.85, 0.12, 0.08)


def soften(m, offset=0.0022, segments=1):
    bm = m.bm
    edges = [e for e in bm.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > 0.6]
    bmesh.ops.bevel(bm, geom=edges, offset=offset, segments=segments, affect="EDGES", profile=0.5)


def pistol():
    m = M("pistol")
    m.box((0, 0.052, 0.068), (0.027, 0.034, 0.19), GUNMETAL)
    m.box((0, 0.052, 0.168), (0.021, 0.026, 0.012), BLACK)
    m.cyl((0, 0.052, 0.17), (0, 0.052, 0.205), 0.0085, 0.0085, STEEL, 12)
    m.box((0, 0.073, 0.016), (0.012, 0.008, 0.014), BLACK)
    m.box((0, 0.073, 0.152), (0.004, 0.007, 0.008), BLACK)
    for i in range(5):
        m.box((0, 0.056, -0.012 - i * 0.008), (0.0285, 0.026, 0.0035), BLACK)
    m.box((0, 0.023, 0.062), (0.026, 0.026, 0.17), POLY)
    m.box((0, 0.034, 0.138), (0.027, 0.012, 0.046), POLY)
    m.bar((0, 0.026, 0.0), (0, -0.092, -0.026), 0.029, 0.039, POLY)
    m.bar((0, -0.092, -0.026), (0, -0.108, -0.03), 0.031, 0.043, GUNMETAL)
    m.bar((0, 0.012, 0.05), (0, -0.022, 0.05), 0.012, 0.007, POLY)
    m.bar((0, -0.022, 0.05), (0, -0.022, 0.094), 0.012, 0.007, POLY)
    m.bar((0, 0.012, 0.094), (0, -0.022, 0.094), 0.012, 0.007, POLY)
    m.bar((0, 0.005, 0.066), (0, -0.014, 0.062), 0.0055, 0.008, STEEL)
    soften(m, 0.0016)
    return m


def shotgun():
    m = M("shotgun")
    m.box((0, 0.04, 0.06), (0.04, 0.05, 0.26), GUNMETAL)
    m.box((0, 0.068, 0.05), (0.018, 0.008, 0.18), BLACK)
    m.cyl((0, 0.052, 0.19), (0, 0.052, 0.86), 0.0145, 0.0145, STEEL, 14)
    m.cyl((0, 0.052, 0.86), (0, 0.052, 0.876), 0.0125, 0.0125, BLACK, 10)
    m.cyl((0, 0.016, 0.2), (0, 0.016, 0.7), 0.0135, 0.0135, GUNMETAL, 12)
    m.cyl((0, 0.016, 0.7), (0, 0.016, 0.712), 0.016, 0.016, BLACK, 12)
    m.box((0, 0.028, 0.46), (0.048, 0.042, 0.23), WOOD)
    for i in range(6):
        m.box((0, 0.028, 0.37 + i * 0.036), (0.05, 0.044, 0.006), WOOD_D)
    m.box((0, 0.088, 0.855), (0.006, 0.012, 0.012), BRASS)
    m.bar((0, 0.036, -0.06), (0, 0.02, -0.4), 0.044, 0.08, WOOD)
    m.bar((0, 0.02, -0.4), (0, -0.03, -0.44), 0.046, 0.05, BLACK)
    m.bar((0, 0.01, -0.06), (0, -0.07, -0.085), 0.034, 0.046, WOOD_D)
    m.bar((0, 0.016, 0.0), (0, -0.034, 0.0), 0.012, 0.008, BLACK)
    m.bar((0, -0.034, 0.0), (0, -0.034, 0.07), 0.012, 0.008, BLACK)
    m.bar((0, 0.016, 0.07), (0, -0.034, 0.07), 0.012, 0.008, BLACK)
    m.box((0, 0.01, 0.12), (0.03, 0.016, 0.075), BLACK)
    soften(m, 0.0022)
    return m


def rifle():
    m = M("rifle")
    m.box((0, 0.05, 0.04), (0.04, 0.05, 0.3), GUNMETAL)
    m.box((0, 0.012, 0.03), (0.042, 0.05, 0.24), BLACK)
    m.box((0, 0.082, 0.05), (0.02, 0.016, 0.22), GUNMETAL)
    m.box((0, 0.098, 0.06), (0.008, 0.016, 0.02), BLACK)
    m.box((0, 0.045, 0.37), (0.046, 0.05, 0.3), POLY)
    for i in range(7):
        m.box((0.0, 0.045, 0.25 + i * 0.038), (0.048, 0.052, 0.006), BLACK)
    m.cyl((0, 0.05, 0.52), (0, 0.05, 0.76), 0.0095, 0.0095, STEEL, 12)
    m.cyl((0, 0.05, 0.74), (0, 0.05, 0.82), 0.014, 0.014, BLACK, 12)
    m.box((0, 0.076, 0.7), (0.006, 0.032, 0.008), BLACK)
    m.box((0, 0.074, 0.2), (0.012, 0.026, 0.01), BLACK)
    m.bar((0, 0.01, 0.12), (0, -0.125, 0.14), 0.026, 0.042, POLY)
    m.bar((0, 0.01, -0.01), (0, -0.095, -0.04), 0.03, 0.04, BLACK)
    m.bar((0, 0.056, -0.1), (0, 0.04, -0.33), 0.044, 0.07, POLY)
    m.bar((0, 0.04, -0.33), (0, -0.01, -0.36), 0.046, 0.05, BLACK)
    m.bar((0, -0.01, 0.0), (0, -0.04, 0.0), 0.012, 0.008, BLACK)
    m.bar((0, -0.04, 0.0), (0, -0.04, 0.07), 0.012, 0.008, BLACK)
    m.bar((0, -0.01, 0.07), (0, -0.04, 0.07), 0.012, 0.008, BLACK)
    m.box((0, 0.078, 0.31), (0.036, 0.04, 0.09), BLACK)
    m.box((0, 0.078, 0.356), (0.03, 0.03, 0.006), (0.1, 0.25, 0.4))
    soften(m, 0.0018)
    return m


def run(export_it=True):
    clear_all()
    mv = make_material(True)
    made = [fn().finish(mv) for fn in (pistol, shotgun, rifle)]
    for o in made:
        print(o.name, len(o.data.polygons))
    if export_it:
        export(made, "weapons.glb")
    return made
