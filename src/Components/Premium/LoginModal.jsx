import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { usePremium } from '../Context/OGBPremiumContext';
import OGBIcon from '../../misc/OGBIcon';
import { getThemeColor } from '../../utils/themeColors';
import { FaLeaf } from 'react-icons/fa';

export default function LoginModal({ onClose, selectedRoom }) {
  const { login, isPremium, authStatus, authProvider } = usePremium();
  const [formData, setFormData] = useState({ email: '', OGBToken: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  // Handle OAuth loading state

  const isEmailLoading = authStatus === 'authenticating' && !authProvider;

  // redirect nach erfolgreichem login
  useEffect(() => {
    if (authStatus === 'authenticated' && isPremium !== null) {
      setTimeout(() => {
        navigate('/settings');
        if (onClose) onClose();
      }, 500);
    }
  }, [authStatus, isPremium, navigate, onClose]);

  // Reset loading when auth status changes
  useEffect(() => {
    if (authStatus === 'error' || authStatus === 'idle') {
      setLoading(false);
    }
  }, [authStatus]);

  // inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await login(formData.email, formData.OGBToken, selectedRoom);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };



  // esc key close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && onClose && !loading) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, loading]);

  return (
    <ModalBackdrop onClick={(e) => e.target === e.currentTarget && onClose?.() && !loading}>
      <ModalContainer>
        {onClose && !loading && <CloseButton onClick={onClose}>✕</CloseButton>}

        <Header>
          <IconWrapper>
            <OGBIcon />
          </IconWrapper>
          <Title>Welcome to OpenGrowBox</Title>
          <Subtitle>Sign In</Subtitle>
        </Header>

            <FormWrapper>
              <Form onSubmit={handleSubmit}>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                {success && <SuccessMessage>{success}</SuccessMessage>}
                
                <InputGroup>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your email address"
                    required
                    disabled={loading}
                  />
                </InputGroup>

                <InputGroup>
                  <Label>Access Token</Label>
                  <Input
                    type="password"
                    name="OGBToken"
                    value={formData.OGBToken}
                    onChange={handleInputChange}
                    placeholder="Your OGB Access Token"
                    required
                    disabled={loading}
                    minLength="6"
                  />
                </InputGroup>

                <SubmitButton type="submit" disabled={loading}>
                  {isEmailLoading ? (
                    <>
                      <ButtonSpinner />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </SubmitButton>
              </Form>

            </FormWrapper>

        <FooterNote>
          <FaLeaf /> Open Source Grow Automation - Fully controllable with your OpenGrowBox account
        </FooterNote>
      </ModalContainer>
    </ModalBackdrop>
  );
}

// Styled Components bleiben unverändert...
const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: var(--main-bg-color);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: var(--main-bg-card-color);
  border: var(--border-color);
  border-radius: 1.5rem;
  padding: 2.5rem;
  width: 100%;
  max-width: 32rem;
  min-height: auto;
  position: relative;
  box-shadow: var(--main-shadow-art);
  animation: modalSlideIn 0.3s ease-out;

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  color: var(--placeholder-text-color);
  background: var(--input-bg-color);
  border: var(--border-color);
  border-radius: 0.5rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--main-arrow-up);
    background: ${getThemeColor('--chart-success-color')}1A;
    border-color: ${getThemeColor('--chart-success-color')}4D;
    transform: scale(1.05);
  }
`;

const IconWrapper = styled.div`
  width: 4.5rem;
  height: 4.5rem;
  padding:0.5rem;
  background: linear-gradient(135deg, var(--main-arrow-up) 0%, var(--cannabis-active-color) 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
  box-shadow: 0 8px 25px ${getThemeColor('--chart-success-color')}66;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, var(--main-arrow-up), var(--cannabis-active-color));
    border-radius: 1rem;
    z-index: -1;
    opacity: 0.5;
    filter: blur(8px);
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: white;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--main-text-color) 0%, var(--second-text-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: var(--placeholder-text-color);
  font-size: 1rem;
  font-weight: 400;
`;

const FooterNote = styled.div`
  text-align: center;
   color: var(--muted-text-color);
  font-size: 0.875rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: var(--border-color);
`;

const FormWrapper = styled.div`
  padding: 25px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: white;
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled.input`
  background: var(--input-bg-color);
  border: var(--input-border-color);
  border-radius: 12px;
  padding: 14px 16px;
  color: var(--main-text-color);
  font-size: 16px;
  transition: all 0.2s ease;

  &::placeholder {
    color: var(--placeholder-text-color);
  }

  &:focus {
    outline: none;
    border-color: var(--input-focus-border-color);
    box-shadow: 0 0 0 3px ${getThemeColor('--chart-success-color')}1A;
  }

  &:hover:not(:focus) {
    border-color: var(--border-hover-color);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, var(--main-arrow-up) 0%, var(--cannabis-active-color) 100%);
  border: none;
  border-radius: 12px;
  padding: 14px 20px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 10px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px ${getThemeColor('--chart-success-color')}4D;
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LinksContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 25px;
`;

const LinkButton = styled.button`
  background: none;
  border: none;
   color: var(--main-arrow-up);
  font-size: 14px;
  cursor: pointer;
  text-align: center;
  transition: color 0.2s ease;

  &:hover:not(:disabled) {
     color: var(--cannabis-active-color);
    text-decoration: underline;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: ${getThemeColor('--chart-error-color')}1A;
  border: 1px solid ${getThemeColor('--chart-error-color')}4D;
  border-radius: 8px;
  padding: 12px;
   color: var(--error-text-color);
  font-size: 14px;
  text-align: center;
`;

const SuccessMessage = styled.div`
  background: ${getThemeColor('--chart-success-color')}1A;
  border: 1px solid ${getThemeColor('--chart-success-color')}4D;
  border-radius: 8px;
  padding: 12px;
   color: var(--chart-success-color);
  font-size: 14px;
  text-align: center;
`;

const OAuthContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1.5rem;
`;

const OAuthButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  background: var(--input-bg-color);
  border: var(--input-border-color);
  border-radius: 12px;
  padding: 14px 16px;
  color: var(--main-text-color);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    font-size: 20px;
  }

  &:hover:not(:disabled) {
    border-color: var(--main-arrow-up);
    background: ${getThemeColor('--chart-success-color')}1A;
    color: var(--main-arrow-up);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Loading Container + Spinner + Texte
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 2rem 1rem;
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--main-arrow-up);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color: white;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
`;

const LoadingSubtext = styled.div`
  color: var(--placeholder-text-color);
  font-size: 14px;
  text-align: center;
  max-width: 250px;
`;

// Divider mit Linien links/rechts und Text in der Mitte
const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
`;

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: var(--border-color);
`;

const DividerText = styled.span`
  color: var(--placeholder-text-color);
  font-size: 14px;
  font-weight: 500;
`;

// Button Spinner für den Submit Button
const ButtonSpinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-top-color: var(--main-text-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
