import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import styled from "styled-components";

export const InfoPage = styled.main`
  box-sizing: border-box;
  width: min(90%, 760px);
  margin: 0 auto;
  padding: clamp(48px, 8vw, 96px) 0;
  line-height: 1.65;
`;

export const PageHeading = styled.h1`
  margin: 0 0 32px;
  font-size: clamp(1.8rem, 6vw, 3.5rem);
  line-height: 1;
`;

export const Copy = styled.p`
  max-width: 68ch;
  margin: 0 0 20px;
  font-size: 0.9rem;
`;

const BackLink = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  width: max-content;
  margin: 80px 0 0;
  padding: 6px 10px;
  border: 2px solid var(--black);
  border-radius: 3px;
  background: none;
  color: var(--black);
  font-size: 0.8rem;
  text-decoration: none;
  text-transform: uppercase;
  transition: background-color 120ms ease;

  &:hover {
    background-color: var(--main-light);
  }

  &:focus-visible {
    outline: 1px dotted currentColor;
    outline-offset: 4px;
  }
`;

export function BackToApp() {
  return (
    <BackLink href="/">
      <FontAwesomeIcon icon={faPlay} />
      Back to the app
    </BackLink>
  );
}
