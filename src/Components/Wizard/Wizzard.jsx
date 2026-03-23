import React, { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { motion, } from 'framer-motion'
import { MdCheck, MdArrowForward, MdArrowBack, MdEco, MdLocalFlorist, MdSpa, MdGrass, MdWaterDrop, MdLightMode, MdThermostat, MdOpacity, MdSettings, MdTune, MdDeviceThermostat, MdContactSupport, MdBugReport, MdHelp, MdEmail, MdDownload, MdDelete, MdRefresh, MdNotifications, MdDevices, MdLabel, MdEdit, MdSave, MdSearch, MdClose, MdAutoAwesome, MdList, MdOutlineLabel, MdWindPower } from 'react-icons/md'
import Wiz_minmax from './Wiz_minmax'
import { usePremium } from '../Context/OGBPremiumContext'
import { useHomeAssistant } from '../Context/HomeAssistantContext'
import {
  PRIVATE_SUPPORT_URL,
  UI_VERSION,
  PLANT_CONFIG_EVENT,
  PLANT_CONFIG_RESULT_EVENT,
  SAVE_PLANT_CONFIG_EVENT,
  SAVE_PLANT_CONFIG_RESULT_EVENT,
  allSupportCategories,
  getSupportRoute,
  getSupportCategoryLabel,
  buildGitHubIssueUrl,
  formatStageName,
  createDefaultPlantStages,
  mergePlantAndLightStages,
  normalizeRemotePlantStages,
} from './wizardHelpers'
import { createPlantStagesStepComponents } from './steps/plantStagesSteps'
import { createSupportStepComponents } from './steps/supportSteps'
import { createDebugStepComponents } from './steps/debugSteps'
import { createSetupStepComponents } from './steps/setupSteps'

const capitalize = (str) => {
  if (typeof str !== 'string') return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const Wizzard = ({ onComplete }) => {
  const { currentPlan, subscription, isLoggedIn, userEmail, userId } = usePremium()
  const { connection, currentRoom } = useHomeAssistant()
  const contentRef = useRef(null)
  const pendingPlantConfigRequestRef = useRef(null)
  const plantConfigTimeoutRef = useRef(null)
  const currentPlantConfigRequestRef = useRef(null)
  const pendingSavePlantConfigRequestRef = useRef(null)
  const savePlantConfigTimeoutRef = useRef(null)
  const completionTimeoutRef = useRef(null)
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
    supportSummary: '',
    supportMessage: '',
    supportExpectedBehavior: '',
    supportActualBehavior: '',
    supportReproductionSteps: '',
    supportSubmitted: false,
    supportSubmitError: '',
    supportSubmitTarget: '',
    supportSuccessTitle: '',
    supportSuccessMessage: '',
    // Debug state
    debugMode: false,
    logLevel: 'info',
    generatedLogs: [],
    // Plant stages configuration
    plantStageMode: '',
    autoPlantStageStatus: 'idle',
    autoPlantStageError: '',
    autoPlantStageSource: '',
    currentPlantStageSource: '',
    currentPlantStageLabel: '',
    currentPlantStages: null,
    currentPlantStageStatus: 'idle',
    plantConfigRequestId: '',
    plantConfigSaveStatus: 'idle',
    plantConfigSaveError: '',
    wizardSuccessMessage: '',
    plantStages: createDefaultPlantStages()
  })

  const plantStageStepsFactory = createPlantStagesStepComponents({
    Wiz_minmax,
    icons: { MdEco, MdThermostat, MdTune, MdRefresh, MdLocalFlorist, MdGrass, MdSpa, MdCheck },
    helpers: { formatStageName, createDefaultPlantStages },
    styles: {
      StepContent,
      WelcomeIcon,
      PlantStageModeGrid,
      PlantStageModeCard,
      PlantStageModeIcon,
      PlantStageModeTitle,
      PlantStageModeDescription,
      CurrentConfigCard,
      CurrentConfigLabel,
      CurrentConfigValue,
      CurrentConfigHint,
      CurrentConfigSummary,
      CurrentConfigSummaryItem,
      AutoConfigCard,
      AutoConfigStatus,
      AutoConfigMeta,
      AutoConfigButton,
      SupportErrorText,
      LoadedConfigPreview,
      LoadedConfigTitle,
      LoadedConfigText,
      StagesSummary,
      StageSummaryCard,
      StageTitle,
      StageParams,
      ParamRow,
      SubmitSummary,
      SummaryRow,
      CompleteMessage,
    },
  })

  const supportStepsFactory = createSupportStepComponents({
    icons: { MdContactSupport, MdHelp, MdCheck, MdEmail },
    helpers: { getSupportRoute, getSupportCategoryLabel, buildGitHubIssueUrl, PRIVATE_SUPPORT_URL, UI_VERSION },
    styles: {
      StepContent,
      WelcomeIcon,
      SupportPlanNotice,
      SupportPlanBadge,
      SupportPlanText,
      SupportHelpCard,
      SupportHelpText,
      SupportHelpTitle,
      SupportHelpDescription,
      FaqButton,
      SupportSectionTitle,
      SupportSectionDescription,
      CategoryGrid,
      CategoryCard,
      CategoryIcon,
      CategoryLabel,
      CategoryDescription,
      CategoryRouteTag,
      CategoryLockTag,
      SupportHint,
      SupportFieldGroup,
      SupportFieldLabel,
      SupportInput,
      MessageTextarea,
      CharCount,
      SubmitSummary,
      SummaryRow,
      MessagePreview,
      SupportPublicNotice,
      SupportErrorText,
      SubmitButton,
    },
    supportContext: { currentRoom, userEmail, userId },
  })

  const debugStepsFactory = createDebugStepComponents({
    icons: { MdDownload, MdRefresh, MdCheck },
    styles: {
      StepContent,
      SettingGroup,
      SettingLabel,
      LogContainer,
      LogEntry,
      LogTime,
      LogLevel,
      LogSource,
      LogMessage,
      LogActions,
      ActionBtn,
      ReportFeatures,
      ReportFeature,
      SubmitButton,
    },
    connection,
    currentRoom,
  })

  const setupStepsFactory = createSetupStepComponents({
    icons: { 
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
    },
    styles: {
      StepContent,
    },
    connection,
    currentRoom,
  })

  const {
    WelcomeStep: PlantWelcomeStep,
    RemotePlantStagesStep,
    SummaryStep: PlantSummaryStep,
    GerminationConfigStep,
    ClonesConfigStep,
    EarlyVegConfigStep,
    MidVegConfigStep,
    LateVegConfigStep,
    EarlyFlowerConfigStep,
    MidFlowerConfigStep,
    LateFlowerConfigStep,
  } = plantStageStepsFactory

  const {
    SupportWelcomeStep,
    SupportMessageStep,
    SupportSubmitStep,
  } = supportStepsFactory

  const {
    DebugWelcomeStep,
    LogViewerStep,
  } = debugStepsFactory

  const {
    SetupWelcomeStep,
    DeviceManagerStep,
    EntityManagerStep,
    LabelManagerStep,
    AutoSetupStep,
  } = setupStepsFactory

  const normalizedPlan = String(currentPlan || subscription?.plan_name || 'free').toLowerCase()
  const hasPrivateSupport = false // TODO: Re-enable when private support feature is ready
  const supportCategories = useMemo(
    () => allSupportCategories.map((category) => ({
      ...category,
      disabled: category.route === 'private' && !hasPrivateSupport,
    })),
    [hasPrivateSupport]
  )

  const plantStageSteps = useMemo(() => {
    const steps = [
        {
          id: 'mode',
          title: 'Plant Stage Configuration',
          description: 'Choose how OpenGrowBox should handle plant stage targets',
          component: PlantWelcomeStep,
        },
    ]

    if (wizardData.plantStageMode === 'custom') {
      steps.push(
        {
          id: 'germination',
          title: 'Germination Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: GerminationConfigStep,
        },
        {
          id: 'clones',
          title: 'Clones Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: ClonesConfigStep,
        },
        {
          id: 'earlyVeg',
          title: 'Early Vegetative Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: EarlyVegConfigStep,
        },
        {
          id: 'midVeg',
          title: 'Mid Vegetative Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: MidVegConfigStep,
        },
        {
          id: 'lateVeg',
          title: 'Late Vegetative Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: LateVegConfigStep,
        },
        {
          id: 'earlyFlower',
          title: 'Early Flowering Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: EarlyFlowerConfigStep,
        },
        {
          id: 'midFlower',
          title: 'Mid Flowering Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: MidFlowerConfigStep,
        },
        {
          id: 'lateFlower',
          title: 'Late Flowering Stage',
          description: 'Configure temperature, humidity, VPD, and light settings',
          component: LateFlowerConfigStep,
        }
      )
    }

    if (wizardData.plantStageMode === 'default' || wizardData.plantStageMode === 'live') {
      steps.push({
        id: 'remoteConfig',
        title: wizardData.plantStageMode === 'default' ? 'Default OGB Config' : 'Live Online OGB Config',
        description:
          wizardData.plantStageMode === 'default'
            ? 'Request the default OpenGrowBox plant stage profile from the integration'
            : 'Request the live online OpenGrowBox profile from the integration',
        component: RemotePlantStagesStep,
      })
    }

      steps.push({
        id: 'summary',
        title: 'Summary',
        description: 'Review your complete plant stage configuration',
        component: PlantSummaryStep,
      })

    return steps
  }, [wizardData.plantStageMode])

  const tabs = [
    {
      id: 'plantStages',
      title: 'Plant Stages',
      icon: <MdEco />,
      description: 'Configure growth stage parameters',
      steps: plantStageSteps
    },



    {
      id: 'support',
      title: 'Support',
      icon: <MdContactSupport />,
      description: 'Get help and contact support',
      steps: [
        {
          title: 'Support Center',
          description: 'Browse help resources or choose a support category',
          component: SupportWelcomeStep
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
          title: 'Debug Tools',
          description: 'Select a tool',
          component: DebugWelcomeStep
        },
        {
          title: 'Log Viewer',
          description: 'View and analyze logs',
          component: LogViewerStep
        },
      ]
    },
    {
      id: 'setup',
      title: 'Setup',
      icon: <MdDevices />,
      description: 'Manage devices and entities',
      steps: [
        {
          title: 'Setup Tools',
          description: 'Select a tool',
          component: SetupWelcomeStep
        },
        {
          title: 'Device Manager',
          description: 'View, edit, and auto-name devices',
          component: DeviceManagerStep
        },
        {
          title: 'Entity Manager',
          description: 'Manage entity names and attributes',
          component: EntityManagerStep
        },
        {
          title: 'Label Manager',
          description: 'Add and manage labels',
          component: LabelManagerStep
        },
        {
          title: 'Auto Setup',
          description: 'Auto-generate logical names',
          component: AutoSetupStep
        }
      ]
    },
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const steps = activeTabData.steps

  useEffect(() => {
    if (currentStep > steps.length - 1) {
      setCurrentStep(Math.max(0, steps.length - 1))
    }
  }, [currentStep, steps.length])

  const currentStepId = steps[currentStep]?.id
  const isNextDisabled =
    (activeTab === 'plantStages' && currentStepId === 'mode' && !wizardData.plantStageMode) ||
    (activeTab === 'plantStages' && currentStepId === 'remoteConfig' && wizardData.autoPlantStageStatus !== 'success')

  useEffect(() => {
    if (!connection) {
      return undefined
    }

    let unsubscribe

    const subscribe = async () => {
      unsubscribe = await connection.subscribeEvents((event) => {
        const data = event?.data || {}
        const requestId = data.requestId || data.request_id

        if (currentPlantConfigRequestRef.current && requestId === currentPlantConfigRequestRef.current) {
          currentPlantConfigRequestRef.current = null
          const normalizedCurrentStages = mergePlantAndLightStages(
            normalizeRemotePlantStages(data.plantStages || data.data || data.result || data),
            data.lightPlantStages
          )

          setWizardData((prev) => ({
            ...prev,
            currentPlantStageStatus: data.success && normalizedCurrentStages ? 'success' : 'error',
            currentPlantStageSource: data.activeSource || 'default',
            currentPlantStageLabel: data.source || 'OpenGrowBox Default Library',
            currentPlantStages: normalizedCurrentStages,
          }))
          return
        }

        if (!pendingPlantConfigRequestRef.current || requestId !== pendingPlantConfigRequestRef.current) {
          return
        }

        if (plantConfigTimeoutRef.current) {
          clearTimeout(plantConfigTimeoutRef.current)
          plantConfigTimeoutRef.current = null
        }

        pendingPlantConfigRequestRef.current = null

        const normalizedPlantStages = mergePlantAndLightStages(
          normalizeRemotePlantStages(data.plantStages || data.data || data.result || data),
          data.lightPlantStages
        )

        if (!data.success || !normalizedPlantStages) {
          setWizardData((prev) => ({
            ...prev,
            autoPlantStageStatus: 'error',
            autoPlantStageError: data.error || 'Could not load the requested plant config.',
          }))
          return
        }

        setWizardData((prev) => ({
          ...prev,
          plantStages: normalizedPlantStages,
          autoPlantStageStatus: 'success',
          autoPlantStageError: '',
          autoPlantStageSource:
            data.source ||
            (prev.plantStageMode === 'default' ? 'OpenGrowBox Default Library' : 'OpenGrowBox Live Library'),
        }))
      }, PLANT_CONFIG_RESULT_EVENT)

      await connection.subscribeEvents((event) => {
        const data = event?.data || {}
        const requestId = data.requestId || data.request_id

        if (!pendingSavePlantConfigRequestRef.current || requestId !== pendingSavePlantConfigRequestRef.current) {
          return
        }

        if (savePlantConfigTimeoutRef.current) {
          clearTimeout(savePlantConfigTimeoutRef.current)
          savePlantConfigTimeoutRef.current = null
        }

        pendingSavePlantConfigRequestRef.current = null

        if (!data.success) {
          setWizardData((prev) => ({
            ...prev,
            plantConfigSaveStatus: 'error',
            plantConfigSaveError: data.error || 'Could not apply the selected plant config.',
          }))
          return
        }

        const normalizedPlantStages = mergePlantAndLightStages(
          normalizeRemotePlantStages(data.plantStages || data.data || data.result || data),
          data.lightPlantStages
        )

        setWizardData((prev) => ({
          ...prev,
          plantStages: normalizedPlantStages || prev.plantStages,
          plantConfigSaveStatus: 'success',
          plantConfigSaveError: '',
          wizardSuccessMessage: 'Plant stage profile applied successfully.',
          autoPlantStageSource: data.source || prev.autoPlantStageSource,
          currentPlantStageSource: data.activeSource || prev.currentPlantStageSource,
          currentPlantStageLabel: data.source || prev.currentPlantStageLabel,
          currentPlantStages: normalizedPlantStages || prev.currentPlantStages,
          currentPlantStageStatus: 'success',
        }))
      }, SAVE_PLANT_CONFIG_RESULT_EVENT)
    }

    subscribe()

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [connection])

  useEffect(() => {
    if (!connection) {
      return
    }

    const requestId = `current-plant-config-${Date.now()}`
    currentPlantConfigRequestRef.current = requestId

    setWizardData((prev) => ({
      ...prev,
      currentPlantStageStatus: 'loading',
    }))

    connection.sendMessagePromise({
      type: 'fire_event',
      event_type: PLANT_CONFIG_EVENT,
      event_data: {
        room: currentRoom,
        mode: 'current',
        requestId,
        atTime: new Date().toISOString(),
      },
    }).catch(() => {
      currentPlantConfigRequestRef.current = null
      setWizardData((prev) => ({
        ...prev,
        currentPlantStageStatus: 'error',
      }))
    })
  }, [connection, currentRoom])

  useEffect(() => {
    if (wizardData.plantConfigSaveStatus !== 'success') {
      return undefined
    }

    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current)
    }

    completionTimeoutRef.current = setTimeout(() => {
      onComplete?.()
    }, 1200)

    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current)
        completionTimeoutRef.current = null
      }
    }
  }, [wizardData.plantConfigSaveStatus, onComplete])

  useEffect(() => {
    if (!wizardData.supportSubmitted) {
      return undefined
    }

    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current)
    }

    completionTimeoutRef.current = setTimeout(() => {
      onComplete?.()
    }, 1200)

    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current)
        completionTimeoutRef.current = null
      }
    }
  }, [wizardData.supportSubmitted, onComplete])

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [activeTab, currentStep])

  const requestPlantConfig = async (mode) => {
    if (!connection) {
      setWizardData((prev) => ({
        ...prev,
        autoPlantStageStatus: 'error',
        autoPlantStageError: 'No Home Assistant connection available right now.',
      }))
      return
    }

    const requestId = `plant-config-${mode}-${Date.now()}`
    pendingPlantConfigRequestRef.current = requestId

    if (plantConfigTimeoutRef.current) {
      clearTimeout(plantConfigTimeoutRef.current)
    }

    setWizardData((prev) => ({
      ...prev,
      autoPlantStageStatus: 'loading',
      autoPlantStageError: '',
      autoPlantStageSource: mode === 'default' ? 'OpenGrowBox Default Library' : 'OpenGrowBox Live Library',
      plantConfigRequestId: requestId,
    }))

    try {
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: PLANT_CONFIG_EVENT,
        event_data: {
          room: currentRoom,
          mode,
          requestId,
          atTime: new Date().toISOString(),
        },
      })

      plantConfigTimeoutRef.current = setTimeout(() => {
        if (pendingPlantConfigRequestRef.current !== requestId) {
          return
        }

        pendingPlantConfigRequestRef.current = null
        setWizardData((prev) => ({
          ...prev,
          autoPlantStageStatus: 'error',
          autoPlantStageError: 'No response from the integration. Please make sure OpenGrowBox was reloaded in Home Assistant and try again.',
        }))
      }, 10000)
    } catch (error) {
      pendingPlantConfigRequestRef.current = null
      setWizardData((prev) => ({
        ...prev,
        autoPlantStageStatus: 'error',
        autoPlantStageError: 'Could not request the plant config from Home Assistant.',
      }))
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const savePlantConfig = async () => {
    if (!connection) {
      setWizardData((prev) => ({
        ...prev,
        plantConfigSaveStatus: 'error',
        plantConfigSaveError: 'No Home Assistant connection available right now.',
      }))
      return
    }

    const requestId = `save-plant-config-${wizardData.plantStageMode}-${Date.now()}`
    pendingSavePlantConfigRequestRef.current = requestId

    if (savePlantConfigTimeoutRef.current) {
      clearTimeout(savePlantConfigTimeoutRef.current)
    }

    setWizardData((prev) => ({
      ...prev,
      plantConfigSaveStatus: 'loading',
      plantConfigSaveError: '',
      wizardSuccessMessage: '',
    }))

    try {
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: SAVE_PLANT_CONFIG_EVENT,
        event_data: {
          room: currentRoom,
          mode: wizardData.plantStageMode,
          requestId,
          plantStages: wizardData.plantStages,
          atTime: new Date().toISOString(),
        },
      })

      savePlantConfigTimeoutRef.current = setTimeout(() => {
        if (pendingSavePlantConfigRequestRef.current !== requestId) {
          return
        }

        pendingSavePlantConfigRequestRef.current = null
        setWizardData((prev) => ({
          ...prev,
          plantConfigSaveStatus: 'error',
          plantConfigSaveError: 'No save response from the integration. Please try again.',
        }))
      }, 10000)
    } catch (error) {
      pendingSavePlantConfigRequestRef.current = null
      setWizardData((prev) => ({
        ...prev,
        plantConfigSaveStatus: 'error',
        plantConfigSaveError: 'Could not send the selected plant config to Home Assistant.',
      }))
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

  const handlePrimaryAction = () => {
    if (activeTab === 'plantStages' && currentStep === steps.length - 1) {
      savePlantConfig()
      return
    }

    if (currentStep === steps.length - 1) {
      setWizardData((prev) => ({
        ...prev,
        wizardSuccessMessage: 'Wizard completed successfully.',
      }))
      onComplete?.()
      return
    }

    nextStep()
  }

  return (
    <WizardContainer>
      <WizardHeader>
        <TabNavigation>
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              $active={activeTab === tab.id}
              onClick={() => switchTab(tab.id)}
            >
              <TabIcon $active={activeTab === tab.id}>{tab.icon}</TabIcon>
              <TabContent>
                <TabTitle>{tab.title}</TabTitle>
                <TabDescription>{tab.description}</TabDescription>
              </TabContent>
            </Tab>
          ))}
        </TabNavigation>

        <HeaderMeta>
          <HeaderMetaChip>
            {tabs.find((tab) => tab.id === activeTab)?.title}
          </HeaderMetaChip>
        <StepIndicator>
          {steps.map((_, index) => (
            <StepDot
              key={index}
              $active={index === currentStep}
              $completed={index < currentStep}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </StepIndicator>
          <HeaderMetaText>
            Step {currentStep + 1} of {steps.length}
          </HeaderMetaText>
        </HeaderMeta>


        <ProgressInfo>
          <StepTitle>{steps[currentStep].title}</StepTitle>
          <StepDescription>{steps[currentStep].description}</StepDescription>
        </ProgressInfo>
      </WizardHeader>

      <WizardContent ref={contentRef}>
        {wizardData.wizardSuccessMessage && (
          <WizardSuccessBanner>{wizardData.wizardSuccessMessage}</WizardSuccessBanner>
        )}
        <CurrentStepComponent 
          data={wizardData} 
          updateData={updateWizardData}
          nextStep={nextStep}
          prevStep={prevStep}
          requestPlantConfig={requestPlantConfig}
          savePlantConfig={savePlantConfig}
          supportCategories={supportCategories}
          hasPrivateSupport={hasPrivateSupport}
          currentPlan={normalizedPlan}
          currentRoom={currentRoom}
          userEmail={userEmail}
          userId={userId}
          capitalize={capitalize}
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

        {!(activeTab === 'support' && currentStep === steps.length - 1) && (
          <Button
            variant="primary"
            onClick={handlePrimaryAction}
            disabled={
              isNextDisabled ||
              (activeTab === 'plantStages' &&
                (wizardData.plantConfigSaveStatus === 'loading' || wizardData.plantConfigSaveStatus === 'success'))
            }
          >
            {activeTab === 'plantStages' && currentStep === steps.length - 1
              ? wizardData.plantConfigSaveStatus === 'loading'
                ? 'Applying...'
                : wizardData.plantConfigSaveStatus === 'success'
                  ? 'Applied'
                  : 'Apply'
              : currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            {currentStep < steps.length - 1 && <MdArrowForward />}
          </Button>
        )}
      </WizardFooter>
    </WizardContainer>
  )
}

// Styled Components
const WizardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  font-family: 'Segoe UI', 'Trebuchet MS', sans-serif;
  line-height: 1.45;
  letter-spacing: 0.01em;
  background: var(--main-bg-card-color, rgba(53, 50, 50, 0.29));
  border-radius: inherit;
  overflow: hidden;
`

const WizardHeader = styled.div`
  padding: 1.15rem 1.15rem 1rem;
  background: var(--main-bg-nav-color, rgba(23, 21, 47, 0.95));
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 1rem 0.9rem 0.9rem;
  }
`

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.7rem;
`

const StepDot = styled.div`
  width: ${props => (props.$active ? '12px' : '6px')};
  height: ${props => (props.$active ? '12px' : '6px')};
  border-radius: 50%;
  background: ${props => 
    props.$completed ? 'var(--primary-accent, #00ff00)' : 
    props.$active ? 'var(--main-text-color, #fff)' : 
    'var(--second-text-color, rgba(255, 255, 255, 0.5))'};
  cursor: ${props => props.$active ? 'pointer' : 'default'};
  opacity: ${props => (props.$active || props.$completed ? 0.95 : 0.4)};
  box-shadow: ${props =>
    props.$active
      ? '0 0 0 2px rgba(255, 255, 255, 0.08)'
      : 'none'};
  transition: all 0.25s ease;
`

const ProgressInfo = styled.div`
  text-align: center;
`

const StepTitle = styled.h3`
  margin: 0 0 0.4rem 0;
  color: var(--main-text-color, #fff);
  font-size: 1.22rem;
  font-weight: 600;
  letter-spacing: -0.01em;

  @media (max-width: 768px) {
    font-size: 1.08rem;
  }
`

const StepDescription = styled.p`
  margin: 0;
  color: var(--second-text-color, rgba(255, 255, 255, 0.7));
  font-size: 0.95rem;
  line-height: 1.45;
  max-width: 58rem;
  margin-inline: auto;

  @media (max-width: 768px) {
    font-size: 0.88rem;
  }
`

const WizardContent = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  padding: 1rem;
  overflow-y: auto;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 0.85rem;
  }
