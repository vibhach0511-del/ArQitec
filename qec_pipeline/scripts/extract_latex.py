import json
import re

def extract_latex(text):
    results = {}
    align_blocks = re.findall(r"\\begin\{align\}(.*?)\\end\{align\}", text, re.DOTALL)
    results["align_blocks"] = [b.strip() for b in align_blocks]
    inline_math = re.findall(r"\\\((.*?)\\\)", text, re.DOTALL)
    results["inline_math"] = [m.strip() for m in inline_math]
    pauli_strings = re.findall(r"\b[IXYZ]{3,}\b", text)
    results["pauli_strings"] = list(set(pauli_strings))
    code_params = re.findall(r"\[\[([\d,]+)\]\]", text)
    results["code_params"] = list(set(code_params))
    return results

d = json.load(open("eczoo_codes_full.json"))
for code in d:
    code["math"] = extract_latex(code["description"])
with open("eczoo_codes_full.json", "w") as f:
    json.dump(d, f, indent=2)
print(f"Processed {len(d)} codes")
has_pauli = sum(1 for c in d if c["math"]["pauli_strings"])
has_align = sum(1 for c in d if c["math"]["align_blocks"])
has_params = sum(1 for c in d if c["math"]["code_params"])
print(f"Records with Pauli strings: {has_pauli}/290")
print(f"Records with align blocks: {has_align}/290")
print(f"Records with code params: {has_params}/290")
