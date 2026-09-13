import os
import json

CURRICULUM_DIR = os.path.join(os.path.dirname(__file__), "..", "lib", "demo", "curriculum")
os.makedirs(CURRICULUM_DIR, exist_ok=True)

def save_curriculum(filename, var_name, data):
    filepath = os.path.join(CURRICULUM_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write('import { CourseCurriculum } from "./types";\n\n')
        f.write(f'export const {var_name}: CourseCurriculum = ')
        f.write(json.dumps(data, indent=2, ensure_ascii=False))
        f.write(';\n')
    print(f"[SUCCESS] Wrote {filename} with {len(data['modules'])} modules.")

# Let's verify paths
if __name__ == "__main__":
    print(f"Curriculum directory: {CURRICULUM_DIR}")
