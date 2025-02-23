# The Last Question (2025)

This is an attempt to build an interactive storytelling experience around "The
Last Question" by Isaac Asimov.

It uses the [Conversational AI API from
ElevenLabs](https://elevenlabs.io/docs/conversational-ai/overview) and lets you
chat to an AI agent that has the context of the book. The agent acts as the
narrator and can answer questions about the book.

## Setup

```bash
cp .env.example .env.local
npm i
npm run dev
```

## Possible improvements

- [x] Generate images for the AI responses
- [ ] Add way to pause and resume the same conversation
- [ ] Add textual reply options (not via microphone)

## License

MIT(LICENSE).
