---
name: audio-language-models
description: Whisper, GPT-4o-Transcribe, AssemblyAI, Deepgram patterns for speech-to-text, transcription, and TTS integration. Use when implementing audio transcription, real-time speech recognition, or text-to-speech.
context: fork
agent: multimodal-specialist
version: 1.0.0
author: SkillForge
user-invocable: false
tags: [audio, multimodal, whisper, tts, speech, transcription, stt, 2026]
---

# Audio Language Models (2026)

Integrate speech-to-text and text-to-speech capabilities using the latest audio AI models.

## When to Use

- Audio transcription (meetings, podcasts, calls)
- Real-time speech recognition
- Multi-language transcription
- Text-to-speech generation
- Voice-based AI assistants
- Audio preprocessing pipelines

## Model Comparison (January 2026)

| Model | WER | Latency | Best For |
|-------|-----|---------|----------|
| **GPT-4o-Transcribe** | ~7% | Medium | Accuracy + accents |
| **Whisper Large V3** | 7.4% | Slow | Multilingual, self-host |
| **Whisper V3 Turbo** | ~8% | 6x faster | Balance speed/accuracy |
| **AssemblyAI Universal-2** | 8.4% | 200ms | Best accuracy + features |
| **Deepgram Nova-3** | ~18% | <300ms | Lowest latency |
| **Google Chirp** | 11.6% | Batch | Best for batch processing |

## OpenAI Whisper / GPT-4o-Transcribe

```python
from openai import OpenAI

client = OpenAI()

def transcribe_audio(audio_path: str, language: str = None) -> str:
    """Transcribe audio using GPT-4o-Transcribe or Whisper."""
    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",  # or "whisper-1"
            file=audio_file,
            language=language,  # Optional: "en", "es", "fr", etc.
            response_format="verbose_json",  # text, json, srt, vtt
            timestamp_granularities=["word", "segment"]
        )
    return response

# With timestamps
def transcribe_with_timestamps(audio_path: str) -> dict:
    """Get word-level timestamps for subtitle generation."""
    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=audio_file,
            response_format="verbose_json",
            timestamp_granularities=["word"]
        )
    return {
        "text": response.text,
        "words": response.words,  # [{word, start, end}, ...]
        "duration": response.duration
    }
```

## Streaming Transcription (Real-Time)

```python
from openai import OpenAI

client = OpenAI()

async def stream_transcription(audio_path: str):
    """Stream transcription as it processes."""
    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=audio_file,
            stream=True
        )

    async for chunk in response:
        yield chunk.text
```

## AssemblyAI (Best Accuracy + Features)

```python
import assemblyai as aai

aai.settings.api_key = "YOUR_API_KEY"

def transcribe_assemblyai(audio_url: str) -> dict:
    """Transcribe with speaker diarization and sentiment."""
    config = aai.TranscriptionConfig(
        speaker_labels=True,           # Who said what
        sentiment_analysis=True,       # Sentiment per utterance
        entity_detection=True,         # Named entities
        auto_highlights=True,          # Key phrases
        language_detection=True        # Auto-detect language
    )

    transcriber = aai.Transcriber()
    transcript = transcriber.transcribe(audio_url, config=config)

    return {
        "text": transcript.text,
        "speakers": transcript.utterances,
        "sentiment": transcript.sentiment_analysis,
        "entities": transcript.entities
    }

# Real-time streaming
async def stream_assemblyai():
    """Real-time transcription with AssemblyAI."""
    transcriber = aai.RealtimeTranscriber(
        sample_rate=16_000,
        on_data=lambda data: print(data.text),
        on_error=lambda error: print(f"Error: {error}")
    )

    transcriber.connect()
    # Stream audio chunks...
    transcriber.close()
```

## Deepgram Nova-3 (Lowest Latency)

```python
from deepgram import DeepgramClient, PrerecordedOptions

def transcribe_deepgram(audio_path: str) -> dict:
    """Ultra-low latency transcription with Deepgram."""
    client = DeepgramClient("YOUR_API_KEY")

    with open(audio_path, "rb") as audio:
        options = PrerecordedOptions(
            model="nova-3",
            smart_format=True,
            diarize=True,
            punctuate=True,
            language="en"
        )

        response = client.listen.prerecorded.v("1").transcribe_file(
            {"buffer": audio.read()},
            options
        )

    return response.results.channels[0].alternatives[0]

# Streaming (sub-300ms latency)
async def stream_deepgram(audio_stream):
    """Real-time streaming with Deepgram Nova-3."""
    from deepgram import LiveOptions

    client = DeepgramClient("YOUR_API_KEY")
    connection = client.listen.live.v("1")

    options = LiveOptions(
        model="nova-3",
        language="en",
        smart_format=True,
        interim_results=True  # Get partial results
    )

    await connection.start(options)

    async for chunk in audio_stream:
        await connection.send(chunk)

    await connection.finish()
```

## Text-to-Speech (TTS)

### OpenAI TTS

