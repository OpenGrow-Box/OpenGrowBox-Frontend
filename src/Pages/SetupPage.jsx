import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGlobalState } from '../Components/Context/GlobalContext';
import { useNavigate } from 'react-router-dom';
import { useHomeAssistant } from '../Components/Context/HomeAssistantContext';
import SecureTokenStorage from '../utils/secureTokenStorage';
import isValidToken from '../misc/isValidJWT';
import { Leaf, Zap, Key, Server, ArrowRight, Check } from 'lucide-react';
import OGBIcon from '../misc/OGBIcon';

const SetupPage = ({ forceTokenEntry = false }) => {
  const [inputToken, setInputToken] = useState('');
  const [inputServerUrl, setInputServerUrl] = useState(import.meta.env.VITE_HA_HOST || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [showInterfaceSelection, setShowInterfaceSelection] = useState(false);
  const [isCheckingExistingToken, setIsCheckingExistingToken] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const { setDeep, state } = useGlobalState();
  const navigate = useNavigate();
  const { connection, reconnect, loading, error, connectionState, setError } = useHomeAssistant();
  
  const isDev = import.meta.env.DEV;

  // Check for existing token on mount
  useEffect(() => {
    const checkExistingToken = async () => {
      if (forceTokenEntry) {
        setIsCheckingExistingToken(false);
        return;
      }

      const existingToken =
        SecureTokenStorage.getToken() ||
        localStorage.getItem('haToken') ||
        localStorage.getItem('devToken');

      if (isValidToken(existingToken)) {
        if (state.Settings?.siteView) {
          navigate('/home');
          return;
        } else {
          setShowInterfaceSelection(true);
          setCurrentStep(2);
        }
      }
      setIsCheckingExistingToken(false);
    };

    checkExistingToken();
  }, [navigate, state.Settings?.siteView, forceTokenEntry]);

  // Watch for connection after token is set
  useEffect(() => {
    if (pendingToken && connection && !loading && connectionState === 'connected') {
      const completeSetup = async () => {
        try {
          setError(null);
          await handleTokenChange("text.ogb_accesstoken", pendingToken);
          localStorage.setItem('haToken', pendingToken);
          if (import.meta.env.DEV) {
            localStorage.setItem('devToken', pendingToken);
          }
          SecureTokenStorage.storeToken(pendingToken);
          setPendingToken(null);
          setIsConnecting(false);
          if (state.Settings?.siteView) {
            navigate("/home");
          } else {
            setShowInterfaceSelection(true);
            setCurrentStep(2);
          }
        } catch (err) {
          // console.error('Error completing setup:', err);
          setIsConnecting(false);
          setPendingToken(null);
          navigate("/home");
        }
      };
      completeSetup();
    } else if (pendingToken && error && !loading && connectionState === 'auth_error') {
      alert('Invalid token! Please enter a valid Token.');
      setIsConnecting(false);
      setPendingToken(null);
      setError(null);
    }
  }, [connection, loading, error, pendingToken, navigate, connectionState, state.Settings?.siteView]);

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

    if (isDev && !inputServerUrl) {
      alert('Please enter your Home Assistant server URL!');
      return;
    }

    setDeep('Conf.haToken', inputToken);
    if (isDev) {
      setDeep('Conf.hassServer', inputServerUrl);
      localStorage.setItem('devServerUrl', inputServerUrl);
    }
    localStorage.setItem('haToken', inputToken);
    if (isDev) {
      localStorage.setItem('devToken', inputToken);
    }
    SecureTokenStorage.storeToken(inputToken);
    
    if (connection) {
      try {
        await handleTokenChange("text.ogb_accesstoken", inputToken);
        if (state.Settings?.siteView) {
          navigate("/home");
        } else {
          setShowInterfaceSelection(true);
          setCurrentStep(2);
        }
      } catch (err) {
        // console.error('Error updating token:', err);
        alert('Error saving token. Please try again.');
      }
    } else {
      setIsConnecting(true);
      setPendingToken(inputToken);
      setError(null);
      setTimeout(() => reconnect(), 100);
    }
  };

  const handleInterfaceSelection = (mode) => {
    setDeep('Settings.siteView', mode);
    navigate("/home");
  };

  const handleTokenChange = async (entity, value) => {
    if (connection) {
      try {
        await connection.sendMessagePromise({
          type: 'call_service',
          domain: 'opengrowbox',
          service: 'update_text',
          service_data: { entity_id: entity, text: value },
        });
      } catch (error) {
        // console.error('Error updating entity:', error);
      }
    }
  };

  return (
    <Wrapper>
      <BackgroundGradient />
      <ContentContainer>
        <LogoSection>
          <LogoIcon>
            <OGBIcon style={{ width: '80px', height: '80px' }} />
          </LogoIcon>
          <LogoText>OpenGrowBox</LogoText>
          <Tagline>Smart Growing, Simplified</Tagline>
        </LogoSection>

        <StepIndicator>
          <Step $active={currentStep === 1} $completed={currentStep > 1}>
            <StepNumber>{currentStep > 1 ? <Check size={16} /> : 1}</StepNumber>
            <StepLabel>Connect</StepLabel>
          </Step>
          <StepLine $completed={currentStep > 1} />
          <Step $active={currentStep === 2}>
            <StepNumber>2</StepNumber>
            <StepLabel>Interface</StepLabel>
          </Step>
        </StepIndicator>

        {showInterfaceSelection ? (
          <InterfaceSection>
            <SectionTitle>Choose Your Experience</SectionTitle>
            <SectionSubtitle>Select the interface that fits your growing style</SectionSubtitle>
            
            <InterfaceCards>
              <InterfaceCard onClick={() => handleInterfaceSelection('lite')}>
                <CardHeader>
                  <CardIconWrapper $color="#4ade80">
                    <Leaf size={32} />
                  </CardIconWrapper>
                  <CardTitle>LITE</CardTitle>
                  <CardBadge>Simple</CardBadge>
                </CardHeader>
                <CardDescription>
                  Perfect for beginners. Clean interface with essential controls and sensor monitoring.
                </CardDescription>
                <FeatureList>
                  <Feature><Check size={14} /> Real-time sensor values</Feature>
                  <Feature><Check size={14} /> Basic environment controls</Feature>
                  <Feature><Check size={14} /> Quick device toggles</Feature>
                  <Feature><Check size={14} /> Camera monitoring</Feature>
                </FeatureList>
                <SelectButton>
                  Select LITE <ArrowRight size={16} />
                </SelectButton>
              </InterfaceCard>

              <InterfaceCard onClick={() => handleInterfaceSelection('pro')}>
                <CardHeader>
                  <CardIconWrapper $color="#f59e0b">
                    <Zap size={32} />
                  </CardIconWrapper>
                  <CardTitle>PRO</CardTitle>
                  <CardBadge $pro>Advanced</CardBadge>
                </CardHeader>
                <CardDescription>
                  Full control for experienced growers. Advanced automation and detailed analytics.
                </CardDescription>
                <FeatureList>
                  <Feature><Check size={14} /> All LITE features</Feature>
                  <Feature><Check size={14} /> Advanced automation</Feature>
                  <Feature><Check size={14} /> AI-powered insights</Feature>
                  <Feature><Check size={14} /> Detailed analytics</Feature>
                </FeatureList>
                <SelectButton $pro>
                  Select PRO <ArrowRight size={16} />
                </SelectButton>
              </InterfaceCard>
            </InterfaceCards>
          </InterfaceSection>
        ) : (
          <TokenSection>
            <SectionTitle>Connect to Home Assistant</SectionTitle>
            <SectionSubtitle>Enter your Home Assistant Long-Lived Access Token to connect</SectionSubtitle>
            
            <InputContainer>
              {isDev && (
                <InputGroup>
                  <InputIcon>
                    <Server size={20} />
                  </InputIcon>
                  <Input
                    type="url"
                    placeholder="Home Assistant URL (e.g., http://homeassistant.local:8123)"
                    value={inputServerUrl}
                    onChange={handleServerUrlChange}
                  />
                </InputGroup>
              )}
              
              <InputGroup>
                <InputIcon>
                  <Key size={20} />
                </InputIcon>
                <Input
                  type="password"
                  placeholder="Home Assistant Long-Lived Access Token"
                  value={inputToken}
                  onChange={handleInputChange}
                />
              </InputGroup>

              <SubmitButton onClick={handleSubmit} disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <Spinner /> Connecting...
                  </>
                ) : (
                  <>
                    Continue <ArrowRight size={18} />
                  </>
                )}
              </SubmitButton>
            </InputContainer>

            <HelpText>
              <strong>Where to find your token:</strong> In Home Assistant, go to your Profile → Security → scroll to bottom → Create Token
            </HelpText>
          </TokenSection>
        )}
      </ContentContainer>
    </Wrapper>
  );
};

