import styled from 'styled-components';

import GrowDayCounter from '../Components/GrowBook/GrowDayCounter';
import GrowLogs from '../Components/GrowBook/GrowLogs';
import MediumSelector from '../Components/GrowBook/MediumSelector';


import BottomBar from '../Components/Navigation/BottomBar';

import DashboardTitle from '../Components/Dashboard/DashboardTitle';
import OGBNotes from '../Components/GrowBook/OGBNotes';

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 10vh;
  background: inherit;
  min-height: 100vh;
  width: 100%;
  max-width: none;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding-bottom: 12vh;
  }

  @media (max-width: 480px) {
    padding-bottom: 14vh;
  }
`;

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

const InnerContent = styled.div`
  display: flex;
  align-items: stretch;
  flex-wrap: nowrap;
  gap: 1rem;
  padding: 1rem;
  min-height: calc(100vh - 200px);
  box-sizing: border-box;
  width: 100%;
  flex: 1;

  @media (max-width: 1024px) {
    gap: 0.75rem;
    padding: 0.75rem;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1rem 0.5rem;
    min-height: auto;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 0.25rem;
    gap: 0.5rem;
  }
`;

const LeftSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 0 0 48%;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;

  > * {
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    flex: none;
    max-width: 100%;
    overflow-y: visible;
  }
`;

const RightSection = styled.section`
  display: flex;
  flex-direction: column;
  flex: 0 0 52%;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;

  > * {
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    flex: none;
    max-width: 100%;
    overflow-y: visible;
  }
`;


const GrowBook = () => {
  return (
    <MainContainer>
      <ContainerHeader>
        <DashboardTitle firstText="OGB" secondText="Grow" thirdText="Book"/>
      </ContainerHeader>

      <InnerContent>
        <LeftSection>
          <MediumSelector/>
          <GrowDayCounter/>
          <OGBNotes/>
        </LeftSection>

        <RightSection>
          <GrowLogs/>
        </RightSection>
      </InnerContent>


      <BottomBar/>
    </MainContainer>
  );
};

export default GrowBook;
