import { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import LoginModal from '../Premium/LoginModal';

import { formatDateTime } from '../../misc/formatDateTime';
import { usePremium } from '../Context/OGBPremiumContext';
import { DEV_CONFIG } from '../../config';

// Premium Animations
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.2); }
  50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.5), 0 0 60px rgba(255, 215, 0, 0.3); }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
`;

const capitalize = (str) => {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Fixed Launch Configuration
const FIXED_LAUNCH_CONFIG = {
  // Set your fixed launch date here - example: January 1, 2026
  LAUNCH_DATE: new Date('2026-01-01T00:00:00Z'),
  IS_LAUNCHED: false, // Set to true when you want to enable premium features immediately
  LAUNCH_MESSAGE: 'Enterprise Features launching soon!'
};

// Simplified Launch Date Functions (No API Calls)
const isLaunchDateReached = () => {
  if (FIXED_LAUNCH_CONFIG.IS_LAUNCHED) {
    return true;
  }
  const now = new Date();
  return now >= FIXED_LAUNCH_CONFIG.LAUNCH_DATE;
};

const getDaysUntilLaunch = () => {
  if (FIXED_LAUNCH_CONFIG.IS_LAUNCHED) {
    return 0;
  }
  const now = new Date();
  const diffTime = FIXED_LAUNCH_CONFIG.LAUNCH_DATE - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

const formatLaunchDate = () => {
  return formatDateTime(FIXED_LAUNCH_CONFIG.LAUNCH_DATE);
};

const getCountdownTime = () => {
  if (FIXED_LAUNCH_CONFIG.IS_LAUNCHED) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  
  const now = new Date().getTime();
  const launchTime = FIXED_LAUNCH_CONFIG.LAUNCH_DATE.getTime();
  const distance = launchTime - now;

  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000)
  };
};


const isDevUser = (userEmail, userId) => {
  return DEV_CONFIG.IS_DEV_MODE;
};

const ControlMode = ({ onSelectChange }) => {
  const { roomOptions, connection, entities} = useHomeAssistant();
  const controlOptions = ["HomeAssistant", "Node-RED", "Self-Hosted","Premium"];
  const notificationOptions = ["Enabled", "Disabled"];

  const [selectedRoom, setSelectedRoom] = useState('');
  const [controlMapping, setControlMapping] = useState(null);
  const [notificationMapping, setNotificationMapping] = useState(null);
  const [controlSensors, setControlSensors] = useState({});
  const [notificationSensors, setNotificationSensors] = useState({});
  const [filteredRooms, setFilteredRooms] = useState([]);
  const initializedRef = useRef(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTestUserModal, setShowTestUserModal] = useState(false);
  const [testUserData, setTestUserData] = useState({ email: '', ogbAccessToken: '',ogbBetaToken:''});
  const [testUserLoading, setTestUserLoading] = useState(false);
  const [testUserMessage, setTestUserMessage] = useState('');
  const [testUserAccess, setTestUserAccess] = useState(null);
  
  // Launch Date States - Simplified
  const [daysUntilLaunch, setDaysUntilLaunch] = useState(0);
  const [isLaunched, setIsLaunched] = useState(false);
  const [launchDateString, setLaunchDateString] = useState('');
  const [launchCountdown, setLaunchCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const {subscription, isPremium, ogbSessions, ogbMaxSessions, logout, 
    canAddNewRoom, userEmail, userId,devUserLogin,devTestUser } = usePremium();

  // Load launch information - Now using fixed configuration
  useEffect(() => {
    const loadLaunchInfo = () => {
      const launched = isLaunchDateReached();
      const days = getDaysUntilLaunch();
      const dateString = formatLaunchDate();
      
      setIsLaunched(launched);
      setDaysUntilLaunch(days);
      setLaunchDateString(dateString);
      
      // Start countdown if not launched yet
      if (!launched && days > 0) {
        setLaunchCountdown(getCountdownTime());
      }
    };
    
    loadLaunchInfo();
  }, []);

  // Countdown timer for more precise countdown
  useEffect(() => {
    if (isLaunched || daysUntilLaunch === 0) {
      return;
    }

    const updateCountdown = () => {
      const countdown = getCountdownTime();
      setLaunchCountdown(countdown);
      
      // Check if launch date has been reached
      if (countdown.days === 0 && countdown.hours === 0 && 
          countdown.minutes === 0 && countdown.seconds === 0) {
        setIsLaunched(true);
      }
    };

    // Update immediately, then every second
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [isLaunched, daysUntilLaunch]);

  // Filter rooms that have sensor.ogb_ entities
  useEffect(() => {
    if (!roomOptions?.length) return;
    
    const roomsWithOgbSensors = roomOptions.filter(room => {
      if (room.toLowerCase() === "ambient") return false;
      
      // Check if room has any sensor.ogb_ entities
      const hasSensors = Object.keys(entities).some(entityId => 
        entityId.startsWith('sensor.ogb_') && 
        entityId.toLowerCase().includes(room.toLowerCase())
      );
      return hasSensors;
    });
    
    setFilteredRooms(roomsWithOgbSensors);
    
    // Set first filtered room as selected if no room selected yet
    if (!selectedRoom && roomsWithOgbSensors.length > 0) {
      setSelectedRoom(roomsWithOgbSensors[0]);
    }
  }, [roomOptions, entities, selectedRoom]);

  // Erfasse Select-Entities und spiegle sie in Mapping
  useEffect(() => {
    const newControl = {};
    const newNotification = {};

    Object.entries(entities).forEach(([key, entity]) => {
      const match = key.match(/^select\.ogb_(?:lightcontrol|maincontrol|notifications)_(.+)$/);
      if (!match) return;
      const type = key.includes('maincontrol') || key.includes('lightcontrol') ? 'control' : 'notifications';
      const roomKey = match[1];
      const room = filteredRooms?.find(r => r.toLowerCase() === roomKey);
      if (!room) return;

      if (type === "control") {
        newControl[room] = entity.state;
      } else {
        newNotification[room] = entity.state;
      }
    });

    setControlSensors(newControl);
    setNotificationSensors(newNotification);

    // Update UI-Mapping nur, wenn initialisiert
    if (controlMapping && notificationMapping) {
      setControlMapping(prev => {
        const updated = { ...prev };
        Object.entries(newControl).forEach(([room, state]) => {
          if (updated[room] !== state) updated[room] = state;
        });
        return updated;
      });
      setNotificationMapping(prev => {
        const updated = { ...prev };
        Object.entries(newNotification).forEach(([room, state]) => {
          if (updated[room] !== state) updated[room] = state;
        });
        return updated;
      });

      // Optional: callback
      if (onSelectChange && selectedRoom) {
        onSelectChange(
          selectedRoom,
          newControl[selectedRoom] || controlMapping[selectedRoom],
          newNotification[selectedRoom] || notificationMapping[selectedRoom]
        );
      }
    }
  }, [entities, filteredRooms]);

  // Initialisiere aus localStorage
  useEffect(() => {
    if (!filteredRooms?.length || initializedRef.current) return;
    initializedRef.current = true;

    const storedControl = JSON.parse(localStorage.getItem('controlMapping') || '{}');
    const storedNotif = JSON.parse(localStorage.getItem('notificationMapping') || '{}');

    const initControl = {};
    const initNotif = {};
    filteredRooms.forEach(room => {
      initControl[room] = storedControl[room] || controlOptions[0];
      initNotif[room] = storedNotif[room] || notificationOptions[0];
    });

    setControlMapping(initControl);
    setNotificationMapping(initNotif);
    if (!selectedRoom && filteredRooms[0]) {
      setSelectedRoom(filteredRooms[0]);
    }
  }, [filteredRooms, selectedRoom]);

  // Persist
  useEffect(() => {
    if (controlMapping) localStorage.setItem('controlMapping', JSON.stringify(controlMapping));
  }, [controlMapping]);

  useEffect(() => {
    if (notificationMapping) localStorage.setItem('notificationMapping', JSON.stringify(notificationMapping));
  }, [notificationMapping]);

  const selectControl = async option => {
    if (option === 'Premium') {
      if (!isPremium) {
        setShowTestUserModal(true);
        return;
      }

      const isMaxReached = await canAddNewRoom(); 
      console.log("canAddNewRoom result:", isMaxReached, option);

      if (isMaxReached) {
        window.alert("⚠️ Too many rooms! You cannot create more. Deactivate one first, then activate the new one");
        return;
      }
    }
    
    setControlMapping(prev => ({ ...prev, [selectedRoom]: option }));
    callService('maincontrol', option);
    onSelectChange?.(selectedRoom, option, notificationMapping[selectedRoom]);
  };

  if (!controlMapping || !notificationMapping) return <div>Loading...</div>;

  const callService = async (entitySuffix, option) => {
    if (!connection) return;
    const entity_id = `select.ogb_${entitySuffix}_${selectedRoom.toLowerCase()}`;
    try {
      await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'select',
        service: 'select_option',
        service_data: { entity_id, option },
      });
    } catch (err) {
      console.error('Error calling service:', err);
    }
  };

  const selectNotification = option => {
    setNotificationMapping(prev => ({ ...prev, [selectedRoom]: option }));
    callService('notifications', option);
    onSelectChange?.(selectedRoom, controlMapping[selectedRoom], option);
  };

  const handleLogOut = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return;

    try {
      logout();
      window.location.reload(); // ⬅ Hard refresh nach Logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Handle Test User Form
  const handleTestUserSubmit = async (e) => {
    e.preventDefault();
    
    if (!testUserData.ogbBetaToken.trim() || !testUserData.email.trim()|| !testUserData.ogbAccessToken.trim()) {
      setTestUserMessage('Please fill in all fields');
      return;
    }
    
    setTestUserLoading(true);
    setTestUserMessage('');
    
    try {
      const accessResult = await devUserLogin(
        testUserData.email.trim(),
        testUserData.ogbAccessToken.trim(),
        testUserData.ogbBetaToken.trim()
      );
      
      setTestUserAccess(accessResult);
      console.log(accessResult);
      
      if (accessResult.success) {
        setTestUserMessage('✅ Test access granted! You can now use Premium features.');
        
        // Nach 2 Sekunden Modal schließen
        setTimeout(() => {
          setShowTestUserModal(false);
          setShowLoginModal(true);
          setTestUserMessage('');
        }, 2000);
      } else {
        setTestUserMessage(accessResult.message || '❌ Access denied. You are not authorized for test access.');
      }
    } catch (error) {
      setTestUserMessage('❌ Error checking access. Please try again.');
      console.error('Test user access error:', error);
    } finally {
      setTestUserLoading(false);
    }
  };

  const resetTestUserModal = () => {
    setTestUserData({ email: '', ogbBetaToken: '', ogbAccessToken: '' });
    setTestUserMessage('');
    setTestUserAccess(null);
    setTestUserLoading(false);
  };

  return (
    <Container>
      <SectionTitle>Room-Controller</SectionTitle>
      {/* Dev Mode Badge */}
      {isDevUser(userEmail, userId) && (
        <DevBadge>DEV MODE</DevBadge>
      )}
      
      <TagsContainer>
        {filteredRooms.map(room => (
          <Tag key={room} selected={room === selectedRoom} onClick={() => setSelectedRoom(room)}>
            {room}
          </Tag>
        ))}
      </TagsContainer>

      <InfoTitle>Control Options - {selectedRoom}</InfoTitle>
      <TagsContainer>
        {controlOptions.map(opt => (
          <ControlTag
            key={opt}
            selected={controlMapping[selectedRoom] === opt}
            isPremium={opt === 'Premium'}
            onClick={() => selectControl(opt)}
          >
            {opt === 'Premium' && (
              <PremiumIcon>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </PremiumIcon>
            )}
            <span>{opt}</span>
            {opt === 'Premium' ? <PremiumBadge>{capitalize(subscription?.plan_name)}</PremiumBadge> : <></>}
          </ControlTag>
        ))}
      </TagsContainer>

      {showLoginModal && <LoginModal selectedRoom={selectedRoom} onClose={() => setShowLoginModal(false)} />}
      
      {/* Test User Modal */}
      {showTestUserModal && (
        <TestUserModal onClick={(e) => e.target === e.currentTarget && (setShowTestUserModal(false), resetTestUserModal())}>
          <TestUserModalContent>
            <TestUserModalHeader>
              <PremiumCrown>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M5 16L3 5l4.5 2.5L12 4l4.5 3.5L21 5l-2 11H5zm2.7-2h8.6l.9-5.4-2.1 1.2L12 8l-3.1 1.8-2.1-1.2L7.7 14z"/>
                </svg>
              </PremiumCrown>
              <TestUserModalTitle>Test User Access</TestUserModalTitle>
            </TestUserModalHeader>
            
            <p style={{ color: 'var(--main-text-color)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Premium features are launching soon! Enter your test credentials to get early access.
            </p>
            
            <TestUserForm onSubmit={handleTestUserSubmit}>
              <TestUserInput
                type="email"
                placeholder="Email"
                value={testUserData.email}
                onChange={(e) => setTestUserData(prev => ({ ...prev, email: e.target.value }))}
                disabled={testUserLoading}
                required
              />
              <TestUserInput
                type="password"
                placeholder="Your Beta OGB Token"
                value={testUserData.ogbBetaToken}
                onChange={(e) => setTestUserData(prev => ({ ...prev, ogbBetaToken: e.target.value }))}
                disabled={testUserLoading}
                required
              />
              <TestUserInput
                type="password"
                placeholder="Your Private OGB Token"
                value={testUserData.ogbAccessToken}
                onChange={(e) => setTestUserData(prev => ({ ...prev, ogbAccessToken: e.target.value }))}
                disabled={testUserLoading}
                required
              />     
              <TestUserButtonGroup>
                <TestUserButton 
                  type="button" 
                  onClick={() => {setShowTestUserModal(false); resetTestUserModal();}}
                  disabled={testUserLoading}
                >
                  Cancel
                </TestUserButton>
                <TestUserButton 
                  type="submit" 
                  primary
                  disabled={testUserLoading}
                >
                  {testUserLoading ? 'Checking...' : 'Check Access'}
                </TestUserButton>
              </TestUserButtonGroup>
            </TestUserForm>
            
            {testUserMessage && (
              <TestUserMessage 
                error={testUserMessage.includes('❌')} 
                success={testUserMessage.includes('✅')}
              >
                {testUserMessage}
              </TestUserMessage>
            )}
          </TestUserModalContent>
        </TestUserModal>
      )}

      <InfoTitle>Notifications - {selectedRoom}</InfoTitle>
      <TagsContainer>
        {notificationOptions.map(opt => (
          <Tag
            key={opt}
            selected={notificationMapping[selectedRoom] === opt}
            onClick={() => selectNotification(opt)}
          >{opt}</Tag>
        ))}
      </TagsContainer>

      {subscription ? (
        <PremiumPlanCard>
          <PremiumHeader>
            <PremiumCrown>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 5l4.5 2.5L12 4l4.5 3.5L21 5l-2 11H5zm2.7-2h8.6l.9-5.4-2.1 1.2L12 8l-3.1 1.8-2.1-1.2L7.7 14z"/>
              </svg>
            </PremiumCrown>
            <PremiumTitle>Premium Subscription</PremiumTitle>
            <LogoutButton onClick={() => handleLogOut()}>Logout</LogoutButton>
          </PremiumHeader>
          
          <PlanInfoGrid>
            <InfoCard>
              <InfoLabel>Current Plan</InfoLabel>
              <InfoValue>{capitalize(subscription?.plan_name)}</InfoValue>
              <InfoValue>{`${ogbSessions} / ${ogbMaxSessions} : Sessions`}</InfoValue>
            </InfoCard>

            <InfoCard>
              <InfoLabel>Status</InfoLabel>
              <InfoValue>
                <StatusBadge>
                  <StatusDot />
                  Active
                </StatusBadge>
              </InfoValue>
            </InfoCard>
            
            <InfoCard>
              <InfoLabel>Started</InfoLabel>
              <InfoValue>{formatDateTime(subscription?.current_period_start)}</InfoValue>
            </InfoCard>
            
            <InfoCard>
              <InfoLabel>Next Renewal</InfoLabel>
              <InfoValue>{formatDateTime(subscription?.current_period_end)}</InfoValue>
            </InfoCard>
          </PlanInfoGrid>
        </PremiumPlanCard>
      ) : (
        <NoSubWrapper>
          <NoSubTitle>🚀 Premium Launch Soon</NoSubTitle>
          <NoSubDescription>
            Unlock exclusive features from our Premium Add-On and get access to advanced functionality.
          </NoSubDescription>
          
          {/* Launch Info Display - Now using fixed configuration */}
          {isLaunched ? (
            <LaunchInfo>
              🎉 Premium Features are now available! Sign up today to get started.
            </LaunchInfo>
          ) : (
            <>
              <LaunchInfo>
                {daysUntilLaunch === 0 
                  ? "🚀 Enterprise Features launching today!" 
                  : `⏰ Launch in ${daysUntilLaunch} Day${daysUntilLaunch > 1 ? "s" : ""} - at ${launchDateString}`}
              </LaunchInfo>
              
              {/* Detailed Countdown */}
              {daysUntilLaunch > 0 && (
                <CountdownContainer>
                  {launchCountdown.days > 0 && (
                    <CountdownBox>
                      <CountdownNumber>{launchCountdown.days}</CountdownNumber>
                      <CountdownLabel>Days</CountdownLabel>
                    </CountdownBox>
                  )}
                  <CountdownBox>
                    <CountdownNumber>{launchCountdown.hours}</CountdownNumber>
                    <CountdownLabel>Hours</CountdownLabel>
                  </CountdownBox>
                  <CountdownBox>
                    <CountdownNumber>{launchCountdown.minutes}</CountdownNumber>
                    <CountdownLabel>Minutes</CountdownLabel>
                  </CountdownBox>
                  <CountdownBox>
                    <CountdownNumber>{launchCountdown.seconds}</CountdownNumber>
                    <CountdownLabel>Seconds</CountdownLabel>
                  </CountdownBox>
                </CountdownContainer>
              )}
            </>
          )}
          
          <UpgradeButton onClick={() => window.open("https://opengrowbox.net", "_blank")}>
            Get your Account Now !
          </UpgradeButton>
            <LaunchInfo>
              🎉 You might be one of the first to become a Beta Premium tester! 🎉
            </LaunchInfo>
            <LaunchInfo>
              🚀 Head over to your OGB-Account Page and choose if you want to join the program. 🚀
            </LaunchInfo>

        </NoSubWrapper>
      )}
    </Container>
  );
};

export default ControlMode;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled.h4`
  margin: 0;
  color: var(--main-text-color);
