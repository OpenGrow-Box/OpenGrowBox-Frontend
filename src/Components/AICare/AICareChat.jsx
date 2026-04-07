import { useState, useRef, useEffect, createContext, useContext } from 'react';
import styled from 'styled-components';
import { MdSend, MdImage, MdDelete, MdClose, MdCamera, MdOutlineErrorOutline, MdSmartToy, MdInfo, MdArrowDropDown, MdSettings, MdVisibility, MdChat, MdPsychology, MdCheckCircle, MdAnalytics, MdEdit } from 'react-icons/md';
import { Bot, Sprout, Search, BarChart3, Droplets, Bug, Lightbulb } from 'lucide-react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { useGlobalState } from '../Context/GlobalContext';
import { saveApiKey, getApiKey, hasAnyApiKey, getConfiguredProviders } from './utils/apiKeys';
import { sendToOpenAI, sendToOpenAIWithImage, listOpenAIModels } from './services/openaiClient';
import { sendToAnthropic, sendToAnthropicWithImage, listAnthropicModels } from './services/anthropicClient';
import { sendToOllama, sendToOllamaWithImage, listOllamaModels } from './services/ollamaClient';
import { sendToLMStudio, sendToLMStudioWithImage, listLMStudioModels } from './services/lmstudioClient';
import { fetchBothSources, createToolCallPrompt } from './services/webFetch';
import { detectNeedForWebSearch, extractSearchQuery, formatToolCallResponse } from './utils/toolDetection';

const AICareContext = createContext();

export const useAICare = () => useContext(AICareContext);

const SYSTEM_PROMPT_DETAILED = `You are Plant-Buddy, an expert AI assistant for the OpenGrowBox automated plant growing system. Your role is to help users achieve optimal plant growth and health.

## Your Capabilities

You are an expert in:
- Plant health analysis and diagnosis
- Nutrient deficiency identification and correction
- Pest and disease detection and treatment
- Growth stage assessment and guidance
- Environmental optimization (temperature, humidity, light, CO2)
- Hydroponic and soil-based cultivation techniques
- OpenGrowBox system configuration and troubleshooting

## Conversation Context

Remember the conversation history. Reference previous messages when responding. Build upon our discussion rather than repeating yourself. If I ask follow-up questions, maintain context from earlier in our conversation.

## Image Analysis Guidelines

When analyzing plant images, examine:
- **Leaf Condition**: Color changes (yellowing, browning, spots), curling, wilting, deformation
- **Stem & Growth**: Stunted growth, stretching, thinning, discoloration
- **Root Health** (if visible): Root rot, browning, stunted root development
- **Signs of Pests**: Insects, web, feeding marks, eggs, excrement
- **Disease Symptoms**: Fungal growth, mold, mildew, bacterial spots
- **Environmental Stress**: Heat stress, light burn, wind damage
- **Nutrient Issues**: Deficiency patterns, toxicity symptoms

## Response Guidelines

1. **Be Specific**: Identify exact issues with clear descriptions
2. **Be Actionable**: Provide concrete steps to resolve problems
3. **Explain Why**: Help the user understand the underlying causes
4. **Prioritize**: Address most critical issues first
5. **Use Data**: Reference specific numbers when discussing environmental parameters
6. **Ask Questions**: If you need more information (temperature, humidity, pH, etc.), ask

## OpenGrowBox Context

The OpenGrowBox is an automated grow system with:
- Environmental monitoring (temperature, humidity, CO2, light)
- Automated nutrient dosing and pH control
- Climate control systems
- LED grow lights with spectrum control
- Integrated camera monitoring for plant analysis

## Available Information

You have access to:
- Real-time sensor data (if connected)
- Environmental history and trends
- System configuration and settings
- Plant growth progress
- Camera images for visual analysis

## When Unsure

If you cannot definitively diagnose an issue:
1. List the most likely causes in order of probability
2. Request additional information (photos, sensor readings, system logs)
3. Suggest diagnostic steps to narrow down the issue
4. Recommend checking OpenGrowBox documentation for specific guidance

Be honest about limitations while providing the most helpful guidance possible.

Remember: The goal is to help the user grow healthy, thriving plants in their OpenGrowBox system.`;

const BASIC_IMAGE_ANALYSIS_PROMPT = `You are Plant-Buddy, an expert plant health analyst. Look at this image carefully and provide a detailed health assessment.

ANALYZE THESE ASPECTS:
🌿 OVERALL HEALTH: Rate as Excellent/Good/Fair/Poor. Describe the plant's general appearance, vigor, and vitality.

🍃 LEAF CONDITION: 
- Color: Are leaves vibrant green, yellowing, browning, spotted, or discolored?
- Structure: Any curling, wilting, drooping, or deformities?
- Damage: Signs of burning, nutrient deficiencies, or physical damage?

🪴 GROWTH & STRUCTURE:
- Stem health: Strong or weak, stretching, thinning?
- Overall structure: Normal growth or stunted?
- Any visible abnormalities?

🐛 PESTS & DISEASES:
- Look carefully for: insects, spider mites, aphids, whiteflies, thrips
- Check for: webbing, bite marks, holes in leaves, sticky residue
- Signs of disease: mold, mildew, fungus, bacterial spots, rot

⚠️ ENVIRONMENTAL STRESS:
- Heat stress: leaf edges curling up, crispy texture
- Light burn: bleached or burned spots
- Nutrient issues: yellowing patterns (old leaves = nitrogen, new leaves = iron, etc.)
- Water stress: wilting, drooping, or overwatering signs

YOUR RESPONSE FORMAT:
1. HEALTH RATING: [Excellent/Good/Fair/Poor] - Brief explanation
2. KEY FINDINGS: List 2-4 main observations (good or bad)
3. IDENTIFIED ISSUES: If any problems found, describe them specifically
4. RECOMMENDATIONS: Clear, actionable next steps to address issues or maintain health
5. MONITORING: What to watch for in coming days

Be specific about what you see. If you notice multiple plants, assess the overall health of the grow. Focus on actionable advice.`;

const SYSTEM_PROMPT_SIMPLE = `You are Plant-Buddy, a helpful AI assistant for the OpenGrowBox plant growing system.

You help users with:
- Plant health analysis and diagnosis
- Nutrient deficiency identification  
- Pest and disease detection
- Growth stage assessment
- Environmental optimization
- Answering questions about OpenGrowBox
- General plant care recommendations

When analyzing images, look for: leaf issues, nutrient deficiencies, pests, diseases, and environmental stress.

Always be helpful and friendly. Answer questions to the best of your ability. If you're unsure, provide your best assessment and suggest next steps.

You are knowledgeable about OpenGrowBox which is an automated grow system with environmental monitoring, automated nutrient dosing, climate control, and LED grow lights.`;

const PROMPT_TEMPLATES = [
  {
    id: 'analyze_plant',
    label: 'Plant Analysis',
    prompt: 'Please analyze my plant in the uploaded image',
    icon: Sprout
  },
  {
    id: 'diagnose_problem',
    label: 'Problem Diagnosis',
    prompt: 'What is wrong with my plant in the image?',
    icon: Search
  },
  {
    id: 'growth_stage',
    label: 'Growth Stage',
    prompt: 'What growth stage is my plant in?',
    icon: BarChart3
  },
  {
    id: 'nutrient_analysis',
    label: 'Nutrient Analysis',
    prompt: 'Are there any nutrient deficiencies visible?',
    icon: Droplets
  },
  {
    id: 'pest_detection',
    label: 'Pest Detection',
    prompt: 'Do you see any pests or diseases on my plant?',
    icon: Bug
  },
  {
    id: 'general_advice',
    label: 'General Tips',
    prompt: 'Can you give me some plant care advice?',
    icon: Lightbulb
  }
];

