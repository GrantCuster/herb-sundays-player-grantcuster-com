import { useEffect, useRef, useState } from "react";
import { loadImage } from "./Utils";
import type { SizeType } from "./Types";

export function useSizeImage({
  image,
  size,
}: {
  image?: string | null;
  size?: SizeType;
}) {
  const [originalSize, setOriginalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [displaySize, setDisplaySize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchImageSize() {
      if (image) {
        const img = await loadImage(image);
        setOriginalSize({ width: img.width, height: img.height });
      } else {
        setOriginalSize(null);
      }
    }
    if (size) {
      setOriginalSize({ width: size.width, height: size.height });
    } else {
      fetchImageSize();
    }
  }, [image, size]);

  useEffect(() => {
    // resize observer to get the display size
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
      // initial size
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
    return () => {
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (originalSize && containerSize) {
      const imageAspect = originalSize.width / originalSize.height;
      const containerAspect = containerSize.width / containerSize.height; // account for label height
      let width, height;
      if (imageAspect > containerAspect) {
        // image is wider than container
        width = containerSize.width;
        height = width / imageAspect;
      } else {
        // image is taller than container
        height = containerSize.height; // account for label height
        width = height * imageAspect;
      }
      setDisplaySize({ width, height });
    } else {
      setDisplaySize(null);
    }
  }, [originalSize, containerSize]);

  return { originalSize, displaySize, containerSize, containerRef };
}