`

const WizardSuccessBanner = styled.div`
  margin-bottom: 0.9rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.24);
  color: #bbf7d0;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.4;
`

const WizardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--main-bg-nav-color, rgba(23, 21, 47, 0.95));
  border-top: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  flex-shrink: 0;

  .step-info {
    color: var(--second-text-color, rgba(255, 255, 255, 0.7));
    font-size: 0.8rem;
  }

  @media (max-width: 768px) {
    gap: 0.5rem;
    flex-wrap: wrap;

    .step-info {
      order: 3;
      width: 100%;
      text-align: center;
    }
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

const PlantStageModeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin: 1.5rem 0 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const CurrentConfigCard = styled.div`
  margin-top: 1.1rem;
  padding: 0.95rem 1rem;
  border-radius: 14px;
  background: var(--glass-bg-secondary, rgba(255,255,255,0.05));
  border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
`

const CurrentConfigLabel = styled.div`
  color: var(--second-text-color, rgba(255,255,255,0.72));
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const CurrentConfigValue = styled.div`
  margin-top: 0.35rem;
  color: var(--main-text-color, #fff);
  font-size: 1rem;
  font-weight: 700;
`

const CurrentConfigHint = styled.div`
  margin-top: 0.3rem;
  color: var(--second-text-color, rgba(255,255,255,0.72));
  font-size: 0.88rem;
  line-height: 1.45;
`

const CurrentConfigSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.65rem;
  margin-top: 0.9rem;
`

const CurrentConfigSummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.7rem 0.75rem;
  border-radius: 10px;
  background: var(--glass-bg-primary, rgba(255,255,255,0.06));
  border: 1px solid var(--glass-border, rgba(255,255,255,0.08));

  strong {
    color: var(--main-text-color, #fff);
    font-size: 0.84rem;
  }

  span {
    color: var(--second-text-color, rgba(255,255,255,0.75));
    font-size: 0.8rem;
    line-height: 1.35;
  }
`

const PlantStageModeCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.7rem;
  text-align: left;
  padding: 1.1rem;
  border-radius: 14px;
  border: 1px solid ${props =>
    props.$selected
      ? 'var(--input-focus-border-color, var(--primary-accent))'
      : 'var(--glass-border, rgba(255,255,255,0.1))'};
  background: ${props =>
    props.$selected
      ? 'var(--glass-bg-primary, rgba(255,255,255,0.08))'
      : 'var(--glass-bg-secondary, rgba(255,255,255,0.04))'};
  color: var(--main-text-color, #fff);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--border-hover-color, rgba(255,255,255,0.16));
    background: var(--glass-bg-primary, rgba(255,255,255,0.08));
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.14);
  }
