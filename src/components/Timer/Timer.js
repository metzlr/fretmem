import { useState, useEffect } from "react";

const TIMER_STATES = {
  Stopped: "STOPPED",
  Running: "START",
  Paused: "PAUSED",
};

const Timer = ({ state, className }) => {
  const [time, setTime] = useState({ min: 0, sec: 0 });

  useEffect(() => {
    switch (state) {
      case TIMER_STATES.Stopped:
        setTime({ min: 0, sec: 0 });
        break;
      case TIMER_STATES.Running:
        const interval = setInterval(() => {
          setTime((t) => ({
            min: t.sec >= 60 ? t.min + 1 : t.min,
            sec: t.sec >= 60 ? 0 : t.sec + 1,
          }));
        }, 1000);

        return () => clearInterval(interval);
      case TIMER_STATES.Paused:
        break;
      default:
        break;
    }
  }, [state]);

  return (
    <span className={`Timer-time ${className}`}>
      {time.min < 10 ? "0" + time.min : time.min}:
      {time.sec < 10 ? "0" + time.sec : time.sec}
    </span>
  );
};

export { Timer, TIMER_STATES };
