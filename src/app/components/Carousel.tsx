'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/solid';

type MediaItem = {
  src: string;
  position?: 'top' | 'center' | 'bottom' | string;
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
  const [isFocused, setIsFocused] = useState(false); // overlay enlarged view
  const [isInteracting, setIsInteracting] = useState(false); // pressing/holding or dragging
  const [isHolding, setIsHolding] = useState(false); // short hold detection

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const holderTimeout = useRef<number | null>(null);
  const autoTimer = useRef<number | null>(null);

  // drag state for overlay
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef<number>(0);

  const isVideo = (src: string) =>
    src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.ogg');

  const clearAutoTimer = () => {
    if (autoTimer.current) {
      window.clearTimeout(autoTimer.current);
      autoTimer.current = null;
    }
  };


  const getClientX = (e: React.PointerEvent | TouchEvent): number => {
    if ("touches" in e) {
      return e.touches[0]?.clientX ?? 0;
    }
    return e.clientX;
  };


  const scheduleAutoAdvance = () => {
    clearAutoTimer();
    // only schedule for images and when autoSlide enabled
    if (!autoSlide) return;
    if (isFocused) return; // don't auto advance while overlay open
    const currentSrc = media[currentIndex]?.src;
    if (!currentSrc || isVideo(currentSrc)) return; // videos handled by onEnded
    // if user is interacting (holding/dragging), do not schedule
    if (isInteracting || isHolding) return;

    autoTimer.current = window.setTimeout(() => {
      goToNext();
    }, autoSlideInterval);
  };

  const handleSlideChange = (nextIndex: number) => {
    // pause and reset any playing video in current slide
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo && isVideo(media[currentIndex].src)) {
      try {
        currentVideo.pause();
        currentVideo.currentTime = 0;
      } catch { }
    }
    setCurrentIndex(nextIndex);
  };

  const goToNext = () => {
    handleSlideChange((currentIndex + 1) % media.length);
  };
  const goToPrev = () => {
    handleSlideChange(currentIndex === 0 ? media.length - 1 : currentIndex - 1);
  };

  // When currentIndex or interaction state changes, (re)start auto timer for images
  useEffect(() => {
    scheduleAutoAdvance();
    return () => clearAutoTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isInteracting, isFocused, isHolding, autoSlide, autoSlideInterval]);

  // pause videos when not current or not visible
  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (!currentVideo) return;

    if (isVideo(media[currentIndex].src)) {
      // try to play when visible and not focused/holding
      const tryPlay = () => {
        if (!isInteracting && !isHolding) {
          currentVideo.play().catch(() => { });
        }
      };

      // play if not focused (overlay) and user not interacting.
      tryPlay();

      const onEnded = () => {
        // only advance automatically if user is not interacting/holding
        if (!isInteracting && !isHolding) {
          goToNext();
        }
      };

      currentVideo.addEventListener('ended', onEnded);

      return () => {
        currentVideo.removeEventListener('ended', onEnded);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isInteracting, isHolding]);

  // pointer handlers for press/hold and tap
  const onPointerDownMedia = (e: React.PointerEvent) => {
    // start hold timer
    if (holderTimeout.current) window.clearTimeout(holderTimeout.current);
    setIsHolding(false);
    dragStartX.current = getClientX(e)

    holderTimeout.current = window.setTimeout(() => {
      setIsHolding(true);
      setIsInteracting(true);
    }, 250); // 250ms to consider a hold
  };

  const onPointerUpMedia = (_e: React.PointerEvent) => {
    if (holderTimeout.current) {
      window.clearTimeout(holderTimeout.current);
      holderTimeout.current = null;
    }

    // If it wasn't a hold and the user didn't drag much, treat as a tap
    if (!isHolding && Math.abs(dragDeltaX.current) < 10) {
      // tap: toggle focus (enlarge) and reset auto timer
      setIsFocused((f) => !f);
      // reset timers
      setIsInteracting(false);
      scheduleAutoAdvance();
    }

    // reset holding state
    setIsHolding(false);
    setIsInteracting(false);
    dragStartX.current = null;
    dragDeltaX.current = 0;
  };

  const onPointerMoveOverlay = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const clientX = getClientX(e)
    dragDeltaX.current = clientX - dragStartX.current;
    // if dragging, prevent auto advance
    if (Math.abs(dragDeltaX.current) > 5) {
      setIsInteracting(true);
    }
  };

  const onPointerUpOverlay = (_e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const delta = dragDeltaX.current;
    const threshold = 60; // px
    if (delta > threshold) {
      // dragged right -> previous
      goToPrev();
    } else if (delta < -threshold) {
      // dragged left -> next
      goToNext();
    }
    dragStartX.current = null;
    dragDeltaX.current = 0;
    setIsInteracting(false);
  };

  // keyboard navigation when focused
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (!isFocused) return;
      if (ev.key === 'ArrowRight') goToNext();
      if (ev.key === 'ArrowLeft') goToPrev();
      if (ev.key === 'Escape') setIsFocused(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, currentIndex]);

  return (
    <div
      className="relative overflow-hidden bg-black rounded-xl mx-auto w-full"
      style={{ maxWidth: `${width}px`, height: `${height}px` }}
    >
      {/* strip */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {media.map((item, index) => {
          const { src, position = 'center' } = item;
          const resolvedPosition =
            position === 'top' ? 'top' : position === 'bottom' ? 'bottom' : position === 'center' ? 'center' : position;
          const objectPositionStyle = { objectPosition: resolvedPosition } as React.CSSProperties;

          return (
            <div
              key={index}
              className="flex-shrink-0 flex items-center justify-center relative w-full"
              style={{ height: `${height}px` }}
            >
              {/* wrapper to capture pointer events */}
              <div
                className="w-full h-full rounded-lg touch-none"
                onPointerDown={onPointerDownMedia}
                onPointerUp={onPointerUpMedia}
                onPointerCancel={() => {
                  if (holderTimeout.current) window.clearTimeout(holderTimeout.current);
                  setIsHolding(false);
                  setIsInteracting(false);
                }}
                onPointerLeave={() => {
                  // if pointer leaves while holding, stop holding
                  if (isHolding) {
                    setIsHolding(false);
                    setIsInteracting(false);
                  }
                }}
              >
                {isVideo(src) ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                    src={src}
                    muted
                    playsInline
                    controls={false}
                    preload="metadata"
                    className="w-full h-full object-cover rounded-lg"
                    style={objectPositionStyle}
                    // if user presses, pause
                    onPointerDown={() => {
                      // ensure video pauses while holding
                      const v = videoRefs.current[index];
                      if (v && isHolding) v.pause();
                    }}
                    onEnded={() => {
                      // will be handled in effect too; keep for redundancy
                      if (!isInteracting && !isHolding) goToNext();
                    }}
                  />
                ) : resize ? (
                  <div className="w-full h-full flex items-center justify-center bg-black rounded-lg">
                    <img
                      src={src}
                      alt={`Media ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
            </div>
          );
        })}
      </div>

      {/* Flechas */}
      <button
        onClick={() => {
          goToPrev();
          scheduleAutoAdvance();
        }}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/40 hover:bg-white/70 p-2 rounded-full z-10"
        aria-label="Anterior"
      >
        <ChevronLeftIcon className="h-6 w-6 text-black" />
      </button>
      <button
        onClick={() => {
          goToNext();
          scheduleAutoAdvance();
        }}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/40 hover:bg-white/70 p-2 rounded-full z-10"
        aria-label="Siguiente"
      >
        <ChevronRightIcon className="h-6 w-6 text-black" />
      </button>

      {/* Overlay / focused view */}
      {isFocused && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onPointerMove={onPointerMoveOverlay}
          onPointerUp={onPointerUpOverlay}
          onPointerCancel={onPointerUpOverlay}
        >
          <button
            className="absolute top-6 right-6 bg-white/30 hover:bg-white/60 p-2 rounded-full z-50"
            onClick={() => setIsFocused(false)}
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-6 h-6 text-black" />
          </button>

          <div className="relative max-w-[95vw] max-h-[95vh] w-[min(1000px,95vw)] h-[min(800px,95vh)] overflow-hidden rounded-2xl">
            {/* left clickable edge */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1/4 z-40"
              onClick={() => goToPrev()}
              aria-hidden
            />
            {/* right clickable edge */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1/4 z-40"
              onClick={() => goToNext()}
              aria-hidden
            />

            {/* content */}
            <div className="w-full h-full flex items-center justify-center select-none">
              {isVideo(media[currentIndex].src) ? (
                <video
                  ref={(el) => { videoRefs.current[currentIndex] = el }}
                  src={media[currentIndex].src}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-xl"
                  playsInline
                />
              ) : (
                <img
                  src={media[currentIndex].src}
                  alt={`Focused ${currentIndex + 1}`}
                  className="max-w-full max-h-full rounded-xl object-contain"
                />
              )}

              {/* small nav buttons in overlay */}
              <button
                onClick={() => goToPrev()}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/30 hover:bg-white/60 p-2 rounded-full z-50"
                aria-label="Anterior grande"
              >
                <ChevronLeftIcon className="h-6 w-6 text-black" />
              </button>
              <button
                onClick={() => goToNext()}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/30 hover:bg-white/60 p-2 rounded-full z-50"
                aria-label="Siguiente grande"
              >
                <ChevronRightIcon className="h-6 w-6 text-black" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





