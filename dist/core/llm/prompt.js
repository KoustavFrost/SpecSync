export const SYSTEM_PROMPT = `You are SpecSync, an expert API contract architect and OpenAPI 3.1 specialist.
Your task is to analyze git diffs from pull requests across any programming language (Node.js, Python, Go, Java, Rust, Ruby, PHP, C#) and extract or update API endpoint specifications.

Analyze the provided code diffs carefully:
1. Detect any newly created HTTP endpoints or routes.
2. Detect any modified HTTP endpoints (changed paths, HTTP methods, query params, path params, request body fields, headers, response status codes, or return schemas).
3. Detect any breaking changes (removed fields, altered types, removed endpoints, changed status codes).

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON object matching the requested schema.
- Do NOT wrap in markdown formatting (no \`\`\`json or \`\`\`).
- Ensure all paths start with a leading slash '/'.
- Standard HTTP methods must be lowercase ('get', 'post', 'put', 'patch', 'delete', 'options', 'head').
- If no HTTP/REST/API endpoints were added or modified in the diff (e.g. only internal helpers, DB migrations without route changes, frontend assets), set "hasApiChanges" to false and "endpoints" to [].
`;
export function buildAnalysisPrompt(diffs, currentSpec) {
    const diffSection = diffs
        .map((d) => `--- File: ${d.filename} ---\n${d.patch}`)
        .join('\n\n');
    let prompt = `Analyze the following code diffs for API endpoint additions or modifications:\n\n${diffSection}\n\n`;
    if (currentSpec && currentSpec.trim().length > 0) {
        prompt += `Here is the current existing OpenAPI specification for reference (match existing naming styles and schemas where appropriate):\n\`\`\`yaml\n${currentSpec.slice(0, 5000)}\n\`\`\`\n\n`;
    }
    prompt += `Output the result as a raw JSON object with the following schema:
{
  "hasApiChanges": boolean,
  "summary": "Brief 1-2 sentence description of API changes",
  "breakingChanges": ["string describing breaking change if any"],
  "endpoints": [
    {
      "path": "/api/v1/resource",
      "method": "get" | "post" | "put" | "patch" | "delete",
      "summary": "Short endpoint summary",
      "description": "Detailed explanation of what the endpoint does",
      "tags": ["ResourceName"],
      "parameters": [
        {
          "name": "id",
          "in": "path" | "query" | "header",
          "required": boolean,
          "description": "Parameter explanation",
          "schema": { "type": "string" | "integer" | "boolean" }
        }
      ],
      "requestBody": {
        "required": boolean,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": { ... }
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Success",
          "content": {
            "application/json": {
              "schema": { ... }
            }
          }
        }
      }
    }
  ]
}`;
    return prompt;
}
//# sourceMappingURL=prompt.js.map