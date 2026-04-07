import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useGlobalState } from '../../Context/GlobalContext'
import { useHomeAssistant } from '../../Context/HomeAssistantContext'

export const createAdvancedStepComponents = ({ icons, styles }) => {
  const { MdSettings, MdNotifications, MdBugReport } = icons
  const { StepContent, FeaturesList, FeatureItem } = styles
  const { state, setDeep } = useGlobalState()
  const { connection } = useHomeAssistant()

  const getDeep = (path) => {
    return path.split('.').reduce((obj, key) => obj && obj[key], state)
  }

  const AdvancedWelcomeStep = () => (
    <StepContent>
      <h2>Advanced Configuration</h2>
      <p>This wizard will guide you through advanced system configuration options.</p>
      <FeaturesList>
        <FeatureItem>
          <MdSettings />
          <span>System Settings</span>
        </FeatureItem>
        <FeatureItem>
          <MdNotifications />
          <span>Notifications & Log Types</span>
        </FeatureItem>
        <FeatureItem>
          <MdBugReport />
          <span>Automation Rules</span>
        </FeatureItem>
      </FeaturesList>
    </StepContent>
  )

  const SystemSettingsStep = () => (
    <StepContent>
      <h3>System Settings</h3>
      <p>Configure system-wide settings and parameters.</p>
      <p>This section will contain system configuration options.</p>
    </StepContent>
  )

  const NotificationLogSettingsStep = () => {
    const currentRoom = state?.currentRoom || getDeep('currentRoom')
    const [notifyControl, setNotifyControl] = useState('Disabled')
    const [logType, setLogType] = useState('WARNING,ERROR')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
      if (currentRoom) {
        const storedNotify = getDeep(`rooms.${currentRoom}.notifyControl`)
        const storedLogType = getDeep(`rooms.${currentRoom}.logType`)
        if (storedNotify) setNotifyControl(storedNotify)
        if (storedLogType) setLogType(storedLogType)
      }
    }, [currentRoom])

    const handleSave = async () => {
      if (!connection || !currentRoom) return
      setSaving(true)
      try {
        setDeep(`rooms.${currentRoom}.notifyControl`, notifyControl)
        setDeep(`rooms.${currentRoom}.logType`, logType)
        
        await connection.sendMessagePromise({
          type: 'call_service',
          domain: 'select',
          service: 'select_option',
          service_data: {
            entity_id: `select.ogb_notifications_${currentRoom.toLowerCase()}`,
            option: notifyControl
          }
        })
        
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch (e) {
        // console.error('Error saving notification settings:', e)
      }
      setSaving(false)
    }

    const toggleLogType = (type) => {
      const currentTypes = logType ? logType.split(',').map(t => t.trim()) : []
      if (currentTypes.includes(type)) {
        setLogType(currentTypes.filter(t => t !== type).join(','))
      } else {
        setLogType([...currentTypes, type].join(','))
      }
    }

    const logTypes = ['DEBUG', 'INFO', 'WARNING', 'ERROR']

    return (
      <StepContent>
        <h3>Notifications & Log Types</h3>
        <p>Configure which notifications and log types you want to receive.</p>
        
        <SettingsSection>
          <SettingsLabel>Push Notifications</SettingsLabel>
          <SettingsDescription>Enable or disable push notifications for this room</SettingsDescription>
          <ToggleGroup>
            <ToggleButton 
              selected={notifyControl === 'Enabled'} 
              onClick={() => setNotifyControl('Enabled')}
            >
              Enabled
            </ToggleButton>
            <ToggleButton 
              selected={notifyControl === 'Disabled'} 
              onClick={() => setNotifyControl('Disabled')}
            >
              Disabled
            </ToggleButton>
          </ToggleGroup>
        </SettingsSection>

        <SettingsSection>
          <SettingsLabel>Log Types to Display</SettingsLabel>
          <SettingsDescription>Select which log types should be shown in the log viewer</SettingsDescription>
          <CheckboxGroup>
            {logTypes.map(type => (
              <CheckboxItem key={type}>
                <Checkbox 
                  type="checkbox" 
                  checked={logType.split(',').map(t => t.trim()).includes(type)}
                  onChange={() => toggleLogType(type)}
                />
                <CheckboxLabel>{type}</CheckboxLabel>
                <CheckboxDescription>
                  {type === 'DEBUG' && 'Detailed debug information'}
                  {type === 'INFO' && 'General information and status updates'}
                  {type === 'WARNING' && 'Warnings that may need attention'}
                  {type === 'ERROR' && 'Critical errors that require action'}
                </CheckboxDescription>
              </CheckboxItem>
            ))}
          </CheckboxGroup>
        </SettingsSection>

        <SaveButton onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </SaveButton>
      </StepContent>
    )
  }

  const AutomationRulesStep = () => (
    <StepContent>
      <h3>Automation Rules</h3>
      <p>Configure automation rules and triggers for your system.</p>
      <p>This section will contain automation configuration options.</p>
    </StepContent>
  )

  return { 
    AdvancedWelcomeStep, 
    SystemSettingsStep, 
    NotificationLogSettingsStep,
    AutomationRulesStep 
  }
}

const SettingsSection = styled.div`
  margin: 24px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
`

const SettingsLabel = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #fff);
  margin-bottom: 4px;
`

const SettingsDescription = styled.div`
  font-size: 13px;
  color: var(--text-secondary, #aaa);
  margin-bottom: 12px;
`

const ToggleGroup = styled.div`
  display: flex;
  gap: 12px;
`

const ToggleButton = styled.button`
  flex: 1;
  padding: 12px 20px;
  border: 2px solid ${props => props.selected ? 'var(--main-color, #00ff88)' : 'rgba(255,255,255,0.2)'};
  background: ${props => props.selected ? 'rgba(0, 255, 136, 0.15)' : 'transparent'};
  color: ${props => props.selected ? 'var(--main-color, #00ff88)' : 'var(--text-secondary, #aaa)'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--main-color, #00ff88);
    background: rgba(0, 255, 136, 0.1);
  }
`

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const CheckboxItem = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  margin-top: 2px;
  accent-color: var(--main-color, #00ff88);
  cursor: pointer;
`

const CheckboxLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #fff);
  min-width: 70px;
`

const CheckboxDescription = styled.span`
  font-size: 12px;
  color: var(--text-secondary, #aaa);
`

const SaveButton = styled.button`
  margin-top: 24px;
  padding: 14px 28px;
  background: var(--main-color, #00ff88);
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`
