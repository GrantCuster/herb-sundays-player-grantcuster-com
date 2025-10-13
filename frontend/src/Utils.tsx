export const extractJSONFromBackticks = (text: string): string | null => {
  const backtickRegex = /```json([\s\S]*?)```/;
  const match = text.match(backtickRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
};

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function rescalePoint(
  x: number,
  a1: number,
  b1: number,
  a2: number,
  b2: number,
): number {
  if (b1 === a1) {
    throw new Error("Original line segment has zero length");
  }
  return a2 + ((x - a1) / (b1 - a1)) * (b2 - a2);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// format milliseconds to mm:ss
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
