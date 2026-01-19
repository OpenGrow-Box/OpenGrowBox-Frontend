import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGlobalState } from '../Components/Context/GlobalContext';
import { useNavigate } from 'react-router-dom';
import { useHomeAssistant } from '../Components/Context/HomeAssistantContext';

// Define the blue-green gradient
const GradientDefs = () => (
  <svg width="0" height="0">
    <defs>
      <linearGradient id="blueGreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#2A9D8F', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#264653', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#48CAE4', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
  </svg>
);

const SetupPage = () => {
  const [inputToken, setInputToken] = useState('');
  const [inputServerUrl, setInputServerUrl] = useState(import.meta.env.VITE_HA_HOST || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const { setDeep, accessToken } = useGlobalState();
  const navigate = useNavigate();
  const { connection, reconnect, loading, error, setError } = useHomeAssistant();
  
  const isDev = import.meta.env.DEV;

  // Watch for connection after token is set
  useEffect(() => {
    if (pendingToken && connection && !loading) {
      // Connection established with the new token
      const completeSetup = async () => {
        try {
          await handleTokenChange("text.ogb_accesstoken", pendingToken);
          localStorage.setItem(import.meta.env.PROD ? 'haToken' : 'devToken', pendingToken);
          setPendingToken(null);
          setIsConnecting(false);
          navigate("/home");
        } catch (err) {
          console.error('Error completing setup:', err);
          setIsConnecting(false);
          setPendingToken(null);
        }
      };
      completeSetup();
    } else if (pendingToken && error && !loading) {
      // Connection failed
      alert('Invalid token! Please enter a valid Token.');
      setIsConnecting(false);
      setPendingToken(null);
    }
  }, [connection, loading, error, pendingToken, navigate]);

  const handleInputChange = (e) => {
    setInputToken(e.target.value);
  };

  const handleServerUrlChange = (e) => {
    setInputServerUrl(e.target.value);
  };

  const handleSubmit = async () => {
    if (!inputToken) {
      alert('Please enter your token!');
      return;
    }

    // In dev mode, require server URL
    if (isDev && !inputServerUrl) {
      alert('Please enter your Home Assistant server URL!');
      return;
    }

    // Save the configuration
    setDeep('Conf.haToken', inputToken);
    if (isDev) {
      setDeep('Conf.hassServer', inputServerUrl);
      localStorage.setItem('devServerUrl', inputServerUrl);
    }
    localStorage.setItem(import.meta.env.PROD ? 'haToken' : 'devToken', inputToken);
    
    // If already connected, complete immediately
    if (connection) {
      try {
        await handleTokenChange("text.ogb_accesstoken", inputToken);
        navigate("/home");
      } catch (err) {
        console.error('Error updating token:', err);
        alert('Error saving token. Please try again.');
      }
    } else {
      // Set pending token and wait for connection
      setIsConnecting(true);
      setError(null);
      setPendingToken(inputToken);
      // Trigger reconnect with the new token
      setTimeout(() => reconnect(), 100);
    }
  };

  const handleTokenChange = async (entity, value) => {
    console.log(entity, value);
    if (connection) {
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

  return (
    <Wrapper>
      <GradientDefs />
      <Header>
        Welcome to OpenGrowBox
      </Header>
      <SubText>
        {isDev 
          ? 'Please enter your Home Assistant server URL and Long-Lived Access Token to proceed.'
          : 'Please enter your Home Assistant Long-Lived Access Token to proceed.'
        }
      </SubText>
      <InputWrapper>
        {isDev && (
          <Input
            type="url"
            placeholder="Home Assistant Server URL (e.g., http://homeassistant.local:8123)"
            value={inputServerUrl}
            onChange={handleServerUrlChange}
          />
        )}
        <Input
          type="text"
          placeholder="Enter Assistant Long-Lived Token..."
          value={inputToken}
          onChange={handleInputChange}
        />
        <SubmitButton onClick={handleSubmit} disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Save Token'}
        </SubmitButton>
      </InputWrapper>
      <Footer>
        🪴 Grow smarter with OpenGrowBox! 🪴 Harvest Better
      </Footer>
    </Wrapper>
  );
};

export default SetupPage;

// === Styles ===

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(72, 202, 228, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(72, 202, 228, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(72, 202, 228, 0);
  }
`;

const Wrapper = styled.div`
  position: relative;
  display: flex;
  width: 100vw;
  height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #264653 0%, #2A9D8F 100%);
  animation: ${fadeIn} 1s ease-in-out;
  overflow: hidden;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    background: url('/ogb_logo.svg') no-repeat center;
    background-size: 50%;
    filter: blur(4px);
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    opacity: 0.05;
  }

  @media (max-width: 768px) {
    padding: 20px;
    &::before {
      background-size: 80%;
    }
  }
`;

const Header = styled.h1`
  font-size: 2.5rem;
  color: #E9F5DB;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 1.5rem;
  font-weight: 700;
  letter-spacing: 1px;
  animation: ${fadeIn} 1.2s ease-in-out;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const SubText = styled.p`
  font-size: 1.1rem;
  color: #F4F1DE;
  margin-bottom: 2rem;
  text-align: center;
  max-width: 500px;
  line-height: 1.5;
  animation: ${fadeIn} 1.4s ease-in-out;

  @media (max-width: 768px) {
    font-size: 1rem;
    max-width: 90%;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(8px);
  background: rgba(42, 157, 143, 0.2);
  padding: 30px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 1.6s ease-in-out;

  @media (max-width: 768px) {
    padding: 20px;
    max-width: 90%;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  font-size: 1rem;
  border-radius: 10px;
  border: 2px solid #48CAE4;
  background: rgba(38, 70, 83, 0.8);
  color: #F4F1DE;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #90E0EF;
    box-shadow: 0 0 12px rgba(144, 224, 239, 0.5);
  }

  &::placeholder {
    color: #A3BFFA;
    opacity: 0.7;
  }
`;

const SubmitButton = styled.button`
  background: url('#blueGreenGradient');
  color: #F4F1DE;
  padding: 12px 24px;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: ${pulse} 2s infinite;

  &:hover:not(:disabled) {
    background: #48CAE4;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(72, 202, 228, 0.5);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    animation: none;
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 1rem;
  }
`;

const Footer = styled.div`
  margin-top: 2.5rem;
  font-size: 1rem;
  color: #E9F5DB;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 1.8s ease-in-out;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;