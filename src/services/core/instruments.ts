import { now, PitchShift, Player, Recorder, Sampler, Volume } from "tone";
import {
  EnvelopeParam,
  Instrument,
  InstrumentDefn,
  InstrumentType,
} from "./interfaces.ts";
import useToneStore from "../../store/store.ts";

// GLOBAL NODES

const controlRoomRecorder = new Recorder();
const keyboardRecorder = new Recorder();
const masterVolume = new Volume(0).toDestination();

// SEQUENCED INST

const instDef: Array<InstrumentDefn> = [
  {
    type: InstrumentType.stock,
    name: "kick",
    source: "/sounds/kick70.mp3",
    offset: 0.053,
  },
  {
    type: InstrumentType.stock,
    name: "snare",
    source: "/sounds/snare.mp3",
    offset: 0.05,
  },
  {
    type: InstrumentType.stock,
    name: "hat",
    source: "/sounds/highhat.mp3",
    offset: 0.06,
  },
  { type: InstrumentType.pad, name: "1" },
  { type: InstrumentType.pad, name: "2" },
  { type: InstrumentType.pad, name: "3" },
  // { type: InstrumentType.pad, name: '4' },
  { type: InstrumentType.chords, name: "C" },
  // { type: InstrumentType.overdub, name: 'overdub' },
];

const instruments: Array<Instrument> = instDef.map((defn, index) => {
  let inst: Instrument = {
    ...defn,
    id: index,
    channelVolume: new Volume(0),
    pitchShift: new PitchShift(), // only used for pads atm
    sampleVolume: new Volume(0), // only used for pads atm
  };
  if (inst.type === InstrumentType.stock) {
    const drumDefaults = { duration: 2, fadeOut: 0.2 };
    inst = { ...inst, ...drumDefaults };
    if (inst.name === "kick") {
      inst.duration = 0.5;
    }
  }
  return inst;
});

// PLAYABLE INST

const playbacks = [
  {
    name: "C minor",
    player: new Player("sounds/playCm_70.mp3").fan(masterVolume),
    bpm: 70,
  },
  {
    name: "Tanzbär",
    player: new Player("sounds/playTanzbaer85.mp3").fan(masterVolume),
    bpm: 85,
  },
  {
    name: "BlackKeys",
    player: new Player("sounds/playBlackKeys98.mp3").fan(masterVolume),
    bpm: 98,
  },
  {
    name: "GuitarBass",
    player: new Player("sounds/playGuitarBass90.mp3").fan(masterVolume),
    bpm: 90,
  },
];

interface PadPlayback {
  id: number;
  startTime: number;
  offset: number;
  duration: number;
  bufferDuration: number;
}

const padPlaybackListeners = new Set<(playback: PadPlayback) => void>();

function subscribePadPlayback(listener: (playback: PadPlayback) => void) {
  padPlaybackListeners.add(listener);
  return () => padPlaybackListeners.delete(listener);
}

// TRIGGER

// triggers are scheduled using Transport.schedule in SequencerService
// alternatively this could be done by syncing with instrument.sync()

function getPlayInstrumentTrigger(
  id: number,
  emphasis: boolean,
): (arg0: number) => void {
  return (time) => {
    const instrument = instruments[id];
    const player = emphasis ? instrument.playHigh : instrument.playLow;
    // note: by clearing the source we can prevent an instrument from triggering
    if (!instrument.source || !player?.loaded) return;
    const startTime = time > 0 ? time : now();
    instrument.sampleVolume.mute = false;
    player.fadeIn = instrument.fadeIn ?? 0;
    player.fadeOut = instrument.fadeOut ?? 0;
    if (instrument.type === InstrumentType.pad) {
      instrument.playHigh?.stop(startTime);
      instrument.playLow?.stop(startTime);
    } else {
      player.stop(startTime);
    }
    player.start(startTime, instrument.offset, instrument.duration);
    if (instrument.type === InstrumentType.pad && player.buffer.duration) {
      const offset = instrument.offset || 0;
      const duration = instrument.duration || player.buffer.duration - offset;
      const playback = {
        id,
        startTime,
        offset,
        duration,
        bufferDuration: player.buffer.duration,
      };
      padPlaybackListeners.forEach((listener) => listener(playback));
    }
  };
}

// SIGNAL CHAIN

function wireSignalChain(instrument: Instrument) {
  instrument.channelVolume.fan(controlRoomRecorder, masterVolume);
  const fxAndVol = instrument.pitchShift.chain(
    instrument.sampleVolume,
    instrument.channelVolume,
  );

  if (instrument.type == InstrumentType.chords) {
    instrument.playSampler = new Sampler({
      urls: {
        C2: "sounds/piano_C2.wav",
        D4: "sounds/piano_D4.wav",
      },
    }).chain(new Volume(-8), fxAndVol);
  } else {
    instrument.playHigh = new Player(instrument.source).chain(
      new Volume(0),
      fxAndVol,
    );
    instrument.playLow = new Player(instrument.source).chain(
      new Volume(-8),
      fxAndVol,
    );
  }
}

function syncInstrumentParam(id: number) {
  const param = useToneStore.getState().instrumentParams[id];
  const i = InstrumentsService.instruments[id];

  // allowing changes on all types requires async loading
  if (i.type !== InstrumentType.pad) {
    return;
  }

  if (i.playHigh) {
    const unity = i.playHigh.buffer.duration / 100;
    i.offset = param[EnvelopeParam.offset] * unity;
    i.duration = param[EnvelopeParam.duration] * unity;
    i.fadeOut = param[EnvelopeParam.fadeOut] * i.duration / 100;
    i.fadeIn = param[EnvelopeParam.fadeIn] * unity;
    if (i.sampleVolume && i.pitchShift) {
      i.sampleVolume.volume.value = param[EnvelopeParam.amplitude];
      i.pitchShift.pitch = param[EnvelopeParam.pitchShift];
    }
  }
}

function syncParams() {
  instruments.forEach((i) => syncInstrumentParam(i.id));
}

let instrumentsConnected = false;

function connectInstruments() {
  if (!instrumentsConnected) {
    instruments.forEach((instrument) => wireSignalChain(instrument));
    instrumentsConnected = true;
  }
  syncParams();
  return useToneStore.subscribe((state) => state.instrumentParams, syncParams);
}

const InstrumentsService = {
  stocks: instruments.filter((i) => i.type === InstrumentType.stock),
  pads: instruments.filter((i) => i.type === InstrumentType.pad),
  overdub: instruments.filter((i) => i.type === InstrumentType.overdub)[0],
  chords: instruments.filter((i) => i.type === InstrumentType.chords)[0],
  instruments,
  playbacks,
  connectInstruments,
  getPlayInstrumentTrigger,
  subscribePadPlayback,
  // nodes
  masterVolume,
  keyboardRecorder,
  controlRoomRecorder,
};

export default InstrumentsService;
