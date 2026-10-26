import YAML from 'yaml';
import type { OpenAPIObject } from '../merger/index.js';

/**
 * Generates an API.md document from an OpenAPI YAML or JSON string.
 */
export function generateMarkdownDoc(openApiContent: string): string {
  let doc: OpenAPIObject;
  try {
    doc = YAML.parse(openApiContent) as OpenAPIObject;
  } catch {
    return '# API Documentation\n\nNo endpoints defined yet.\n';
  }

  const title = doc.info?.title || 'API Documentation';
  const description = doc.info?.description || 'Synchronized by SpecSync';
  const version = doc.info?.version || '1.0.0';

  const lines: string[] = [
    `# ${title} (v${version})`,
    '',
    `> ${description}`,
    '',
    '## Endpoints Summary',
    '',
    '| Method | Path | Summary |',
    '| :--- | :--- | :--- |',
  ];

  const paths = doc.paths || {};
  const pathKeys = Object.keys(paths).sort();

  for (const p of pathKeys) {
    const methods = paths[p];
    for (const [m, op] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(m.toLowerCase())) {
        const operation = op as { summary?: string };
        const summary = operation.summary || '-';
        lines.push(`| **\`${m.toUpperCase()}\`** | \`${p}\` | ${summary} |`);
      }
    }
  }

  lines.push('', '---', '', '## Endpoint Details', '');

  for (const p of pathKeys) {
    const methods = paths[p];
    for (const [m, op] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(m.toLowerCase())) {
        continue;
      }

      const operation = op as {
        summary?: string;
        description?: string;
        parameters?: Array<{ name: string; in: string; required?: boolean; description?: string }>;
        responses?: Record<string, { description?: string }>;
      };

      lines.push(`### \`${m.toUpperCase()}\` ${p}`);
      if (operation.summary) {
        lines.push(`**${operation.summary}**`);
      }
      if (operation.description) {
        lines.push('', operation.description);
      }

      if (operation.parameters && operation.parameters.length > 0) {
        lines.push('', '**Parameters:**', '', '| Name | In | Required | Description |', '| :--- | :--- | :--- | :--- |');
        for (const param of operation.parameters) {
          lines.push(`| \`${param.name}\` | \`${param.in}\` | ${param.required ? 'Yes' : 'No'} | ${param.description || '-'} |`);
        }
      }

      if (operation.responses && Object.keys(operation.responses).length > 0) {
        lines.push('', '**Responses:**', '', '| Status Code | Description |', '| :--- | :--- |');
        for (const [status, res] of Object.entries(operation.responses)) {
          lines.push(`| \`${status}\` | ${res.description || '-'} |`);
        }
      }

      lines.push('');
    }
  }

  return lines.join('\n');
}
