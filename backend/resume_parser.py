import pdfplumber
import re

def parse_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                if text and not text.endswith("\n"):
                    text += "\n"
                text += extracted
    
    text = re.sub(r'\(cid:\d+\)', '', text)
    
    # Process line by line to strip extra horizontal spaces but keep newlines
    lines = []
    for line in text.splitlines():
        cleaned_line = re.sub(r'[ \t]+', ' ', line).strip()
        lines.append(cleaned_line)
    
    return "\n".join(lines)
