import styled from "styled-components";
import GridService from "../../services/transport/grid.ts";
import TriggersService from "../../services/transport/triggers.ts";
import useToneStore from "../../store/store.ts";
import { useCallback, useLayoutEffect, useState } from "react";
import SequencerService from "../../services/transport/sequencer.ts";

const colors = {
  odd: "var(--main-faded)",
  free: "rgba(0,0,0,0)",
  toggled: "black",
};

const StepMargin = styled.div`
  height: 100%;
  position: relative;
  cursor: inherit;
  border: 0.5px solid var(--main);
  box-sizing: border-box;

  &:focus-visible {
    outline: 2px solid var(--black);
    outline-offset: -2px;
  }
`;

const Step = styled.div`
  height: 100%;
  cursor: pointer;
`;

const Head = styled.div<{ emph: boolean }>`
  position: relative;
  top: ${(props) => (props.emph ? "20%" : "80%")};
  height: 5%;
  background: var(--main);
`;

const Guide = styled.div`
  position: absolute;
  top: -1rem;
  font-size: 0.7rem;
  text-align: center;
  width: 100%;
`;
const StrongGuide = styled.div`
  font-weight: 600;
  color: black;
`;
const WeakGuide = styled.div`
  color: grey;
`;

interface ToggleProps {
  timeId: string;
  instrumentId: number;
  muted: boolean;
}

export default function Toggle(props: ToggleProps) {
  const { bar } = GridService.parseTimeId(props.timeId);
  const guideName = props.instrumentId === 0
    ? GridService.timeIdToGuideName(props.timeId)
    : null;
  const addTriggerEvent = useToneStore((state) => state.addTriggerEvent);
  const removeTriggerEvent = useToneStore((state) => state.removeTriggerEvent);
  const scheduled = useToneStore((state) =>
    state.scheduledEvents.find(
      (e) => e.slice(0, -2) === `${props.timeId}|${props.instrumentId}`,
    )
  );
  const activeBars = useToneStore((state) => state.activeBars);
  const [isActive, setIsActive] = useState(false);
  const setStep = useCallback(
    (step: string) => {
      const cycleBar = parseInt(step[0]) % activeBars;
      const stepNormal = `${cycleBar}${step.substring(1)}`;
      // split drops triplet sixteenth decimal
      setIsActive(!props.muted && stepNormal === props.timeId.split(".")[0]);
    },
    [props.muted, activeBars, props.timeId],
  );

  useLayoutEffect(() => {
    SequencerService.stepEmitter.on("step", setStep);
    return () => {
      SequencerService.stepEmitter.off("step", setStep);
    };
  }, [setStep]);

  function getBackgroundColor() {
    const odd = bar % 2 === 1;
    return scheduled ? colors.toggled : odd ? colors.odd : colors.free;
  }

  function toggleStep(emphasized: boolean) {
    scheduled
      ? removeTriggerEvent(props.timeId, props.instrumentId)
      : addTriggerEvent(props.timeId, props.instrumentId, emphasized);
  }

  return (
    <StepMargin
      data-time-id={props.timeId}
      role="button"
      tabIndex={0}
      aria-label={`${scheduled ? "Remove" : "Add"} note at ${props.timeId}`}
      aria-pressed={Boolean(scheduled)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleStep(false);
        } else if (scheduled && event.key === "ArrowUp") {
          event.preventDefault();
          addTriggerEvent(props.timeId, props.instrumentId, true);
        } else if (scheduled && event.key === "ArrowDown") {
          event.preventDefault();
          addTriggerEvent(props.timeId, props.instrumentId, false);
        }
      }}
    >
      {guideName
        ? (
          <Guide>
            {parseInt(guideName) > 0
              ? <StrongGuide>{guideName}</StrongGuide>
              : <WeakGuide>{guideName}</WeakGuide>}
          </Guide>
        )
        : (
          ""
        )}
      <Step
        style={{
          backgroundColor: getBackgroundColor(),
          opacity: isActive ? "0.2" : "1",
        }}
      >
        {scheduled && (
          <Head emph={TriggersService.parseTrigger(scheduled)?.emphasized} />
        )}
      </Step>
    </StepMargin>
  );
}
