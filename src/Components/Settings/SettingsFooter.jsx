import { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaDiscord, FaTelegram, FaBook } from 'react-icons/fa';
import {ogbversions} from '../../config';
import OGBIcon from '../../misc/OGBIcon'
import DevBageHallOfFame from './DevBageHallOfFame';
import { DEV_USERS } from '../../config';

const SettingsFooter = () => {
  const currentYear = new Date().getFullYear();
  const [appVersion, setAppVersion] = useState('Laden...');
  const [hasUpdate, setHasUpdate] = useState(false);
  
  useEffect(() => {
    const fetchLatestRelease = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/OpenGrow-Box/OpenGrowBox-Frontend/releases/latest');
        const data = await response.json();
        // Prüfe, ob data.tag_name existiert und die Version abweicht
        if (data.tag_name && ogbversions.frontend !== data.tag_name) {
          setHasUpdate(true);
          setAppVersion(data.tag_name);
        } else {
          setAppVersion(ogbversions.frontend);
        }
      } catch (error) {
        console.error('Fehler beim Abrufen der neuesten Version:', error);
        setAppVersion('Unbekannt');
      }
    };

    fetchLatestRelease();
  }, []);

  const handleVersionClick = () => {
    window.open('https://github.com/OpenGrow-Box/OpenGrowBox-Frontend/releases/latest', '_blank');
  };

  const handleWikiClick = () => {
    window.open('https://github.com/OpenGrow-Box/OpenGrowBox/wiki', '_blank');
  };

  const handleTelegramClick = () => {
    window.open('https://t.me/+I1P3XoSSbbtkZjUy', '_blank');
  };
  
  const handleWebPageClick = () => {
    window.open('https://opengrowbox.net/', '_blank');
  };

  const handleDiscordClick = () => {
    window.open('https://discord.gg/TUeFmhDJKf', '_blank');
  };

  return (

      <>
    <FooterContainer>
      <OGBCopyright onClick={handleWebPageClick}>
        <IconWrapper>
         <OGBIcon/>
        </IconWrapper>

        <span className="copyright-text">© OpenGrowBox</span>
      </OGBCopyright>
      
      <SocialButtonsContainer>
        <WikiButton onClick={handleWikiClick}>
          <FaBook size={16} /> 
          <span>Wiki</span>
        </WikiButton>
        
        <TelegramButton onClick={handleTelegramClick}>
          <FaTelegram size={16} /> 
          <span>Telegram</span>
        </TelegramButton>
        
        <DiscordButton onClick={handleDiscordClick}>
          <FaDiscord size={16} /> 
          <span>Discord</span>
        </DiscordButton>
      </SocialButtonsContainer>
      
      <Version onClick={handleVersionClick} hasUpdate={hasUpdate}>
        <VersionIcon hasUpdate={hasUpdate}>
          {hasUpdate ? '🍀' : '📱'}
        </VersionIcon>
        <VersionText>
          {hasUpdate ? 'New Update!' : 'UI Version'}
          <VersionNumber>{appVersion}</VersionNumber>
        </VersionText>
      </Version>


    </FooterContainer>
    <DevBageHallOfFame users={DEV_USERS} key={DEV_USERS.indexOf}/>
    
    </>
  );
};

export default SettingsFooter;

// Animations
const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const FooterContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  font-size: 0.8rem;
  color: var(--main-text-color);
  background: var(--main-bg-card-color);
  border-radius: 12px;
  box-shadow: var(--main-shadow-art);
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const SocialButtonsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const BaseButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-weight: 500;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  span {
    font-size: 0.75rem;
  }
`;

const WikiButton = styled(BaseButton)`
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  
  &:hover {
    background: linear-gradient(135deg, #45a049, #3d8b40);
  }
`;

const TelegramButton = styled(BaseButton)`
  background: linear-gradient(135deg, #0088cc, #006c9c);
  color: white;
  
  &:hover {
    background: linear-gradient(135deg, #006c9c, #005580);
  }
`;

const DiscordButton = styled(BaseButton)`
  background: linear-gradient(135deg, #5865F2, #4752C4);
  color: white;
  
  &:hover {
    background: linear-gradient(135deg, #4752C4, #3c459c);
  }
`;

const Version = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.hasUpdate 
    ? 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' 
    : 'var(--main-bg-card-color)'
  };
  border: ${props => props.hasUpdate 
    ? '2px solid #FF6B6B' 
    : '1px solid var(--main-text-color)'
  };
  color: ${props => props.hasUpdate ? 'white' : 'var(--main-text-color)'};
  
  ${props => props.hasUpdate && css`
    animation: ${pulse} 2s infinite;
    box-shadow: 0 0 10px rgba(255, 165, 0, 0.3);
  `}
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    background: ${props => props.hasUpdate 
      ? 'linear-gradient(135deg, #FF8E8E, #FFB3B3)' 
      : 'var(--primary-accent)'
    };
  }
`;

const VersionIcon = styled.div`
  font-size: 1.2rem;
  ${props => props.hasUpdate && css`animation: ${blink} 1.5s infinite;`}
`;

const VersionText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 0.7rem;
  line-height: 1.2;
`;

const VersionNumber = styled.span`
  font-weight: bold;
  font-size: 0.65rem;
  opacity: 0.8;
`;

const OGBCopyright = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s ease;

  .ogb-icon {
    width: 2.5rem;
    height: 2.5rem;
    transition: transform 0.3s ease;
  }

  .copyright-text {
    font-size: 0.6rem;
    color: var(--main-text-color);
    transition: all 0.3s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    
    .ogb-icon {
      transform: scale(1.1);
    }
    
    .copyright-text {
      text-decoration: underline;
      color: var(--primary-accent);
    }
  }
`;

const IconWrapper = styled.div`
  width: 3.5rem;
  height: 3.5rem;
  padding:0.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color:white;
  box-shadow: 
    0 8px 25px rgba(16, 185, 129, 0.4),
    0 0 0 1px rgba(16, 185, 129, 0.2);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 1rem;
    z-index: -1;
    opacity: 0.5;
    filter: blur(8px);
  }
`;