`;

const InfoTitle = styled.h5`
  margin: 0;
  color: var(--main-text-color);
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.div`
  padding: 0.5rem 1rem;
  border-radius: 25px;
  cursor: pointer;
  background: ${({ selected }) =>
    selected ? 'var(--primary-accent)' : 'var(--main-bg-card-color)'};
  color: var(--main-text-color);
  box-shadow: var(--main-shadow-art);
  transition: all 0.3s ease;

  &:hover { 
    opacity: 0.8;
    transform: translateY(-1px);
  }
`;

const ControlTag = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isPremium', 'selected'].includes(prop),
})`
  padding: 0.8rem 1.25rem;
  border-radius: 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
  
  background: ${({ selected, isPremium }) => {
    if (isPremium && selected) {
      return `
        linear-gradient(135deg, 
          #FFD700 0%, 
          #FFA500 25%, 
          #FF8C00 50%, 
          #FF6347 75%, 
          #DC143C 100%
        )
      `;
    }
    if (isPremium) {
      return `
        linear-gradient(135deg, 
          rgba(255, 215, 0, 0.1) 0%, 
          rgba(255, 165, 0, 0.1) 25%, 
          rgba(255, 140, 0, 0.1) 50%, 
          rgba(255, 99, 71, 0.1) 75%, 
          rgba(220, 20, 60, 0.1) 100%
        )
      `;
    }
    return selected ? 'var(--primary-accent)' : 'var(--main-bg-card-color)';
  }};
  
  color: ${({ isPremium, selected }) => 
    isPremium && selected ? '#000' : 'var(--main-text-color)'
  };
  
  border: ${({ isPremium, selected }) => {
    if (isPremium && selected) {
      return '2px solid rgba(255, 215, 0, 0.8)';
    }
    if (isPremium) {
      return '1px solid rgba(255, 215, 0, 0.3)';
    }
    return 'none';
  }};
  
  box-shadow: ${({ isPremium, selected }) => {
    if (isPremium && selected) {
      return `
        0 0 20px rgba(255, 215, 0, 0.4),
        0 0 40px rgba(255, 165, 0, 0.3),
        0 4px 15px rgba(0, 0, 0, 0.2),
        var(--main-shadow-art)
      `;
    }
    if (isPremium) {
      return `
        0 0 10px rgba(255, 215, 0, 0.2),
        var(--main-shadow-art)
      `;
    }
    return 'var(--main-shadow-art)';
  }};
  
  ${({ isPremium, selected }) => isPremium && selected && css`
    animation: ${glow} 2s ease-in-out infinite;
  `}
  
  ${({ isPremium }) => isPremium && css`
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -200px;
      width: 200px;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      animation: ${shimmer} 3s infinite;
    }
  `}

  &:hover { 
    opacity: 0.9;
    transform: translateY(-2px);
    
    ${({ isPremium }) => isPremium && css`
      box-shadow: 
        0 0 25px rgba(255, 215, 0, 0.5),
        0 0 50px rgba(255, 165, 0, 0.3),
        0 6px 20px rgba(0, 0, 0, 0.3);
    `}
  }
  
  &:active {
    transform: translateY(-1px);
  }
`;

