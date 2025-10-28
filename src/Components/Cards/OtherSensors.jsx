import React from 'react'
import styled from 'styled-components'

const OtherSensors = () => {
  return (
    <Container>
      <Title>Other Sensors</Title>
      <Message>Coming Soon 🚧</Message>
    </Container>
  )
}

export default OtherSensors

const Container = styled.div`
  width: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;

  background: var(--main-bg-card-color);
  border-radius: 20px;
  box-shadow: var(--main-shadow-art);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--main-shadow-hover);
  }
`

const Title = styled.h2`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--main-text-color);
  text-align: center;
`

const Message = styled.p`
  font-size: 1rem;
  opacity: 0.7;
  text-align: center;
  margin: 0;
`
