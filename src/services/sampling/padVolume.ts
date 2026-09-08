export const SILENT_PAD_VOLUME_DB = -100;

export function padVolumeFromSlider(value: number) {
  if (value === 0) return SILENT_PAD_VOLUME_DB;
  if (value <= 50) return 20 * Math.log10(value / 50);
  return (value - 50) * 12 / 50;
}

export function padVolumeToSlider(value: number) {
  if (value <= SILENT_PAD_VOLUME_DB) return 0;
  if (value <= 0) return 50 * 10 ** (value / 20);
  return 50 + value * 50 / 12;
}

export function padVolumeToAudioDb(value: number) {
  return value <= SILENT_PAD_VOLUME_DB ? Number.NEGATIVE_INFINITY : value;
}
