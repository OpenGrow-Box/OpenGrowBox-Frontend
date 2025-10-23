import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { FaTerminal, FaChevronRight, FaWifi, FaCircle } from "react-icons/fa";
import { MdSignalWifiOff } from "react-icons/md";
import { useHomeAssistant } from "../../Context/HomeAssistantContext";
// ---------- Styles ----------
const ConsoleWrapper = styled.div`
  background-color: #0a0a0a;
  color: #00ff7f;
  font-family: "Fira Code", "Courier New", monospace;
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(0, 255, 127, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  height: 500px;
  border: 1px solid rgba(0, 255, 127, 0.2);
`;

const Header = styled.div`
  background: linear-gradient(90deg, #0f0f0f 0%, #1a1a1a 100%);
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  color: #00ff7f;
  font-weight: 600;
  font-size: 16px;
  border-bottom: 1px solid rgba(0, 255, 127, 0.3);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #00ff7f, transparent);
    opacity: 0.5;
  }
`;

const HeaderTitle = styled.span`
  font-weight: 600;
  font-size: 16px;
`;

const StatusIndicator = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: rgba(26, 26, 26, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(0, 255, 127, 0.2);
`;

const StatusDot = styled(FaCircle)`
  width: 8px;
  height: 8px;
  color: ${props => props.$online ? '#4ade80' : '#f87171'};
  animation: ${props => props.$online ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const StatusText = styled.span`
  font-size: 12px;
  color: ${props => props.$online ? '#4ade80' : '#f87171'};
  font-weight: 500;
`;

const RoomBadge = styled.div`
  font-size: 12px;
  opacity: 0.7;
  padding: 6px 12px;
  background-color: rgba(26, 26, 26, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(0, 255, 127, 0.2);
`;

const ConsoleOutput = styled.div`
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.7;
  background: #0a0a0a;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 255, 127, 0.3) #1a1a1a;

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(0, 255, 127, 0.3), rgba(0, 255, 127, 0.5));
    border-radius: 5px;
    border: 2px solid #1a1a1a;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(0, 255, 127, 0.5), rgba(0, 255, 127, 0.7));
  }

  div {
    margin-bottom: 3px;
    word-break: break-word;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: #0f0f0f;
  border-top: 1px solid rgba(0, 255, 127, 0.3);
  padding: 14px 20px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, rgba(0, 255, 127, 0.3), transparent);
  }
`;

const Prompt = styled.span`
  color: #00ff7f;
  margin-right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
`;

const Input = styled.input`
  flex-grow: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #00ff7f;
  font-family: "Fira Code", "Courier New", monospace;
  font-size: 14px;
  caret-color: #00ff7f;
  
  &::placeholder {
    color: rgba(0, 255, 127, 0.4);
  }
  
  &:focus {
    color: #00ff7f;
  }
`;

// ---------- Component ----------
const ConsoleCard = () => {
  const [lines, setLines] = useState([
    "[SYSTEM] Welcome to OGB Console v1.0.1 🧠",
    "[INFO] Type 'help' to see available commands.",
    "",
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isConnected, setIsConnected] = useState(false);
  const outputRef = useRef(null);
  
  // Simuliere Connection Status (ersetze mit echter HomeAssistant Connection)
  const {connection,currentRoom} = useHomeAssistant()

  // Load history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("console_history");
    if (stored) setHistory(JSON.parse(stored));
    
    // Check connection status
    const checkConnection = () => {
      const haConnected = localStorage.getItem('ha_connected') === 'true';
      setIsConnected(haConnected || connection !== null);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, [connection]);

  // Backend Events
  useEffect(() => {
    if (!connection) return;

    const unsubscribe = connection.subscribeEvents(
      (event) => {
        const { room, message, type = "info" } = event.data;
        if (room !== currentRoom) return;

        const timestamp = new Date().toLocaleTimeString();
        const formattedMessage = formatMessage(timestamp, message, type);
        setLines((prev) => [...prev, formattedMessage]);
      },
      "ogb_console_response"
    );

    return () => unsubscribe.then((unsub) => unsub());
  }, [connection, currentRoom]);

  const formatMessage = (timestamp, message, type = "info") => {
    const prefix = type === "error" ? "[ERROR]" : 
                   type === "success" ? "[SUCCESS]" : 
                   "[RESPONSE]";
    
    return `<timestamp>[${timestamp}]</timestamp> <${type}>${prefix}</${type}> ${message}`;
  };

  const commands = {
    "help": [
      "<help>┌───────────────────┐</help>",
      "<help>│AVAILABLE COMMANDS │</help>",
      "<help>├───────────────────┤</help>",
      "<help>│ help          Show this help menu               </help>",
      "<help>│ history       Display command history           </help>",
      "<help>│ clearhistory  Clear command history             </help>",
      "<help>│ clear         Clear console output              </help>",
      "<help>│ version       Show console version              </help>",
      "<help>│ status        Show connection status            </help>",
      "<help>│ gcd           Show all Device cooldowns         </help>",
      "<help>│ gcd 'cap' 'm' Set Device capability cooldown    </help>",
      "<help>├──────────────────────────────┤</help>",
      "<help>│ Tip: Grow Smart, Grow Better │</help>",
      "<help>└──────────────────────────────┘</help>",
      "",
    ],
    "version": [
      "<success>🚀 OGB Console v1.0.1</success>",
      "<info>Built with ❤️ for Home Assistant</info>",
      "<info>Type 'help' for available commands</info>",
      "",
    ],
    "status": () => [
      `<info>Connection Status: ${isConnected ? '<success>🟢 ONLINE</success>' : '<e>🔴 OFFLINE</e>'}</info>`,
      `<info>Current Room: <success>${currentRoom || 'global'}</success></info>`,
      `<info>Commands in History: <success>${history.length}</success></info>`,
      "",
    ],
  };

  const sendConsoleEvent = async (command) => {
    if (!connection) {
      const timestamp = new Date().toLocaleTimeString();
      setLines((prev) => [...prev, formatMessage(timestamp, "No Home Assistant connection!", "error")]);
      return;
    }
    
    try {
      const eventType = "ogb_console_command";
      const eventData = {
        command,
        room: currentRoom || "unknown",
        timestamp: new Date().toISOString(),
      };
      
      await connection.sendMessagePromise({
        type: "fire_event",
        event_type: eventType,
        event_data: eventData,
      });
      
      const timestamp = new Date().toLocaleTimeString();
      setLines((prev) => [...prev, formatMessage(timestamp, "Command sent to HA", "success")]);
    } catch (error) {
      const timestamp = new Date().toLocaleTimeString();
      setLines((prev) => [...prev, formatMessage(timestamp, error.message, "error")]);
    }
  };

  const handleCommand = (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const timestamp = new Date().toLocaleTimeString();
    const commandLine = `<timestamp>[${timestamp}]</timestamp> <command>ogb$ ${trimmed}</command>`;
    
    if (trimmed === "clear") {
      setLines([`<success>[${timestamp}] Console cleared!</success>`]);
      return;
    }

    if (trimmed === "clearhistory") {
      setHistory([]);
      localStorage.removeItem("console_history");
      setLines((prev) => [...prev, commandLine, `<success>[${timestamp}] History cleared!</success>`]);
      setHistoryIndex(-1);
      return;
    }

    const newHistory = [...history, trimmed];
    setHistory(newHistory);
    localStorage.setItem("console_history", JSON.stringify(newHistory));
    setHistoryIndex(-1);

    if (trimmed === "history") {
      const historyLines = newHistory.length > 0 
        ? newHistory.map((h, i) => `<timestamp>[${timestamp}]</timestamp> <command>${i + 1}. ${h}</command>`)
        : [`<success>[${timestamp}] No command history!</success>`];
      
      setLines((prev) => [...prev, commandLine, ...historyLines]);
      return;
    }

    const cmdData = commands[trimmed];
    if (cmdData) {
      const cmdLines = typeof cmdData === 'function' ? cmdData() : cmdData;
      setLines((prev) => [...prev, commandLine, ...cmdLines]);
      return;
    }

    setLines((prev) => [...prev, commandLine]);
    sendConsoleEvent(trimmed);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    handleCommand(input);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
      return;
    }
    
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const newIndex = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(history[newIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (history.length === 0) return;
      const newIndex = historyIndex < 0 ? -1 : Math.min(history.length - 1, historyIndex + 1);
      setHistoryIndex(newIndex);
      setInput(newIndex >= 0 ? history[newIndex] : "");
    }
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const renderLine = (line) => {
    return line
      .replace(/<timestamp>(.*?)<\/timestamp>/g, '<span style="color: #9ca3af; font-size: 11px;">$1</span>')
      .replace(/<command>(.*?)<\/command>/g, '<span style="color: #22d3ee; font-weight: 600;">$1</span>')
      .replace(/<response>(.*?)<\/response>/g, '<span style="color: #c084fc;">$1</span>')
      .replace(/<e>(.*?)<\/error>/g, '<span style="color: #f87171; font-weight: 600;">$1</span>')
      .replace(/<success>(.*?)<\/success>/g, '<span style="color: #4ade80; font-weight: 600;">$1</span>')
      .replace(/<info>(.*?)<\/info>/g, '<span style="color: #60a5fa;">$1</span>')
      .replace(/<help>(.*?)<\/help>/g, '<span style="color: #10b981; font-family: monospace;">$1</span>');
  };

  return (
    <ConsoleWrapper>
      <Header>
        <FaTerminal size={20} />
        <HeaderTitle>OGB Console v1.0.1</HeaderTitle>
        
        <StatusIndicator>
          <StatusBadge>
            <StatusDot $online={isConnected} />
            {isConnected ? (
              <FaWifi size={16} style={{ color: '#4ade80' }} />
            ) : (
              <MdSignalWifiOff size={16} style={{ color: '#f87171' }} />
            )}
            <StatusText $online={isConnected}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </StatusText>
          </StatusBadge>
          
          <RoomBadge>
            {currentRoom || 'global'}
          </RoomBadge>
        </StatusIndicator>
      </Header>
      
      <ConsoleOutput ref={outputRef}>
        {lines.map((line, index) => (
          <div key={index} dangerouslySetInnerHTML={{ __html: renderLine(line) }} />
        ))}
      </ConsoleOutput>
      
      <InputWrapper>
        <Prompt>
          <FaChevronRight size={12} />
          <span>ogb$</span>
        </Prompt>
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command... (↑↓ for history)"
          autoFocus
        />
      </InputWrapper>
    </ConsoleWrapper>
  );
};

export default ConsoleCard;