`

const PlantStageModeIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 12px;
  background: var(--glass-bg-primary, rgba(255,255,255,0.08));
  color: var(--primary-accent, var(--main-unit-color));
  font-size: 1.35rem;
`

const PlantStageModeTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: var(--main-text-color, #fff);
`

const PlantStageModeDescription = styled.div`
  color: var(--second-text-color, rgba(255,255,255,0.75));
  font-size: 0.9rem;
  line-height: 1.45;
`

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    background: var(--glass-bg-primary, rgba(255, 255, 255, 0.08));
    border-color: var(--border-hover-color, rgba(255, 255, 255, 0.16));
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--input-focus-border-color, var(--primary-accent));
    box-shadow: 0 0 0 3px var(--button-hover-bg, rgba(255, 255, 255, 0.08));
  }
  
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

const SupportHint = styled.p`
  margin-top: 1rem;
  color: var(--second-text-color, rgba(255, 255, 255, 0.72));
  font-size: 0.92rem;
  text-align: center;
`

// Tab Navigation Styled Components
const TabNavigation = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-bottom: 0.85rem;
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  padding-bottom: 0.85rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.35rem;
  }
`

const Tab = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.72rem 0.9rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 220px;
  max-width: 280px;
  flex: 1 1 240px;
  background: ${props => 
    props.$active ? 
    'var(--glass-bg-primary, rgba(255, 255, 255, 0.1))' : 
    'transparent'};
  border: 1px solid ${props => 
    props.$active ? 
    'var(--primary-accent, rgba(255, 255, 255, 0.2))' : 
    'rgba(255, 255, 255, 0.04)'};
  box-shadow: ${props =>
    props.$active ? '0 10px 24px rgba(0, 0, 0, 0.16)' : 'none'};
  
  &:hover {
    background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
    border-color: var(--glass-border, rgba(255, 255, 255, 0.2));
    transform: translateY(-1px);
  }
  
  @media (max-width: 768px) {
    padding: 0.65rem 0.8rem;
    min-width: 100%;
    max-width: 100%;
    flex-basis: 100%;
  }
`

const TabIcon = styled.div`
  color: ${props => 
    props.$active ? 
    'var(--primary-accent, var(--main-unit-color))' : 
    'var(--second-text-color, rgba(255, 255, 255, 0.6))'};
  font-size: 1.2rem;
  transition: color 0.3s ease, transform 0.3s ease;
  transform: ${props => (props.$active ? 'scale(1.05)' : 'none')};
`

const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`

const TabTitle = styled.div`
  color: var(--main-text-color, #fff);
  font-size: 0.96rem;
  font-weight: 700;
  transition: color 0.3s ease;
`

const TabDescription = styled.div`
  color: var(--second-text-color, rgba(255, 255, 255, 0.6));
  font-size: 0.8rem;
  line-height: 1.35;
  transition: color 0.3s ease;
`

const HeaderMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.45rem;
  }
