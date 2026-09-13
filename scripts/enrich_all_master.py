# scripts/enrich_all_master.py
import json
import os
import re

CURRICULUM_DIR = os.path.join(os.path.dirname(__file__), "..", "lib", "demo", "curriculum")

def save_curriculum_file(filename, var_name, data):
    filepath = os.path.join(CURRICULUM_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write('import { CourseCurriculum } from "./types";\n\n')
        f.write(f'export const {var_name}: CourseCurriculum = ')
        f.write(json.dumps(data, indent=2, ensure_ascii=False))
        f.write(';\n')
    print(f"[SUCCESS] Saved {filename} with {len(data['modules'])} modules.")

def read_curriculum_file(filename):
    filepath = os.path.join(CURRICULUM_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    match = re.search(r'export const (\w+): CourseCurriculum = ({[\s\S]+});', content)
    if not match:
        raise ValueError(f"Could not parse {filename}")
    var_name = match.group(1)
    data = json.loads(match.group(2))
    return var_name, data

# Helper to generate rich 10-part lessons for any module
def create_concept(topic, title, desc, why, how, steps, worked_ex, industry_usage, code, code_expl, output, pitfalls, practice, takeaway):
    return {
        "topic": topic,
        "title": title,
        "description": desc,
        "whyItMatters": why,
        "howItWorks": how,
        "stepByStep": steps,
        "workedExample": worked_ex,
        "realWorldUsage": industry_usage,
        "codeSnippet": code,
        "codeExplanation": code_expl,
        "expectedOutput": output,
        "commonMistakes": pitfalls,
        "practiceTask": practice,
        "keyTakeaway": takeaway
    }

# Load and run enrichment for all 13 courses
print("Starting comprehensive enrichment for all 13 courses...")
