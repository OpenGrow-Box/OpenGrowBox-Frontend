const getLMStudioBaseUrl = () => {
  return localStorage.getItem('plantbuddy_lmstudio_base_url') || 'http://localhost:1234/v1';
};

export const sendToLMStudio = async (messages, model = 'local-model') => {
  const baseUrl = getLMStudioBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`LM Studio API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const usage = data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    } : {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimated: true
    };

    return {
      content: data.choices[0]?.message?.content || '',
      usage: usage
    };
  } catch (error) {
    throw new Error(`LM Studio Error: ${error.message}`);
  }
};

export const sendToLMStudioWithImage = async (text, image, model = 'local-model') => {
  const baseUrl = getLMStudioBaseUrl();

  try {
    const content = [];

    if (text && text.trim()) {
      content.push({ type: 'text', text: text });
    }

    if (image && image.data) {
      content.push({
        type: 'image_url',
        image_url: { url: image.data }
      });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are Plant-Buddy, an AI assistant for the OpenGrowBox plant growing system. You help users with plant health analysis, nutrient deficiency identification, pest and disease diagnosis, growth stage assessment, and general plant care recommendations. When analyzing images, look for: leaf color and health, leaf structure and condition, signs of nutrient deficiencies, pest infestations, disease symptoms, overall plant vigor and growth, and environmental stress indicators. Provide clear, actionable recommendations.'
          },
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LM Studio API error response:', errorText);
      throw new Error(`LM Studio API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('LM Studio response:', data);

    const usage = data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    } : {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimated: true
    };

    return {
      content: data.choices[0]?.message?.content || '',
      usage: usage
    };
  } catch (error) {
    console.error('LM Studio error:', error);
    throw new Error(`LM Studio Error: ${error.message}`);
  }
};

export const listLMStudioModels = async () => {
  const baseUrl = getLMStudioBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/models`);

    if (!response.ok) {
      throw new Error(`LM Studio API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.map(model => ({
      id: model.id,
      name: model.id,
      created: model.created,
      owned_by: 'lmstudio',
      capabilities: getLMStudioCapabilities(model.id)
    })) || [];
  } catch (error) {
    console.error('Error listing LM Studio models:', error);
    return [];
  }
};

const getLMStudioCapabilities = (modelName) => {
  const capabilities = [];

  // All LM Studio models support chat
  capabilities.push('chat');

  // Vision models (llava, minicpm-v, etc.)
  if (modelName.toLowerCase().includes('llava') ||
      modelName.toLowerCase().includes('minicpm-v') ||
      modelName.toLowerCase().includes('vision') ||
      modelName.toLowerCase().includes('multimodal') ||
      modelName.toLowerCase().includes('vlm')) {
    capabilities.push('vision');
  }

  return capabilities;
};

export const isLMStudioAvailable = async () => {
  try {
    const baseUrl = getLMStudioBaseUrl();
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};
