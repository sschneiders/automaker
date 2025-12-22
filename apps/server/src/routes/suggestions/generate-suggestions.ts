/**
 * Business logic for generating suggestions
 *
 * Uses ClaudeProvider.executeStreamingQuery() for SDK interaction.
 */

import type { EventEmitter } from '../../lib/events.js';
import { createLogger } from '@automaker/utils';
import { ProviderFactory } from '../../providers/provider-factory.js';

const logger = createLogger('Suggestions');

/**
 * JSON Schema for suggestions output
 */
const suggestionsSchema = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' },
          priority: {
            type: 'number',
            minimum: 1,
            maximum: 3,
          },
          reasoning: { type: 'string' },
        },
        required: ['category', 'description', 'priority', 'reasoning'],
      },
    },
  },
  required: ['suggestions'],
  additionalProperties: false,
};

export async function generateSuggestions(
  projectPath: string,
  suggestionType: string,
  events: EventEmitter,
  abortController: AbortController
): Promise<void> {
  const typePrompts: Record<string, string> = {
    features: 'Analyze this project and suggest new features that would add value.',
    refactoring: 'Analyze this project and identify refactoring opportunities.',
    security: 'Analyze this project for security vulnerabilities and suggest fixes.',
    performance: 'Analyze this project for performance issues and suggest optimizations.',
  };

  const prompt = `${typePrompts[suggestionType] || typePrompts.features}

Look at the codebase and provide 3-5 concrete suggestions.

For each suggestion, provide:
1. A category (e.g., "User Experience", "Security", "Performance")
2. A clear description of what to implement
3. Priority (1=high, 2=medium, 3=low)
4. Brief reasoning for why this would help

The response will be automatically formatted as structured JSON.`;

  events.emit('suggestions:event', {
    type: 'suggestions_progress',
    content: `Starting ${suggestionType} analysis...\n`,
  });

  const provider = ProviderFactory.getProviderForModel('haiku');
  const result = await provider.executeStreamingQuery({
    prompt,
    model: 'haiku',
    cwd: projectPath,
    maxTurns: 250,
    allowedTools: ['Read', 'Glob', 'Grep'],
    abortController,
    outputFormat: {
      type: 'json_schema',
      schema: suggestionsSchema,
    },
    onText: (text) => {
      events.emit('suggestions:event', {
        type: 'suggestions_progress',
        content: text,
      });
    },
    onToolUse: (name, input) => {
      events.emit('suggestions:event', {
        type: 'suggestions_tool',
        tool: name,
        input,
      });
    },
  });

  // Use structured output if available, otherwise fall back to parsing text
  try {
    const structuredOutput = result.structuredOutput as
      | {
          suggestions: Array<Record<string, unknown>>;
        }
      | undefined;

    if (structuredOutput && structuredOutput.suggestions) {
      // Use structured output directly
      logger.debug('Received structured output:', structuredOutput);
      events.emit('suggestions:event', {
        type: 'suggestions_complete',
        suggestions: structuredOutput.suggestions.map((s: Record<string, unknown>, i: number) => ({
          ...s,
          id: s.id || `suggestion-${Date.now()}-${i}`,
        })),
      });
    } else {
      // Fallback: try to parse from text (for backwards compatibility)
      logger.warn('No structured output received, attempting to parse from text');
      const jsonMatch = result.text.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        events.emit('suggestions:event', {
          type: 'suggestions_complete',
          suggestions: parsed.suggestions.map((s: Record<string, unknown>, i: number) => ({
            ...s,
            id: s.id || `suggestion-${Date.now()}-${i}`,
          })),
        });
      } else {
        throw new Error('No valid JSON found in response');
      }
    }
  } catch (error) {
    // Log the parsing error for debugging
    logger.error('Failed to parse suggestions JSON from AI response:', error);
    // Return generic suggestions if parsing fails
    events.emit('suggestions:event', {
      type: 'suggestions_complete',
      suggestions: [
        {
          id: `suggestion-${Date.now()}-0`,
          category: 'Analysis',
          description: 'Review the AI analysis output for insights',
          priority: 1,
          reasoning: 'The AI provided analysis but suggestions need manual review',
        },
      ],
    });
  }
}
