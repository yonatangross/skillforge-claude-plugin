# Ollama Local Inference Reference

Comprehensive guide for running LLMs locally using Ollama with LangChain integration.

## Overview

Ollama enables running large language models locally on Apple Silicon and NVIDIA GPUs. Combined with `langchain-ollama` v1.0.1, it provides a production-ready solution for:

- **CI/CD Cost Reduction**: 93% savings vs cloud APIs
- **Development**: No API costs during development
- **Privacy**: Data never leaves your machine
- **Low Latency**: 50-200ms vs 200-500ms for cloud

## Model Recommendations

### By Task Type

| Task | Model | Size | Performance | Use Case |
|------|-------|------|-------------|----------|
| Reasoning | `deepseek-r1:70b` | ~42GB | GPT-4 level | G-Eval, synthesis, complex analysis |
| Coding | `qwen2.5-coder:32b` | ~35GB | 73.7% Aider | Code generation, tool calling, agents |
| General | `llama3.3:70b` | ~40GB | Strong general | Chat, summarization |
| Embeddings | `nomic-embed-text` | ~0.5GB | 768 dims | Semantic search, RAG |
| Fast Embed | `all-minilm` | ~0.1GB | 384 dims | High-volume, lower quality |

### Hardware Requirements

| Hardware | Max Models | Recommended Config |
|----------|------------|-------------------|
| M4 Max 256GB | 3 x 70B | deepseek-r1:70b + qwen2.5-coder:32b + nomic-embed-text |
| M4 Pro 48GB | 1 x 70B | deepseek-r1:70b OR qwen2.5-coder:32b |
| M3 24GB | 1 x 32B | qwen2.5-coder:32b |
| RTX 4090 24GB | 1 x 70B (quantized) | deepseek-r1:70b-q4 |

## Installation

### macOS (Homebrew)

```bash
# Install Ollama
brew install ollama

# Start service
brew services start ollama

# Pull models
ollama pull nomic-embed-text
ollama pull qwen2.5-coder:32b
ollama pull deepseek-r1:70b
```

### Linux

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start service
sudo systemctl start ollama

# Pull models
ollama pull nomic-embed-text
ollama pull qwen2.5-coder:32b
ollama pull deepseek-r1:70b
```

### Verify Installation

```bash
# Check service
curl http://localhost:11434/api/tags

# Test embedding
curl http://localhost:11434/api/embeddings \
  -d '{"model":"nomic-embed-text","prompt":"test"}'

# Test chat
curl http://localhost:11434/api/chat \
  -d '{"model":"qwen2.5-coder:32b","messages":[{"role":"user","content":"Hello"}]}'
```

## LangChain Integration (v1.0.1)

### ChatOllama

```python
from langchain_ollama import ChatOllama

# Basic usage
llm = ChatOllama(
    model="deepseek-r1:70b",
    base_url="http://localhost:11434",
    temperature=0.0,
)

response = await llm.ainvoke("Explain quantum computing")
print(response.content)
```

### Key Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | str | required | Ollama model name |
| `base_url` | str | `http://localhost:11434` | Ollama server URL |
| `temperature` | float | 0.8 | Sampling temperature (0.0 = deterministic) |
| `num_ctx` | int | 2048 | Context window size |
| `timeout` | float | None | Request timeout in seconds |
| `keep_alive` | str | `5m` | How long to keep model loaded |

### keep_alive Parameter (Critical for CI)

The `keep_alive` parameter controls how long a model stays loaded in GPU memory after a request:

```python
# Keep model loaded for 5 minutes (good for CI)
llm = ChatOllama(model="qwen2.5-coder:32b", keep_alive="5m")

# Keep model loaded for 1 hour (development)
llm = ChatOllama(model="qwen2.5-coder:32b", keep_alive="1h")

# Unload immediately after request (memory constrained)
llm = ChatOllama(model="qwen2.5-coder:32b", keep_alive="0")

# Keep loaded indefinitely (not recommended)
llm = ChatOllama(model="qwen2.5-coder:32b", keep_alive="-1")
```