export default SetupPage;

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

// Styled Components
const Wrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--main-bg-color);
  position: relative;
  overflow: hidden;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const BackgroundGradient = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(20, 184, 166, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(72, 202, 228, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 70%);
  pointer-events: none;
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
  z-index: 1;
`;

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const LogoIcon = styled.div`
  color: var(--primary-accent);
  animation: ${float} 3s ease-in-out infinite;
  
  svg {
    width: 64px;
    height: 64px;
    stroke-width: 1.5;
  }
`;

const LogoText = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Tagline = styled.p`
  font-size: 1.1rem;
  color: var(--placeholder-text-color);
  font-weight: 500;
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: ${props => props.$active || props.$completed ? 1 : 0.4};
  transition: opacity 0.3s ease;
`;

const StepNumber = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  background: ${props => props.children?.type === Check 
    ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
    : 'var(--glass-bg-primary)'};
  color: ${props => props.children?.type === Check ? 'white' : 'var(--main-text-color)'};
  border: 2px solid ${props => props.$active ? 'var(--primary-accent)' : 'var(--glass-border)'};
`;

const StepLabel = styled.span`
  font-size: 0.8rem;
  color: var(--main-text-color);
  font-weight: 500;
`;

const StepLine = styled.div`
  width: 60px;
  height: 2px;
  background: ${props => props.$completed 
    ? 'linear-gradient(90deg, #22c55e, var(--primary-accent))' 
    : 'var(--glass-border)'};
  transition: background 0.3s ease;
`;

const TokenSection = styled.div`
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${slideIn} 0.5s ease-out;
`;

const InterfaceSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${slideIn} 0.5s ease-out;
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--main-text-color);
  text-align: center;
