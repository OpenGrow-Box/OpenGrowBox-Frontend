import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { FaTemperatureHigh, FaExpand, FaCompress } from 'react-icons/fa'

const HeatMap = () => {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const roomRef = useRef(null)
  const sensorsRef = useRef([])
  const mouseRef = useRef({ x: 0, y: 0, isDragging: false, lastX: 0, lastY: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedSensor, setSelectedSensor] = useState(null)
  



  const [sensors] = useState([
    { 
      id: 1, 
      position: { x: -3, y: 3, z: -3 }, 
      temp: 22.5, 
      humidity: 45, 
      name: 'Sensor Oben Links Vorne' 
    },
    { 
      id: 2, 
      position: { x: 3, y: 3, z: -3 }, 
      temp: 24.8, 
      humidity: 52, 
      name: 'Sensor Oben Rechts Vorne' 
    },
    { 
      id: 3, 
      position: { x: 0, y: 2, z: 0 }, 
      temp: 23.2, 
      humidity: 48, 
      name: 'Sensor Mitte' 
    },
    { 
      id: 4, 
      position: { x: -3, y: 0.5, z: 3 }, 
      temp: 21.3, 
      humidity: 55, 
      name: 'Sensor Unten Links Hinten' 
    },
    { 
      id: 5, 
      position: { x: 3, y: 0.5, z: 3 }, 
      temp: 25.1, 
      humidity: 50, 
      name: 'Sensor Unten Rechts Hinten' 
    },
    { 
      id: 6, 
      position: { x: -3, y: 2, z: 0 }, 
      temp: 22.8, 
      humidity: 47, 
      name: 'Sensor Mitte Links' 
    },
  ])

  const getColorByTemp = (temp) => {
    if (temp < 20) return 0x3b82f6
    if (temp < 22) return 0x22c55e
    if (temp < 24) return 0xeab308
    if (temp < 26) return 0xf97316
    return 0xef4444
  }

  useEffect(() => {
    // Scene Setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(8, 6, 8)
    camera.lookAt(0, 2, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    canvasRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    scene.add(directionalLight)

    // Room (Wireframe Box)
    const roomGeometry = new THREE.BoxGeometry(8, 5, 8)
    const edges = new THREE.EdgesGeometry(roomGeometry)
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x4a5568, 
      linewidth: 2 
    })
    const room = new THREE.LineSegments(edges, lineMaterial)
    room.position.set(0, 2.5, 0)
    scene.add(room)
    roomRef.current = room

    // Room Walls (Semi-transparent)
    const wallMaterial = new THREE.MeshPhongMaterial({
      color: 0x2d3748,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    })
    const roomMesh = new THREE.Mesh(roomGeometry, wallMaterial)
    roomMesh.position.set(0, 2.5, 0)
    scene.add(roomMesh)

    // Floor Grid
    const gridHelper = new THREE.GridHelper(8, 8, 0x4a5568, 0x2d3748)
    gridHelper.position.y = 0
    scene.add(gridHelper)

    // Add Sensors
    sensors.forEach((sensor) => {
      const sensorGroup = new THREE.Group()

      // Sensor Sphere
      const geometry = new THREE.SphereGeometry(0.3, 32, 32)
      const material = new THREE.MeshPhongMaterial({
        color: getColorByTemp(sensor.temp),
        emissive: getColorByTemp(sensor.temp),
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9
      })
      const sphere = new THREE.Mesh(geometry, material)
      sensorGroup.add(sphere)

      // Glow Effect
      const glowGeometry = new THREE.SphereGeometry(0.5, 32, 32)
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: getColorByTemp(sensor.temp),
        transparent: true,
        opacity: 0.2
      })
      const glow = new THREE.Mesh(glowGeometry, glowMaterial)
      sensorGroup.add(glow)

      // Position
      sensorGroup.position.set(sensor.position.x, sensor.position.y, sensor.position.z)
      sensorGroup.userData = sensor
      scene.add(sensorGroup)
      sensorsRef.current.push(sensorGroup)

      // Label
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = 256
      canvas.height = 128
      context.fillStyle = '#ffffff'
      context.font = 'Bold 24px Arial'
      context.textAlign = 'center'
      context.fillText(sensor.name, 128, 40)
      context.fillText(`${sensor.temp}°C`, 128, 80)

      const texture = new THREE.CanvasTexture(canvas)
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.scale.set(2, 1, 1)
      sprite.position.set(0, 0.8, 0)
      sensorGroup.add(sprite)
    })

    // Animation Loop
    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Rotate glow effects
      sensorsRef.current.forEach((sensorGroup, index) => {
        if (sensorGroup.children[1]) {
          sensorGroup.children[1].rotation.y += 0.01
          // Pulsing effect
          const scale = 1 + Math.sin(Date.now() * 0.002 + index) * 0.1
          sensorGroup.children[1].scale.set(scale, scale, scale)
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    // Mouse Events
    const handleMouseDown = (e) => {
      mouseRef.current.isDragging = true
      mouseRef.current.lastX = e.clientX
      mouseRef.current.lastY = e.clientY
    }

    const handleMouseMove = (e) => {
      if (mouseRef.current.isDragging) {
        const deltaX = e.clientX - mouseRef.current.lastX
        const deltaY = e.clientY - mouseRef.current.lastY

        const rotationSpeed = 0.005
        camera.position.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          -deltaX * rotationSpeed
        )

        const distance = camera.position.length()
        camera.position.y += deltaY * 0.02
        camera.position.y = Math.max(1, Math.min(10, camera.position.y))

        camera.position.normalize().multiplyScalar(distance)
        camera.lookAt(0, 2, 0)

        mouseRef.current.lastX = e.clientX
        mouseRef.current.lastY = e.clientY
      }
    }

    const handleMouseUp = () => {
      mouseRef.current.isDragging = false
    }

    const handleWheel = (e) => {
      e.preventDefault()
      const zoomSpeed = 0.1
      const distance = camera.position.length()
      const newDistance = distance + (e.deltaY > 0 ? zoomSpeed : -zoomSpeed)
      const clampedDistance = Math.max(5, Math.min(20, newDistance))
      camera.position.normalize().multiplyScalar(clampedDistance)
    }

    const canvas = renderer.domElement
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    // Handle Resize
    const handleResize = () => {
      if (canvasRef.current && rendererRef.current && cameraRef.current) {
        const width = canvasRef.current.clientWidth
        const height = canvasRef.current.clientHeight
        cameraRef.current.aspect = width / height
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(width, height)
      }
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      window.removeEventListener('resize', handleResize)
      if (canvasRef.current && renderer.domElement) {
        canvasRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [sensors])



  return (
    <Container>
      <Header>
        <TitleSection>
          <FaTemperatureHigh size={28} />
          <div>
            <Title>3D Raum Heatmap "DEVSTAGE"w</Title>
            <Subtitle>Interaktive Temperatur-Visualisierung</Subtitle>

          </div>
        </TitleSection>

      </Header>

      <CanvasContainer ref={canvasRef} $isFullscreen={isFullscreen} />

      <Controls>
        <ControlItem>
          <ControlIcon>🖱️</ControlIcon>
          <ControlText>Ziehen zum Drehen</ControlText>
        </ControlItem>
        <ControlItem>
          <ControlIcon>🖲️</ControlIcon>
          <ControlText>Scrollen zum Zoomen</ControlText>
        </ControlItem>
      </Controls>

      <Legend>
        <LegendTitle>Temperaturskala</LegendTitle>
        <LegendItems>
          <LegendItem>
            <LegendColor color="#3b82f6" />
            <span>&lt; 20°C</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#22c55e" />
            <span>20-22°C</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#eab308" />
            <span>22-24°C</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#f97316" />
            <span>24-26°C</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#ef4444" />
            <span>&gt; 26°C</span>
          </LegendItem>
        </LegendItems>
      </Legend>

      <SensorList>
        <SensorListTitle>Sensoren</SensorListTitle>
        {sensors.map((sensor) => (
          <SensorCard key={sensor.id} color={`#${getColorByTemp(sensor.temp).toString(16).padStart(6, '0')}`}>
            <SensorName>{sensor.name}</SensorName>
            <SensorData>
              <SensorValue>{sensor.temp}°C</SensorValue>
              <SensorValue>{sensor.humidity}%</SensorValue>
            </SensorData>
          </SensorCard>
        ))}
      </SensorList>
    </Container>
  )
}

const Container = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 1200px;
  margin: 20px auto;
  color: white;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`

const Title = styled.h2`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
`

const Subtitle = styled.p`
  margin: 4px 0 0 0;
  font-size: 14px;
  opacity: 0.9;
`

const FullscreenButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
`

const CanvasContainer = styled.div`
  width: 100%;
  height: ${props => props.$isFullscreen ? '80vh' : '500px'};
  border-radius: 15px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
  transition: height 0.3s ease;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.3);
`

const Controls = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
`

const ControlItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const ControlIcon = styled.span`
  font-size: 24px;
`

const ControlText = styled.span`
  font-size: 14px;
  font-weight: 500;
`

const Legend = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 15px 20px;
  backdrop-filter: blur(10px);
  margin-bottom: 20px;
`

const LegendTitle = styled.div`
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
`

const LegendItems = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
`

const LegendColor = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: ${props => props.color};
  box-shadow: 0 2px 8px ${props => props.color}60;
`

const SensorList = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
`

const SensorListTitle = styled.h3`
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
`

const SensorCard = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-left: 4px solid ${props => props.color};
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.3);
    transform: translateX(5px);
  }

  &:last-child {
    margin-bottom: 0;
  }
`

const SensorName = styled.div`
  font-weight: 500;
  font-size: 14px;
`

const SensorData = styled.div`
  display: flex;
  gap: 15px;
`

const SensorValue = styled.div`
  font-weight: 600;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 6px;
`

export default HeatMap