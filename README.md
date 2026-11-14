# SpecSync ⚡

[![GitHub Action](https://img.shields.io/badge/GitHub%20Action-SpecSync-blue?logo=githubactions&logoColor=white)](https://github.com/KoustavFrost/SpecSync)
[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI-3.1.0-green.svg?logo=openapiinitiative&logoColor=white)](https://spec.openapis.org/oas/v3.1.0)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Automated AI-powered OpenAPI contracts and documentation synchronization for every pull request.**

SpecSync eliminates API documentation drift. Whenever a pull request touches your backend routes, SpecSync analyzes the code diff, identifies new or modified endpoints, safely merges them into your `openapi.yaml`, and keeps your human-readable `API.md` up to date—committing the changes directly back to your PR branch.

---

## ✨ Why SpecSync?

- **Language & Framework Agnostic:** Detects endpoints across Node.js (Express, Fastify, NestJS), Python (FastAPI, Flask, Django), Go (Gin, Echo), Java (Spring Boot), Rust, Ruby, and more.
- **Zero Hallucination Loss (AST Merging):** Never lets the LLM blindly rewrite the whole file. Changes are programmatically merged into your existing OpenAPI 3.1 AST, preserving all existing servers, tags, models, and descriptions.
- **Dual Output:** Simultaneously maintains machine-readable **`openapi.yaml`** and clean, human-readable **`API.md`**.
- **100% Free / Bring-Your-Own-Key (BYOK):** Use Google Gemini's free tier via Google AI Studio (no credit card needed), OpenAI, or Groq.
- **Privacy-First:** Code diffs are sent directly from your GitHub runner to your chosen LLM provider. No middleman servers, no third-party database.
- **Graceful Delivery:** Auto-commits directly to the PR branch, with automatic fallback to PR review comments if branch protection rules restrict bot pushes.

---

## 🚀 Setting Up in GitHub Actions (Public & Private Repos)

Follow these 4 simple steps to add SpecSync to any GitHub repository:

### Step 1: Get an LLM API Key

You can use any of the following providers:

* **Google Gemini (Recommended — 100% Free Tier):**
  1. Go to **[aistudio.google.com](https://aistudio.google.com)**.
  2. Click **"Get API key"** ➔ **"Create API key in new project"** *(keep it in an unbilled project to use the permanent free tier with no credit card required)*.
* **OpenAI:** Get a key from [platform.openai.com](https://platform.openai.com).
* **Groq:** Get a fast, free key from [console.groq.com](https://console.groq.com).

---

### Step 2: Add the Secret to Your GitHub Repository

1. Open your repository on GitHub.
2. Go to **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Click **"New repository secret"**.
4. Set the **Name** to `GEMINI_API_KEY` (or `OPENAI_API_KEY` / `GROQ_API_KEY`).
5. Paste your API key in **Secret** and click **Add secret**.

---

### Step 3: Enable Workflow Write Permissions (Crucial!)

By default, GitHub restricts GitHub Actions from pushing commits back to your repository. You must grant write permissions:

1. Go to your repository's **Settings** ➔ **Actions** ➔ **General**.
2. Scroll down to **Workflow permissions**.
3. Select **"Read and write permissions"**.
4. *(Optional but recommended)* Check **"Allow GitHub Actions to create and approve pull requests"**.
5. Click **Save**.

> [!IMPORTANT]
> **Private Repositories:** Work identically to public repositories. SpecSync runs entirely inside your runner using GitHub's temporary `GITHUB_TOKEN`. Your code stays completely within your repository environment.
>
> **Public Repositories & Forks:** When a pull request is submitted from an external fork, GitHub automatically restricts `GITHUB_TOKEN` to read-only for security. SpecSync gracefully detects this and posts the updated endpoints as a **PR review comment** instead of failing.

---

### Step 4: Create the Workflow File

Create a file at `.github/workflows/spec-sync.yml` in your repository:

```yaml
name: SpecSync API Contracts

on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: write
  pull-requests: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required to extract git diff against the base branch

      - name: Run SpecSync
        uses: KoustavFrost/SpecSync@main
        with:
          # Google Gemini (Default free tier):
          gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
          
          # Or if using OpenAI:
          # openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          # llm_provider: 'openai'
          
          # Or if using Groq:
          # groq_api_key: ${{ secrets.GROQ_API_KEY }}
          # llm_provider: 'groq'

          spec_path: 'openapi.yaml'
          docs_path: 'API.md'
          auto_commit: 'true'
```

Once pushed, every new PR will automatically have its API contracts and documentation updated!

---

## 🔑 Environment Variables & Secrets Reference

| Secret / Env Var | Description | Required? |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key from Google AI Studio | Required if using Gemini |
| `GEMINI_MODEL` | Custom Gemini model name (defaults to `gemini-3.8-flash`) | Optional |
| `OPENAI_API_KEY` | OpenAI API key | Required if using OpenAI |
| `OPENAI_MODEL` | Custom OpenAI model name (defaults to `gpt-4o-mini`) | Optional |
| `GROQ_API_KEY` | Groq API key | Required if using Groq |
| `LLM_PROVIDER` | Override provider (`gemini`, `openai`, `groq`) | Optional |
| `LLM_MODEL` | Generic model override across any provider | Optional |

---

## ⚙️ Action Inputs (`with:`)

| Input | Description | Default |
| :--- | :--- | :--- |
| `gemini_api_key` | Google Gemini API key | `${{ secrets.GEMINI_API_KEY }}` |
| `openai_api_key` | OpenAI API key | `${{ secrets.OPENAI_API_KEY }}` |
| `groq_api_key` | Groq API key | `${{ secrets.GROQ_API_KEY }}` |
| `llm_provider` | Active LLM provider (`gemini`, `openai`, `groq`) | `gemini` |
| `llm_model` | Custom model name | `gemini-3.8-flash` |
| `spec_path` | File path for the OpenAPI YAML specification | `openapi.yaml` |
| `docs_path` | File path for human-readable Markdown docs | `API.md` |
| `auto_commit` | Whether to automatically push commits back to the PR | `true` |

---

## 💻 Local CLI Usage

You can also run SpecSync locally on your machine before pushing to GitHub:

```bash
# Set your API key
export GEMINI_API_KEY="your-gemini-key"

# 1. Preview changes against main branch without modifying files (Dry Run)
npx spec-sync sync --base main --dry-run

# 2. Sync and write changes to openapi.yaml and API.md
npx spec-sync sync --base main

# 3. Analyze git staged changes only
npx spec-sync sync --staged

# 4. Test a specific patch or diff file
npx spec-sync sync --file path/to/sample.diff --dry-run

# 5. Verbose debug mode (shows underlying network causes & stack traces)
npx spec-sync sync --file path/to/sample.diff --dry-run -v
```

### CLI Flags:
* `-b, --base <branch>`: Base branch or commit to diff against (e.g. `main`, `HEAD~1`).
* `-s, --staged`: Analyze git staged changes only.
* `-f, --file <path>`: Analyze diff from a specific text or patch file.
* `-p, --provider <provider>`: LLM provider (`gemini`, `openai`, `groq`).
* `-m, --model <model>`: Custom LLM model name (e.g. `gemini-3.8-flash`, `gpt-4o-mini`).
* `-v, --verbose`: Print detailed debug logs and root cause diagnostics.
* `--dry-run`: Preview detected endpoints in console without modifying files on disk.

---

## 🛠️ Optional Configuration File (`.github/spec-sync.yml`)

SpecSync is **zero-config by default**. If you want custom repository rules, add `.github/spec-sync.yml`:

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
  model: "gemini-3.8-flash"

delivery:
  mode: "commit" # commit | comment
  commit_message: "chore(api): update openapi spec and documentation [skip ci]"
  author_name: "spec-sync[bot]"
  author_email: "spec-sync[bot]@users.noreply.github.com"

ignore:
  - "frontend/**"
  - "**/*.test.*"
  - "dist/**"
  - "build/**"
```

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><b>Does SpecSync overwrite my existing OpenAPI file?</b></summary>
No. SpecSync parses your existing <code>openapi.yaml</code> into an Abstract Syntax Tree (AST). It only updates or adds the specific endpoints changed in the PR diff. Your existing schemas, servers, tags, security definitions, and descriptions are completely preserved.
</details>

<details>
<summary><b>Why did git push fail in my GitHub Action?</b></summary>
Make sure you enabled <b>"Read and write permissions"</b> under <b>Settings ➔ Actions ➔ General ➔ Workflow permissions</b> in your repository.
</details>

<details>
<summary><b>Does SpecSync cause infinite CI loops when it commits?</b></summary>
No. The default commit message includes the <code>[skip ci]</code> directive, preventing GitHub Actions from triggering another workflow run on the bot's commit.
</details>

<details>
<summary><b>Is my proprietary code stored anywhere?</b></summary>
No. SpecSync is a headless GitHub Action running inside your own GitHub runner. Diffs are sent directly over HTTPS to the official LLM API of your choice (Google, OpenAI, or Groq) using your own secret key. No intermediate servers or databases are used.
</details>

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
