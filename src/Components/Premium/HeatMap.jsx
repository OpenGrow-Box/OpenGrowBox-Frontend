import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { FaTemperatureHigh, FaSave } from 'react-icons/fa'
import { useHomeAssistant } from '../Context/HomeAssistantContext'
import { useGlobalState } from '../Context/GlobalContext'

const HeatMap = () => {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const selectedObjectRef = useRef(null)
  const planeRef = useRef(new THREE.Mesh())
  const sensorsRef = useRef([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const [savedMessage, setSavedMessage] = useState('')
  const [lightState, setLightState] = useState(true)
  const [isDaytime, setIsDaytime] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const { HASS } = useGlobalState()
  const { entities, currentRoom } = useHomeAssistant()
  const [debugInfo, setDebugInfo] = useState({})
  const doubleClickTimeoutRef = useRef(null)
  const lastClickRef = useRef(0)

  const STORAGE_KEY = `heatmap_positions_${currentRoom?.toLowerCase() || 'default'}`

  const FIXED_POSITIONS = {
    [`sensor.ogb_currentvpd_${currentRoom?.toLowerCase()}`]:  { x: 0, y: 5.5, z: 1 },
    [`sensor.ogb_avgtemperature_${currentRoom?.toLowerCase()}`]: { x: 2, y: 5, z: 0 },
    [`sensor.ogb_avghumidity_${currentRoom?.toLowerCase()}`]: { x: 2, y: 5, z: 0 },
    [`sensor.ogb_avgdewpoint_${currentRoom?.toLowerCase()}`]: { x: 2, y: 5, z: 0 },
    [`sensor.ogb_outsitetemperature_${currentRoom?.toLowerCase()}`]: { x: -5, y: 5.5, z: 1 },
    [`sensor.ogb_outsitehumidity${currentRoom?.toLowerCase()}`]: { x: -5, y: 5.5, z: 1 },
    [`sensor.ogb_outsitedewpoint_${currentRoom?.toLowerCase()}`]: { x: -5, y: 5.5, z: 1 },
  }

  const LABEL_POSITIONS = {
    up_left: { x: -2, y: 5.5, z: 1 },
    up_right: { x: 2, y: 5.5, z: 1 },
    up_center: { x: 0, y: 5.5, z: 1 },
    front_left: { x: -2, y: 4, z: -2 },
    front_right: { x: 2, y: 4, z: -2 },
    front_center: { x: 0, y: 4, z: -2 },
    back_left: { x: -2, y: 4, z: 2 },
    back_right: { x: 2, y: 4, z: 2 },
    back_center: { x: 0, y: 4, z: 2 },
  }

  const [customPositions, setCustomPositions] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  })

  const savePositions = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customPositions))
    setSavedMessage('Positionen gespeichert!')
    setTimeout(() => setSavedMessage(''), 2000)
  }, [customPositions, STORAGE_KEY])

  const getColorByValue = (val, sensor) => {
    let type = selectedType
    if (selectedType === 'all' && sensor) {
      const unit = sensor.unit || ''
      const name = sensor.name.toLowerCase()
      if (unit === '°C' || unit === '°F' || name.includes('temp')) {
        type = 'temperature'
      } else if (unit === '%' || name.includes('feucht') || name.includes('humidity')) {
        type = 'humidity'
      } else if (name.includes('tau') || name.includes('dew')) {
        type = 'dewpoint'
      }
    }

    if (type === 'temperature') {
      if (val < 20) return 0x3b82f6
      if (val < 22) return 0x22c55e
      if (val < 24) return 0xeab308
      if (val < 26) return 0xf97316
      return 0xef4444
    }
    if (type === 'humidity') {
      if (val < 30) return 0x60a5fa
      if (val < 50) return 0x22c55e
      if (val < 70) return 0xeab308
      return 0xef4444
    }
    if (type === 'dewpoint') {
      if (val < 5) return 0x60a5fa
      if (val < 10) return 0x22c55e
      if (val < 15) return 0xeab308
      return 0xf97316
    }
    
    return 0xffffff
  }

  const sensors = useMemo(() => {
    if (!HASS || !entities || !currentRoom) return []
    const devices = HASS.devices || {}
    const haEntities = HASS.entities || {}

    const roomDeviceIds = Object.entries(devices)
      .filter(([_, d]) => d.area_id === currentRoom.toLowerCase())
      .map(([id]) => id)

    const result = Object.entries(entities)
      .filter(([entityId, entity]) => {
        const e = entity || {}
        const deviceId = haEntities[entityId]?.device_id
        const unit = e.attributes?.unit_of_measurement || ''
        const dc = e.attributes?.device_class || ''
        const name = (e.attributes?.friendly_name || '').toLowerCase()

        if (deviceId && !roomDeviceIds.includes(deviceId)) return false

        const unwantedTerms = ['wifi', 'signal', 'voltage',"battery", 'connection', 'tolerance', 'cropsteering', 'restart', 'energy', 'volt', 'mqtt']
        const allowedOgbTerms = ['avg', 'outside', 'ambient']

        if (
          entityId.includes('ogb_') &&
          !allowedOgbTerms.some(term => entityId.includes(term) || name.includes(term))
        ) return false

        if (
          !entityId.includes('ogb_') &&
          unwantedTerms.some(term => entityId.includes(term) || name.includes(term))
        ) return false

        switch (selectedType) {
          case 'all':
            return true
          case 'temperature':
            return (
              dc === 'temperature' ||

              entityId.includes('temp') ||
              name.includes('temp')
            )
          case 'humidity':
            return (
              dc === 'humidity' ||
              entityId.includes('humid') ||
              name.includes('feucht')
            )
          case 'dewpoint':
            return (
              name.includes('dewpoint') ||
              dc === 'dew_point'
            )
          default:
            return false
        }
      })
      .map(([entityId, entity]) => {
        const val = parseFloat(entity.state)
        if (isNaN(val)) return null

        const labelPosKey = entity.attributes?.heatmap_label_position
        const labelPos = labelPosKey && LABEL_POSITIONS[labelPosKey] ? LABEL_POSITIONS[labelPosKey] : null

        const position =
          entity.attributes?.heatmap_position ||
          customPositions[entityId] ||
          labelPos ||
          FIXED_POSITIONS[entityId] ||
          { x: 0, y: 1, z: 0 }

        return {
          id: entityId,
          name: entity.attributes?.friendly_name || entityId,
          value: val,
          unit: entity.attributes?.unit_of_measurement || '',
          position,
          labelPosKey,
        }
      })
      .filter(Boolean)

    setDebugInfo({ room: currentRoom, type: selectedType, count: result.length })
    return result
  }, [HASS?.devices, entities, currentRoom, selectedType, customPositions])

  useEffect(() => {
    if (!canvasRef.current || rendererRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(75, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 1000)
    camera.position.set(8, 6, 8)
    camera.lookAt(0, 2, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    canvasRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 5)
    scene.add(dirLight)

    const roomGeom = new THREE.BoxGeometry(8, 5, 8)
    const edges = new THREE.EdgesGeometry(roomGeom)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x4a5568 })
    const room = new THREE.LineSegments(edges, lineMat)
    room.position.set(0, 2.5, 0)
    scene.add(room)

    const gridHelper = new THREE.GridHelper(8, 8, 0x4a5568, 0x2d3748)
    gridHelper.position.y = 0
    scene.add(gridHelper)

    const planeGeom = new THREE.PlaneGeometry(20, 20)
    const planeMat = new THREE.MeshBasicMaterial({ visible: false })
    const plane = new THREE.Mesh(planeGeom, planeMat)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = 0.01
    scene.add(plane)
    planeRef.current = plane

    let isRotating = false
    let previousMouse = { x: 0, y: 0 }
    let isDraggingRef = { current: false }

    const handleMouseDown = (e) => {
      if (e.button !== 0) return
      if (!rendererRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      mouseRef.current.x = (x / rect.width) * 2 - 1
      mouseRef.current.y = -(y / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      const intersects = raycasterRef.current.intersectObjects(sensorsRef.current, true)

      previousMouse = { x: e.clientX, y: e.clientY }

      if (intersects.length > 0) {
        const obj = intersects[0].object
        let group = obj.parent
        
        while (group && !group.userData.id && group !== scene) {
          group = group.parent
        }
        
        if (group && group.userData.id) {
          const now = Date.now()
          const timeSinceLastClick = now - lastClickRef.current
          
          if (timeSinceLastClick < 300) {
            setEditingId(group.userData.id)
            isDraggingRef.current = true
            canvasRef.current.style.cursor = 'grabbing'
            selectedObjectRef.current = group
            planeRef.current.position.y = group.position.y
          } else {
            lastClickRef.current = now
            isRotating = true
          }
        }
      } else {
        isRotating = true
      }
    }

    const handleMouseMove = (e) => {
      if (!rendererRef.current) return

      const deltaX = e.clientX - previousMouse.x
      const deltaY = e.clientY - previousMouse.y

      if (isRotating && !isDraggingRef.current) {
        const spherical = new THREE.Spherical()
        const camPos = cameraRef.current.position
        const centerY = 2
        
        const relativePos = new THREE.Vector3(camPos.x, camPos.y - centerY, camPos.z)
        spherical.setFromVector3(relativePos)
        
        spherical.theta -= deltaX * 0.005
        spherical.phi += deltaY * 0.005
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))
        
        const newPos = new THREE.Vector3()
        newPos.setFromSpherical(spherical)
        newPos.y += centerY
        cameraRef.current.position.copy(newPos)
        cameraRef.current.lookAt(0, centerY, 0)
      }

      if (isDraggingRef.current && selectedObjectRef.current) {
        if (e.shiftKey || e.ctrlKey) {
          const deltaY = e.clientY - previousMouse.y
          selectedObjectRef.current.position.y -= deltaY * 0.02
        } else {
          const rect = canvasRef.current.getBoundingClientRect()
          mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
          mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
          const intersect = raycasterRef.current.intersectObject(planeRef.current)
          
          if (intersect.length > 0) {
            const pos = intersect[0].point
            selectedObjectRef.current.position.set(
              pos.x,
              selectedObjectRef.current.position.y,
              pos.z
            )
          }
        }
      }

      previousMouse = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = (e) => {
      if (isDraggingRef.current && selectedObjectRef.current) {
        const id = selectedObjectRef.current.userData.id
        const pos = selectedObjectRef.current.position
        setCustomPositions(prev => ({
          ...prev,
          [id]: { x: pos.x, y: pos.y, z: pos.z }
        }))
        setEditingId(null)
      }

      isDraggingRef.current = false
      isRotating = false
      selectedObjectRef.current = null
      canvasRef.current.style.cursor = 'grab'
    }

    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 1.1 : 0.9
      cameraRef.current.position.multiplyScalar(delta)
      const dist = cameraRef.current.position.length()
      if (dist < 5) cameraRef.current.position.setLength(5)
      if (dist > 30) cameraRef.current.position.setLength(30)
    }

    const handleContextMenu = (e) => {
      e.preventDefault()
      return false
    }

    const domElement = renderer.domElement
    domElement.addEventListener('mousedown', handleMouseDown)
    domElement.addEventListener('mousemove', handleMouseMove)
    domElement.addEventListener('mouseup', handleMouseUp)
    domElement.addEventListener('wheel', handleWheel, { passive: false })
    domElement.addEventListener('contextmenu', handleContextMenu)

    const animate = () => {
      requestAnimationFrame(animate)
      sensorsRef.current.forEach((g, i) => {
        const glow = g.children[1]
        if (glow) {
          glow.rotation.y += 0.01
          const scale = 1 + Math.sin(Date.now() * 0.002 + i) * 0.1
          glow.scale.set(scale, scale, scale)
        }
      })
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      const w = canvasRef.current.clientWidth
      const h = canvasRef.current.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      domElement.removeEventListener('mousedown', handleMouseDown)
      domElement.removeEventListener('mousemove', handleMouseMove)
      domElement.removeEventListener('mouseup', handleMouseUp)
      domElement.removeEventListener('wheel', handleWheel)
      domElement.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  useEffect(() => {
    if (!sceneRef.current) return
    const scene = sceneRef.current

    // Lampengruppe entfernen falls vorhanden
    const existingLamp = scene.getObjectByName('lampGroup')
    if (existingLamp) scene.remove(existingLamp)

    // Lampengruppe IMMER hinzufügen
    const lampGroup = new THREE.Group()
    lampGroup.name = 'lampGroup'
    lampGroup.position.set(0, 5, 0)

    // Lampen-Aufhängung (Kabel/Stab)
    const hookGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16)
    const hookMat = new THREE.MeshPhongMaterial({ color: 0x333333 })
    const hook = new THREE.Mesh(hookGeom, hookMat)
    hook.position.y = -0.15
    lampGroup.add(hook)

    // Lampen-Gehäuse (Zylinder oben)
    const casing1Geom = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32)
    const casingMat = new THREE.MeshPhongMaterial({ color: 0x222222 })
    const casing1 = new THREE.Mesh(casing1Geom, casingMat)
    casing1.position.y = -0.35
    lampGroup.add(casing1)

    // Lampen-Schirm (Kegel)
    const shadeGeom = new THREE.ConeGeometry(0.25, 0.4, 32)
    const shadeMat = new THREE.MeshPhongMaterial({ color: 0x444444, emissive: 0x222222 })
    const shade = new THREE.Mesh(shadeGeom, shadeMat)
    shade.position.y = -0.5
    lampGroup.add(shade)

    // Leuchtmittel (Glühbirne innen)
    const bulbGeom = new THREE.SphereGeometry(0.15, 16, 16)
    const bulbMat = new THREE.MeshPhongMaterial({
      color: lightState ? 0xffff99 : 0x666666,
      emissive: lightState ? 0xffff99 : 0x000000,
      emissiveIntensity: lightState ? 0.8 : 0
    })
    const bulb = new THREE.Mesh(bulbGeom, bulbMat)
    bulb.position.y = -0.8
    lampGroup.add(bulb)

    // Lichtstrahlung NUR wenn An
    if (lightState) {
      const light = new THREE.PointLight(0xffff99, 2, 25)
      light.position.set(0, -0.35, 0)
      light.name = 'roomLight'
      lampGroup.add(light)
    }

    scene.add(lampGroup)

    const bgColor = isDaytime ? 0x87ceeb : 0x0a0e27
    scene.background = new THREE.Color(bgColor)

    const ambientLight = scene.children.find(c => c instanceof THREE.AmbientLight)
    if (ambientLight) {
      ambientLight.intensity = isDaytime ? 1.8 : 0.4
    }
  }, [lightState, isDaytime])

  useEffect(() => {
    if (!sceneRef.current) return
    const scene = sceneRef.current

    sensorsRef.current.forEach(group => {
      if (!sensors.find(s => s.id === group.userData.id)) {
        scene.remove(group)
      }
    })
    sensorsRef.current = sensorsRef.current.filter(group =>
      sensors.find(s => s.id === group.userData.id)
    )

    sensors.forEach(sensor => {
      let group = sensorsRef.current.find(g => g.userData.id === sensor.id)
      const isEditing = editingId === sensor.id
      const color = isEditing ? 0x000000 : getColorByValue(sensor.value, sensor)

      if (!group) {
        group = new THREE.Group()
        group.userData.id = sensor.id

        const geometry = new THREE.SphereGeometry(0.3, 32, 32)
        const mat = new THREE.MeshPhongMaterial({
          color, emissive: color, emissiveIntensity: 0.5,
          transparent: true, opacity: 0.9,
        })
        const sphere = new THREE.Mesh(geometry, mat)
        group.add(sphere)

        const glowGeom = new THREE.SphereGeometry(0.5, 32, 32)
        const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2 })
        const glow = new THREE.Mesh(glowGeom, glowMat)
        group.add(glow)

        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 128
        const ctx = canvas.getContext('2d')
        updateLabel(ctx, sensor)
        const texture = new THREE.CanvasTexture(canvas)
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true })
        const sprite = new THREE.Sprite(spriteMat)
        sprite.scale.set(2, 1, 1)
        sprite.position.set(0, 0.8, 0)
        group.add(sprite)

        group.position.set(sensor.position.x, sensor.position.y, sensor.position.z)
        scene.add(group)
        sensorsRef.current.push(group)
      } else {
        const sphere = group.children[0]
        sphere.material.color.set(color)
        sphere.material.emissive.set(color)
        const glow = group.children[1]
        glow.material.color.set(color)

        const sprite = group.children.find(c => c.isSprite)
        const ctx = sprite.material.map.image.getContext('2d')
        ctx.clearRect(0, 0, 256, 128)
        updateLabel(ctx, sensor)
        sprite.material.map.needsUpdate = true

        group.position.set(sensor.position.x, sensor.position.y, sensor.position.z)
      }
    })
  }, [sensors, editingId])

  const updateLabel = (ctx, sensor) => {
    ctx.fillStyle = '#ffffff'
    ctx.font = 'Bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(sensor.name.split(' ').slice(0, 3).join(' '), 128, 40)
    ctx.fillText(`${sensor.value.toFixed(1)}${sensor.unit}`, 128, 80)
  }

  return (
    <Container>
      <Header>
        <TitleSection>
          <FaTemperatureHigh size={28} />
          <div>
            <Title>3D Room Heatmap</Title>
            <Subtitle>{currentRoom || 'Kein Raum gewählt'}</Subtitle>
          </div>
        </TitleSection>
        <RightHeader>
          <LightToggle active={lightState} onClick={() => setLightState(!lightState)}>
            {lightState ? '💡 AN' : '🔦 AUS'}
          </LightToggle>
          
          <DaytimeToggle active={isDaytime} onClick={() => setIsDaytime(!isDaytime)}>
            {isDaytime ? '☀️' : '🌙'}
          </DaytimeToggle>

          <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="all">All</option>
            <option value="temperature">Temperature</option>
            <option value="humidity">Humidity</option>
            <option value="dewpoint">Dewpoint</option>
          </Select>

          <SaveButton onClick={savePositions}>
            <FaSave /> SAVE
          </SaveButton>
        </RightHeader>
      </Header>

      {savedMessage && <SavedNotification>{savedMessage}</SavedNotification>}

      <CanvasContainer ref={canvasRef} $isFullscreen={isFullscreen} />

      <Controls>
        <ControlItem>Links ziehen = Raum drehen</ControlItem>
        <ControlItem>Doppelklick auf Sensor + ziehen = Sensor verschieben (wird schwarz)</ControlItem>
        <ControlItem>Shift + ziehen = Höhe ändern</ControlItem>
        <ControlItem>Mausrad = Zoom</ControlItem>
      </Controls>

      <Legend>
        <LegendTitle>LEGENDE: ({selectedType})</LegendTitle>
        <LegendItems>
          <LegendItem><LegendColor color="#3b82f6" /><span>KALT / NIEDRIG</span></LegendItem>
          <LegendItem><LegendColor color="#22c55e" /><span>MITTEL</span></LegendItem>
          <LegendItem><LegendColor color="#f97316" /><span>WARM / HOCH</span></LegendItem>
          <LegendItem><LegendColor color="#ef4444" /><span>SEHR HOCH</span></LegendItem>
        </LegendItems>
      </Legend>

      <SensorList>
        <SensorListTitle>Sensoren ({sensors.length})</SensorListTitle>
        {sensors.map((sensor) => {
          const colorValue = getColorByValue(sensor.value, sensor)
          const hexColor = colorValue ? `#${colorValue.toString(16).padStart(6, '0')}` : '#ffffff'
          const displayColor = editingId === sensor.id ? '#000000' : hexColor
          
          return (
            <SensorCard
              key={sensor.id}
              color={displayColor}
            >
              <SensorName>{sensor.name}</SensorName>
              <SensorValue>{sensor.value.toFixed(1)}{sensor.unit}</SensorValue>
              {sensor.labelPosKey && <LabelTag>{sensor.labelPosKey}</LabelTag>}
              {editingId === sensor.id && <EditingBadge>BEARBEITUNG</EditingBadge>}
            </SensorCard>
          )
        })}
      </SensorList>
    </Container>
  )
}

