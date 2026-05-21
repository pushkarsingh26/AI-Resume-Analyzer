from typing import List
from dataclasses import dataclass
import numpy as np
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter

@dataclass
class SearchResult:
    page_content: str
    score: float

class EmbeddingManager:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = SentenceTransformer(self.model_name)

    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        return self.model.encode(texts, show_progress_bar=False)

class SimpleVectorStore:
    def __init__(self, texts: List[str], embedding_manager: EmbeddingManager):
        self.texts = texts
        self.embedding_manager = embedding_manager
        self.embeddings = self.embedding_manager.generate_embeddings(texts).astype(np.float32)
        norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        self.embeddings = self.embeddings / np.maximum(norms, 1e-12)

    def similarity_search(self, query: str, k: int = 3):
        query_embedding = self.embedding_manager.generate_embeddings([query]).astype(np.float32)[0]
        query_embedding = query_embedding / max(np.linalg.norm(query_embedding), 1e-12)
        scores = self.embeddings @ query_embedding
        top_indices = np.argsort(scores)[::-1][:k]
        return [SearchResult(page_content=self.texts[i], score=float(scores[i])) for i in top_indices]

def create_vector_store(text: str) -> SimpleVectorStore:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=50,
        separators=["\n\n", "\n", ".", " "]
    )
    chunks = splitter.split_text(text)
    manager = EmbeddingManager()
    return SimpleVectorStore(chunks, manager)
