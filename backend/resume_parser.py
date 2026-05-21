import pdfplumber
import re

def parse_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted
    
    text = re.sub(r'\(cid:\d+\)', '', text)
    text = text.replace('\n', ' ')
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()
