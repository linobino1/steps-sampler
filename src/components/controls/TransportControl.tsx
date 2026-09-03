import { useEffect, useState } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faStop } from "@fortawesome/free-solid-svg-icons";
import { getTransport } from "tone";
import SequencerService from "../../services/transport/sequencer.ts";

const TransportButton = styled.button<{ $playing: boolean }>`
  background: ${(props) => props.$playing ? "var(--main)" : "initial"};
  color: ${(props) => props.$playing ? "var(--white)" : "initial"};

  && {
    box-sizing: content-box;
    height: 27px;
  }
`;

export default function TransportControl() {
  const [isPlaying, setIsPlaying] = useState(
    getTransport().state === "started",
  );

  useEffect(() => {
    const transport = getTransport();
    const showPlaying = () => setIsPlaying(true);
    const showStopped = () => setIsPlaying(false);

    transport.on("start", showPlaying);
    transport.on("stop", showStopped);
    transport.on("pause", showStopped);

    return () => {
      transport.off("start", showPlaying);
      transport.off("stop", showStopped);
      transport.off("pause", showStopped);
    };
  }, []);

  function toggleTransport() {
    SequencerService.toggleTransport();
    const activeElement = document.activeElement as HTMLInputElement;
    if ("blur" in activeElement) {
      activeElement.blur(); // Avoid cross-canceling with the spacebar listener.
    }
  }

  return (
    <TransportButton
      type="button"
      $playing={isPlaying}
      aria-pressed={isPlaying}
      onClick={toggleTransport}
    >
      <FontAwesomeIcon icon={faPlay} /> <span />
      <FontAwesomeIcon icon={faStop} />
    </TransportButton>
  );
}