const PremiumBadge = styled.span`
  background: gold;
  color: black;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
`;

const PremiumIcon = styled.span`
  color: gold;
  display: flex;
  align-items: center;
`;

const LogoutButton = styled.div`
  cursor: pointer;
  background: linear-gradient(135deg, 
    rgba(255, 80, 80, 0.2) 0%, 
    rgba(255, 50, 50, 0.25) 50%, 
    rgba(200, 0, 0, 0.2) 100%
  );
  border: 1px solid rgba(255, 80, 80, 0.4);
  border-radius: 16px;
  padding: 1.2rem 2rem;
  color: #fff;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 4px 10px rgba(255, 50, 50, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, 
      rgba(255, 100, 100, 0.4) 0%, 
      rgba(255, 50, 50, 0.45) 50%, 
      rgba(200, 0, 0, 0.4) 100%
    );
    box-shadow: 0 6px 16px rgba(255, 50, 50, 0.4);
    transform: scale(1.03);
  }

  &:active {
    transform: scale(0.97);
    box-shadow: 0 3px 8px rgba(255, 50, 50, 0.3);
  }
`;

const PremiumPlanCard = styled.div`
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.1) 0%, 
    rgba(255, 165, 0, 0.1) 50%, 
    rgba(255, 140, 0, 0.1) 100%
  );
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -200px;
    width: 200px;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 215, 0, 0.1),
      transparent
    );
    animation: ${shimmer} 4s infinite;
  }
`;

const PremiumHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const PremiumTitle = styled.h3`
  color: #FFD700;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  flex:1;
`;

const PremiumCrown = styled.div`
  color: #FFD700;
  filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const PlanInfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 0.5rem;
  padding: 1rem;
  backdrop-filter: blur(10px);
`;

const InfoLabel = styled.div`
  color: rgba(255, 215, 0, 0.8);
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.div`
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom:0.3rem;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 0.5rem;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  background: #fff;
  border-radius: 50%;
  animation: ${glow} 2s ease-in-out infinite;
`;

const UpgradeButton = styled.button`
  background: linear-gradient(90deg, #f59e0b, #d97706);
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  margin-bottom:1rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
  }
`;

const DevBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ff4444;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
`;
const NoSubWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px 24px;
  background:rgba(125,125,125,0.8);
  color: white;
  text-align: center;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
  position: relative;
  overflow: hidden;
`;
const NoSubTitle = styled.h3`
  color: rgba(255,185,55,1);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const NoSubDescription = styled.p`
  color: rgba(255,185,55,1);
  font-size: 14px;
  margin: 0 0 20px 0;
  line-height: 1.5;
`;

// Styled Components für Test User Modal
const TestUserModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const TestUserModalContent = styled.div`
  background: var(--main-bg-card-color);
  border-radius: 16px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 215, 0, 0.3);
`;

const TestUserModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const TestUserModalTitle = styled.h3`
  color: #FFD700;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  flex: 1;
`;

const TestUserForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TestUserInput = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--main-text-color);
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const TestUserButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const TestUserButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.primary ? css`
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #000;
    
    &:hover {
      background: linear-gradient(135deg, #FFA500, #FF8C00);
    }
    
    &:disabled {
      background: #666;
      color: #999;
      cursor: not-allowed;
    }
  ` : css`
    background: rgba(255, 255, 255, 0.1);
    color: var(--main-text-color);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `}
`;

const TestUserMessage = styled.div`
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  text-align: center;
  font-size: 0.9rem;
  
  ${props => props.error ? css`
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    color: #ff6b6b;
  ` : props.success ? css`
    background: rgba(0, 255, 0, 0.1);
    border: 1px solid rgba(0, 255, 0, 0.3);
    color: #51cf66;
  ` : css`
    background: rgba(255, 165, 0, 0.1);
    border: 1px solid rgba(255, 165, 0, 0.3);
    color: #ffa726;
  `}
`;

const LaunchInfo = styled.div`
  background: linear-gradient(135deg, rgba(255, 124, 0, 0.1), rgba(255, 165, 0, 0.1));
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 12px;
  padding: 14px 20px;
  margin-bottom: 16px;
  color: var(--main-text-color);
  font-size: 0.95rem;
  font-weight: 600;
  text-align: center;
  position: relative;
  overflow: hidden;
  animation: ${glow} 3s ease-in-out infinite;

  &::before {
    content: '✨';
    position: absolute;
    top: -8px;
    right: -8px;
    font-size: 1.2rem;
    animation: spin 6s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const CountdownContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin: 16px 0;
`;

const CountdownBox = styled.div`
  background: var(--card-background);
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  min-width: 60px;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const CountdownNumber = styled.div`
  font-size: 1.8rem;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 4px;
`;

const CountdownLabel = styled.div`
  font-size: 0.7rem;
  color: var(--secondary-text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