```python
from openai import OpenAI
from pathlib import Path

client = OpenAI()

def generate_speech(text: str, voice: str = "alloy") -> bytes:
    """Generate speech from text using OpenAI TTS.

    Voices: alloy, echo, fable, onyx, nova, shimmer
    """
    response = client.audio.speech.create(
        model="tts-1-hd",  # or "tts-1" for faster/cheaper
        voice=voice,
        input=text,
        response_format="mp3"  # mp3, opus, aac, flac
    )
    return response.content

# Stream TTS for long content
async def stream_speech(text: str):
    """Stream TTS audio for immediate playback."""
    response = client.audio.speech.create(
        model="tts-1",
        voice="nova",
        input=text
    )

    for chunk in response.iter_bytes(chunk_size=4096):
        yield chunk
```

### ElevenLabs (Premium Quality)

```python
from elevenlabs import generate, Voice, VoiceSettings

def generate_elevenlabs(text: str, voice_id: str) -> bytes:
    """High-quality TTS with ElevenLabs."""
    audio = generate(
        text=text,
        voice=Voice(
            voice_id=voice_id,
            settings=VoiceSettings(
                stability=0.5,
                similarity_boost=0.8
            )
        ),
        model="eleven_turbo_v2_5"
    )
    return audio
```

## Audio Preprocessing

```python
from pydub import AudioSegment
import tempfile

def preprocess_audio(audio_path: str) -> str:
    """Prepare audio for optimal transcription."""
    audio = AudioSegment.from_file(audio_path)

    # Convert to mono, 16kHz (optimal for most APIs)
    audio = audio.set_channels(1)
    audio = audio.set_frame_rate(16000)

    # Normalize volume
    audio = audio.normalize()

    # Export as WAV
    temp_path = tempfile.mktemp(suffix=".wav")
    audio.export(temp_path, format="wav")

    return temp_path

def chunk_long_audio(audio_path: str, chunk_seconds: int = 300) -> list[str]:
    """Split long audio for API limits (25MB max)."""
    audio = AudioSegment.from_file(audio_path)
    chunks = []

    chunk_ms = chunk_seconds * 1000
    for i in range(0, len(audio), chunk_ms):
        chunk = audio[i:i + chunk_ms]
        chunk_path = tempfile.mktemp(suffix=".wav")
        chunk.export(chunk_path, format="wav")
        chunks.append(chunk_path)

    return chunks
```

## Handling Long Audio

```python
async def transcribe_long_audio(audio_path: str) -> str:
    """Transcribe audio longer than 25MB limit."""
    chunks = chunk_long_audio(audio_path, chunk_seconds=300)
    transcripts = []

    previous_text = ""
    for chunk_path in chunks:
        # Use previous transcript as prompt for context
        with open(chunk_path, "rb") as audio:
            response = client.audio.transcriptions.create(
                model="gpt-4o-transcribe",
                file=audio,
                prompt=previous_text[-224:]  # Last 224 tokens
            )

        transcripts.append(response.text)
        previous_text = response.text

    return " ".join(transcripts)
```

## API Limits & Pricing (2026)

| Provider | File Limit | Pricing | Features |
|----------|-----------|---------|----------|
| OpenAI Whisper | 25MB | $0.006/min | Basic |
| GPT-4o-Transcribe | 25MB | $0.01/min | Enhanced accuracy |
| AssemblyAI | 5GB | ~$0.15/hr | Diarization, sentiment |
| Deepgram | 2GB | ~$0.0043/min | Fastest latency |

## Key Decisions

| Scenario | Recommendation |
|----------|----------------|
| Highest accuracy | AssemblyAI Universal-2 |
| Real-time/live | Deepgram Nova-3 (<300ms) |
| Cost-sensitive | Whisper self-hosted |
| Multilingual | Whisper Large V3 (99+ langs) |
| Speaker identification | AssemblyAI (best diarization) |

## Common Mistakes

- Not preprocessing audio (sample rate, channels)
- Ignoring file size limits (chunk long audio)
- Missing timestamps for subtitles
- Not using prompts for context continuity
- Skipping language parameter (hurts non-English)
- Using sync API for real-time (use streaming)

## Supported Formats

```
Supported: mp3, mp4, mpeg, mpga, m4a, wav, webm
Optimal: WAV 16kHz mono (best accuracy)
Avoid: Highly compressed formats for important content
```

## Related Skills

- `vision-language-models` - Image/video processing
- `multimodal-rag` - Audio + text retrieval
- `streaming-api-patterns` - SSE for real-time

## Capability Details

### transcription
**Keywords:** transcribe, speech-to-text, STT, convert audio
**Solves:**
- Convert audio files to text
- Generate meeting transcripts
- Process podcast audio

### real-time-stt
**Keywords:** real-time, live transcription, streaming audio
**Solves:**
- Live transcription during calls
- Voice assistants
- Real-time captioning

### speaker-diarization
**Keywords:** speaker, diarization, who said, identify speaker
**Solves:**
- Identify different speakers
- Generate speaker-labeled transcripts
- Meeting participant tracking

### text-to-speech
**Keywords:** TTS, speech synthesis, voice, speak text
**Solves:**
- Convert text to natural speech
- Generate voiceovers
- Accessibility audio

### audio-preprocessing
**Keywords:** preprocess, normalize, convert audio, chunk
**Solves:**
- Prepare audio for transcription
- Handle long recordings
- Optimize audio quality
