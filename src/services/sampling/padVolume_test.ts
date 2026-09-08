/// <reference lib="deno.ns" />

import {
  padVolumeFromSlider,
  padVolumeToAudioDb,
  SILENT_PAD_VOLUME_DB,
} from "./padVolume.ts";

Deno.test("zero pad volume survives JSON and becomes silent audio", () => {
  const storedVolume = padVolumeFromSlider(0);
  const restoredVolume = JSON.parse(JSON.stringify(storedVolume));

  if (restoredVolume !== SILENT_PAD_VOLUME_DB) {
    throw new Error("Silent pad volume did not survive JSON serialization");
  }
  if (padVolumeToAudioDb(restoredVolume) !== Number.NEGATIVE_INFINITY) {
    throw new Error("Silent pad volume did not become negative infinity");
  }
});
