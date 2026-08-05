import { useState, useRef, useCallback } from "react";

interface UseSwipeRevealOptions {
  threshold?: number;   // distancia mínima en px para activar el desvelado
  maxDistance?: number; // distancia máxima de desplazamiento en px
}

export function useSwipeReveal({ threshold = 40, maxDistance = 90 }: UseSwipeRevealOptions = {}) {
  const [revealed, setRevealed] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const clamped = Math.max(-maxDistance, Math.min(0, delta));
      setTranslateX(clamped);
    },
    [maxDistance]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setTranslateX((current) => {
      if (current < -threshold) {
        setRevealed(true);
        return -maxDistance;
      }
      setRevealed(false);
      return 0;
    });
  }, [threshold, maxDistance]);

  const reset = useCallback(() => {
    setRevealed(false);
    setTranslateX(0);
  }, []);

  return {
    revealed,
    translateX,
    reset,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  };
}
