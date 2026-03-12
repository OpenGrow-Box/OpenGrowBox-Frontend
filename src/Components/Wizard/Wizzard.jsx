import React, { useState } from 'react'
import styled from 'styled-components'
import { motion, } from 'framer-motion'
import { MdCheck, MdArrowForward, MdArrowBack, MdEco, MdLocalFlorist, MdSpa, MdGrass, MdWaterDrop, MdLightMode, MdThermostat, MdOpacity, MdSettings, MdTune, MdDeviceThermostat, MdContactSupport, MdBugReport, MdHelp, MdEmail, MdDownload, MdDelete, MdRefresh } from 'react-icons/md'
import Wiz_minmax from './Wiz_minmax'

const Wizzard = () => {
  const [activeTab, setActiveTab] = useState('plantStages')
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState({
    growName: '',
    plantType: '',
    startDate: '',
    targetHarvest: '',
    growingStyle: '',
    difficulty: 'beginner',
    autoSetup: false,
    // Support state
    supportCategory: '',
    supportMessage: '',
    supportSubmitted: false,
    // Debug state
    debugMode: false,
    logLevel: 'info',
    generatedLogs: [],
    // Plant stages configuration
    plantStages: {
      germination: {
        minTemp: 20,
        maxTemp: 25,
        minHumidity: 70,
        maxHumidity: 85,
        minVPD: 0.6,
        maxVPD: 0.8,
        minLight: 0,
        maxLight: 30
      },
      clones: {
        minTemp: 22,
        maxTemp: 26,
        minHumidity: 65,
        maxHumidity: 80,
        minVPD: 0.7,
        maxVPD: 0.9,
        minLight: 30,
        maxLight: 50
      },
      earlyVeg: {
        minTemp: 23,
        maxTemp: 27,
        minHumidity: 55,
        maxHumidity: 70,
        minVPD: 0.8,
        maxVPD: 1.0,
        minLight: 50,
        maxLight: 70
      },
      midVeg: {
        minTemp: 24,
        maxTemp: 28,
        minHumidity: 50,
        maxHumidity: 65,
        minVPD: 0.8,
        maxVPD: 1.2,
        minLight: 70,
        maxLight: 85
      },
      lateVeg: {
        minTemp: 24,
        maxTemp: 28,
        minHumidity: 45,
        maxHumidity: 60,
        minVPD: 0.9,
        maxVPD: 1.3,
        minLight: 75,
        maxLight: 90
      },
      earlyFlower: {
        minTemp: 22,
        maxTemp: 26,
        minHumidity: 40,
        maxHumidity: 55,
        minVPD: 1.0,
        maxVPD: 1.4,
        minLight: 80,
        maxLight: 95
      },
      midFlower: {
        minTemp: 22,
        maxTemp: 26,
        minHumidity: 40,
        maxHumidity: 55,
        minVPD: 1.0,
        maxVPD: 1.4,
        minLight: 85,
        maxLight: 100
      },
      lateFlower: {
        minTemp: 20,
        maxTemp: 24,
        minHumidity: 35,
        maxHumidity: 50,
        minVPD: 1.2,
        maxVPD: 1.6,
        minLight: 70,
        maxLight: 85
      }
    }
  })

  const tabs = [
    {
      id: 'plantStages',
      title: 'Plant Stages',
      icon: <MdEco />,
      description: 'Configure growth stage parameters',
      steps: [
        {
          title: 'Plant Stage Configuration',
          description: 'Configure optimal parameters for each growth stage',
          component: WelcomeStep
        },
        {
          title: 'Germination Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: GerminationConfigStep
        },
        {
          title: 'Clones Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: ClonesConfigStep
        },
        {
          title: 'Early Vegetative Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: EarlyVegConfigStep
        },
        {
          title: 'Mid Vegetative Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: MidVegConfigStep
        },
        {
          title: 'Late Vegetative Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: LateVegConfigStep
        },
        {
          title: 'Early Flowering Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: EarlyFlowerConfigStep
        },
        {
          title: 'Mid Flowering Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: MidFlowerConfigStep
        },
        {
          title: 'Late Flowering Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: LateFlowerConfigStep
        },
        {
          title: 'Summary',
          description: 'Review your complete plant stage configuration',
          component: SummaryStep
        }
      ]
    },

    {
      id: 'advanced',
      title: 'Advanced',
      icon: <MdSettings />,
      description: 'Advanced system configuration',
      steps: [
        {
          title: 'Advanced Configuration',
          description: 'Configure advanced system parameters',
          component: AdvancedWelcomeStep
        },
        {
          title: 'System Settings',
          description: 'Configure system-wide settings',
          component: SystemSettingsStep
        },
        {
          title: 'Automation Rules',
          description: 'Configure automation rules and triggers',
          component: AutomationRulesStep
        }
      ]
    },

    {
      id: 'support',
      title: 'Support',
      icon: <MdContactSupport />,
      description: 'Get help and contact support',
      steps: [
        {
          title: 'Support Center',
          description: 'Get help with your OpenGrowBox',
          component: SupportWelcomeStep
        },
        {
          title: 'Category',
          description: 'Select a support category',
          component: SupportCategoryStep
        },
        {
          title: 'Message',
          description: 'Describe your issue',
          component: SupportMessageStep
        },
        {
          title: 'Submit',
          description: 'Send your support request',
          component: SupportSubmitStep
        }
      ]
    },

    {
      id: 'debug',
      title: 'Debug',
      icon: <MdBugReport />,
      description: 'Debug logs and system info',
      steps: [
        {
          title: 'Debug Settings',
          description: 'Configure debug options',
          component: DebugSettingsStep
        },
        {
          title: 'Log Viewer',
          description: 'View and analyze logs',
          component: LogViewerStep
        },
        {
          title: 'Generate Report',
          description: 'Generate debug report',
          component: DebugReportStep
        }
      ]
    }
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const steps = activeTabData.steps

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateWizardData = (data) => {
    setWizardData(prev => ({ ...prev, ...data }))
  }

  const CurrentStepComponent = steps[currentStep].component

  const switchTab = (tabId) => {
    setActiveTab(tabId)
    setCurrentStep(0)
  }

  return (
    <WizardContainer>
      <WizardHeader>
        <TabNavigation>
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => switchTab(tab.id)}
            >
              <TabIcon>{tab.icon}</TabIcon>
              <TabContent>
                <TabTitle>{tab.title}</TabTitle>
                <TabDescription>{tab.description}</TabDescription>
              </TabContent>
            </Tab>
          ))}
        </TabNavigation>

        <StepIndicator>
          {steps.map((_, index) => (
            <StepDot
              key={index}
              active={index === currentStep}
              completed={index < currentStep}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </StepIndicator>
        <ProgressInfo>
          <StepTitle>{steps[currentStep].title}</StepTitle>
          <StepDescription>{steps[currentStep].description}</StepDescription>
        </ProgressInfo>
      </WizardHeader>

      <WizardContent>
        <CurrentStepComponent 
          data={wizardData} 
          updateData={updateWizardData}
          nextStep={nextStep}
          prevStep={prevStep}
        />
      </WizardContent>

      <WizardFooter>
        <Button
          variant="secondary"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <MdArrowBack /> Back
        </Button>
        
        <div className="step-info">
          Step {currentStep + 1} of {steps.length}
        </div>

        <Button
          variant="primary"
          onClick={nextStep}
        >
          {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          {currentStep < steps.length - 1 && <MdArrowForward />}
        </Button>
      </WizardFooter>
    </WizardContainer>
  )
}

// Welcome Step Component
const WelcomeStep = ({ nextStep }) => (
  <StepContent>
    <WelcomeIcon>
      <MdEco size={64} />
    </WelcomeIcon>
    <h2>Plant Stage Configuration</h2>
    <p>This wizard will guide you through setting up optimal environmental parameters for each plant growth stage.</p>
    <FeaturesList>
      <FeatureItem>
        <MdThermostat />
        <span>PlantStage Config Control</span>
      </FeatureItem>
    </FeaturesList>
    <p>Let's configure your plant stages for optimal growth conditions.</p>
  </StepContent>
)

// Germination Stage Configuration Component
const GerminationConfigStep = ({ data, updateData, nextStep }) => (
  <Wiz_minmax
    stage="germination"
    stageName="Germination"
    icon={<MdEco />}
    data={data}
    updateData={updateData}
  />
)

// Clones Stage Configuration Component
const ClonesConfigStep = ({ data, updateData, nextStep }) => (
  <Wiz_minmax
    stage="clones"
    stageName="Clones"
    icon={<MdLocalFlorist />}
    data={data}
    updateData={updateData}
  />
)

// Early Vegetative Stage Configuration Component
const EarlyVegConfigStep = ({ data, updateData, nextStep }) => (
  <Wiz_minmax
    stage="earlyVeg"
    stageName="Early Vegetative"
    icon={<MdGrass />}
    data={data}
    updateData={updateData}
  />
)

// Mid Vegetative Stage Configuration Component
const MidVegConfigStep = ({ data, updateData, nextStep }) => (
  <Wiz_minmax
    stage="midVeg"
    stageName="Mid Vegetative"
    icon={<MdGrass />}
    data={data}
    updateData={updateData}
  />
)

// Late Vegetative Stage Configuration Component
const LateVegConfigStep = ({ data, updateData, nextStep }) => (
  <Wiz_minmax
    stage="lateVeg"
    stageName="Late Vegetative"
    icon={<MdGrass />}
    data={data}
    updateData={updateData}
  />
)

// Early Flowering Stage Configuration Component
const EarlyFlowerConfigStep = ({ data, updateData, nextStep }) => (
  <Wiz_minmax
    stage="earlyFlower"
    stageName="Early Flowering"
    icon={<MdSpa />}
    data={data}
    updateData={updateData}
  />
)

// Mid Flowering Stage Configuration Component
const MidFlowerConfigStep = ({ data, updateData, nextStep }) => (
  <Wiz_minmax
    stage="midFlower"
    stageName="Mid Flowering"
    icon={<MdSpa />}
    data={data}
    updateData={updateData}
  />
)

// Late Flowering Stage Configuration Component
const LateFlowerConfigStep = ({ data, updateData, nextStep }) => (
  <Wiz_minmax
    stage="lateFlower"
    stageName="Late Flowering"
    icon={<MdSpa />}
    data={data}
    updateData={updateData}
  />
)


const TemperatureControlStep = ({ data, updateData }) => (
  <StepContent>
    <h3>Temperature Control Configuration</h3>
    <p>Configure the temperature control system parameters.</p>
    <Wiz_minmax
      stage="germination"
      stageName="Temperature"
      icon={<MdThermostat />}
      data={data}
      updateData={updateData}
      showDescription={false}
    />
  </StepContent>
)

const HumidityControlStep = ({ data, updateData }) => (
  <StepContent>
    <h3>Humidity Control Configuration</h3>
    <p>Configure the humidity control system parameters.</p>
    <Wiz_minmax
      stage="seedling"
      stageName="Humidity"
      icon={<MdOpacity />}
      data={data}
      updateData={updateData}
      showDescription={false}
    />
  </StepContent>
)

const LightControlStep = ({ data, updateData }) => (
  <StepContent>
    <h3>Light Control Configuration</h3>
    <p>Configure the light control system parameters.</p>
    <Wiz_minmax
      stage="vegetative"
      stageName="Light"
      icon={<MdLightMode />}
      data={data}
      updateData={updateData}
      showDescription={false}
    />
  </StepContent>
)

// Advanced Tab Components
const AdvancedWelcomeStep = ({ nextStep }) => (
  <StepContent>
    <WelcomeIcon>
      <MdSettings size={64} />
    </WelcomeIcon>
    <h2>Advanced Configuration</h2>
    <p>This wizard will guide you through advanced system configuration options.</p>
    <FeaturesList>
      <FeatureItem>
        <MdSettings />
        <span>Soon....</span>
      </FeatureItem>
    </FeaturesList>
    <p>Configure advanced system parameters for enhanced performance.</p>
  </StepContent>
)

const SystemSettingsStep = ({ data, updateData }) => (
  <StepContent>
    <h3>System Settings</h3>
    <p>Configure system-wide settings and parameters.</p>
    <p>This section will contain system configuration options.</p>
  </StepContent>
)

const AutomationRulesStep = ({ data, updateData }) => (
  <StepContent>
    <h3>Automation Rules</h3>
    <p>Configure automation rules and triggers for your system.</p>
    <p>This section will contain automation configuration options.</p>
  </StepContent>
)

// ============================================
// SUPPORT TAB COMPONENTS
// ============================================

const supportCategories = [
  { id: 'technical', label: 'Technical Issue', icon: <MdSettings />, description: 'Hardware or software problems' },
  { id: 'account', label: 'Account & Billing', icon: <MdSettings />, description: 'Login, subscription, or payment issues' },
  { id: 'feature', label: 'Feature Request', icon: <MdLightMode />, description: 'Suggest new features or improvements' },
  { id: 'bug', label: 'Bug Report', icon: <MdBugReport />, description: 'Report a bug or unexpected behavior' },
  { id: 'other', label: 'Other', icon: <MdHelp />, description: 'Anything else we can help with' }
]

const SupportWelcomeStep = () => (
  <StepContent>
    <WelcomeIcon>
      <MdContactSupport size={64} />
    </WelcomeIcon>
    <h2>Support Center</h2>
    <p>We're here to help! Choose a category below to get the support you need.</p>
    <FeaturesList>
      <FeatureItem>
        <MdHelp />
        <span>Browse FAQs</span>
      </FeatureItem>
      <FeatureItem>
        <MdEmail />
        <span>Contact Support</span>
      </FeatureItem>
      <FeatureItem>
        <MdBugReport />
        <span>Report Issues</span>
      </FeatureItem>
    </FeaturesList>
    <p>Select a category to continue...</p>
  </StepContent>
)

const SupportCategoryStep = ({ data, updateData }) => (
  <StepContent>
    <h3>Select a Category</h3>
    <p>Choose the category that best describes your issue:</p>
    <CategoryGrid>
      {supportCategories.map(category => (
        <CategoryCard 
          key={category.id}
          selected={data.supportCategory === category.id}
          onClick={() => updateData({ supportCategory: category.id })}
        >
          <CategoryIcon>{category.icon}</CategoryIcon>
          <CategoryLabel>{category.label}</CategoryLabel>
          <CategoryDescription>{category.description}</CategoryDescription>
        </CategoryCard>
      ))}
    </CategoryGrid>
  </StepContent>
)

const SupportMessageStep = ({ data, updateData }) => (
  <StepContent>
    <h3>Describe Your Issue</h3>
    <p>Please provide details about your issue:</p>
    <MessageTextarea
      value={data.supportMessage}
      onChange={(e) => updateData({ supportMessage: e.target.value })}
      placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, and what you expected to happen..."
      rows={8}
    />
    <CharCount>{data.supportMessage.length} / 2000 characters</CharCount>
  </StepContent>
)

const SupportSubmitStep = ({ data, updateData }) => {
  const handleSubmit = () => {
    // In a real app, this would send to an API
    updateData({ supportSubmitted: true })
    alert('Support request submitted successfully! We will get back to you soon.')
  }

  if (data.supportSubmitted) {
    return (
      <StepContent>
        <WelcomeIcon style={{ background: 'rgba(0, 255, 0, 0.2)' }}>
          <MdCheck size={64} style={{ color: '#00ff00' }} />
        </WelcomeIcon>
        <h2>Request Submitted!</h2>
        <p>Thank you for contacting us. Our support team will review your request and get back to you as soon as possible.</p>
        <SubmitSummary>
          <SummaryRow>
            <span>Category:</span>
            <strong>{supportCategories.find(c => c.id === data.supportCategory)?.label}</strong>
          </SummaryRow>
          <SummaryRow>
            <span>Message:</span>
            <MessagePreview>{data.supportMessage.substring(0, 100)}...</MessagePreview>
          </SummaryRow>
        </SubmitSummary>
      </StepContent>
    )
  }

  return (
    <StepContent>
      <h3>Review & Submit</h3>
      <p>Please review your support request before submitting:</p>
      
      <SubmitSummary>
        <SummaryRow>
          <span>Category:</span>
          <strong>{supportCategories.find(c => c.id === data.supportCategory)?.label || 'Not selected'}</strong>
        </SummaryRow>
        <SummaryRow>
          <span>Message:</span>
          <MessagePreview>{data.supportMessage || 'No message provided'}</MessagePreview>
        </SummaryRow>
      </SubmitSummary>

      <SubmitButton 
        onClick={handleSubmit}
        disabled={!data.supportCategory || !data.supportMessage}
      >
        <MdEmail /> Submit Support Request
      </SubmitButton>
    </StepContent>
  )
}

// ============================================
// DEBUG TAB COMPONENTS
// ============================================

const logLevels = [
  { id: 'debug', label: 'Debug', color: '#9b59b6' },
  { id: 'info', label: 'Info', color: '#3498db' },
  { id: 'warning', label: 'Warning', color: '#f39c12' },
  { id: 'error', label: 'Error', color: '#e74c3c' }
]

const DebugSettingsStep = ({ data, updateData }) => (
  <StepContent>
    <h3>Debug Settings</h3>
    <p>Configure debug options and log levels:</p>
    
    <SettingGroup>
      <SettingLabel>
        <span>Debug Mode</span>
        <ToggleSwitch>
          <ToggleInput 
            type="checkbox" 
            checked={data.debugMode}
            onChange={(e) => updateData({ debugMode: e.target.checked })}
          />
          <ToggleSlider />
        </ToggleSwitch>
      </SettingLabel>
      <SettingDescription>Enable detailed logging for troubleshooting</SettingDescription>
    </SettingGroup>

    <SettingGroup>
      <SettingLabel>Log Level</SettingLabel>
      <LogLevelButtons>
        {logLevels.map(level => (
          <LogLevelButton
            key={level.id}
            selected={data.logLevel === level.id}
            color={level.color}
            onClick={() => updateData({ logLevel: level.id })}
          >
            {level.label}
          </LogLevelButton>
        ))}
      </LogLevelButtons>
      <SettingDescription>Filter logs by severity level</SettingDescription>
    </SettingGroup>
  </StepContent>
)

const LogViewerStep = ({ data, updateData }) => {
  const sampleLogs = [
    { time: '2024-01-15 10:30:45', level: 'info', source: 'OGB', message: 'System started successfully' },
    { time: '2024-01-15 10:30:46', level: 'info', source: 'HA', message: 'Connected to Home Assistant' },
    { time: '2024-01-15 10:31:00', level: 'warning', source: 'OGB', message: 'Temperature sensor delay detected' },
    { time: '2024-01-15 10:31:15', level: 'error', source: 'HA', message: 'Entity sensor.temp_1 unavailable' },
    { time: '2024-01-15 10:32:00', level: 'info', source: 'OGB', message: 'Automation triggered: Light schedule' },
    { time: '2024-01-15 10:32:30', level: 'debug', source: 'OGB', message: 'VPD calculation: 1.2 kPa' },
    { time: '2024-01-15 10:33:00', level: 'error', source: 'HA', message: 'Unexpected error in climate control' },
    { time: '2024-01-15 10:33:15', level: 'warning', source: 'OGB', message: 'Humidity outside target range' },
  ]

  const filteredLogs = sampleLogs.filter(log => {
    const levelPriority = { debug: 0, info: 1, warning: 2, error: 3 }
    return levelPriority[log.level] >= levelPriority[data.logLevel]
  })

  const downloadLogs = () => {
    const logText = filteredLogs.map(l => `[${l.time}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`).join('\n')
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ogb-debug-logs-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    updateData({ generatedLogs: [] })
  }

  return (
    <StepContent>
      <h3>Log Viewer</h3>
      <LogActions>
        <ActionBtn onClick={downloadLogs}>
          <MdDownload /> Export Logs
        </ActionBtn>
        <ActionBtn onClick={clearLogs} secondary>
          <MdDelete /> Clear
        </ActionBtn>
      </LogActions>
      
      <LogContainer>
        {filteredLogs.map((log, index) => (
          <LogEntry key={index} level={log.level}>
            <LogTime>{log.time}</LogTime>
            <LogLevel level={log.level}>{log.level.toUpperCase()}</LogLevel>
            <LogSource>[{log.source}]</LogSource>
            <LogMessage>{log.message}</LogMessage>
          </LogEntry>
        ))}
      </LogContainer>
    </StepContent>
  )
}

const DebugReportStep = ({ data, updateData }) => {
  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      debugMode: data.debugMode,
      logLevel: data.logLevel,
      systemInfo: {
        appVersion: '1.0.0',
        haVersion: '2024.1.0',
        browser: navigator.userAgent,
        platform: navigator.platform
      },
      recentErrors: [
        { time: '10:33:15', source: 'HA', error: 'Unexpected error in climate control' },
        { time: '10:31:15', source: 'HA', error: 'Entity sensor.temp_1 unavailable' }
      ],
      warnings: [
        { time: '10:33:15', source: 'OGB', warning: 'Humidity outside target range' },
        { time: '10:31:00', source: 'OGB', warning: 'Temperature sensor delay detected' }
      ]
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ogb-debug-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <StepContent>
      <WelcomeIcon>
        <MdBugReport size={64} />
      </WelcomeIcon>
      <h3>Generate Debug Report</h3>
      <p>Create a comprehensive debug report including:</p>
      <ReportFeatures>
        <ReportFeature><MdCheck style={{ color: 'var(--primary-accent)' }} /> System configuration</ReportFeature>
        <ReportFeature><MdCheck style={{ color: 'var(--primary-accent)' }} /> Recent error logs</ReportFeature>
        <ReportFeature><MdCheck style={{ color: 'var(--primary-accent)' }} /> Warning messages</ReportFeature>
        <ReportFeature><MdCheck style={{ color: 'var(--primary-accent)' }} /> Device states</ReportFeature>
        <ReportFeature><MdCheck style={{ color: 'var(--primary-accent)' }} /> Automation history</ReportFeature>
      </ReportFeatures>

      <SubmitButton onClick={generateReport}>
        <MdDownload /> Generate & Download Report
      </SubmitButton>
      
      <p style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
        This report can be attached to support requests for faster troubleshooting.
      </p>
    </StepContent>
  )
}



// Summary Step Component
const SummaryStep = ({ data }) => {
  const { plantStages } = data

  return (
    <StepContent>
      <h3>Complete Plant Stage Configuration</h3>
      <p>Your OpenGrowBox is now configured with optimized plant stage parameters.</p>

      <StagesSummary>
        {Object.entries(plantStages).map(([stage, config]) => (
          <StageSummaryCard key={stage}>
            <StageTitle>{stage.charAt(0).toUpperCase() + stage.slice(1)} Stage</StageTitle>
            <StageParams>
              <ParamRow>
                <span>Temperature:</span>
                <span>{config.minTemp}°C - {config.maxTemp}°C</span>
              </ParamRow>
              <ParamRow>
                <span>Humidity:</span>
                <span>{config.minHumidity}% - {config.maxHumidity}%</span>
              </ParamRow>
              <ParamRow>
                <span>VPD:</span>
                <span>{config.minVPD} kPa - {config.maxVPD} kPa</span>
              </ParamRow>
              <ParamRow>
                <span>Light:</span>
                <span>{config.minLight}% - {config.maxLight}%</span>
              </ParamRow>
            </StageParams>
          </StageSummaryCard>
        ))}
      </StagesSummary>

      <CompleteMessage>
        <h4><MdCheck style={{ marginRight: '0.5rem', color: 'var(--primary-accent)' }} />Configuration Complete!</h4>
        <p>Your OpenGrowBox will now automatically monitor and adjust environmental conditions based on these plant stage parameters.</p>
        <p>The system will detect the current growth stage and optimize lighting, temperature, humidity, and VPD accordingly.</p>
      </CompleteMessage>
    </StepContent>
  )
}


// Styled Components
const WizardContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
  background: var(--main-bg-card-color, rgba(53, 50, 50, 0.29));
  border-radius: 16px;
  overflow: hidden;
`

const WizardHeader = styled.div`
  padding: 1rem;
  background: var(--main-bg-nav-color, rgba(23, 21, 47, 0.95));
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
`

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const StepDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => 
    props.completed ? 'var(--primary-accent, #00ff00)' : 
    props.active ? 'var(--main-text-color, #fff)' : 
    'var(--second-text-color, rgba(255, 255, 255, 0.5))'};
  cursor: ${props => props.active ? 'pointer' : 'default'};
  transition: all 0.3s ease;
`

const ProgressInfo = styled.div`
  text-align: center;
`

const StepTitle = styled.h3`
  margin: 0 0 0.3rem 0;
  color: var(--main-text-color, #fff);
  font-size: 1rem;
  font-weight: 600;
`

const StepDescription = styled.p`
  margin: 0;
  color: var(--second-text-color, rgba(255, 255, 255, 0.7));
  font-size: 0.8rem;
`

const WizardContent = styled.div`
  flex: 1;
  padding: 1rem 1rem 3rem 1rem;
  overflow-y: auto;
`

const WizardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--main-bg-nav-color, rgba(23, 21, 47, 0.95));
  border-top: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));

  .step-info {
    color: var(--second-text-color, rgba(255, 255, 255, 0.7));
    font-size: 0.8rem;
  }
