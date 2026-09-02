import { loaded, Offline, Volume } from "tone";
import useToneStore from "../../store/store.ts";
import InstrumentsService from "../core/instruments.ts";
import {
  configureTransport,
  schedulePlaybackPlan,
} from "../transport/sequencer.ts";
import TriggersService from "../transport/triggers.ts";

export async function recordAudio() {
  await loaded();

  const state = useToneStore.getState();
  const plan = TriggersService.createPlaybackPlan(state);
  const duration = plan.measures * parseInt(state.signature) * 60 / state.bpm;

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
          transport.schedule((time) => player.start(time), "0:0:0");
        }
      }

      schedulePlaybackPlan(transport, instruments, plan);
      await loaded();
      transport.start(0);
    },
    duration,
    2,
  );

  const audioBuffer = rendered.get();
  if (!audioBuffer) throw new Error("Offline audio render produced no buffer");
  downloadWav(audioBuffer, state.bpm);
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

  const url = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
  const anchor = document.createElement("a");
  anchor.download = `steps-${bpm}bpm.wav`;
  anchor.href = url;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function writeText(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index++) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
