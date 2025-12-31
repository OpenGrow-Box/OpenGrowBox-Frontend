import { useState, useEffect,useRef } from 'react';
import styled from 'styled-components';
import { LiaPlayCircle, LiaPauseCircle } from "react-icons/lia";
import { motion } from "framer-motion";  // Importiere Framer Motion

import CO2Card from '../Cards/SliderCards/CO2Card';
import TempCard from '../Cards/SliderCards/TempCard'
import HumCard from '../Cards/SliderCards/HumCard'
import DewCard from '../Cards/SliderCards/DewCard'

import SoilCard from '../Cards/SliderCards/SoilCard'
import WaterCard from '../Cards/SliderCards/WaterCard';

import VPDCard from '../Cards/SliderCards/VPDCard'
import DutyCycleCard from '../Cards/SliderCards/DutyCycleCard'
import LightIntensity from '../Cards/SliderCards/LightIntensity'
import { SliderContext } from '../../misc/SliderContext'
import PPFDCard from '../Cards/SliderCards/PPFD_DLI';
import TankLevelCard from '../Cards/SliderCards/TankLevelCard';
import AllTemps from '../Cards/SliderCards/AllTempsCard';
import AllHums from '../Cards/SliderCards/AllHumsCard';

const DashboardSlider = () => {

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef(null);
  const [filterByRoom, setFilterByRoom] = useState(true);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };


  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        handleNext();
      }, 20000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying]);


 useEffect(() => {
    if (isPlaying && !intervalRef.current) {
      intervalRef.current = setInterval(handleNext, 20000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);


  const pause = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsPlaying(false);
  };

  const resume = () => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(handleNext, 20000);
    }
    setIsPlaying(true);
  };


  const slides = [
    <SlideContent key="slide1">
      <WaterCard pause={pause} resume={resume} isPlaying={isPlaying} filterByRoom={filterByRoom}/>
    </SlideContent>,
    <SlideContent key="slide2">
      <CO2Card pause={pause} resume={resume} isPlaying={isPlaying}  filterByRoom={filterByRoom}/>
    </SlideContent>,
    <SlideContent key="slide3">
      <VPDCard pause={pause} resume={resume} isPlaying={isPlaying}  filterByRoom={filterByRoom}/>
      </SlideContent>,
    <SlideContent key="slide4">
      <TempCard pause={pause} resume={resume} isPlaying={isPlaying}  filterByRoom={filterByRoom}/>
    </SlideContent>,
    <SlideContent key="slide5">
      <HumCard pause={pause} resume={resume} isPlaying={isPlaying}  filterByRoom={filterByRoom}/>
    </SlideContent>,
    <SlideContent key="slide6">
      <DewCard pause={pause} resume={resume} isPlaying={isPlaying}  filterByRoom={filterByRoom}/>
    </SlideContent>,
    <SlideContent key="slide7">
      <SoilCard pause={pause} resume={resume} isPlaying={isPlaying}  filterByRoom={filterByRoom}/>
    </SlideContent>,
    <SlideContent key="slide8">
      <DutyCycleCard pause={pause} resume={resume} isPlaying={isPlaying}  filterByRoom={filterByRoom}/>
    </SlideContent>,
    <SlideContent key="slide9">
      <LightIntensity pause={pause} resume={resume} isPlaying={isPlaying}  filterByRoom={filterByRoom}/>
    </SlideContent>,
    <SlideContent key="slide10">
      <PPFDCard pause={pause} resume={resume} isPlaying={isPlaying}  filterByRoom={filterByRoom}/>
    </SlideContent>,
    <SlideContent key="slide11">
      <TankLevelCard pause={pause} resume={resume} isPlaying={isPlaying}  filterByRoom={filterByRoom}/>
    </SlideContent>,
    <SlideContent key="slide12">
      <AllTemps pause={pause} resume={resume} isPlaying={isPlaying}  filterByRoom={filterByRoom}/>
    </SlideContent>,
      <SlideContent key="slide13">
      <AllHums pause={pause} resume={resume} isPlaying={isPlaying}  filterByRoom={filterByRoom}/>
    </SlideContent>,
  ];

  return (
  <SliderContext.Provider value={{ pause, resume }}>
    <SliderContainer>
      <SliderMenu>
        <IconWrapper $active={isPlaying} onClick={resume}>
          <LiaPlayCircle />
        </IconWrapper>

        <FilterToggle>
          <FilterOption 
            $active={filterByRoom} 
            onClick={() => setFilterByRoom(true)}
          >
            Room
          </FilterOption>
          <FilterOption 
            $active={!filterByRoom} 
            onClick={() => setFilterByRoom(false)}
          >
            All
          </FilterOption>
        </FilterToggle>

        <IconWrapper $active={!isPlaying} onClick={pause}>
          <LiaPauseCircle />
        </IconWrapper>
      </SliderMenu>



      {/* Framer Motion Slide Animation */}
      <ArrowContainer>
        <ArrowButton onClick={handlePrev}>&#10094;</ArrowButton>
        <ArrowButton onClick={handleNext}>&#10095;</ArrowButton>
      </ArrowContainer>


      <SlideWrapper
        as={motion.div}
        key={currentIndex}  // Damit die Animation bei Indexwechsel erneut ausgeführt wird
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {slides[currentIndex]}
      </SlideWrapper>
    </SliderContainer>
  </SliderContext.Provider>
  );
};

export default DashboardSlider;

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  border-radius: 25px;
  background: var(--main-bg-card-color);
  box-shadow: var(--main-shadow-art);
  padding-bottom: 1rem;
  overflow: hidden;
`;

const SliderMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin: 0.75rem;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  border-radius: 20px;
  box-shadow: var(--main-shadow-art);
  background: rgba(0, 0, 0, 0.15);
`;

const SlideWrapper = styled.div`
  display: flex;
  padding: 0.5rem;
  width: 95%;
  min-height: 15vh;
  max-height: 50vh;
  overflow-y: auto;
`;

const ArrowContainer = styled.div`
  display: flex;
  justify-content: space-around;
  min-width: 25%;
`;

const ArrowButton = styled.button`
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--main-text-color);
  cursor: pointer;
  padding: 0.25rem 0.25rem;

  transition: color 0.3s ease;

  &:hover {
    color:var(--secondary-hover-color)
  }
`;

const SlideContent = styled.div`
  width: 100%;
`;

const IconWrapper = styled.div`
  display: flex;
  font-size: 1.45rem;
  color: ${(props) => (props.$active ? "var(--primary-button-color)" : "#fff")};
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: var(--secondary-hover-color);
  }

  @media (max-width: 1024px) {
    font-size: 1.25rem;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;
const FilterToggle = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 0.15rem;
  gap: 0.15rem;
`;

const FilterOption = styled.button`
  padding: 0.25rem 0.6rem;
  background: ${props => props.$active ? 'var(--primary-button-color)' : 'transparent'};
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: ${props => props.$active ? '#fff' : 'var(--main-text-color)'};
  font-size: 0.7rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? 'var(--primary-button-color)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;
