import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type FormEvent, useRef, useState } from "react";
import styled from "styled-components";
import {
  type AudioFormat,
  recordAudio,
} from "../../services/exports/audioExport.ts";

const TriggerButton = styled.button`
  background: var(--black);
  color: var(--white);
`;

const ExportDialog = styled.dialog`
  width: min(380px, calc(100vw - 32px));
  box-sizing: border-box;
  border: 2px solid var(--black);
  border-radius: 4px;
  padding: 0;
  color: var(--black);
  background: #dbd6f2;
  box-shadow: 4px 4px 0 var(--black);

  &::backdrop {
    background: rgba(0, 0, 0, 0.55);
  }
`;

const DialogForm = styled.form`
  display: grid;
  gap: 24px;
  padding: 32px;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    text-transform: uppercase;
  }

  fieldset {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 0;
    padding: 0;
    border: 0;
  }

  legend {
    margin-bottom: 8px;
  }
`;

const RepetitionsLabel = styled.label`
  display: grid;
  gap: 8px;

  input {
    box-sizing: border-box;
    width: 100%;
    border: 2px solid var(--black);
    border-radius: 6px;
    padding: 6px 8px;
    background: var(--white);
    color: var(--black);
    font: inherit;
  }
`;

const FormatLabel = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid var(--black);
  border-radius: 6px;
  padding: 6px 8px;
  background: var(--white);
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
  }

  &:focus-within {
    outline: -webkit-focus-ring-color auto 1px;
  }

  &[data-selected="true"] {
    background: var(--black);
    color: var(--white);
  }
`;

const FormatIndicator = styled.span`
  display: grid;
  flex: none;
  width: 1em;
  height: 1em;
  place-items: center;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;

  button {
    min-height: 36px;
    border-width: 2px;
    padding: 6px 12px;
  }

  button[type="submit"] {
    min-height: 42px;
    padding: 8px 18px;
    background: var(--black);
    color: var(--white);
    font-size: 0.9rem;
  }

  button[type="button"] {
    border: 0;

    &:disabled {
      background: none;
      color: var(--black);
    }
  }
`;

const DialogError = styled.p`
  margin: -8px 0 0;
  color: #8c1823;
  font-size: 0.75rem;
`;

export default function AudioExportDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const [repetitions, setRepetitions] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  function openDialog() {
    setError(false);
    dialogRef.current?.showModal();
  }

  async function saveAudio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(false);
    try {
      await recordAudio(format, repetitions);
      dialogRef.current?.close();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TriggerButton onClick={openDialog}>Save Audio</TriggerButton>
      <ExportDialog
        ref={dialogRef}
        aria-labelledby="audio-export-title"
        onCancel={(event) => saving && event.preventDefault()}
        onClick={(event) => {
          if (!saving && event.target === event.currentTarget) {
            dialogRef.current?.close();
          }
        }}
      >
        <DialogForm onSubmit={saveAudio}>
          <h2 id="audio-export-title">Save Audio</h2>
          <RepetitionsLabel>
            Repetitions
            <input
              type="number"
              min="1"
              max="99"
              value={repetitions}
              disabled={saving}
              onChange={(event) =>
                setRepetitions(Math.max(
                  1,
                  Math.min(99, event.currentTarget.valueAsNumber || 1),
                ))}
            />
          </RepetitionsLabel>
          <fieldset disabled={saving}>
            <legend>Format</legend>
            {(["mp3", "wav"] as const).map((option) => (
              <FormatLabel
                key={option}
                data-selected={format === option}
              >
                <input
                  type="radio"
                  name="audio-format"
                  value={option}
                  checked={format === option}
                  onChange={() => setFormat(option)}
                />
                <FormatIndicator aria-hidden="true">
                  {format === option && <FontAwesomeIcon icon={faCheck} />}
                </FormatIndicator>
                {`.${option}`}
              </FormatLabel>
            ))}
          </fieldset>
          {error && (
            <DialogError role="alert">
              Audio export failed. Please try again.
            </DialogError>
          )}
          <DialogActions>
            <button
              type="button"
              disabled={saving}
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Preparing..." : "Download"}
            </button>
          </DialogActions>
        </DialogForm>
      </ExportDialog>
    </>
  );
}
