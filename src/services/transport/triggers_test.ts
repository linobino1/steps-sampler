import type { TrackParams } from "../core/interfaces.ts";
import TriggersService from "./triggers.ts";

const trackSettings: TrackParams = {
  0: { mute: false, volume: 100, solo: false },
  3: { mute: true, volume: 100, solo: false },
};

Deno.test("createPlaybackPlan excludes events on muted tracks", () => {
  const plan = TriggersService.createPlaybackPlan({
    activeBars: 1,
    signature: "4",
    resolution: "16n",
    scheduledEvents: ["0:0:0|0|0", "0:0:0|3|1"],
    songArrangement: [],
    trackSettings,
  });

  if (
    plan.instrumentEvents.length !== 1 ||
    plan.instrumentEvents[0].instrumentId !== 0
  ) {
    throw new Error("Muted track event was included in the playback plan");
  }
});

Deno.test("createPlaybackPlan limits compact mode without deleting events", () => {
  const plan = TriggersService.createPlaybackPlan({
    activeBars: 3,
    compactMode: true,
    signature: "4",
    resolution: "16n",
    scheduledEvents: [
      "0:0:0|3|1",
      "0:0:0|4|1",
      "0:0:0|5|1",
      "1:0:0|0|0",
    ],
    songArrangement: [],
    trackSettings: {},
  });

  if (
    plan.measures !== 1 || plan.instrumentEvents.length !== 1 ||
    plan.instrumentEvents[0].instrumentId !== 3
  ) {
    throw new Error("Compact playback was not limited to pad 1 and one bar");
  }
});
