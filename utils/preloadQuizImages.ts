import { Image } from "expo-image";

/**
 * Prefetch quiz image URLs, reporting each as soon as it finishes
 * so gameplay can start after the first image instead of waiting for all.
 */
export function prefetchQuizImages(
  urls: string[],
  onProgress: (loadedCount: number) => void,
  onImageReady: (url: string) => void
): void {
  let loadedCount = 0;

  const bump = () => {
    loadedCount += 1;
    onProgress(loadedCount);
  };

  urls.forEach((url) => {
    if (!url) {
      bump();
      return;
    }

    Image.prefetch(url)
      .then(() => {
        bump();
        onImageReady(url);
      })
      .catch(() => {
        // Mark failed URLs ready so the game never blocks forever
        bump();
        onImageReady(url);
      });
  });
}

export function isQuizImageReady(
  url: string | undefined,
  preloadedImages: Record<string, boolean>
): boolean {
  if (!url) return true;
  return !!preloadedImages[url];
}
