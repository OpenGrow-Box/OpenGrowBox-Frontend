import React, { useEffect } from 'react'

export const createPlantStagesStepComponents = ({
  Wiz_minmax,
  icons,
  helpers,
  styles,
}) => {
  const {
    MdEco,
    MdThermostat,
    MdTune,
    MdRefresh,
    MdLocalFlorist,
    MdGrass,
    MdSpa,
    MdCheck,
  } = icons

  const { formatStageName, createDefaultPlantStages } = helpers

  const {
    StepContent,
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
  } = styles

  const WelcomeStep = ({ data, updateData, nextStep }) => {
    const selectMode = (mode) => {
      updateData({
        plantStageMode: mode,
        autoPlantStageStatus: 'idle',
        autoPlantStageError: '',
        autoPlantStageSource:
          mode === 'default'
            ? 'OpenGrowBox Default Library'
            : mode === 'live'
              ? 'OpenGrowBox Live Library'
              : '',
        plantConfigSaveStatus: 'idle',
        plantConfigSaveError: '',
        plantStages: createDefaultPlantStages(),
      })
      nextStep()
    }

    return (
      <StepContent>
        <CurrentConfigCard>
          <CurrentConfigLabel>Currently active profile</CurrentConfigLabel>
          <CurrentConfigValue>
            {data.currentPlantStageStatus === 'loading'
              ? 'Loading active profile...'
              : data.currentPlantStageStatus === 'success'
                ? data.currentPlantStageLabel || 'OpenGrowBox Default Library'
                : 'Could not read active profile'}
          </CurrentConfigValue>
          <CurrentConfigHint>
            {data.currentPlantStageStatus === 'success'
              ? 'This is the set the integration is currently using right now.'
              : 'The wizard could not read the current active plant stage source.'}
          </CurrentConfigHint>
          {data.currentPlantStageStatus === 'success' && data.currentPlantStages && (
            <CurrentConfigSummary>
              <CurrentConfigSummaryItem>
                <strong>8 stages</strong>
                <span>Configured and active</span>
              </CurrentConfigSummaryItem>
              <CurrentConfigSummaryItem>
                <strong>
                  {Math.min(...Object.values(data.currentPlantStages).map((config) => config.minTemp))}°C -{' '}
                  {Math.max(...Object.values(data.currentPlantStages).map((config) => config.maxTemp))}°C
                </strong>
                <span>Temperature range</span>
              </CurrentConfigSummaryItem>
              <CurrentConfigSummaryItem>
                <strong>
                  {Math.min(...Object.values(data.currentPlantStages).map((config) => config.minHumidity))}% -{' '}
                  {Math.max(...Object.values(data.currentPlantStages).map((config) => config.maxHumidity))}%
                </strong>
                <span>Humidity range</span>
              </CurrentConfigSummaryItem>
              <CurrentConfigSummaryItem>
                <strong>
                  {Math.min(...Object.values(data.currentPlantStages).map((config) => config.minLight ?? 0))}% -{' '}
                  {Math.max(...Object.values(data.currentPlantStages).map((config) => config.maxLight ?? 100))}%
                </strong>
                <span>Light range</span>
              </CurrentConfigSummaryItem>
            </CurrentConfigSummary>
          )}
        </CurrentConfigCard>

        <PlantStageModeGrid>
          <PlantStageModeCard $selected={data.plantStageMode === 'default'} onClick={() => selectMode('default')}>
            <PlantStageModeIcon><MdThermostat /></PlantStageModeIcon>
            <PlantStageModeTitle>Default OGB Config</PlantStageModeTitle>
            <PlantStageModeDescription>
              Use the built-in OpenGrowBox stage targets exactly as provided by default.
            </PlantStageModeDescription>
          </PlantStageModeCard>

          <PlantStageModeCard $selected={data.plantStageMode === 'custom'} onClick={() => selectMode('custom')}>
            <PlantStageModeIcon><MdTune /></PlantStageModeIcon>
            <PlantStageModeTitle>Own PlantStage Config</PlantStageModeTitle>
            <PlantStageModeDescription>
              Adjust every stage manually with your own min/max targets for temperature, humidity, VPD, and light.
            </PlantStageModeDescription>
          </PlantStageModeCard>

          <PlantStageModeCard $selected={data.plantStageMode === 'live'} onClick={() => selectMode('live')}>
            <PlantStageModeIcon><MdRefresh /></PlantStageModeIcon>
            <PlantStageModeTitle>Live Online OGB Config</PlantStageModeTitle>
            <PlantStageModeDescription>
              Pull the latest curated OpenGrowBox stage profile from the live online config service.
            </PlantStageModeDescription>
          </PlantStageModeCard>
        </PlantStageModeGrid>
      </StepContent>
    )
  }

  const RemotePlantStagesStep = ({ data, requestPlantConfig }) => {
    const isDefaultMode = data.plantStageMode === 'default'

    useEffect(() => {
      if (data.autoPlantStageStatus === 'idle' && data.plantStageMode !== 'custom') {
        requestPlantConfig(data.plantStageMode)
      }
    }, [data.autoPlantStageStatus, data.plantStageMode, requestPlantConfig])

    return (
      <StepContent>
        <h3>{isDefaultMode ? 'Default OGB Config' : 'Live Online OGB Config'}</h3>
        <p>
          {isDefaultMode
            ? 'OpenGrowBox requests the default plant stage profile directly from the integration via Home Assistant.'
            : 'OpenGrowBox requests the live curated stage profile through the integration and applies it automatically.'}
        </p>

        <AutoConfigCard>
          <AutoConfigStatus $status={data.autoPlantStageStatus}>
            {data.autoPlantStageStatus === 'loading' && (isDefaultMode ? 'Requesting default config...' : 'Requesting live config...')}
            {data.autoPlantStageStatus === 'success' && (isDefaultMode ? 'Default config loaded successfully' : 'Live config loaded successfully')}
            {data.autoPlantStageStatus === 'error' && (isDefaultMode ? 'Default config failed to load' : 'Live config failed to load')}
            {data.autoPlantStageStatus === 'idle' && 'Ready to request config'}
          </AutoConfigStatus>

          <AutoConfigMeta>
            Source: <strong>{data.autoPlantStageSource || (isDefaultMode ? 'OpenGrowBox Default Library' : 'OpenGrowBox Live Library')}</strong>
          </AutoConfigMeta>

          {data.autoPlantStageError && <SupportErrorText>{data.autoPlantStageError}</SupportErrorText>}

          <AutoConfigButton type="button" onClick={() => requestPlantConfig(data.plantStageMode)}>
            <MdRefresh /> {isDefaultMode ? 'Retry default sync' : 'Retry live sync'}
          </AutoConfigButton>
        </AutoConfigCard>

        {data.autoPlantStageStatus === 'success' && (
          <LoadedConfigPreview>
            <LoadedConfigTitle>Loaded plant stage targets</LoadedConfigTitle>
            <LoadedConfigText>
              The profile is active in the wizard now. Review the targets below before continuing.
            </LoadedConfigText>

            <StagesSummary>
              {Object.entries(data.plantStages || {}).map(([stage, config]) => (
                <StageSummaryCard key={stage}>
                  <StageTitle>{formatStageName(stage)} Stage</StageTitle>
                  <StageParams>
                    <ParamRow><span>Temperature:</span><span>{config.minTemp}°C - {config.maxTemp}°C</span></ParamRow>
                    <ParamRow><span>Humidity:</span><span>{config.minHumidity}% - {config.maxHumidity}%</span></ParamRow>
                    <ParamRow><span>VPD:</span><span>{config.minVPD} - {config.maxVPD} kPa</span></ParamRow>
                    <ParamRow><span>Light:</span><span>{config.minLight} - {config.maxLight} PPFD</span></ParamRow>
                    <ParamRow><span>EC:</span><span>{config.minEC} - {config.maxEc} mS/cm</span></ParamRow>
                    <ParamRow><span>pH:</span><span>{config.minPh} - {config.maxPh}</span></ParamRow>
                    <ParamRow><span>CO₂:</span><span>{config.minCo2} - {config.maxCo2} ppm</span></ParamRow>
                  </StageParams>
                </StageSummaryCard>
              ))}
            </StagesSummary>
          </LoadedConfigPreview>
        )}
      </StepContent>
    )
  }

  const SummaryStep = ({ data }) => {
    const { plantStages } = data
    const modeLabel =
      data.plantStageMode === 'default'
        ? 'Default OGB Config'
        : data.plantStageMode === 'custom'
          ? 'Own PlantStage Config'
          : 'Live Online OGB Config'

    return (
      <StepContent>
        <h3>Complete Plant Stage Configuration</h3>
        <p>Your OpenGrowBox is now configured with optimized plant stage parameters.</p>

        <SubmitSummary>
          <SummaryRow><span>Mode:</span><strong>{modeLabel}</strong></SummaryRow>
          {data.autoPlantStageSource && <SummaryRow><span>Source:</span><strong>{data.autoPlantStageSource}</strong></SummaryRow>}
          <SummaryRow>
            <span>Status:</span>
            <strong>{data.plantConfigSaveStatus === 'success' ? 'Applied to integration' : data.plantConfigSaveStatus === 'loading' ? 'Applying...' : 'Ready to apply'}</strong>
          </SummaryRow>
        </SubmitSummary>

        {data.plantConfigSaveError && <SupportErrorText>{data.plantConfigSaveError}</SupportErrorText>}

        <StagesSummary>
          {Object.entries(plantStages).map(([stage, config]) => (
            <StageSummaryCard key={stage}>
              <StageTitle>{formatStageName(stage)} Stage</StageTitle>
              <StageParams>
                <ParamRow><span>Temperature:</span><span>{config.minTemp}°C - {config.maxTemp}°C</span></ParamRow>
                <ParamRow><span>Humidity:</span><span>{config.minHumidity}% - {config.maxHumidity}%</span></ParamRow>
                <ParamRow><span>VPD:</span><span>{config.minVPD} - {config.maxVPD} kPa</span></ParamRow>
                <ParamRow><span>Light:</span><span>{config.minLight} - {config.maxLight} PPFD</span></ParamRow>
                <ParamRow><span>EC:</span><span>{config.minEC} - {config.maxEc} mS/cm</span></ParamRow>
                <ParamRow><span>pH:</span><span>{config.minPh} - {config.maxPh}</span></ParamRow>
                <ParamRow><span>CO₂:</span><span>{config.minCo2} - {config.maxCo2} ppm</span></ParamRow>
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

  const GerminationConfigStep = ({ data, updateData }) => <Wiz_minmax stage="germination" stageName="Germination" icon={<MdEco />} data={data} updateData={updateData} />
  const ClonesConfigStep = ({ data, updateData }) => <Wiz_minmax stage="clones" stageName="Clones" icon={<MdLocalFlorist />} data={data} updateData={updateData} />
  const EarlyVegConfigStep = ({ data, updateData }) => <Wiz_minmax stage="earlyVeg" stageName="Early Vegetative" icon={<MdGrass />} data={data} updateData={updateData} />
  const MidVegConfigStep = ({ data, updateData }) => <Wiz_minmax stage="midVeg" stageName="Mid Vegetative" icon={<MdGrass />} data={data} updateData={updateData} />
  const LateVegConfigStep = ({ data, updateData }) => <Wiz_minmax stage="lateVeg" stageName="Late Vegetative" icon={<MdGrass />} data={data} updateData={updateData} />
  const EarlyFlowerConfigStep = ({ data, updateData }) => <Wiz_minmax stage="earlyFlower" stageName="Early Flowering" icon={<MdSpa />} data={data} updateData={updateData} />
  const MidFlowerConfigStep = ({ data, updateData }) => <Wiz_minmax stage="midFlower" stageName="Mid Flowering" icon={<MdSpa />} data={data} updateData={updateData} />
  const LateFlowerConfigStep = ({ data, updateData }) => <Wiz_minmax stage="lateFlower" stageName="Late Flowering" icon={<MdSpa />} data={data} updateData={updateData} />

  return {
    WelcomeStep,
    RemotePlantStagesStep,
    SummaryStep,
    GerminationConfigStep,
    ClonesConfigStep,
    EarlyVegConfigStep,
    MidVegConfigStep,
    LateVegConfigStep,
    EarlyFlowerConfigStep,
    MidFlowerConfigStep,
    LateFlowerConfigStep,
  }
}
