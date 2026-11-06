#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  loadConfig,
  createLLMProvider,
  mergeEndpointsIntoSpec,
  generateMarkdownDoc,
} from '../core/index.js';

const program = new Command();

program
  .name('spec-sync')
  .description('AI-powered OpenAPI contract and documentation synchronization')
  .version('0.1.0');

program
  .command('sync')
  .description('Detect API changes from git diff and update OpenAPI spec & documentation')
  .option('-b, --base <branch>', 'Base branch or commit to diff against (e.g. main, HEAD~1)')
  .option('-s, --staged', 'Analyze git staged changes only')
  .option('-f, --file <path>', 'Analyze diff from a specific text/patch file')
  .option('-p, --provider <provider>', 'LLM provider (gemini, openai, groq)')
  .option('-m, --model <model>', 'LLM model name (e.g. gemini-1.5-flash, gpt-4o-mini)')
  .option('--dry-run', 'Preview changes without modifying spec or docs files')
  .action(async (options) => {
    try {
      console.log('🔍 [SpecSync] Loading configuration...');
      const config = loadConfig();

      if (options.provider) {
        config.llm.provider = options.provider;
      }
      if (options.model) {
        config.llm.model = options.model;
      }

      let diff = '';

      if (options.file) {
        console.log(`📄 [SpecSync] Reading diff from ${options.file}`);
        diff = fs.readFileSync(path.resolve(options.file), 'utf8');
      } else if (options.staged) {
        console.log('🌿 [SpecSync] Reading staged git changes...');
        diff = execSync('git diff --staged', { encoding: 'utf8' });
      } else {
        const base = options.base || 'HEAD~1';
        console.log(`🌿 [SpecSync] Reading git diff against "${base}"...`);
        try {
          diff = execSync(`git diff ${base}...HEAD`, { encoding: 'utf8' });
        } catch {
          diff = execSync(`git diff ${base}`, { encoding: 'utf8' });
        }
      }

      if (!diff || diff.trim().length === 0) {
        console.log('✅ [SpecSync] No code changes detected in diff.');
        return;
      }

      console.log(`🤖 [SpecSync] Initializing LLM provider: ${config.llm.provider}...`);
      const provider = createLLMProvider(config);

      const specPath = path.resolve(config.spec.path);
      let currentSpec = '';
      if (fs.existsSync(specPath)) {
        currentSpec = fs.readFileSync(specPath, 'utf8');
      }

      console.log('🧠 [SpecSync] Analyzing diff for API endpoint changes...');
      const analysis = await provider.analyzeDiff(diff, currentSpec);

      if (!analysis.hasApiChanges || analysis.endpoints.length === 0) {
        console.log('✅ [SpecSync] No new or updated API endpoints detected.');
        return;
      }

      console.log(`\n✨ Detected ${analysis.endpoints.length} endpoint(s):`);
      for (const ep of analysis.endpoints) {
        console.log(`   - [${ep.method.toUpperCase()}] ${ep.path}: ${ep.summary || ep.description || ''}`);
      }

      if (analysis.breakingChanges && analysis.breakingChanges.length > 0) {
        console.warn('\n⚠️  Breaking changes detected:');
        for (const bc of analysis.breakingChanges) {
          console.warn(`   ! ${bc}`);
        }
      }

      const updatedSpecYaml = mergeEndpointsIntoSpec(currentSpec, analysis.endpoints);
      const updatedMarkdown = generateMarkdownDoc(updatedSpecYaml);

      if (options.dryRun) {
        console.log('\n[Dry Run] Spec and documentation not written to disk.');
        return;
      }

      fs.writeFileSync(specPath, updatedSpecYaml, 'utf8');
      console.log(`💾 [SpecSync] Successfully updated OpenAPI spec at: ${config.spec.path}`);

      if (config.docs.enabled) {
        const docPath = path.resolve(config.docs.path);
        fs.writeFileSync(docPath, updatedMarkdown, 'utf8');
        console.log(`📖 [SpecSync] Successfully updated documentation at: ${config.docs.path}`);
      }

      console.log('\n🎉 [SpecSync] Sync complete!');
    } catch (err: unknown) {
      const error = err as Error;
      console.error('❌ [SpecSync] Error during sync:', error.message || error);
      process.exit(1);
    }
  });

program.parse(process.argv);