**CI Best Practice**: Use `keep_alive="5m"` to avoid cold starts between test runs. First request loads model (~30-60s), subsequent requests are fast (~50-200ms).

### Tool Calling

```python
from langchain_core.tools import tool
from pydantic import BaseModel, Field

# Define tool with Pydantic
class SearchQuery(BaseModel):
    """Search for documents."""
    query: str = Field(description="Search query")
    limit: int = Field(default=10, description="Max results")

# Or with @tool decorator
@tool
def get_weather(location: str) -> str:
    """Get weather for a location."""
    return f"Weather in {location}: Sunny, 72F"

# Bind tools
llm_with_tools = llm.bind_tools([SearchQuery, get_weather])

# Invoke
response = await llm_with_tools.ainvoke("Search for Python tutorials")
print(response.tool_calls)
# [{'name': 'SearchQuery', 'args': {'query': 'Python tutorials', 'limit': 10}}]
```

### Structured Output

```python
from pydantic import BaseModel, Field

class CodeReview(BaseModel):
    """Code review result."""
    issues: list[str] = Field(description="List of issues found")
    severity: str = Field(description="Overall severity: low/medium/high")
    suggestions: list[str] = Field(description="Improvement suggestions")

# Get structured output
structured_llm = llm.with_structured_output(CodeReview)
result = await structured_llm.ainvoke("Review this code: def add(a,b): return a+b")
print(result.issues)  # []
print(result.severity)  # "low"
```

### Streaming

```python
async def stream_response(prompt: str):
    """Stream tokens as they're generated."""
    async for chunk in llm.astream(prompt):
        if hasattr(chunk, "content") and chunk.content:
            print(chunk.content, end="", flush=True)

await stream_response("Write a haiku about coding")
```

## OllamaEmbeddings

```python
from langchain_ollama import OllamaEmbeddings

embeddings = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url="http://localhost:11434",
)

# Single text
vector = await embeddings.aembed_query("Hello world")
print(len(vector))  # 768

# Batch
vectors = await embeddings.aembed_documents([
    "First document",
    "Second document",
    "Third document"
])
print(len(vectors))  # 3
print(len(vectors[0]))  # 768
```

### Embedding Model Comparison

| Model | Dimensions | Speed | Quality | Size |
|-------|-----------|-------|---------|------|
| `nomic-embed-text` | 768 | Fast | High | ~0.5GB |
| `mxbai-embed-large` | 1024 | Medium | Higher | ~1.3GB |
| `all-minilm` | 384 | Very Fast | Medium | ~0.1GB |
| `snowflake-arctic-embed` | 1024 | Slow | Highest | ~2GB |

## Provider Factory Pattern

Automatically switch between cloud and local based on environment:

```python
from app.core.config import settings

def get_llm_provider(task_type: str = "reasoning"):
    """Get LLM provider based on OLLAMA_ENABLED setting."""

    if settings.OLLAMA_ENABLED:
        from langchain_ollama import ChatOllama

        model = {
            "reasoning": settings.OLLAMA_MODEL_REASONING,  # deepseek-r1:70b
            "coding": settings.OLLAMA_MODEL_CODING,        # qwen2.5-coder:32b
        }.get(task_type, settings.OLLAMA_MODEL_REASONING)

        return ChatOllama(
            model=model,
            base_url=settings.OLLAMA_HOST,
            temperature=0.0,
            keep_alive="5m",
        )

    # Cloud fallback
    from langchain.chat_models import init_chat_model

    model = {
        "reasoning": "gemini-3-flash-preview",
        "coding": "claude-sonnet-4-20250514",
    }.get(task_type, settings.LLM_MODEL)

    return init_chat_model(model, temperature=0.0)
```

## Environment Configuration

