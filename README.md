# Connectore

> A local-first second brain. Gemma 4 connects your scattered notes across subjects, narrates them as a story, checks its own story against your notes for dropped facts, and includes a lab that measures how far Gemma's KV cache can be compressed before it starts forgetting things.

## Team

**Team Name:** WInDaChat


| Member | Contribution   |
| ------ | -------------- |
| V Aravindhan | [Contribution] |
| Siva Krithick | [Contribution] |
| Sahesh Karthikeyan | [Contribution] |
| Sathyanarayanan | [Contribution] |


## Problem Statement

### The Problem

Students and curious readers take notes in silos: Control Systems notes in one place, Computer Networks in another, news in a third. The most valuable insight is often the link between them. Negative feedback in a control loop, TCP congestion control and the RBI raising the repo rate to curb inflation are all the same idea: a feedback loop. Nobody sees that link, because the notes share almost no words.

AI summaries have a trust problem of their own. Published studies report that LLM summaries tend to drop caveats and overgeneralise (Peters & Chin-Yee, Royal Society Open Science, 2025). An EBU/BBC study of AI assistants answering news questions found significant issues in 45% of answers (AIB summary, 2025). A fluent summary is not necessarily a faithful one.

Running models locally has a memory problem. Long prompts, such as "tell me the story of my last 30 notes", make the KV cache grow until it competes with the model weights for RAM and VRAM. KV-cache quantization (q8 / q4) saves memory, but community benchmarks report that Gemma 4 is unusually sensitive to it (LocalBench). "Just use q4" may quietly cost accuracy.

### Why We Chose This Problem

We are students. We wanted a tool we would use ourselves, one that turns a semester of disconnected notes into connected understanding. We also wanted it to be honest about its own output and able to run on the hardware students actually own. One open-weight model, Gemma 4, does all three jobs: it reasons about connections, audits its own summaries, and is the subject of our compression experiment.

## Solution

connectore has three parts, all built on one local Gemma 4 model.

Connect. You write a note. Gemma 4 tags it with entities and abstract patterns (e.g. feedback loop, trade-off, bottleneck), shortlists related older notes, and judges each candidate. The result is a typed link (causes, consequence_of, continuation, contradicts, same_idea), a strength from 1 to 5, and a one-line reason citing a shared fact. Only strong links (≥ 4) are kept. Linked notes form threads, and Gemma can narrate any thread as a short story.
Verify. Before you trust a story or a summary, a verification layer inspired by TrueSimple checks it against the source notes:
Deterministic cue diff: numbers, units, dates, negations (not, never), conditions (unless, only if) and bounds (at least, up to) are compared between source and output.
Fact quiz: Gemma extracts must-keep facts from the sources, then answers a question about each fact using only the generated text. A "not stated" answer means the fact may have been dropped.
Each fact is marked Appears preserved, Needs review or Possible mismatch, with the source span shown next to it.
Compress (KV Lab). The same story-plus-verify workload runs with Gemma's KV cache at f16, q8_0 and q4_0. The lab records memory, speed and how many facts survive. The question it answers is how much memory can be saved before the model starts forgetting facts.

### Key Features

- One input box. No folders, tags or manual linking.
- Cross-subject links with a typed relation and a human-readable reason.
- A thread view and an on-demand story mode.
- A faithfulness report on every story, with per-fact evidence and no blanket "verified" badge.
- KV Cache Lab: memory, tokens/s and fact retention across KV-cache precisions, measured on real hardware.
- Fully local through Ollama, with structured JSON outputs validated by Pydantic.

## Innovation and Differentiation

Reasoned links instead of similarity scores. Tools like Obsidian Smart Connections, Mem and Reflect surface "related notes" by embedding similarity. newNectore explains why two notes relate and how (cause, contradiction, same mechanism). It can find cross-domain links that share no vocabulary, because the tagging step extracts abstract patterns, not just keywords.

An AI that audits itself. Most note apps hand you an AI summary and ask for trust. newNectore shows which facts from your notes survived in the summary and flags the ones that may not have.
One metric that ties it together. We reuse the fact-preservation check as the quality metric for KV-cache compression. Instead of reporting only abstract numbers like KL divergence, the lab asks a user-level question: did compressing the cache make Gemma drop a fact from your notes?
Built for student hardware. Gemma 4 E4B runs on a laptop. The KV Lab shows the memory/quality trade-off on the actual machine running the app.

## Technical Implementation

### Architecture

[Add the system architecture or workflow Mermaid diagram here.]

### Technology Stack


| Category        | Technologies                |
| --------------- | --------------------------- |
| Frontend        | [Technologies / N/A]        |
| Backend         | [Technologies / N/A]        |
| Database        | [Technologies / N/A]        |
| AI / ML         | [Models / frameworks / N/A] |
| Infrastructure  | [Technologies / N/A]        |
| APIs / Services | [Services / N/A]            |


If a category or technology is not implemented in the project, specify `N/A` instead of leaving the field blank.

### How It Works

[Explain the major components of the system and how they interact.]

### Technical Decisions

[Explain important architectural, algorithmic, or engineering decisions made during development.]

## Implementation During the Hackathon

[Describe what the team built during the Hack Day and the major functionality or components completed during the event.]

### Team Contributions

- **[Member Name]:** [Contribution]
- **[Member Name]:** [Contribution]
- **[Member Name]:** [Contribution]
- **[Member Name]:** [Contribution]

## Working Application

**Live Application:** [Live URL]

[Briefly explain how the deployed application can be accessed and what functionality can be tested.]

The submitted application should be functional and accessible through the provided link where applicable.

## Demo Video

**Demo Video:** [Video URL]

[Provide a short demonstration of the working project, covering the main user flow and important functionality.]

## Open Source and AI Usage

### AI / Models

- **[Model]:** [How it is used]

### Open Source Components

- **[Library / Framework]:** [Purpose]
- **[Dataset]:** [Purpose]
- **[API / Service]:** [Purpose]

[Include relevant licenses, attribution, and acknowledgements for external components.]

## Setup and Usage

### Prerequisites

- [Requirement]
- [Requirement]

### Installation

```bash
git clone [repository-url]
cd [project-directory]
[installation-command]
```

### Environment Variables

```env
[VARIABLE_NAME]=[value]
```



### Running the Project

```bash
[run-command]
```

### Usage

[Explain the basic steps required to use the project.]

## Devpost Submission

**Devpost Project:** [Devpost Project URL]

[Add the link to the team's Devpost submission. Ensure the Devpost project page is complete and contains the required project information, links, media, and team details.]

## Credits and License

### Credits

[Credit libraries, frameworks, datasets, models, APIs, contributors, and other external resources used.]

### License

[License name and/or link.]

## Submission Checklist

- [ ] Project title and description added
- [ ] All team members listed
- [ ] Problem clearly explained
- [ ] Reason for choosing the problem explained
- [ ] Solution and key features documented
- [ ] Innovation and differentiation explained
- [ ] Architecture included
- [ ] Technical implementation documented
- [ ] Work completed during the hackathon documented
- [ ] Team contributions documented
- [ ] Working application is functional
- [ ] Live application link added where applicable
- [ ] Demo video added
- [ ] AI and open-source components documented
- [ ] Setup and usage instructions tested
- [ ] Challenges and learnings documented
- [ ] Devpost submission completed
- [ ] Devpost link added
- [ ] Credits added
- [ ] License added
- [ ] Repository is organized and complete
