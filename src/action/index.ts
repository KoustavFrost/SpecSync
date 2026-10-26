import * as core from '@actions/core';
import * as github from '@actions/github';
import * as exec from '@actions/exec';
import fs from 'node:fs';
import path from 'node:path';
import {
  loadConfig,
  createLLMProvider,
  mergeEndpointsIntoSpec,
  generateMarkdownDoc,
} from '../core/index.js';

async function run(): Promise<void> {
  try {
    core.info('🚀 [SpecSync] Initializing GitHub Action...');

    const config = loadConfig();

    // Override config with action inputs if provided
    const inputSpecPath = core.getInput('spec_path');
    if (inputSpecPath) config.spec.path = inputSpecPath;

    const inputDocsPath = core.getInput('docs_path');
    if (inputDocsPath) config.docs.path = inputDocsPath;

    const inputProvider = core.getInput('llm_provider');
    if (inputProvider) config.llm.provider = inputProvider as typeof config.llm.provider;

    const inputApiKey =
      core.getInput('gemini_api_key') ||
      core.getInput('openai_api_key') ||
      core.getInput('groq_api_key') ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GROQ_API_KEY;

    if (inputApiKey) {
      config.llm.apiKey = inputApiKey;
    }

    const autoCommit = core.getInput('auto_commit') !== 'false';

    // Get pull request context
    const context = github.context;
    const isPR = Boolean(context.payload.pull_request);

    let diff = '';
    if (isPR && context.payload.pull_request) {
      const baseSha = context.payload.pull_request.base.sha;
      core.info(`🌿 [SpecSync] Extracting diff against base SHA: ${baseSha}...`);
      let diffOutput = '';
      await exec.exec('git', ['diff', `${baseSha}...HEAD`], {
        listeners: {
          stdout: (data: Buffer) => {
            diffOutput += data.toString();
          },
        },
      });
      diff = diffOutput;
    } else {
      core.info('🌿 [SpecSync] Extracting diff against HEAD~1...');
      let diffOutput = '';
      await exec.exec('git', ['diff', 'HEAD~1'], {
        listeners: {
          stdout: (data: Buffer) => {
            diffOutput += data.toString();
          },
        },
      });
      diff = diffOutput;
    }

    if (!diff || diff.trim().length === 0) {
      core.info('✅ [SpecSync] No code changes detected in diff.');
      core.setOutput('has_api_changes', false);
      return;
    }

    core.info(`🤖 [SpecSync] Initializing LLM provider: ${config.llm.provider}...`);
    const provider = createLLMProvider(config);

    const specFullPath = path.resolve(config.spec.path);
    let currentSpec = '';
    if (fs.existsSync(specFullPath)) {
      currentSpec = fs.readFileSync(specFullPath, 'utf8');
    }

    core.info('🧠 [SpecSync] Analyzing diff for API endpoint changes...');
    const analysis = await provider.analyzeDiff(diff, currentSpec);

    core.setOutput('has_api_changes', analysis.hasApiChanges);
    core.setOutput('endpoints_count', analysis.endpoints.length);
    core.setOutput('summary', analysis.summary);

    if (!analysis.hasApiChanges || analysis.endpoints.length === 0) {
      core.info('✅ [SpecSync] No new or updated API endpoints detected.');
      return;
    }

    core.info(`✨ [SpecSync] Detected ${analysis.endpoints.length} endpoint(s):`);
    for (const ep of analysis.endpoints) {
      core.info(`   - [${ep.method.toUpperCase()}] ${ep.path}: ${ep.summary || ''}`);
    }

    const updatedSpecYaml = mergeEndpointsIntoSpec(currentSpec, analysis.endpoints);
    const updatedMarkdown = generateMarkdownDoc(updatedSpecYaml);

    fs.writeFileSync(specFullPath, updatedSpecYaml, 'utf8');
    core.info(`💾 [SpecSync] Updated OpenAPI spec at: ${config.spec.path}`);

    if (config.docs.enabled) {
      const docFullPath = path.resolve(config.docs.path);
      fs.writeFileSync(docFullPath, updatedMarkdown, 'utf8');
      core.info(`📖 [SpecSync] Updated documentation at: ${config.docs.path}`);
    }

    if (autoCommit) {
      try {
        core.info('📤 [SpecSync] Committing changes back to PR branch...');
        await exec.exec('git', ['config', 'user.name', config.delivery.authorName]);
        await exec.exec('git', ['config', 'user.email', config.delivery.authorEmail]);
        await exec.exec('git', ['add', config.spec.path]);
        if (config.docs.enabled) {
          await exec.exec('git', ['add', config.docs.path]);
        }

        let statusOutput = '';
        await exec.exec('git', ['status', '--porcelain'], {
          listeners: {
            stdout: (data: Buffer) => {
              statusOutput += data.toString();
            },
          },
        });

        if (statusOutput.trim().length > 0) {
          await exec.exec('git', ['commit', '-m', config.delivery.commitMessage]);
          await exec.exec('git', ['push']);
          core.info('🎉 [SpecSync] Successfully pushed commit to branch!');
        } else {
          core.info('ℹ️ [SpecSync] Files already up to date, nothing to commit.');
        }
      } catch (commitErr: unknown) {
        const error = commitErr as Error;
        core.warning(`⚠️ [SpecSync] Direct commit failed (${error.message}). Falling back to PR comment...`);

        if (isPR) {
          const token = process.env.GITHUB_TOKEN;
          if (token) {
            const octokit = github.getOctokit(token);
            const { owner, repo, number } = context.issue;

            let commentBody = `### 🤖 SpecSync API Update Notice\n\n`;
            commentBody += `**${analysis.summary}**\n\n`;
            commentBody += `#### 📋 Detected Endpoints:\n`;
            for (const ep of analysis.endpoints) {
              commentBody += `- \`${ep.method.toUpperCase()}\` **${ep.path}**: ${ep.summary || '-'}\n`;
            }

            if (analysis.breakingChanges && analysis.breakingChanges.length > 0) {
              commentBody += `\n#### ⚠️ Breaking Changes Detected:\n`;
              for (const bc of analysis.breakingChanges) {
                commentBody += `- ⚠️ ${bc}\n`;
              }
            }

            await octokit.rest.issues.createComment({
              owner,
              repo,
              issue_number: number,
              body: commentBody,
            });
            core.info('💬 [SpecSync] Fallback PR comment posted successfully.');
          }
        }
      }
    }
  } catch (error: unknown) {
    const err = error as Error;
    core.setFailed(`SpecSync failed: ${err.message || err}`);
  }
}

void run();
