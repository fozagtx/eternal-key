import { useState, useEffect } from 'react';
import { formatTimeRemaining } from '../lib/contracts';

interface CountdownTimerProps {
  timeRemaining: bigint;
  onTrigger?: () => void;
  className?: string;
}

export default function CountdownTimer({ timeRemaining, onTrigger, className = '' }: CountdownTimerProps) {
  const [currentTime, setCurrentTime] = useState(timeRemaining);
  const [isTriggered, setIsTriggered] = useState(timeRemaining <= 0n);

  useEffect(() => {
    setCurrentTime(timeRemaining);
    setIsTriggered(timeRemaining <= 0n);
  }, [timeRemaining]);

  useEffect(() => {
    if (isTriggered) {
      onTrigger?.();
      return;
    }

    const timer = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev > 0n ? prev - 1n : 0n;
        if (newTime === 0n && !isTriggered) {
          setIsTriggered(true);
          onTrigger?.();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTriggered, onTrigger]);

  const formatTime = formatTimeRemaining(currentTime);
  const isUrgent = currentTime > 0n && currentTime < 24n * 60n * 60n; // Less than 24 hours
  const isCritical = currentTime > 0n && currentTime < 60n * 60n; // Less than 1 hour

  return (
    <div className={`countdown-timer ${className}`}>
      {isTriggered ? (
        <div className="text-red-500 font-bold text-lg pulse-slow">
          ⚠️ TRIGGERED
        </div>
      ) : (
        <div
          className={`
            ${isCritical ? 'text-red-400 pulse-slow' : 
              isUrgent ? 'text-yellow-400' : 
              'text-green-400'
            } font-bold text-lg
          `}
        >
          {isCritical && '🚨 '}
          {isUrgent && !isCritical && '⚠️ '}
          {!isUrgent && '✅ '}
          {formatTime}
        </div>
      )}
    </div>
  );
}