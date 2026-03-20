import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import SecureTokenStorage from '../../../utils/secureTokenStorage'

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

const SuggestionsTable = styled.div`
  background: var(--glass-bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  max-height: 500px;
  overflow-y: auto;
`

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 1.5fr 1.5fr 0.8fr 0.5fr;
  gap: 1rem;
  padding: 1rem;
  background: rgba(42, 157, 143, 0.1);
  font-weight: 600;
  font-size: 0.9rem;
`

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 1.5fr 1.5fr 0.8fr 0.5fr;
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

// Main Factory Function
export const createSetupStepComponents = ({ icons, styles, connection, currentRoom }) => {
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
    MdWindPower
  } = icons
  const { StepContent } = styles

  const getBaseUrl = () => {
    if (import.meta.env.PROD) {
      return window.location.origin
    }
    return localStorage.getItem('devServerUrl') || import.meta.env.VITE_HA_HOST || ''
  }

  const getToken = () => {
    const token = SecureTokenStorage.getToken()
    console.log('[Setup] Token:', token ? 'Found' : 'Not found')
    return token
  }

  const updateDeviceName = async (deviceId, newName) => {
    const baseUrl = getBaseUrl()
    const token = getToken()
    
    if (!token) {
      throw new Error('No authentication token available')
    }

    console.log('[Setup] Updating device:', deviceId, 'to:', newName)

    const response = await fetch(`${baseUrl}/api/config/device_registry/device/${deviceId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name_by_user: newName })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Setup] Device update failed:', response.status, errorText)
      throw new Error(`Failed to update device: ${response.status}`)
    }

    return await response.json()
  }

  const updateEntityName = async (entityId, newName) => {
    const baseUrl = getBaseUrl()
    const token = getToken()
    
    if (!token) {
      throw new Error('No authentication token available')
    }

    console.log('[Setup] Updating entity:', entityId, 'to:', newName)

    const response = await fetch(`${baseUrl}/api/config/entity_registry/${entityId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newName })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Setup] Entity update failed:', response.status, errorText)
      throw new Error(`Failed to update entity: ${response.status}`)
    }

    return await response.json()
  }

  const updateEntityLabels = async (entityId, labels) => {
    const baseUrl = getBaseUrl()
    const token = getToken()
    
    if (!token) {
      throw new Error('No authentication token available')
    }

    console.log('[Setup] Updating labels for:', entityId, 'labels:', labels)

    const response = await fetch(`${baseUrl}/api/config/entity_registry/${entityId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ labels })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Setup] Labels update failed:', response.status, errorText)
      throw new Error(`Failed to update labels: ${response.status}`)
    }

    return await response.json()
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
      .map(([id, device]) => ({ id, ...device }))
    
    console.log('[Setup] Found devices:', filtered.length)
    return filtered
  }

  const getEntitiesByRoom = (room, includeOGB = false) => {
    const HASS = document.querySelector('home-assistant')?.hass
    if (!HASS?.devices || !HASS?.entities) return []
    
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
    
    return Object.entries(HASS.entities)
      .filter(([_, entity]) => roomDeviceIds.includes(entity.device_id))
      .map(([id, entity]) => ({ id, ...entity }))
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

    const loadDevices = () => {
      const roomDevices = getDevicesByRoom(currentRoom)
      const allRoomDevices = getDevicesByRoom(currentRoom, true)
      setDevices(roomDevices)
      setAllDevices(allRoomDevices)
    }

    useEffect(() => {
      loadDevices()
      const interval = setInterval(loadDevices, 5000)
      return () => clearInterval(interval)
    }, [currentRoom])

    const handleEdit = (device) => {
      setEditingDevice(device.id)
      setEditValue(device.name_by_user || device.name || '')
    }

    const handleSave = async (deviceId) => {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      try {
        await updateDeviceName(deviceId, editValue)
        setSuccess('Device name updated successfully')
        loadDevices()
        setEditingDevice(null)
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
                          onChange={(e) => setEditValue(e.target.value)}
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

    const loadEntities = () => {
      const roomEntities = getEntitiesByRoom(currentRoom)
      const allRoomEntities = getEntitiesByRoom(currentRoom, true)
      setEntities(roomEntities)
      setAllEntities(allRoomEntities)
    }

    useEffect(() => {
      loadEntities()
      const interval = setInterval(loadEntities, 5000)
      return () => clearInterval(interval)
    }, [currentRoom])

    const handleEdit = (entity) => {
      setEditingEntity(entity.entity_id)
      setEditValue(entity.attributes?.friendly_name || entity.entity_id)
    }

    const handleSave = async (entityId) => {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      try {
        await updateEntityName(entityId, editValue)
        setSuccess('Entity name updated successfully')
        loadEntities()
        setEditingEntity(null)
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
      setEditingEntity(null)
      setEditValue('')
    }

    const domains = ['all', ...new Set(allEntities.map(e => e.entity_id.split('.')[0]))]

    const filteredEntities = entities.filter(entity => {
      const domain = entity.entity_id.split('.')[0]
      if (domainFilter !== 'all' && domain !== domainFilter) return false

      const searchLower = filterText.toLowerCase()
      const name = (entity.attributes?.friendly_name || '').toLowerCase()
      const entityId = entity.entity_id.toLowerCase()
      return name.includes(searchLower) || entityId.includes(searchLower)
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
                            onChange={(e) => setEditValue(e.target.value)}
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
    const [filterText, setFilterText] = useState('')
    const [editingLabels, setEditingLabels] = useState(null)
    const [newLabel, setNewLabel] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    const loadData = () => {
      const allLabels = getAllLabels()
      const roomEntities = getEntitiesByRoom(currentRoom, true)
      setLabels(allLabels)
      setEntities(roomEntities)
    }

    useEffect(() => {
      loadData()
      const interval = setInterval(loadData, 5000)
      return () => clearInterval(interval)
    }, [currentRoom])

    const handleEditLabels = (entity) => {
      setEditingLabels(entity.entity_id)
    }

    const handleAddLabel = () => {
      if (!newLabel.trim()) return
      const entity = entities.find(e => e.entity_id === editingLabels)
      if (entity) {
        const currentLabels = entity.attributes?.labels || []
        if (!currentLabels.includes(newLabel.trim())) {
          const updatedLabels = [...currentLabels, newLabel.trim()]
          handleUpdateLabels(entity.entity_id, updatedLabels)
          setNewLabel('')
        }
      }
    }

    const handleRemoveLabel = (entityId, labelToRemove) => {
      const entity = entities.find(e => e.entity_id === entityId)
      if (entity) {
        const updatedLabels = (entity.attributes?.labels || []).filter(l => l !== labelToRemove)
        handleUpdateLabels(entityId, updatedLabels)
      }
    }

    const handleUpdateLabels = async (entityId, updatedLabels) => {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      try {
        await updateEntityLabels(entityId, updatedLabels)
        setSuccess('Labels updated successfully')
        loadData()
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
      setEditingLabels(null)
      setNewLabel('')
    }

    const sortedLabels = Object.entries(labels).sort((a, b) => b[1] - a[1])

    const filteredEntities = entities.filter(entity => {
      const searchLower = filterText.toLowerCase()
      const name = (entity.attributes?.friendly_name || '').toLowerCase()
      const entityId = entity.entity_id.toLowerCase()
      return name.includes(searchLower) || entityId.includes(searchLower)
    })

    return (
      <StepContent>
        <h3>Label Manager</h3>
        <p>Manage labels for entities in room: <strong>{currentRoom}</strong></p>

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
            placeholder="Search entities..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </SearchBar>

        <EntityList>
          {filteredEntities.map(entity => {
            const domain = entity.entity_id.split('.')[0]
            return (
              <EntityCard key={entity.entity_id}>
                <CardHeader>
                  <EntityDomainIcon>{getIconForDomain(domain)}</EntityDomainIcon>
                  <EntityTitle>
                    {entity.attributes?.friendly_name || entity.entity_id}
                    <IconButton onClick={() => handleEditLabels(entity)}>
                      <MdEdit />
                    </IconButton>
                  </EntityTitle>
                </CardHeader>

                {editingLabels === entity.entity_id ? (
                  <CardBody>
                    <LabelEditor>
                      <LabelInput
                        type="text"
                        placeholder="New label..."
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
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
                      {(entity.attributes?.labels || []).length === 0 ? (
                        <NoLabels>No labels yet</NoLabels>
                      ) : (
                        (entity.attributes?.labels || []).map(label => (
                          <LabelChip key={label}>
                            {label}
                            <LabelRemove onClick={() => handleRemoveLabel(entity.entity_id, label)}>
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
                      <DetailLabel>Entity ID:</DetailLabel>
                      <DetailValue>{entity.entity_id}</DetailValue>
                    </DetailRow>
                    <LabelsContainer>
                      {(entity.attributes?.labels || []).length === 0 ? (
                        <NoLabels>None</NoLabels>
                      ) : (
                        (entity.attributes?.labels || []).map(label => (
                          <LabelChip key={label}>{label}</LabelChip>
                        ))
                      )}
                    </LabelsContainer>
                  </CardBody>
                )}
              </EntityCard>
            )
          })}
        </EntityList>
      </StepContent>
    )
  }

  const AutoSetupStep = ({ data, updateData }) => {
    const [suggestions, setSuggestions] = useState([])
    const [selectedItems, setSelectedItems] = useState(new Set())
    const [applying, setApplying] = useState(false)
    const [success, setSuccess] = useState(null)

    useEffect(() => {
      const roomDevices = getDevicesByRoom(currentRoom)
      const roomEntities = getEntitiesByRoom(currentRoom)
      
      const suggestedNames = [...roomDevices, ...roomEntities].map(item => ({
        ...item,
        suggestedName: generateSuggestedName(item)
      }))
      setSuggestions(suggestedNames)
    }, [currentRoom])

    const toggleSelection = (id) => {
      const newSelected = new Set(selectedItems)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      setSelectedItems(newSelected)
    }

    const selectAll = () => {
      const allIds = new Set(suggestions.map(s => s.id || s.entity_id))
      setSelectedItems(allIds)
    }

    const applySelected = async () => {
      setApplying(true)
      setSuccess(null)
      
      let successCount = 0
      let errorCount = 0
      
      for (const id of selectedItems) {
        const suggestion = suggestions.find(s => (s.id || s.entity_id) === id)
        if (!suggestion) continue
        
        try {
          if (suggestion.id) {
            await updateDeviceName(suggestion.id, suggestion.suggestedName)
          } else if (suggestion.entity_id) {
            await updateEntityName(suggestion.entity_id, suggestion.suggestedName)
          }
          successCount++
        } catch (e) {
          console.error('Error applying name:', e)
          errorCount++
        }
      }
      
      setSuccess(`Applied ${successCount} names${errorCount > 0 ? ` (${errorCount} errors)` : ''}`)
      setApplying(false)
      setSelectedItems(new Set())
      
      setTimeout(() => setSuccess(null), 5000)
    }

    return (
      <StepContent>
        <h3>Auto Setup</h3>
        <p>Auto-generate logical names for devices and entities in room: <strong>{currentRoom}</strong></p>

        {success && <SuccessBanner>{success}</SuccessBanner>}

        <AutoActionsBar>
          <ActionButton onClick={selectAll} disabled={applying}>
            Select All
          </ActionButton>
          <ActionButton onClick={applySelected} disabled={applying || selectedItems.size === 0}>
            {applying ? 'Applying...' : `Apply (${selectedItems.size})`}
          </ActionButton>
        </AutoActionsBar>

        <SuggestionsTable>
          <TableHeader>
            <span>Type</span>
            <span>Current Name</span>
            <span>Suggested Name</span>
            <span>Select</span>
          </TableHeader>

          {suggestions.length === 0 ? (
            <EmptyState>No items found</EmptyState>
          ) : (
            suggestions.map(item => {
              const id = item.id || item.entity_id
              const isSelected = selectedItems.has(id)
              const type = item.id ? 'Device' : 'Entity'
              
              return (
                <TableRow key={id}>
                  <TableCell>{type}</TableCell>
                  <TableCell>{item.name_by_user || item.attributes?.friendly_name || id}</TableCell>
                  <TableCell>{item.suggestedName}</TableCell>
                  <TableCell>
                    <Checkbox
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(id)}
                    />
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </SuggestionsTable>
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