```bash
# .env or shell profile
export OLLAMA_ENABLED=true
export OLLAMA_HOST=http://localhost:11434
export OLLAMA_MODEL_REASONING=deepseek-r1:70b
export OLLAMA_MODEL_CODING=qwen2.5-coder:32b
export OLLAMA_MODEL_EMBED=nomic-embed-text

# Performance tuning
export OLLAMA_NUM_CTX=32768        # Context window (32K for M4 Max)
export OLLAMA_MAX_LOADED_MODELS=3  # Max concurrent models
export OLLAMA_KEEP_ALIVE=5m        # Default keep-alive
```

## CI/CD Integration

### GitHub Actions (Self-Hosted Runner)

```yaml
jobs:
  test:
    runs-on: self-hosted  # M4 Max 256GB
    env:
      OLLAMA_ENABLED: "true"
      OLLAMA_HOST: "http://localhost:11434"
      OLLAMA_MODEL_REASONING: "deepseek-r1:70b"
      OLLAMA_MODEL_CODING: "qwen2.5-coder:32b"
      OLLAMA_MODEL_EMBED: "nomic-embed-text"

    steps:
      - name: Ensure Ollama ready
        run: |
          # Wait for Ollama service
          until curl -s http://localhost:11434/api/tags > /dev/null; do
            echo "Waiting for Ollama..."
            sleep 2
          done

          # Pre-warm embedding model
          curl -s http://localhost:11434/api/embeddings \
            -d '{"model":"nomic-embed-text","prompt":"warmup"}' > /dev/null

      - name: Run tests
        run: poetry run pytest tests/ -v
```

### Pre-Warming Strategy

Pre-warm models before first use to avoid cold start latency:

```python
async def prewarm_models():
    """Pre-warm Ollama models for faster first call."""
    import httpx

    # Warm embedding model
    await httpx.post(
        "http://localhost:11434/api/embeddings",
        json={"model": "nomic-embed-text", "prompt": "warmup"}
    )

    # Warm chat model (generates minimal response)
    await httpx.post(
        "http://localhost:11434/api/chat",
        json={
            "model": "qwen2.5-coder:32b",
            "messages": [{"role": "user", "content": "Hi"}],
            "options": {"num_predict": 1}  # Generate only 1 token
        }
    )
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "connection refused" | Ollama not running | `brew services start ollama` |
| "model not found" | Model not pulled | `ollama pull <model>` |
| Slow first request | Cold start | Use `keep_alive="5m"` and pre-warm |
| Out of memory | Model too large | Use smaller model or increase swap |
| Timeout errors | Model loading | Increase timeout, use pre-warming |

### Health Check

```python
import httpx

def check_ollama_health() -> dict:
    """Check Ollama server health."""
    try:
        response = httpx.get("http://localhost:11434/api/tags", timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            return {
                "status": "healthy",
                "models": [m["name"] for m in data.get("models", [])]
            }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

## Performance Benchmarks

Measured on M4 Max 256GB:

| Model | Tokens/sec | First Token | Memory |
|-------|-----------|-------------|--------|
| deepseek-r1:70b | 15-20 | 2-3s | ~42GB |
| qwen2.5-coder:32b | 30-40 | 1-2s | ~35GB |
| llama3.3:70b | 15-20 | 2-3s | ~40GB |
| nomic-embed-text | N/A | ~50ms | ~0.5GB |

Cold start (model not loaded): +30-60 seconds
Warm start (model in memory): ~50-200ms

## References

- [Ollama Documentation](https://ollama.ai/docs)
- [Ollama Model Library](https://ollama.ai/library)
- [LangChain-Ollama](https://python.langchain.com/docs/integrations/chat/ollama/)
- [LangChain-Ollama Embeddings](https://python.langchain.com/docs/integrations/text_embedding/ollama/)

---

**Version**: 1.0.0 (December 2025)
**Issue**: #606 - CI Cost Reduction via Local Models
