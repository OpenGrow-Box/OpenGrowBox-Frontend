import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Zap, Euro, Clock, Calendar, Calculator, TrendingUp, ArrowRight, RotateCcw } from 'lucide-react';

const EnergyCalculator = ({ pricePerKwh = 0.30, onPriceChange }) => {
  const [watts, setWatts] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [days, setDays] = useState('');
  const [price, setPrice] = useState(pricePerKwh.toString());
  const [results, setResults] = useState(null);

  useEffect(() => {
    setPrice(pricePerKwh.toString());
  }, [pricePerKwh]);

  const calculate = () => {
    const w = parseFloat(watts);
    const h = parseFloat(hoursPerDay);
    const d = parseFloat(days);
    const p = parseFloat(price);

    if (isNaN(w) || isNaN(h) || isNaN(d) || isNaN(p) || w <= 0 || h <= 0 || d <= 0) {
      setResults(null);
      return;
    }

    const totalHours = h * d;
    const totalWattHours = w * totalHours;
    const totalKwh = totalWattHours / 1000;
    const dailyKwh = (w * h) / 1000;
    const dailyCost = dailyKwh * p;
    const totalCost = totalKwh * p;

    setResults({
      totalHours,
      totalWattHours,
      totalKwh,
      dailyKwh,
      dailyCost,
      totalCost,
      averageWatts: w,
    });
  };

  useEffect(() => {
    calculate();
  }, [watts, hoursPerDay, days, price]);

  const handleReset = () => {
    setWatts('');
    setHoursPerDay('');
    setDays('');
    setPrice(pricePerKwh.toString());
    setResults(null);
  };

  const handlePriceChange = (e) => {
    const newPrice = parseFloat(e.target.value) || 0;
    setPrice(e.target.value);
    if (onPriceChange) {
      onPriceChange(newPrice);
    }
  };

  const getCostLevel = (cost, daily) => {
    const threshold = daily ? 5 : 150;
    if (cost < threshold * 0.5) return 'low';
    if (cost < threshold) return 'medium';
    return 'high';
  };

  return (
    <Container>
      <Header>
        <HeaderContent>
          <IconWrapper>
            <Calculator size={24} />
          </IconWrapper>
          <div>
            <Title>Energy Calculator</Title>
            <Subtitle>Calculate consumption and costs</Subtitle>
          </div>
        </HeaderContent>
        <ResetButton onClick={handleReset}>
          <RotateCcw size={16} />
        </ResetButton>
      </Header>

      <CalculatorGrid>
        <InputSection>
          <InputGroup>
            <Label>
              <Zap size={16} />
              Watts
            </Label>
            <Input
              type="number"
              placeholder="e.g. 150"
              value={watts}
              onChange={(e) => setWatts(e.target.value)}
            />
          </InputGroup>

          <InputGroup>
            <Label>
              <Clock size={16} />
              Hours per day
            </Label>
            <Input
              type="number"
              placeholder="e.g. 12"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
            />
          </InputGroup>

          <InputGroup>
            <Label>
              <Calendar size={16} />
              Days
            </Label>
            <Input
              type="number"
              placeholder="e.g. 30"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </InputGroup>

          <InputGroup>
            <Label>
              <Euro size={16} />
              Energy Price (€/kWh)
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="e.g. 0.30"
              value={price}
              onChange={handlePriceChange}
            />
          </InputGroup>
        </InputSection>

        <ResultsSection>
          {!results ? (
            <EmptyState>
              <Calculator size={48} opacity={0.3} />
              <EmptyText>Enter values</EmptyText>
              <EmptySubtext>Enter watts, hours, days and price</EmptySubtext>
            </EmptyState>
          ) : (
            <ResultsGrid>
              <ResultCard>
                <ResultIcon color="var(--primary-accent)">
                  <Zap size={20} />
                </ResultIcon>
                <ResultContent>
                  <ResultLabel>Average Load</ResultLabel>
                  <ResultValue>{results.averageWatts} W</ResultValue>
                </ResultContent>
              </ResultCard>

              <ResultCard>
                <ResultIcon color="var(--chart-warning-color)">
                  <Clock size={20} />
                </ResultIcon>
                <ResultContent>
                  <ResultLabel>Total Runtime</ResultLabel>
                  <ResultValue>{results.totalHours} hrs</ResultValue>
                </ResultContent>
              </ResultCard>

              <ResultCard>
                <ResultIcon color="var(--chart-secondary-color)">
                  <Zap size={20} />
                </ResultIcon>
                <ResultContent>
                  <ResultLabel>Daily Consumption</ResultLabel>
                  <ResultValue>{results.dailyKwh.toFixed(2)} kWh</ResultValue>
                  <ResultSubtext>€{results.dailyCost.toFixed(2)}/day</ResultSubtext>
                </ResultContent>
              </ResultCard>

              <ResultCard
                $highlight
                $costLevel={getCostLevel(results.totalCost, false)}
              >
                <ResultIcon color="var(--chart-success-color)">
                  <Euro size={20} />
                </ResultIcon>
                <ResultContent>
                  <ResultLabel>Total Cost</ResultLabel>
                  <ResultValue>€{results.totalCost.toFixed(2)}</ResultValue>
                  <ResultSubtext>{results.totalKwh.toFixed(2)} kWh</ResultSubtext>
                </ResultContent>
              </ResultCard>

              <DailyBreakdown>
                <BreakdownTitle>Cost Breakdown</BreakdownTitle>
                <BreakdownRow>
                  <span>Per day:</span>
                  <span>€{results.dailyCost.toFixed(2)}</span>
                </BreakdownRow>
                <BreakdownRow>
                  <span>Per week:</span>
                  <span>€{(results.dailyCost * 7).toFixed(2)}</span>
                </BreakdownRow>
                <BreakdownRow>
                  <span>Per month (30 days):</span>
                  <span>€{(results.dailyCost * 30).toFixed(2)}</span>
                </BreakdownRow>
                <BreakdownRow>
                  <span>Per year (365 days):</span>
                  <span>€{(results.dailyCost * 365).toFixed(2)}</span>
                </BreakdownRow>
              </DailyBreakdown>

              <InfoCard>
                <InfoTitle>
                  <TrendingUp size={16} />
                  Consumption Info
                </InfoTitle>
                <InfoText>
                  A device with {results.averageWatts}W running {hoursPerDay}h/day 
                  for {days} days consumes{' '}
                  <strong>{results.totalKwh.toFixed(2)} kWh</strong> total and costs{' '}
                  <strong>€{results.totalCost.toFixed(2)}</strong>.
                </InfoText>
              </InfoCard>
            </ResultsGrid>
          )}
        </ResultsSection>
      </CalculatorGrid>
    </Container>
  );
};