`;

const SectionSubtitle = styled.p`
  font-size: 1rem;
  color: var(--placeholder-text-color);
  text-align: center;
  margin-top: -1rem;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: var(--placeholder-text-color);
  display: flex;
  align-items: center;
  pointer-events: none;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  font-size: 1rem;
  border-radius: 12px;
  border: 2px solid var(--glass-border);
  background: var(--glass-bg-primary);
  color: var(--main-text-color);
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: var(--primary-accent);
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    background: var(--glass-bg-secondary);
  }

  &::placeholder {
    color: var(--placeholder-text-color);
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(20, 184, 166, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const HelpText = styled.p`
  font-size: 0.85rem;
  color: var(--placeholder-text-color);
  text-align: center;
  margin-top: 1rem;
`;

const InterfaceCards = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InterfaceCard = styled.div`
  background: var(--glass-bg-primary);
  border: 2px solid var(--glass-border);
  border-radius: 20px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &:hover {
    border-color: var(--primary-accent);
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    background: var(--glass-bg-secondary);
  }
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

const CardIconWrapper = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => `linear-gradient(135deg, ${props.$color}20, ${props.$color}40)`};
  color: ${props => props.$color};
  
  svg {
    stroke-width: 2;
  }
`;

const CardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--main-text-color);
`;

const CardBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: ${props => props.$pro 
    ? 'linear-gradient(135deg, #f59e0b20, #f59e0b40)' 
    : 'linear-gradient(135deg, #4ade8020, #4ade8040)'};
  color: ${props => props.$pro ? '#f59e0b' : '#4ade80'};
  border: 1px solid ${props => props.$pro ? '#f59e0b40' : '#4ade8040'};
`;

const CardDescription = styled.p`
  font-size: 0.95rem;
  color: var(--placeholder-text-color);
  text-align: center;
  line-height: 1.5;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--main-text-color);

  svg {
    color: var(--primary-accent);
    flex-shrink: 0;
  }
`;

const SelectButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.$pro ? '#f59e0b' : '#4ade80'};
  background: ${props => props.$pro 
    ? 'linear-gradient(135deg, #f59e0b10, #f59e0b20)' 
    : 'linear-gradient(135deg, #4ade8010, #4ade8020)'};
  border: 2px solid ${props => props.$pro ? '#f59e0b40' : '#4ade8040'};
  border-radius: 12px;
  margin-top: auto;
  transition: all 0.3s ease;

  ${InterfaceCard}:hover & {
    background: ${props => props.$pro 
      ? 'linear-gradient(135deg, #f59e0b, #f97316)' 
      : 'linear-gradient(135deg, #4ade80, #22c55e)'};
    color: white;
    border-color: transparent;
  }
`;