import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { useShallow } from "zustand/shallow";
import {
  GRID_SIGNATURES,
  type GridSignature,
} from "../../services/transport/time.ts";
import useToneStore from "../../store/store.ts";

const SignatureControl = styled.div`
  align-items: center;
  display: grid;
  position: relative;

  select {
    appearance: none;
    background: none;
    border: 2px solid var(--black);
    border-radius: 6px;
    box-sizing: border-box;
    color: var(--black);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: bold;
    height: 26px;
    padding: 0 14px 0 5px;
    grid-area: 1 / 1;

    &:hover {
      background: var(--main-light);
    }
  }
`;

const SignatureCaret = styled(FontAwesomeIcon)`
  align-self: center;
  font-size: 10px;
  grid-area: 1 / 1;
  justify-self: end;
  margin-right: 5px;
  pointer-events: none;
`;

export default function TimeSignatureControl() {
  const [signature, setSignature] = useToneStore(
    useShallow((state) => [state.signature, state.setGridSignature]),
  );

  return (
    <SignatureControl>
      <select
        aria-label="Time signature"
        value={signature}
        onChange={(event) => setSignature(event.target.value as GridSignature)}
      >
        {GRID_SIGNATURES.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <SignatureCaret icon={faCaretDown} aria-hidden="true" />
    </SignatureControl>
  );
}
