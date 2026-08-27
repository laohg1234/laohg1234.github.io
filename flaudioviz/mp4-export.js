// Offline, deterministic video export via WebCodecs and Mediabunny.
//
// Every visual frame is rendered on an exact frameIndex / fps timestamp grid.
// Encoded container writes are awaited so storage backpressure reaches the
// renderer. Audio and spectrum analysis operate in bounded windows instead of
// making full-song PCM copies.

// Keep the muxer beside the static app so MP4 export does not depend on a CDN
// or send the user's audio anywhere.
const MEDIABUNNY_URL = "./mediabunny.bundle.mjs";

const AUDIO_TARGET_RATE = 48000;
const AUDIO_CHUNK_SECONDS = 0.5;
const MAX_EXPORT_FRAME_BUDGET = 1_000_000;
const AUDIO_LEAD_SECONDS = 0.5;
const STREAM_CHUNK_BYTES = 1024 * 1024;
const KEYFRAME_INTERVAL_SECONDS = 2;

// AnalyserNode defaults (the preview never overrides them).
const ANALYSER_MIN_DB = -100;
const ANALYSER_MAX_DB = -30;
const ANALYSER_SMOOTHING = 0.8;
const ANALYSER_REFERENCE_HZ = 60;

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function isWebCodecsExportSupported() {
  return typeof window !== "undefined"
    && "VideoEncoder" in window
    && "AudioEncoder" in window
    && "VideoFrame" in window
    && typeof window.AudioBuffer === "function";
}

function codedError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

export function abortError(message = "Export cancelled") {
  const err = new Error(message);
  err.name = "AbortError";
  return err;
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError();
}

function createUiYield() {
  const channel = new MessageChannel();
  let pending = null;
  channel.port1.onmessage = () => {
    const resolve = pending;
    pending = null;
    if (resolve) resolve();
  };
  return () => new Promise((resolve) => {
    pending = resolve;
    channel.port2.postMessage(0);
  });
}

// ---- deterministic AnalyserNode emulation ----------------------------------

function createFft(n) {
  const levels = Math.round(Math.log2(n));
  if (1 << levels !== n) throw new Error("fftSize must be a power of two");
  const rev = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    let x = i;
    let r = 0;
    for (let b = 0; b < levels; b++) {
      r = (r << 1) | (x & 1);
      x >>= 1;
    }
    rev[i] = r;
  }
  const cosTable = new Float32Array(n / 2);
  const sinTable = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    cosTable[i] = Math.cos((2 * Math.PI * i) / n);
    sinTable[i] = Math.sin((2 * Math.PI * i) / n);
  }
  return function fft(re, im) {
    for (let i = 0; i < n; i++) {
      const j = rev[i];
      if (j > i) {
        let tmp = re[i]; re[i] = re[j]; re[j] = tmp;
        tmp = im[i]; im[i] = im[j]; im[j] = tmp;
      }
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = i, k = 0; j < i + half; j++, k += step) {
          const l = j + half;
          const wr = cosTable[k];
          const wi = sinTable[k];
          const tre = re[l] * wr + im[l] * wi;
          const tim = im[l] * wr - re[l] * wi;
          re[l] = re[j] - tre;
          im[l] = im[j] - tim;
          re[j] += tre;
          im[j] += tim;
        }
      }
    }
  };
}

// Reads the decoded source channels directly into a reusable FFT window. This
// avoids allocating a second, full-duration mono copy of the song.
export function createSpectrumSource(audioBuffer, fftSize, fps) {
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const channels = Math.max(1, audioBuffer.numberOfChannels);
  const channelData = [];
  for (let c = 0; c < channels; c++) channelData.push(audioBuffer.getChannelData(c));

  const win = new Float32Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    const phase = (2 * Math.PI * i) / fftSize;
    win[i] = 0.42 - 0.5 * Math.cos(phase) + 0.08 * Math.cos(2 * phase);
  }

  const fft = createFft(fftSize);
  const re = new Float32Array(fftSize);
  const im = new Float32Array(fftSize);
  const binCount = fftSize / 2;
  const smooth = new Float32Array(binCount);
  const tau = Math.pow(ANALYSER_SMOOTHING, ANALYSER_REFERENCE_HZ / Math.max(1, fps));
  const norm = 1 / fftSize;
  const channelScale = 1 / channels;
  const byteScale = 255 / (ANALYSER_MAX_DB - ANALYSER_MIN_DB);

  return {
    binCount,
    compute(timeSeconds, out) {
      const end = clamp(Math.floor(timeSeconds * sampleRate), 0, length);
      const start = end - fftSize;
      for (let i = 0; i < fftSize; i++) {
        const idx = start + i;
        let sample = 0;
        if (idx >= 0 && idx < length) {
          for (let c = 0; c < channels; c++) sample += channelData[c][idx];
          sample *= channelScale;
        }
        re[i] = sample * win[i];
        im[i] = 0;
      }
      fft(re, im);
      for (let k = 0; k < binCount; k++) {
        const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) * norm;
        const smoothed = tau * smooth[k] + (1 - tau) * mag;
        smooth[k] = smoothed;
        const db = 20 * Math.log10(smoothed + 1e-40);
        out[k] = clamp(Math.floor((db - ANALYSER_MIN_DB) * byteScale), 0, 255);
      }
      return out;
    },
  };
}

