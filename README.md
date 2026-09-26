# RAG Compliance Copilot — Frontend

React + Vite frontend for the RAG Compliance Copilot.

## Features

- Upload PDF reports
- Select an indexed document or query across all documents
- Ask grounded compliance/ESG questions
- Display generated answers with page-level source chunks
- Delete indexed documents
- Client-side validation for PDF type and 25 MB upload limit
- Production configuration through `VITE_API_URL`

## Local development

Install dependencies:

```bash
npm install
```

Create `.env.local` if the backend is not running on the default local URL:

```env
VITE_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

The frontend expects the backend API to expose:

- `GET /documents`
- `POST /ingest`
- `POST /query`
- `DELETE /documents/{document_id}`

## Production build

Build the production bundle:

```bash
npm run build
```

Preview the generated production build locally:

```bash
npm run preview
```

Vite writes the production bundle to `dist/`.

For the deployed application, set `VITE_API_URL` to the deployed backend URL in the hosting provider's environment settings before building.

## Deployment

The frontend is deployed as a Vite static application. The production deployment uses the same React source as this repository and connects to the deployed FastAPI backend.

Backend repository:

https://github.com/Kirtan5928/rag-compliance-copilot
