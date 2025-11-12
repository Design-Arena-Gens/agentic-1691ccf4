# Agentic Google Drive → YouTube Uploader

Ship videos to YouTube in one flow: source from Google Drive, synthesize viral metadata with AI, and push to your channel programmatically.

## Features

- OAuth handshake to access Google Drive and YouTube using your credentials
- Drive browser for the 25 most recent video assets
- AI prompt to generate titles, descriptions, and hashtag stacks (OpenAI Responses API)
- One-click upload to YouTube with privacy control and optional scheduled publish
- All tokens kept in an httpOnly cookie on the same origin

## Quickstart

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables** – copy `.env.example` to `.env.local` and fill in:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
   - `OPENAI_API_KEY`

3. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) and kick off the OAuth flow.

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Deployment (Vercel)

The project is optimized for Vercel. After setting the env vars in your Vercel project, deploy:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-1691ccf4
```

## Tech Stack

- Next.js 14 (App Router, Server Actions ready)
- React 18 with client components
- Google APIs Node SDK (`googleapis`)
- OpenAI SDK (Responses API)

## Authentication Notes

- Update `GOOGLE_REDIRECT_URI` to point to `/api/google/callback` on the deployed domain.
- To rotate credentials, clear the `g_tokens` cookie or hit the sign-out button in the UI.

## License

MIT © 2024. Customize freely for your workflow.