function createAudioChunk(audioBuffer, startFrame, frameCount, channelCount) {
  const chunk = new AudioBuffer({
    length: frameCount,
    numberOfChannels: channelCount,
    sampleRate: audioBuffer.sampleRate,
  });
  for (let c = 0; c < channelCount; c++) {
    chunk.copyToChannel(
      audioBuffer.getChannelData(c).subarray(startFrame, startFrame + frameCount),
      c,
    );
  }
  return chunk;
}

export function codecPreferences() {
  return { video: ["avc"], audio: "aac" };
}

async function chooseCodecs(mediabunny, width, height, fps, videoBitrate, audioBitrate, channels) {
  const preferences = codecPreferences();
  let videoCodec = null;
  for (const codec of preferences.video) {
    try {
      const supported = await mediabunny.canEncodeVideo(codec, {
        width,
        height,
        bitrate: videoBitrate,
        frameRate: fps,
      });
      if (supported) {
        videoCodec = codec;
        break;
      }
    } catch {
      // Try the next MP4-compatible codec.
    }
  }
  if (!videoCodec) {
    throw codedError("webcodecs-no-video-codec", "No supported MP4 video encoder.");
  }

  let audioSupported = false;
  try {
    audioSupported = await mediabunny.canEncodeAudio(preferences.audio, {
      numberOfChannels: channels,
      sampleRate: AUDIO_TARGET_RATE,
      bitrate: audioBitrate,
    });
  } catch {
    audioSupported = false;
  }
  if (!audioSupported) {
    throw codedError("webcodecs-no-audio-codec", "No supported MP4 audio encoder.");
  }
  return { videoCodec, audioCodec: preferences.audio };
}

function packetSize(packet) {
  return Number(packet?.byteLength || packet?.data?.byteLength || 0);
}

