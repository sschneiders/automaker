/**
 * Shared types for AI model providers
 */

/**
 * Configuration for a provider instance
 */
export interface ProviderConfig {
  apiKey?: string;
  cliPath?: string;
  env?: Record<string, string>;
}

/**
 * Message in conversation history
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; source?: object }>;
}

/**
 * Options for executing a query via a provider
 */
export interface ExecuteOptions {
  prompt: string | Array<{ type: string; text?: string; source?: object }>;
  model: string;
  cwd: string;
  systemPrompt?: string;
  maxTurns?: number;
  allowedTools?: string[];
  mcpServers?: Record<string, unknown>;
  abortController?: AbortController;
  conversationHistory?: ConversationMessage[]; // Previous messages for context
  sdkSessionId?: string; // Claude SDK session ID for resuming conversations
}

/**
 * Content block in a provider message (matches Claude SDK format)
 */
export interface ContentBlock {
  type: 'text' | 'tool_use' | 'thinking' | 'tool_result';
  text?: string;
  thinking?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: string;
}

/**
 * Message returned by a provider (matches Claude SDK streaming format)
 */
export interface ProviderMessage {
  type: 'assistant' | 'user' | 'error' | 'result';
  subtype?: 'success' | 'error';
  session_id?: string;
  message?: {
    role: 'user' | 'assistant';
    content: ContentBlock[];
  };
  result?: string;
  error?: string;
  parent_tool_use_id?: string | null;
}

/**
 * Installation status for a provider
 */
export interface InstallationStatus {
  installed: boolean;
  path?: string;
  version?: string;
  method?: 'cli' | 'npm' | 'brew' | 'sdk';
  hasApiKey?: boolean;
  authenticated?: boolean;
  error?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Model definition
 */
export interface ModelDefinition {
  id: string;
  name: string;
  modelString: string;
  provider: string;
  description: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsVision?: boolean;
  supportsTools?: boolean;
  tier?: 'basic' | 'standard' | 'premium';
  default?: boolean;
}

/**
 * Content block for multi-part prompts (images, structured text)
 */
export interface TextContentBlock {
  type: 'text';
  text: string;
}

export interface ImageContentBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string;
  };
}

export type PromptContentBlock = TextContentBlock | ImageContentBlock;

/**
 * Options for simple one-shot queries (title generation, descriptions, text enhancement)
 *
 * These queries:
 * - Don't need tools
 * - Return text directly (no streaming)
 * - Are single-turn (maxTurns=1)
 */
export interface SimpleQueryOptions {
  /** The prompt - either a string or array of content blocks */
  prompt: string | PromptContentBlock[];

  /** Model to use (defaults to haiku) */
  model?: string;

  /** Optional system prompt */
  systemPrompt?: string;

  /** Abort controller for cancellation */
  abortController?: AbortController;
}

/**
 * Result from a simple query
 */
export interface SimpleQueryResult {
  /** Extracted text from the response */
  text: string;

  /** Whether the query completed successfully */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

/**
 * Options for streaming queries with tools and/or structured output
 */
export interface StreamingQueryOptions extends SimpleQueryOptions {
  /** Working directory for tool execution */
  cwd: string;

  /** Max turns (defaults to sdk-options presets) */
  maxTurns?: number;

  /** Tools to allow */
  allowedTools?: readonly string[];

  /** JSON schema for structured output */
  outputFormat?: {
    type: 'json_schema';
    schema: Record<string, unknown>;
  };

  /** Callback for text chunks */
  onText?: (text: string) => void;

  /** Callback for tool usage */
  onToolUse?: (name: string, input: unknown) => void;
}

/**
 * Result from a streaming query with structured output
 */
export interface StreamingQueryResult extends SimpleQueryResult {
  /** Parsed structured output if outputFormat was specified */
  structuredOutput?: unknown;
}
