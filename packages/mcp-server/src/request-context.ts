import { AsyncLocalStorage } from 'node:async_hooks';
import type { McpApprovalContext } from './integrations.js';

export interface McpRequestIdentity {
  sessionId: string | null;
  approval?: McpApprovalContext;
}

const requestIdentity = new AsyncLocalStorage<McpRequestIdentity>();

export function runWithMcpRequestIdentity<T>(identity: McpRequestIdentity, callback: () => T): T {
  return requestIdentity.run(identity, callback);
}

export function getMcpRequestIdentity(): McpRequestIdentity {
  return requestIdentity.getStore() || { sessionId: null };
}