`

const HeaderMetaChip = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.38rem 0.75rem;
  border-radius: 999px;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.12));
  color: var(--main-text-color, #fff);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const HeaderMetaText = styled.div`
  color: var(--second-text-color, rgba(255, 255, 255, 0.72));
  font-size: 0.84rem;
  font-weight: 600;
`

// ============================================
// SUPPORT TAB STYLED COMPONENTS
// ============================================

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.7rem;
  margin: 0.9rem 0 0.4rem;
`

const SupportSectionTitle = styled.h3`
  margin: 1.35rem 0 0.45rem;
  color: var(--main-text-color, #fff);
  font-size: 1.02rem;
  font-weight: 700;
`

const SupportSectionDescription = styled.p`
  margin: 0 0 0.55rem;
  color: var(--second-text-color, rgba(255, 255, 255, 0.74));
  font-size: 0.88rem;
  line-height: 1.45;
`

const SupportPlanNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`

const SupportPlanBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: var(--glass-bg-primary, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--glass-border-light, rgba(255, 255, 255, 0.14));
  color: var(--main-text-color, #fff);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const SupportPlanText = styled.div`
  color: var(--second-text-color, rgba(255, 255, 255, 0.75));
  font-size: 0.88rem;
  line-height: 1.45;
`

const SupportHelpCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem 1.1rem;
  border-radius: 14px;
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`

