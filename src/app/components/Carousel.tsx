'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

type MediaItem = {
  src: string;
  position?: 'top' | 'center' | 'bottom' | string; // acepta personalizados como '50% 20%'
};

type Props = {
  media: MediaItem[];
  width?: number;
  height?: number;
  autoSlide?: boolean;
  autoSlideInterval?: number;
  resize?: boolean;
};

export function CarouselComponent({
  media,
  width = 500,
  height = 400,
  autoSlide = true,
  autoSlideInterval = 5000,
  resize = false,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const isVideo = (src: string) =>
    src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.ogg');

  const handleSlideChange = (nextIndex: number) => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo && isVideo(media[currentIndex].src)) {
      currentVideo.pause();
      currentVideo.currentTime = 0;
    }
    setCurrentIndex(nextIndex);
  };

  const goToNext = () => {
    handleSlideChange((currentIndex + 1) % media.length);
  };

  const goToPrev = () => {
    handleSlideChange(currentIndex === 0 ? media.length - 1 : currentIndex - 1);
  };

  useEffect(() => {
    if (!autoSlide) return;
    const interval = setInterval(goToNext, autoSlideInterval);
    return () => clearInterval(interval);
  }, [currentIndex, autoSlide, autoSlideInterval]);

  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (!currentVideo || !isVideo(media[currentIndex].src)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          currentVideo.play().catch(() => {});
        } else {
          currentVideo.pause();
        }
      },
      { threshold: [0.6] }
    );

    observer.observe(currentVideo);
    return () => observer.disconnect();
  }, [currentIndex, media]);

  return (
    <div
      className="relative overflow-hidden bg-black rounded-xl mx-auto w-full"
      style={{ maxWidth: `${width}px`, height: `${height}px` }}
    >
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {media.map((item, index) => {
          const { src, position = 'center' } = item;

          const resolvedPosition =
            position === 'top'
              ? 'top'
              : position === 'bottom'
              ? 'bottom'
              : position === 'center'
              ? 'center'
              : position; // si es un string como '40% 60%'

          const objectPositionStyle = { objectPosition: resolvedPosition };

          return (
            <div
              key={index}
              className="flex-shrink-0 flex items-center justify-center relative w-full"
              style={{ height: `${height}px` }}
            >
              {isVideo(src) ? (
                <video
                  ref={(el) => {(videoRefs.current[index] = el)}}
                  src={src}
                  muted
                  playsInline
                  controls={false}
                  preload="metadata"
                  className="w-full h-full object-cover rounded-lg"
                  style={objectPositionStyle}
                />
              ) : resize ? (
                <div className="w-full h-full flex items-center justify-center bg-black rounded-lg">
                  <img
                    src={src}
                    alt={`Media ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                    className="rounded-lg"
                  />
                </div>
              ) : (
                <div className="absolute inset-0">
                  <Image
                    src={src}
                    fill
                    className="object-cover rounded-lg"
                    alt={`Media ${index + 1}`}
                    sizes="100vw"
                    style={objectPositionStyle}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Flechas */}
      <button
        onClick={goToPrev}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/40 hover:bg-white/70 p-2 rounded-full z-10"
      >
        <ChevronLeftIcon className="h-6 w-6 text-black" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/40 hover:bg-white/70 p-2 rounded-full z-10"
      >
        <ChevronRightIcon className="h-6 w-6 text-black" />
      </button>
    </div>
  );
}





