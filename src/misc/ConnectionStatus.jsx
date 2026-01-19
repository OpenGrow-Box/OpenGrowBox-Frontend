
import styled from 'styled-components';
import { useHomeAssistant } from '../Components/Context/HomeAssistantContext';
import { FaWifi } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

const ConnectionStatus = () => {
  const { isOnline, loading, error, reconnect } = useHomeAssistant();
  const location = useLocation();

  // Don't show on setup/config page since no connection is expected there
  if (location.pathname === '/config') {
    return null;
  }

  // If everything is working fine, don't show anything
  if (isOnline && !loading && !error) {
    return null;
  }

  return (
    <StatusContainer>
      {!isOnline && (
        <StatusMessage type="error">
          <StatusIcon><FaWifi /></StatusIcon>
          <div>
            <StatusTitle>Offline</StatusTitle>
            <StatusDetail>Please check your internet connection</StatusDetail>
          </div>
        </StatusMessage>
      )}
      
      {isOnline && error && (
        <StatusMessage type="error">
          <StatusIcon>❌</StatusIcon>
          <div>
            <StatusTitle>Connection Error</StatusTitle>
            <StatusDetail>{error}</StatusDetail>
            <ReconnectButton onClick={reconnect}>
              Reconnect to Home Assistant
            </ReconnectButton>
          </div>
        </StatusMessage>
      )}
      
      {loading && !error && (
        <StatusMessage type="info">
          <LoadingSpinner />
          <div>
            <StatusTitle>Connecting to Home Assistant</StatusTitle>
            <StatusDetail>Please wait...</StatusDetail>
          </div>
        </StatusMessage>
      )}
    </StatusContainer>
  );
};

// Styled components
const StatusContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: -1;
  max-width: 400px;
`;

const StatusMessage = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 10px;
  border-radius: 8px;
  background-color: ${(props) => props.type === 'error' ? 'rgba(220, 53, 69, 0.9)' : 'rgba(25, 135, 84, 0.9)'};
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const StatusIcon = styled.div`
  font-size: 24px;
  margin-right: 12px;
`;

const StatusTitle = styled.h4`
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
`;

const StatusDetail = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
`;

const ReconnectButton = styled.button`
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  margin-top: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  margin-right: 12px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export default ConnectionStatus;
