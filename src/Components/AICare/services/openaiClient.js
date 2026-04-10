import OpenAI from 'openai';
import { getApiKey } from '../utils/apiKeys';

/**
 * Creates an OpenAI client with the stored API key
 * @returns {OpenAI|null} OpenAI client or null if no key is configured
 */
const getOpenAIClient = () => {
  const apiKey = getApiKey('openai');
  if (!apiKey) return null;

  console.log('Creating OpenAI client with key:', apiKey.substring(0, 10) + '...');

  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
    // Configure timeout
    timeout: 30000,
  });
};

/**
 * Sends a message to OpenAI (text-only)
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} model - Model to use (default: gpt-4o)
 * @returns {Promise<string>} The assistant's response
 */
export const sendToOpenAI = async (messages, model = 'gpt-4o') => {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI API key not configured. Please add your API key in settings.');
  }

  console.log('Sending request to OpenAI with model:', model);
  console.log('Messages:', JSON.stringify(messages, null, 2));

  try {
    const response = await client.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 4000,
      temperature: 0.7,
      // Disable automatic retries
      maxRetries: 0,
    });

    console.log('OpenAI response received:', response);

    const usage = response.usage ? {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens
    } : null;

    return {
      content: response.choices[0].message.content,
      usage: usage
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    console.error('Error status:', error.status);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response);
    
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your API key.');
    }
    if (error.status === 429) {
      // Check for quota exceeded vs rate limit
      const errorMsg = error.message || '';
      if (errorMsg.includes('quota') || errorMsg.includes('exceeded your current quota')) {
        throw new Error('OpenAI quota exceeded. Please add credits to your account at platform.openai.com');
      }
      // Check for specific rate limit info
      const retryAfter = error.headers?.get?.('Retry-After') || error.response?.headers?.['retry-after'];
      if (retryAfter) {
        throw new Error(`OpenAI rate limit. Please wait ${retryAfter} seconds.`);
      }
      throw new Error('OpenAI rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(`OpenAI Error: ${error.message}`);
  }
};

/**
 * Sends a message with an image to OpenAI (Vision)
 * @param {string} text - The text message
 * @param {Object} image - Image object with data (base64), name, and size
 * @param {string} model - Model to use (default: gpt-4o)
 * @returns {Promise<string>} The assistant's response
 */
export const sendToOpenAIWithImage = async (text, image, model = 'gpt-4o', systemPrompt = '') => {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI API key not configured. Please add your API key in settings.');
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

    // Add image
    if (image && image.data) {
      content.push({
        type: 'image_url',
        image_url: {
          url: image.data,
          detail: 'auto' // or 'low' for faster processing
        }
      });
    }

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You are Plant-Buddy for OpenGrowBox. Analyze the image carefully and give practical, concise plant care guidance.'
        },
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: 2000,
      maxRetries: 0,
    });

    const usage = response.usage ? {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens
    } : null;

    return {
      content: response.choices[0].message.content,
      usage: usage
    };
  } catch (error) {
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your API key.');
    }
    if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    }
    throw new Error(`OpenAI Error: ${error.message}`);
  }
};

/**
 * Lists available OpenAI models
 * @returns {Promise<Array>} Array of available models
 */
export const listOpenAIModels = async () => {
  const client = getOpenAIClient();
  if (!client) return [];

  try {
    const models = await client.models.list();
    return models.data
      .filter(model => model.id.includes('gpt-4') || model.id.includes('gpt-3.5'))
      .map(model => ({
        id: model.id,
        name: model.id,
        created: model.created,
        owned_by: model.owned_by,
        capabilities: getModelCapabilities(model.id)
      }))
      .sort((a, b) => b.created - a.created);
  } catch (error) {
    console.error('Error listing OpenAI models:', error);
    return [];
  }
};

const getModelCapabilities = (modelId) => {
  const capabilities = [];
  const lower = modelId.toLowerCase();

  // Chat capability (all GPT models)
  if (lower.includes('gpt')) {
    capabilities.push('chat');
  }

  // Vision capability - comprehensive detection
  if (lower.includes('gpt-4o') ||
      lower.includes('gpt-4-turbo') ||
      lower.includes('gpt-4-vision') ||
      lower.includes('vision') ||
      lower.includes('vl') ||
      lower.includes('multimodal')) {
    capabilities.push('vision');
  }

  // Reasoning capability - GPT-4 and newer models
  if (lower.includes('gpt-4') ||
      lower.includes('gpt-4.1') ||
      lower.includes('gpt-4.5') ||
      lower.includes('o1') ||
      lower.includes('o3')) {
    capabilities.push('reasoning');
  }

  return capabilities;
};
