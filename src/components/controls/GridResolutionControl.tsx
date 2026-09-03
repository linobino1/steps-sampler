import { useEffect, useRef } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";
import useToneStore, { type GridResolutions } from "../../store/store.ts";

const GRID_RESOLUTIONS: ReadonlyArray<{
  value: GridResolutions;
  label: string;
}> = [
  { value: "8n", label: "8THS" },
  { value: "8t", label: "TRIPLETS" },
  { value: "16n", label: "16THS" },
];

const ResolutionRadioGroup = styled.fieldset`
  border: 0;
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0;

  legend {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }

  input {
    opacity: 0;
    position: absolute;
  }

  label {
    align-items: center;
    border: 2px solid var(--black);
    border-radius: 6px;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    font-size: 0.8rem;
    height: 26px;
    padding: 0 5px;
  }

  input:checked + label {
    background: var(--main);
    color: var(--white);
  }

  input:focus-visible + label {
    outline: 2px solid var(--black);
    outline-offset: 2px;
  }

  label:hover {
    background: var(--main-light);
  }

  @media (max-width: 990px) {
    display: none;
  }
`;

const ResolutionSelect = styled.select`
  background: none;
  border: 2px solid var(--black);
  border-radius: 6px;
  box-sizing: border-box;
  color: var(--black);
  cursor: pointer;
  display: none;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: bold;
  height: 26px;
  padding-left: 5px;

  &:hover {
    background: var(--main-light);
  }

  @media (max-width: 990px) {
    display: block;
  }
`;

export default function GridResolutionControl() {
  const [resolution, setResolution] = useToneStore(
    useShallow((state) => [state.resolution, state.toggleResolution]),
  );
  const straightSwing = useRef(useToneStore.getState().swing);

  useEffect(() => {
    if (resolution !== "8t") return;

    const { setSwing, swing } = useToneStore.getState();
    if (swing !== 0) {
      straightSwing.current = swing;
      setSwing(0);
    }
  }, [resolution]);

  function setGridResolution(nextResolution: GridResolutions) {
    const { setSwing, swing } = useToneStore.getState();

    if (nextResolution === "8t") {
      if (resolution !== "8t") straightSwing.current = swing;
      setSwing(0);
    } else if (resolution === "8t") {
      setSwing(straightSwing.current);
    }

    setResolution(nextResolution);
  }

  return (
    <>
      <ResolutionRadioGroup>
        <legend>Grid granularity</legend>
        {GRID_RESOLUTIONS.map(({ value, label }) => (
          <div key={value}>
            <input
              id={`grid-resolution-${value}`}
              name="grid-resolution"
              type="radio"
              value={value}
              checked={resolution === value}
              onChange={() => setGridResolution(value)}
            />
            <label htmlFor={`grid-resolution-${value}`}>{label}</label>
          </div>
        ))}
      </ResolutionRadioGroup>
      <ResolutionSelect
        aria-label="Grid granularity"
        value={resolution}
        onChange={(event) =>
          setGridResolution(event.target.value as GridResolutions)}
      >
        {GRID_RESOLUTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </ResolutionSelect>
    </>
  );
}