const SupportHelpText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`

const SupportHelpTitle = styled.div`
  color: var(--main-text-color, #fff);
  font-size: 0.96rem;
  font-weight: 700;
`

const SupportHelpDescription = styled.div`
  color: var(--second-text-color, rgba(255, 255, 255, 0.72));
  font-size: 0.88rem;
  line-height: 1.45;
`

const FaqButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.7rem 0.95rem;
  border-radius: 10px;
  text-decoration: none;
  white-space: nowrap;
  background: var(--glass-bg-primary, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--glass-border-light, rgba(255, 255, 255, 0.14));
  color: var(--main-text-color, #fff);
  font-size: 0.88rem;
  font-weight: 700;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.1));
    border-color: var(--input-focus-border-color, var(--primary-accent));
  }

  svg {
    font-size: 1rem;
    color: var(--primary-accent, var(--main-unit-color));
  }
`

const CategoryCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.35rem;
  min-height: 168px;
  padding: 0.9rem 0.8rem;
  background: ${props => props.selected 
    ? 'var(--glass-bg-primary, rgba(255, 255, 255, 0.15))' 
    : 'var(--glass-bg-secondary, rgba(255, 255, 255, 0.05))'};
  border: 2px solid ${props => props.selected 
    ? 'var(--primary-accent, #00ff00)' 
    : 'var(--glass-border, rgba(255, 255, 255, 0.1))'};
  border-radius: 12px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.disabled ? 0.58 : 1)};
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    transform: ${props => (props.disabled ? 'none' : 'translateY(-2px)')};
    border-color: ${props => (props.disabled ? 'var(--glass-border, rgba(255, 255, 255, 0.1))' : 'var(--primary-accent, #00ff00)')};
    background: ${props => (props.disabled ? 'var(--glass-bg-secondary, rgba(255, 255, 255, 0.05))' : 'var(--glass-bg-primary, rgba(255, 255, 255, 0.1))')};
  }

  @media (max-width: 768px) {
    min-height: auto;
  }
