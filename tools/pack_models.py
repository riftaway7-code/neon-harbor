import base64
import os
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
models = os.path.join(root, "assets", "models")

for name in sorted(os.listdir(models)):
    if not name.endswith(".glb"):
        continue
    key = name[:-4]
    with open(os.path.join(models, name), "rb") as f:
        data = base64.b64encode(f.read()).decode("ascii")
    with open(os.path.join(models, key + ".js"), "w", encoding="ascii") as f:
        f.write("window.NH_MODELS=window.NH_MODELS||{};window.NH_MODELS[\"" + key + "\"]=\"" + data + "\";\n")
    print(key, len(data))
