
import styled from 'styled-components';
import BottomBar from '../Components/Navigation/BottomBar';
import DashboardTitle from '../Components/Dashboard/DashboardTitle';
import SettingsPanel from '../Components/Settings/SettingsPanel';
import AdminPanel from '../Components/Settings/AdminPanel';

const Settings = () => {
  return (
    <MainContainer >
      <ContainerHeader>
        <DashboardTitle firstText="OGB" secondText="Settings"/>
      </ContainerHeader>

      <InnerContent>
        <MainSection>

         <SettingsPanel/>

         <AdminPanel/>

         </MainSection>

      </InnerContent>
      <BottomBar/>
    </MainContainer>
  );
};

export default Settings;

const MainContainer = styled.div`
  overflow-y: auto;
  padding-bottom: 10vh;
  background: inherit;
  @media (max-width: 480px) {
    transition: color 0.3s ease;
  }
  @media (max-width: 768px) {
    height: calc(100vh - 12.0vh);
  }
 `;

const InnerContent= styled.div`
 display:flex;
 height:100%;
 gap:0.5rem;
 margin:1rem;

    @media (max-width: 1024px) {
        transition: color 0.3s ease;
    }

    @media (max-width: 768px) {
        flex-direction:column;
        transition: color 0.3s ease;
    }

    @media (max-width: 480px) {
        transition: color 0.3s ease;
    }

 `





const SettingsHelp = styled.div`
  background: var(--main-bg-card-color);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: var(--main-shadow-art);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const HelpCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
`

const HelpTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: var(--primary-accent);
  font-size: 1rem;
`

const HelpText = styled.p`
  margin: 0;
  color: var(--second-text-color);
  font-size: 0.9rem;
`

const MainSection = styled.section`
display:flex;
flex-direction:column;
justify-content:center;
align-items:center;
gap:1rem;
width:100vw;

min-width:180px;

    @media (min-width: 1024px) {
        width:200vh;
        transition: color 0.3s ease;

    }

    @media (max-width: 768px) {
        width:100%;
        transition: color 0.3s ease;
    }

    @media (max-width: 480px) {
        transition: color 0.3s ease;
    }

`

const ContainerHeader = styled.div`
    display: flex;

    top:1;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 3.5vh;
    margin-bottom: 0.5rem;
    padding: 0 2rem;
    background: rgba(0, 0, 0, 0.4);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);

`;