`

const CategoryLockTag = styled.span`
  margin-top: 0.2rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`

const CategoryRouteTag = styled.span`
  display: inline-flex;
  align-items: center;
  margin-top: 0.35rem;
  padding: 0.24rem 0.55rem;
  border-radius: 999px;
  background: ${props =>
    props.$route === 'github'
      ? 'rgba(96, 165, 250, 0.14)'
      : 'rgba(34, 197, 94, 0.14)'};
  border: 1px solid ${props =>
    props.$route === 'github'
      ? 'rgba(96, 165, 250, 0.24)'
      : 'rgba(34, 197, 94, 0.24)'};
  color: ${props => (props.$route === 'github' ? '#93c5fd' : '#86efac')};
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

const CategoryIcon = styled.div`
  font-size: 1.35rem;
  margin-bottom: 0.35rem;
  color: var(--primary-accent, #00ff00);
`

const CategoryLabel = styled.div`
  color: var(--main-text-color, #fff);
  font-size: 0.82rem;
  font-weight: 700;
  margin-bottom: 0.15rem;
`

const CategoryDescription = styled.div`
  color: var(--second-text-color, rgba(255, 255, 255, 0.7));
  font-size: 0.68rem;
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

const SupportFieldGroup = styled.div`
  margin-top: 1rem;
