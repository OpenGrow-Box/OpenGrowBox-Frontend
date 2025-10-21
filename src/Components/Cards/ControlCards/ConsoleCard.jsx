import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { FaTerminal, FaChevronRight, FaExclamationTriangle } from "react-icons/fa";
import { useHomeAssistant } from "../../Context/HomeAssistantContext";

// ---------- Styles ----------
const ConsoleWrapper = styled.div`
  background-color: #0d0d0d;
  color: #00ff7f;
  font-family: "Fira Code", "Courier New", monospace;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(0, 255, 127, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  height: 400px;
`;

const Header = styled.div`
  background: linear-gradient(90deg, #111 0%, #1a1a1a 100%);
  padding: 12px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #00ff7f;
  font-weight: 600;
  font-size: 16px;
  border-bottom: 2px solid #00ff7f33;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ff7f, transparent);
  }
`;

const ConsoleOutput = styled.div`
  flex-grow: 1;
  padding: 18px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.6;
  background: #0d0d0d;
  scrollbar-width: thin;
  scrollbar-color: #00ff7f44 #1a1a1a;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #00ff7f44, #00ff7f66);
    border-radius: 4px;
    border: 1px solid #1a1a1a;
  }

  div {
    margin-bottom: 4px;
    word-break: break-all;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: #0a0a0a;
  border-top: 2px solid #00ff7f33;
  padding: 12px 18px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #00ff7f33, transparent);
  }
`;

const Prompt = styled.span`
  color: #00ff7f;
  margin-right: 10px;
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  
  svg {
    margin-right: 6px;
  }
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
    color: #00ff7f66;
  }
  
  &:focus {
    color: #00ff7f;
  }
`;

const CommandLine = styled.span`
  color: #66d9ef;
  font-weight: 500;
`;

const ResponseLine = styled.span`
  color: #ae81ff;
`;

const ErrorLine = styled.span`
  color: #ff6b6b;
  font-weight: 500;
`;

const SuccessLine = styled.span`
  color: #00ff7f;
  font-weight: 500;
`;

