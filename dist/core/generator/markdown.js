import YAML from 'yaml';
/**
 * Generates an API.md document from an OpenAPI YAML or JSON string.
 */
export function generateMarkdownDoc(openApiContent) {
    let doc;
    try {
        doc = YAML.parse(openApiContent);
    }
    catch {
        return '# API Documentation\n\nNo endpoints defined yet.\n';
    }
    const title = doc.info?.title || 'API Documentation';
    const description = doc.info?.description || 'Synchronized by SpecSync';
    const version = doc.info?.version || '1.0.0';
    const lines = [
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
                const operation = op;
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
            const operation = op;
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
//# sourceMappingURL=markdown.js.map