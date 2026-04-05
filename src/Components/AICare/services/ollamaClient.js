const getOllamaBaseUrl = () => {
  return localStorage.getItem('plantbuddy_ollama_base_url') || 'http://localhost:11434';
};

export const sendToOllama = async (messages, model = 'llama3.2') => {
  const baseUrl = getOllamaBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 4000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Ollama doesn't provide token usage in standard response
    // Estimate based on message length (rough approximation)
    const content = data.message?.content || '';
    const estimatedTokens = Math.ceil(content.length / 4);

    const usage = {
      promptTokens: estimatedTokens,
      completionTokens: estimatedTokens,
      totalTokens: estimatedTokens * 2,
      estimated: true
    };

    return {
      content: content,
      usage: usage
    };
  } catch (error) {
    throw new Error(`Ollama Error: ${error.message}`);
  }
};

export const sendToOllamaWithImage = async (text, image, model = 'llava') => {
  const baseUrl = getOllamaBaseUrl();

  try {
    const message = {
      role: 'user',
      content: text || 'Please analyze this image.',
      images: []
    };

    if (image && image.data) {
      const base64Data = image.data.includes('base64,')
        ? image.data.split('base64,')[1]
        : image.data;
      message.images.push(base64Data);
    }

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [message],
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error response:', errorText);
      throw new Error(`Ollama API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Ollama response:', data);

    const content = data.message?.content || data.message || '';
    const estimatedTokens = Math.ceil(content.length / 4);

    const usage = {
      promptTokens: estimatedTokens,
      completionTokens: estimatedTokens,
      totalTokens: estimatedTokens * 2,
      estimated: true
    };

    return {
      content: content,
      usage: usage
    };
  } catch (error) {
    console.error('Ollama error:', error);
    throw new Error(`Ollama Error: ${error.message}`);
  }
};

export const listOllamaModels = async () => {
  const baseUrl = getOllamaBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/api/tags`);

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.models?.map(model => ({
      id: model.name,
      name: model.name,
      created: model.modified_at,
      owned_by: 'ollama',
      capabilities: getOllamaCapabilities(model.name)
    })) || [];
  } catch (error) {
    console.error('Error listing Ollama models:', error);
    return [];
  }
};

const getOllamaCapabilities = (modelName) => {
  const capabilities = [];

  // All Ollama models support chat
  capabilities.push('chat');

  // Vision models (llava, minicpm-v, etc.)
  if (modelName.toLowerCase().includes('llava') ||
      modelName.toLowerCase().includes('minicpm-v') ||
      modelName.toLowerCase().includes('llava-') ||
      modelName.toLowerCase().includes('vision') ||
      modelName.toLowerCase().includes('multimodal')) {
    capabilities.push('vision');
  }

  return capabilities;
};

export const isOllamaAvailable = async () => {
  try {
    const baseUrl = getOllamaBaseUrl();
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};
