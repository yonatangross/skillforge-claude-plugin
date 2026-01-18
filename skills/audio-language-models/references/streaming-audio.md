# Real-Time Audio Streaming

Patterns for real-time speech-to-text with low latency requirements.

## Provider Comparison for Streaming

| Provider | Latency | Interim Results | Best For |
|----------|---------|-----------------|----------|
| Deepgram Nova-3 | <300ms | Yes | Lowest latency |
| AssemblyAI | ~200ms | Yes | Best accuracy |
| OpenAI (stream) | ~500ms | Limited | API simplicity |
| Google Chirp | ~400ms | Yes | Batch hybrid |

## Deepgram Real-Time Streaming

```python
import asyncio
from deepgram import DeepgramClient, LiveOptions, LiveTranscriptionEvents

async def stream_transcription_deepgram(
    audio_stream,  # Async generator of audio chunks
    on_transcript: callable
):
    """Ultra-low latency streaming with Deepgram."""
    client = DeepgramClient("YOUR_API_KEY")
    connection = client.listen.live.v("1")

    # Configure options
    options = LiveOptions(
        model="nova-3",
        language="en",
        smart_format=True,
        punctuate=True,
        interim_results=True,  # Get partial results
        utterance_end_ms=1000,  # Silence detection
        vad_events=True  # Voice activity detection
    )

    # Event handlers
    @connection.on(LiveTranscriptionEvents.Transcript)
    async def on_message(self, result, **kwargs):
        transcript = result.channel.alternatives[0].transcript
        is_final = result.is_final

        if transcript:
            await on_transcript(transcript, is_final)

    @connection.on(LiveTranscriptionEvents.Error)
    async def on_error(self, error, **kwargs):
        print(f"Error: {error}")

    # Start connection
    await connection.start(options)

    # Stream audio chunks
    async for chunk in audio_stream:
        await connection.send(chunk)

    # Signal end
    await connection.finish()
```

## AssemblyAI Real-Time

```python
import assemblyai as aai

aai.settings.api_key = "YOUR_API_KEY"

async def stream_transcription_assemblyai(
    on_transcript: callable,
    on_final: callable
):
    """Real-time streaming with speaker labels."""

    def on_data(transcript: aai.RealtimeTranscript):
        if isinstance(transcript, aai.RealtimeFinalTranscript):
            on_final(transcript.text)
        else:
            on_transcript(transcript.text)

    transcriber = aai.RealtimeTranscriber(
        sample_rate=16_000,
        on_data=on_data,
        on_error=lambda e: print(f"Error: {e}"),
        on_open=lambda session: print(f"Session: {session.session_id}")
    )

    transcriber.connect()

    # Use with microphone or audio stream
    # transcriber.stream(audio_chunk)

    transcriber.close()
```

## WebSocket Audio Streaming

```python
import asyncio
import websockets
from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws/transcribe")
async def transcribe_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time transcription."""
    await websocket.accept()

    # Initialize Deepgram connection
    dg_connection = await setup_deepgram_stream()

    try:
        while True:
            # Receive audio chunk from client
            audio_chunk = await websocket.receive_bytes()

            # Send to transcription service
            await dg_connection.send(audio_chunk)

            # Get transcript (if available)
            transcript = await get_latest_transcript()
            if transcript:
                await websocket.send_json({
                    "type": "transcript",
                    "text": transcript.text,
                    "is_final": transcript.is_final
                })

    except websockets.ConnectionClosed:
        await dg_connection.finish()
```

## Browser Audio Capture

```typescript
// Client-side: Capture and stream microphone audio
async function startAudioStream(wsUrl: string) {
  const ws = new WebSocket(wsUrl);

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true
    }
  });

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm;codecs=opus'
  });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
      ws.send(event.data);
    }
  };

  // Send chunks every 250ms for low latency
  mediaRecorder.start(250);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'transcript') {
      updateTranscriptDisplay(data.text, data.is_final);
    }
  };

  return { mediaRecorder, ws, stream };
}
```

## Audio Preprocessing for Streaming

```python
import numpy as np
from pydub import AudioSegment

def preprocess_chunk(audio_bytes: bytes, target_sample_rate: int = 16000) -> bytes:
    """Normalize and resample audio chunk for streaming."""
    # Convert bytes to AudioSegment
    audio = AudioSegment.from_raw(
        audio_bytes,
        sample_width=2,  # 16-bit
        frame_rate=48000,  # Original rate
        channels=1
    )

    # Resample to target
    audio = audio.set_frame_rate(target_sample_rate)

    # Normalize volume
    audio = audio.normalize()

    return audio.raw_data
```

## Voice Activity Detection (VAD)

```python
import webrtcvad

vad = webrtcvad.Vad(3)  # Aggressiveness 0-3

def detect_speech(audio_chunk: bytes, sample_rate: int = 16000) -> bool:
    """Detect if audio chunk contains speech."""
    # Chunk must be 10, 20, or 30ms
    frame_duration_ms = 30
    frame_size = int(sample_rate * frame_duration_ms / 1000) * 2

    # Check each frame
    for i in range(0, len(audio_chunk), frame_size):
        frame = audio_chunk[i:i + frame_size]
        if len(frame) == frame_size:
            if vad.is_speech(frame, sample_rate):
                return True

    return False
```

## Error Handling & Reconnection

```python
async def resilient_stream(audio_source, on_transcript):
    """Stream with automatic reconnection."""
    max_retries = 3
    retry_count = 0

    while retry_count < max_retries:
        try:
            await stream_transcription_deepgram(audio_source, on_transcript)
            break  # Success
        except ConnectionError as e:
            retry_count += 1
            wait_time = 2 ** retry_count  # Exponential backoff
            print(f"Connection lost, retrying in {wait_time}s...")
            await asyncio.sleep(wait_time)
        except Exception as e:
            print(f"Fatal error: {e}")
            raise
```

## Latency Optimization Tips

1. **Chunk size**: 250ms chunks balance latency vs overhead
2. **Use interim results**: Show partial transcripts immediately
3. **VAD**: Skip silent audio to reduce API calls
4. **Buffer management**: Don't buffer too much audio
5. **WebSocket**: Use binary frames, not base64
6. **Geographic routing**: Use closest API region
