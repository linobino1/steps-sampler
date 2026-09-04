import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import MetronomeService from "../../services/transport/metronome.ts";
import useToneStore from "../../store/store.ts";

const MetronomeButton = styled.button<{ $enabled: boolean }>`
  align-items: center;
  background: transparent;
  color: ${(props) => props.$enabled ? "var(--white)" : "var(--black)"};
  display: flex;
  justify-content: center;
  margin: 0;
  padding: 0 2px;
  width: 30px;

  && {
    border: 0;
    height: 31px;
  }

  &:not(:disabled):hover {
    background: transparent;
  }

  &:focus {
    outline: 0;
  }

  &&:focus-visible {
    border-radius: 2px;
    outline: 2px solid var(--main);
    outline-offset: 2px;
  }
`;

const Beater = styled.g<{ $direction: number; $duration: number }>`
  transform: rotate(${(props) => props.$direction * 18}deg);
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transition: transform ${(props) => props.$duration}ms linear;
`;

function MetronomeIcon({
  direction,
  duration,
  enabled,
}: {
  direction: number;
  duration: number;
  enabled: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="31"
      viewBox="0 0 20 24"
      width="26"
    >
      <path
        d="M8 1h4c1.4 0 2.6 1 2.9 2.4l3.9 16.8c.3 1.4-.7 2.8-2.2 2.8H3.4c-1.5 0-2.5-1.4-2.2-2.8L5.1 3.4A3 3 0 0 1 8 1Z"
        fill={enabled ? "var(--main)" : "transparent"}
        stroke="var(--black)"
        strokeLinejoin="round"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <Beater $direction={direction} $duration={duration}>
        <path
          d="M10 18V2"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <rect x="8" y="4" width="4" height="5" rx="1" fill="currentColor" />
      </Beater>
      <circle cx="10" cy="18" r="1.6" fill="currentColor" />
    </svg>
  );
}

export default function MetronomeControl() {
  const [enabled, setEnabled] = useState(
    MetronomeService.isEnabled(),
  );
  const [direction, setDirection] = useState(0);
  const [animateBeater, setAnimateBeater] = useState(false);
  const hasReceivedBeat = useRef(false);
  const bpm = useToneStore((state) => state.bpm);

  useEffect(() => {
    let animationFrame = 0;
    const showBeat = (nextDirection: number) => {
      if (hasReceivedBeat.current) {
        setDirection(-nextDirection);
        return;
      }

      hasReceivedBeat.current = true;
      setDirection(nextDirection);
      animationFrame = requestAnimationFrame(() => {
        setAnimateBeater(true);
        animationFrame = requestAnimationFrame(() => {
          setDirection(-nextDirection);
        });
      });
    };
    const showIdle = () => {
      cancelAnimationFrame(animationFrame);
      hasReceivedBeat.current = false;
      setAnimateBeater(false);
      setDirection(0);
    };
    MetronomeService.emitter.on("beat", showBeat);
    MetronomeService.emitter.on("stop", showIdle);

    return () => {
      cancelAnimationFrame(animationFrame);
      MetronomeService.emitter.off("beat", showBeat);
      MetronomeService.emitter.off("stop", showIdle);
    };
  }, []);

  function toggleMetronome() {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    MetronomeService.setEnabled(nextEnabled);
  }

  return (
    <MetronomeButton
      type="button"
      $enabled={enabled}
      aria-label={`Metronome ${enabled ? "on" : "off"}`}
      aria-pressed={enabled}
      onClick={toggleMetronome}
    >
      <MetronomeIcon
        direction={direction}
        duration={animateBeater ? 60000 / bpm : 0}
        enabled={enabled}
      />
    </MetronomeButton>
  );
}
