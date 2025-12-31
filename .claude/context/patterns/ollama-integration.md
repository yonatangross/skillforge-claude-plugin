# Ollama Integration Patterns

**Purpose**: Local LLM integration with langchain-ollama
**Last Updated**: 2025-12-29
**Source**: AI/ML research for SkillForge (Issue #608)

---

## Package Setup

```bash
# langchain-ollama v1.0.1+ (December 2025)
pip install langchain-ollama
# Requires: Python 3.10+, Ollama installed locally
```

---

## 1. ChatOllama Usage

### Basic Setup

```python
from langchain_ollama import ChatOllama

llm = ChatOllama(
    model="llama3.2",
    temperature=0.3,
    base_url="http://localhost:11434",  # Default
)

response = await llm.ainvoke("Explain async/await in Python")
```

### Structured Output

```python
from pydantic import BaseModel

class Analysis(BaseModel):
    sentiment: str
    confidence: float

llm_structured = llm.with_structured_output(Analysis)
result = await llm_structured.ainvoke("Analyze: Great product!")
# result.sentiment = "positive", result.confidence = 0.95
```

---

## 2. OllamaEmbeddings Usage

### Basic Embeddings

```python
from langchain_ollama import OllamaEmbeddings

embeddings = OllamaEmbeddings(model="nomic-embed-text")

# Single embedding
vector = embeddings.embed_query("Sample text")  # Returns list[float]

# Batch embeddings
vectors = embeddings.embed_documents(["Doc 1", "Doc 2", "Doc 3"])
```

### RAG Integration

```python
from langchain_core.vectorstores import InMemoryVectorStore

embeddings = OllamaEmbeddings(model="nomic-embed-text")
vector_store = InMemoryVectorStore(embeddings)

# Index documents
vector_store.add_documents(documents)

# Semantic search
results = vector_store.similarity_search("query", k=5)
```

---

## 3. Recommended Models

| Model | Use Case | Notes |
|-------|----------|-------|
| `llama3.2` | General reasoning | Good balance of speed/quality |
| `llama3.2:1b` | Fast classification | Low latency, smaller context |
| `nomic-embed-text` | Embeddings | 8K context, high quality |
| `qwen2.5-coder` | Code generation | Best for code tasks |
| `mistral` | Tool calling | Excellent function support |

---

## 4. Performance on Apple Silicon

### M4 Max Optimizations

```python
# Ollama automatically uses Metal GPU acceleration
# No code changes needed for Apple Silicon

# Monitor with:
# ollama ps  # Shows loaded models
# ollama run llama3.2 --verbose  # Shows inference speed
```

### Expected Performance (M4 Max)

| Model | Tokens/sec | Context | Memory |
|-------|------------|---------|--------|
| llama3.2:3b | 80-100 | 128K | 4GB |
| llama3.2:1b | 150+ | 128K | 2GB |
| nomic-embed-text | 500+ | 8K | 1GB |

---

## 5. CI/CD Considerations

### Mock for Testing

```python
from unittest.mock import AsyncMock, MagicMock

def create_mock_ollama():
    mock = MagicMock()
    mock.ainvoke = AsyncMock(return_value="Mocked response")
    mock.with_structured_output = MagicMock(return_value=mock)
    return mock
```

### Skip in CI (No GPU)

```python
import pytest
import os

@pytest.mark.skipif(
    os.getenv("CI") == "true",
    reason="Ollama not available in CI"
)
async def test_ollama_integration():
    ...
```

---

## Quick Reference

```
┌───────────────────────────────────────────────────────────┐
│                 OLLAMA INTEGRATION CHECKLIST              │
├───────────────────────────────────────────────────────────┤
│ [ ] Use langchain-ollama (not langchain-community)        │
│ [ ] ChatOllama for chat, OllamaEmbeddings for vectors     │
│ [ ] with_structured_output() for Pydantic responses       │
│ [ ] Mock in tests (no GPU in CI)                          │
│ [ ] nomic-embed-text for embeddings (8K context)          │
│ [ ] llama3.2 for reasoning (128K context)                 │
└───────────────────────────────────────────────────────────┘
```

---

*Migrated from: role-comm-aiml.md (condensed from 693 to ~150 lines)*
