import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { FaTerminal, FaChevronRight, FaWifi, FaCircle } from "react-icons/fa";
import { MdSignalWifiOff } from "react-icons/md";
import { useHomeAssistant } from "../../Context/HomeAssistantContext";
import { getThemeColor } from "../../../utils/themeColors";
// ---------- Styles ----------
const ConsoleWrapper = styled.div`
  background: linear-gradient(135deg,
    rgba(10, 10, 10, 0.95) 0%,
    rgba(15, 15, 15, 0.95) 50%,
    rgba(10, 10, 10, 0.95) 100%
  );
  backdrop-filter: blur(20px);
  color: var(--primary-accent);
  font-family: "JetBrains Mono", "Fira Code", "Courier New", monospace;
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 255, 127, 0.15),
    0 2px 8px rgba(0, 255, 127, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 950px;
  height: 550px;
  border: 1px solid rgba(0, 255, 127, 0.25);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      rgba(0, 255, 127, 0.8) 0%,
      rgba(0, 195, 247, 0.8) 50%,
      rgba(156, 39, 176, 0.8) 100%
    );
    border-radius: 16px 16px 0 0;
  }

  @media (max-width: 768px) {
    max-width: 100%;
    height: 480px;
    border-radius: 12px;
  }

  @media (max-width: 640px) {
    height: 420px;
    border-radius: 10px;
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg,
    rgba(15, 15, 15, 0.9) 0%,
    rgba(26, 26, 26, 0.9) 100%
  );
  backdrop-filter: blur(15px);
  padding: 18px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--primary-accent);
  font-weight: 700;
  font-size: 17px;
  border-bottom: 1px solid rgba(0, 255, 127, 0.3);
  position: relative;
  z-index: 2;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(0, 255, 127, 0.6) 30%,
      rgba(0, 255, 127, 0.8) 50%,
      rgba(0, 255, 127, 0.6) 70%,
      transparent 100%
    );
  }

  @media (max-width: 640px) {
    padding: 14px 18px;
    font-size: 15px;
    gap: 12px;
  }
`;

const HeaderTitle = styled.span`
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0.025em;
  text-shadow: 0 1px 2px rgba(0, 255, 127, 0.3);

  @media (max-width: 640px) {
    font-size: 15px;
  }
`;

const StatusIndicator = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 18px;

  @media (max-width: 640px) {
    gap: 12px;
  }
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: linear-gradient(135deg,
    rgba(26, 26, 26, 0.6) 0%,
    rgba(15, 15, 15, 0.6) 100%
  );
  backdrop-filter: blur(8px);
  border-radius: 10px;
  border: 1px solid rgba(0, 255, 127, 0.25);
  box-shadow: 0 2px 8px rgba(0, 255, 127, 0.1);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 255, 127, 0.4);
    box-shadow: 0 4px 12px rgba(0, 255, 127, 0.15);
  }

  @media (max-width: 640px) {
    padding: 6px 10px;
    gap: 8px;
  }
`;

const StatusDot = styled(FaCircle)`
  width: 10px;
  height: 10px;
  color: ${props => props.$online ? 'var(--main-arrow-up)' : 'var(--error-text-color)'};
  filter: ${props => props.$online
    ? 'drop-shadow(0 0 6px rgba(74, 222, 128, 0.6))'
    : 'drop-shadow(0 0 6px rgba(248, 113, 113, 0.6))'
  };
  animation: ${props => props.$online ? 'onlinePulse 2s ease-in-out infinite' : 'offlinePulse 3s ease-in-out infinite'};

  @keyframes onlinePulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.2);
    }
  }

  @keyframes offlinePulse {
    0%, 100% {
      opacity: 0.6;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }
`;

const StatusText = styled.span`
  font-size: 13px;
  color: ${props => props.$online ? 'var(--main-arrow-up)' : 'var(--error-text-color)'};
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: uppercase;
`;

const RoomBadge = styled.div`
  font-size: 12px;
  font-weight: 600;
  opacity: 0.8;
  padding: 8px 14px;
  background: linear-gradient(135deg,
    rgba(59, 130, 246, 0.2) 0%,
    rgba(147, 51, 234, 0.2) 100%
  );
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: var(--focus-color);
  letter-spacing: 0.025em;
  text-transform: uppercase;

  @media (max-width: 640px) {
    padding: 6px 10px;
    font-size: 11px;
  }
`;

const ConsoleOutput = styled.div`
  flex-grow: 1;
  padding: 24px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.6;
  background: linear-gradient(135deg,
    rgba(10, 10, 10, 0.98) 0%,
    rgba(15, 15, 15, 0.98) 100%
  );
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 255, 127, 0.4) rgba(26, 26, 26, 0.3);
  position: relative;
  z-index: 1;

  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: linear-gradient(180deg,
      rgba(26, 26, 26, 0.3) 0%,
      rgba(15, 15, 15, 0.3) 100%
    );
    border-radius: 6px;
    margin: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg,
      rgba(0, 255, 127, 0.4) 0%,
      rgba(0, 195, 247, 0.4) 50%,
      rgba(0, 255, 127, 0.4) 100%
    );
    border-radius: 6px;
    border: 2px solid rgba(26, 26, 26, 0.3);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg,
      rgba(0, 255, 127, 0.6) 0%,
      rgba(0, 195, 247, 0.6) 50%,
      rgba(0, 255, 127, 0.6) 100%
    );
  }

  &::-webkit-scrollbar-corner {
    background: rgba(26, 26, 26, 0.3);
  }

  div {
    margin-bottom: 4px;
    word-break: break-word;
    transition: all 0.2s ease;
  }

  @media (max-width: 768px) {
    padding: 18px;
    font-size: 13px;
  }

  @media (max-width: 640px) {
    padding: 14px;
    font-size: 12px;
    line-height: 1.5;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  background: linear-gradient(135deg,
    rgba(15, 15, 15, 0.9) 0%,
    rgba(26, 26, 26, 0.9) 100%
  );
  backdrop-filter: blur(15px);
  border-top: 1px solid rgba(0, 255, 127, 0.3);
  padding: 18px 24px;
  position: relative;
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(0, 255, 127, 0.5) 30%,
      rgba(0, 255, 127, 0.7) 50%,
      rgba(0, 255, 127, 0.5) 70%,
      transparent 100%
    );
  }

  @media (max-width: 640px) {
    padding: 14px 18px;
  }
