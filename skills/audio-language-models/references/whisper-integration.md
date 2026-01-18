# Whisper Integration Patterns

Comprehensive guide to integrating OpenAI Whisper and GPT-4o-Transcribe for audio transcription.

## Model Comparison (2026)

| Model | WER | Speed | Cost | Best For |
|-------|-----|-------|------|----------|
| GPT-4o-Transcribe | ~7% | Medium | $0.01/min | Accuracy, accents |
| Whisper-1 (V2) | 7.4% | Medium | $0.006/min | API simplicity |
| Whisper Large V3 | 7.4% | Slow | Self-host | Multilingual |
| Whisper V3 Turbo | ~8% | 6x faster | Self-host | Speed + quality |
| Distil-Whisper | ~8% | 6x faster | Self-host | Compact deployment |

## Basic Transcription

```python
from openai import OpenAI

client = OpenAI()

def transcribe_file(audio_path: str, language: str = None) -> str:
    """Basic transcription with OpenAI."""
    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",  # or "whisper-1"
            file=audio_file,
            language=language,  # ISO 639-1 code: "en", "es", "ja"
            response_format="text"
        )
    return response
```

## Detailed Transcription with Timestamps

```python
def transcribe_with_timestamps(audio_path: str) -> dict:
    """Get word-level timestamps for subtitles/captions."""
    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=audio_file,
            response_format="verbose_json",
            timestamp_granularities=["word", "segment"]
        )

    return {
        "text": response.text,
        "words": response.words,  # [{word, start, end}, ...]
        "segments": response.segments,  # [{text, start, end}, ...]
        "duration": response.duration,
        "language": response.language
    }
```

## Generate SRT Subtitles

```python
def generate_srt(audio_path: str) -> str:
    """Generate SRT subtitle file from audio."""
    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="srt"
        )
    return response  # Returns SRT formatted string
```

## Prompting for Better Results

```python
def transcribe_with_context(
    audio_path: str,
    context_prompt: str = None,
    vocabulary: list[str] = None
) -> str:
    """Use prompts to improve transcription accuracy."""
    # Build prompt with vocabulary hints
    prompt = ""

    if vocabulary:
        # Include technical terms, names, acronyms
        prompt = "Vocabulary: " + ", ".join(vocabulary) + ". "

    if context_prompt:
        prompt += context_prompt

    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=audio_file,
            prompt=prompt  # Max 224 tokens for whisper-1
        )

    return response.text

# Example usage
transcript = transcribe_with_context(
    "meeting.mp3",
    vocabulary=["LangGraph", "RAG", "GPT-5", "CLIP"],
    context_prompt="Technical meeting about AI development."
)
```

## Handling Long Audio Files

```python
from pydub import AudioSegment
import tempfile
import os

def transcribe_long_audio(
    audio_path: str,
    chunk_seconds: int = 600,  # 10 minutes
    overlap_seconds: int = 10
) -> str:
    """Transcribe audio longer than 25MB limit."""
    audio = AudioSegment.from_file(audio_path)
    chunks = []

    chunk_ms = chunk_seconds * 1000
    overlap_ms = overlap_seconds * 1000

    # Split with overlap for context continuity
    for i in range(0, len(audio), chunk_ms - overlap_ms):
        chunk = audio[i:i + chunk_ms]
        chunk_path = tempfile.mktemp(suffix=".wav")
        chunk.export(chunk_path, format="wav")
        chunks.append(chunk_path)

    # Transcribe with context chaining
    transcripts = []
    previous_text = ""

    for chunk_path in chunks:
        with open(chunk_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="gpt-4o-transcribe",
                file=audio_file,
                prompt=previous_text[-224:]  # Use end of previous
            )

        transcripts.append(response.text)
        previous_text = response.text

        os.remove(chunk_path)  # Cleanup

    return " ".join(transcripts)
```

## Self-Hosted Whisper

```python
import whisper
import torch

# Load model (runs on GPU if available)
model = whisper.load_model("large-v3")  # or "turbo" for speed

def transcribe_local(audio_path: str) -> dict:
    """Transcribe using local Whisper model."""
    result = model.transcribe(
        audio_path,
        language="en",  # or None for auto-detect
        task="transcribe",  # or "translate" for English output
        word_timestamps=True,
        verbose=False
    )

    return {
        "text": result["text"],
        "segments": result["segments"],
        "language": result["language"]
    }

# For faster inference with V3 Turbo
def transcribe_turbo(audio_path: str) -> str:
    """6x faster with minimal quality loss."""
    model = whisper.load_model("turbo")
    result = model.transcribe(audio_path)
    return result["text"]
```

## Language Detection

```python
def detect_and_transcribe(audio_path: str) -> dict:
    """Auto-detect language and transcribe."""
    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=audio_file,
            response_format="verbose_json"
            # No language parameter = auto-detect
        )

    return {
        "detected_language": response.language,
        "text": response.text
    }
```

## Supported Audio Formats

```
Supported: mp3, mp4, mpeg, mpga, m4a, wav, webm
Optimal: WAV 16kHz mono (best accuracy)
Max size: 25MB per file
```

## Common Pitfalls

1. **Not preprocessing**: Always convert to 16kHz mono WAV
2. **Ignoring prompts**: Use vocabulary for technical terms
3. **No chunking**: Split files >25MB
4. **Missing context**: Chain prompts for long audio
5. **Wrong model**: Use GPT-4o-Transcribe for accents/noise
