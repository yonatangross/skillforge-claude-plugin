# Text-to-Speech (TTS) Patterns

Implementing high-quality speech synthesis using OpenAI TTS, ElevenLabs, and other providers.

## Provider Comparison (2026)

| Provider | Voices | Quality | Latency | Price |
|----------|--------|---------|---------|-------|
| OpenAI TTS-1 | 6 | Good | Fast | $15/1M chars |
| OpenAI TTS-1-HD | 6 | Excellent | Medium | $30/1M chars |
| ElevenLabs | 1000+ | Best | Medium | $0.30/1K chars |
| Google Cloud TTS | 220+ | Excellent | Fast | $16/1M chars |
| Amazon Polly | 60+ | Good | Fast | $4/1M chars |

## OpenAI TTS

```python
from openai import OpenAI
from pathlib import Path

client = OpenAI()

def text_to_speech(
    text: str,
    voice: str = "alloy",
    model: str = "tts-1-hd",
    output_format: str = "mp3"
) -> bytes:
    """Generate speech from text.

    Voices: alloy, echo, fable, onyx, nova, shimmer
    Models: tts-1 (fast), tts-1-hd (quality)
    Formats: mp3, opus, aac, flac, wav, pcm
    """
    response = client.audio.speech.create(
        model=model,
        voice=voice,
        input=text,
        response_format=output_format
    )

    return response.content

def save_speech(text: str, output_path: str, **kwargs):
    """Generate and save speech to file."""
    audio = text_to_speech(text, **kwargs)
    Path(output_path).write_bytes(audio)
    return output_path
```

## Streaming TTS

```python
async def stream_speech(text: str, voice: str = "nova"):
    """Stream audio for immediate playback."""
    response = client.audio.speech.create(
        model="tts-1",  # Faster for streaming
        voice=voice,
        input=text
    )

    for chunk in response.iter_bytes(chunk_size=4096):
        yield chunk

# FastAPI streaming endpoint
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.post("/api/tts/stream")
async def tts_endpoint(text: str, voice: str = "nova"):
    """Stream TTS audio to client."""
    return StreamingResponse(
        stream_speech(text, voice),
        media_type="audio/mpeg"
    )
```

## ElevenLabs (Premium Quality)

```python
from elevenlabs import generate, Voice, VoiceSettings, set_api_key

set_api_key("YOUR_API_KEY")

def elevenlabs_tts(
    text: str,
    voice_id: str = "21m00Tcm4TlvDq8ikWAM",  # Rachel
    stability: float = 0.5,
    similarity_boost: float = 0.8
) -> bytes:
    """High-quality TTS with ElevenLabs."""
    audio = generate(
        text=text,
        voice=Voice(
            voice_id=voice_id,
            settings=VoiceSettings(
                stability=stability,
                similarity_boost=similarity_boost,
                style=0.0,
                use_speaker_boost=True
            )
        ),
        model="eleven_turbo_v2_5"  # or eleven_multilingual_v2
    )

    return audio

# Clone a voice
def clone_voice(name: str, audio_files: list[str]) -> str:
    """Create custom voice from samples."""
    from elevenlabs import clone

    voice = clone(
        name=name,
        files=audio_files,  # 1-25 audio files
        description="Custom cloned voice"
    )

    return voice.voice_id
```

## Long-Form Audio Generation

```python
def generate_audiobook_chapter(
    text: str,
    voice: str = "onyx",
    max_chars_per_chunk: int = 4000
) -> bytes:
    """Generate audio for long text with proper chunking."""
    import re
    from io import BytesIO
    from pydub import AudioSegment

    # Split at sentence boundaries
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_chunk = ""

    for sentence in sentences:
        if len(current_chunk) + len(sentence) < max_chars_per_chunk:
            current_chunk += sentence + " "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + " "

    if current_chunk:
        chunks.append(current_chunk.strip())

    # Generate audio for each chunk
    audio_segments = []
    for chunk in chunks:
        audio_bytes = text_to_speech(chunk, voice=voice, model="tts-1-hd")
        segment = AudioSegment.from_mp3(BytesIO(audio_bytes))
        audio_segments.append(segment)

    # Concatenate with small pause between chunks
    silence = AudioSegment.silent(duration=300)  # 300ms
    combined = audio_segments[0]
    for segment in audio_segments[1:]:
        combined += silence + segment

    # Export
    output = BytesIO()
    combined.export(output, format="mp3")
    return output.getvalue()
```

## SSML Support (Speech Synthesis Markup)

```python
def generate_with_ssml(ssml_text: str) -> bytes:
    """Generate speech with SSML controls (Google/Amazon)."""
    from google.cloud import texttospeech

    client = texttospeech.TextToSpeechClient()

    input_text = texttospeech.SynthesisInput(ssml=ssml_text)

    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Neural2-J"
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    response = client.synthesize_speech(
        input=input_text,
        voice=voice,
        audio_config=audio_config
    )

    return response.audio_content

# Example SSML
ssml = """
<speak>
    <prosody rate="slow" pitch="+2st">
        Welcome to our podcast.
    </prosody>
    <break time="500ms"/>
    Today we'll discuss <emphasis level="strong">AI</emphasis>.
</speak>
"""
```

## Voice Selection Guide

### OpenAI Voices
| Voice | Style | Best For |
|-------|-------|----------|
| alloy | Neutral | General purpose |
| echo | Male, warm | Narration |
| fable | Animated | Storytelling |
| onyx | Male, deep | Audiobooks |
| nova | Female, warm | Assistants |
| shimmer | Female, clear | Educational |

## Cost Optimization

```python
def estimate_tts_cost(
    text: str,
    provider: str = "openai",
    model: str = "tts-1"
) -> float:
    """Estimate TTS cost before generation."""
    char_count = len(text)

    pricing = {
        "openai": {"tts-1": 15, "tts-1-hd": 30},  # per 1M chars
        "elevenlabs": {"standard": 300, "turbo": 180},  # per 1M chars
        "google": {"standard": 4, "neural": 16},
        "amazon": {"standard": 4, "neural": 16}
    }

    rate = pricing.get(provider, {}).get(model, 15)
    cost = (char_count / 1_000_000) * rate

    return round(cost, 4)
```

## Best Practices

1. **Chunk long text**: Stay under 4096 chars per request
2. **Match voice to content**: Formal for business, warm for conversational
3. **Use HD for final output**: tts-1 for drafts, tts-1-hd for production
4. **Cache generated audio**: Don't regenerate unchanged content
5. **Handle special characters**: Clean text before synthesis
6. **Add pauses**: Natural breaks improve listenability
