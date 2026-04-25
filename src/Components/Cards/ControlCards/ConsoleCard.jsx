import React, { useState, useRef, useEffect, useCallback } from "react";
import styled from "styled-components";
import { FaTerminal, FaCopy} from "react-icons/fa";
import { useHomeAssistant } from "../../Context/HomeAssistantContext";

// ---------- Enhanced Styles ----------
const ConsoleWrapper = styled.div`
  background: linear-gradient(145deg,
    rgba(8, 8, 12, 0.98) 0%,
    rgba(12, 12, 18, 0.98) 50%,
    rgba(8, 8, 12, 0.98) 100%
  );
  backdrop-filter: blur(20px);
  color: var(--primary-accent);
  font-family: "JetBrains Mono", "Fira Code", "SF Mono", monospace;
  border-radius: 12px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(0, 255, 127, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1000px;
  height: 600px;
  border: 1px solid rgba(0, 255, 127, 0.15);
  position: relative;

  @media (max-width: 768px) {
    max-width: 100%;
    height: 500px;
    border-radius: 8px;
  }
`;

const Header = styled.div`
  background: linear-gradient(145deg,
    rgba(15, 15, 20, 0.95) 0%,
    rgba(20, 20, 28, 0.95) 100%
  );
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--primary-accent);
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid rgba(0, 255, 127, 0.12);

  @media (max-width: 640px) {
    padding: 12px 16px;
    font-size: 13px;
  }
`;

const ConsoleOutput = styled.div`
  flex-grow: 1;
  padding: 16px 20px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
  background: transparent;
  
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 127, 0.2);
    border-radius: 4px;
    
    &:hover {
      background: rgba(0, 255, 127, 0.35);
    }
  }

  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 12px;
  }
`;

const Line = styled.div`
  margin-bottom: 2px;
  word-break: break-word;
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const Timestamp = styled.span`
  color: #666;
  font-size: 11px;
  flex-shrink: 0;
  user-select: none;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(0, 255, 127, 0.1);
  padding: 12px 20px;
  position: relative;
  gap: 10px;

  @media (max-width: 640px) {
    padding: 10px 16px;
  }
`;

const InputContainer = styled.div`
  flex-grow: 1;
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--primary-accent);
  font-family: inherit;
  font-size: 14px;
  padding: 4px 0;
  
  &::placeholder {
    color: rgba(0, 255, 127, 0.3);
  }
`;

const AutocompleteDropdown = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: rgba(20, 20, 28, 0.98);
  border: 1px solid rgba(0, 255, 127, 0.2);
  border-radius: 8px;
  margin-bottom: 8px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  z-index: 100;
`;

const SuggestionItem = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.15s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover, &.selected {
    background: rgba(0, 255, 127, 0.1);
  }
  
  &.selected {
    border-left: 3px solid var(--primary-accent);
  }
`;

const SuggestionCommand = styled.span`
  color: var(--primary-accent);
  font-weight: 600;
  min-width: 120px;
`;

const SuggestionDesc = styled.span`
  color: #888;
  font-size: 12px;
  flex-grow: 1;
`;

const CopyButton = styled.button`
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0;
  
  ${Line}:hover & {
    opacity: 1;
  }
  
  &:hover {
    color: var(--primary-accent);
    background: rgba(0, 255, 127, 0.1);
  }
`;

const CommandTag = styled.span`
  display: inline-block;
  background: rgba(0, 255, 127, 0.1);
  color: var(--primary-accent);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-right: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 255, 127, 0.2);
  }
`;

const HelpBox = styled.div`
  background: rgba(0, 255, 127, 0.05);
  border: 1px solid rgba(0, 255, 127, 0.15);
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  font-size: 12px;
  line-height: 1.8;
`;

const HelpTitle = styled.div`
  color: var(--primary-accent);
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 255, 127, 0.2);
`;

const HelpGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
`;

const HelpItem = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(0, 255, 127, 0.05);
  }
