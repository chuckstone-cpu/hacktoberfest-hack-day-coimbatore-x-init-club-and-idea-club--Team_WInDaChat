# CONNECTORE (formerly newNectore)

Connectore is a local-first, AI-powered knowledge management system for students. It takes scattered notes and transforms them into a cohesive, structured knowledge graph by discovering hidden conceptual relationships between subjects.

## Features

1. **Note Management**: Create and manage notes with rich text formatting.
2. **AI Entity & Concept Extraction**: Automatically extracts entities and patterns using a local Gemma 4 LLM.
3. **Knowledge Graph**: Visually represents cross-subject knowledge connections using `react-force-graph-2d` with interactive, brutalist-styled text nodes and reasoning tooltips.
4. **Relationship Discovery**: Instead of keyword matching, Gemma actively reasons about *why* notes are related (e.g., `causes`, `same_idea`) and assigns a strength score.
5. **Local First**: Built to run entirely locally using Ollama, maintaining complete privacy.
6. **Graceful Fallbacks**: If the AI model is unavailable or encounters a hardware crash, the system immediately switches to fallback mock generation so the UI remains completely functional.

## Tech Stack

**Frontend**:
- React 19
- Vite
- Tailwind CSS v4
- react-force-graph-2d
- Lucide React

**Backend**:
- Node.js
- Express
- SQLite (via `better-sqlite3`)
- Ollama Node.js SDK (Gemma 4)
- Zod

## Getting Started

### Prerequisites
- Node.js 20+
- Ollama installed locally with `gemma4:e4b` model (or configure `.env` to use another model).

### Installation

1. **Install Dependencies**:
```bash
npm install
cd client && npm install
cd ../server && npm install
```

2. **Database Setup**:
```bash
cd server
node scripts/seed.js
```
This will initialize the SQLite database (`nectore.db`) and inject the initial deterministic demo dataset mapping concepts across Control Systems, Biology, Networks, OS, and Economics.

3. **Run the Application**:
```bash
# At the root directory
npm run dev
```
This concurrently starts the Vite frontend on `http://localhost:5173` and the Express backend on `http://localhost:3001`.

## Architecture
- **Brutalist UI**: Features high-contrast neon accents, glassmorphism elements, marquee hover effects, and magnetic interactions for a premium, award-winning aesthetic.
- **Batched Relationship Reasoning**: Resolves the N+1 AI problem by using a deterministic SQL shortlist to filter candidates, sending a single batched prompt to Gemma to judge relationships.
- **Robust Error Handling**: Employs a 5-minute proxy timeout and robust pipeline fallbacks to handle unpredictable LLM generation times or local CUDA errors.