// options:
//   width, height, fps
//   videoBitsPerSecond, audioKbps
//   audioBuffer    decoded AudioBuffer (source of both track audio and FFT)
//   duration       seconds
//   fftSize        AnalyserNode-compatible power of two
//   drawFrame      (ctx, canvas, timeSeconds, freqData: Uint8Array) => void
//   canvas         optional canvas element to render into
//   writable       WritableStream accepting positioned StreamTarget chunks
//   metadata       descriptive container tags written before muxing starts
//   onProgress     (ratio 0..1, secondsRemaining) => void
//   signal         AbortSignal; aborting throws AbortError and cancels the mux
// Returns { blob | null, ...stats }. Streamed targets return no Blob.
export async function renderWithWebCodecs(options) {
  const {
    width, height, fps,
    videoBitsPerSecond, audioKbps,
    audioBuffer, duration, fftSize,
    drawFrame, canvas: providedCanvas = null,
    writable = null, metadata = null,
    onProgress = null, signal = null,
  } = options;
  const intendedFrames = Math.ceil(duration * fps);
  if (!Number.isFinite(fps) || fps < 1 || !Number.isSafeInteger(intendedFrames)
    || intendedFrames < 1 || intendedFrames > MAX_EXPORT_FRAME_BUDGET) {
    throw codedError("export-frame-budget", "The requested frame rate or total frame count is not executable.");
  }
  const startedAt = performance.now();
  throwIfAborted(signal);
  const mediabunny = await import(/* @vite-ignore */ MEDIABUNNY_URL);
  throwIfAborted(signal);
  const numberOfChannels = Math.min(2, Math.max(1, audioBuffer.numberOfChannels));
  const audioBitrate = Math.round(clamp(audioKbps, 96, 320) * 1000);
  const videoBitrate = Math.max(100_000, Math.round(videoBitsPerSecond));
  const codecs = await chooseCodecs(
    mediabunny,
    width,
    height,
    fps,
    videoBitrate,
    audioBitrate,
    numberOfChannels,
  );

  const target = writable
    ? new mediabunny.StreamTarget(writable, { chunked: true, chunkSize: STREAM_CHUNK_BYTES })
    : new mediabunny.BufferTarget();
  const output = new mediabunny.Output({
    format: new mediabunny.Mp4OutputFormat({ fastStart: false, metadataFormat: "mdir" }),
    target,
  });

  const stats = {
    intendedFrames,
    drawnFrames: 0,
    totalDrawMs: 0,
    maxDrawMs: 0,
    chunkCount: 0,
    chunkBytes: 0,
    videoBytes: 0,
    videoCodec: codecs.videoCodec,
    audioCodec: codecs.audioCodec,
    elapsedMs: 0,
    videoBitsPerSecond: 0,
  };

  let configuredVideoCodec = codecs.videoCodec;
  const canvas = providedCanvas || document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const videoSource = new mediabunny.CanvasSource(
    canvas,
    {
      codec: codecs.videoCodec,
      bitrate: videoBitrate,
      keyFrameInterval: KEYFRAME_INTERVAL_SECONDS,
      latencyMode: "quality",
      onEncodedPacket(packet) {
        const bytes = packetSize(packet);
        stats.chunkCount += 1;
        stats.chunkBytes += bytes;
        stats.videoBytes += bytes;
      },
      onEncoderConfig(config) {
        if (config?.codec) configuredVideoCodec = config.codec;
      },
    },
  );
  const ctx = canvas.getContext("2d", { alpha: false });

  const audioSource = new mediabunny.AudioBufferSource({
    codec: codecs.audioCodec,
    bitrate: audioBitrate,
    transform: {
      numberOfChannels,
      sampleRate: AUDIO_TARGET_RATE,
    },
    onEncodedPacket(packet) {
      stats.chunkCount += 1;
      stats.chunkBytes += packetSize(packet);
    },
  });
  output.addVideoTrack(videoSource, { frameRate: fps });
  output.addAudioTrack(audioSource);
  if (metadata) output.setMetadataTags(metadata);

  const spectrum = createSpectrumSource(audioBuffer, fftSize, fps);
  const freqData = new Uint8Array(spectrum.binCount);
  const audioChunkFrames = Math.max(1, Math.round(audioBuffer.sampleRate * AUDIO_CHUNK_SECONDS));
  const audioEndFrame = Math.min(audioBuffer.length, Math.ceil(duration * audioBuffer.sampleRate));
  let audioCursor = 0;
  const feedAudio = async (untilSeconds) => {
    const untilFrame = Math.min(audioEndFrame, Math.ceil(untilSeconds * audioBuffer.sampleRate));
    while (audioCursor < untilFrame) {
      const frameCount = Math.min(audioChunkFrames, audioEndFrame - audioCursor);
      const chunk = createAudioChunk(
        audioBuffer,
        audioCursor,
        frameCount,
        Math.max(1, audioBuffer.numberOfChannels),
      );
      await audioSource.add(chunk);
      audioCursor += frameCount;
    }
  };

  const uiYield = createUiYield();
  const frameDuration = 1 / fps;
  let finalized = false;
  try {
    await output.start();
    for (let i = 0; i < stats.intendedFrames; i++) {
      // Checked once per frame: the loop already yields to the UI at the end of
      // every iteration, so this bounds cancellation latency to one frame plus
      // the muxer's unwind rather than the whole remaining render.
      throwIfAborted(signal);
      const t = Math.min(duration, i / fps);
      spectrum.compute(t, freqData);
      const drawStart = performance.now();
      drawFrame(ctx, canvas, t, freqData);
      const drawMs = performance.now() - drawStart;
      stats.drawnFrames += 1;
      stats.totalDrawMs += drawMs;
      if (drawMs > stats.maxDrawMs) stats.maxDrawMs = drawMs;

      await feedAudio(t + AUDIO_LEAD_SECONDS);
      await videoSource.add(t, frameDuration, { keyFrame: i === 0 });

      if (onProgress) {
        const done = i + 1;
        const elapsed = (performance.now() - startedAt) / 1000;
        const secondsLeft = done > 4 ? (elapsed / done) * (stats.intendedFrames - done) : NaN;
        onProgress((done / stats.intendedFrames) * 0.97, secondsLeft);
      }
      await uiYield();
    }

    // Last chance to bail: once finalize() starts writing the container index
    // the output is committed, so no abort check runs past this point.
    throwIfAborted(signal);
    await feedAudio(Infinity);
    await output.finalize();
    finalized = true;
    if (onProgress) onProgress(1, 0);
  } finally {
    if (!finalized && output.state !== "canceled" && output.state !== "finalized") {
      try { await output.cancel(); } catch { /* Preserve the original export error. */ }
    }
  }

  stats.elapsedMs = performance.now() - startedAt;
  stats.videoCodec = configuredVideoCodec;
  stats.videoBitsPerSecond = duration > 0 ? Math.round((stats.videoBytes * 8) / duration) : 0;
  return {
    blob: writable ? null : new Blob([target.buffer], { type: "video/mp4" }),
    ...stats,
  };
}

