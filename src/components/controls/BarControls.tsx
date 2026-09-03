import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd, faMinus } from "@fortawesome/free-solid-svg-icons";
import useToneStore from "../../store/store.ts";

const BarLengthStepper = styled.div`
  align-items: stretch;
  border: 2px solid black;
  border-radius: 6px;
  box-sizing: border-box;
  display: flex;
  height: 26px;
  overflow: hidden;

  && > button {
    appearance: none;
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-sizing: border-box;
    color: var(--black);
    display: inline-flex;
    flex: 0 0 26px;
    height: 100%;
    justify-content: center;
    margin: 0;
    padding: 0;
    width: 26px;

    > svg {
      font-size: 10px;
    }

    &:first-child {
      border-right: 2px solid black;
    }

    &:last-child {
      border-left: 2px solid black;
    }

    &:disabled {
      background: var(--inactive-background);
      color: var(--inactive-color);
    }

    &:not(:disabled):hover {
      background: var(--main-light);
    }
  }

  > span {
    align-items: center;
    display: flex;
    font-size: 12px;
    font-weight: bold;
    justify-content: center;
    line-height: 1;
    min-width: 58px;
    text-align: center;
  }
`;

export default function BarControls() {
  const activeBars = useToneStore((state) => state.activeBars);
  const changeBars = useToneStore((state) => state.changeBars);
  const duplicateBarEvents = useToneStore((state) => state.duplicateBarEvents);
  const clearSchedule = useToneStore((state) => state.clearSchedule);
  const isGridEmpty = useToneStore((state) =>
    state.scheduledEvents.length === 0
  );

  return (
    <>
      <BarLengthStepper>
        <button
          type="button"
          aria-label="Remove bar"
          disabled={activeBars <= 1}
          onClick={() => changeBars(-1)}
        >
          <FontAwesomeIcon icon={faMinus} />
        </button>
        <span>{activeBars} {activeBars === 1 ? "BAR" : "BARS"}</span>
        <button
          type="button"
          aria-label="Add bar"
          disabled={activeBars >= 4}
          onClick={duplicateBarEvents}
        >
          <FontAwesomeIcon icon={faAdd} />
        </button>
      </BarLengthStepper>
      <button
        type="button"
        disabled={isGridEmpty}
        onClick={() => {
          if (globalThis.confirm("Are you sure?")) clearSchedule();
        }}
      >
        Clear Steps
      </button>
    </>
  );
}
