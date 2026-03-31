import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'

// Styled Components
const ToolsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`

const ToolCardWrapper = styled.div`
  padding: 1.5rem;
  background: var(--glass-bg-secondary);
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-accent);
    background: rgba(42, 157, 143, 0.1);
  }
`

const ToolIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  color: var(--primary-accent);
`

const ToolTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
`

const ToolDescription = styled.p`
  margin: 0;
  opacity: 0.7;
  font-size: 0.85rem;
`

const StatBanner = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: var(--glass-bg-secondary);
  border-radius: 8px;
  margin-bottom: 1.5rem;
`

const StatItem = styled.div`
  text-align: center;
`

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-accent);
  margin-bottom: 0.25rem;
`

const StatLabel = styled.div`
  font-size: 0.85rem;
  opacity: 0.7;
`

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--glass-bg-secondary);
  border-radius: 6px;
  margin-bottom: 1rem;
`

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: var(--main-text-color);
  font-size: 0.9rem;

  &:focus {
    outline: none;
  }

  &::placeholder {
    opacity: 0.5;
  }
`

const DeviceList = styled.div`
  max-height: 500px;
  overflow-y: auto;
`

const DeviceCard = styled.div`
  padding: 1rem;
  background: var(--glass-bg-secondary);
  border-radius: 8px;
  margin-bottom: 0.75rem;
  border: 1px solid var(--glass-border);
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`

const DeviceIcon = styled.div`
  font-size: 1.5rem;
  color: var(--primary-accent);
`

const DeviceTitle = styled.div`
  flex: 1;
  font-weight: 500;
  font-size: 1rem;
`

const CardBody = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  font-size: 0.85rem;
`

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
`

const DetailLabel = styled.span`
  opacity: 0.7;
`

const DetailValue = styled.span`
  font-weight: 500;
`

const EditRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex: 1;
`

const EditInput = styled.input`
  flex: 1;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  border: 1px solid var(--glass-border);
  background: var(--main-bg-card-color);
  color: var(--main-text-color);
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
  }
`

const IconButton = styled.button`
  padding: 0.4rem;
  border: none;
  background: var(--glass-bg-secondary);
  color: var(--main-text-color);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: var(--primary-accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  opacity: 0.5;
`

const ErrorBanner = styled.div`
  padding: 0.75rem;
  background: rgba(231, 76, 60, 0.2);
  border-radius: 6px;
  margin-bottom: 1rem;
  color: #e74c3c;
  font-size: 0.9rem;
`

const SuccessBanner = styled.div`
  padding: 0.75rem;
  background: rgba(39, 174, 96, 0.2);
  border-radius: 6px;
  margin-bottom: 1rem;
  color: #27ae60;
  font-size: 0.9rem;
`

const LabelsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const LabelChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--primary-accent);
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
`

const NoLabels = styled.div`
  font-size: 0.85rem;
  opacity: 0.5;
`

const DomainSelect = styled.select`
  padding: 0.75rem;
  background: var(--glass-bg-secondary);
  border: none;
  border-radius: 6px;
  color: var(--main-text-color);
  font-size: 0.9rem;
  cursor: pointer;

  &:focus {
    outline: none;
  }
`

const FilterBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const EntityList = styled.div`
  max-height: 500px;
  overflow-y: auto;
`

const EntityCard = styled.div`
  padding: 1rem;
  background: var(--glass-bg-secondary);
  border-radius: 8px;
  margin-bottom: 0.75rem;
  border: 1px solid var(--glass-border);
`

const EntityDomainIcon = styled.code`
  padding: 0.25rem 0.5rem;
  background: rgba(42, 157, 143, 0.2);
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--primary-accent);
  flex-shrink: 0;
`

const EntityTitle = styled.div`
  flex: 1;
  font-weight: 500;
  font-size: 1rem;
`

const LabelEditor = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.75rem;
`

const LabelInput = styled.input`
  flex: 1;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  border: 1px solid var(--glass-border);
  background: var(--main-bg-card-color);
  color: var(--main-text-color);
  font-size: 0.85rem;

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
  }
`

const LabelRemove = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    opacity: 0.7;
  }
`

const LabelsGridSection = styled.div`
  margin-bottom: 1.5rem;
`

const LabelsGridTitle = styled.div`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1rem;
`

const LabelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
`

const LabelStatCard = styled.div`
  padding: 0.5rem 1rem;
  background: var(--glass-bg-secondary);
  border-radius: 6px;
  border: 1px solid var(--glass-border);
`

const ListModeSwitch = styled.div`
  display: inline-flex;
  gap: 0.35rem;
  margin-bottom: 1rem;
  padding: 0.25rem;
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  background: var(--glass-bg-secondary);
`

const ListModeButton = styled.button`
  border: none;
  border-radius: 8px;
  padding: 0.45rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--main-text-color);
  background: ${(props) => (props.$active ? 'var(--primary-accent)' : 'transparent')};
  cursor: pointer;

  &:hover {
    background: ${(props) => (props.$active ? 'var(--primary-accent)' : 'var(--glass-bg-primary)')};
  }
`

const SuggestionsTable = styled.div`
  background: var(--glass-bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  max-height: 500px;
  overflow-y: auto;
`

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 1.2fr 1.2fr 1.2fr 0.9fr 0.4fr;
  gap: 1rem;
  padding: 1rem;
  background: rgba(42, 157, 143, 0.1);
  font-weight: 600;
  font-size: 0.9rem;
`

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 1.2fr 1.2fr 1.2fr 0.9fr 0.4fr;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--glass-border);
  font-size: 0.85rem;

  &:hover {
    background: rgba(42, 157, 143, 0.05);
  }
`

const TableCell = styled.div`
  display: flex;
  align-items: center;
`

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`

const LowConfidence = styled.span`
  padding: 0.1rem 0.3rem;
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  border-radius: 3px;
  font-size: 0.7rem;
  margin-left: 0.5rem;
`

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary-accent);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const AutoActionsBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

const AutoHeroCard = styled.div`
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  background: linear-gradient(135deg, rgba(42, 157, 143, 0.16), rgba(15, 72, 104, 0.14));
  margin-bottom: 1rem;
`

const AutoHint = styled.div`
  font-size: 0.85rem;
  opacity: 0.88;
  margin-top: 0.35rem;
`

const AutoStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.6rem;
  margin-bottom: 1rem;
`

const AutoStatCard = styled.div`
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg-secondary);
`

const AutoStatValue = styled.div`
  font-weight: 700;
  font-size: 1.05rem;
`

const AutoStatLabel = styled.div`
  font-size: 0.75rem;
  opacity: 0.7;
`

const AutoFilters = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 0.9fr 0.9fr 0.9fr;
  gap: 0.6rem;
  margin-bottom: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const AutoSelect = styled.select`
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg-secondary);
  color: var(--main-text-color);

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
  }
`

const SuggestionCard = styled.div`
  padding: 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg-secondary);
  margin-bottom: 0.6rem;
`

const SuggestionTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 0.55rem;
`

const SuggestionTitle = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
`

const SuggestionSub = styled.div`
  font-size: 0.78rem;
  opacity: 0.7;
  margin-top: 0.2rem;
`

const SuggestionBadges = styled.div`
  display: inline-flex;
  gap: 0.35rem;
  flex-wrap: wrap;
`

const TinyBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.45rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${(props) => props.$bg || 'var(--glass-bg-primary)'};
  color: ${(props) => props.$color || 'var(--main-text-color)'};
`

const SuggestionRow = styled.div`
  display: grid;
  grid-template-columns: 0.9fr 1.1fr 0.5fr;
  gap: 0.6rem;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const LabelLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`

const SafePreviewCard = styled.div`
  padding: 0.9rem;
  border-radius: 10px;
  border: 1px solid rgba(39, 174, 96, 0.4);
  background: rgba(39, 174, 96, 0.1);
  margin-bottom: 1rem;
`

const SafePreviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
`

const SafePreviewTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
`

const SafePreviewList = styled.div`
  max-height: 220px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg-secondary);
  margin-bottom: 0.75rem;
`

const SafePreviewRow = styled.div`
  padding: 0.55rem 0.7rem;
  border-top: 1px solid var(--glass-border);
  font-size: 0.82rem;

  &:first-child {
    border-top: none;
  }
