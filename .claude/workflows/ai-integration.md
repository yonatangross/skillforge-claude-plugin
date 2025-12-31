# Workflow: AI Integration

> **Composed Workflow** - Add LLM/AI capabilities with streaming, observability, and cost optimization
> Token Budget: ~1000 (vs ~3500 loading full skills separately)

## Overview

This workflow adds AI/LLM capabilities to your application, including streaming responses, proper observability, and cost management. It composes patterns from AI-native development, streaming, and observability skills.

## When to Use

Trigger this workflow when:
- Adding AI chat or Q&A features
- Integrating LLM APIs (OpenAI, Anthropic, etc.)
- Building RAG pipelines
- Need streaming AI responses
- Setting up AI observability

## Composed From

```yaml
skills:
  ai-native-development:
    load: references/function-calling.md, references/observability.md
    tokens: ~350
    provides: LLM integration patterns, cost tracking

  streaming-api-patterns:
    load: SKILL.md#sse, SKILL.md#llm-streaming
    tokens: ~200
    provides: SSE streaming for AI responses

  observability-monitoring:
    load: SKILL.md#structured-logging
    tokens: ~150
    provides: Logging patterns for AI calls

  security-checklist:
    load: SKILL.md#input-validation
    tokens: ~100
    provides: Prompt injection prevention
```

## Workflow Steps

### Step 1: Set Up LLM Client

```python
# backend/app/services/llm/client.py
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
import os
from typing import AsyncIterator, Literal

LLMProvider = Literal["anthropic", "openai"]

class LLMClient:
    def __init__(self, provider: LLMProvider = "anthropic"):
        self.provider = provider
        if provider == "anthropic":
            self.client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        else:
            self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def stream_chat(
        self,
        messages: list[dict],
        model: str = "claude-sonnet-4-20250514",
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        """Stream chat completion tokens."""
        if self.provider == "anthropic":
            async with self.client.messages.stream(
                model=model,
                max_tokens=max_tokens,
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        else:
            stream = await self.client.chat.completions.create(
                model=model or "gpt-4o",
                messages=messages,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
```

**Use MCP:**
```
mcp__context7__get-library-docs(/anthropics/anthropic-sdk-python, topic="streaming")
```

---

### Step 2: Create SSE Streaming Endpoint

```python
# backend/app/api/v1/chat.py
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None

@router.post("/stream")
async def stream_chat(request: Request, body: ChatRequest):
    """Stream AI response using Server-Sent Events."""

    async def event_stream():
        llm = LLMClient()
        messages = [{"role": "user", "content": body.message}]

        try:
            async for token in llm.stream_chat(messages):
                # SSE format: data: {json}\n\n
                yield f"data: {json.dumps({'token': token})}\n\n"
                await asyncio.sleep(0)  # Allow other tasks

            yield f"data: {json.dumps({'done': True})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
```

---

### Step 3: Add Frontend Streaming Consumer

```tsx
// frontend/src/features/chat/useStreamingChat.ts
import { useState, useCallback } from 'react';

interface StreamingState {
  response: string;
  isStreaming: boolean;
  error: string | null;
}

export function useStreamingChat() {
  const [state, setState] = useState<StreamingState>({
    response: '',
    isStreaming: false,
    error: null,
  });

  const sendMessage = useCallback(async (message: string) => {
    setState({ response: '', isStreaming: true, error: null });

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error('Failed to start chat');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              setState(prev => ({
                ...prev,
                response: prev.response + data.token,
              }));
            } else if (data.done) {
              setState(prev => ({ ...prev, isStreaming: false }));
            } else if (data.error) {
              setState(prev => ({
                ...prev,
                isStreaming: false,
                error: data.error,
              }));
            }
          }
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  return { ...state, sendMessage };
}
```

---

### Step 4: Add Observability

```python
# backend/app/services/llm/tracing.py
from langfuse.decorators import observe, langfuse_context
from langfuse import Langfuse
import structlog

logger = structlog.get_logger()
langfuse = Langfuse()

@observe()
async def traced_chat(messages: list[dict], **kwargs):
    """Traced LLM call with automatic Langfuse logging."""
    logger.info(
        "llm_request",
        model=kwargs.get("model"),
        message_count=len(messages),
    )

    try:
        response = await llm_client.stream_chat(messages, **kwargs)
        return response
    except Exception as e:
        logger.error("llm_error", error=str(e))
        raise
```

**Use MCP:**
```
mcp__skillforge-langfuse__get_traces(project_name="chat")
```

---

### Step 5: Input Validation (Security)

```python
# backend/app/services/llm/validation.py
import re
from pydantic import BaseModel, field_validator

class ChatInput(BaseModel):
    message: str

    @field_validator('message')
    @classmethod
    def validate_message(cls, v: str) -> str:
        # Length limits
        if len(v) > 10000:
            raise ValueError("Message too long (max 10000 chars)")

        # Basic prompt injection detection
        injection_patterns = [
            r"ignore.*previous.*instructions",
            r"forget.*everything",
            r"system.*prompt",
            r"<\|.*\|>",  # Special tokens
        ]

        for pattern in injection_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError("Invalid message content")

        return v
```

---

## Validation Checklist

- [ ] LLM client configured with API keys from env
- [ ] SSE streaming endpoint working
- [ ] Frontend consumes stream correctly
- [ ] Error handling on both sides
- [ ] Input validation for prompt injection
- [ ] Observability/tracing configured
- [ ] Rate limiting on chat endpoint
- [ ] Token usage tracking for costs

---

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `context7` | Anthropic/OpenAI SDK docs |
| `skillforge-langfuse` | View traces, monitor costs |
| `mcp-find` | Discover additional AI testing tools |

---

**Estimated Tokens:** 1000
**Traditional Approach:** 3500+ (loading 4 full skills)
**Savings:** 71%
