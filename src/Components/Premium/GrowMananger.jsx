
import { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from "styled-components";
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { usePremium } from '../Context/OGBPremiumContext';
import { MdStart, MdRestartAlt, MdStopCircle } from "react-icons/md"
import { ChevronDown, Thermometer, Droplets, Zap, Leaf, Flower2, Lock, Globe, Check, X, Trash2, Edit2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { FaSeedling} from "react-icons/fa";

const GrowManager = ({newPlan}) => {
  const { entities, currentRoom } = useHomeAssistant();
  const { growPlans, delGrowPlan, publicGrowPlans, privateGrowPlans, activateGrowPlan, activeGrowPlan, getGrowPlans,resumeGrowPlan,pauseGrowPlan } = usePremium();

  const [isOpen, setIsOpen] = useState(false);
  const [strainName, setStrainName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  
  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlanName, setEditedPlanName] = useState('');
  const [editedStartDate, setEditedStartDate] = useState('');
  const [editedStrainName, setEditedStrainName] = useState('');

  const [confirmAction, setConfirmAction] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activationError, setActivationError] = useState('');

  const [managerState,setManagerState] = useState("")

  const roomKey = useMemo(() => currentRoom.toLowerCase(), [currentRoom]);

  const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <ModalBackdrop>
      <ModalBox>
        <ModalMessage>{message}</ModalMessage>
        <ModalButtons>
          <ModalButton onClick={onConfirm}><Check size={18} /> Yes</ModalButton>
          <ModalButtonCancel onClick={onCancel}><X size={18} /> No</ModalButtonCancel>
        </ModalButtons>
      </ModalBox>
    </ModalBackdrop>
  );

  // Update plans when context data changes
  const { allPlans, matchingPublicPlans, matchingPrivatePlans } = useMemo(() => {
    const norm = (s) => (s ?? '').trim().toLowerCase();
    
    const allPlansRaw = [
      ...(privateGrowPlans || []),
      ...(publicGrowPlans || []),
    ];

    const normalized = allPlansRaw.map((plan, idx) => {
      const sName = plan.strainName ?? plan.strain_name ?? '';
      const displayName = plan.plan_name ?? plan.name ?? 'Unnamed';
      
      // ✅ Prüfe ob Plan in privateGrowPlans ist = gehört mir
      const isOwnPlan = privateGrowPlans.some(p => 
        String(p.id ?? p.uuid) === String(plan.id ?? plan.uuid)
      );
      
      return {
        ...plan,
        id: String(plan.id ?? plan.uuid ?? `${displayName}-${idx}`),
        strainName: sName,
        _strainNorm: norm(sName),
        _displayName: displayName,
        start_date: plan.start_date ?? '',
        is_public: Boolean(plan.is_public),
        isOwnPlan: isOwnPlan, // ✅ Flag ob Plan mir gehört
      };
    });

    const strainNorm = norm(strainName);
    const isFiltering = Boolean(strainNorm);
    const matching = normalized.filter(p => isFiltering ? p._strainNorm === strainNorm : true);
    const ordered = isFiltering ? matching : normalized;
    const publicMatch = ordered.filter(p => p.is_public);
    const privateMatch = ordered.filter(p => !p.is_public);

    return {
      allPlans: ordered,
      matchingPublicPlans: publicMatch,
      matchingPrivatePlans: privateMatch,
    };
  }, [growPlans, privateGrowPlans, publicGrowPlans, strainName]);

  const title = useMemo(() => `${strainName || 'Unnamed'} - Grow Manager`, [strainName]);


  useEffect(() => {
    getGrowPlans();
  }, []);

  useEffect(() => {
    getGrowPlans();
  }, [newPlan]);


  // Get strain name from Home Assistant entity
  useEffect(() => {
    const strainSensor = entities[`text.ogb_strainname_${roomKey}`];
    if (strainSensor) {
      setStrainName(strainSensor.state);
    }
  }, [entities, roomKey]);

  // Update activePlan when activeGrowPlan from context changes
  useEffect(() => {
    setActivePlan(activeGrowPlan || null);
    setManagerState("Active")
  }, [activeGrowPlan]);

  // Monitor plan list changes and deselect if deleted
  useEffect(() => {
    if (selectedPlan && allPlans.length >= 0) {
      const stillExists = allPlans.find(p => String(p.id) === String(selectedPlan.id));
      if (!stillExists) {
        setSelectedPlan(null);
        setIsEditing(false);
      }
    }
  }, [allPlans, selectedPlan]);

  const handlePlanChange = (e) => {
    const planId = String(e.target.value);
    const plan = allPlans.find(p => String(p.id) === planId);
    if (!plan) return;

    setSelectedPlan(plan);
    setEditedPlanName(plan.plan_name || plan.name || plan._displayName || '');
    setEditedStartDate(plan.start_date || '');
    setEditedStrainName(plan.strainName || plan.strain_name || '');
    setIsEditing(false);
    setActivationError('');
  };

  const handleEditToggle = () => {
    if (!isEditing && selectedPlan) {
      setEditedPlanName(selectedPlan.plan_name || selectedPlan.name || '');
      setEditedStartDate(selectedPlan.start_date || '');
      setEditedStrainName(selectedPlan.strainName || selectedPlan.strain_name || '');
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedPlan) {
      setEditedPlanName(selectedPlan.plan_name || selectedPlan.name || '');
      setEditedStartDate(selectedPlan.start_date || '');
      setEditedStrainName(selectedPlan.strainName || selectedPlan.strain_name || '');
    }
  };

  const handlePlanActivation = async () => {
    if (!selectedPlan) return;

    setActivationError('');

    // ✅ Validiere Start Date
    if (!editedStartDate && !selectedPlan.start_date) {
      setActivationError("You need to set a Start Date");
      return;
    }

    const planToActivate = {
      id: selectedPlan.id,
      uuid: selectedPlan.uuid,
      plan_name: editedPlanName || selectedPlan.plan_name || selectedPlan.name,
      growPlanName: editedPlanName || selectedPlan.plan_name || selectedPlan.name,
      start_date: editedStartDate || selectedPlan.start_date,
      strain_name: editedStrainName || selectedPlan.strainName || selectedPlan.strain_name,
      strainName: editedStrainName || selectedPlan.strainName || selectedPlan.strain_name,
      weeks: selectedPlan.weeks || [],
      room: currentRoom,
      is_public: selectedPlan.is_public || false,
      total_weeks: selectedPlan.total_weeks || selectedPlan.weeks?.length || 0,
    };

    try {
      setIsLoading(true);
      
      // ✅ Temporär aus dem Array entfernen (optimistic update)
      setSelectedPlan(null);
      setEditedPlanName('');
      setEditedStartDate('');
      setEditedStrainName('');
      setIsEditing(false);
      
      // API call starten
      await activateGrowPlan(planToActivate, currentRoom);
      setActivePlan(planToActivate)
      console.log('Plan activation successful');
      
      // Lade Pläne neu
      await getGrowPlans();

      // Warte kurz damit Backend antwortet
      await new Promise(resolve => setTimeout(resolve,30));

      // Modal schließen
      setShowConfirm(false);
      setConfirmAction(null);
      setActivationError('');
      
    } catch (error) {
      console.error('Plan activation failed:', error);
      setActivationError(error?.message || 'Error activating plan. Please check the console.');
      // Bei Fehler könnte man hier den Plan zurück laden
      await getGrowPlans();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanDelete = async () => {
    if (!selectedPlan) return;

    const isActive = activePlan && selectedPlan.id === activePlan.id;

    if (isActive) {
      const confirmDelete = window.confirm('This is your active plan. Are you sure you want to delete it?');
      if (!confirmDelete) return;
    }

    try {
      setIsLoading(true);
      
      // ✅ Temporär aus dem Array entfernen (optimistic update)
      setSelectedPlan(null);
      setEditedPlanName('');
      setEditedStartDate('');
      setEditedStrainName('');
      setIsEditing(false);
      
      // API call starten
      await delGrowPlan(selectedPlan, currentRoom);
      console.log('Plan deletion successful');

      // Lade Pläne neu vom Backend
      await getGrowPlans();
       
      // Warte kurz
      await new Promise(resolve => setTimeout(resolve, 30));
      

      // Modal schließen
      setShowConfirm(false);
      setConfirmAction(null);
      setActivationError('');
      
    } catch (error) {
      console.error('Plan deletion failed:', error);
      setActivationError(error?.message || 'Error deleting plan');
      // Bei Fehler könnte man hier den Plan zurück laden
      await getGrowPlans();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanPause = async () => {

      const isActive = activePlan && activePlan.id === activePlan.id;

      if (isActive) {
        const confirmDelete = window.confirm('This is your active plan. Are you sure you want to pause it?');
        if (!confirmDelete) return;
      }

      // API call starten
      await pauseGrowPlan(activePlan, currentRoom);
     setManagerState("Inactive")
     console.log(managerState)
  }

  const handlePlanResume = async () => {
    const isActive = activePlan && activePlan.id === activePlan.id;

    if (isActive) {
      const confirmDelete = window.confirm('This is your Paused plan. Are you sure you want to Resume it?');
      if (!confirmDelete) return;
    }

    await resumeGrowPlan(activePlan, currentRoom);
    setManagerState("Active")
    console.log(managerState)
  }


  // Get current date in YYYY-MM-DD format for date input
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const confirmActivate = () => {
    setConfirmAction('activate');
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    setConfirmAction('delete');
    setShowConfirm(true);
  };

  const disableManager = async () => {
    if(managerState == "") return;
    await handlePlanPause()
  };


  const resumeManager = async () => {
    if(managerState == "") return;
    await handlePlanResume()
  };


  return (
    <Container $isOpen={isOpen}>
      <Header onClick={() => setIsOpen((prev) => !prev)}>
        <TitleSection>
          <Title>{title}</Title>
          <Subtitle>Your Plans: {matchingPrivatePlans.length}</Subtitle>
          <Subtitle>Public Plans: {matchingPublicPlans.length}</Subtitle>
          <Subtitle>Total Plans: {allPlans.length}</Subtitle>
        </TitleSection>

        <ToggleIcon $isOpen={isOpen}>
          <ChevronDown />
        </ToggleIcon>
      </Header>

      {isOpen && (
        <Content>
          <PlansHeader>
            <ManagerActionContainer>
              {strainName && (
                <StrainInfo>Current Strain: <strong>{strainName}</strong></StrainInfo>
              )}

                <ManagerStop onClick={() => disableManager()}><MdStopCircle /></ManagerStop>
                <ManagerPause onClick={() => resumeManager()}><MdRestartAlt /></ManagerPause>
            </ManagerActionContainer>

            {activePlan && (
              <>
                <StrainInfo>Current Active Plan: <strong>{activePlan.growPlanName || activePlan.plan_name || activePlan.name}</strong></StrainInfo>
                <br />
                <StrainInfo>Start Date: <strong>{activePlan.start_date || 'Not set'}</strong></StrainInfo>
              </>
            )}
          </PlansHeader>

          {isLoading ? (
            <InfoText>
              Loading plans for <FaSeedling color="green" size={20} />{" "}
              <a>{strainName}</a> <FaSeedling color="green" size={20} /> <Spinner />
            </InfoText>
          ) : allPlans.length === 0 ? (
            <InfoText>
              No plans found for this Strain.
              {strainName && ` Try creating a plan for strain "${strainName}".`}
            </InfoText>
          ) : (
            <>
              <Label htmlFor="plan-select">Select a plan ({allPlans.length} available):</Label>
              <Select
                id="plan-select"
                onChange={handlePlanChange}
                value={selectedPlan?.id || ''}>
                <option value="" disabled>Select a plan...</option>
                {allPlans.map(plan => (
                  <option key={String(plan.id)} value={String(plan.id)}>
                    {plan.plan_name || plan.name || plan._displayName} – {plan.strainName || plan.strain_name || 'Unknown'}
                    {plan.is_public ? ' 🌐' : ' 🔒'}
                    {(plan.strainName && strainName && plan.strainName.trim().toLowerCase() === strainName.trim().toLowerCase()) ? ' ✅ matches strain' : ''}
                  </option>
                ))}
              </Select>

              {selectedPlan && (
                <PlanDetails>
                  <PlanHeader>
                    <HeaderRow>
                      Selected Plan: <strong>{selectedPlan.plan_name || selectedPlan.name}</strong>
                      <EditToggleButton onClick={handleEditToggle}>
                        {isEditing ? '✏️ Save' : '✏️ Edit'}
                      </EditToggleButton>
                    </HeaderRow>
                  </PlanHeader>

                  {activationError && (
                    <ErrorMessage>{activationError}</ErrorMessage>
                  )}

                  <PlanInfo>
                    <InfoRow>
                      <strong>Plan Name:</strong>
                      {isEditing ? (
                        <EditInput
                          type="text"
                          value={editedPlanName}
                          onChange={(e) => setEditedPlanName(e.target.value)}
                          placeholder="Enter plan name"
                        />
                      ) : (
                        <span>{editedPlanName || selectedPlan.plan_name || selectedPlan.name || selectedPlan._displayName || 'Unknown'}</span>
                      )}
                    </InfoRow>

                    <InfoRow>
                      <strong>Strain:</strong>
                      {isEditing ? (
                        <EditInput
                          type="text"
                          value={editedStrainName}
                          onChange={(e) => setEditedStrainName(e.target.value)}
                          placeholder="Enter strain name"
                        />
                      ) : (
                        <span>{editedStrainName || selectedPlan.strainName || selectedPlan.strain_name || 'Unknown'}</span>
                      )}
                    </InfoRow>

                    <InfoRow>
                      <strong>Start Date:</strong>
                      {isEditing ? (
                        <EditInput
                          type="date"
                          value={editedStartDate}
                          onChange={(e) => setEditedStartDate(e.target.value)}
                          min={getCurrentDate()}
                        />
                      ) : (
                        <span>{editedStartDate || selectedPlan.start_date || 'Not set'}</span>
                      )}
                    </InfoRow>

                    <InfoRow>
                      <strong>Total Weeks:</strong> {selectedPlan.total_weeks || selectedPlan.weeks?.length || 'Unknown'}
                    </InfoRow>
                    <InfoRow>
                      <strong>Room:</strong> {selectedPlan.room || currentRoom}
                    </InfoRow>
                    {selectedPlan.is_active === true ? (
                      <InfoRow>
                        <strong>Status:</strong> <ActiveBadge><CheckCircle2 size={16} /> ACTIVE PLAN </ActiveBadge>
                      </InfoRow>
                    ) : (<>
                      <InfoRow>
                        <strong>Status:</strong> <ActiveBadge><AlertCircle size={16} /> INACTIVE PLAN</ActiveBadge>
                      </InfoRow>
                    </>)}
                  </PlanInfo>

                  {selectedPlan.weeks && selectedPlan.weeks.length > 0 && (
                    <WeeksContainer>
                      <WeeksHeader>
                        <strong>Weeks Overview:</strong> {selectedPlan.weeks.length} weeks configured
                      </WeeksHeader>
                      <WeeksGrid>
                        {selectedPlan.weeks.map((week, index) => (
                          <WeekCard key={`week-${week.week || index + 1}`}>
                            <WeekTitle>
                              Week {week.week || index + 1}
                            </WeekTitle>

                            <WeekSection>
                              <SectionTitle><Thermometer size={18} /> Clima</SectionTitle>
                              <ParameterGrid>
                                <Parameter>
                                  <ParameterLabel>Temp:</ParameterLabel>
                                  <ParameterValue>{week.temperature || 0}°C</ParameterValue>
                                </Parameter>
                                <Parameter>
                                  <ParameterLabel>Humidity:</ParameterLabel>
                                  <ParameterValue>{week.humidity || 0}%</ParameterValue>
                                </Parameter>
                                <Parameter>
                                  <ParameterLabel>VPD:</ParameterLabel>
                                  <ParameterValue>{week.vpd || 0}</ParameterValue>
                                </Parameter>
                                <Parameter>
                                  <ParameterLabel>CO₂:</ParameterLabel>
                                  <ParameterValue>{week.co2 || 0} ppm</ParameterValue>
                                </Parameter>
                              </ParameterGrid>
                              <ControlsGrid>
                                <ControlBadge $active={week.co2Control}>
                                  {week.co2Control ? <Check size={14} /> : <X size={14} />} CO₂ Control
                                </ControlBadge>
                                <ControlBadge $active={week.nightVPDHold}>
                                  {week.nightVPDHold ? <Check size={14} /> : <X size={14} />} Night VPD Hold
                                </ControlBadge>
                              </ControlsGrid>
                            </WeekSection>

                            <WeekSection>
                              <SectionTitle><Zap size={18} /> Lightning</SectionTitle>
                              <ParameterGrid>
                                <Parameter>
                                  <ParameterLabel>Start:</ParameterLabel>
                                  <ParameterValue>{week.lightStart || 'N/A'}</ParameterValue>
                                </Parameter>
                                <Parameter>
                                  <ParameterLabel>End:</ParameterLabel>
                                  <ParameterValue>{week.lightEnd || 'N/A'}</ParameterValue>
                                </Parameter>
                                <Parameter>
                                  <ParameterLabel>Intensity:</ParameterLabel>
                                  <ParameterValue>{week.lightIntensity || 0}%</ParameterValue>
                                </Parameter>
                              </ParameterGrid>

                              <ControlsGrid>
                                <ControlBadge $active={week.isDimmable}>
                                  {week.isDimmable ? <Check size={14} /> : <X size={14} />} isDimmable
                                </ControlBadge>
                                <ControlBadge $active={week.sunPhases}>
                                  {week.sunPhases ? <Check size={14} /> : <X size={14} />} Sonnenphases
                                </ControlBadge>
                                {(() => {
                                  const [startH, startM] = (week.lightStart || '00:00').split(':').map(Number);
                                  const [endH, endM] = (week.lightEnd || '00:00').split(':').map(Number);

                                  let duration = (endH + endM / 60) - (startH + startM / 60);
                                  if (duration < 0) duration += 24;

                                  const isVeg = duration >= 14;

                                  return (
                                    <ControlBadge $active={isVeg}>
                                      {isVeg ? <Leaf size={14} /> : <Flower2 size={14} />} {isVeg ? 'VEG' : 'Flower'} Phase
                                    </ControlBadge>
                                  );
                                })()}
                              </ControlsGrid>
                            </WeekSection>

                            <WeekSection>
                              <SectionTitle><Droplets size={18} /> Nutrients</SectionTitle>
                              <ParameterGrid>
                                <Parameter>
                                  <ParameterLabel>A:</ParameterLabel>
                                  <ParameterValue>{week.A || 0}</ParameterValue>
                                </Parameter>
                                <Parameter>
                                  <ParameterLabel>B:</ParameterLabel>
                                  <ParameterValue>{week.B || 0}</ParameterValue>
                                </Parameter>
                                <Parameter>
                                  <ParameterLabel>C:</ParameterLabel>
                                  <ParameterValue>{week.C || 0}</ParameterValue>
                                </Parameter>
                                <Parameter>
                                  <ParameterLabel>EC:</ParameterLabel>
                                  <ParameterValue>{week.EC || 0}</ParameterValue>
                                </Parameter>
                                <Parameter>
                                  <ParameterLabel>pH:</ParameterLabel>
                                  <ParameterValue>{week.PH || 0}</ParameterValue>
                                </Parameter>
                              </ParameterGrid>
                              <ControlsGrid>
                                <ControlBadge $active={week.feedControl}>
                                  {week.feedControl ? <Check size={14} /> : <X size={14} />} Feed Control
                                </ControlBadge>
                              </ControlsGrid>
                            </WeekSection>
                          </WeekCard>
                        ))}
                      </WeeksGrid>
                    </WeeksContainer>
                  )}

                  <ButtonGroup>
                    {isEditing ? (
                      <>
                        <CancelButton onClick={handleCancelEdit}>
                          Cancel
                        </CancelButton>
                      </>
                    ) : (
                      <>
                        <ActivateButton onClick={confirmActivate} disabled={isLoading}>
                          {isLoading ? 'Loading...' : 'Activate Plan'}
                        </ActivateButton>
                        {selectedPlan?.isOwnPlan && (
                          <DeleteButton onClick={confirmDelete} disabled={isLoading}>
                            {isLoading ? 'Loading...' : 'Delete Plan'}
                          </DeleteButton>
                        )}
                      </>
                    )}
                  </ButtonGroup>

                  {showConfirm && (
                    <ConfirmModal
                      message={
                        confirmAction === 'activate'
                          ? <>
                            <p>Do you really want to activate this plan?</p>
                            <h3>{editedPlanName}</h3>
                            <p>
                              Start: <strong>{editedStartDate || selectedPlan.start_date}</strong>
                            </p>
                            <p>
                              Duration: <strong>{selectedPlan.weeks?.length || 0} weeks</strong>
                            </p>
                            <p>Please make sure all settings are correct.</p>
                          </>
                          : <>
                            <p>Do you really want to delete this plan?</p>
                            <h3>{selectedPlan.plan_name || selectedPlan.name}</h3>
                            <p><strong>This action cannot be undone.</strong></p>
                            <p><strong>Your plan is smoked away then.</strong></p>
                          </>
                      }
                      onConfirm={async () => {
                        setShowConfirm(false);
                        setConfirmAction(null);

                        if (confirmAction === 'activate') {
                          await handlePlanActivation();
                        } else {
                          await handlePlanDelete();
                        }
                      }}
                      onCancel={() => {
                        setShowConfirm(false);
                        setConfirmAction(null);
                      }}
                    />
                  )}
                </PlanDetails>
              )}
            </>
          )}
        </Content>
      )}
    </Container>
  );
};

export default GrowManager;

// --- STYLED COMPONENTS ---

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 95%;
  margin: 0 auto;
  padding: 1rem;
  border-radius: 1rem;
  background: var(--main-bg-card-color);
  color: var(--main-text-color);
  box-shadow: var(--main-shadow-art);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #f1f5f9;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  position: relative;


  
  @media (min-width: 1024px) {
    width: 90%;
    max-width: 900px;
  }

  ${({ $isOpen }) => `
    max-height: ${$isOpen ? 'none' : '8rem'};
    overflow: ${$isOpen ? 'visible' : 'hidden'};
  `}

  @media (min-width: 768px) {
    padding: 2rem;
    border-radius: 24px;
    ${({ $isOpen }) => `
      max-height: ${$isOpen ? '50%' : '7rem'};
    `}
  }
  @media (min-width: 1600px) {
    max-width: 1500px; /* optional, verhindert zu große Container auf Ultrawidescreens */
  }

  `;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(56, 189, 248, 0.2);
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-bottom-color: rgba(56, 189, 248, 0.4);
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
`;

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  
  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  
  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const ToggleIcon = styled.span`
  font-size: 1.25rem;
  transition: transform 0.3s ease;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }

  ${({ $isOpen }) => $isOpen && `
    transform: rotate(180deg);
  `}
`;

const ChevronIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

const Content = styled.div`
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative; 
  z-index: 1; 
`;

const PlansHeader = styled.div`
  margin-bottom: 1rem;
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #38bdf8;
  }
`;

const StrainInfo = styled.div`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  flex:1;
  strong {
    color: #10b981;
  }
`;

const InfoText = styled.div`
  display: flex;
  align-items: right;
  justiy-content:center;
  gap: 6px;
  font-size: 1rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  display: block;
  color: rgba(255, 255, 255, 0.8);
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  background: #1e293b;
  color: #f1f5f9;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;

  /* Verhindert, dass die Options nach oben scrollen */
  option {
    background: #1e293b;
    color: #f1f5f9;
    padding: 0.5rem;
  }

  &:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
  }
`;

const PlanDetails = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.1);
`;

const PlanHeader = styled.div`
  font-size: 1rem;
  margin-bottom: 1rem;
  color: #38bdf8;
`;

const HeaderRow = styled.div`
  display: flex;
  font-size:1.3rem;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const EditToggleButton = styled.button`
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(56, 189, 248, 0.2);
    border-color: rgba(56, 189, 248, 0.5);
  }
`;

const PlanInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem 2rem;
  width: 100%;

  @media (max-width: 700px) {
  grid-template-columns: repeat(2, 1fr);
  }
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.75rem;
  width: 100%;
  align-items: center;
  font-size: 0.9rem;

  strong {
    text-align: left;
    color: #e2e8f0;
    font-weight: 600;
    white-space: nowrap;
  }

  span,
  input {
    text-align: left;
    color: #cbd5e1;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    strong {
      text-align: left;
    }
  }
`;

const EditInput = styled.input`
  background: #1e293b;
  color: #f1f5f9;
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  flex: 1;
  max-width: 8.5rem;

  /* Browser Datepicker Icon – weiß machen */
  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 1;
  }

  &:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
  }
