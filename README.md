# contextkit

A tiny CLI (`ctx`) for keeping a persistent `context.md` file that AI coding agents read at the start of every session and append to as work happens.

It solves one problem: **AI agents forget everything between sessions.** Instead of re-explaining your project, decisions, and known issues each time, you keep a single Markdown file in your repo. The agent reads it on startup. When something meaningful happens, it logs an entry. When the log gets long, you compress it with one command.

No daemon, no database, no cloud. Just a Markdown file and four commands.

---

## Install

```bash
npm install -g contextkit
```

Or one-shot via npx:

```bash
npx contextkit init
```

Requires Node 18+.

---

## Quick start

```bash
cd my-project
ctx init                                 # scaffold context.md
# ...edit the Project / Stack / Decisions sections...
ctx append "Switched auth from Supabase to Clerk"
ctx append "Wired Stripe checkout, webhook still TODO"
ctx diff                                 # see what changed
ctx compress                             # summarize the log when it gets long
```

Then tell your agent (e.g. in `CLAUDE.md` or system prompt) to read `context.md` at session start and run `ctx append` as it works.

---

## What `context.md` looks like

`ctx init` writes this template:

```markdown
# Project Context

## Project
_What this project is, who it's for, current status._

## Stack
_Languages, frameworks, key libraries, infra._

## Current Sprint
_What's being worked on right now._

## Decisions
_Architectural choices and the reasoning behind them. Append, don't rewrite._

## Known Issues
_Bugs, tech debt, and gotchas to remember._

## Agent Instructions
_How AI agents should behave in this project: tone, conventions, things to avoid._

## Log
_Timestamped entries from past sessions. Most recent at the bottom._
```

You fill in the top sections yourself (or let an agent do it). The `## Log` section grows over time via `ctx append`.

---

## Commands

### `ctx init`

Creates `context.md` in the current directory from the built-in template. Aborts if `context.md` already exists — it will never overwrite.

```bash
ctx init
# → Created /path/to/cwd/context.md
```

### `ctx append "<message>"`

Appends a timestamped entry to the `## Log` section. Creates the section if missing.

```bash
ctx append "Refactored auth middleware to use Clerk session tokens"
# → - [2026-06-05 14:32] Refactored auth middleware to use Clerk session tokens
```

Format: `- [YYYY-MM-DD HH:mm] <message>`. Most recent entries land at the bottom.

### `ctx compress`

Calls Claude Sonnet (`claude-sonnet-4-20250514`) to summarize the `## Log` section into a tight bullet list, preserving decisions, file changes, and completed features while dropping redundant chatter. Replaces the log body with the summary plus a `_Compressed <date>_` marker. All other sections are left untouched.

Run it when the log is getting unwieldy — every few weeks, or after a big sprint.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
ctx compress
# → Compressing log section...
# → Log compressed.
```

Requires `ANTHROPIC_API_KEY` in your environment.

### `ctx diff`

Shows `git diff context.md` so you can see what's changed since the last commit. If you're not inside a git repo, it falls back to printing the last 20 log entries instead.

```bash
ctx diff
```

---

## How to use it with an AI agent

The whole point is to make the agent do the work. Add something like this to your `CLAUDE.md`, `.cursorrules`, or system prompt:

```
This project uses contextkit. At the start of every session:

  1. Read ./context.md end to end. Treat it as the source of truth for
     project state, decisions, and conventions.
  2. As you complete meaningful work (new file, completed feature, decision
     made, bug found), run: ctx append "<terse summary>"
  3. Do not rewrite context.md by hand — only append via the CLI.
  4. If the ## Log section is more than ~100 entries, suggest running
     `ctx compress`.
```

That's the entire workflow. The agent reads, the agent appends, you occasionally compress.

---

## Project layout

```
contextkit/
├── bin/
│   └── ctx.js              # CLI entry point (commander)
├── src/commands/
│   ├── init.js             # scaffold context.md
│   ├── append.js           # timestamped log entry
│   ├── compress.js         # LLM-summarize ## Log
│   └── diff.js             # git diff or last 20 entries
├── templates/
│   └── default.md          # the starter context.md
├── package.json
└── README.md
```

~250 lines of plain JavaScript. Two dependencies: `commander`, `@anthropic-ai/sdk`.

---

## Design choices

- **Markdown, not JSON.** The file is meant to be read by humans and agents alike. Markdown sections are the right granularity.
- **Append-only log.** History is preserved until you explicitly compress. No silent edits, no lost decisions.
- **No config file.** Everything is in `context.md`. The CLI has no state of its own.
- **Compression is opt-in.** The Anthropic API call only happens when you run `ctx compress`. The other commands are offline and free.
- **Single file per project.** Drop it in your repo, commit it, treat it like any other doc.

---

## License

MIT.
