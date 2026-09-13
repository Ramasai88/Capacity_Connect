# scripts/enrich_all_13_courses.py
import json
import os
import re

CURRICULUM_DIR = os.path.join(os.path.dirname(__file__), "..", "lib", "demo", "curriculum")

# Helper to read existing TS file
def read_curriculum_file(filename):
    filepath = os.path.join(CURRICULUM_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    # Extract JSON part
    match = re.search(r'export const (\w+): CourseCurriculum = ({[\s\S]+});', content)
    if not match:
        raise ValueError(f"Could not parse {filename}")
    var_name = match.group(1)
    data = json.loads(match.group(2))
    return var_name, data

def save_curriculum_file(filename, var_name, data):
    filepath = os.path.join(CURRICULUM_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write('import { CourseCurriculum } from "./types";\n\n')
        f.write(f'export const {var_name}: CourseCurriculum = ')
        f.write(json.dumps(data, indent=2, ensure_ascii=False))
        f.write(';\n')
    print(f"[OK] Successfully saved {filename} ({len(data['modules'])} modules)")

print("Enrichment framework initialized.")
