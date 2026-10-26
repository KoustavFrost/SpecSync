# SpecSync ⚡

> **Automated AI-powered OpenAPI contracts and documentation synchronization for every pull request.**

SpecSync analyzes git diffs on pull requests, detects new or updated API endpoints across any programming language (Node.js, FastAPI, Go, Django, Spring, etc.), and automatically keeps your `openapi.yaml` and `API.md` in sync.

---

## ✨ Features

- **Framework-Agnostic Detection:** Works across TypeScript, Python, Go, Java, Rust, Ruby, and more.
- **Dual Output:** Maintains both a machine-readable **OpenAPI 3.1** specification (`openapi.yaml`) and clean **Markdown** documentation (`API.md`).
- **Zero Hallucination Loss:** Programmatic AST merging ensures existing endpoints, descriptions, and servers are never accidentally dropped.
- **Bring-Your-Own-Key (BYOK):** Use Google Gemini (100% free tier via Google AI Studio), OpenAI, or Groq.
- **Zero-Config by Default:** Works out of the box with sensible defaults, or customizable via `.github/spec-sync.yml`.
- **Direct Commit & Graceful Fallback:** Automatically commits updates to the PR branch or posts a PR review comment if branch protection restricts direct pushes.

---

## 🚀 Quickstart: GitHub Action

Add the following workflow to `.github/workflows/spec-sync.yml` in your repository:

```yaml
name: SpecSync API Contracts

on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: write
  pull-requests: write

jobs:
  sync-specs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run SpecSync
        uses: KoustavFrost/SpecSync@main
        with:
          # Free key from Google AI Studio (no credit card needed):
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
          # Or use OpenAI:
          # openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          # llm_provider: 'openai'
          spec_path: 'openapi.yaml'
          docs_path: 'API.md'
          auto_commit: 'true'
```

---

## 💻 Local CLI Usage

You can also run SpecSync locally on your machine to preview or sync API changes before committing:

```bash
# Sync changes against main branch
export GEMINI_API_KEY="your-gemini-key"
npx spec-sync sync --base main

# Or sync staged changes only
npx spec-sync sync --staged

# Preview changes without modifying files (Dry Run)
npx spec-sync sync --dry-run
```

---

## ⚙️ Configuration (Optional)

You can customize behavior with an optional `.github/spec-sync.yml` file:

```yaml
spec:
  path: "openapi.yaml"
  format: "openapi_3.1"
  auto_create: true

docs:
  enabled: true
  path: "API.md"

llm:
  provider: "gemini" # gemini | openai | groq
  model: "gemini-1.5-flash"

delivery:
  mode: "commit" # commit | comment
  commit_message: "chore(api): update openapi spec and documentation [skip ci]"

ignore:
  - "frontend/**"
  - "**/*.test.*"
```

---

## 📄 License

MIT
