import { Voicing, VoicingDictionary } from "tonal";
import type { SongArrangement, TrackParams } from "../core/interfaces.ts";
import { parseTimeId } from "./time.ts";

interface PlaybackPlanState {
  activeBars: number;
  signature: string;
  resolution: string;
  scheduledEvents: Array<string>;
  songArrangement: SongArrangement;
  trackSettings: TrackParams;
}

export interface InstrumentEvent {
  time: string;
  instrumentId: number;
  emphasis: boolean;
}

export interface ChordEvent {
  time: string;
  notes: Array<string>;
}

export interface PlaybackPlan {
  measures: number;
  instrumentEvents: Array<InstrumentEvent>;
  chordEvents: Array<ChordEvent>;
}

function createPlaybackPlan(state: PlaybackPlanState): PlaybackPlan {
  const cycles = state.songArrangement.length || 1;
  const activeEvents = new Map<string, string>();
  state.scheduledEvents.filter((event) => {
    const { instrumentId } = parseTrigger(event);
    if (state.trackSettings[parseInt(instrumentId)]?.mute) return false;
    const { bar, quarter, sixteenth } = parseTimeId(event);
    if (bar >= state.activeBars || quarter >= parseInt(state.signature)) {
      return false;
    }
    if (state.resolution === "8n") return ["0", "2"].includes(sixteenth);
    if (state.resolution === "16n") return !sixteenth.includes(".");
    return !["1", "2", "3"].includes(sixteenth);
  }).forEach((event) => {
    const { timeId, instrumentId } = parseTrigger(event);
    activeEvents.set(`${timeId}|${instrumentId}`, event);
  });

  const instrumentEvents: Array<InstrumentEvent> = [];
  for (let cycle = 0; cycle < cycles; cycle++) {
    activeEvents.forEach((event) => {
      const { timeId, instrumentId, emphasized } = parseTrigger(event);
      const { bar, quarter, sixteenth } = parseTimeId(timeId);
      instrumentEvents.push({
        time: `${bar + cycle * state.activeBars}:${quarter}:${sixteenth}`,
        instrumentId: parseInt(instrumentId),
        emphasis: emphasized,
      });
    });
  }

  const chordEvents: Array<ChordEvent> = [];
  state.songArrangement.forEach((cycle, cycleIndex) => {
    cycle.forEach((bar, barIndex) => {
      (bar || []).forEach((chord, chordIndex) => {
        const notes = Voicing.search(
          chord,
          ["B3", "D5"],
          VoicingDictionary.defaultDictionary,
        )[0];
        if (!notes) return;
        chordEvents.push({
          time: `${barIndex + cycleIndex * state.activeBars}:${
            chordIndex === 1 ? 2 : 0
          }:0`,
          notes,
        });
      });
    });
  });

  return {
    measures: state.activeBars * cycles,
    instrumentEvents,
    chordEvents,
  };
}

function parseTrigger(scheduledEvent: string) {
  const [timeId, instrumentId, emphasis] = scheduledEvent.split("|");
  return {
    timeId,
    instrumentId,
    emphasized: emphasis === "1",
  };
}

const TriggersService = {
  createPlaybackPlan,
  parseTrigger,
};

export default TriggersService;