`

// Main Factory Function
export const createSetupStepComponents = ({ icons, styles, connection, currentRoom, haToken, haBaseUrl, haApiBaseUrl }) => {
  const {
    MdDevices,
    MdLabel,
    MdEdit,
    MdSave,
    MdSearch,
    MdClose,
    MdAutoAwesome,
    MdList,
    MdOutlineLabel,
    MdThermostat,
    MdLightMode,
    MdWindPower,
    MdRefresh
  } = icons
  const { StepContent } = styles

  // Helper functions using WebSocket API
  const updateDeviceName = async (deviceId, newName) => {
    if (!connection) {
      throw new Error('No Home Assistant connection available')
    }

    console.log('[Setup] Updating device:', deviceId, 'to:', newName, 'via WebSocket')

    // Try WebSocket device registry update first
    try {
      const response = await connection.sendMessagePromise({
        type: 'config/device_registry/update',
        device_id: deviceId,
        name_by_user: newName
      })

      console.log('[Setup] Device updated via WebSocket:', response)
      return response
    } catch (wsErr) {
      console.log('[Setup] WebSocket update failed:', wsErr.message)

      // Fallback: Update the device's entities' friendly_name
      const HASS = document.querySelector('home-assistant')?.hass
      const device = HASS?.devices?.[deviceId]

      if (!device) {
        throw new Error(`Device not found in Home Assistant: ${deviceId}`)
      }

      // Find all entities belonging to this device
      const deviceEntities = Object.entries(HASS.entities || {})
        .filter(([_, entity]) => entity.device_id === deviceId)

      if (deviceEntities.length === 0) {
        throw new Error('No entities found for this device')
      }

      console.log('[Setup] Updating', deviceEntities.length, 'entities as fallback')

      // Update entity names with the new device name
      for (const [entityId] of deviceEntities) {
        try {
          await connection.sendMessagePromise({
            type: 'config/entity_registry/update',
            entity_id: entityId,
            name: newName
          })
        } catch (entityErr) {
          console.log('[Setup] Entity update failed:', entityId, entityErr.message)
        }
      }

      return { success: true, message: 'Updated entity names as fallback' }
    }
  }

  const updateEntityName = async (entityId, newName) => {
    if (!connection) {
      throw new Error('No Home Assistant connection available')
    }

    console.log('[Setup] Updating entity:', entityId, 'to:', newName, 'via WebSocket')

    const response = await connection.sendMessagePromise({
      type: 'config/entity_registry/update',
      entity_id: entityId,
      name: newName
    })

    console.log('[Setup] Entity updated:', response)
    return response
  }

  const updateEntityLabels = async (entityId, labels) => {
    if (!connection) {
      throw new Error('No Home Assistant connection available')
    }

    console.log('[Setup] Updating labels for:', entityId, 'labels:', labels, 'via WebSocket')

    const response = await connection.sendMessagePromise({
      type: 'config/entity_registry/update',
      entity_id: entityId,
      labels: labels
    })

    console.log('[Setup] Labels updated:', response)
    return response
  }

  const updateDeviceLabels = async (deviceId, labels) => {
    if (!connection) {
      throw new Error('No Home Assistant connection available')
    }

    console.log('[Setup] Updating device labels for:', deviceId, 'labels:', labels, 'via WebSocket')

    const response = await connection.sendMessagePromise({
      type: 'config/device_registry/update',
      device_id: deviceId,
      labels: labels
    })

    console.log('[Setup] Device labels updated:', response)
    return response
  }

  const generateSuggestedName = (entity) => {
    const entityId = entity.entity_id || ''
    const domain = entityId.split('.')[0] || ''
    const suffix = entityId.split('.').slice(1).join('.') || ''
    const lowerSuffix = suffix.toLowerCase()
    
    if (lowerSuffix.includes('temp') || lowerSuffix.includes('temperature')) {
      return 'Temperature Sensor'
    }
    if (lowerSuffix.includes('humid') || lowerSuffix.includes('humidity')) {
      return 'Humidity Sensor'
    }
    if (lowerSuffix.includes('co2') || lowerSuffix.includes('carbon')) {
      return 'CO2 Sensor'
    }
    if (domain === 'light' || lowerSuffix.includes('light') || lowerSuffix.includes('lamp')) {
      if (lowerSuffix.includes('grow')) return 'Grow Light'
      if (lowerSuffix.includes('uv')) return 'UV Light'
      return 'Light'
    }
    if (domain === 'fan' || lowerSuffix.includes('fan') || lowerSuffix.includes('ventil')) {
      if (lowerSuffix.includes('exhaust')) return 'Exhaust Fan'
      if (lowerSuffix.includes('intake')) return 'Intake Fan'
      return 'Fan'
    }
    if (domain === 'switch') {
      if (lowerSuffix.includes('pump')) return 'Water Pump'
      if (lowerSuffix.includes('heater')) return 'Heater'
      if (lowerSuffix.includes('humidifier')) return 'Humidifier'
    }
    
    const words = suffix.split('_').filter(w => w.length > 0)
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const getDevicesByRoom = (room, includeOGB = false) => {
    const HASS = document.querySelector('home-assistant')?.hass
    if (!HASS?.devices) return []

    console.log('[Setup] Room:', room, 'Total devices:', Object.keys(HASS.devices).length)

    const filtered = Object.entries(HASS.devices)
      .filter(([_, device]) => {
        const manufacturer = (device.manufacturer || '').toLowerCase()
        const inRoom = device.area_id === room.toLowerCase()
        const isOGB = manufacturer === 'opengrowbox'

        if (!inRoom) return false
        if (!includeOGB && isOGB) {
          console.log('[Setup] Filtered (OpenGrowBox):', device.name_by_user || device.name)
          return false
        }
        return true
      })
      .map(([id, device]) => {
        console.log('[Setup] Device found:', id, device.name_by_user || device.name, 'ID type:', typeof id)
        return { id, ...device }
      })

    console.log('[Setup] Found devices:', filtered.length)
    return filtered
  }

  const getEntitiesByRoom = (room, includeOGB = false) => {
    const HASS = document.querySelector('home-assistant')?.hass
    if (!HASS?.devices || !HASS?.entities) return []

    console.log('[Setup] Getting entities for room:', room)

    const roomDeviceIds = Object.entries(HASS.devices)
      .filter(([_, device]) => {
        const manufacturer = (device.manufacturer || '').toLowerCase()
        const inRoom = device.area_id === room.toLowerCase()
        const isOGB = manufacturer === 'opengrowbox'

        if (!inRoom) return false
        if (!includeOGB && isOGB) return false
        return true
      })
      .map(([id]) => id)

    console.log('[Setup] Room device IDs:', roomDeviceIds.length)

    const entities = Object.entries(HASS.entities)
      .filter(([_, entity]) => roomDeviceIds.includes(entity.device_id))
      .map(([id, entity]) => {
        const sourceDevice = HASS.devices[entity.device_id]
        const deviceName = sourceDevice?.name_by_user || sourceDevice?.name || entity.device_id || 'Unknown device'
        console.log('[Setup] Entity found:', id, entity.attributes?.friendly_name || entity.entity_id, 'device_id:', entity.device_id, 'device_name:', deviceName)
        return { id, ...entity, device_name: deviceName }
      })

    console.log('[Setup] Found entities:', entities.length)
    return entities
  }

  const getAllLabels = () => {
    const HASS = document.querySelector('home-assistant')?.hass
    if (!HASS?.entities) return {}
    
    const labelCounts = {}
    
    Object.entries(HASS.entities).forEach(([_, entity]) => {
      const labels = entity.attributes?.labels || []
      labels.forEach(label => {
        labelCounts[label] = (labelCounts[label] || 0) + 1
      })
    })
    
    return labelCounts
  }

  const getIconForDomain = (domain) => {
    const iconMap = {
      'sensor': <MdThermostat />,
      'light': <MdLightMode />,
      'switch': <MdOutlineLabel />,
      'fan': <MdWindPower />,
      'climate': <MdThermostat />,
      'binary_sensor': <MdOutlineLabel />,
    }
    return iconMap[domain] || <MdOutlineLabel />
  }

  // Step Components
  const SetupWelcomeStep = ({ data, updateData, nextStep }) => {
    const selectTool = (tool) => {
      updateData({ selectedSetupTool: tool })
      nextStep()
    }

    const ToolCard = ({ tool, title, description, icon }) => (
      <ToolCardWrapper onClick={() => selectTool(tool)}>
        <ToolIcon>{icon}</ToolIcon>
        <ToolTitle>{title}</ToolTitle>
        <ToolDescription>{description}</ToolDescription>
      </ToolCardWrapper>
    )

    return (
      <StepContent>
        <h3>Setup Tools</h3>
        <p>Select a tool to manage your OpenGrowBox devices and entities:</p>
        <ToolsGrid>
          <ToolCard 
            tool="deviceManager" 
            title="Device Manager" 
            description="View, edit, and auto-name devices"
            icon={<MdDevices />}
          />
          <ToolCard 
            tool="entityManager" 
            title="Entity Manager" 
            description="Manage entity names and attributes"
            icon={<MdList />}
          />
          <ToolCard 
            tool="labelManager" 
            title="Label Manager" 
            description="Add and manage labels for organization"
            icon={<MdLabel />}
          />
          <ToolCard 
            tool="autoSetup" 
            title="Auto Setup" 
            description="Auto-generate logical names for devices"
            icon={<MdAutoAwesome />}
          />
        </ToolsGrid>
      </StepContent>
    )
  }

  const DeviceManagerStep = ({ data, updateData }) => {
    const [devices, setDevices] = useState([])
    const [allDevices, setAllDevices] = useState([])
    const [filterText, setFilterText] = useState('')
    const [editingDevice, setEditingDevice] = useState(null)
    const [editValue, setEditValue] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const isEditingRef = useRef(false)  // Track if user is currently editing
    const editValueRef = useRef('')  // Persist edit value during reloads

    const loadDevices = () => {
      setIsLoading(true)
      
      const roomDevices = getDevicesByRoom(currentRoom)
      const allRoomDevices = getDevicesByRoom(currentRoom, true)
      setDevices(roomDevices)
      setAllDevices(allRoomDevices)
      
      setIsLoading(false)
    }

    const handleRefresh = () => {
      isEditingRef.current = false
      setEditingDevice(null)
      editValueRef.current = ''
      setRefreshKey(prev => prev + 1)
      loadDevices()
    }

    // Load devices on mount and after save/refresh
    useEffect(() => {
      loadDevices()
    }, [])

    const handleEdit = (device) => {
      isEditingRef.current = true
      setEditingDevice(device.id)
      editValueRef.current = device.name_by_user || device.name || ''
      setEditValue(editValueRef.current)
    }

    const handleSave = async (deviceId) => {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      try {
        await updateDeviceName(deviceId, editValueRef.current)
        setSuccess('Device name updated successfully')
        isEditingRef.current = false
        editValueRef.current = ''
        loadDevices()
        setEditingDevice(null)
        setEditValue('')
      } catch (e) {
        setError(e.message)
      }
      
      setSaving(false)
      setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 3000)
    }

    const handleCancel = () => {
      isEditingRef.current = false
      editValueRef.current = ''
      setEditingDevice(null)
      setEditValue('')
    }

    const filteredDevices = devices.filter(device => {
      const searchLower = filterText.toLowerCase()
      const name = (device.name_by_user || device.name || '').toLowerCase()
      const manufacturer = (device.manufacturer || '').toLowerCase()
      return name.includes(searchLower) || manufacturer.includes(searchLower)
    })

    return (
      <StepContent>
        <h3>Device Manager</h3>
        <p>Manage devices in room: <strong>{currentRoom}</strong></p>

        {error && <ErrorBanner>{error}</ErrorBanner>}
        {success && <SuccessBanner>{success}</SuccessBanner>}

        <StatBanner>
          <StatItem>
            <StatValue>{devices.length}</StatValue>
            <StatLabel>Devices</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{allDevices.length}</StatValue>
            <StatLabel>Total (incl. OGB)</StatLabel>
          </StatItem>
          <StatItem>
            <IconButton onClick={handleRefresh} title="Refresh devices">
              <MdRefresh />
            </IconButton>
          </StatItem>
        </StatBanner>

        <SearchBar>
          <MdSearch />
          <SearchInput
            type="text"
            placeholder="Search devices..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </SearchBar>

        <DeviceList>
          {filteredDevices.length === 0 ? (
            <EmptyState>
              {allDevices.length === 0 
                ? 'No devices found in this room'
                : `All ${allDevices.length} devices are OpenGrowBox devices and are filtered out.`}
            </EmptyState>
          ) : (
            filteredDevices.map(device => (
              <DeviceCard key={device.id}>
                <CardHeader>
                  <DeviceIcon><MdDevices /></DeviceIcon>
                  <DeviceTitle>
                    {editingDevice === device.id ? (
                      <EditRow>
                        <EditInput
                          type="text"
                          value={editValue}
                          onChange={(e) => { editValueRef.current = e.target.value; setEditValue(e.target.value) }}
                          onKeyPress={(e) => e.key === 'Enter' && handleSave(device.id)}
                        />
                        <IconButton onClick={() => handleSave(device.id)} disabled={saving}>
                          <MdSave />
                        </IconButton>
                        <IconButton onClick={handleCancel}>
                          <MdClose />
                        </IconButton>
                      </EditRow>
                    ) : (
                      <>
                        {device.name_by_user || device.name}
                        <IconButton onClick={() => handleEdit(device)}>
                          <MdEdit />
                        </IconButton>
                      </>
                    )}
                  </DeviceTitle>
                </CardHeader>

                <CardBody>
                  <DetailRow>
                    <DetailLabel>Manufacturer:</DetailLabel>
                    <DetailValue>{device.manufacturer || 'N/A'}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Model:</DetailLabel>
                    <DetailValue>{device.model || 'N/A'}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Area:</DetailLabel>
                    <DetailValue>{device.area_id || 'N/A'}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>ID:</DetailLabel>
                    <DetailValue>{device.id}</DetailValue>
                  </DetailRow>
                </CardBody>
              </DeviceCard>
            ))
          )}
        </DeviceList>
      </StepContent>
    )
  }

  const EntityManagerStep = ({ data, updateData }) => {
    const [entities, setEntities] = useState([])
    const [allEntities, setAllEntities] = useState([])
    const [filterText, setFilterText] = useState('')
    const [domainFilter, setDomainFilter] = useState('all')
    const [editingEntity, setEditingEntity] = useState(null)
    const [editValue, setEditValue] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const isEditingRef = useRef(false)  // Track if user is currently editing
    const editValueRef = useRef('')  // Persist edit value during reloads

    const loadEntities = () => {
      setIsLoading(true)
      
      const roomEntities = getEntitiesByRoom(currentRoom)
      const allRoomEntities = getEntitiesByRoom(currentRoom, true)
      setEntities(roomEntities)
      setAllEntities(allRoomEntities)
      
      setIsLoading(false)
    }

    const handleRefresh = () => {
      isEditingRef.current = false
      setEditingEntity(null)
      editValueRef.current = ''
      setRefreshKey(prev => prev + 1)
      loadEntities()
    }

    // Load entities on mount and after save/refresh
    useEffect(() => {
      loadEntities()
    }, [])

    const handleEdit = (entity) => {
      isEditingRef.current = true
      setEditingEntity(entity.entity_id)
      editValueRef.current = entity.attributes?.friendly_name || entity.entity_id
      setEditValue(editValueRef.current)
    }

    const handleSave = async (entityId) => {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      try {
        await updateEntityName(entityId, editValueRef.current)
        setSuccess('Entity name updated successfully')
        isEditingRef.current = false
        editValueRef.current = ''
        loadEntities()
        setEditingEntity(null)
        setEditValue('')
      } catch (e) {
        setError(e.message)
      }
      
      setSaving(false)
      setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 3000)
    }

    const handleCancel = () => {
      isEditingRef.current = false
      editValueRef.current = ''
      setEditingEntity(null)
      setEditValue('')
    }

    const domains = ['all', ...new Set(allEntities.map((entity) => entity.entity_id.split('.')[0]))]

    const filteredEntities = entities.filter(entity => {
      const domain = entity.entity_id.split('.')[0]
      if (domainFilter !== 'all' && domain !== domainFilter) return false

      const searchLower = filterText.toLowerCase()
      const name = (entity.attributes?.friendly_name || '').toLowerCase()
      const entityId = entity.entity_id.toLowerCase()
      const deviceName = (entity.device_name || '').toLowerCase()
      return name.includes(searchLower) || entityId.includes(searchLower) || deviceName.includes(searchLower)
    })

    return (
      <StepContent>
        <h3>Entity Manager</h3>
        <p>Manage entities in room: <strong>{currentRoom}</strong></p>

        {error && <ErrorBanner>{error}</ErrorBanner>}
        {success && <SuccessBanner>{success}</SuccessBanner>}

        <StatBanner>
          <StatItem>
            <StatValue>{entities.length}</StatValue>
            <StatLabel>Entities</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{allEntities.length}</StatValue>
            <StatLabel>Total (incl. OGB)</StatLabel>
          </StatItem>
          <StatItem>
            <IconButton onClick={handleRefresh} title="Refresh entities">
              <MdRefresh />
            </IconButton>
          </StatItem>
        </StatBanner>

        <FilterBar>
          <SearchBar>
            <MdSearch />
            <SearchInput
              type="text"
              placeholder="Search entities..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </SearchBar>

          <DomainSelect
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
          >
            <option value="all">All Domains</option>
            {domains.slice(1).map(domain => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </DomainSelect>
        </FilterBar>

        <EntityList>
          {filteredEntities.length === 0 ? (
            <EmptyState>
              {allEntities.length === 0 
                ? 'No entities found in this room'
                : `All ${allEntities.length} entities are from OpenGrowBox devices and are filtered out.`}
            </EmptyState>
          ) : (
            filteredEntities.map(entity => {
              const domain = entity.entity_id.split('.')[0]
              return (
                <EntityCard key={entity.entity_id}>
                  <CardHeader>
                    <EntityDomainIcon>{getIconForDomain(domain)}</EntityDomainIcon>
                    <EntityTitle>
                      {editingEntity === entity.entity_id ? (
                        <EditRow>
                          <EditInput
                            type="text"
                            value={editValue}
                            onChange={(e) => { editValueRef.current = e.target.value; setEditValue(e.target.value) }}
                            onKeyPress={(e) => e.key === 'Enter' && handleSave(entity.entity_id)}
                          />
                          <IconButton onClick={() => handleSave(entity.entity_id)} disabled={saving}>
                            <MdSave />
                          </IconButton>
                          <IconButton onClick={handleCancel}>
                            <MdClose />
                          </IconButton>
                        </EditRow>
                      ) : (
                        <>
                          {entity.attributes?.friendly_name || entity.entity_id}
                          <IconButton onClick={() => handleEdit(entity)}>
                            <MdEdit />
                          </IconButton>
                        </>
                      )}
                    </EntityTitle>
                  </CardHeader>

                  <CardBody>
                    <DetailRow>
                      <DetailLabel>Device:</DetailLabel>
                      <DetailValue>{entity.device_name || entity.device_id || 'N/A'}</DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Entity ID:</DetailLabel>
                      <DetailValue>{entity.entity_id}</DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>State:</DetailLabel>
                      <DetailValue>{entity.state}</DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Labels:</DetailLabel>
                      <LabelsContainer>
                        {(entity.attributes?.labels || []).length === 0 ? (
                          <NoLabels>None</NoLabels>
                        ) : (
                          (entity.attributes?.labels || []).map(label => (
                            <LabelChip key={label}>{label}</LabelChip>
                          ))
                        )}
                      </LabelsContainer>
                    </DetailRow>
                  </CardBody>
                </EntityCard>
              )
            })
          )}
        </EntityList>
      </StepContent>
    )
  }

  const LabelManagerStep = ({ data, updateData }) => {
    const [labels, setLabels] = useState({})
    const [entities, setEntities] = useState([])
    const [devices, setDevices] = useState([])
    const [filterText, setFilterText] = useState('')
    const [editingTarget, setEditingTarget] = useState(null)
    const [newLabel, setNewLabel] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [listMode, setListMode] = useState('entities')
    const [isLoading, setIsLoading] = useState(false)
    const [labelNamesById, setLabelNamesById] = useState({})
    const [labelIdsByName, setLabelIdsByName] = useState({})
    const newLabelRef = useRef('')
    const labelNamesByIdRef = useRef({})
    const labelIdsByNameRef = useRef({})

    const normalizeLabels = (value) => (Array.isArray(value) ? value : [])

    const displayLabelName = (labelId) => labelNamesByIdRef.current[labelId] || labelId

    const getItemLabels = (item) => normalizeLabels(item.labels || item.label_ids || item.attributes?.labels || item.attributes?.label_ids)

    const computeLabelCounts = (entityItems, deviceItems) => {
      const counts = {}
      ;[...entityItems, ...deviceItems].forEach((item) => {
        getItemLabels(item).forEach((labelId) => {
          const labelName = displayLabelName(labelId)
          counts[labelName] = (counts[labelName] || 0) + 1
        })
      })
      return counts
    }

    const loadData = async () => {
      setIsLoading(true)
      try {
        const HASS = document.querySelector('home-assistant')?.hass
        const room = (currentRoom || '').toLowerCase()

        const [labelRegistry, entityRegistry, deviceRegistry] = await Promise.all([
          connection?.sendMessagePromise({ type: 'config/label_registry/list' }).catch(() => []),
          connection?.sendMessagePromise({ type: 'config/entity_registry/list' }).catch(() => []),
          connection?.sendMessagePromise({ type: 'config/device_registry/list' }).catch(() => []),
        ])

        const nextLabelNamesById = {}
        const nextLabelIdsByName = {}
        ;(labelRegistry || []).forEach((label) => {
          const id = label.label_id || label.id
          const name = label.name || id
          if (!id) return
          nextLabelNamesById[id] = name
          nextLabelIdsByName[name.toLowerCase()] = id
        })
        labelNamesByIdRef.current = nextLabelNamesById
        labelIdsByNameRef.current = nextLabelIdsByName
        setLabelNamesById(nextLabelNamesById)
        setLabelIdsByName(nextLabelIdsByName)

        const roomDevicesFromRegistry = (deviceRegistry || []).filter((device) => {
          if (device.area_id !== room) return false
          const manufacturer = (device.manufacturer || '').toLowerCase()
          return manufacturer !== 'opengrowbox'
        })
        const roomDeviceIds = new Set(roomDevicesFromRegistry.map((device) => device.id || device.device_id))

        const mergedDevices = roomDevicesFromRegistry.map((device) => {
          const hassDevice = HASS?.devices?.[device.id] || {}
          return {
            id: device.id,
            ...hassDevice,
            labels: normalizeLabels(device.labels || device.label_ids),
          }
        })

        const mergedEntities = (entityRegistry || [])
          .filter((entity) => roomDeviceIds.has(entity.device_id))
          .map((entity) => {
            const hassEntity = HASS?.entities?.[entity.entity_id] || {}
            const sourceDevice = roomDevicesFromRegistry.find((device) => (device.id || device.device_id) === entity.device_id) || HASS?.devices?.[entity.device_id] || {}
            return {
              ...hassEntity,
              entity_id: entity.entity_id,
              device_id: entity.device_id,
              labels: normalizeLabels(entity.labels || entity.label_ids),
              device_name: sourceDevice.name_by_user || sourceDevice.name || entity.device_id,
            }
          })

        const fallbackDevices = mergedDevices.length > 0 ? mergedDevices : getDevicesByRoom(currentRoom)
        const fallbackEntities = mergedEntities.length > 0 ? mergedEntities : getEntitiesByRoom(currentRoom)

        setDevices(fallbackDevices)
        setEntities(fallbackEntities)
        setLabels(computeLabelCounts(fallbackEntities, fallbackDevices))
      } catch (loadError) {
        console.error('[Setup] Label manager load failed:', loadError)
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    const ensureLabelId = async (labelName) => {
      const normalizedName = labelName.trim().toLowerCase()
      if (!normalizedName) return null
      if (labelIdsByNameRef.current[normalizedName]) {
        return labelIdsByNameRef.current[normalizedName]
      }

      if (!connection) {
        throw new Error('No Home Assistant connection available')
      }

      const created = await connection.sendMessagePromise({
        type: 'config/label_registry/create',
        name: labelName.trim(),
      })

      const id = created?.label_id || created?.id
      if (!id) {
        throw new Error('Label was created but no label ID was returned')
      }

      const nextNames = { ...labelNamesByIdRef.current, [id]: labelName.trim() }
      const nextIds = { ...labelIdsByNameRef.current, [normalizedName]: id }
      labelNamesByIdRef.current = nextNames
      labelIdsByNameRef.current = nextIds
      setLabelNamesById(nextNames)
      setLabelIdsByName(nextIds)

      return id
    }

    useEffect(() => {
      loadData()
    }, [])

    const handleRefresh = () => {
      setEditingTarget(null)
      newLabelRef.current = ''
      setNewLabel('')
      loadData()
    }

    const handleEditLabels = (targetType, targetId) => {
      setEditingTarget(`${targetType}:${targetId}`)
    }

    const handleUpdateLabels = async (targetType, targetId, updatedLabelIds) => {
      setSaving(true)
      setError(null)
      setSuccess(null)

      try {
        if (targetType === 'entity') {
          await updateEntityLabels(targetId, updatedLabelIds)
        } else {
          await updateDeviceLabels(targetId, updatedLabelIds)
        }
        setSuccess('Labels updated successfully')
        await loadData()
      } catch (updateError) {
        setError(updateError.message)
      }

      setSaving(false)
      setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 3000)
    }

    const handleAddLabel = async () => {
      if (!editingTarget) return
      const [targetType, targetId] = editingTarget.split(':')
      const labelValue = (newLabelRef.current || newLabel).trim()
      if (!labelValue) return

      const sourceItems = targetType === 'entity' ? entities : devices
      const sourceItem = sourceItems.find((item) => (targetType === 'entity' ? item.entity_id : item.id) === targetId)
      if (!sourceItem) return

      try {
        const labelId = await ensureLabelId(labelValue)
        const existingLabelIds = getItemLabels(sourceItem)
        if (!existingLabelIds.includes(labelId)) {
          await handleUpdateLabels(targetType, targetId, [...existingLabelIds, labelId])
        }
        newLabelRef.current = ''
        setNewLabel('')
      } catch (addError) {
        setError(addError.message)
      }
    }

    const handleRemoveLabel = async (targetType, targetId, labelIdToRemove) => {
      const sourceItems = targetType === 'entity' ? entities : devices
      const sourceItem = sourceItems.find((item) => (targetType === 'entity' ? item.entity_id : item.id) === targetId)
      if (!sourceItem) return
      const updatedLabelIds = getItemLabels(sourceItem).filter((labelId) => labelId !== labelIdToRemove)
      await handleUpdateLabels(targetType, targetId, updatedLabelIds)
    }

    const handleCancel = () => {
      setEditingTarget(null)
      newLabelRef.current = ''
      setNewLabel('')
    }

    const sortedLabels = Object.entries(labels).sort((a, b) => b[1] - a[1])
    const searchLower = filterText.toLowerCase()

    const filteredEntities = entities.filter((entity) => {
      const friendlyName = (entity.attributes?.friendly_name || '').toLowerCase()
      const entityId = (entity.entity_id || '').toLowerCase()
      const deviceName = (entity.device_name || '').toLowerCase()
      return friendlyName.includes(searchLower) || entityId.includes(searchLower) || deviceName.includes(searchLower)
    })

    const filteredDevices = devices.filter((device) => {
      const displayName = (device.name_by_user || device.name || '').toLowerCase()
      const deviceId = (device.id || '').toLowerCase()
      return displayName.includes(searchLower) || deviceId.includes(searchLower)
    })

    const visibleEntities = listMode === 'entities' ? filteredEntities : []
    const visibleDevices = listMode === 'devices' ? filteredDevices : []

    return (
      <StepContent>
        <h3>Label Manager</h3>
        <p>Manage labels for entities and devices in room: <strong>{currentRoom}</strong></p>

        {error && <ErrorBanner>{error}</ErrorBanner>}
        {success && <SuccessBanner>{success}</SuccessBanner>}

        <StatBanner>
          <StatItem>
            <StatValue>{Object.keys(labels).length}</StatValue>
            <StatLabel>Total Labels</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{Object.values(labels).reduce((a, b) => a + b, 0)}</StatValue>
            <StatLabel>Total Uses</StatLabel>
          </StatItem>
          <StatItem>
            <IconButton onClick={handleRefresh} title="Refresh labels">
              <MdRefresh />
            </IconButton>
          </StatItem>
        </StatBanner>

        {sortedLabels.length > 0 && (
          <LabelsGridSection>
            <LabelsGridTitle>All Labels</LabelsGridTitle>
            <LabelsGrid>
              {sortedLabels.map(([label, count]) => (
                <LabelStatCard key={label}>
                  <LabelChip>
                    {label}
                    <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>{count}x</span>
                  </LabelChip>
                </LabelStatCard>
              ))}
            </LabelsGrid>
          </LabelsGridSection>
        )}

        <SearchBar>
          <MdSearch />
          <SearchInput
            type="text"
            placeholder="Search entities and devices..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </SearchBar>

        <ListModeSwitch>
          <ListModeButton type="button" $active={listMode === 'entities'} onClick={() => setListMode('entities')}>
            Entities ({filteredEntities.length})
          </ListModeButton>
          <ListModeButton type="button" $active={listMode === 'devices'} onClick={() => setListMode('devices')}>
            Devices ({filteredDevices.length})
          </ListModeButton>
        </ListModeSwitch>

        {listMode === 'entities' && <LabelsGridTitle>Entities</LabelsGridTitle>}
        {listMode === 'entities' && (
        <EntityList>
          {visibleEntities.map((entity) => {
            const targetKey = `entity:${entity.entity_id}`
            const domain = entity.entity_id.split('.')[0]
            const entityLabels = getItemLabels(entity)
            return (
              <EntityCard key={entity.entity_id}>
                <CardHeader>
                  <EntityDomainIcon>{getIconForDomain(domain)}</EntityDomainIcon>
                  <EntityTitle>
                    {entity.attributes?.friendly_name || entity.entity_id}
                    <IconButton onClick={() => handleEditLabels('entity', entity.entity_id)}>
                      <MdEdit />
                    </IconButton>
                  </EntityTitle>
                </CardHeader>

                {editingTarget === targetKey ? (
                  <CardBody>
                    <LabelEditor>
                      <LabelInput
                        type="text"
                        placeholder="New label..."
                        value={newLabel}
                        onChange={(e) => { newLabelRef.current = e.target.value; setNewLabel(e.target.value) }}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                      />
                      <IconButton onClick={handleAddLabel} disabled={saving}>
                        <MdSave />
                      </IconButton>
                      <IconButton onClick={handleCancel}>
                        <MdClose />
                      </IconButton>
                    </LabelEditor>

                    <LabelsContainer>
                      {entityLabels.length === 0 ? (
                        <NoLabels>No labels yet</NoLabels>
                      ) : (
                        entityLabels.map((labelId) => (
                          <LabelChip key={labelId}>
                            {displayLabelName(labelId)}
                            <LabelRemove onClick={() => handleRemoveLabel('entity', entity.entity_id, labelId)}>
                              <MdClose />
                            </LabelRemove>
                          </LabelChip>
                        ))
                      )}
                    </LabelsContainer>
                  </CardBody>
                ) : (
                  <CardBody>
                    <DetailRow>
                      <DetailLabel>Device:</DetailLabel>
                      <DetailValue>{entity.device_name || entity.device_id || 'Unknown device'}</DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Entity ID:</DetailLabel>
                      <DetailValue>{entity.entity_id}</DetailValue>
                    </DetailRow>
                    <LabelsContainer>
                      {entityLabels.length === 0 ? (
                        <NoLabels>No labels</NoLabels>
                      ) : (
                        entityLabels.map((labelId) => (
                          <LabelChip key={labelId}>{displayLabelName(labelId)}</LabelChip>
                        ))
                      )}
                    </LabelsContainer>
                  </CardBody>
                )}
              </EntityCard>
            )
          })}
        </EntityList>
        )}

        {listMode === 'devices' && <LabelsGridTitle>Devices</LabelsGridTitle>}
        {listMode === 'devices' && (
        <EntityList>
          {visibleDevices.map((device) => {
            const targetKey = `device:${device.id}`
            const deviceLabels = getItemLabels(device)
            return (
              <EntityCard key={device.id}>
                <CardHeader>
                  <EntityDomainIcon><MdDevices /></EntityDomainIcon>
                  <EntityTitle>
                    {device.name_by_user || device.name || device.id}
                    <IconButton onClick={() => handleEditLabels('device', device.id)}>
                      <MdEdit />
                    </IconButton>
                  </EntityTitle>
                </CardHeader>

                {editingTarget === targetKey ? (
                  <CardBody>
                    <LabelEditor>
                      <LabelInput
                        type="text"
                        placeholder="New label..."
                        value={newLabel}
                        onChange={(e) => { newLabelRef.current = e.target.value; setNewLabel(e.target.value) }}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                      />
                      <IconButton onClick={handleAddLabel} disabled={saving}>
                        <MdSave />
                      </IconButton>
                      <IconButton onClick={handleCancel}>
                        <MdClose />
                      </IconButton>
                    </LabelEditor>

                    <LabelsContainer>
                      {deviceLabels.length === 0 ? (
                        <NoLabels>No labels yet</NoLabels>
                      ) : (
                        deviceLabels.map((labelId) => (
                          <LabelChip key={labelId}>
                            {displayLabelName(labelId)}
                            <LabelRemove onClick={() => handleRemoveLabel('device', device.id, labelId)}>
                              <MdClose />
                            </LabelRemove>
                          </LabelChip>
                        ))
                      )}
                    </LabelsContainer>
                  </CardBody>
                ) : (
                  <CardBody>
                    <DetailRow>
                      <DetailLabel>Device ID:</DetailLabel>
                      <DetailValue>{device.id}</DetailValue>
                    </DetailRow>
                    <LabelsContainer>
                      {deviceLabels.length === 0 ? (
                        <NoLabels>No labels</NoLabels>
                      ) : (
                        deviceLabels.map((labelId) => (
                          <LabelChip key={labelId}>{displayLabelName(labelId)}</LabelChip>
                        ))
                      )}
                    </LabelsContainer>
                  </CardBody>
                )}
              </EntityCard>
            )
          })}
        </EntityList>
        )}
      </StepContent>
    )
  }

  const AutoSetupStep = ({ data, updateData }) => {
    const [suggestions, setSuggestions] = useState([])
    const [selectedItems, setSelectedItems] = useState(new Set())
    const [applying, setApplying] = useState(false)
    const [success, setSuccess] = useState(null)
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [targetFilter, setTargetFilter] = useState('all')
    const [confidenceFilter, setConfidenceFilter] = useState('all')
    const [strictMode, setStrictMode] = useState(true)
    const [showSelectedOnly, setShowSelectedOnly] = useState(false)
    const [showSafePreview, setShowSafePreview] = useState(false)
    const [safePreviewItems, setSafePreviewItems] = useState([])
    const selectedItemsRef = useRef(new Set())
    const pendingSafeApplyRef = useRef(false)
    const labelMapsRef = useRef({ idToName: {}, nameToId: {} })

    const normalizeLabelValues = (value) => (Array.isArray(value) ? value : [])

    const CONTROL_DOMAINS = new Set(['switch', 'light', 'fan', 'humidifier', 'climate', 'camera'])
    const DIAGNOSTIC_KEYWORDS = [
      'restart', 'uptime', 'ssid', 'wifi', 'mqtt', 'ip', 'mac', 'firmware', 'version',
      'connect_count', 'last_restart_time', 'restart_reason', 'signal', 'rssi',
      'energy_', '_energy', 'apparentpower', 'reactivepower', 'voltage', 'current', 'factor',
      'model', 'battery', 'batterie', 'linkquality'
    ]
    const SENSOR_METRIC_KEYWORDS = [
      'temperature', 'humidity', 'dewpoint', 'moisture', 'conductivity', 'ec', 'ph', 'tds',
      'sal', 'salinity', 'co2', 'carbondioxide', 'lux', 'lumen', 'illuminance', 'dli', 'ppfd',
      'water_level', 'tank_level', 'reservoir_level', 'duty', 'intensity',
      'temperatur', 'feuchtigkeit', 'leitfahigkeit', 'beleuchtungsstarke'
    ]
    const DEVICE_TYPE_KEYWORDS = {
      Exhaust: ['exhaust', 'abluft'],
      Intake: ['intake', 'zuluft'],
      Ventilation: ['vent', 'vents', 'venti', 'ventilation', 'inlet'],
      Humidifier: ['humidifier', 'befeuchter'],
      Dehumidifier: ['dehumidifier', 'entfeuchter'],
      Heater: ['heater', 'heizung'],
      Cooler: ['cooler', 'kuehler', 'chiller'],
      Climate: ['climate', 'klima'],
      LightFarRed: ['light_fr', 'light_farred', 'farred', 'far_red', 'lightfarred'],
      LightUV: ['light_uv', 'light_uvb', 'light_uva', 'uvlight', 'uv-light', 'lightuv'],
      LightBlue: ['light_blue', 'blue_led', 'bluelight', 'blue-light', 'lightblue'],
      LightRed: ['light_red', 'red_led', 'redlight', 'red-light', 'lightred'],
      Light: ['light', 'lamp', 'led'],
      CO2: ['co2', 'carbon'],
      Camera: ['camera', 'kamera', 'cam', 'webcam'],
      Pump: ['pump', 'dripper', 'feedsystem', 'tank'],
      Sensor: ['sensor', 'temperature', 'temp', 'humidity', 'moisture', 'dewpoint', 'illuminance', 'ppfd', 'dli'],
    }

    const getDomain = (entityId = '') => String(entityId).split('.')[0] || ''
    const HARD_SKIP_ENTITY_PARTS = [
      '_last_restart_time', '_restart_reason', '_wifi_connect_count', '_mqtt_connect_count',
      '_ssid', '_ip', '_mac', '_energy_', '_energy', 'energy_', 'apparentpower',
      'reactivepower', '_voltage', '_current', '_factor', '_model', '_battery', '_batterie',
      'linkquality'
    ]

    const shouldHardSkipEntity = (entityId = '') => {
      const key = String(entityId).toLowerCase()
      return HARD_SKIP_ENTITY_PARTS.some((part) => key.includes(part))
    }

    const isDiagnosticEntity = (entityId = '') => {
      const key = String(entityId).toLowerCase()
      return shouldHardSkipEntity(entityId) || DIAGNOSTIC_KEYWORDS.some((part) => key.includes(part))
    }

    const detectDeviceSuggestion = (deviceName, relatedEntities = []) => {
      const key = String(deviceName || '').toLowerCase()
      const labels = []
      const reasons = []

      const add = (name, reason) => {
        if (!labels.includes(name)) labels.push(name)
        if (reason && !reasons.includes(reason)) reasons.push(reason)
      }

      const controlEntities = relatedEntities.filter((entity) => CONTROL_DOMAINS.has(getDomain(entity.entity_id)))
      const controlKey = controlEntities.map((entity) => entity.entity_id.toLowerCase()).join(' ')
      const fullKey = `${key} ${controlKey}`

      const matchType = (type) => DEVICE_TYPE_KEYWORDS[type].some((word) => fullKey.includes(word))

      if (matchType('Exhaust')) add('Exhaust', 'keyword mapping')
      else if (matchType('Intake')) add('Intake', 'keyword mapping')
      else if (matchType('Ventilation')) add('Ventilation', 'keyword mapping')

      if (matchType('Dehumidifier')) add('Dehumidifier', 'keyword mapping')
      else if (matchType('Humidifier')) add('Humidifier', 'keyword mapping')

      if (matchType('Heater')) add('Heater', 'keyword mapping')
      if (matchType('Cooler')) add('Cooler', 'keyword mapping')
      if (matchType('Climate')) add('Climate', 'keyword mapping')
      if (matchType('Pump')) add('Pump', 'keyword mapping')
      if (matchType('CO2')) add('CO2', 'keyword mapping')
      if (matchType('Camera')) add('Camera', 'keyword mapping')

      if (matchType('LightFarRed')) add('LightFarRed', 'keyword mapping')
      else if (matchType('LightUV')) add('LightUV', 'keyword mapping')
      else if (matchType('LightBlue')) add('LightBlue', 'keyword mapping')
      else if (matchType('LightRed')) add('LightRed', 'keyword mapping')
      else {
        const hasNonLightControl = labels.some((label) => !['Light', 'LightFarRed', 'LightUV', 'LightBlue', 'LightRed'].includes(label))
        if (!hasNonLightControl && matchType('Light')) add('Light', 'keyword mapping')
      }

      if (!strictMode && labels.length === 0 && matchType('Sensor')) add('Sensor', 'sensor-like device')

      const confidence = labels.length > 0 ? 'high' : 'low'
      return { labels, confidence, reason: reasons[0] || 'no strong match' }
    }

    const detectEntitySuggestion = (entity) => {
      const entityId = String(entity?.entity_id || '')
      const key = entityId.toLowerCase()
      const domain = getDomain(entityId)

      if (!entityId || shouldHardSkipEntity(entityId) || isDiagnosticEntity(entityId)) {
        return { labels: [], confidence: 'low', reason: 'diagnostic entity skipped' }
      }

      const labels = []
      const reasons = []
      const add = (name, reason) => {
        if (!labels.includes(name)) labels.push(name)
        if (reason && !reasons.includes(reason)) reasons.push(reason)
      }

      const isMetricSensor = domain === 'sensor' && SENSOR_METRIC_KEYWORDS.some((metric) => key.includes(metric))
      if (isMetricSensor) {
        add('Sensor', 'sensor metric')
      }

      if (isMetricSensor && (key.includes('ph') || key.includes('ec') || key.includes('tds') || key.includes('sal') || key.includes('water') || key.includes('reservoir') || key.includes('tank_level'))) {
        add('Water', 'water metric')
      }

      if (key.includes('dli')) add('DLI', 'dli metric')
      if (key.includes('ppfd')) add('PPFD', 'ppfd metric')

      if (!strictMode && domain !== 'sensor') {
        if (key.includes('exhaust')) add('Exhaust', 'exhaust control entity')
        else if (key.includes('intake')) add('Intake', 'intake control entity')
        else if (key.includes('ventilation') || key.includes('vents') || key.includes('venti')) add('Ventilation', 'ventilation control entity')
        if (key.includes('pump')) add('Pump', 'pump control entity')
      }

      const confidence = labels.length > 0 ? 'high' : 'low'
      return { labels, confidence, reason: reasons[0] || 'not actionable' }
    }

    const getSpecialRename = (entityId) => {
      const key = String(entityId || '').toLowerCase()
      if (isDiagnosticEntity(entityId)) return ''
      if (key.includes('_duty')) return 'DutySensor'
      if (key.includes('_intensity')) return 'IntensitySensor'
      if (key.includes('watertester') || key.includes('_ph') || key.includes('_ec') || key.includes('_tds') || key.includes('_sal')) return 'WaterSensor'
      return ''
    }

    const loadLabelMaps = async () => {
      if (!connection) return
      const registry = await connection.sendMessagePromise({ type: 'config/label_registry/list' }).catch(() => [])
      const idToName = {}
      const nameToId = {}
      ;(registry || []).forEach((item) => {
        const id = item.label_id || item.id
        const name = item.name || id
        if (!id || !name) return
        idToName[id] = name
        nameToId[name.toLowerCase()] = id
      })
      labelMapsRef.current = { idToName, nameToId }
    }

    const ensureLabelId = async (name) => {
      const labelName = String(name || '').trim()
      if (!labelName) return null
      const key = labelName.toLowerCase()
      if (labelMapsRef.current.nameToId[key]) return labelMapsRef.current.nameToId[key]
      if (!connection) throw new Error('No Home Assistant connection available')

      const created = await connection.sendMessagePromise({ type: 'config/label_registry/create', name: labelName })
      const id = created?.label_id || created?.id
      if (!id) throw new Error(`Could not create label '${labelName}'`)

      labelMapsRef.current.idToName[id] = labelName
      labelMapsRef.current.nameToId[key] = id
      return id
    }

    const loadSuggestions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        await loadLabelMaps()

      const roomDevices = getDevicesByRoom(currentRoom)
      const roomEntities = getEntitiesByRoom(currentRoom)

      const deviceSuggestions = roomDevices.map((device) => {
        const relatedEntities = roomEntities.filter((entity) => entity.device_id === device.id)
        const detected = detectDeviceSuggestion(device.name_by_user || device.name || '', relatedEntities)
        const currentLabelNames = normalizeLabelValues(device.labels).map((label) => labelMapsRef.current.idToName[label] || label)
        const missingLabels = detected.labels.filter((label) => !currentLabelNames.some((existing) => String(existing).toLowerCase() === label.toLowerCase()))
        return {
          rowId: `device:${device.id}`,
          targetType: 'device',
          targetId: device.id,
          currentName: device.name_by_user || device.name || device.id,
          currentLabels: normalizeLabelValues(device.labels),
          missingLabels,
          suggestedLabels: detected.labels,
          confidence: detected.confidence,
          reason: detected.reason,
          suggestedName: '',
        }
      })

      const entitySuggestions = roomEntities.map((entity) => {
        const detected = detectEntitySuggestion(entity)
        const currentLabelNames = normalizeLabelValues(entity.attributes?.labels || entity.labels).map((label) => labelMapsRef.current.idToName[label] || label)
        const missingLabels = detected.labels.filter((label) => !currentLabelNames.some((existing) => String(existing).toLowerCase() === label.toLowerCase()))
        const specialName = getSpecialRename(entity.entity_id)
        return {
          rowId: `entity:${entity.entity_id}`,
          targetType: 'entity',
          targetId: entity.entity_id,
          currentName: entity.attributes?.friendly_name || entity.entity_id,
          currentLabels: normalizeLabelValues(entity.attributes?.labels || entity.labels),
          missingLabels,
          suggestedLabels: detected.labels,
          confidence: specialName ? 'high' : detected.confidence,
          reason: specialName ? `${detected.reason} + special metric rename` : detected.reason,
          suggestedName: specialName,
        }
      })

      const actionable = [...deviceSuggestions, ...entitySuggestions].filter(
        (item) => item.missingLabels.length > 0 || item.suggestedName
      )

        setSuggestions(actionable)
        const defaults = new Set(actionable.filter((item) => item.confidence !== 'low' || item.suggestedName).map((item) => item.rowId))
        selectedItemsRef.current = defaults
        setSelectedItems(defaults)
      } catch (loadError) {
        console.error('Auto setup load failed:', loadError)
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    const handleRefresh = () => {
      selectedItemsRef.current = new Set()
      setSelectedItems(new Set())
      setShowSafePreview(false)
      setSafePreviewItems([])
      loadSuggestions()
    }

    useEffect(() => {
      loadSuggestions()
    }, [strictMode])

    const toggleSelection = (rowId) => {
      const next = new Set(selectedItems)
      if (next.has(rowId)) next.delete(rowId)
      else next.add(rowId)
      selectedItemsRef.current = next
      setSelectedItems(next)
    }

    const selectAll = () => {
      const all = new Set(getVisibleSuggestions().map((item) => item.rowId))
      selectedItemsRef.current = all
      setSelectedItems(all)
    }

    const clearSelection = () => {
      selectedItemsRef.current = new Set()
      setSelectedItems(new Set())
    }

    const getSafeSuggestionIds = () => {
      return suggestions
        .filter((item) => item.confidence === 'high' && (item.missingLabels.length > 0 || item.suggestedName))
        .map((item) => item.rowId)
    }

    const getSafeSuggestions = () => {
      const safeIds = new Set(getSafeSuggestionIds())
      return suggestions.filter((item) => safeIds.has(item.rowId))
    }

    const openSafePreview = () => {
      const safeItems = getSafeSuggestions()
      if (safeItems.length === 0) {
        setSuccess('No safe high-confidence actions available.')
        return
      }
      setSafePreviewItems(safeItems)
      setShowSafePreview(true)
    }

    const getVisibleSuggestions = () => {
      const query = searchText.toLowerCase()
      return suggestions.filter((item) => {
        if (targetFilter !== 'all' && item.targetType !== targetFilter) return false
        if (confidenceFilter !== 'all' && item.confidence !== confidenceFilter) return false
        if (showSelectedOnly && !selectedItems.has(item.rowId)) return false

        if (!query) return true
        const currentLabelText = item.currentLabels
          .map((label) => labelMapsRef.current.idToName[label] || label)
          .join(' ')
          .toLowerCase()

        const suggestedLabelText = [...item.suggestedLabels, ...item.missingLabels].join(' ').toLowerCase()
        return (
          item.currentName.toLowerCase().includes(query) ||
          item.targetId.toLowerCase().includes(query) ||
          currentLabelText.includes(query) ||
          suggestedLabelText.includes(query)
        )
      })
    }

    const applyRows = async (rows) => {
      setApplying(true)
      setSuccess(null)
      setError(null)

      const rowsToApply = rows instanceof Set ? rows : new Set(rows)
      let successCount = 0
      let errorCount = 0

      for (const rowId of rowsToApply) {
        const suggestion = suggestions.find((item) => item.rowId === rowId)
        if (!suggestion) continue

        try {
          const currentLabels = suggestion.currentLabels || []
          const currentLabelIds = []
          for (const label of currentLabels) {
            const labelKey = String(label || '')
            if (!labelKey) continue
            if (labelMapsRef.current.idToName[labelKey]) {
              currentLabelIds.push(labelKey)
              continue
            }
            const maybeId = await ensureLabelId(labelKey)
            if (maybeId) currentLabelIds.push(maybeId)
          }

          const suggestedLabelIds = []
          for (const name of suggestion.missingLabels) {
            const id = await ensureLabelId(name)
            if (id) suggestedLabelIds.push(id)
          }

          const mergedLabelIds = [...new Set([...currentLabelIds, ...suggestedLabelIds])]

          if (suggestion.targetType === 'device') {
            if (mergedLabelIds.length > 0) {
              await updateDeviceLabels(suggestion.targetId, mergedLabelIds)
            }
          } else {
            if (mergedLabelIds.length > 0) {
              await updateEntityLabels(suggestion.targetId, mergedLabelIds)
            }
            if (suggestion.suggestedName) {
              await updateEntityName(suggestion.targetId, suggestion.suggestedName)
            }
          }

          successCount++
        } catch (error) {
          console.error('Auto setup apply failed:', suggestion.rowId, error)
          setError(error.message)
          errorCount++
        }
      }

      setSuccess(`Applied setup to ${successCount} items${errorCount > 0 ? ` (${errorCount} errors)` : ''}`)
      setApplying(false)
      selectedItemsRef.current = new Set()
      setSelectedItems(new Set())
      setTimeout(() => setSuccess(null), 5000)
      loadSuggestions()
    }

    const applySelected = async () => {
      const rows = selectedItemsRef.current.size > 0 ? selectedItemsRef.current : selectedItems
      await applyRows(rows)
    }

    const applySafe = async () => {
      if (!strictMode) {
        pendingSafeApplyRef.current = true
        setStrictMode(true)
        setSuccess('Strict OGB mode enabled. Opening Safe Apply preview...')
        return
      }
      openSafePreview()
    }

    const confirmSafeApply = async () => {
      const safeIds = safePreviewItems.map((item) => item.rowId)
      setShowSafePreview(false)
      await applyRows(new Set(safeIds))
    }

    useEffect(() => {
      if (!pendingSafeApplyRef.current) return
      if (!strictMode || isLoading || applying) return

      pendingSafeApplyRef.current = false
      const safeIds = getSafeSuggestionIds()
      if (safeIds.length === 0) {
        setSuccess('Strict mode active, but no safe high-confidence suggestions were found.')
        return
      }
      openSafePreview()
    }, [strictMode, isLoading, applying, suggestions])

    const visibleSuggestions = getVisibleSuggestions()
    const stats = {
      total: suggestions.length,
      selected: selectedItems.size,
      devices: suggestions.filter((item) => item.targetType === 'device').length,
      entities: suggestions.filter((item) => item.targetType === 'entity').length,
      high: suggestions.filter((item) => item.confidence === 'high').length,
      special: suggestions.filter((item) => item.suggestedName).length,
      safe: suggestions.filter((item) => item.confidence === 'high' && (item.missingLabels.length > 0 || item.suggestedName)).length,
    }

    const confidenceColor = {
      high: { bg: 'rgba(39, 174, 96, 0.18)', color: '#27ae60' },
      medium: { bg: 'rgba(243, 156, 18, 0.18)', color: '#f39c12' },
      low: { bg: 'rgba(231, 76, 60, 0.18)', color: '#e74c3c' },
    }

    return (
      <StepContent>
        <h3>Auto Setup</h3>
        <p>Detect and map labels for room: <strong>{currentRoom}</strong></p>

        <AutoHeroCard>
          <div><strong>Smart Mapping</strong> applies OpenGrowBox labels based on domains and naming patterns.</div>
          <AutoHint>
            Focus is label mapping first. Renaming is only proposed for special metrics like duty, intensity, and water sensors. Mode: <strong>{strictMode ? 'Strict OGB' : 'Extended'}</strong>.
          </AutoHint>
        </AutoHeroCard>

        {success && <SuccessBanner>{success}</SuccessBanner>}
        {error && <ErrorBanner>{error}</ErrorBanner>}

        {showSafePreview && (
          <SafePreviewCard>
            <SafePreviewHeader>
              <SafePreviewTitle>Confirm OGB Safe Apply ({safePreviewItems.length})</SafePreviewTitle>
              <TinyBadge $bg="rgba(39, 174, 96, 0.2)" $color="#27ae60">strict + high confidence only</TinyBadge>
            </SafePreviewHeader>
            <AutoHint>
              This will only apply missing labels (and special metric rename if needed) on high-confidence suggestions. Existing labels are preserved.
            </AutoHint>
            <SafePreviewList>
              {safePreviewItems.map((item) => (
                <SafePreviewRow key={`safe-preview-${item.rowId}`}>
                  <strong>{item.currentName}</strong> ({item.targetType}) - add: {item.missingLabels.length > 0 ? item.missingLabels.join(', ') : 'none'}{item.suggestedName ? `; rename: ${item.suggestedName}` : ''}
                </SafePreviewRow>
              ))}
            </SafePreviewList>
            <AutoActionsBar>
              <ActionButton onClick={confirmSafeApply} disabled={applying}>Confirm Safe Apply</ActionButton>
              <ActionButton onClick={() => setShowSafePreview(false)} disabled={applying}>Cancel</ActionButton>
            </AutoActionsBar>
          </SafePreviewCard>
        )}

        <AutoStatsGrid>
          <AutoStatCard><AutoStatValue>{stats.total}</AutoStatValue><AutoStatLabel>Actionable</AutoStatLabel></AutoStatCard>
          <AutoStatCard><AutoStatValue>{stats.selected}</AutoStatValue><AutoStatLabel>Selected</AutoStatLabel></AutoStatCard>
          <AutoStatCard><AutoStatValue>{stats.devices}</AutoStatValue><AutoStatLabel>Devices</AutoStatLabel></AutoStatCard>
          <AutoStatCard><AutoStatValue>{stats.entities}</AutoStatValue><AutoStatLabel>Entities</AutoStatLabel></AutoStatCard>
          <AutoStatCard><AutoStatValue>{stats.high}</AutoStatValue><AutoStatLabel>High Confidence</AutoStatLabel></AutoStatCard>
          <AutoStatCard><AutoStatValue>{stats.special}</AutoStatValue><AutoStatLabel>Special Rename</AutoStatLabel></AutoStatCard>
          <AutoStatCard><AutoStatValue>{stats.safe}</AutoStatValue><AutoStatLabel>Safe Apply</AutoStatLabel></AutoStatCard>
        </AutoStatsGrid>

        <AutoFilters>
          <SearchInput
            type="text"
            placeholder="Search by name, id, or label..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <AutoSelect value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="device">Devices</option>
            <option value="entity">Entities</option>
          </AutoSelect>
          <AutoSelect value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value)}>
            <option value="all">All Confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </AutoSelect>
          <AutoSelect value={strictMode ? 'strict' : 'extended'} onChange={(e) => setStrictMode(e.target.value === 'strict')}>
            <option value="strict">Strict OGB</option>
            <option value="extended">Extended</option>
          </AutoSelect>
        </AutoFilters>

        <AutoActionsBar>
          <ActionButton onClick={handleRefresh} disabled={applying} title="Reload suggestions">
            <MdRefresh />
            Refresh
          </ActionButton>
          <ActionButton onClick={selectAll} disabled={applying || visibleSuggestions.length === 0}>
            Select Visible ({visibleSuggestions.length})
          </ActionButton>
          <ActionButton onClick={clearSelection} disabled={applying || selectedItems.size === 0}>
            Clear Selection
          </ActionButton>
          <ActionButton onClick={applySelected} disabled={applying || selectedItems.size === 0}>
            {applying ? 'Applying...' : `Apply (${selectedItems.size})`}
          </ActionButton>
          <ActionButton onClick={applySafe} disabled={applying || stats.safe === 0}>
            OGB Safe Apply ({stats.safe})
          </ActionButton>
          <ActionButton onClick={() => setShowSelectedOnly((prev) => !prev)} disabled={applying}>
            {showSelectedOnly ? 'Show All' : 'Show Selected'}
          </ActionButton>
        </AutoActionsBar>

        <EntityList>
          {isLoading ? (
            <EmptyState>Analyzing room entities and devices...</EmptyState>
          ) : visibleSuggestions.length === 0 ? (
            <EmptyState>No actionable items found</EmptyState>
          ) : (
            visibleSuggestions.map((item) => {
              const isSelected = selectedItems.has(item.rowId)
              const type = item.targetType === 'device' ? 'Device' : 'Entity'
              const currentLabels = item.currentLabels
                .map((label) => labelMapsRef.current.idToName[label] || label)
              const confidenceTone = confidenceColor[item.confidence] || confidenceColor.low

              return (
                <SuggestionCard key={item.rowId}>
                  <SuggestionTop>
                    <div>
                      <SuggestionTitle>{item.currentName}</SuggestionTitle>
                      <SuggestionSub>{item.targetId}</SuggestionSub>
                    </div>
                    <SuggestionBadges>
                      <TinyBadge>{type}</TinyBadge>
                      <TinyBadge $bg={confidenceTone.bg} $color={confidenceTone.color}>{item.confidence}</TinyBadge>
                      {item.suggestedName && <TinyBadge $bg="rgba(52, 152, 219, 0.2)" $color="#3498db">special rename</TinyBadge>}
                    </SuggestionBadges>
                  </SuggestionTop>

                  <SuggestionSub>Detection: {item.reason}</SuggestionSub>

                  <SuggestionRow>
                    <div>
                      <SuggestionSub>Current Labels</SuggestionSub>
                      <LabelLine>
                        {currentLabels.length === 0
                          ? <NoLabels>No labels</NoLabels>
                          : currentLabels.map((label) => <LabelChip key={`${item.rowId}-cur-${label}`}>{label}</LabelChip>)
                        }
                      </LabelLine>
                    </div>

                    <div>
                      <SuggestionSub>Will Add</SuggestionSub>
                      <LabelLine>
                        {item.missingLabels.length === 0
                          ? <NoLabels>No new labels</NoLabels>
                          : item.missingLabels.map((label) => <LabelChip key={`${item.rowId}-new-${label}`}>{label}</LabelChip>)
                        }
                      </LabelLine>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem' }}>
                      <div>
                        <SuggestionSub>Special Name</SuggestionSub>
                        <div style={{ fontSize: '0.82rem', opacity: 0.8 }}>{item.suggestedName || '-'}</div>
                      </div>
                      <Checkbox
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(item.rowId)}
                      />
                    </div>
                  </SuggestionRow>
                </SuggestionCard>
              )
            })
          )}
        </EntityList>
      </StepContent>
    )
  }

  return { 
    SetupWelcomeStep,
    DeviceManagerStep,
    EntityManagerStep,
    LabelManagerStep,
    AutoSetupStep
  }
}
