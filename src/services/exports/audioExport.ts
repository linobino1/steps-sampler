import { loaded, Offline, Volume } from "tone";
import useToneStore from "../../store/store.ts";
import InstrumentsService from "../core/instruments.ts";
import {
  configureTransport,
  schedulePlaybackPlan,
} from "../transport/sequencer.ts";
import TriggersService from "../transport/triggers.ts";

export type AudioFormat = "mp3" | "wav";

export async function recordAudio(
  format: AudioFormat = "wav",
  repetitions = 1,
) {
  await loaded();

  const state = useToneStore.getState();
  const plan = TriggersService.createPlaybackPlan(state);
  const repetitionCount = Math.max(1, Math.min(99, Math.floor(repetitions)));
  const duration = plan.measures * repetitionCount *
    parseInt(state.signature) * 60 / state.bpm;

  const rendered = await Offline(
    async ({ transport }) => {
      configureTransport(transport, state);

      const output = new Volume(0).toDestination();
      const instruments = InstrumentsService.createInstrumentGraph(output);
      InstrumentsService.syncParams(state.instrumentParams, instruments);
      InstrumentsService.syncTrackSettings(
        state.trackSettings,
        state.activeTracks,
        instruments,
      );

      if (state.playbackSample >= 0) {
        const player = InstrumentsService.createPlaybackPlayer(
          state.playbackSample,
          output,
        );
        if (player) {
          for (let repetition = 0; repetition < repetitionCount; repetition++) {
            transport.schedule(
              (time) => player.start(time),
              `${repetition * plan.measures}:0:0`,
            );
          }
        }
      }

      for (let repetition = 0; repetition < repetitionCount; repetition++) {
        const measureOffset = repetition * plan.measures;
        schedulePlaybackPlan(transport, instruments, {
          ...plan,
          instrumentEvents: plan.instrumentEvents.map((event) => ({
            ...event,
            time: offsetMeasures(event.time, measureOffset),
          })),
          chordEvents: plan.chordEvents.map((event) => ({
            ...event,
            time: offsetMeasures(event.time, measureOffset),
          })),
        });
      }
      await loaded();
      transport.start(0);
    },
    duration,
    2,
  );

  const audioBuffer = rendered.get();
  if (!audioBuffer) throw new Error("Offline audio render produced no buffer");

  if (format === "mp3") {
    const mp3 = await encodeMp3(audioBuffer);
    download(mp3, "audio/mpeg", `steps-${state.bpm}bpm.mp3`);
  } else {
    downloadWav(audioBuffer, state.bpm);
  }
}

function offsetMeasures(time: string, offset: number) {
  const [measure, ...position] = time.split(":");
  return [parseInt(measure) + offset, ...position].join(":");
}

async function encodeMp3(audioBuffer: AudioBuffer) {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const channelCount = Math.min(2, audioBuffer.numberOfChannels);
  const encoder = new Mp3Encoder(channelCount, audioBuffer.sampleRate, 192);
  const channels = Array.from(
    { length: channelCount },
    (_, channel) => audioBuffer.getChannelData(channel),
  );
  const chunks: Uint8Array[] = [];

  for (let offset = 0; offset < audioBuffer.length; offset += 1152) {
    const samples = channels.map((channel) =>
      floatToPcm16(channel.subarray(offset, offset + 1152))
    );
    const chunk = encoder.encodeBuffer(samples[0], samples[1]);
    if (chunk.length > 0) chunks.push(chunk);
  }

  const finalChunk = encoder.flush();
  if (finalChunk.length > 0) chunks.push(finalChunk);

  const mp3 = new Uint8Array(
    chunks.reduce((size, chunk) => size + chunk.length, 0),
  );
  let offset = 0;
  for (const chunk of chunks) {
    mp3.set(chunk, offset);
    offset += chunk.length;
  }
  return mp3.buffer;
}

function floatToPcm16(samples: Float32Array) {
  const pcm = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index++) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return pcm;
}

function downloadWav(audioBuffer: AudioBuffer, bpm: number) {
  const channelCount = audioBuffer.numberOfChannels;
  const dataLength = audioBuffer.length * channelCount * 2;
  const wav = new ArrayBuffer(44 + dataLength);
  const view = new DataView(wav);

  writeText(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeText(view, 8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * channelCount * 2, true);
  view.setUint16(32, channelCount * 2, true);
  view.setUint16(34, 16, true);
  writeText(view, 36, "data");
  view.setUint32(40, dataLength, true);

  const channels = Array.from(
    { length: channelCount },
    (_, channel) => audioBuffer.getChannelData(channel),
  );
  let offset = 44;
  for (let frame = 0; frame < audioBuffer.length; frame++) {
    for (let channel = 0; channel < channelCount; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][frame]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += 2;
    }
  }

  download(wav, "audio/wav", `steps-${bpm}bpm.wav`);
}

function download(data: BlobPart, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement("a");
  anchor.download = filename;
  anchor.href = url;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function writeText(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index++) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
