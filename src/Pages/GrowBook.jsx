import styled from 'styled-components';

import GrowDayCounter from '../Components/GrowBook/GrowDayCounter';
import GrowLogs from '../Components/GrowBook/GrowLogs';
import MediumSelector from '../Components/GrowBook/MediumSelector';


import BottomBar from '../Components/Navigation/BottomBar';

import DashboardTitle from '../Components/Dashboard/DashboardTitle';
import OGBNotes from '../Components/GrowBook/OGBNotes';

const MainContainer = styled.div`
  overflow-y: auto;
  padding-bottom: 100px;
  background: inherit;
  min-height: 100vh;

  @media (max-width: 768px) {
    padding-bottom: 110px;
  }

  @media (max-width: 480px) {
    padding-bottom: 120px;
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
  gap: 1rem;
  margin: 1rem;
  min-height: calc(100vh - 200px);

  @media (max-width: 1024px) {
    gap: 0.75rem;
    margin: 0.75rem;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    margin: 1rem 0.5rem;
    min-height: calc(100vh - 250px);
  }

  @media (max-width: 480px) {
    margin: 0.5rem 0.25rem;
    gap: 0.5rem;
    min-height: calc(100vh - 280px);
  }
`;

const MainSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1 1 50%;
  min-width: 0;

  @media (max-width: 768px) {
    flex: 1 1 100%;
    width: 100%;
    margin-bottom: 1rem;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }
`;

const DataSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1 1 50%;
  min-width: 0;

  @media (max-width: 768px) {
    flex: 1 1 100%;
    width: 100%;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const GrowBook = () => {
  return (
    <MainContainer>
      <ContainerHeader>
        <DashboardTitle firstText="OGB" secondText="Grow" thirdText="Book"/>
      </ContainerHeader>

      <InnerContent>
        <MainSection>
          <MediumSelector/>
          <GrowDayCounter/>
          <OGBNotes/>
        </MainSection>

        <DataSection>
          <GrowLogs/>
        </DataSection>
      </InnerContent>
      <BottomBar/>
    </MainContainer>
  );
};

export default GrowBook;