`;

const ActiveBadge = styled.span`
  color: #10b981;
  font-weight: 500;
`;

const WeeksContainer = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const WeeksHeader = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
  
  strong {
    color: #38bdf8;
  }
`;

const WeeksGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 0.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    max-height: 800px;
  }

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(56, 189, 248, 0.5);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(56, 189, 248, 0.7);
  }
`;

const WeekCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.08));
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(56, 189, 248, 0.4);
    box-shadow: 0 4px 20px rgba(56, 189, 248, 0.1);
    transform: translateY(-2px);
  }
`;

const WeekTitle = styled.h4`
  color: #38bdf8;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-align: center;
  padding: 0.5rem;
  background: rgba(56, 189, 248, 0.1);
  border-radius: 8px;
`;

const WeekSection = styled.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ParameterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const Parameter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ParameterLabel = styled.span`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
`;

const ParameterValue = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: #10b981;
  margin-top: 0.2rem;
`;

const ControlsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const ControlBadge = styled.div`
  font-size: 0.7rem;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;
  
  ${({ $active }) => $active ? `
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  ` : `
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.2);
  `}
`;

const ButtonGroup = styled.div`
  display: flex;
  margin-top:2rem;
  gap: 5rem;
  flex-wrap: wrap;
`;

const ActivateButton = styled.button`
  flex:1;  
  background-color: #4ade80;
  color: black;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #22c55e;
    transform: scale(1.03);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
  }

  &:active {
    background-color: #16a34a;
    transform: scale(0.98);
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  flex:1;
  background-color: #f87171;
  color: black;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #ef4444;
    transform: scale(1.03);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
  }

  &:active {
    background-color: #dc2626;
    transform: scale(0.98);
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  background-color: #6b7280;
  color: white;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #4b5563;
    transform: scale(1.03);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
  }

  &:active {
    background-color: #374151;
    transform: scale(0.98);
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const ModalBox = styled.div`
  background: #1c1c1c;
  color: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
`;

const ModalMessage = styled.p`
  margin-bottom: 20px;
  font-size: 1rem;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
`;

const ModalButton = styled.button`
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  &:hover { background: #43a047; }
`;

const ModalButtonCancel = styled(ModalButton)`
  background: #f44336;
  &:hover { background: #d32f2f; }
`;

const ManagerActionContainer = styled.div`
  display: flex;
  justify-content: flex-end; /* Schiebt den Content nach rechts */
  align-items: center; /* optional, saubere vertikale Ausrichtung */
  gap: 1.3em;
  font-size: 2rem;
  z-index: 100;

  @media (max-width: 768px) {
    font-size: 1rem;
    gap: 0.7rem;
  }
`;

const ManagerStart = styled.div`
padding:0.2rem;
cursor:pointer;
color:green;
  &:hover {
    transform: scale(1.15);
    opacity: 0.85;
  }
`
const ManagerPause = styled.div`
padding:0.2rem;
cursor:pointer;
color:yellow;
  &:hover {
    transform: scale(1.15);
    opacity: 0.85;
  }
`
const ManagerStop = styled.div`
padding:0.2rem;
cursor:pointer;
color:red;
  &:hover {
    transform: scale(1.15);
    opacity: 0.85;
  }
`
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 128, 0, 0.3);
  border-top: 2px solid green;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin-left: 6px;
  vertical-align: middle;
`;
