import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Zap, Sun, Euro, Settings, AlertTriangle, Calculator } from 'lucide-react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { useGlobalState } from '../Context/GlobalContext';
import EnergySummaryCard from './EnergySummaryCard';
import EnergyChart from './EnergyChart';
import EnergyCalculator from './EnergyCalculator';
import DeviceWattModal from './DeviceWattModal';
import { energyHistoryStorage, shouldSaveSnapshot } from '../../utils/energyHistoryStorage';

const STORAGE_KEY = 'opengrowbox_energy_settings';

const getEnergySettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { pricePerKwh: 0.30, deviceWatts: {} };
  } catch {
    return { pricePerKwh: 0.30, deviceWatts: {} };
  }
};

const RoomPowerSensors = () => {
  const { entities, currentRoom, connection } = useHomeAssistant();
  const { HASS } = useGlobalState();
  const [settings, setSettings] = useState(getEnergySettings());
  const [deviceSelect, setDeviceSelect] = useState("room");
  const [energyTab, setEnergyTab] = useState("monitor");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState(7);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const roomDevices = useMemo(() => {
    if (!entities) return [];

    let devices = [];

    const allDevices = Object.entries(entities)
      .filter(([key, entity]) => {
        const isRelevantType =
          (key.startsWith("switch.") ||
           key.startsWith("light.") ||
           key.startsWith("fan.") ||
           key.startsWith("climate.") ||
           key.startsWith("humidifier.") ||
           key.startsWith("input_boolean.") ||
           key.startsWith("cover.") ||
           key.startsWith("media_player.")) &&
          !key.includes("template");

        const haEntity = HASS?.entities?.[key];
        const isHidden =
          entity.hidden === true ||
          entity.hidden === "true" ||
          entity.attributes?.hidden === true ||
          entity.attributes?.hidden === "true" ||
          haEntity?.hidden === true ||
          haEntity?.hidden === "true";

        const isDisabled =
          entity.disabled === true ||
          entity.disabled === "true" ||
          entity.attributes?.disabled === true ||
          entity.attributes?.disabled === "true" ||
          haEntity?.disabled === true ||
          haEntity?.disabled === "true";

        return isRelevantType && entity.state !== "unavailable" && !isHidden && !isDisabled;
      })
      .map(([key, entity]) => {
        const domain = key.split(".")[0];
        const title = entity.attributes?.friendly_name || key.split('.').pop();
        
        const isClimateOn = domain === "climate" && entity.state !== "off" && entity.state !== "unavailable";
        const isHumidifierOn = domain === "humidifier" && entity.state === "on";
        const isOn = entity.state === "on" || isClimateOn || isHumidifierOn;

        return {
          id: key,
          title,
          entity_id: entity.entity_id,
          originalState: entity.state,
          state: isOn ? "on" : "off",
          domain,
          isOn,
        };
      });

    devices = allDevices;

    if (deviceSelect === "room" && HASS?.devices && HASS?.entities && currentRoom) {
      const devicesObj = HASS.devices;
      const haEntities = HASS.entities;

      const roomDeviceIds = Object.entries(devicesObj)
        .filter(([, device]) => device.area_id === currentRoom.toLowerCase())
        .map(([key]) => key);

      const roomEntityIds = Object.entries(haEntities)
        .filter(([, entity]) => roomDeviceIds.includes(entity.device_id))
        .map(([, entity]) => entity.entity_id);

      devices = devices.filter(device => roomEntityIds.includes(device.entity_id));
    }

    devices = devices.map(device => ({
      ...device,
      watts: settings.deviceWatts?.[device.id] || null,
    }));

    return devices;
  }, [entities, currentRoom, HASS, settings.deviceWatts, deviceSelect]);

  const totals = useMemo(() => {
    let totalWatts = 0;
    let totalDevices = 0;
    let activeDevices = 0;

    roomDevices.forEach(device => {
      totalDevices++;
      if (device.watts) {
        if (device.isOn) {
          totalWatts += device.watts;
          activeDevices++;
        }
      }
    });

    const totalKw = totalWatts / 1000;
    const hourlyKwh = totalKw;
    const dailyKwh = hourlyKwh * 24;
    const dailyCost = dailyKwh * settings.pricePerKwh;
    const monthlyCost = dailyCost * 30;

    return {
      totalWatts,
      totalKw,
      activeDevices,
      totalDevices,
      dailyKwh,
      dailyCost,
      monthlyCost,
    };
  }, [roomDevices, settings.pricePerKwh]);

  useEffect(() => {
    if (shouldSaveSnapshot()) {
      energyHistoryStorage.saveSnapshot({
        totalWatts: totals.totalWatts,
        dailyKwh: totals.dailyKwh,
        dailyCost: totals.dailyCost,
        monthlyCost: totals.monthlyCost,
        activeDevices: totals.activeDevices,
        totalDevices: totals.totalDevices,
      });
    }
  }, [totals]);

  const chartData = energyHistoryStorage.getChartData(chartPeriod);
  const sparklineData = energyHistoryStorage.getSparklineData('totalWatts');
  const costTrend = energyHistoryStorage.getTrend('dailyCost');
  const wattsTrend = energyHistoryStorage.getTrend('totalWatts');

  const handleSaveWatts = (newWatts) => {
    setSettings({
      ...settings,
      deviceWatts: newWatts
    });
  };

  const getHighConsumptionDevices = () => {
    return roomDevices
      .filter(d => d.watts && d.isOn)
      .sort((a, b) => b.watts - a.watts)
      .slice(0, 5);
  };

  const maxWatts = Math.max(...roomDevices.map(d => d.watts || 0), 1);

  return (
    <Container>
      <Header>
        <HeaderSection>
          <Title>Energy Monitor</Title>
          <Subtitle>{deviceSelect === "room" ? currentRoom || "All Rooms" : "All Devices"}</Subtitle>
        </HeaderSection>
        <HeaderControls>
          <ToggleButton
            $active={deviceSelect === "room"}
            onClick={() => setDeviceSelect("room")}
          >
            Room
          </ToggleButton>
          <ToggleButton
            $active={deviceSelect === "all"}
            onClick={() => setDeviceSelect("all")}
          >
            All
          </ToggleButton>
          <SettingsButton onClick={() => setShowAdvanced(!showAdvanced)}>
            <Settings size={18} />
          </SettingsButton>
        </HeaderControls>
      </Header>

      <EnergyTabs>
        <EnergyTab
          $active={energyTab === "monitor"}
          onClick={() => setEnergyTab("monitor")}
        >
          <Zap size={16} />
          <span>Monitor</span>
        </EnergyTab>
        <EnergyTab
          $active={energyTab === "calculator"}
          onClick={() => setEnergyTab("calculator")}
        >
          <Calculator size={16} />
          <span>Calculator</span>
        </EnergyTab>
      </EnergyTabs>

      {showAdvanced && (
        <SettingsPanel>
          <SettingRow>
            <SettingLabel>Energy Price:</SettingLabel>
            <PriceInput
              type="number"
              step="0.01"
              value={settings.pricePerKwh}
              onChange={(e) => setSettings({ ...settings, pricePerKwh: parseFloat(e.target.value) || 0 })}
            />
            <SettingUnit>€/kWh</SettingUnit>
          </SettingRow>
          <SettingRow>
            <SettingLabel>Chart Period:</SettingLabel>
            <PeriodButtons>
              <PeriodButton
                $active={chartPeriod === 7}
                onClick={() => setChartPeriod(7)}
              >
                7 Days
              </PeriodButton>
              <PeriodButton
                $active={chartPeriod === 30}
                onClick={() => setChartPeriod(30)}
              >
                30 Days
              </PeriodButton>
            </PeriodButtons>
          </SettingRow>
        </SettingsPanel>
      )}

      {energyTab === "calculator" && (
        <EnergyCalculator
          pricePerKwh={settings.pricePerKwh}
          onPriceChange={(newPrice) => setSettings({ ...settings, pricePerKwh: newPrice })}
        />
      )}

      <SummaryGrid>
        <EnergySummaryCard
          icon={Zap}
          label="Current Load"
          value={totals.totalWatts}
          unit="W"
          subtext={`${totals.activeDevices}/${totals.totalDevices} devices active`}
          color="var(--primary-accent)"
          sparklineData={sparklineData}
          trend={wattsTrend?.direction}
          trendValue={wattsTrend?.value}
        />
        <EnergySummaryCard
          icon={Sun}
          label="Daily Consumption"
          value={totals.dailyKwh.toFixed(2)}
          unit="kWh"
          subtext="24h forecast"
          color="var(--chart-warning-color)"
          sparklineData={energyHistoryStorage.getSparklineData('dailyKwh')}
        />
        <EnergySummaryCard
          icon={Euro}
          label="Cost/Day"
          value={totals.dailyCost.toFixed(2)}
          unit="€"
          subtext="Based on energy price"
          highlight
          color="var(--chart-success-color)"
          sparklineData={energyHistoryStorage.getSparklineData('dailyCost')}
          trend={costTrend?.direction}
          trendValue={costTrend?.value}
        />
        <EnergySummaryCard
          icon={Euro}
          label="Cost/Month"
          value={totals.monthlyCost.toFixed(2)}
          unit="€"
          subtext="30 Tage Prognose"
          highlight
          color="var(--secondary-accent)"
        />
      </SummaryGrid>

      {totals.dailyCost > 5 && (
        <CostWarning>
          <AlertTriangle size={20} />
          <WarningText>
            Hohe tägliche Kosten: €{totals.dailyCost.toFixed(2)}. Überprüfe deine Geräte-Einstellungen.
          </WarningText>
        </CostWarning>
      )}

      {energyTab === "calculator" && (
        <EnergyCalculator
          pricePerKwh={settings.pricePerKwh}
          onPriceChange={(newPrice) => setSettings({ ...settings, pricePerKwh: newPrice })}
        />
      )}

      {energyTab === "monitor" && (
        <>
          <SummaryGrid>
        <EnergySummaryCard
          icon={Zap}
          label="Current Load"
          value={totals.totalWatts}
          unit="W"
          subtext={`${totals.activeDevices}/${totals.totalDevices} devices active`}
          color="var(--primary-accent)"
          sparklineData={sparklineData}
          trend={wattsTrend?.direction}
          trendValue={wattsTrend?.value}
        />
        <EnergySummaryCard
          icon={Sun}
          label="Daily Consumption"
          value={totals.dailyKwh.toFixed(2)}
          unit="kWh"
          subtext="24h forecast"
          color="var(--chart-warning-color)"
          sparklineData={energyHistoryStorage.getSparklineData('dailyKwh')}
        />
        <EnergySummaryCard
          icon={Euro}
          label="Cost/Day"
          value={totals.dailyCost.toFixed(2)}
          unit="€"
          subtext="Based on energy price"
          highlight
          color="var(--chart-success-color)"
          sparklineData={energyHistoryStorage.getSparklineData('dailyCost')}
          trend={costTrend?.direction}
          trendValue={costTrend?.value}
        />
        <EnergySummaryCard
          icon={Euro}
          label="Cost/Month"
          value={totals.monthlyCost.toFixed(2)}
          unit="€"
          subtext="30 day forecast"
          highlight
          color="var(--secondary-accent)"
        />
      </SummaryGrid>

      {totals.dailyCost > 5 && (
        <CostWarning>
          <AlertTriangle size={20} />
          <WarningText>
            High daily costs: €{totals.dailyCost.toFixed(2)}. Check your device settings.
          </WarningText>
        </CostWarning>
      )}

      <ChartsSection>
        <EnergyChart
          title="Energy Consumption (kWh)"
          data={chartData.dailyKwh}
          type="line"
          height={250}
          unit=" kWh"
          color="var(--chart-warning-color)"
          showArea
          showGrid
        />
        <EnergyChart
          title="Cost Development (€)"
          data={chartData.dailyCost}
          type="line"
          height={250}
          unit=" €"
          color="var(--chart-success-color)"
          showArea
          showGrid
        />
      </ChartsSection>

      <DevicesSection>
        <SectionHeader>
          <SectionTitle>Top Consumers</SectionTitle>
          <EditAllButton onClick={() => setIsModalOpen(true)}>
            Edit All
          </EditAllButton>
        </SectionHeader>
        
        <TopConsumers>
          {getHighConsumptionDevices().map((device, index) => {
            const percentage = (device.watts / maxWatts) * 100;
            return (
              <ConsumerItem key={device.id}>
                <ConsumerInfo>
                  <ConsumerRank>{index + 1}</ConsumerRank>
                  <ConsumerDetails>
                    <ConsumerName>{device.title}</ConsumerName>
                    <ConsumerState $active={device.isOn}>
                      {device.isOn ? 'ACTIVE' : 'INACTIVE'}
                    </ConsumerState>
                  </ConsumerDetails>
                </ConsumerInfo>
                <ConsumerStats>
                  <ConsumerValue>{device.watts} W</ConsumerValue>
                  <ProgressBar>
                    <ProgressFill $percentage={percentage} $active={device.isOn} />
                  </ProgressBar>
                </ConsumerStats>
              </ConsumerItem>
            );
          })}
        </TopConsumers>

        {getHighConsumptionDevices().length === 0 && (
          <EmptyState>
            <Sun size={48} opacity={0.3} />
            <EmptyText>No active devices with watt values</EmptyText>
            <EmptySubtext>
              Click &quot;Edit All&quot; to add watt values for your devices
            </EmptySubtext>
          </EmptyState>
        )}
      </DevicesSection>
      </>
      )}

      <DeviceWattModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        devices={roomDevices}
        currentWatts={settings.deviceWatts}
        onSave={handleSaveWatts}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h2`
  margin: 0;
  color: var(--main-text-color);
  font-size: 1.5rem;
  font-weight: 700;
`;

const Subtitle = styled.span`
  color: var(--second-text-color);
  font-size: 0.85rem;
`;

const HeaderControls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ToggleButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.$active ? 'var(--primary-button-color)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'var(--primary-button-color)' : 'var(--glass-border)'};
  border-radius: 8px;
  color: ${props => props.$active ? 'white' : 'var(--second-text-color)'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;

  &:hover {
    background: ${props => props.$active ? 'var(--primary-button-color)' : 'var(--glass-bg-secondary)'};
    color: var(--main-text-color);
  }
`;

const SettingsButton = styled.button`
  padding: 0.5rem;
  background: transparent;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--second-text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--glass-bg-secondary);
    color: var(--main-text-color);
  }
`;

const SettingsPanel = styled.div`
  background: var(--glass-bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SettingLabel = styled.span`
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 500;
`;

const PriceInput = styled.input`
  width: 80px;
  padding: 0.5rem;
  background: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
  border-radius: 6px;
  color: var(--main-text-color);
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
  }
`;

const SettingUnit = styled.span`
  color: var(--second-text-color);
  font-size: 0.85rem;
`;

const PeriodButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PeriodButton = styled.button`
  padding: 0.4rem 0.8rem;
  background: ${props => props.$active ? 'var(--primary-button-color)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'var(--primary-button-color)' : 'var(--glass-border)'};
  border-radius: 6px;
  color: ${props => props.$active ? 'white' : 'var(--second-text-color)'};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? 'var(--primary-button-color)' : 'var(--glass-bg-secondary)'};
  }
`;

const EnergyTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: var(--glass-bg-secondary);
  padding: 0.25rem;
  border-radius: 12px;
`;

const EnergyTab = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: ${props => props.$active ? 'var(--primary-button-color)' : 'transparent'};
  border: none;
  border-radius: 10px;
  color: ${props => props.$active ? 'white' : 'var(--second-text-color)'};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.$active ? 'white' : 'var(--main-text-color)'};
    background: ${props => props.$active ? 'var(--primary-button-color)' : 'var(--glass-bg-primary)'};
  }

  span {
    @media (max-width: 480px) {
      display: none;
    }
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CostWarning = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--chart-error-color);
  border-radius: 12px;
  color: var(--chart-error-color);
`;

const WarningText = styled.span`
  font-size: 0.85rem;
  font-weight: 500;
  flex: 1;
`;

const ChartsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DevicesSection = styled.div`
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 16px;
  padding: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: var(--main-text-color);
  font-size: 1.1rem;
  font-weight: 600;
`;

const EditAllButton = styled.button`
  padding: 0.5rem 1rem;
  background: var(--primary-button-color);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const TopConsumers = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ConsumerItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--glass-bg-primary);
  }
`;

const ConsumerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const ConsumerRank = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
`;

const ConsumerDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ConsumerName = styled.span`
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 500;
`;

const ConsumerState = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  width: fit-content;
  background: ${props => props.$active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  color: ${props => props.$active ? 'var(--chart-success-color)' : 'var(--chart-error-color)'};
`;

const ConsumerStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
  min-width: 100px;
`;

const ConsumerValue = styled.span`
  color: var(--primary-accent);
  font-weight: 600;
  font-size: 1rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: var(--glass-border);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.$percentage}%;
  background: ${props => props.$active ? 'var(--primary-accent)' : 'var(--second-text-color)'};
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  gap: 1rem;
`;

const EmptyText = styled.span`
  color: var(--main-text-color);
  font-size: 0.95rem;
  font-weight: 500;
`;

const EmptySubtext = styled.span`
  color: var(--second-text-color);
  font-size: 0.85rem;
  max-width: 300px;
  line-height: 1.5;
`;

export default RoomPowerSensors;
