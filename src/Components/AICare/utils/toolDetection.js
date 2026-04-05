export const detectNeedForWebSearch = (message, conversationHistory = []) => {
  // Temporarily disabled - will be enabled when documentation is publicly available
  return false;
  
  /* 
  const keywords = [
    'documentation',
    'docs',
    'wiki',
    'manual',
    'guide',
    'tutorial',
    'how to',
    'setup',
    'configure',
    'install',
    'troubleshoot',
    'error',
    'problem',
    'issue',
    'help',
    'support',
    'question',
    'what is',
    'explain',
    'how does',
    'how do i',
    'where can i find',
    'reference'
  ];

  const lowerMessage = message.toLowerCase();

  // Check for keywords in the message
  const hasKeyword = keywords.some(keyword => lowerMessage.includes(keyword));

  // Check if user is asking a question that might need documentation
  const isQuestion = lowerMessage.includes('?') ||
                   lowerMessage.startsWith('what') ||
                   lowerMessage.startsWith('how') ||
                   lowerMessage.startsWith('where') ||
                   lowerMessage.startsWith('why') ||
                   lowerMessage.startsWith('when') ||
                   lowerMessage.startsWith('can') ||
                   lowerMessage.startsWith('could') ||
                   lowerMessage.startsWith('should') ||
                   lowerMessage.startsWith('would');

  // Check if there are multiple follow-up questions (indicates need for more information)
  const hasFollowUps = conversationHistory.length > 3;

  return hasKeyword || isQuestion || hasFollowUps;
  */
};

export const extractSearchQuery = (message) => {
  // Remove common prefixes and extract the core query
  let query = message
    .replace(/^(can you|could you|please|help me|i need|i want|i would like)\s*/i, '')
    .replace(/^(how do i|how to|what is|where is|why is|what are|where can i find|how does)\s*/i, '')
    .replace(/[?!.,;]$/g, '')
    .trim();

  // Limit query length
  if (query.length > 200) {
    query = query.substring(0, 200);
  }

  return query;
};

export const formatToolCallResponse = (searchResults) => {
  // Temporarily disabled - will be enabled when documentation is publicly available
  return '';
  
  /*
  let response = '';

  if (searchResults.docs?.success || searchResults.wiki?.success) {
    response += 'I searched the OpenGrowBox documentation for you.\n\n';

    if (searchResults.docs?.success) {
      response += '📚 **Documentation**: Found relevant information\n';
    }

    if (searchResults.wiki?.success) {
      response += '📖 **Wiki**: Found relevant information\n';
    }

    response += '\nBased on this information, here\'s what I found:\n\n';
  } else {
    response += 'I attempted to search the OpenGrowBox documentation but encountered some issues. Let me help based on my knowledge instead.\n\n';
  }

  return response;
  */
};