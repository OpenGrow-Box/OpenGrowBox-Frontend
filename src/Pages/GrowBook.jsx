import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import GrowDayCounter from '../Components/GrowBook/GrowDayCounter';
import GrowLogs from '../Components/GrowBook/GrowLogs';

import WateringTracker from '../Components/GrowBook/WateringTracker';
import { useGlobalState } from '../Components/Context/GlobalContext';
import BottomBar from '../Components/Navigation/BottomBar';

import DashboardTitle from '../Components/Dashboard/DashboardTitle';
const GrowBook = () => {
  // Wir holen uns den globalen Sidebar-Zustand und die Home Assistant-Verbindung/Entitäten
  const { state } = useGlobalState();

  return (
    <MainContainer>
      <ContainerHeader>
        
        <DashboardTitle firstText="Grow" secondText="Book"/>

      </ContainerHeader>
        <InnerContent>
            <MainSection>
              <GrowDayCounter/>
              <WateringTracker/> 

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

const MainContainer = styled.div`
  overflow-y: auto;
  /* Padding hinzufügen, das der Höhe deiner BottomBar entspricht */
  padding-bottom: 6.5vh;

  @media (max-width: 480px) {
    transition: color 0.3s ease;
  }

  @media (max-width: 768px) {
    /* Hier ggf. anpassen, wenn die BottomBar höher ist */
    padding-bottom: 10vh;
    transition: color 0.3s ease;
  }

  @media (max-width: 1024px) {
    height: calc(100vh - 14.5vh);
  }
`;

const InnerContent= styled.div`
display:flex;

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
gap:1rem;
width:40vw;
height:92%;;
min-width:180px;

    @media (max-width: 1024px) {
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
const DataSection = styled.section`
display:flex;
flex-direction:column;
gap:1rem;
width:60vw;
height:92%;;
min-width:180px;


    @media (max-width: 1024px) {
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
