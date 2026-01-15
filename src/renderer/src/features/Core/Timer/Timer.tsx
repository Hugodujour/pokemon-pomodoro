import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './Timer.css';

export interface TimerHandle {
  start: () => void;
  pause: () => void;
  reset: (autoStart?: boolean) => void;
}

interface TimerProps {
  onFinish?: () => void;
  onTick?: (seconds: number) => void;
  onStart?: () => void;
  onUpdate?: (remaining: number, total: number) => void;
  initialDuration?: number;
}

const Timer = forwardRef<TimerHandle, TimerProps>(({ 
  onFinish, 
  onTick, 
  onStart, 
  onUpdate, 
  initialDuration = 1500 
}, ref) => {
  const [remaining, setRemaining] = useState(initialDuration);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const remainingRef = useRef(remaining);

  useImperativeHandle(ref, () => ({
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset: (autoStart = false) => {
        setRunning(false);
        setRemaining(initialDuration);
        if (onUpdate) onUpdate(initialDuration, initialDuration);
        if (autoStart) {
            setTimeout(() => setRunning(true), 0);
        }
    }
  }));

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  useEffect(() => {
    if (running) {
      if (onStart) onStart();  // Notify start
      // Interval principal pour le timer
      intervalRef.current = setInterval(() => {
        const current = remainingRef.current;
        if (current <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setRunning(false);
          setRemaining(0);
          if (onUpdate) onUpdate(0, initialDuration);
          if (onFinish) onFinish();
        } else {
          const nextVal = current - 1;
          if (onTick) onTick(1);
          if (onUpdate) onUpdate(nextVal, initialDuration);
          setRemaining(nextVal);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, onFinish, onTick, onStart, onUpdate, initialDuration]);

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  const percent = (1 - remaining / initialDuration) * 100;

  return (
    <div className="timer-container">
      <h1 className="timer-display">
        {minutes}:{seconds}
      </h1>

      {/* barre du timer */}
      <div className="timer-bar-container">
        <div
          className="timer-bar-fill"
          style={{
            '--progress': percent + '%',
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
});

Timer.displayName = 'Timer';

export default Timer;
