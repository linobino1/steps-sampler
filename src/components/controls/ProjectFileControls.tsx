import { type ChangeEvent, useRef, useState } from "react";
import styled from "styled-components";
import {
  loadProjectFile,
  saveProjectFile,
} from "../../services/projects/projectFile.ts";

const ProjectActions = styled.div`
  position: relative;
  display: flex;

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    clip-path: inset(50%);
  }
`;

const ProjectError = styled.span`
  position: absolute;
  z-index: 2;
  top: calc(100% + 8px);
  right: 0;
  width: max-content;
  max-width: min(360px, calc(100vw - 20px));
  border: 2px solid var(--black);
  border-radius: 4px;
  padding: 6px 8px;
  background: #dbd6f2;
  color: #8c1823;
  font-size: 0.7rem;
`;

export default function ProjectFileControls() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function saveProject() {
    setSaving(true);
    setError(undefined);
    try {
      await saveProjectFile();
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) {
        setError(getErrorMessage(cause));
      }
    } finally {
      setSaving(false);
    }
  }

  async function loadProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!globalThis.confirm("Replace the current project with this file?")) {
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      await loadProjectFile(file);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProjectActions>
      <button
        type="button"
        aria-label="Save project"
        disabled={saving}
        onClick={saveProject}
      >
        {saving ? "Saving..." : "Save"}
      </button>
      <button
        type="button"
        aria-label="Load project"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? "Loading..." : "Load"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".steps"
        aria-label="Choose a Steps project file"
        onChange={loadProject}
      />
      {error && <ProjectError role="alert">{error}</ProjectError>}
    </ProjectActions>
  );
}

function getErrorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : "The project could not load.";
}
