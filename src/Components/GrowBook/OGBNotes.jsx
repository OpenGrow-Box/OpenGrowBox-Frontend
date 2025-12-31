import { useState, useEffect, useRef } from 'react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import styled from 'styled-components';
import { FaSave } from "react-icons/fa";


const MAX_LENGTH = 254;

const textChange = async (entity, value, connection, isValid) => {
  if (isValid && connection) {
    try {
      await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'opengrowbox',
        service: 'update_text',
        service_data: {
          entity_id: entity,
          text: value,
        },
      });
    } catch (error) {
      console.error('Error updating entity:', error);
    }
  }
};

const OGBNotes = () => {
  const { connection, entities, currentRoom, isConnectionValid } = useHomeAssistant();

  const [ogbNoteEntity, setOGBNoteEntity] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [status, setStatus] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const typingTimerRef = useRef(null);

  useEffect(() => {
  const noteSensor = Object.entries(entities).find(
    ([key]) =>
      key.startsWith("text.ogb_notes_") &&
      key.toLowerCase().includes(currentRoom?.toLowerCase())
  );

    if (noteSensor) {
      const [, entity] = noteSensor;
      setOGBNoteEntity(entity.entity_id);

      if (!hasUnsavedChanges && entity.state !== noteText) {
        setNoteText(entity.state || '');
      }
    }
  }, [entities, currentRoom, hasUnsavedChanges]);

  const handleChange = (e) => {
    const value = e.target.value.slice(0, MAX_LENGTH);
    setNoteText(value);
    setIsTyping(true);
    setHasUnsavedChanges(true);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    typingTimerRef.current = setTimeout(() => setIsTyping(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ogbNoteEntity || !connection) {
      setStatus('No Valid Entity Found.');
      return;
    }
    await textChange(ogbNoteEntity, noteText, connection, isConnectionValid);
    setStatus('Note Saved!');
    setHasUnsavedChanges(false);
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <NotesContainer>
       <Header>
          <Title>{currentRoom}&apos;s Notes</Title>
         <InfoText $charCount={noteText.length}>{noteText.length}/{MAX_LENGTH} Chars</InfoText>
       </Header>

       <StyledForm onSubmit={handleSubmit}>
         <TextArea
           value={noteText}
           onChange={handleChange}
           placeholder="Write down your thoughts or tasks&hellip;"
           className={isTyping ? 'typing' : ''}
         />
         {isTyping && (
           <TypingIndicator>
             <TypingDot />
             <TypingDot />
             <TypingDot />
             <TypingText>Typing...</TypingText>
           </TypingIndicator>
         )}
         <ButtonRow>
           <Button type="submit" disabled={hasUnsavedChanges && !isTyping}>
             <FaSave size={16} /> {hasUnsavedChanges ? 'Save Changes' : 'Save'}
           </Button>
           {status && <StatusText>{status}</StatusText>}
         </ButtonRow>
       </StyledForm>
    </NotesContainer>
  );
};

export default OGBNotes;

// Styled Components mit Mobile-Fixes
const NotesContainer = styled.div`
  background: linear-gradient(135deg,
    var(--main-bg-card-color)
  );
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2rem;
  color: var(--main-text-color);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    var(--glass-shadow-inset);
  width: 100%;
  max-width: 32rem;
  margin: 1rem auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border: 1px solid var(--glass-border-light);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(59, 130, 246, 0.3) 20%,
      rgba(147, 51, 234, 0.3) 50%,
      rgba(236, 72, 153, 0.3) 80%,
      transparent 100%
    );
  }

  /* Responsive Anpassungen */
  @media (max-width: 768px) {
    margin: 0.5rem;
    max-width: calc(100% - 1rem);
    padding: 1.5rem;
  }

  @media (max-width: 640px) {
    margin: 0.25rem;
    max-width: calc(100% - 0.5rem);
    padding: 1.25rem;
    border-radius: 20px;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--glass-border);
  margin-bottom: 0.5rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding-bottom: 0.75rem;
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
`;

const Title = styled.h4`
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.025em;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 1.25rem;
  }

  @media (max-width: 480px) {
    font-size: 1.125rem;
  }
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  box-sizing: border-box;
  position: relative;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 14rem;
  font-size: 0.95rem;
  padding: 1rem;
  border-radius: 16px;
  border: 2px solid var(--glass-border-light);
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
    var(--input-bg-color)
  color: var(--main-text-color);
  resize: vertical;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  font-family: inherit;
  line-height: 1.6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 400;
  }

  &:focus {
    border-color: rgba(59, 130, 246, 0.5);
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.08) 100%
    );
    box-shadow:
      0 0 0 3px rgba(59, 130, 246, 0.15),
      0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  &:hover {
    border-color: var(--input-focus-border-color);
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.06) 100%
    );
  }

  @media (max-width: 768px) {
    min-height: 12rem;
    font-size: 0.925rem;
  }

  @media (max-width: 640px) {
    min-height: 10rem;
    padding: 0.875rem;
  }

  @media (max-width: 480px) {
    font-size: 16px; /* Verhindert Zoom auf iOS */
    min-height: 8rem;
    padding: 0.75rem;
    border-radius: 12px;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  touch-action: manipulation;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: var(--input-bg-color);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
  }

  &:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);

    &::before {
      width: 100%;
      height: 100%;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;

    &:hover {
      transform: none;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }
  }

  @media (max-width: 640px) {
    padding: 0.875rem 1.25rem;
    font-size: 0.925rem;
    justify-content: center;
  }

  @media (max-width: 480px) {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
`;

const StatusText = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: statusFadeIn 0.3s ease-out;

  &::before {
    content: '✓';
    font-size: 1rem;
    color: #10b981;
  }

  @keyframes statusFadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    font-size: 0.8125rem;
    padding: 0.4rem 0.875rem;
    justify-content: center;
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }
`;

const InfoText = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--second-text-color);
  text-align: right;
  background: var(--glass-bg-secondary);
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(4px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => (props.$charCount / MAX_LENGTH) * 100}%;
    background: linear-gradient(90deg,
      rgba(34, 197, 94, 0.3) 0%,
      rgba(245, 158, 11, 0.3) 70%,
      rgba(239, 68, 68, 0.3) 100%
    );
    border-radius: 20px;
    transition: width 0.3s ease;
  }

  @media (max-width: 640px) {
    text-align: left;
    font-size: 0.8125rem;
    padding: 0.4rem 0.625rem;
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
    padding: 0.375rem 0.5rem;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const TypingDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3b82f6;
  animation: typingBounce 1.4s ease-in-out infinite both;

  &:nth-child(1) { animation-delay: -0.32s; }
  &:nth-child(2) { animation-delay: -0.16s; }
  &:nth-child(3) { animation-delay: 0s; }

  @keyframes typingBounce {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const TypingText = styled.span`
  font-size: 0.8125rem;
  color: var(--second-text-color);
  font-weight: 500;
`;

