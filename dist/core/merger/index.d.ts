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
export declare function createBaseSpec(title?: string, version?: string): OpenAPIObject;
/**
 * Merges endpoint definitions into an existing OpenAPI YAML/JSON string or creates a new one.
 */
export declare function mergeEndpointsIntoSpec(existingContent: string | null | undefined, endpoints: EndpointDefinition[]): string;
//# sourceMappingURL=index.d.ts.map