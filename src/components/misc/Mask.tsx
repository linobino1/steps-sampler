import styled, { createGlobalStyle } from "styled-components";

const ScrollLock = createGlobalStyle<{ $unsupported: boolean }>`
  body {
    overflow: ${(props) => props.$unsupported ? "hidden" : "auto"};
  }

  @media only screen and (max-width: 800px) and (orientation: landscape) {
    body {
      overflow: hidden;
    }
  }
`;

const BlockingMask = styled.div<{ $unsupported: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 2;
  background-color: #cc5577;
  background-image: url("/mask-pattern.svg");
  background-attachment: fixed;
  background-size: cover;
  text-align: center;
  font-size: 1.5rem;
  display: ${(props) => props.$unsupported ? "grid" : "none"};
  place-items: center;

  @media only screen and (max-width: 800px) and (orientation: landscape) {
    display: grid;
  }
`;

const RotateMessage = styled.div<{ $unsupported: boolean }>`
  display: none;

  @media only screen and (max-width: 800px) and (orientation: landscape) {
    display: ${(props) => props.$unsupported ? "none" : "block"};
  }
`;

const UnsupportedMessage = styled.div<{ $unsupported: boolean }>`
  display: ${(props) => props.$unsupported ? "block" : "none"};
`;

export default function Mask() {
  const unsupported = !("AudioContext" in globalThis) &&
    !("webkitAudioContext" in globalThis);

  return (
    <>
      <ScrollLock $unsupported={unsupported} />
      <BlockingMask $unsupported={unsupported}>
        <UnsupportedMessage $unsupported={unsupported}>
          Web Audio is not supported by this browser
        </UnsupportedMessage>
        <RotateMessage $unsupported={unsupported}>
          rotate your device to portrait mode
        </RotateMessage>
      </BlockingMask>
    </>
  );
}
