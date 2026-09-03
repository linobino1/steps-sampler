import { useEffect, useState } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faStop } from "@fortawesome/free-solid-svg-icons";
import { Transport } from "tone";
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
  const [isPlaying, setIsPlaying] = useState(Transport.state === "started");

  useEffect(() => {
    const showPlaying = () => setIsPlaying(true);
    const showStopped = () => setIsPlaying(false);

    Transport.on("start", showPlaying);
    Transport.on("stop", showStopped);
    Transport.on("pause", showStopped);

    return () => {
      Transport.off("start", showPlaying);
      Transport.off("stop", showStopped);
      Transport.off("pause", showStopped);
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