`;

// ---------- Component ----------
const ConsoleCard = () => {
  const [lines, setLines] = useState([
    { type: 'system', content: 'OpenGrowBox Console v2.0', timestamp: new Date() },
    { type: 'info', content: 'Type \'help\' for available commands or start typing for suggestions', timestamp: new Date() },
    { type: 'divider', content: '' },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyDraft, setHistoryDraft] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [dynamicCommands, setDynamicCommands] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const outputRef = useRef(null);
  const inputRef = useRef(null);
  
  const { connection, currentRoom } = useHomeAssistant();

  // Track previous room for detecting room changes
  const prevRoomRef = useRef(currentRoom);

  // Clear state on room change
  useEffect(() => {
    if (prevRoomRef.current !== currentRoom) {
      const oldRoom = prevRoomRef.current;
      prevRoomRef.current = currentRoom;

      setLines(prev => [
        ...prev,
        { type: 'divider', content: '' },
        { type: 'system', content: `📍 Switched to Room: ${currentRoom || 'global'}`, timestamp: new Date() },
        { type: 'divider', content: '' },
      ]);
      setDynamicCommands({});
      setInput('');
      setShowSuggestions(false);
    }
  }, [currentRoom]);

  // Load commands via WebSocket
  useEffect(() => {
    if (!connection || !currentRoom) return;

    const unsubscribe = connection.subscribeEvents(
      (event) => {
        const { room, commands } = event.data;
        if (room !== currentRoom) return;
        setDynamicCommands({ [room]: commands });
      },
      "ogb_commands_response"
    );

    const requestCommands = async () => {
      try {
        await connection.sendMessagePromise({
          type: "fire_event",
          event_type: "ogb_get_commands",
          event_data: { room: currentRoom, request_id: Date.now() },
        });
      } catch (error) {
        console.error('Failed to request commands:', error);
      }
    };

    requestCommands();
    return () => unsubscribe.then((unsub) => unsub());
  }, [connection, currentRoom]);

  // Backend response handler
  useEffect(() => {
    if (!connection) return;

    const unsubscribe = connection.subscribeEvents(
      (event) => {
        const { room, message, type = "info" } = event.data;
        if (room !== currentRoom) return;
        addLine(message, type);
      },
      "ogb_console_response"
    );

    return () => unsubscribe.then((unsub) => unsub());
  }, [connection, currentRoom]);

  // Load persisted command history
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("console_history");
      if (!storedHistory) return;

      const parsed = JSON.parse(storedHistory);
      if (Array.isArray(parsed)) {
        setHistory(parsed.filter((entry) => typeof entry === "string"));
      }
    } catch (error) {
      console.error("Failed to load console history:", error);
    }
  }, []);

  const addLine = useCallback((content, type = 'info') => {
    setLines(prev => [...prev, { type, content, timestamp: new Date() }]);
  }, []);

  // Autocomplete logic
  useEffect(() => {
    if (!input.trim()) {
      setShowSuggestions(false);
      return;
    }

    const allCommands = [];
    Object.entries(dynamicCommands).forEach(([room, cmds]) => {
      Object.entries(cmds).forEach(([name, info]) => {
        allCommands.push({ name, ...info, room });
      });
    });

    const filtered = allCommands.filter(cmd => 
      cmd.name.toLowerCase().startsWith(input.toLowerCase())
    );

    setSuggestions(filtered.slice(0, 5));
    setShowSuggestions(filtered.length > 0);
    setSelectedSuggestion(0);
  }, [input, dynamicCommands]);

  const handleCommand = async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    addLine(trimmed, 'command');

    if (trimmed === "clear") {
      setLines([{ type: 'system', content: 'Console cleared', timestamp: new Date() }]);
      return;
    }

    if (trimmed === "help") {
      showHelp();
      return;
    }

    if (trimmed.startsWith("help ")) {
      const cmdName = trimmed.substring(5).trim();
      showCommandHelp(cmdName);
      return;
    }

    // Add to history
    setHistory((prevHistory) => {
      const newHistory = [...prevHistory, trimmed];
      localStorage.setItem("console_history", JSON.stringify(newHistory));
      return newHistory;
    });
    setHistoryIndex(-1);
    setHistoryDraft("");

    // Send to backend
    if (connection) {
      try {
        await connection.sendMessagePromise({
          type: "fire_event",
          event_type: "ogb_console_command",
          event_data: {
            command: trimmed,
            room: currentRoom || "unknown",
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        addLine(error.message, 'error');
      }
    }
  };

  const showHelp = () => {
    const helpContent = (
      <HelpBox>
        <HelpTitle>📚 Available Commands</HelpTitle>
        <HelpGrid>
          {Object.entries(dynamicCommands).map(([room, cmds]) => 
            Object.entries(cmds).map(([name, info]) => (
              <HelpItem key={name} onClick={() => handleCommand(`help ${name}`)}>
                <CommandTag>{name}</CommandTag>
                <span style={{ color: '#888' }}>{info.description?.substring(0, 50)}...</span>
              </HelpItem>
            ))
          )}
        </HelpGrid>
      </HelpBox>
    );
    addLine(helpContent, 'help');
  };

  const showCommandHelp = (cmdName) => {
    let cmdInfo = null;
    for (const room in dynamicCommands) {
      if (dynamicCommands[room][cmdName]) {
        cmdInfo = dynamicCommands[room][cmdName];
        break;
      }
    }

    if (!cmdInfo) {
      addLine(`Unknown command: '${cmdName}'`, 'error');
      return;
    }

    const helpContent = (
      <HelpBox>
        <HelpTitle>🔧 {cmdName}</HelpTitle>
        <div style={{ marginBottom: '12px' }}>
          <strong style={{ color: 'var(--primary-accent)' }}>Description:</strong>
          <div style={{ marginTop: '4px', color: '#aaa' }}>{cmdInfo.description}</div>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <strong style={{ color: 'var(--primary-accent)' }}>Usage:</strong>
          <code style={{ 
            display: 'block', 
            marginTop: '4px', 
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
            color: '#0ff'
          }}>
            {cmdInfo.usage}
          </code>
        </div>
        {cmdInfo.examples?.length > 0 && (
          <div>
            <strong style={{ color: 'var(--primary-accent)' }}>Examples:</strong>
            {cmdInfo.examples.map((ex, i) => (
              <div key={i} style={{ 
                marginTop: '4px', 
                padding: '6px 12px',
                background: 'rgba(0,255,127,0.05)',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                $ {ex}
              </div>
            ))}
          </div>
        )}
      </HelpBox>
    );
    addLine(helpContent, 'help');
  };

  const handleKeyDown = (e) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (suggestions[selectedSuggestion]) {
          setInput(suggestions[selectedSuggestion].name + ' ');
          setShowSuggestions(false);
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand(input);
      setInput('');
      setShowSuggestions(false);
      setHistoryIndex(-1);
      setHistoryDraft('');
    } else if (e.key === 'ArrowUp' && !showSuggestions) {
      e.preventDefault();
      if (history.length > 0) {
        if (historyIndex < 0) {
          setHistoryDraft(input);
        }
        const newIndex = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown' && !showSuggestions) {
      e.preventDefault();
      if (history.length > 0) {
        if (historyIndex < 0) {
          return;
        }

        const newIndex = historyIndex >= history.length - 1 ? -1 : historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(newIndex >= 0 ? history[newIndex] : historyDraft);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const renderLine = (line, index) => {
    // Handle divider type
    if (line.type === 'divider') {
      return <div key={index} style={{ borderTop: '1px solid rgba(0,255,127,0.1)', margin: '8px 0' }} />;
    }
    
    // Safe timestamp handling
    const timeStr = line.timestamp instanceof Date 
      ? line.timestamp.toLocaleTimeString() 
      : new Date().toLocaleTimeString();
    
    let content;
    switch (line.type) {
      case 'command':
        content = (
          <>
            <span style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>$ {line.content}</span>
          </>
        );
        break;
      case 'error':
        content = <span style={{ color: '#ff4444' }}>❌ {line.content}</span>;
        break;
      case 'success':
        content = <span style={{ color: '#44ff44' }}>✓ {line.content}</span>;
        break;
      case 'system':
        content = <span style={{ color: '#ffaa00', fontWeight: 600 }}>⚡ {line.content}</span>;
        break;
      case 'help':
        return <div key={index}>{line.content}</div>;
      default:
        content = <span style={{ color: '#aaa' }}>{line.content}</span>;
    }

    return (
      <Line key={index}>
        <Timestamp>{timeStr}</Timestamp>
        {content}
        <CopyButton onClick={() => copyToClipboard(line.content)}>
          <FaCopy size={12} />
        </CopyButton>
      </Line>
    );
  };

  return (
    <ConsoleWrapper>
      <Header>
        <FaTerminal size={16} />
        <span>OGB Console</span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
          {currentRoom || 'global'}
        </span>
      </Header>
      
      <ConsoleOutput ref={outputRef}>
        {lines.map((line, index) => renderLine(line, index))}
      </ConsoleOutput>
      
      <InputWrapper>
        <span style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>$</span>
        <InputContainer>
          {showSuggestions && (
            <AutocompleteDropdown>
              {suggestions.map((sugg, idx) => (
                <SuggestionItem 
                  key={sugg.name}
                  className={idx === selectedSuggestion ? 'selected' : ''}
                  onClick={() => {
                    setInput(sugg.name + ' ');
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                >
                  <SuggestionCommand>{sugg.name}</SuggestionCommand>
                  <SuggestionDesc>{sugg.description?.substring(0, 40)}...</SuggestionDesc>
                </SuggestionItem>
              ))}
            </AutocompleteDropdown>
          )}
          <StyledInput
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type command... (Tab for autocomplete)"
            autoFocus
          />
        </InputContainer>
      </InputWrapper>
    </ConsoleWrapper>
  );
};

export default ConsoleCard;