`

const Button = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => 
    props.variant === 'primary' ? 
    'var(--primary-button-color, var(--primary-accent))' : 
    'var(--glass-bg-secondary, rgba(255, 255, 255, 0.08))'};
  color: ${props => 
    props.variant === 'primary' ? 
    'var(--main-text-color, #fff)' : 
    'var(--main-text-color, rgba(255, 255, 255, 0.8))'};

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    font-size: 0.85rem;
  }
`

const StepContent = styled.div`
  h2, h3, h4 {
    margin: 0 0 0.75rem 0;
    color: var(--main-text-color, #fff);
    font-size: 1rem;
  }

  p {
    margin: 0 0 0.75rem 0;
    color: var(--second-text-color, rgba(255, 255, 255, 0.8));
    line-height: 1.5;
    font-size: 0.85rem;
  }

  ul {
    margin: 0 0 0.75rem 0;
    padding-left: 1rem;
    color: var(--second-text-color, rgba(255, 255, 255, 0.8));
  }

  li {
    margin-bottom: 0.25rem;
    font-size: 0.85rem;
  }
`

const WelcomeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--primary-accent, rgba(0, 255, 0, 0.2));
  border-radius: 50%;
  margin: 0 auto 2rem;
  color: var(--primary-accent, #00ff00);
`

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
  border-radius: 8px;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  color: var(--main-text-color, #fff);
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
    background: var(--glass-bg-primary, rgba(255, 255, 255, 0.1));
  }

  &::placeholder {
    color: var(--second-text-color, rgba(255, 255, 255, 0.5));
  }
`

const CompleteIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--primary-accent, rgba(0, 255, 0, 0.2));
  border-radius: 50%;
  margin: 0 auto 2rem;
  color: var(--primary-accent, #00ff00);
`

const Summary = styled.div`
  margin: 2rem 0;
  padding: 1rem;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
`

const SummaryItem = styled.div`
  margin-bottom: 0.5rem;
  color: var(--second-text-color, rgba(255, 255, 255, 0.8));
`

const RangeInput = styled.div`
  margin-bottom: 0.5rem;
  
  label {
    display: block;
    margin-bottom: 0.25rem;
    color: var(--main-text-color, #fff);
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  input[type="range"] {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: var(--glass-border, rgba(255, 255, 255, 0.2));
    outline: none;
    -webkit-appearance: none;
    
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--primary-accent, var(--main-unit-color));
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        transform: scale(1.2);
        background: var(--primary-accent, var(--main-unit-color));
      }
    }
    
    &::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--primary-accent, var(--main-unit-color));
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      
      &:hover {
        transform: scale(1.2);
      }
    }
  }
  
  .value-display {
    text-align: center;
    color: var(--second-text-color, rgba(255, 255, 255, 0.7));
    font-size: 0.75rem;
    margin-top: 0.25rem;
    font-weight: 600;
  }
