import { loaded, Offline, PitchShift, Player, Sampler, Volume } from "tone";
import { Voicing, VoicingDictionary } from "tonal";
import useToneStore from "../../store/store.ts";
import InstrumentsService from "../core/instruments.ts";
import { EnvelopeParam, InstrumentType } from "../core/interfaces.ts";
import GridService from "../transport/grid.ts";

export async function recordAudio() {
  await loaded();

  const state = useToneStore.getState();
  const cycles = state.songArrangement.length || 1;
  const measures = state.activeBars * cycles;
  const duration = measures * parseInt(state.signature) * 60 / state.bpm;

  const rendered = await Offline(
    async ({ transport }) => {
      transport.bpm.value = state.bpm;
      transport.timeSignature = parseInt(state.signature);
      transport.swing = state.swing / 100;

      const soloedTracks = Object.entries(state.trackSettings)
        .filter(([, setting]) => setting.solo)
        .map(([id]) => id);

      const players = InstrumentsService.instruments.map(
        (instrument, index) => {
          const track = state.trackSettings[instrument.id];
          const channelVolume = new Volume({
            mute: index >= state.activeTracks || track.mute ||
              (soloedTracks.length > 0 &&
                !soloedTracks.includes(`${instrument.id}`)),
            volume: -12 * (100 - track.volume) / 100,
          }).toDestination();
          const params = state.instrumentParams[instrument.id];
          const pitchShift = new PitchShift(params[EnvelopeParam.pitchShift]);
          const sampleVolume = new Volume(params[EnvelopeParam.amplitude]);
          const output = pitchShift.chain(sampleVolume, channelVolume);

          if (instrument.type === InstrumentType.chords) {
            const sampler = new Sampler({
              urls: {
                C2: "sounds/piano_C2.wav",
                D4: "sounds/piano_D4.wav",
              },
            }).chain(new Volume(-8), output);
            return { sampler };
          }

          if (!instrument.source || !instrument.playHigh?.loaded) return {};

          let offset = instrument.offset || 0;
          let sampleDuration = instrument.duration;
          let fadeIn = instrument.fadeIn || 0;
          let fadeOut = instrument.fadeOut || 0;
          if (instrument.type === InstrumentType.pad) {
            const bufferDuration = instrument.playHigh.buffer.duration;
            const unity = bufferDuration / 100;
            offset = params[EnvelopeParam.offset] * unity;
            sampleDuration = params[EnvelopeParam.duration] * unity;
            fadeIn = params[EnvelopeParam.fadeIn] * unity;
            fadeOut = params[EnvelopeParam.fadeOut] * sampleDuration / 100;
          }

          const high = new Player({
            url: instrument.playHigh.buffer,
            fadeIn,
            fadeOut,
          }).chain(new Volume(0), output);
          const low = new Player({
            url: instrument.playHigh.buffer,
            fadeIn,
            fadeOut,
          }).chain(new Volume(-8), output);
          return { high, low, offset, duration: sampleDuration };
        },
      );

      const backing = state.playbackSample >= 0
        ? InstrumentsService.playbacks[state.playbackSample]
        : undefined;
      if (backing?.player.loaded) {
        const player = new Player(backing.player.buffer).toDestination();
        transport.schedule((time) => player.start(time), "0:0:0");
      }

      const activeEvents = new Map<string, string>();
      state.scheduledEvents.filter((event) => {
        const { bar, quarter, sixteenth } = GridService.parseTimeId(event);
        if (bar >= state.activeBars || quarter >= parseInt(state.signature)) {
          return false;
        }
        if (state.resolution === "8n") return ["0", "2"].includes(sixteenth);
        if (state.resolution === "16n") return !sixteenth.includes(".");
        return !["1", "2", "3"].includes(sixteenth);
      }).forEach((event) => {
        const [timeId, instrumentId] = event.split("|");
        activeEvents.set(`${timeId}|${instrumentId}`, event);
      });

      for (let cycle = 0; cycle < cycles; cycle++) {
        activeEvents.forEach((event) => {
          const [timeId, instrumentId, emphasis] = event.split("|");
          const { bar, quarter, sixteenth } = GridService.parseTimeId(timeId);
          const player = players[parseInt(instrumentId)];
          transport.schedule((time) => {
            const source = emphasis === "1" ? player.high : player.low;
            if (!source) return;
            if (
              InstrumentsService.instruments[parseInt(instrumentId)].type ===
                InstrumentType.pad
            ) {
              player.high?.stop(time);
              player.low?.stop(time);
            } else {
              source.stop(time);
            }
            source.start(time, player.offset, player.duration);
          }, `${bar + cycle * state.activeBars}:${quarter}:${sixteenth}`);
        });
      }

      state.songArrangement.forEach((cycle, cycleIndex) => {
        cycle.forEach((bar, barIndex) => {
          (bar || []).forEach((chord, chordIndex) => {
            const voicing = Voicing.search(
              chord,
              ["B3", "D5"],
              VoicingDictionary.defaultDictionary,
            )[0];
            if (!voicing) return;
            const triggerBar = barIndex + cycleIndex * state.activeBars;
            const triggerEighth = chordIndex === 1 ? 2 : 0;
            transport.schedule((time) => {
              players[InstrumentsService.chords.id].sampler
                ?.triggerAttackRelease(
                  voicing,
                  0.6,
                  time,
                );
            }, `${triggerBar}:${triggerEighth}:0`);
          });
        });
      });

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
