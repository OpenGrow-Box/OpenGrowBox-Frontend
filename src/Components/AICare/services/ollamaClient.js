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

export const sendToOllamaWithImage = async (text, image, model = 'llava', systemPrompt = '') => {
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

    const messages = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push(message);

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages,
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
    const models = data.models || [];

    // Get capabilities for each model in parallel
    const modelsWithCapabilities = await Promise.all(
      models.map(async (model) => {
        const capabilities = await getOllamaCapabilities(model.name, baseUrl);
        return {
          id: model.name,
          name: model.name,
          created: model.modified_at,
          owned_by: 'ollama',
          capabilities
        };
      })
    );

    return modelsWithCapabilities;
  } catch (error) {
    console.error('Error listing Ollama models:', error);
    return [];
  }
};

const fetchModelCapabilities = async (baseUrl, modelName) => {
  try {
    const response = await fetch(`${baseUrl}/api/show`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.capabilities || null;
  } catch (error) {
    return null;
  }
};

const getOllamaCapabilities = async (modelName, baseUrl) => {
  const capabilities = [];

  // All Ollama models support chat
  capabilities.push('chat');

  // Try to get actual capabilities from /api/show endpoint
  const modelCapabilities = await fetchModelCapabilities(baseUrl, modelName);
  if (modelCapabilities && Array.isArray(modelCapabilities)) {
    if (modelCapabilities.includes('vision')) {
      capabilities.push('vision');
    }
    if (modelCapabilities.includes('tools')) {
      capabilities.push('tools');
    }
    if (modelCapabilities.includes('thinking')) {
      capabilities.push('reasoning');
    }
    return capabilities;
  }

  // Fallback to keyword-based detection if /api/show fails
  const lowerName = modelName.toLowerCase();
  
  if (lowerName.includes('llava') ||
      lowerName.includes('minicpm-v') ||
      lowerName.includes('llava-') ||
      lowerName.includes('vision') ||
      lowerName.includes('multimodal') ||
      lowerName.includes('vl') || // qwen2.5vl, etc.
      lowerName.includes('qwen') && (lowerName.includes('vl') || lowerName.includes('vision')) ||
      lowerName.includes('gemma') && lowerName.includes('vision')) {
    capabilities.push('vision');
  }

  // Detect reasoning capabilities
  if (lowerName.includes('thinking') ||
      lowerName.includes('reason') ||
      lowerName.includes('qwen') && lowerName.includes('3')) {
    capabilities.push('reasoning');
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
