import React, { useState } from 'react';
import styled from 'styled-components';

import { MdLightMode,MdOutlineCo2, MdDeviceHub} from "react-icons/md";
import { ImTarget } from "react-icons/im";
import ControllCollection from './ControlCards/ControllCollection';
import { GiHamburger, GiWateringCan } from "react-icons/gi";
import OGBIcon from '../../misc/OGBIcon'
import VPDTargets from './VPDTargets';


const ControllCard = () => {
  const [currentOption, setCurrentOption] = useState("Main Control");

  const handleOnClickIcon = (type) => {
    setCurrentOption(type);
  };

  const options = [
    { key: "Main Control", icon: <OGBIcon />, tooltip: "Main room controls: tent mode, plant stage, VPD mode, ambient guard" },
    { key: "Lights", icon: <MdLightMode />, tooltip: "Light schedule, spectrum control and light min/max settings" },
    { key: "CO₂ Control", icon: <MdOutlineCo2 />, tooltip: "CO₂ control and target/min/max settings" },
    { key: "Targets", icon: <ImTarget />, tooltip: "Temperature/humidity min/max, custom weights, night set control and VPD targets" },
    { key: "Hydro Settings", icon: <GiWateringCan />, tooltip: "Watering, crop steering, medium and hydro pump settings" },
    { key: "Feed Settings", icon: <GiHamburger />, tooltip: "Feed plan, custom nutrient recipes and feed schedules" },
    { key: "Special Settings", icon: <MdDeviceHub />, tooltip: "Grow area, plant type, energy price and other special options" },
  ];

  return (
    <>
      <OptionContainer>
        {options.map(({ key, icon, tooltip }) => (
          <IconWrapper
            key={key}
            $active={currentOption === key}
            onClick={() => handleOnClickIcon(key)}
          >
            {icon}
            <Tooltip>{tooltip}</Tooltip>
          </IconWrapper>
        ))}
      </OptionContainer>
      <VPDTargets/>
      <SelectContainer>
        <ControllCollection option={currentOption} />
      </SelectContainer>
    </>
  );
};

export default ControllCard;

const OptionContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;

  width: 90%;
  min-height: 5vh;
  font-size: 1.4rem;
  border-radius:20px;
  box-shadow: var(--main-shadow-art);
`;

const SelectContainer = styled.div`
  width: 95%;
  height: 100%;
`;

const Tooltip = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--main-bg-color);
  color: var(--main-text-color);
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  line-height: 1.1;
  white-space: normal;
  text-align: center;
  max-width: 140px;
  min-width: max-content;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  z-index: 100;
  box-shadow: var(--main-shadow-art);

  @media (max-width: 768px) {
    font-size: 0.6rem;
    padding: 3px 5px;
    max-width: 110px;
  }
`;
const IconWrapper = styled.div`
  position: relative;
  display: flex;
  font-size: 1.45rem;
  color: ${(props) => (props.$active ? "var(--primary-button-color)" : "var(--main-text-color)")};
  cursor: pointer;
  transition: color 0.3s ease;
  svg {
    width: 1em;
    height: 1em;
  }
  
  &:hover {
    color: var(--secondary-hover-color);
  }
  &:hover ${Tooltip} {
    opacity: 1;
  }

  &:first-child ${Tooltip} {
    left: 0;
    transform: none;
  }

  &:nth-child(2) ${Tooltip} {
    left: 0;
    transform: none;
  }

  &:last-child ${Tooltip} {
    right: 0;
    left: auto;
    transform: none;
  }

  &:nth-last-child(2) ${Tooltip} {
    right: 0;
    left: auto;
    transform: none;
  }

  @media (max-width: 1024px) {
    font-size: 1.25rem;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

