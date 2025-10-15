'use client';
import React from 'react';
import styled from 'styled-components';
import { FaTrophy } from 'react-icons/fa';

const DevBageHallOfFame = ({ users = [] }) => {
  return (
    <HallOfFameCard>
      <Title>
        <TrophyIcon />
        Dev Hall of Fame
      </Title>
      <NameList>
        {users.length > 0 ? (
          users.map((user, index) => (
            <NameItem key={index} rank={index + 1}>
              <RankBadge rank={index + 1}>
                {index < 3 ? <FaTrophy /> : `#${index + 1}`}
              </RankBadge>
              {user.name}
            </NameItem>
          ))
        ) : (
          <EmptyText>Keine Teilnehmer:innen eingetragen.</EmptyText>
        )}
      </NameList>
    </HallOfFameCard>
  );
};

// === Styled Components ===
const HallOfFameCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--main-bg-card-color);
  border-radius: 12px;
  box-shadow: var(--main-shadow-art);
  padding: 2rem;
  margin: 2rem auto;
  max-width: 800px;
  gap: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 600px) {
    padding: 1.5rem;
    margin: 1rem;
  }
`;

const Title = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e3a8a; /* Dunkles Blau für hohen Kontrast */
  text-align: center;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: linear-gradient(45deg, #3b82f6, #60a5fa); /* Blau-Verlauf für Titel */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 600px) {
    font-size: 1.2rem;
  }
`;


const TrophyIcon = styled(FaTrophy)`
  color: #f59e0b; /* Bernsteinfarben für das Trophy-Icon */
  font-size: 1.5rem;
`;

const NameList = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
`;

const NameItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ rank }) =>
    rank === 1
      ? 'linear-gradient(45deg, #f59e0b, #fcd34d)' /* Gold */
      : rank === 2
      ? 'linear-gradient(45deg, #9ca3af, #d1d5db)' /* Silber */
      : rank === 3
      ? 'linear-gradient(45deg, #b45309, #f97316)' /* Bronze */
      : 'rgba(59, 130, 246, 0.1)'}; /* Blauer Hintergrund für andere Ränge */
  color: ${({ rank }) => (rank <= 3 ? '#fff' : '#1e3a8a')}; /* Weiß für Top-3, Dunkelblau für andere */
  font-weight: 600;
  font-size: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid
    ${({ rank }) =>
      rank === 1
        ? '#d97706'
        : rank === 2
        ? '#6b7280'
        : rank === 3
        ? '#92400e'
        : '#3b82f6'}; /* Kontrastreiche Rahmenfarben */
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    background: ${({ rank }) =>
      rank <= 3 ? undefined : '#3b82f6'}; /* Blauer Hover-Effekt für Nicht-Top-3 */
    color: ${({ rank }) => (rank <= 3 ? undefined : '#fff')}; /* Weißer Text beim Hover */
  }

  @media (max-width: 600px) {
    font-size: 0.9rem;
    padding: 0.5rem 0.75rem;
  }
`;

const RankBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ rank }) =>
    rank === 1
      ? '#b45309'
      : rank === 2
      ? '#4b5563'
      : rank === 3
      ? '#7c2d12'
      : '#1e3a8a'}; /* Kontrastreiche Farben für Badges */
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;

  svg {
    font-size: 1rem;
  }
`;

const EmptyText = styled.p`
  font-size: 1rem;
  color: #4b5563; /* Dunkelgrau für besseren Kontrast */
  margin: 0;
  font-style: italic;
  text-align: center;
`;

// === Export ===
export default DevBageHallOfFame;