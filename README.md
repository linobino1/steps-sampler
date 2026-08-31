# steps-sampler

Simple Sequencing Tool for Classroom Setting. Create basic 1-4 bar rhythms.

This project is live at https://steps-sampler.de

## Implementation

This is a `react` project using `Tone.js` to access and manipulate the browsers'
`Web Audio Api`

Production builds contain both a modern bundle and a transpiled legacy bundle
with usage-based JavaScript polyfills. The supported browser versions are
defined in `package.json` under `browserslist`. Browser APIs such as Web Audio,
microphone access, and `MediaRecorder` cannot be polyfilled.

## Development Environment

We're using the Deno runtime.

### iOS Development

For development on iOS, the app must be served over HTTPS. We'll use a
Cloudflare Tunnel to provide a secure URL for the local development server.
