const OPENGROWBOX_DOCS_BASE_URL = 'https://docs.opengrowbox.com';
const OPENGROWBOX_WIKI_BASE_URL = 'https://wiki.opengrowbox.com';

export const fetchOpenGrowBoxDocs = async (query) => {
  try {
    // For now, return mock data since the docs URLs might not be accessible
    // In production, you would implement actual API calls here
    console.log('Would fetch docs for:', query);
    
    return {
      source: 'docs',
      url: `${OPENGROWBOX_DOCS_BASE_URL}/search?q=${encodeURIComponent(query)}`,
      content: `Documentation search for "${query}" - This feature will be available once OpenGrowBox documentation is publicly accessible.`,
      success: true,
      mock: true
    };
  } catch (error) {
    console.error('Error fetching OpenGrowBox docs:', error);
    return {
      source: 'docs',
      url: `${OPENGROWBOX_DOCS_BASE_URL}/search?q=${encodeURIComponent(query)}`,
      error: error.message,
      success: false
    };
  }
};

export const fetchOpenGrowBoxWiki = async (query) => {
  try {
    // For now, return mock data
    console.log('Would fetch wiki for:', query);
    
    return {
      source: 'wiki',
      url: `${OPENGROWBOX_WIKI_BASE_URL}/search?q=${encodeURIComponent(query)}`,
      content: `Wiki search for "${query}" - This feature will be available once OpenGrowBox wiki is publicly accessible.`,
      success: true,
      mock: true
    };
  } catch (error) {
    console.error('Error fetching OpenGrowBox wiki:', error);
    return {
      source: 'wiki',
      url: `${OPENGROWBOX_WIKI_BASE_URL}/search?q=${encodeURIComponent(query)}`,
      error: error.message,
      success: false
    };
  }
};

export const fetchBothSources = async (query) => {
  const [docsResult, wikiResult] = await Promise.all([
    fetchOpenGrowBoxDocs(query),
    fetchOpenGrowBoxWiki(query)
  ]);

  return {
    docs: docsResult,
    wiki: wikiResult,
    query: query,
    timestamp: new Date().toISOString()
  };
};

export const createToolCallPrompt = (query, searchResults) => {
  // Check if we got mock data
  const isMock = searchResults.docs?.mock && searchResults.wiki?.mock;
  
  if (isMock) {
    return `The user is asking about "${query}". Since documentation is not yet publicly available, please answer based on your knowledge of OpenGrowBox and plant care.`;
  }

  let prompt = `I searched for "${query}" in the OpenGrowBox documentation:\n\n`;

  if (searchResults.docs?.success) {
    prompt += `**Documentation**: Found relevant information at ${searchResults.docs.url}\n`;
    if (searchResults.docs.content) {
      prompt += `Content preview: ${searchResults.docs.content.substring(0, 1000)}...\n`;
    }
  } else {
    prompt += `**Documentation**: No results or error: ${searchResults.docs?.error || 'Unknown error'}\n`;
  }

  prompt += '\n';

  if (searchResults.wiki?.success) {
    prompt += `**Wiki**: Found relevant information at ${searchResults.wiki.url}\n`;
    if (searchResults.wiki.content) {
      prompt += `Content preview: ${searchResults.wiki.content.substring(0, 1000)}...\n`;
    }
  } else {
    prompt += `**Wiki**: No results or error: ${searchResults.wiki?.error || 'Unknown error'}\n`;
  }

  prompt += `\nBased on this information, please help the user with their question about "${query}".`;

  return prompt;
};
