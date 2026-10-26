import { describe, it, expect } from 'vitest';
import YAML from 'yaml';
import {
  createBaseSpec,
  mergeEndpointsIntoSpec,
} from '../src/core/merger/index.js';
import { generateMarkdownDoc } from '../src/core/generator/markdown.js';
import type { EndpointDefinition } from '../src/core/types.js';

describe('OpenAPI Spec Merger', () => {
  it('should initialize a valid base OpenAPI 3.1.0 spec', () => {
    const spec = createBaseSpec('Test API', '2.0.0');
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('Test API');
    expect(spec.info.version).toBe('2.0.0');
    expect(spec.paths).toEqual({});
  });

  it('should merge new endpoints into empty spec string', () => {
    const endpoints: EndpointDefinition[] = [
      {
        path: '/users',
        method: 'get',
        summary: 'List users',
        responses: {
          '200': { description: 'User list returned' },
        },
      },
      {
        path: '/users',
        method: 'post',
        summary: 'Create user',
        responses: {
          '201': { description: 'User created' },
        },
      },
    ];

    const resultYaml = mergeEndpointsIntoSpec(null, endpoints);
    const parsed = YAML.parse(resultYaml);

    expect(parsed.paths['/users']).toBeDefined();
    expect(parsed.paths['/users'].get.summary).toBe('List users');
    expect(parsed.paths['/users'].post.summary).toBe('Create user');
  });

  it('should preserve existing endpoints when adding new ones', () => {
    const initialYaml = `
openapi: 3.1.0
info:
  title: Existing API
  version: 1.0.0
paths:
  /auth/login:
    post:
      summary: Login user
      responses:
        '200':
          description: Logged in
`;

    const newEndpoints: EndpointDefinition[] = [
      {
        path: '/auth/logout',
        method: 'post',
        summary: 'Logout user',
        responses: {
          '200': { description: 'Logged out' },
        },
      },
    ];

    const resultYaml = mergeEndpointsIntoSpec(initialYaml, newEndpoints);
    const parsed = YAML.parse(resultYaml);

    // Existing endpoint preserved!
    expect(parsed.paths['/auth/login'].post.summary).toBe('Login user');
    // New endpoint added!
    expect(parsed.paths['/auth/logout'].post.summary).toBe('Logout user');
  });
});

describe('Markdown Documentation Generator', () => {
  it('should generate markdown documentation table and details', () => {
    const endpoints: EndpointDefinition[] = [
      {
        path: '/items',
        method: 'get',
        summary: 'Fetch items',
        responses: {
          '200': { description: 'List of items' },
        },
      },
    ];

    const yamlSpec = mergeEndpointsIntoSpec(null, endpoints);
    const md = generateMarkdownDoc(yamlSpec);

    expect(md).toContain('# API Specification');
    expect(md).toContain('| **`GET`** | `/items` | Fetch items |');
    expect(md).toContain('### `GET` /items');
  });
});
