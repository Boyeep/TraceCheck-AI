export const joinClasses = (
  ...classes: Array<string | false | null | undefined>
) => classes.filter(Boolean).join(" ");

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const mix = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;