`


const StagesSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin: 1rem 0 2rem 0;
`

const StageSummaryCard = styled.div`
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  padding: 0.6rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--primary-accent, var(--main-unit-color));
    transform: translateY(-1px);
    background: var(--glass-bg-primary, rgba(255, 255, 255, 0.08));
  }
`

const StageTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: var(--primary-accent, var(--main-unit-color));
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const StageParams = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const ParamRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  
  span:first-child {
    color: var(--second-text-color, rgba(255, 255, 255, 0.7));
    font-size: 0.75rem;
  }
  
  span:last-child {
    color: var(--main-text-color, #fff);
    font-size: 0.75rem;
    font-weight: 600;
  }
`

const CompleteMessage = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--primary-accent, rgba(255, 255, 255, 0.2));
  border-radius: 8px;
  text-align: center;
  
  h4 {
    margin: 0 0 0.75rem 0;
    color: var(--primary-accent, var(--main-unit-color));
    font-size: 0.9rem;
  }
  
  p {
    margin: 0 0 0.5rem 0;
    color: var(--second-text-color, rgba(255, 255, 255, 0.8));
    line-height: 1.4;
    font-size: 0.8rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`

const FeaturesList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  border-radius: 8px;
  
  svg {
    color: var(--primary-accent, var(--main-unit-color));
    font-size: 1.2rem;
  }
  
  span {
    color: var(--main-text-color, #fff);
    font-size: 0.9rem;
    font-weight: 500;
  }
`

// Tab Navigation Styled Components
const TabNavigation = styled.div`
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  padding-bottom: 0.75rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.25rem;
  }
`

const Tab = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => 
    props.active ? 
    'var(--glass-bg-primary, rgba(255, 255, 255, 0.1))' : 
    'transparent'};
  border: 1px solid ${props => 
    props.active ? 
    'var(--primary-accent, rgba(255, 255, 255, 0.2))' : 
    'transparent'};
  
  &:hover {
    background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
    border-color: var(--glass-border, rgba(255, 255, 255, 0.2));
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.5rem;
  }
`

const TabIcon = styled.div`
  color: ${props => 
    props.active ? 
    'var(--primary-accent, var(--main-unit-color))' : 
    'var(--second-text-color, rgba(255, 255, 255, 0.6))'};
  font-size: 1rem;
  transition: color 0.3s ease;
`

const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`

const TabTitle = styled.div`
  color: var(--main-text-color, #fff);
  font-size: 0.8rem;
  font-weight: 600;
  transition: color 0.3s ease;
`

const TabDescription = styled.div`
  color: var(--second-text-color, rgba(255, 255, 255, 0.6));
  font-size: 0.7rem;
  transition: color 0.3s ease;
`

// ============================================
// SUPPORT TAB STYLED COMPONENTS
// ============================================

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0;
`

const CategoryCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: ${props => props.selected 
    ? 'var(--glass-bg-primary, rgba(255, 255, 255, 0.15))' 
    : 'var(--glass-bg-secondary, rgba(255, 255, 255, 0.05))'};
  border: 2px solid ${props => props.selected 
    ? 'var(--primary-accent, #00ff00)' 
    : 'var(--glass-border, rgba(255, 255, 255, 0.1))'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary-accent, #00ff00);
    background: var(--glass-bg-primary, rgba(255, 255, 255, 0.1));
  }
`

const CategoryIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--primary-accent, #00ff00);
`

const CategoryLabel = styled.div`
  color: var(--main-text-color, #fff);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`

const CategoryDescription = styled.div`
  color: var(--second-text-color, rgba(255, 255, 255, 0.7));
  font-size: 0.7rem;
  line-height: 1.3;
`

const MessageTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
  border-radius: 8px;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  color: var(--main-text-color, #fff);
  font-size: 0.85rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
    background: var(--glass-bg-primary, rgba(255, 255, 255, 0.1));
  }

  &::placeholder {
    color: var(--second-text-color, rgba(255, 255, 255, 0.5));
  }
`

const CharCount = styled.div`
  text-align: right;
  font-size: 0.75rem;
  color: var(--second-text-color, rgba(255, 255, 255, 0.5));
  margin-top: 0.25rem;
`

const SubmitSummary = styled.div`
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
`

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;

  &:last-child {
    margin-bottom: 0;
  }

  span {
    color: var(--second-text-color, rgba(255, 255, 255, 0.7));
    font-size: 0.8rem;
    min-width: 80px;
  }

  strong {
    color: var(--main-text-color, #fff);
    font-size: 0.85rem;
    text-align: right;
  }
`

const MessagePreview = styled.div`
  color: var(--main-text-color, #fff);
  font-size: 0.8rem;
  text-align: right;
  max-width: 200px;
  word-break: break-word;
`

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: var(--primary-accent, #00ff00);
  color: #000;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    font-size: 1.1rem;
  }
`

// ============================================
// DEBUG TAB STYLED COMPONENTS
// ============================================

const SettingGroup = styled.div`
  margin-bottom: 1.5rem;
`

const SettingLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--main-text-color, #fff);
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`

const SettingDescription = styled.div`
  color: var(--second-text-color, rgba(255, 255, 255, 0.6));
  font-size: 0.75rem;
  margin-top: 0.25rem;
`

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
`

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: var(--primary-accent, #00ff00);
  }

  &:checked + span:before {
    transform: translateX(24px);
  }
`

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--glass-border, rgba(255, 255, 255, 0.2));
  transition: 0.3s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
`

const LogLevelButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`

const LogLevelButton = styled.button`
  padding: 0.4rem 0.75rem;
  border: 1px solid ${props => props.color};
  border-radius: 6px;
  background: ${props => props.selected ? props.color : 'transparent'};
  color: ${props => props.selected ? '#fff' : props.color};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.color};
    color: #fff;
  }
`

const LogActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
  border-radius: 6px;
  background: ${props => props.secondary 
    ? 'transparent' 
    : 'var(--glass-bg-secondary, rgba(255, 255, 255, 0.1))'};
  color: var(--main-text-color, #fff);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--glass-bg-primary, rgba(255, 255, 255, 0.15));
  }

  svg {
    font-size: 1rem;
  }
`

const LogContainer = styled.div`
  background: var(--glass-bg-secondary, rgba(0, 0, 0, 0.3));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.75rem;
`

const LogEntry = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.05));
  color: var(--main-text-color, #fff);
  
  &:last-child {
    border-bottom: none;
  }
`

const LogTime = styled.span`
  color: var(--second-text-color, rgba(255, 255, 255, 0.5));
  min-width: 140px;
`

const LogLevel = styled.span`
  min-width: 60px;
  font-weight: 600;
  color: ${props => {
    switch(props.level) {
      case 'error': return '#e74c3c';
      case 'warning': return '#f39c12';
      case 'info': return '#3498db';
      case 'debug': return '#9b59b6';
      default: return '#fff';
    }
  }};
`

const LogSource = styled.span`
  color: var(--second-text-color, rgba(255, 255, 255, 0.7));
  min-width: 40px;
`

const LogMessage = styled.span`
  flex: 1;
  word-break: break-word;
`

const ReportFeatures = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0 1.5rem 0;
`

const ReportFeature = styled.div`
  color: var(--second-text-color, rgba(255, 255, 255, 0.8));
  font-size: 0.85rem;
`

export default Wizzard