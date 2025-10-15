import React, { useEffect, useState } from 'react'
import { usePremium } from '../Components/Context/OGBPremiumContext'
import BottomBar from '../Components/Navigation/BottomBar'
import DashboardTitle from '../Components/Dashboard/DashboardTitle'
import styled from 'styled-components'
import GrowBenchmark from '../Components/Premium/GrowBenchmark'
import GrowPlaner from '../Components/Premium/GrowPlaner'
import GrowMananger from '../Components/Premium/GrowMananger'

const Premium = () => {
  const { isPremium } = usePremium()
  const [loading, setLoading] = useState(true)

  
  useEffect(() => {
    let elapsed = 0
    const interval = setInterval(() => {
      if (isPremium === true || elapsed >= 1000) {  // 3 Sekunden statt 5
        clearInterval(interval)
        setLoading(false)
      }
      elapsed += 250
    }, 250)

    return () => clearInterval(interval)
  }, [isPremium])


  const funnyMessages = [
    "🌿 Sorry, but these premium features are higher than your current plan! 🌿",
    "🚫 Nice try, but you can't hack your way to premium content! 🌱",
    "🔒 This content is locked tighter than a dispensary safe! Get premium access! 🔒",
    "💚 Upgrade your plan to unlock these dank features! 💚",
    "🌿 Your current plan is... well, not premium enough for this content! 🌿"
  ]

  const getRandomFunnyMessage = () => {
    return funnyMessages[Math.floor(Math.random() * funnyMessages.length)]
  }

  return (
    <div className="premium-container">
      <MainContainer>
        <ContainerHeader>
          <DashboardTitle firstText="OGB" secondText="Premium" />
        </ContainerHeader>

        {loading ? (
          <LoadingWrapper>
            <p>Loading your premium status...</p>
            <div className="loading-spinner" />
          </LoadingWrapper>
        ) : isPremium ? (
          <PremContainer>
            <LeftPremContainer>

              <GrowMananger/>
              <GrowPlaner/>

            
            </LeftPremContainer>
            <RightPremContainer>

            </RightPremContainer>


          </PremContainer>
        ) : (
          <DeniedBox>
            <h2>🚫 Access Denied</h2>
            <p>{getRandomFunnyMessage()}</p>
            <UpgradeButton onClick={() => window.location.href = 'https://opengrowbox.net'}>
              🚀 Upgrade Now
            </UpgradeButton>
          </DeniedBox>
        )}

        <BottomBar />
      </MainContainer>
    </div>
  )
}

export default Premium


const MainContainer = styled.div`
  overflow-y: auto;
  padding-bottom: 10vh;
  @media (max-width: 480px) {
    transition: color 0.3s ease;
  }
  @media (max-width: 768px) {
    height: calc(100vh - 12.0vh);
  }
`

const ContainerHeader = styled.div`
  display: flex;
  top: 1;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 3.5vh;
  margin-bottom: 0.5rem;
  padding: 0 2rem;
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
`

const PremContainer = styled.section`
  display: flex;
  gap:1rem;
  top: 1;
  justify-content: space-between;

    @media (max-width: 1024px) {
        transition: color 0.3s ease;
    }

    @media (max-width: 768px) {
        width:100%;
        transition: color 0.3s ease;
    }

    @media (max-width: 480px) {
      flex-direction:column;
      width:95vw;  
      transition: color 0.3s ease;

    }

`

const LeftPremContainer = styled.div`
display:flex;
flex-direction:column;
gap:1rem;
width:100%;
height: 100%;
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
const RightPremContainer = styled.div`
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

const DeniedBox = styled.div`
  margin: 2rem;
  padding: 2rem;
  background: #1c1c1c;
  border-radius: 1rem;
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.4);
  text-align: center;
  color: #fff;
`

const UpgradeButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.8rem 1.5rem;
  background-color: #22c55e;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    background-color: #16a34a;
  }
`

const LoadingWrapper = styled.div`
  text-align: center;
  margin-top: 2rem;
  color: #aaa;
  font-size: 1.1rem;

  .loading-spinner {
    margin: 1rem auto;
    width: 2rem;
    height: 2rem;
    border: 3px solid rgba(255,255,255,0.2);
    border-top: 3px solid #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