`

const SupportFieldLabel = styled.label`
  display: block;
  margin-bottom: 0.45rem;
  color: var(--main-text-color, #fff);
  font-size: 0.88rem;
  font-weight: 700;
`

const SupportInput = styled.input`
  width: 100%;
  padding: 0.85rem 0.95rem;
  border-radius: 10px;
  background: var(--input-bg-color, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--input-border-color, rgba(255, 255, 255, 0.12));
  color: var(--main-text-color, #fff);
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

const SupportErrorText = styled.div`
  margin: 0.85rem 0 0;
  padding: 0.8rem 0.9rem;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.22);
  color: #fecaca;
  font-size: 0.88rem;
  line-height: 1.45;
`

const SupportPublicNotice = styled.div`
  margin-top: 0.85rem;
  padding: 0.8rem 0.9rem;
  border-radius: 10px;
  background: rgba(96, 165, 250, 0.12);
  border: 1px solid rgba(96, 165, 250, 0.22);
  color: #bfdbfe;
  font-size: 0.86rem;
  line-height: 1.45;
`

const AutoConfigCard = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 14px;
  background: var(--glass-bg-secondary, rgba(255,255,255,0.05));
  border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
`

const AutoConfigStatus = styled.div`
  color: ${props =>
    props.$status === 'success'
      ? '#86efac'
      : props.$status === 'error'
        ? '#fca5a5'
        : 'var(--main-text-color, #fff)'};
  font-size: 1rem;
  font-weight: 700;
`

const AutoConfigMeta = styled.div`
  margin-top: 0.55rem;
  color: var(--second-text-color, rgba(255,255,255,0.75));
  font-size: 0.88rem;
  line-height: 1.45;

  strong {
    color: var(--main-text-color, #fff);
    word-break: break-word;
  }
`

const AutoConfigButton = styled.button`
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.72rem 0.95rem;
  border: 1px solid var(--glass-border-light, rgba(255,255,255,0.14));
  border-radius: 10px;
  background: var(--glass-bg-primary, rgba(255,255,255,0.08));
  color: var(--main-text-color, #fff);
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: var(--input-focus-border-color, var(--primary-accent));
  }
`

const LoadedConfigPreview = styled.div`
  margin-top: 1.25rem;
`

const LoadedConfigTitle = styled.h4`
  margin: 0 0 0.35rem;
  color: var(--main-text-color, #fff);
  font-size: 1rem;
  font-weight: 700;
`

const LoadedConfigText = styled.p`
  margin: 0 0 0.9rem;
  color: var(--second-text-color, rgba(255,255,255,0.75));
  font-size: 0.9rem;
  line-height: 1.45;
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
  background: ${props => props.$secondary 
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