EnergyCalculator.propTypes = {
  pricePerKwh: PropTypes.number,
  onPriceChange: PropTypes.func,
};

const Container = styled.div`
  background: var(--main-bg-card-color);
  border: 1px solid var(--glass-border-light);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-accent) 0%, var(--secondary-accent) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const Title = styled.h3`
  margin: 0;
  color: var(--main-text-color);
  font-size: 1.25rem;
  font-weight: 700;
`;

const Subtitle = styled.span`
  display: block;
  color: var(--second-text-color);
  font-size: 0.85rem;
  margin-top: 0.25rem;
`;

const ResetButton = styled.button`
  padding: 0.5rem;
  background: var(--glass-bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--second-text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--glass-bg-primary);
    color: var(--main-text-color);
    transform: rotate(180deg);
  }
`;

const CalculatorGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  background: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
  border-radius: 10px;
  color: var(--main-text-color);
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-accent);
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }

  &::placeholder {
    color: var(--placeholder-text-color);
  }
`;

const ResultsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  gap: 1rem;
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  border: 1px dashed var(--glass-border);
`;

const EmptyText = styled.span`
  color: var(--main-text-color);
  font-size: 0.95rem;
  font-weight: 500;
`;

const EmptySubtext = styled.span`
  color: var(--second-text-color);
  font-size: 0.85rem;
`;

const ResultsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ResultCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => 
    props.$highlight 
      ? props.$costLevel === 'high' 
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)'
        : props.$costLevel === 'medium'
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)'
      : 'var(--glass-bg-secondary)'
  };
  border: 1px solid ${props => 
    props.$highlight 
      ? props.$costLevel === 'high' 
        ? 'var(--chart-error-color)'
        : props.$costLevel === 'medium'
          ? 'var(--chart-warning-color)'
          : 'var(--chart-success-color)'
      : 'var(--glass-border)'
  };
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const ResultIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.color}20;
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ResultContent = styled.div`
  flex: 1;
`;

const ResultLabel = styled.span`
  display: block;
  color: var(--second-text-color);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
`;

const ResultValue = styled.span`
  display: block;
  color: var(--main-text-color);
  font-size: 1.25rem;
  font-weight: 700;
`;

const ResultSubtext = styled.span`
  display: block;
  color: var(--second-text-color);
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const DailyBreakdown = styled.div`
  padding: 1rem;
  background: var(--glass-bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--glass-border);
`;

const BreakdownTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  color: var(--main-text-color);
  font-size: 0.9rem;
  font-weight: 600;
`;

const BreakdownRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--glass-border);
  
  &:last-child {
    border-bottom: none;
  }

  span:first-child {
    color: var(--second-text-color);
    font-size: 0.85rem;
  }

  span:last-child {
    color: var(--main-text-color);
    font-size: 0.9rem;
    font-weight: 600;
  }
`;

const InfoCard = styled.div`
  padding: 1rem;
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid var(--secondary-accent);
`;

const InfoTitle = styled.h4`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.5rem 0;
  color: var(--secondary-accent);
  font-size: 0.85rem;
  font-weight: 600;
`;

const InfoText = styled.p`
  margin: 0;
  color: var(--main-text-color);
  font-size: 0.85rem;
  line-height: 1.5;

  strong {
    color: var(--primary-accent);
  }
`;

export default EnergyCalculator;
