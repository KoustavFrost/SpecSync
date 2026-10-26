import YAML from 'yaml';
import type { EndpointDefinition } from '../types.js';

export interface OpenAPIObject {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

export function createBaseSpec(title = 'API Specification', version = '1.0.0'): OpenAPIObject {
  return {
    openapi: '3.1.0',
    info: {
      title,
      version,
      description: 'API documentation generated automatically by SpecSync.',
    },
    paths: {},
    components: {
      schemas: {},
    },
  };
}

/**
 * Merges endpoint definitions into an existing OpenAPI YAML/JSON string or creates a new one.
 */
export function mergeEndpointsIntoSpec(
  existingContent: string | null | undefined,
  endpoints: EndpointDefinition[]
): string {
  let doc: OpenAPIObject;

  if (existingContent && existingContent.trim().length > 0) {
    try {
      doc = YAML.parse(existingContent) as OpenAPIObject;
      if (!doc || typeof doc !== 'object') {
        doc = createBaseSpec();
      }
      if (!doc.paths) {
        doc.paths = {};
      }
    } catch {
      doc = createBaseSpec();
    }
  } else {
    doc = createBaseSpec();
  }

  for (const ep of endpoints) {
    // Normalize path to start with /
    const normalizedPath = ep.path.startsWith('/') ? ep.path : `/${ep.path}`;
    const method = ep.method.toLowerCase();

    if (!doc.paths[normalizedPath]) {
      doc.paths[normalizedPath] = {};
    }

    const pathItem = doc.paths[normalizedPath];

    const operationObj: Record<string, unknown> = {
      summary: ep.summary || `${method.toUpperCase()} ${normalizedPath}`,
      description: ep.description || '',
      responses: ep.responses && Object.keys(ep.responses).length > 0
        ? ep.responses
        : {
            '200': {
              description: 'Successful response',
            },
          },
    };

    if (ep.tags && ep.tags.length > 0) {
      operationObj.tags = ep.tags;
    }

    if (ep.parameters && ep.parameters.length > 0) {
      operationObj.parameters = ep.parameters;
    }

    if (ep.requestBody) {
      operationObj.requestBody = ep.requestBody;
    }

    pathItem[method] = operationObj;
  }

  return YAML.stringify(doc, { indent: 2 });
}
