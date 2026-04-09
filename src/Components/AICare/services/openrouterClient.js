import { getApiKey } from '../utils/apiKeys';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const getHeaders = () => {
  const apiKey = getApiKey('openrouter');
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured. Please add your API key in settings.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': window.location.origin,
    'X-Title': 'OpenGrowBox Plant-Buddy',
  };
};

const normalizeUsage = (usage) => usage ? {
  promptTokens: usage.prompt_tokens || 0,
  completionTokens: usage.completion_tokens || 0,
  totalTokens: usage.total_tokens || 0,
} : {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  estimated: true,
};

export const sendToOpenRouter = async (messages, model = 'openai/gpt-4o-mini') => {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.55,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter Error: ${response.status} ${errorText || response.statusText}`);
  }

  const data = await response.json();

  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: normalizeUsage(data.usage),
  };
};

export const sendToOpenRouterWithImage = async (text, image, model = 'openai/gpt-4o-mini', systemPrompt = '') => {
  const content = [];

  if (text && text.trim()) {
    content.push({ type: 'text', text });
  }

  if (image?.data) {
    content.push({
      type: 'image_url',
      image_url: { url: image.data },
    });
  }

  return sendToOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: content.length > 0 ? content : [{ type: 'text', text: 'Please analyze this plant image.' }] },
  ], model);
};

const getModelCapabilities = (modelId) => {
  const lower = modelId.toLowerCase();
  const capabilities = ['chat'];

  if (lower.includes('vision') || lower.includes('vl') || lower.includes('gpt-4o') || lower.includes('gemini') || lower.includes('claude-3')) {
    capabilities.push('vision');
  }

  if (lower.includes('gpt-4') || lower.includes('claude') || lower.includes('gemini-2.5') || lower.includes('r1')) {
    capabilities.push('reasoning');
  }

  return capabilities;
};

export const listOpenRouterModels = async () => {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API Error: ${response.status}`);
    }

    const data = await response.json();

    return (data.data || [])
      .filter((model) => !model.id.includes('free-preview'))
      .map((model) => ({
        id: model.id,
        name: model.name || model.id,
        created: model.created || Date.now(),
        owned_by: 'openrouter',
        capabilities: getModelCapabilities(model.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 80);
  } catch {
    return [
      {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini via OpenRouter',
        created: Date.now(),
        owned_by: 'openrouter',
        capabilities: ['chat', 'vision', 'reasoning'],
      },
      {
        id: 'google/gemini-2.0-flash-001',
        name: 'Gemini 2.0 Flash via OpenRouter',
        created: Date.now(),
        owned_by: 'openrouter',
        capabilities: ['chat', 'vision', 'reasoning'],
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet via OpenRouter',
        created: Date.now(),
        owned_by: 'openrouter',
        capabilities: ['chat', 'vision', 'reasoning'],
      },
    ];
  }
};
