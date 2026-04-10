
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
  overflow-x: hidden;
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
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 3.5vh;
  min-height: 50px;
  margin-bottom: 0.5rem;
  padding: 0 2rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  gap: 1rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
    height: 4vh;
    min-height: 45px;
    gap: 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 0 0.75rem;
    height: 4.5vh;
    min-height: 40px;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
`;