`;

const Prompt = styled.span`
  color: var(--primary-accent);
  margin-right: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 15px;
  text-shadow: 0 1px 2px rgba(0, 255, 127, 0.3);
  filter: drop-shadow(0 0 4px rgba(0, 255, 127, 0.2));

  @media (max-width: 640px) {
    margin-right: 12px;
    font-size: 14px;
    gap: 8px;
  }
`;

const Input = styled.input`
  flex-grow: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--primary-accent);
  font-family: "JetBrains Mono", "Fira Code", "Courier New", monospace;
  font-size: 15px;
  font-weight: 500;
  caret-color: #00ff7f;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 255, 127, 0.2);

  &::placeholder {
    color: rgba(0, 255, 127, 0.5);
    font-weight: 400;
  }

  &:focus {
    color: #4ade80;
    text-shadow: 0 1px 3px rgba(74, 222, 128, 0.3);
    filter: drop-shadow(0 0 6px rgba(74, 222, 128, 0.2));
  }

  @media (max-width: 640px) {
    font-size: 14px;
  }
`;

// ---------- Component ----------
const ConsoleCard = () => {
  const [lines, setLines] = useState([
    "<success>╔══════════════════════════════════════════════════════════════╗</success>",
    "<success>║                    OGB Console v1.1.0                       ║</success>",
    "<success>║                 Advanced Grow Control System                ║</success>",
    "<success>╚══════════════════════════════════════════════════════════════╝</success>",
    "",
    "<info>Type '<command>help</command>' to see all available commands.</info>",
    "<info>New: '<command>gcd</command>', '<command>list</command>', '<command>device_states</command>'</info>",
    "<info>Use ↑↓ arrows for command history.</info>",
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
      "<help>┌─────────────────────┐</help>",
      "<help>│   AVAILABLE COMMANDS   │</help>",
      "<help>├─────────────────────┤</help>",
      "<help>│ help              Show this help menu                 </help>",
      "<help>│ version           Show console version                </help>",
      "<help>│ test              Run test command                   </help>",
      "<help>│ gcd               Show all Device cooldowns           </help>",
      "<help>│ gcd 'cap' 'm'     Set Device capability cooldown      </help>",
      "<help>│ list capabilities Show available capabilities         </help>",
      "<help>│ list devices      Show device listing                 </help>",
      "<help>│ device_states     Show current device states         </help>",
      "<help>│ status            Show connection status              </help>",
      "<help>│ history           Display command history             </help>",
      "<help>│ clearhistory      Clear command history               </help>",
      "<help>│ clear             Clear console output                </help>",
      "<help>├──────────────────────────────┤</help>",
      "<help>│ Tip: Grow Smart, Grow Better │</help>",
      "<help>└──────────────────────────────┘</help>",
      "",
    ],
    "version": [
      "<success>🚀 OGB Console v1.1.0</success>",
      "<info>Built with ❤️ for Home Assistant</info>",
      "<info>Supports advanced grow control commands</info>",
      "<info>Type 'help' for available commands</info>",
      "",
    ],
    "test": [
      "<success>✅ Test command executed successfully!</success>",
      "<info>This command tests the console functionality.</info>",
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
      .replace(/<timestamp>(.*?)<\/timestamp>/g, '<span style="color: var(--muted-text-color); font-size: 12px; font-weight: 500; opacity: 0.8;">$1</span>')
      .replace(/<command>(.*?)<\/command>/g, `<span style="color: ${getThemeColor('--chart-secondary-color')}; font-weight: 700; text-shadow: 0 0 4px rgba(6, 182, 212, 0.3);">$1</span>`)
      .replace(/<response>(.*?)<\/response>/g, `<span style="color: ${getThemeColor('--sensor-co2-color')}; font-weight: 600;">$1</span>`)
      .replace(/<e>(.*?)<\/error>/g, '<span style="color: var(--error-text-color); font-weight: 700; text-shadow: 0 0 6px rgba(248, 113, 113, 0.4);">$1</span>')
      .replace(/<success>(.*?)<\/success>/g, '<span style="color: var(--main-arrow-up); font-weight: 700; text-shadow: 0 0 6px rgba(74, 222, 128, 0.4);">$1</span>')
      .replace(/<info>(.*?)<\/info>/g, `<span style="color: ${getThemeColor('--chart-primary-color')}; font-weight: 600;">$1</span>`)
      .replace(/<help>(.*?)<\/help>/g, `<span style="color: ${getThemeColor('--main-arrow-up')}; font-family: monospace; font-weight: 600; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.2);">$1</span>`);
  };

  return (
    <ConsoleWrapper>
      <Header>
        <FaTerminal size={20} />
        <HeaderTitle>OGB Console v1.1.0</HeaderTitle>
        
        <StatusIndicator>
          <StatusBadge>
            <StatusDot $online={isConnected} />
            {isConnected ? (
              <FaWifi size={16} style={{ color: 'var(--main-arrow-up)' }} />
            ) : (
              <MdSignalWifiOff size={16} style={{ color: 'var(--error-text-color)' }} />
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