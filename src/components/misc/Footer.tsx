import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink } from "@fortawesome/free-solid-svg-icons";

const FooterFrame = styled.footer`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  min-height: 32px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  font-size: 0.7rem;
`;

const FooterLink = styled.a`
  color: rgba(0, 0, 0, 0.42);
  text-decoration: none;
  transition: color 120ms ease;
  display: flex;
  gap: 6px;

  &:hover,
  &:focus-visible {
    color: rgba(0, 0, 0, 0.75);
  }

  &:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }
`;

export default function Footer() {
  return (
    <FooterFrame>
      <FooterLink href="/about">About</FooterLink>
      <FooterLink href="/legal">Legal</FooterLink>
      <FooterLink
        href="https://github.com/linobino1/steps-sampler"
        target="_blank"
        rel="noreferrer"
      >
        GitHub
        <FontAwesomeIcon icon={faExternalLink} widthAuto />
      </FooterLink>
    </FooterFrame>
  );
}
