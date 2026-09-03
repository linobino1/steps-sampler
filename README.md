# STePs sequencer & sampler

STePs is a simple tool for creating basic 1-4 bar rhythms using pre-recorded
drum sounds and samples that can be easily recorded intended to be used in the
classroom.

This project is live at https://steps-sampler.de

## Implementation

Audio sequencing and playback are powered by
[Tone.js](https://tonejs.github.io/), which wraps the browser's Web Audio API.
The [React](https://react.dev/) UI is bundled with [Vite](https://vite.dev/).

## License

See [the licensing overview](LICENSE.md) for the separate terms covering the
source code, audio files, and partner logos.

### Browser Compatibility

Production builds contain both a modern bundle and a transpiled legacy bundle
with usage-based JavaScript polyfills. The supported browser versions are
defined in `package.json` under `browserslist`. Browser APIs such as Web Audio,
microphone access, and `MediaRecorder` cannot be polyfilled.

## Development Environment

We're using the [Deno](https://deno.com) runtime.

```sh
deno install
deno task start

deno test   # runs unit test
deno check  # typecheck
deno lint   # linter
deno fmt    # code formatting
```

```
```

### iOS Development

For development on iOS, the app must be served over HTTPS, otherwise microphone
access will not be granted. We're using a Cloudflare Tunnel to provide a secure
URL for the local development server. Alternatively you could set up your own
certificate with the vite dev server and set that up on your iOS device.
