export function parseTimeId(
  timeId: string,
): { bar: number; quarter: number; sixteenth: string } {
  const [bar, quarter, sixteenth] = timeId.split("|")[0].split(":");
  return { bar: parseInt(bar), quarter: parseInt(quarter), sixteenth };
}