const Container = styled.div`
  border: 1px solid var(--secondary-accent);
  border-radius: 20px;
  background: var(--main-bg-card-color);
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-width: 1200px;
  color: white;
  position: relative;
`

const SavedNotification = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: #22c55e;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  animation: fadeInOut 2s ease-in-out;
  z-index: 10;

  @keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateY(-10px); }
    20%, 80% { opacity: 1; transform: translateY(0); }
  }
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

const RightHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.2);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all .2s ease;
  &:hover { background: rgba(255,255,255,0.3); }
`

const SaveButton = styled.button`
  background: #22c55e;
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all .3s ease;
  &:hover { background: #16a34a; transform: scale(1.05); }
`

const LightToggle = styled.button`
  background: ${props => props.active ? '#fbbf24' : 'rgba(255,255,255,0.2)'};
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all .3s ease;
  &:hover { background: ${props => props.active ? '#f59e0b' : 'rgba(255,255,255,0.3)'}; }
`

const DaytimeToggle = styled.button`
  background: ${props => props.active ? '#60a5fa' : '#1a1a2e'};
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: all .3s ease;
  &:hover { transform: scale(1.1); }
`

const CanvasContainer = styled.div`
  width: 100%;
  height: ${props => props.$isFullscreen ? '80vh' : '500px'};
  border-radius: 15px;
  overflow: hidden;
  background: rgba(0,0,0,0.2);
  margin-bottom: 20px;
  cursor: grab;
  &:active { cursor: grabbing; }
`

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
  font-size: 14px;
  opacity: 0.9;
`

const ControlItem = styled.div`
  background: rgba(255,255,255,0.1);
  padding: 6px 12px;
  border-radius: 8px;
  backdrop-filter: blur(5px);
`

const Legend = styled.div`
  background: rgba(255,255,255,0.1);
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
  background: rgba(255,255,255,0.1);
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
  background: rgba(0,0,0,0.2);
  border-left: 4px solid ${props => props.color};
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  transition: all .2s ease;
`

const SensorName = styled.div`
  font-weight: 500;
  font-size: 14px;
  flex: 1;
`

const SensorValue = styled.div`
  font-weight: 600;
  font-size: 14px;
  background: rgba(255,255,255,0.1);
  padding: 4px 10px;
  border-radius: 6px;
`

const LabelTag = styled.span`
  font-size: 10px;
  background: rgba(255,255,255,0.2);
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0.8;
`

const EditingBadge = styled.span`
  font-size: 10px;
  background: #000000;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  animation: pulse 1s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`

export default HeatMap