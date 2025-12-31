import { useState, useEffect } from 'react';
import { useGlobalState } from '../Components/Context/GlobalContext';
import { useNavigate } from 'react-router-dom';
import { useHomeAssistant } from '../Components/Context/HomeAssistantContext';
import isValidJWT from '../misc/isValidJWT';
import SetupPage from './SetupPage';
import styled, { keyframes } from 'styled-components';

const loadingMessages = [
  'Checking your plant...',
  'Watering your roots...',
  'Calibrating sensors...',
  'Connecting to your greenhouse...',
  'Warming up the sun...',
  'Feeding your leaves...',
  'Running photosynthesis...',
  'Syncing OpenGrowBox...',
  'Scanning environment...',
  'Brewing nutrients...'
];

const getRandomMessage = () =>
  loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

const Interface = () => {
  const { accessToken } = useGlobalState();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { connection, connectionState, isConfigurationValid } = useHomeAssistant();
  const [loadingText, setLoadingText] = useState('');

  // Ladezeit in Millisekunden (z. B. 1000 = 1 Sekunde)
  const loadingDuration = 1000;
  const loadingSeconds = loadingDuration / 1000;

  useEffect(() => {
    setLoadingText(getRandomMessage());

    const checkToken = async () => {
      const storageKey = import.meta.env.PROD ? 'haToken' : 'devToken';
      const localToken = localStorage.getItem(storageKey);

      await new Promise((res) => setTimeout(res, loadingDuration));

      if (isValidJWT(localToken)) {
        setToken(localToken);
      } else {
        setToken('');
      }
      setIsLoading(false);
    };

    checkToken();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // If configuration is invalid, show setup page
      if (!isConfigurationValid()) {
        console.log('Configuration invalid, showing setup page');
        return; // Stay on current page to show SetupPage
      }

      // If we have a valid token and configuration, proceed to home
      if (isValidJWT(accessToken)) {
        navigate('/home');
      }
    }
  }, [accessToken, isLoading, isConfigurationValid, navigate]);

  if (isLoading) {
    // Show different loading messages based on connection state
    let displayText = loadingText;
    if (connectionState === 'config_error') {
      displayText = 'Home Assistant not configured. Redirecting to setup...';
    } else if (connectionState === 'connecting') {
      displayText = 'Connecting to Home Assistant...';
    } else if (connectionState === 'network_error') {
      displayText = 'Network connection issue. Please check your connection.';
    }

    return (
      <LoaderWrapper>
        <ProgressCircle viewBox="0 0 100 100" width="120" height="120">
          <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ff88" />
            <stop offset="25%" stopColor="#a4ff00" />
            <stop offset="50%" stopColor="#ffe600" />
            <stop offset="75%" stopColor="#ff7b00" />
            <stop offset="90%" stopColor="#ff2a2a" />
            <stop offset="100%" stopColor="#8b4513" />
        </linearGradient>
          </defs>
          <Progress duration={loadingSeconds} />
        </ProgressCircle>
        <LoadingText>{displayText}</LoadingText>
      </LoaderWrapper>
    );
  }

  // Show setup page if configuration is invalid or no valid token
  if (!isConfigurationValid() || !token) {
    return <SetupPage />;
  }

  // If we have valid configuration but no connection yet, show loading
  if (connectionState === 'connecting') {
    return (
      <LoaderWrapper>
        <ProgressCircle viewBox="0 0 100 100" width="120" height="120">
          <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ff88" />
            <stop offset="25%" stopColor="#a4ff00" />
            <stop offset="50%" stopColor="#ffe600" />
            <stop offset="75%" stopColor="#ff7b00" />
            <stop offset="90%" stopColor="#ff2a2a" />
            <stop offset="100%" stopColor="#8b4513" />
        </linearGradient>
          </defs>
          <Progress duration={loadingSeconds} />
        </ProgressCircle>
        <LoadingText>Connecting to Home Assistant...</LoadingText>
      </LoaderWrapper>
    );
  }

  // Default fallback
  return <SetupPage />;
};

export default Interface;

// Animation und Styles

const fill = keyframes`
  0% {
    stroke-dashoffset: 251;
  }
  100% {
    stroke-dashoffset: 0;
  }
`;

const LoaderWrapper = styled.div`
  height: 100vh;
  width: 100vw;
  background: var(--main-bg-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
`;

const LoadingText = styled.div`
  color: var(--main-text-color);
  font-size: 1.3rem;
  text-align: center;
`;

const ProgressCircle = styled.svg``;

const Progress = styled.circle.attrs({
  cx: "50",
  cy: "50",
  r: "40",
  fill: "none",
  stroke: "url(#grad)",
  strokeWidth: "10",
  strokeDasharray: "251",
  strokeDashoffset: "251"
})`
  animation: ${fill} ${({ duration }) => duration}s ease-out forwards;
`;
