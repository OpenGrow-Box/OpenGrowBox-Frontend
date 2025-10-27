import { useState } from 'react';
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
  const { setDeep, accessToken } = useGlobalState();
  const navigate = useNavigate();
  const { connection } = useHomeAssistant();

  const handleInputChange = (e) => {
    setInputToken(e.target.value);
  };

  const handleSubmit = async () => {
    if (!inputToken) {
      alert('Please enter your token!');
      return;
    }

    if (import.meta.env.PROD) {
      setDeep('Conf.haToken', inputToken);
      if (connection) {
        await handleTokenChange("text.ogb_accesstoken", inputToken);
        localStorage.setItem('haToken', inputToken);
        navigate("/home");
      } else {
        alert('Invalid token! Please enter a valid Token.');
      }
    } else {
      setDeep('Conf.haToken', inputToken);
      if (connection) {
        await handleTokenChange("text.ogb_accesstoken", inputToken);
        localStorage.setItem('devToken', inputToken);
        navigate("/home");
      } else {
        alert('Invalid token! Please enter a valid Token.');
      }
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
        Please enter your Home Assistant Long-Lived Access Token to proceed.
      </SubText>
      <InputWrapper>
        <Input
          type="text"
          placeholder="Enter Assistant Long-Lived Token..."
          value={inputToken}
          onChange={handleInputChange}
        />
        <SubmitButton onClick={handleSubmit}>Save Token</SubmitButton>
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

  &:hover {
    background: #48CAE4;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(72, 202, 228, 0.5);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
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