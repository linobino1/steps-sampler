export type GridSignature =
  | "2"
  | "3"
  | "4"
  | "5"
  | "5/8"
  | "6/8"
  | "7/8";

export const GRID_SIGNATURES: Array<{
  value: GridSignature;
  label: string;
}> = [
  { value: "2", label: "2/4" },
  { value: "3", label: "3/4" },
  { value: "4", label: "4/4" },
  { value: "5", label: "5/4" },
  { value: "5/8", label: "5/8" },
  { value: "6/8", label: "6/8" },
  { value: "7/8", label: "7/8" },
];

export function parseGridSignature(
  signature: GridSignature,
): [number, number] {
  const [numerator, denominator = "4"] = signature.split("/");
  return [parseInt(numerator), parseInt(denominator)];
}

export function signatureToToneTime(
  signature: GridSignature,
): number | [number, number] {
  const [numerator, denominator] = parseGridSignature(signature);
  return denominator === 4 ? numerator : [numerator, denominator];
}

export function quarterNotesPerMeasure(signature: GridSignature): number {
  const [numerator, denominator] = parseGridSignature(signature);
  return numerator * 4 / denominator;
}

export function isTimeInSignature(
  quarter: number,
  sixteenth: string,
  signature: GridSignature,
): boolean {
  const position = quarter + parseFloat(sixteenth) / 4;
  return position < quarterNotesPerMeasure(signature);
}

export function parseTimeId(
  timeId: string,
): { bar: number; quarter: number; sixteenth: string } {
  const [bar, quarter, sixteenth] = timeId.split("|")[0].split(":");
  return { bar: parseInt(bar), quarter: parseInt(quarter), sixteenth };
}
