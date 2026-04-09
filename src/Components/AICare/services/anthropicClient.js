import Anthropic from '@anthropic-ai/sdk';
import { getApiKey } from '../utils/apiKeys';

/**
 * Creates an Anthropic client with the stored API key
 * @returns {Anthropic|null} Anthropic client or null if no key is configured
 */
const getAnthropicClient = () => {
  const apiKey = getApiKey('anthropic');
  if (!apiKey) return null;

  return new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Required for frontend usage
  });
};

/**
 * Sends a message to Anthropic (text-only)
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} model - Model to use (default: claude-3-5-sonnet-20241022)
 * @returns {Promise<string>} The assistant's response
 */
export const sendToAnthropic = async (messages, model = 'claude-3-5-sonnet-20241022') => {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic API key not configured. Please add your API key in settings.');
  }

  try {
    const response = await client.messages.create({
      model: model,
      max_tokens: 4000,
      temperature: 0.7,
      messages: messages,
    });

    const usage = response.usage ? {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens
    } : null;

    return {
      content: response.content[0].text,
      usage: usage
    };
  } catch (error) {
    if (error.status === 401) {
      throw new Error('Invalid Anthropic API key. Please check your API key.');
    }
    if (error.status === 429) {
      throw new Error('Anthropic rate limit exceeded. Please try again later.');
    }
    throw new Error(`Anthropic Error: ${error.message}`);
  }
};

/**
 * Sends a message with an image to Anthropic (Vision)
 * @param {string} text - The text message
 * @param {Object} image - Image object with data (base64), name, and size
 * @param {string} model - Model to use (default: claude-3-5-sonnet-20241022)
 * @returns {Promise<string>} The assistant's response
 */
export const sendToAnthropicWithImage = async (text, image, model = 'claude-3-5-20250219', systemPrompt = '') => {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic API key not configured. Please add your key in settings.');
  }

  try {
    const content = [];

    // Add text message if provided
    if (text && text.trim()) {
      content.push({
        type: 'text',
        text: text
      });
    }

    // Add image if provided
    if (image && image.data) {
      // Remove data URL prefix if present
      const base64Data = image.data.includes('base64,') 
        ? image.data.split('base64,')[1] 
        : image.data;

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg', // Assume JPEG, adjust based on file type
          data: base64Data
        }
      });
    }

    const response = await client.messages.create({
      model: model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: content
        }
      ],
      system: systemPrompt || 'You are Plant-Buddy for OpenGrowBox. Analyze the image carefully and give practical, concise plant care guidance.'
    });

    const usage = response.usage ? {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens
    } : null;

    return {
      content: response.content[0].text,
      usage: usage
    };
  } catch (error) {
    if (error.status === 401) {
      throw new Error('Invalid Anthropic API key. Please check your API key.');
    }
    if (error.status === 429) {
      throw new Error('Anthropic rate limit exceeded. Please try again later.');
    }
    throw new Error(`Anthropic Error: ${error.message}`);
  }
};

/**
 * Lists available Anthropic models
 * @returns {Promise<Array>} Array of available models
 */
export const listAnthropicModels = async () => {
  const client = getAnthropicClient();
  if (!client) return [];

  const models = [{
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    created: Date.now(),
    owned_by: 'anthropic',
    capabilities: ['vision', 'chat', 'reasoning']
  }, {
    id: 'claude-3-5-sonnet-20240620',
    name: 'Claude 3.5 Sonnet (Legacy)',
    created: Date.now(),
    owned_by: 'anthropic',
    capabilities: ['vision', 'chat', 'reasoning']
  }, {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    created: Date.now(),
    owned_by: 'anthropic',
    capabilities: ['vision', 'chat']
  }, {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    created: Date.now(),
    owned_by: 'anthropic',
    capabilities: ['vision', 'chat', 'reasoning']
  }, {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    created: Date.now(),
    owned_by: 'anthropic',
    capabilities: ['vision', 'chat']
  }, {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    created: Date.now(),
    owned_by: 'anthropic',
    capabilities: ['vision', 'chat']
  }];

  return models;
};

/**
 * Checks if Anthropic is available and configured
 * @returns {boolean} True if Anthropic API key is configured
 */
export const isAnthropicAvailable = () => {
  return getApiKey('anthropic') !== null;
};

/**
 * Checks if OpenAI is available and configured
 * @returns {boolean} True if OpenAI API key is configured
 */
export const isOpenAIAvailable = () => {
  return getApiKey('openai') !== null;
};
