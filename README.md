# neon harbor

gta-ish open world city game, single html file + three.js (r128).

## run it
double click `serve.bat` (needs python) or `python -m http.server 8123` then open http://localhost:8123/index.html
opening index.html straight from the folder also works, models load through script tags not fetch.

## 3d models
- `tools/make_trees.py` builds the trees in blender (run from blender's python, needs the textures in `tools/tex`)
- `tools/pack_models.py` turns every `assets/models/*.glb` into a `.js` file the game loads
- trees use cc0 leaf + bark textures from poly haven

## rules
- no code comments
- private repo, push to main