const AICareChat = () => {
  const { connection, currentRoom, entities } = useHomeAssistant();
  const { HASS } = useGlobalState();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showLlmSelector, setShowLlmSelector] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [availableLlms, setAvailableLlms] = useState([]);
  const [selectedLlm, setSelectedLlm] = useState(null);
  const [isCheckingLlm, setIsCheckingLlm] = useState(false);
  const [hasAttemptedMessage, setHasAttemptedMessage] = useState(false);
  const [showNoLlmMessage, setShowNoLlmMessage] = useState(false);
  const [useDirectApi, setUseDirectApi] = useState(true);
  const [apiProvider, setApiProvider] = useState(() => {
    const saved = localStorage.getItem('plantbuddy_provider');
    if (saved) return saved;

    const hasOpenAI = getApiKey('openai');
    const hasAnthropic = getApiKey('anthropic');
    const hasOllama = localStorage.getItem('plantbuddy_ollama_base_url');
    const hasLMStudio = localStorage.getItem('plantbuddy_lmstudio_base_url');

    if (hasOpenAI) return 'openai';
    if (hasAnthropic) return 'anthropic';
    if (hasOllama) return 'ollama';
    if (hasLMStudio) return 'lmstudio';
    return 'openai';
  });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem('plantbuddy_selected_model');
    if (saved) return saved;
    return 'gpt-4o';
  });
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState(() => localStorage.getItem('plantbuddy_ollama_base_url') || 'http://localhost:11434');
  const [lmstudioBaseUrl, setLMStudioBaseUrl] = useState(() => localStorage.getItem('plantbuddy_lmstudio_base_url') || 'http://localhost:1234/v1');
  const [sessionUsage, setSessionUsage] = useState({
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    requestCount: 0
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load conversation history on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('plantbuddy_messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        // console.log('Loaded conversation history:', parsedMessages.length, 'messages');
      } catch (error) {
        // console.error('Error loading conversation history:', error);
      }
    }
  }, []);

  // Check for available LLMs on mount and when entities change
  useEffect(() => {
    // console.log('Entities changed, checking LLMs...');
    checkAvailableLlms();
  }, [connection, entities]);

  // Check for available LLM providers on mount and when entities/connection changes
  useEffect(() => {
    // console.log('Entities changed, checking LLMs...');
    checkAvailableLlms();
  }, [connection, entities]);

  // Load models when provider changes
  useEffect(() => {
    loadAvailableModels();
  }, [apiProvider]);

  // Save selected model to localStorage
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('plantbuddy_selected_model', selectedModel);
    }
  }, [selectedModel]);

  const loadAvailableModels = async () => {
    setAvailableModels([]);
    setShowModelDropdown(false);

    try {
      let models = [];
      if (apiProvider === 'openai') {
        models = await listOpenAIModels();
      } else if (apiProvider === 'anthropic') {
        models = await listAnthropicModels();
      } else if (apiProvider === 'ollama') {
        models = await listOllamaModels();
      } else if (apiProvider === 'lmstudio') {
        models = await listLMStudioModels();
      }

      // console.log('Available models for', apiProvider, ':', models);
      // console.log('First model capabilities:', models[0]?.capabilities);
      setAvailableModels(models);

      // Set default model if current one not in list
      if (models.length > 0) {
        const currentInList = models.find(m => m.id === selectedModel);
        if (!currentInList) {
          const defaultModel = apiProvider === 'openai' ? 'gpt-4o' :
                            apiProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' :
                            apiProvider === 'ollama' ? models[0].id :
                            models[0].id;
          setSelectedModel(defaultModel);
        }
      }
    } catch (error) {
      // console.error('Error loading models:', error);
      setAvailableModels([]);

      // Show user-friendly error for connection issues
      if (apiProvider === 'ollama' || apiProvider === 'lmstudio') {
        const baseUrl = apiProvider === 'ollama' ? ollamaBaseUrl : lmstudioBaseUrl;
        const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
        const isHttp = baseUrl.startsWith('http://');

        let errorDetails = '';

        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED') || error.message.includes('ERR_CONNECTION_TIMED_OUT')) {
          if (isLocalhost) {
            errorDetails = `

Localhost connection issue detected. ${apiProvider === 'ollama' ? 'Ollama' : 'LM Studio'} is running on your local machine but the app cannot reach it.

To fix this, start ${apiProvider === 'ollama' ? 'Ollama' : 'LM Studio'} with CORS enabled:

For ${apiProvider === 'ollama' ? 'Ollama' : 'LM Studio'}:
${apiProvider === 'ollama' ? 'OLLAMA_ORIGINS="*" ollama serve' : 'Enable CORS in LM Studio settings'}

Or use your local IP address (${baseUrl.replace('localhost', window.location.hostname).replace('127.0.0.1', window.location.hostname)}) instead of localhost.
            `;
          } else if (isHttp && window.location.protocol === 'https:') {
            errorDetails = `

Mixed Content error: Your app is served over HTTPS but trying to connect to ${apiProvider} over HTTP.

To fix this:
1. Start ${apiProvider} with HTTPS, or
2. Serve your app over HTTP, or
3. Use a reverse proxy
            `;
          } else {
            errorDetails = `

Cannot connect to ${apiProvider === 'ollama' ? 'Ollama' : 'LM Studio'} at ${baseUrl}.

Possible causes:
- ${apiProvider === 'ollama' ? 'Ollama' : 'LM Studio'} is not running
- Incorrect URL
- Network firewall blocking the connection
- CORS not configured

Make sure ${apiProvider} is running and accessible from this device.
            `;
          }

          setErrorMessage(`${apiProvider === 'ollama' ? 'Ollama' : 'LM Studio'} Connection Failed${errorDetails}`);
          setShowErrorModal(true);
        }
      }
    }
  };

  // Show API settings if no providers configured
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasOllama = localStorage.getItem('plantbuddy_ollama_base_url');
      const hasLMStudio = localStorage.getItem('plantbuddy_lmstudio_base_url');
      if (!hasAnyApiKey() && availableLlms.length === 0 && !hasOllama && !hasLMStudio) {
        // console.log('No LLM configured - showing API settings');
        setShowApiSettings(true);
        setShowNoLlmMessage(true);
      } else {
        setShowNoLlmMessage(false);
        setShowSetupModal(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [availableLlms]);

  const checkAvailableLlms = () => {
    // console.log('=== Checking for LLMs ===');
    // console.log('Connection:', !!connection);
    // console.log('Entities:', entities ? Object.keys(entities).length : 0);
    // console.log('Has API Keys:', hasAnyApiKey());

    // Check for direct API keys first
    const hasOpenAI = getApiKey('openai');
    const hasAnthropic = getApiKey('anthropic');
    const hasOllama = localStorage.getItem('plantbuddy_ollama_base_url');
    const hasLMStudio = localStorage.getItem('plantbuddy_lmstudio_base_url');
    const providers = getConfiguredProviders();

    // console.log('OpenAI Key configured:', !!hasOpenAI);
    // console.log('Anthropic Key configured:', !!hasAnthropic);
    // console.log('Ollama configured:', !!hasOllama);
    // console.log('LM Studio configured:', !!hasLMStudio);
    // console.log('Configured providers:', providers);

    if (!hasAnyApiKey() && !hasOllama && !hasLMStudio) {
      // console.log('NO LLM configured - showing API settings modal');
      setShowNoLlmMessage(true);
      setShowApiSettings(true);
      return;
    }

    // Check if HA has LLMs as backup
    if (!entities) {
      // console.log('No entities available, using direct API');
      setShowNoLlmMessage(false);
      setShowSetupModal(false);
      return;
    }

    const haLlms = [];

    // Look for assist_pipeline entities
    Object.entries(entities).forEach(([key, entity]) => {
      if (key.startsWith('assist_pipeline.')) {
        haLlms.push({
          id: key,
          name: entity.attributes?.friendly_name || key.replace('assist_pipeline.', ''),
          ...entity
        });
      }

      if (key.startsWith('conversation.')) {
        haLlms.push({
          id: key,
          name: entity.attributes?.friendly_name || key.replace('conversation.', ''),
          ...entity
        });
      }
    });

    // console.log('Total HA LLMs found:', haLlms.length);

    setAvailableLlms(haLlms);
    setShowNoLlmMessage(false);
    setShowSetupModal(false);
    
    // If HA LLMs exist, we could show a selector
    if (haLlms.length > 0) {
      // For now, prefer direct API if keys are configured
      // console.log('Using direct API, HA LLMs available as backup');
    }
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem('plantbuddy_messages');
    const savedConversationId = localStorage.getItem('plantbuddy_conversation_id');
    const savedLlm = localStorage.getItem('plantbuddy_selected_llm');
    
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        // console.error('Failed to load messages:', e);
      }
    }
    if (savedConversationId) {
      setConversationId(savedConversationId);
    }
    if (savedLlm) {
      setSelectedLlm(savedLlm);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('plantbuddy_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('plantbuddy_conversation_id', conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (selectedLlm) {
      localStorage.setItem('plantbuddy_selected_llm', selectedLlm);
    }
  }, [selectedLlm]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const MAX_SESSION_TOKENS = 100000;

  const resetSession = () => {
    setMessages([]);
    setSessionUsage({
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      requestCount: 0
    });
    localStorage.removeItem('plantbuddy_messages');
    localStorage.removeItem('plantbuddy_conversation_id');
  };

  const handleSendMessage = async (customPrompt = null) => {
    if (isProcessing) return;

    if (sessionUsage.totalTokens >= MAX_SESSION_TOKENS) {
      setErrorMessage(`Session token limit (${MAX_SESSION_TOKENS.toLocaleString()}) reached. Please start a new conversation.`);
      setShowErrorModal(true);
      return;
    }

    const now = Date.now();
    if (handleSendMessage.lastCall && (now - handleSendMessage.lastCall) < 1000) {
      // console.log('Throttled - call too soon');
      return;
    }
    handleSendMessage.lastCall = now;

    // Check if any LLM is configured
    const hasOllama = localStorage.getItem('plantbuddy_ollama_base_url');
    const hasLMStudio = localStorage.getItem('plantbuddy_lmstudio_base_url');
    if (!hasAnyApiKey() && !hasOllama && !hasLMStudio) {
      setShowApiSettings(true);
      setShowNoLlmMessage(true);
      return;
    }

    const text = customPrompt || inputText.trim();
    if (!text && !selectedImage) return;

    const newMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      image: selectedImage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setSelectedImage(null);
    setIsProcessing(true);
    setHasAttemptedMessage(true);

    try {
      let responseResult = null;

      // Use direct API if configured
      if (hasAnyApiKey() || hasOllama || hasLMStudio) {
        if (selectedImage) {
          responseResult = await processWithImageAnalysis(text, selectedImage);
        } else {
          // Check if user mentions image-related keywords but hasn't uploaded an image
          const imageKeywords = /\b(image|photo|picture|picture|upload|camera|capture|analyze.*image|check.*photo|look at.*picture)/i;
          if (imageKeywords.test(text)) {
            setErrorMessage('You mentioned an image, but no image was uploaded. Please upload an image using the camera or file upload button for image analysis.');
            setShowErrorModal(true);
            setMessages(prev => prev.slice(0, -1));
            setIsProcessing(false);
            return;
          }
          
          // Check if we need to perform a web search for additional context
          const needsWebSearch = detectNeedForWebSearch(text, messages);

          if (needsWebSearch) {
            // console.log('Performing web search for additional context...');

            // Add a "searching" message
            const searchingMessage = {
              id: Date.now() + 0.5,
              role: 'assistant',
              content: '🔍 Searching OpenGrowBox documentation for additional context...',
              timestamp: new Date().toISOString(),
              isSystemMessage: true
            };
            setMessages(prev => [...prev, searchingMessage]);

            try {
              const searchQuery = extractSearchQuery(text);
              const searchResults = await fetchBothSources(searchQuery);

              // console.log('Search results:', searchResults);

              // Create a tool call context message
              const toolCallMessage = {
                id: Date.now() + 0.6,
                role: 'system',
                content: createToolCallPrompt(searchQuery, searchResults),
                timestamp: new Date().toISOString(),
                isSystemMessage: true
              };

              // Process with tool call context
              const updatedHistory = [...messages, newMessage, toolCallMessage];
              responseResult = await processWithDirectApiText(text, updatedHistory);

              // Add format tool call response
              responseResult.content = formatToolCallResponse(searchResults) + responseResult.content;
            } catch (searchError) {
              // console.error('Web search failed:', searchError);
              // Fall back to normal processing without search results
              responseResult = await processWithDirectApiText(text, messages);
            }
          } else {
            // Normal processing without web search
            responseResult = await processWithDirectApiText(text, messages);
          }
        }
      } else if (selectedImage) {
        responseResult = await processWithImageAnalysis(text, selectedImage);
      } else {
        // Check if user mentions image-related keywords but hasn't uploaded an image
        const imageKeywords = /\b(image|photo|picture|picture|upload|camera|capture|analyze.*image|check.*photo|look at.*picture)/i;
        if (imageKeywords.test(text)) {
          setErrorMessage('You mentioned an image, but no image was uploaded. Please upload an image using the camera or file upload button for image analysis.');
          setShowErrorModal(true);
          setMessages(prev => prev.slice(0, -1));
          setIsProcessing(false);
          return;
        }
        
        const content = await processWithHomeAssistant(text);
        responseResult = { content, usage: null };
      }

      // Update session usage
      if (responseResult?.usage) {
        setSessionUsage(prev => ({
          totalPromptTokens: prev.totalPromptTokens + (responseResult.usage.promptTokens || 0),
          totalCompletionTokens: prev.totalCompletionTokens + (responseResult.usage.completionTokens || 0),
          totalTokens: prev.totalTokens + (responseResult.usage.totalTokens || 0),
          requestCount: prev.requestCount + 1
        }));
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: responseResult.content,
        timestamp: new Date().toISOString(),
        usage: responseResult.usage
      };

      setMessages(prev => {
        // Remove searching message if it exists
        const filtered = prev.filter(m => !m.isSystemMessage);
        return [...filtered, aiMessage];
      });

      // Save conversation to localStorage (filter out system messages)
      const messagesToSave = [...messages, newMessage, aiMessage].filter(m => !m.isSystemMessage);
      localStorage.setItem('plantbuddy_messages', JSON.stringify(messagesToSave));
    } catch (error) {
      // console.error('Error processing message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isSystemMessage);
        return [...filtered, errorMessage];
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processWithDirectApi = async (text, image) => {
    const apiKey = getApiKey(apiProvider);

    if (apiProvider !== 'ollama' && apiProvider !== 'lmstudio' && !apiKey) {
      throw new Error(`No ${apiProvider.toUpperCase()} API key configured. Please add your API key in settings.`);
    }

    // Check if model supports vision when an image is provided
    if (image) {
      const currentModel = availableModels.find(m => m.id === selectedModel);
      if (currentModel && !currentModel.capabilities?.includes('vision')) {
        throw new Error(`The model "${selectedModel}" does not support vision/image analysis. Please select a model with vision capability (👁️ Vision tag) for image analysis.`);
      }
    }

    // Use basic prompt for image-only analysis, detailed prompt when text is provided
    const isImageOnly = image && (!text || text.trim() === '');
    const systemPrompt = isImageOnly ? BASIC_IMAGE_ANALYSIS_PROMPT : SYSTEM_PROMPT_SIMPLE;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: text || 'Please analyze this plant image.'
      }
    ];

    try {
      let result;

      if (apiProvider === 'openai') {
        if (image) {
          result = await sendToOpenAIWithImage(text, image, selectedModel);
        } else {
          result = await sendToOpenAI(messages, selectedModel);
        }
      } else if (apiProvider === 'anthropic') {
        if (image) {
          result = await sendToAnthropicWithImage(text, image, selectedModel);
        } else {
          result = await sendToAnthropic(messages, selectedModel);
        }
      } else if (apiProvider === 'ollama') {
        if (image) {
          result = await sendToOllamaWithImage(text, image, selectedModel);
        } else {
          result = await sendToOllama(messages, selectedModel);
        }
      } else if (apiProvider === 'lmstudio') {
        if (image) {
          result = await sendToLMStudioWithImage(text, image, selectedModel);
        } else {
          result = await sendToLMStudio(messages, selectedModel);
        }
      } else {
        throw new Error('Invalid API provider');
      }

      return result;
    } catch (error) {
      // console.error('Direct API error:', error);
      throw error;
    }
  };

  const processWithHomeAssistant = async (text) => {
    if (!connection) {
      return 'No connection to Home Assistant.';
    }

    try {
      const request = {
        type: 'conversation/process',
        text: text,
        language: 'en'
      };
      
      // Add agent_id if an LLM is selected
      if (selectedLlm) {
        request.agent_id = selectedLlm;
      }

      const response = await connection.sendMessagePromise(request);

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      if (response.response?.speech?.plain?.speech) {
        const speech = response.response.speech.plain.speech;
        
        // Check for generic HA responses that indicate no LLM
        const genericResponses = [
          'sorry, no',
          'not aware',
          'unknown',
          'no intent',
          "i don't know",
          'no device',
          'no area',
          'no weather',
          'cannot find',
          'could not find'
        ];
        
        const isGeneric = genericResponses.some(resp => 
          speech.toLowerCase().includes(resp)
        );
        
        if (isGeneric) {
          // No LLM configured or no agent selected
          if (!hasAnyApiKey()) {
            setTimeout(() => setShowApiSettings(true), 500);
          }
          
          return "I'm having trouble understanding. Please configure an API key in settings.";
        }
        
        return speech;
      } else if (response.response?.speech?.ssml?.speech) {
        return response.response.speech.ssml.speech;
      } else {
        if (!hasAnyApiKey()) {
          setTimeout(() => setShowApiSettings(true), 500);
        }
        return 'No response received.';
      }
    } catch (error) {
      throw new Error(`Home Assistant Error: ${error.message}`);
    }
  };

  const processWithImageAnalysis = async (text, image) => {
    // Try direct API first - no fallback for image analysis
    try {
      return await processWithDirectApi(text, image);
    } catch (error) {
      // console.error('Image analysis failed:', error);
      throw error;
    }
  };

  // Text-only direct API call with conversation history
  const processWithDirectApiText = async (text, conversationHistory = []) => {
    // console.log('=== processWithDirectApiText ===');
    // console.log('Provider:', apiProvider);
    // console.log('Text:', text);
    // console.log('Conversation history length:', conversationHistory.length);

    // Build messages with system prompt and conversation history
    // Get last 10 messages to avoid context overflow (adjust based on model)
    const maxHistoryLength = 10;
    const recentHistory = conversationHistory.slice(-maxHistoryLength);

    // Convert messages to API format
    const apiMessages = [
      {
        role: 'system',
        content: apiProvider === 'openai' || apiProvider === 'anthropic' ? SYSTEM_PROMPT_DETAILED : SYSTEM_PROMPT_SIMPLE
      },
      ...recentHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: text
      }
    ];

    // console.log('Total messages to send:', apiMessages.length);
    // console.log('Sending to', apiProvider, '...');

    try {
      let result;

      if (apiProvider === 'openai') {
        // console.log('Calling sendToOpenAI...');
        result = await sendToOpenAI(apiMessages, selectedModel);
        // console.log('OpenAI response:', result);
      } else if (apiProvider === 'anthropic') {
        // console.log('Calling sendToAnthropic...');
        result = await sendToAnthropic(apiMessages, selectedModel);
        // console.log('Anthropic response:', result);
      } else if (apiProvider === 'ollama') {
        // console.log('Calling sendToOllama...');
        result = await sendToOllama(apiMessages, selectedModel);
        // console.log('Ollama response:', result);
      } else if (apiProvider === 'lmstudio') {
        // console.log('Calling sendToLMStudio...');
        result = await sendToLMStudio(apiMessages, selectedModel);
        // console.log('LM Studio response:', result);
      } else {
        throw new Error('Invalid API provider');
      }

      return result;
    } catch (error) {
      // console.error('Direct API error:', error);
      throw error;
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('The selected image is too large. Please select an image under 5MB.');
      setShowErrorModal(true);
      return;
    }

    // Check if current model supports vision
    const currentModel = availableModels.find(m => m.id === selectedModel);
    if (currentModel && !currentModel.capabilities?.includes('vision')) {
      setErrorMessage(`The model "${currentModel.name || currentModel.id}" does not support image analysis. Please select a model with vision capability (👁️ Vision tag) to analyze images.`);
      setShowErrorModal(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage({
        data: e.target.result,
        name: file.name,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleTemplateClick = (template) => {
    setInputText(template.prompt);
    setShowTemplates(false);
    
    // Check if any provider is configured (API keys or local providers)
    const hasOllama = localStorage.getItem('plantbuddy_ollama_base_url');
    const hasLMStudio = localStorage.getItem('plantbuddy_lmstudio_base_url');
    if (!hasAnyApiKey() && !hasOllama && !hasLMStudio) {
      setShowApiSettings(true);
    }
  };

  const clearConversation = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setMessages([]);
    setConversationId(null);
    localStorage.removeItem('plantbuddy_messages');
    localStorage.removeItem('plantbuddy_conversation_id');
    // Reset session usage
    setSessionUsage({
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      requestCount: 0
    });
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleOpenCamera = async () => {
    // HASS and currentRoom are already available from component scope
    
    if (!HASS || !entities) {
      setErrorMessage('Home Assistant connection not available.');
      setShowErrorModal(true);
      return;
    }

    // Find cameras in current room
    const haEntities = HASS.entities || {};
    const devices = HASS.devices || {};
    
    let roomCameras = [];
    
    if (currentRoom) {
      // Get devices in current room
      const roomDeviceIds = Object.entries(devices)
        .filter(([, device]) => device.area_id === currentRoom.toLowerCase())
        .map(([key]) => key);
      
      // Find camera entities
      roomCameras = Object.entries(haEntities)
        .filter(([key, entity]) => {
          return key.startsWith('camera.') && 
                 roomDeviceIds.includes(entity.device_id) &&
                 entity.state !== 'unavailable';
        })
        .map(([key, entity]) => ({
          id: key,
          name: entity.attributes?.friendly_name || key.split('.').pop()
        }));
    }
    
    // If no room cameras, show all available cameras
    if (roomCameras.length === 0) {
      roomCameras = Object.entries(haEntities)
        .filter(([key, entity]) => {
          return key.startsWith('camera.') && entity.state !== 'unavailable';
        })
        .map(([key, entity]) => ({
          id: key,
          name: entity.attributes?.friendly_name || key.split('.').pop()
        }));
    }
    
    if (roomCameras.length === 0) {
      setErrorMessage('No cameras found in this room. Please ensure cameras are configured in Home Assistant.');
      setShowErrorModal(true);
      return;
    }
    
    // If only one camera, capture directly
    if (roomCameras.length === 1) {
      await captureFromCamera(roomCameras[0].id);
    } else {
      // Show camera selection modal
      setAvailableCameras(roomCameras);
      setShowCameraSelector(true);
    }
  };

  const captureFromCamera = async (cameraId) => {
    try {
      setIsProcessing(true);
      
      // Check if model supports vision
      const currentModel = availableModels.find(m => m.id === selectedModel);
      if (currentModel && !currentModel.capabilities?.includes('vision')) {
        setErrorMessage(`The model "${currentModel.name || currentModel.id}" does not support image analysis. Please select a model with vision capability.`);
        setShowErrorModal(true);
        setIsProcessing(false);
        return;
      }
      
      // Get camera image from Home Assistant
      const baseUrl = connection?.options?.auth?.data?.hassUrl || window.location.origin;
      const token = connection?.options?.auth?.accessToken;
      
      if (!token) {
        throw new Error('Authentication token not available');
      }
      
      const response = await fetch(`${baseUrl}/api/camera_proxy/${cameraId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch camera image: ${response.status}`);
      }
      
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const imageData = reader.result;
        setSelectedImage({
          data: imageData,
          name: `camera_${cameraId.split('.').pop()}_${Date.now()}.jpg`,
          size: imageData.length
        });
        setIsProcessing(false);
      };
      
      reader.readAsDataURL(blob);
      
    } catch (error) {
      // console.error('Camera capture error:', error);
      setErrorMessage(`Failed to capture image from camera: ${error.message}`);
      setShowErrorModal(true);
      setIsProcessing(false);
    }
  };

  const handleLlmSelect = (llmId) => {
    setSelectedLlm(llmId);
    setShowLlmSelector(false);
    localStorage.setItem('plantbuddy_selected_llm', llmId);
  };

  return (
    <AICareContext.Provider value={{ messages, isProcessing, conversationId }}>
      <ChatContainer>
        <ChatHeader>
          <HeaderLeft>
            <ChatIcon><Bot size={24} /></ChatIcon>
            <ChatTitle>Plant-Buddy</ChatTitle>
            <RoomBadge>{currentRoom || 'Global'}</RoomBadge>
            <ProviderContainer>
              <LlmBadge onClick={() => setShowProviderDropdown(!showProviderDropdown)}>
                {apiProvider === 'openai' ? 'OpenAI' : apiProvider === 'anthropic' ? 'Anthropic' : apiProvider === 'ollama' ? 'Ollama' : 'LM Studio'}
                <MdArrowDropDown size={12} />
              </LlmBadge>
              {showProviderDropdown && (
                <ProviderDropdown>
                  {getApiKey('openai') && (
                    <ProviderOption
                      $selected={apiProvider === 'openai'}
                      onClick={() => {
                        if (apiProvider !== 'openai') {
                          setApiProvider('openai');
                          localStorage.setItem('plantbuddy_provider', 'openai');
                          resetSession();
                        }
                        setShowProviderDropdown(false);
                      }}
                    >
                      OpenAI
                    </ProviderOption>
                  )}
                  {getApiKey('anthropic') && (
                    <ProviderOption
                      $selected={apiProvider === 'anthropic'}
                      onClick={() => {
                        if (apiProvider !== 'anthropic') {
                          setApiProvider('anthropic');
                          localStorage.setItem('plantbuddy_provider', 'anthropic');
                          resetSession();
                        }
                        setShowProviderDropdown(false);
                      }}
                    >
                      Anthropic
                    </ProviderOption>
                  )}
                  {localStorage.getItem('plantbuddy_ollama_base_url') && (
                    <ProviderOption
                      $selected={apiProvider === 'ollama'}
                      onClick={() => {
                        if (apiProvider !== 'ollama') {
                          setApiProvider('ollama');
                          localStorage.setItem('plantbuddy_provider', 'ollama');
                          resetSession();
                        }
                        setShowProviderDropdown(false);
                      }}
                    >
                      Ollama
                    </ProviderOption>
                  )}
                  {localStorage.getItem('plantbuddy_lmstudio_base_url') && (
                    <ProviderOption
                      $selected={apiProvider === 'lmstudio'}
                      onClick={() => {
                        if (apiProvider !== 'lmstudio') {
                          setApiProvider('lmstudio');
                          localStorage.setItem('plantbuddy_provider', 'lmstudio');
                          resetSession();
                        }
                        setShowProviderDropdown(false);
                      }}
                    >
                      LM Studio
                    </ProviderOption>
                  )}
                </ProviderDropdown>
              )}
            </ProviderContainer>
            <ModelContainer>
              <ModelBadge onClick={() => {
                if (availableModels.length > 0) {
                  setShowModelDropdown(!showModelDropdown);
                } else {
                  loadAvailableModels();
                }
              }}>
                <span>{selectedModel.length > 20 ? selectedModel.substring(0, 20) + '...' : selectedModel}</span>
                {availableModels.length > 0 && <MdArrowDropDown size={12} />}
              </ModelBadge>
              {selectedModel && availableModels.find(m => m.id === selectedModel)?.capabilities && (
                <ModelCapabilityTagsSmall>
                  {availableModels.find(m => m.id === selectedModel)?.capabilities?.map(cap => (
                    <CapabilityTagSmall key={cap} $type={cap}>
                      {cap === 'vision' ? <MdVisibility size={10} /> : cap === 'chat' ? <MdChat size={10} /> : <MdPsychology size={10} />}
                    </CapabilityTagSmall>
                  ))}
                </ModelCapabilityTagsSmall>
              )}
              {showModelDropdown && availableModels.length > 0 && (
                <ModelDropdown>
                  {availableModels.map(model => (
                    <ModelOption
                      key={model.id}
                      $selected={selectedModel === model.id}
                      onClick={() => {
                        if (selectedModel !== model.id) {
                          setSelectedModel(model.id);
                          resetSession();
                        }
                        setShowModelDropdown(false);
                      }}
                    >
                      <ModelOptionHeader>
                        <ModelOptionName>{model.name || model.id}</ModelOptionName>
                      </ModelOptionHeader>
                      {model.id !== model.name && <ModelOptionId>{model.id}</ModelOptionId>}
                      <ModelCapabilityTags>
                        {model.capabilities && model.capabilities.length > 0 ? (
                          model.capabilities.map(cap => (
                            <CapabilityTag key={cap} $type={cap}>
                              {cap === 'vision' ? <MdVisibility size={10} style={{ marginRight: '2px' }} /> : cap === 'chat' ? <MdChat size={10} style={{ marginRight: '2px' }} /> : <MdPsychology size={10} style={{ marginRight: '2px' }} />}
                              {cap === 'vision' ? 'Vision' : cap === 'chat' ? 'Chat' : 'Reasoning'}
                            </CapabilityTag>
                          ))
                        ) : (
                          <CapabilityTag $type="chat"><MdChat size={10} style={{ marginRight: '2px' }} />Chat</CapabilityTag>
                        )}
                      </ModelCapabilityTags>
                    </ModelOption>
                  ))}
                </ModelDropdown>
              )}
            </ModelContainer>
          </HeaderLeft>
          <HeaderActions>
            <SessionUsageBadge title="Session Token Usage">
              <MdAnalytics size={16} />
              <SessionUsageText>
                {sessionUsage.totalTokens.toLocaleString()} tokens
              </SessionUsageText>
            </SessionUsageBadge>
            <ActionButton onClick={() => setShowSetupModal(true)} title="Setup LLM" style={{ color: 'var(--primary-accent)', borderColor: 'var(--primary-accent)' }}>
              <MdSmartToy size={20} />
            </ActionButton>
            <ActionButton onClick={() => setShowApiSettings(true)} title="API Settings">
              <MdSettings size={20} />
            </ActionButton>
            <ActionButton onClick={clearConversation} title="Delete Conversation">
              <MdDelete size={20} />
            </ActionButton>
          </HeaderActions>
        </ChatHeader>

        <ChatContent>
          {showNoLlmMessage && (
            <NoLlmMessage>
              <NoLlmIcon><MdSmartToy size={48} /></NoLlmIcon>
              <NoLlmTitle>Configure AI Provider</NoLlmTitle>
              <NoLlmText>
                Plant-Buddy needs an AI provider to provide intelligent responses. Choose from OpenAI, Anthropic, Ollama (local), or LM Studio (local).
              </NoLlmText>
              <NoLlmButton onClick={() => setShowApiSettings(true)}>
                Configure Provider
              </NoLlmButton>
            </NoLlmMessage>
          )}

          {messages.length === 0 && !showNoLlmMessage && (
            <WelcomeMessage>
              <WelcomeIcon><Sprout size={64} /></WelcomeIcon>
              <WelcomeTitle>Welcome to Plant-Buddy!</WelcomeTitle>
              <WelcomeText>
                Chat with me or upload an image for plant analysis.
              </WelcomeText>
              {showTemplates && (
                <TemplatesContainer>
                  <TemplatesTitle>Choose a prompt:</TemplatesTitle>
                  <TemplatesGrid>
                    {PROMPT_TEMPLATES.map(template => {
                      const IconComponent = template.icon;
                      return (
                        <TemplateCard
                          key={template.id}
                          onClick={() => handleTemplateClick(template)}
                        >
                          <TemplateIcon><IconComponent size={24} /></TemplateIcon>
                          <TemplateLabel>{template.label}</TemplateLabel>
                        </TemplateCard>
                      );
                    })}
                  </TemplatesGrid>
                </TemplatesContainer>
              )}
            </WelcomeMessage>
          )}

          <MessagesContainer>
            {messages.map(message => (
              <MessageBubble key={message.id} role={message.role}>
                {message.image && (
                  <MessageImage src={message.image.data} alt={message.image.name} />
                )}
                <MessageText>{message.content}</MessageText>
                <MessageMeta>
                  <MessageTimestamp>
                    {new Date(message.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </MessageTimestamp>
                  {message.usage && message.role === 'assistant' && (
                    <MessageTokens>
                      {message.usage.estimated && <span title="Estimated tokens">~</span>}
                      {message.usage.totalTokens?.toLocaleString()} tokens
                      <span style={{ color: 'var(--second-text-color)', fontSize: '0.6rem' }}>
                        ({message.usage.promptTokens?.toLocaleString()} in / {message.usage.completionTokens?.toLocaleString()} out)
                      </span>
                    </MessageTokens>
                  )}
                </MessageMeta>
                {message.role === 'user' && (
                  <MessageActions>
                    <EditMessageButton 
                      onClick={() => {
                        setInputText(message.content);
                        if (message.image) {
                          setSelectedImage(message.image);
                        }
                        setTimeout(() => {
                          document.querySelector('.message-input')?.focus();
                        }, 100);
                      }}
                    >
                      <MdEdit size={12} />
                      Edit & Resend
                    </EditMessageButton>
                  </MessageActions>
                )}
              </MessageBubble>
            ))}
            {isProcessing && (
              <MessageBubble role="assistant">
                <TypingIndicator>
                  <TypingDot />
                  <TypingDot />
                  <TypingDot />
                </TypingIndicator>
              </MessageBubble>
            )}
            <div ref={messagesEndRef} />
          </MessagesContainer>
        </ChatContent>

        <InputArea>
          {selectedImage && (
            <ImagePreview>
              <PreviewImage src={selectedImage.data} alt={selectedImage.name} />
              <RemoveImageButton onClick={handleRemoveImage}>
                <MdClose size={16} />
              </RemoveImageButton>
            </ImagePreview>
          )}
          <InputRow>
            <ImageUploadButton
              onClick={() => {
                const currentModel = availableModels.find(m => m.id === selectedModel);
                if (currentModel && !currentModel.capabilities?.includes('vision')) {
                  setErrorMessage(`The model "${currentModel.name || currentModel.id}" does not support image analysis. Please select a model with vision capability (👁️ Vision tag) to analyze images.`);
                  setShowErrorModal(true);
                  return;
                }
                fileInputRef.current?.click();
              }}
              title={(() => {
                const currentModel = availableModels.find(m => m.id === selectedModel);
                if (currentModel && !currentModel.capabilities?.includes('vision')) {
                  return 'Image analysis not supported by current model';
                }
                return 'Upload image';
              })()}
              $disabled={(() => {
                const currentModel = availableModels.find(m => m.id === selectedModel);
                return currentModel && !currentModel.capabilities?.includes('vision');
              })()}
            >
              <MdImage size={20} />
            </ImageUploadButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <CameraButton
              onClick={() => {
                const currentModel = availableModels.find(m => m.id === selectedModel);
                if (currentModel && !currentModel.capabilities?.includes('vision')) {
                  setErrorMessage(`The model "${currentModel.name || currentModel.id}" does not support image analysis. Please select a model with vision capability.`);
                  setShowErrorModal(true);
                  return;
                }
                handleOpenCamera();
              }}
              title={(() => {
                const currentModel = availableModels.find(m => m.id === selectedModel);
                if (currentModel && !currentModel.capabilities?.includes('vision')) {
                  return 'Image analysis not supported by current model';
                }
                return 'Capture from room camera';
              })()}
              $disabled={(() => {
                const currentModel = availableModels.find(m => m.id === selectedModel);
                return currentModel && !currentModel.capabilities?.includes('vision');
              })()}
            >
              <MdCamera size={20} />
            </CameraButton>
            <MessageInput
              className="message-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message or upload an image..."
              disabled={isProcessing}
            />
            <SendButton
              onClick={() => handleSendMessage()}
              disabled={isProcessing || (!inputText.trim() && !selectedImage)}
              title="Send"
            >
              <MdSend size={20} />
            </SendButton>
          </InputRow>
        </InputArea>
      </ChatContainer>

      {showSetupModal && (
        <SetupModalOverlay onClick={() => setShowSetupModal(false)}>
          <SetupModalContent onClick={(e) => e.stopPropagation()}>
            <SetupModalHeader>
              <SetupModalIcon><MdSmartToy size={48} /></SetupModalIcon>
              <SetupModalHeaderContent>
                <SetupModalTitle>Setup Required</SetupModalTitle>
                <SetupModalSubtitle>Configure an LLM for Plant-Buddy</SetupModalSubtitle>
              </SetupModalHeaderContent>
            </SetupModalHeader>
            
            <SetupModalBody>
              <SetupStep>
                <SetupStepNumber>1</SetupStepNumber>
                <SetupStepContent>
                  <SetupStepTitle>Open Assist Settings</SetupStepTitle>
                  <SetupStepDescription>
                    Go to <strong>Settings</strong> → <strong>Devices & Services</strong> → <strong>Assist</strong>
                  </SetupStepDescription>
                </SetupStepContent>
              </SetupStep>
              
              <SetupStep>
                <SetupStepNumber>2</SetupStepNumber>
                <SetupStepContent>
                  <SetupStepTitle>Configure Assist Pipeline</SetupStepTitle>
                  <SetupStepDescription>
                    Click on <strong>Assist Pipelines</strong> and select or create a pipeline
                  </SetupStepDescription>
                </SetupStepContent>
              </SetupStep>
              
              <SetupStep>
                <SetupStepNumber>3</SetupStepNumber>
                <SetupStepContent>
                  <SetupStepTitle>Select an AI Provider</SetupStepTitle>
                  <SetupStepDescription>
                    Choose from:
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                      <li><strong>OpenAI</strong> (GPT-4o, GPT-4) - Best for image analysis</li>
                      <li><strong>Anthropic</strong> (Claude 3.5 Sonnet) - Excellent for plants</li>
                      <li><strong>Ollama</strong> (Local) - Free, runs locally</li>
                      <li><strong>LM Studio</strong> (Local) - Free, runs locally</li>
                    </ul>
                  </SetupStepDescription>
                </SetupStepContent>
              </SetupStep>

              <SetupStep>
                <SetupStepNumber>4</SetupStepNumber>
                <SetupStepContent>
                  <SetupStepTitle>Configure Provider</SetupStepTitle>
                  <SetupStepDescription>
                    Click the settings icon and configure your chosen provider with API key or base URL.
                  </SetupStepDescription>
                </SetupStepContent>
              </SetupStep>

              <SetupNote>
                <SetupNoteIcon><MdInfo size={20} /></SetupNoteIcon>
                <SetupNoteText>
                  Plant-Buddy needs an AI provider to provide intelligent responses. Configure one in the API settings.
                </SetupNoteText>
              </SetupNote>
            </SetupModalBody>
            
            <SetupModalFooter>
              <SetupButton onClick={() => setShowSetupModal(false)}>
                Got it, I'll configure it later
              </SetupButton>
            </SetupModalFooter>
          </SetupModalContent>
        </SetupModalOverlay>
      )}

      {showLlmSelector && (
        <LlmSelectorOverlay onClick={() => setShowLlmSelector(false)}>
          <LlmSelectorContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalIcon><MdSmartToy size={32} /></ModalIcon>
              <ModalTitle>Select LLM</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <ModalText>
                Choose which LLM to use for Plant-Buddy:
              </ModalText>
              <LlmList>
                {availableLlms.map(llm => (
                  <LlmOption
                    key={llm.id}
                    $selected={selectedLlm === llm.id}
                    onClick={() => handleLlmSelect(llm.id)}
                  >
                    <LlmOptionRadio $selected={selectedLlm === llm.id}>
                      {selectedLlm === llm.id && <LlmRadioDot />}
                    </LlmOptionRadio>
                    <LlmOptionContent>
                      <LlmOptionName>{llm.name}</LlmOptionName>
                      <LlmOptionId>{llm.id}</LlmOptionId>
                    </LlmOptionContent>
                  </LlmOption>
                ))}
                {availableLlms.length === 0 && !hasAnyApiKey() && !localStorage.getItem('plantbuddy_ollama_base_url') && !localStorage.getItem('plantbuddy_lmstudio_base_url') && (
                  <NoLlmsMessage>
                    No AI providers configured. Add your OpenAI, Anthropic API key, or configure Ollama/LM Studio.
                  </NoLlmsMessage>
                )}
              </LlmList>
              {availableLlms.length === 0 && !hasAnyApiKey() && !localStorage.getItem('plantbuddy_ollama_base_url') && !localStorage.getItem('plantbuddy_lmstudio_base_url') && (
                <SetupButtonContainer>
                  <SetupButton onClick={() => {
                    setShowLlmSelector(false);
                    setShowApiSettings(true);
                  }}>
                    Configure Provider
                  </SetupButton>
                </SetupButtonContainer>
              )}
            </ModalBody>
            <ModalActions>
              <CancelButton onClick={() => setShowLlmSelector(false)}>Cancel</CancelButton>
            </ModalActions>
          </LlmSelectorContent>
        </LlmSelectorOverlay>
      )}

      {showErrorModal && (
        <ModalOverlay onClick={() => setShowErrorModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalIcon><MdOutlineErrorOutline size={32} /></ModalIcon>
              <ModalTitle>Error</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <ModalText>
                {errorMessage}
              </ModalText>
            </ModalBody>
            <ModalActions>
              <CancelButton onClick={() => setShowErrorModal(false)}>OK</CancelButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {showSuccessModal && (
        <ModalOverlay onClick={() => setShowSuccessModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <ModalHeader>
              <ModalIcon style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <MdCheckCircle size={32} />
              </ModalIcon>
              <ModalTitle>Success</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <ModalText style={{ color: 'var(--main-text-color)' }}>
                {successMessage}
              </ModalText>
            </ModalBody>
            <ModalActions>
              <SaveButton onClick={() => setShowSuccessModal(false)}>OK</SaveButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {showDeleteModal && (
        <ModalOverlay onClick={handleCancelDelete}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalIcon><MdDelete size={32} /></ModalIcon>
              <ModalTitle>Delete Conversation</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <ModalText>
                Are you sure you want to delete the entire conversation? This action cannot be undone.
              </ModalText>
            </ModalBody>
            <ModalActions>
              <CancelButton onClick={handleCancelDelete}>Cancel</CancelButton>
              <DeleteButton onClick={handleConfirmDelete}>Delete</DeleteButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {showApiSettings && (
        <ModalOverlay onClick={() => setShowApiSettings(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <ModalHeader>
              <ModalIcon><MdSettings size={32} /></ModalIcon>
              <ModalTitle>API Settings</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <ModalText style={{ marginBottom: '1.5rem' }}>
                Configure your AI providers. Cloud providers require API keys, local providers need their base URL.
              </ModalText>

              <ApiProviderSelector>
                <ApiProviderOption
                  $selected={apiProvider === 'openai'}
                  onClick={() => setApiProvider('openai')}
                >
                  <ApiProviderLogo style={{ background: '#10a37f', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>
                    GPT
                  </ApiProviderLogo>
                  <ApiProviderName>OpenAI</ApiProviderName>
                </ApiProviderOption>
                <ApiProviderOption
                  $selected={apiProvider === 'anthropic'}
                  onClick={() => setApiProvider('anthropic')}
                >
                  <ApiProviderLogo style={{ background: '#d97757', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                    C
                  </ApiProviderLogo>
                  <ApiProviderName>Anthropic</ApiProviderName>
                </ApiProviderOption>
                <ApiProviderOption
                  $selected={apiProvider === 'ollama'}
                  onClick={() => setApiProvider('ollama')}
                >
                  <ApiProviderLogo style={{ background: '#ffffff', color: '#000', fontWeight: 'bold', fontSize: '12px' }}>
                    O
                  </ApiProviderLogo>
                  <ApiProviderName>Ollama</ApiProviderName>
                </ApiProviderOption>
                <ApiProviderOption
                  $selected={apiProvider === 'lmstudio'}
                  onClick={() => setApiProvider('lmstudio')}
                >
                  <ApiProviderLogo style={{ background: '#1e1e1e', color: '#fff', fontWeight: 'bold', fontSize: '10px' }}>
                    LM
                  </ApiProviderLogo>
                  <ApiProviderName>LM Studio</ApiProviderName>
                </ApiProviderOption>
              </ApiProviderSelector>

              {apiProvider === 'ollama' ? (
                <>
                  <ApiKeyInput
                    type="text"
                    placeholder="Ollama Base URL (e.g., http://localhost:11434)"
                    value={ollamaBaseUrl}
                    onChange={(e) => setOllamaBaseUrl(e.target.value)}
                  />
                  <ApiKeyHelp>
                    <ApiKeyHelpLink href="https://ollama.com/" target="_blank">
                      Learn more about Ollama →
                    </ApiKeyHelpLink>
                  </ApiKeyHelp>
                </>
              ) : apiProvider === 'lmstudio' ? (
                <>
                  <ApiKeyInput
                    type="text"
                    placeholder="LM Studio Base URL (e.g., http://localhost:1234/v1)"
                    value={lmstudioBaseUrl}
                    onChange={(e) => setLMStudioBaseUrl(e.target.value)}
                  />
                  <ApiKeyHelp>
                    <ApiKeyHelpLink href="https://lmstudio.ai/" target="_blank">
                      Learn more about LM Studio →
                    </ApiKeyHelpLink>
                  </ApiKeyHelp>
                </>
              ) : (
                <>
                  <ApiKeyInput
                    type="password"
                    placeholder={`Enter your ${apiProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API key`}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                  />

                  <ApiKeyHelp>
                    <ApiKeyHelpLink
                      href={apiProvider === 'openai'
                        ? 'https://platform.openai.com/api-keys'
                        : 'https://console.anthropic.com/settings/keys'}
                      target="_blank"
                    >
                      Get your {apiProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API key →
                    </ApiKeyHelpLink>
                  </ApiKeyHelp>
                </>
              )}

              {hasAnyApiKey() && (
                <ConfiguredProviders>
                  <ConfiguredTitle>Configured Providers:</ConfiguredTitle>
                  {getConfiguredProviders().map(provider => (
                    <ConfiguredBadge key={provider}>
                      {provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : provider}
                      <RemoveKeyButton onClick={() => {
                        saveApiKey(provider, '');
                      }}>×</RemoveKeyButton>
                    </ConfiguredBadge>
                  ))}
                  {ollamaBaseUrl && (
                    <ConfiguredBadge key="ollama">
                      Ollama
                      <RemoveKeyButton onClick={() => {
                        localStorage.removeItem('plantbuddy_ollama_base_url');
                        setOllamaBaseUrl('');
                      }}>×</RemoveKeyButton>
                    </ConfiguredBadge>
                  )}
                  {lmstudioBaseUrl && (
                    <ConfiguredBadge key="lmstudio">
                      LM Studio
                      <RemoveKeyButton onClick={() => {
                        localStorage.removeItem('plantbuddy_lmstudio_base_url');
                        setLMStudioBaseUrl('');
                      }}>×</RemoveKeyButton>
                    </ConfiguredBadge>
                  )}
                </ConfiguredProviders>
              )}
            </ModalBody>
            <ModalActions>
              <CancelButton onClick={() => setShowApiSettings(false)}>Cancel</CancelButton>
              <SaveButton onClick={async () => {
                if (apiProvider === 'ollama' && ollamaBaseUrl.trim()) {
                  setIsSavingKey(true);
                  try {
                    localStorage.setItem('plantbuddy_ollama_base_url', ollamaBaseUrl.trim());
                    setSuccessMessage('Ollama URL saved successfully!');
                    setShowSuccessModal(true);
                    setShowApiSettings(false);
                  } catch (e) {
                    setErrorMessage('Error saving Ollama URL');
                    setShowErrorModal(true);
                  }
                  setIsSavingKey(false);
                } else if (apiProvider === 'lmstudio' && lmstudioBaseUrl.trim()) {
                  setIsSavingKey(true);
                  try {
                    localStorage.setItem('plantbuddy_lmstudio_base_url', lmstudioBaseUrl.trim());
                    setSuccessMessage('LM Studio URL saved successfully!');
                    setShowSuccessModal(true);
                    setShowApiSettings(false);
                  } catch (e) {
                    setErrorMessage('Error saving LM Studio URL');
                    setShowErrorModal(true);
                  }
                  setIsSavingKey(false);
                } else if (apiKeyInput.trim()) {
                  setIsSavingKey(true);
                  try {
                    saveApiKey(apiProvider, apiKeyInput.trim());
                    setApiKeyInput('');
                    setSuccessMessage(`${apiProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API key saved successfully!`);
                    setShowSuccessModal(true);
                    setShowApiSettings(false);
                  } catch (e) {
                    setErrorMessage('Error saving API key');
                    setShowErrorModal(true);
                  }
                  setIsSavingKey(false);
                }
              }} disabled={(apiProvider === 'ollama' || apiProvider === 'lmstudio') ? false : (!apiKeyInput.trim() || isSavingKey)}>
                {isSavingKey ? 'Saving...' : 'Save'}
              </SaveButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {showCameraModal && (
        <CameraModalOverlay onClick={handleCloseCamera}>
          <CameraModalContent onClick={(e) => e.stopPropagation()}>
            <CameraModalHeader>
              <CameraModalTitle>Take Photo</CameraModalTitle>
              <CloseCameraButton onClick={handleCloseCamera}>
                <MdClose size={24} />
              </CloseCameraButton>
            </CameraModalHeader>
            <CameraModalBody>
              <CameraVideo
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />
              <CameraCanvas ref={canvasRef} style={{ display: 'none' }} />
            </CameraModalBody>
            <CameraModalFooter>
              <CameraCancelButton onClick={handleCloseCamera}>Cancel</CameraCancelButton>
              <CaptureButton onClick={handleCapturePhoto}>
                <MdCamera size={20} />
                Capture Photo
              </CaptureButton>
            </CameraModalFooter>
          </CameraModalContent>
        </CameraModalOverlay>
      )}
    </AICareContext.Provider>
  );
};

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  background: var(--main-bg-color);
  border-radius: 12px;
  overflow: hidden;

  @media (max-width: 768px) {
    height: calc(100vh - 250px);
  }
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--main-bg-card-color);
  border-bottom: 1px solid var(--glass-border-light);
  flex-wrap: wrap;
  gap: 0.5rem;

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: 0.35rem;
  }
`;

const ChatIcon = styled.span`
  font-size: 1.5rem;
`;

const ChatTitle = styled.h3`
  color: var(--main-text-color);
  font-size: 1.1rem;
  margin: 0;
  
  @media (max-width: 480px) {
    font-size: 0.95rem;
  }
`;

const ActionButton = styled.button`
  background: transparent;
  border: 1px solid var(--glass-border-light);
  color: var(--second-text-color);
  padding: 0.4rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--main-text-color);
    border-color: var(--primary-accent);
  }

  @media (max-width: 480px) {
    padding: 0.35rem;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const RoomBadge = styled.span`
  background: rgba(0, 255, 127, 0.1);
  color: var(--primary-accent);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--primary-accent);
`;

const ChatContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 127, 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 255, 127, 0.3);
    }
  }
`;

const WelcomeMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  color: var(--main-text-color);
`;

const NoLlmMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  background: rgba(0, 255, 127, 0.05);
  border: 1px solid rgba(0, 255, 127, 0.1);
  border-radius: 12px;
  margin: 1rem;
`;

const NoLlmIcon = styled.div`
  color: var(--primary-accent);
  margin-bottom: 1rem;
`;

const NoLlmTitle = styled.h3`
  color: var(--main-text-color);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

const NoLlmText = styled.p`
  color: var(--second-text-color);
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const NoLlmButton = styled.button`
  background: linear-gradient(145deg, rgba(0, 255, 127, 0.15), rgba(0, 200, 100, 0.1));
  border: 1px solid var(--primary-accent);
  color: var(--primary-accent);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;

  &:hover {
    background: linear-gradient(145deg, rgba(0, 255, 127, 0.25), rgba(0, 200, 100, 0.2));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 255, 127, 0.3);
  }
`;

const WelcomeIcon = styled.span`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const WelcomeTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--main-text-color);
`;

const WelcomeText = styled.p`
  color: var(--second-text-color);
  margin-bottom: 2rem;
  max-width: 500px;
`;

const TemplatesContainer = styled.div`
  width: 100%;
  max-width: 800px;
`;

const TemplatesTitle = styled.h4`
  color: var(--main-text-color);
  font-size: 1rem;
  margin-bottom: 1rem;
`;

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  width: 100%;
`;

const TemplateCard = styled.div`
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary-accent);
    box-shadow: 0 4px 12px rgba(0, 255, 127, 0.2);
  }
`;

const TemplateIcon = styled.span`
  font-size: 1.5rem;
`;

const TemplateLabel = styled.span`
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 500;
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 1rem;
  border-radius: 16px;
  position: relative;
  animation: fadeIn 0.3s ease;
  
  ${props => props.role === 'user' ? `
    align-self: flex-end;
    background: linear-gradient(145deg, rgba(0, 255, 127, 0.15), rgba(0, 200, 100, 0.1));
    border: 1px solid var(--primary-accent);
    border-bottom-right-radius: 4px;
  ` : `
    align-self: flex-start;
    background: var(--main-bg-card-color);
    border: 1px solid var(--glass-border-light);
    border-bottom-left-radius: 4px;
  `}

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MessageImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  object-fit: contain;
`;

const MessageText = styled.p`
  margin: 0;
  color: var(--main-text-color);
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const MessageMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const MessageTimestamp = styled.span`
  font-size: 0.7rem;
  color: var(--second-text-color);
  opacity: 0.7;
`;

const MessageTokens = styled.span`
  font-size: 0.65rem;
  color: var(--primary-accent);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(0, 255, 127, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
`;

const SessionUsageBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(0, 255, 127, 0.1);
  color: var(--primary-accent);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 500;
  border: 1px solid var(--primary-accent);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 255, 127, 0.2);
  }
`;

const SessionUsageText = styled.span`
  font-size: 0.7rem;
`;

const MessageActions = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const EditMessageButton = styled.button`
  background: transparent;
  border: 1px solid var(--primary-accent);
  color: var(--primary-accent);
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
  font-weight: 500;
  -webkit-tap-highlight-color: transparent;

  @media (max-width: 768px) {
    padding: 0.4rem 0.7rem;
    font-size: 0.75rem;
    border-radius: 8px;
  }

  &:hover {
    background: rgba(0, 255, 127, 0.1);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    background: rgba(0, 255, 127, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
`;

const TypingDot = styled.div`
  width: 8px;
  height: 8px;
  background: var(--primary-accent);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;

  &:nth-child(1) { animation-delay: -0.32s; }
  &:nth-child(2) { animation-delay: -0.16s; }

  @keyframes typing {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const InputArea = styled.div`
  padding: 1rem;
  background: var(--main-bg-card-color);
  border-top: 1px solid var(--glass-border-light);
  
  @media (max-width: 768px) {
    padding: 0.75rem;
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
`;

const ImagePreview = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--glass-border-light);
  border-radius: 8px;
  animation: slideDown 0.3s ease;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const PreviewImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  
  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
  }
`;

const RemoveImageButton = styled.button`
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }

  &:hover {
    background: rgba(255, 107, 107, 0.3);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const InputRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    gap: 0.4rem;
  }
`;

const ImageUploadButton = styled.button`
  background: transparent;
  border: 1px solid var(--glass-border-light);
  color: ${props => props.$disabled ? 'var(--second-text-color)' : 'var(--second-text-color)'};
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 8px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: ${props => props.$disabled ? 0.4 : 1};
  -webkit-tap-highlight-color: transparent;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
  }

  &:hover {
    ${props => !props.$disabled && `
      background: rgba(255, 255, 255, 0.05);
      color: var(--primary-accent);
      border-color: var(--primary-accent);
    `}
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const MessageInput = styled.textarea`
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--glass-border-light);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: var(--main-text-color);
  font-family: inherit;
  font-size: 0.95rem;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  outline: none;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:focus {
    border-color: var(--primary-accent);
    box-shadow: 0 0 0 3px rgba(0, 255, 127, 0.1);
  }

  &::placeholder {
    color: var(--second-text-color);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    font-size: 16px;
    padding: 0.65rem 0.85rem;
    border-radius: 12px;
  }
`;

const SendButton = styled.button`
  background: linear-gradient(145deg, rgba(0, 255, 127, 0.15), rgba(0, 200, 100, 0.1));
  border: 1px solid var(--primary-accent);
  color: var(--primary-accent);
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    border-radius: 12px;
  }

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 255, 127, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: modalIn 0.3s ease;

  @keyframes modalIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ModalIcon = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(255, 107, 107, 0.15);
  border: 1px solid var(--chart-error-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--chart-error-color);
`;

const ModalTitle = styled.h3`
  color: var(--main-text-color);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const ModalBody = styled.div`
  margin-bottom: 2rem;
`;

const ModalText = styled.p`
  color: var(--second-text-color);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  background: transparent;
  border: 1px solid var(--glass-border-light);
  color: var(--second-text-color);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--main-text-color);
    border-color: var(--primary-accent);
  }
`;

const DeleteButton = styled.button`
  background: linear-gradient(145deg, rgba(255, 107, 107, 0.15), rgba(255, 107, 107, 0.1));
  border: 1px solid var(--chart-error-color);
  color: var(--chart-error-color);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;

  &:hover {
    background: linear-gradient(145deg, rgba(0, 255, 127, 0.25), rgba(0, 200, 100, 0.2));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 255, 127, 0.3);
  }
`;

const LlmBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(0, 255, 127, 0.1);
  color: var(--primary-accent);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--primary-accent);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 255, 127, 0.2);
  }
`;

const ProviderContainer = styled.div`
  position: relative;
`;

const ProviderDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  overflow: hidden;
  z-index: 100;
  min-width: 120px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const ProviderOption = styled.div`
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  cursor: pointer;
  color: var(--main-text-color);
  background: ${props => props.$selected ? 'rgba(0, 255, 127, 0.1)' : 'transparent'};
  border-left: 2px solid ${props => props.$selected ? 'var(--primary-accent)' : 'transparent'};

  &:hover {
    background: rgba(0, 255, 127, 0.15);
  }
`;

const ModelContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ModelBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--second-text-color);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 500;
  border: 1px solid var(--glass-border-light);
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 200px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--main-text-color);
    border-color: var(--primary-accent);
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const ModelCapabilityTagsSmall = styled.div`
  display: flex;
  gap: 0.15rem;
  align-items: center;
`;

const CapabilityTagSmall = styled.span`
  font-size: 0.65rem;
  padding: 0.1rem 0.25rem;
  border-radius: 4px;
  background: ${props => {
    switch(props.$type) {
      case 'vision':
        return 'rgba(147, 51, 234, 0.15)';
      case 'chat':
        return 'rgba(59, 130, 246, 0.15)';
      case 'reasoning':
        return 'rgba(16, 185, 129, 0.15)';
      default:
        return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  border: 1px solid ${props => {
    switch(props.$type) {
      case 'vision':
        return 'rgba(147, 51, 234, 0.3)';
      case 'chat':
        return 'rgba(59, 130, 246, 0.3)';
      case 'reasoning':
        return 'rgba(16, 185, 129, 0.3)';
      default:
        return 'var(--glass-border-light)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  width: 20px;
  height: 20px;
  padding: 0;
`;

const ModelDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  overflow: hidden;
  z-index: 100;
  min-width: 200px;
  max-width: 300px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 127, 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 255, 127, 0.3);
    }
  }
`;

const ModelOption = styled.div`
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: var(--main-text-color);
  background: ${props => props.$selected ? 'rgba(0, 255, 127, 0.2)' : 'transparent'};
  border-left: 2px solid ${props => props.$selected ? 'var(--primary-accent)' : 'transparent'};
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &:hover {
    background: rgba(0, 255, 127, 0.15);
  }
`;

const ModelOptionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const ModelOptionName = styled.span`
  font-size: 0.8rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;

const ModelOptionId = styled.span`
  font-size: 0.65rem;
  color: var(--second-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ModelCapabilityTags = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin-top: 0.35rem;
  min-height: 1.5rem;
`;

const CapabilityTag = styled.span`
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  background: ${props => {
    switch(props.$type) {
      case 'vision':
        return 'rgba(147, 51, 234, 0.15)';
      case 'chat':
        return 'rgba(59, 130, 246, 0.15)';
      case 'reasoning':
        return 'rgba(16, 185, 129, 0.15)';
      default:
        return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  color: ${props => {
    switch(props.$type) {
      case 'vision':
        return '#c084fc';
      case 'chat':
        return '#60a5fa';
      case 'reasoning':
        return '#34d399';
      default:
        return 'var(--second-text-color)';
    }
  }};
  border: 1px solid ${props => {
    switch(props.$type) {
      case 'vision':
        return 'rgba(147, 51, 234, 0.3)';
      case 'chat':
        return 'rgba(59, 130, 246, 0.3)';
      case 'reasoning':
        return 'rgba(16, 185, 129, 0.3)';
      default:
        return 'var(--glass-border-light)';
    }
  }};
  white-space: nowrap;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 0.2rem;
`;

const LlmSelectorOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
`;

const LlmSelectorContent = styled.div`
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: modalIn 0.3s ease;
`;

const LlmList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
`;

const LlmOption = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.$selected ? 'rgba(0, 255, 127, 0.1)' : 'rgba(0, 0, 0, 0.2)'};
  border: 1px solid ${props => props.$selected ? 'var(--primary-accent)' : 'var(--glass-border-light)'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$selected ? 'rgba(0, 255, 127, 0.15)' : 'rgba(0, 0, 0, 0.3)'};
    border-color: var(--primary-accent);
  }
`;

const LlmOptionRadio = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.$selected ? 'var(--primary-accent)' : 'var(--glass-border-light)'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const LlmRadioDot = styled.div`
  width: 10px;
  height: 10px;
  background: var(--primary-accent);
  border-radius: 50%;
`;

const LlmOptionContent = styled.div`
  flex: 1;
`;

const LlmOptionName = styled.div`
  color: var(--main-text-color);
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
`;

const LlmOptionId = styled.div`
  color: var(--second-text-color);
  font-size: 0.8rem;
  font-family: monospace;
`;

const NoLlmsMessage = styled.div`
  text-align: center;
  color: var(--second-text-color);
  padding: 2rem;
  font-size: 0.9rem;
`;

const SetupButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;

const CameraButton = styled.button`
  background: transparent;
  border: 1px solid var(--glass-border-light);
  color: var(--second-text-color);
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 8px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: ${props => props.$disabled ? 0.4 : 1};
  -webkit-tap-highlight-color: transparent;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
  }

  &:hover {
    ${props => !props.$disabled && `
      background: rgba(255, 255, 255, 0.05);
      color: var(--primary-accent);
      border-color: var(--primary-accent);
    `}
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const CameraModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
`;

const CameraModalContent = styled.div`
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 16px;
  overflow: hidden;
  max-width: 800px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: cameraModalIn 0.3s ease;

  @keyframes cameraModalIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

const CameraModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--glass-border-light);
`;

const CameraModalTitle = styled.h3`
  color: var(--main-text-color);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const CloseCameraButton = styled.button`
  background: transparent;
  border: none;
  color: var(--second-text-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--main-text-color);
  }
`;

const CameraModalBody = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.3);
  min-height: 400px;
`;

const CameraVideo = styled.video`
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const CameraCanvas = styled.canvas``;

const CameraModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid var(--glass-border-light);
`;

const CameraCancelButton = styled.button`
  background: transparent;
  border: 1px solid var(--glass-border-light);
  color: var(--second-text-color);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--main-text-color);
    border-color: var(--primary-accent);
  }
`;

const CaptureButton = styled.button`
  background: linear-gradient(145deg, rgba(0, 255, 127, 0.15), rgba(0, 200, 100, 0.1));
  border: 1px solid var(--primary-accent);
  color: var(--primary-accent);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: linear-gradient(145deg, rgba(0, 255, 127, 0.25), rgba(0, 200, 100, 0.2));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 255, 127, 0.3);
  }
`;

const SetupModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(8px);
  padding: 1rem;
`;

const SetupModalContent = styled.div`
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 16px;
  overflow: hidden;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: modalIn 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
`;

const SetupModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--glass-border-light);
`;

const SetupModalIcon = styled.div`
  color: var(--primary-accent);
  flex-shrink: 0;
`;

const SetupModalHeaderContent = styled.div`
  flex: 1;
`;

const SetupModalTitle = styled.h2`
  color: var(--main-text-color);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`;

const SetupModalSubtitle = styled.p`
  color: var(--second-text-color);
  font-size: 0.9rem;
  margin: 0;
`;

const SetupModalBody = styled.div`
  padding: 1.5rem;
`;

const SetupStep = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 1rem;
  }
`;

const SetupStepNumber = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(145deg, rgba(0, 255, 127, 0.2), rgba(0, 200, 100, 0.1));
  border: 1px solid var(--primary-accent);
  border-radius: 50%;
  color: var(--primary-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
`;

const SetupStepContent = styled.div`
  flex: 1;
`;

const SetupStepTitle = styled.h4`
  color: var(--main-text-color);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`;

const SetupStepDescription = styled.p`
  color: var(--second-text-color);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
`;

const SetupNote = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(0, 255, 127, 0.05);
  border: 1px solid rgba(0, 255, 127, 0.1);
  border-radius: 8px;
`;

const SetupNoteIcon = styled.div`
  color: var(--primary-accent);
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
`;

const SetupNoteText = styled.p`
  color: var(--main-text-color);
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0;
`;

const SetupModalFooter = styled.div`
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid var(--glass-border-light);
  display: flex;
  justify-content: flex-end;
`;

const SetupButton = styled.button`
  background: linear-gradient(145deg, rgba(0, 255, 127, 0.15), rgba(0, 200, 100, 0.1));
  border: 1px solid var(--primary-accent);
  color: var(--primary-accent);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;

  &:hover {
    background: linear-gradient(145deg, rgba(0, 255, 127, 0.25), rgba(0, 200, 100, 0.2));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 255, 127, 0.3);
  }
`;

const ApiProviderSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ApiProviderOption = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: ${props => props.$selected ? 'rgba(0, 255, 127, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$selected ? 'var(--primary-accent)' : 'var(--glass-border)'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 255, 127, 0.15);
    border-color: var(--primary-accent);
  }
`;

const ApiProviderLogo = styled.div`
  width: 40px;
  height: 40px;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: bold;
  font-size: 14px;
`;

const ApiProviderName = styled.span`
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 500;
`;

const ApiKeyInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--main-text-color);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;

  &::placeholder {
    color: var(--second-text-color);
  }

  &:focus {
    border-color: var(--primary-accent);
  }
`;

const ApiKeyHelp = styled.div`
  margin-top: 0.75rem;
  text-align: center;
`;

const ApiKeyHelpLink = styled.a`
  color: var(--primary-accent);
  font-size: 0.85rem;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const ConfiguredProviders = styled.div`
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--glass-border);
`;

const ConfiguredTitle = styled.p`
  color: var(--second-text-color);
  font-size: 0.85rem;
  margin: 0 0 0.75rem 0;
`;

const ConfiguredBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: rgba(0, 255, 127, 0.1);
  border: 1px solid var(--primary-accent);
  border-radius: 20px;
  color: var(--primary-accent);
  font-size: 0.8rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
`;

const RemoveKeyButton = styled.button`
  background: none;
  border: none;
  color: var(--primary-accent);
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;

  &:hover {
    color: #ff6b6b;
  }
`;

const SaveButton = styled.button`
  background: linear-gradient(145deg, rgba(0, 255, 127, 0.2), rgba(0, 200, 100, 0.15));
  border: 1px solid var(--primary-accent);
  color: var(--primary-accent);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;

  &:hover:not(:disabled) {
    background: linear-gradient(145deg, rgba(0, 255, 127, 0.3), rgba(0, 200, 100, 0.25));
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default AICareChat;