// ---------- Component ----------
const ConsoleCard = () => {
  const [lines, setLines] = useState([
    "[SYSTEM] Welcome to OGB Console v1.0.0 🧠",
    "[INFO] Type '/help' to see available commands.",
    "[INFO] Connection status: " + (localStorage.getItem('ha_connected') === 'true' ? "🟢 ONLINE" : "🔴 OFFLINE"),
    "",
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef(null);
  const { connection, currentRoom } = useHomeAssistant();

  // Load history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("console_history");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  // Backend Events
  useEffect(() => {
    if (!connection) return;

    const unsubscribe = connection.subscribeEvents(
      (event) => {
        const { room, message, type = "info" } = event.data;
        if (room !== currentRoom) return;

        const timestamp = new Date().toLocaleTimeString();
        let formattedMessage;
        
        if (type === "error") {
          formattedMessage = `[${timestamp}] <ErrorLine>[ERROR] ${message}</ErrorLine>`;
        } else if (type === "success") {
          formattedMessage = `[${timestamp}] <SuccessLine>[SUCCESS] ${message}</SuccessLine>`;
        } else {
          formattedMessage = `[${timestamp}] <ResponseLine>[RESPONSE] ${message}</ResponseLine>`;
        }
        
        setLines((prev) => [...prev, formattedMessage]);
      },
      "ogb_console_response"
    );

    return () => unsubscribe.then((unsub) => unsub());
  }, [connection, currentRoom]);

  const commands = {
    "help": [
      "┌────────────────────┐",
      "│ AVAILABLE COMMANDS │",
      "├────────────────────*",
      "│ help      - Show this help menu            ",
      "│ history   - Display command history        ",
      "│ clearhistory - Clear command history       ",
      "│ clear     - Clear console output           ",
      "│ version   - Show console version           ",
      "│ test      - Send test event to HA          ",
      "│ gcd <capability> <minutes> - Set cooldown  ",
      "└────────────────────────────*",
      "| Grow Smarter , Grow Better *",
      "└────────────────────────────*",
    ],
    "version": [
      "OGB Console v1.0.0 🚀",
      "Built with ❤️ for Home Assistant",
      "Type 'help' for commands",
      "",
    ],
  };

  const sendConsoleEvent = async (command) => {
    if (!connection) {
      const timestamp = new Date().toLocaleTimeString();
      setLines((prev) => [...prev, `[${timestamp}] <ErrorLine>[ERROR] No Home Assistant connection!</ErrorLine>`]);
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
      setLines((prev) => [...prev, `[${timestamp}] <SuccessLine>[SUCCESS] Command sent to HA</SuccessLine>`]);
    } catch (error) {
      const timestamp = new Date().toLocaleTimeString();
      setLines((prev) => [...prev, `[${timestamp}] <ErrorLine>[ERROR] ${error.message}</ErrorLine>`]);
    }
  };

  // ---------- Command Handler ----------
  const handleCommand = (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const timestamp = new Date().toLocaleTimeString();
    const commandLine = `[${timestamp}] <CommandLine>ogb$ ${trimmed}</CommandLine>`;
    
    // Clear console
    if (trimmed === "clear") {
      setLines([`<SuccessLine>[${timestamp}] Console cleared!</SuccessLine>`]);
      return;
    }

    // Clear History
    if (trimmed === "clearhistory") {
      setHistory([]);
      localStorage.removeItem("console_history");
      setLines((prev) => [...prev, commandLine, `<SuccessLine>[${timestamp}] History cleared!</SuccessLine>`]);
      setHistoryIndex(-1);
      return;
    }

    // Save to history (except clear history)
    const newHistory = [...history, trimmed];
    setHistory(newHistory);
    localStorage.setItem("console_history", JSON.stringify(newHistory));
    setHistoryIndex(-1);

    // Show history
    if (trimmed === "history") {
      const historyLines = newHistory.length > 0 
        ? newHistory.map((h, i) => `[${timestamp}] <CommandLine>${i + 1}. ${h}</CommandLine>`)
        : [`[${timestamp}] <SuccessLine>No command history!</SuccessLine>`];
      
      setLines((prev) => [...prev, commandLine, ...historyLines]);
      return;
    }

    // Help / Version
    if (commands[trimmed]) {
      setLines((prev) => [...prev, commandLine, ...commands[trimmed], ""]);
      // Handle /test command
      if (trimmed === "test") {
        sendConsoleEvent("test_event");
      }
      return;
    }

    // Default: send to Home Assistant
    setLines((prev) => [...prev, commandLine]);
    sendConsoleEvent(trimmed);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCommand(input);
    setInput("");
  };

  // Arrow keys for history navigation
  const handleKeyDown = (e) => {
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

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // Render lines with styled components
  const renderLine = (line) => {
    return line.replace(
      /<CommandLine>(.*?)<\/CommandLine>/g, '<span style="color: #66d9ef; font-weight: 500;">$1</span>'
    ).replace(
      /<ResponseLine>(.*?)<\/ResponseLine>/g, '<span style="color: #ae81ff;">$1</span>'
    ).replace(
      /<ErrorLine>(.*?)<\/ErrorLine>/g, '<span style="color: #ff6b6b; font-weight: 500;">$1</span>'
    ).replace(
      /<SuccessLine>(.*?)<\/SuccessLine>/g, '<span style="color: #00ff7f; font-weight: 500;">$1</span>'
    );
  };

  return (
    <ConsoleWrapper>
      <Header>
        <FaTerminal size={20} />
        <span>OGB Console v1.0.0</span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.7 }}>
          {currentRoom || 'global'}
        </span>
      </Header>
      
      <ConsoleOutput ref={outputRef}>
        {lines.map((line, index) => (
          <div key={index} dangerouslySetInnerHTML={{ __html: renderLine(line) }} />
        ))}
      </ConsoleOutput>
      
      <form onSubmit={handleSubmit}>
        <InputWrapper>
          <Prompt>
            <FaChevronRight size={14} />
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
      </form>
    </ConsoleWrapper>
  );
};

export default ConsoleCard;