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
