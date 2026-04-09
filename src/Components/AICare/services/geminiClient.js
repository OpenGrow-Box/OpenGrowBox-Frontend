import { getApiKey } from '../utils/apiKeys';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const getGeminiKey = () => {
  const apiKey = getApiKey('gemini');
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add your API key in settings.');
  }
  return apiKey;
};

const toGeminiContents = (messages) => messages
  .filter((message) => message.role !== 'system')
  .map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof message.content === 'string' ? message.content : JSON.stringify(message.content) }],
  }));

const buildUsage = (usage) => usage ? {
  promptTokens: usage.promptTokenCount || 0,
  completionTokens: usage.candidatesTokenCount || 0,
  totalTokens: usage.totalTokenCount || 0,
} : {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  estimated: true,
};

export const sendToGemini = async (messages, model = 'gemini-2.0-flash') => {
  const apiKey = getGeminiKey();
  const systemMessage = messages.find((message) => message.role === 'system')?.content || '';

  const response = await fetch(`${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: systemMessage ? { parts: [{ text: systemMessage }] } : undefined,
      contents: toGeminiContents(messages),
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 4000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Error: ${response.status} ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim() || '';

  return {
    content,
    usage: buildUsage(data.usageMetadata),
  };
};

export const sendToGeminiWithImage = async (text, image, model = 'gemini-2.0-flash', systemPrompt = '') => {
  const apiKey = getGeminiKey();
  const base64Data = image?.data?.includes('base64,') ? image.data.split('base64,')[1] : image?.data;
  const mimeType = image?.data?.match(/^data:(.*?);base64,/)?.[1] || 'image/jpeg';

  const response = await fetch(`${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      contents: [{
        role: 'user',
        parts: [
          ...(text && text.trim() ? [{ text }] : [{ text: 'Please analyze this plant image.' }]),
          ...(base64Data ? [{ inline_data: { mime_type: mimeType, data: base64Data } }] : []),
        ],
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 3000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Error: ${response.status} ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim() || '';

  return {
    content,
    usage: buildUsage(data.usageMetadata),
  };
};

export const listGeminiModels = async () => {
  const apiKey = getGeminiKey();

  try {
    const response = await fetch(`${GEMINI_BASE_URL}/models?key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    return (data.models || [])
      .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
      .filter((model) => model.name.includes('gemini'))
      .map((model) => ({
        id: model.name.replace('models/', ''),
        name: model.displayName || model.name.replace('models/', ''),
        created: Date.now(),
        owned_by: 'google',
        capabilities: [
          'chat',
          ...(model.inputTokenLimit ? ['reasoning'] : []),
          ...(model.supportedActions || model.name.toLowerCase().includes('vision') || model.name.toLowerCase().includes('flash') ? ['vision'] : []),
        ].filter((value, index, array) => array.indexOf(value) === index),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        created: Date.now(),
        owned_by: 'google',
        capabilities: ['chat', 'vision', 'reasoning'],
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        created: Date.now(),
        owned_by: 'google',
        capabilities: ['chat', 'vision'],
      },
    ];
  }
};
