import React from 'react';
import styled from 'styled-components';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const PlanValidator = ({ weeks, startDate, growPlanName }) => {
  const validations = React.useMemo(() => {
    const results = [];

    // Basic validations
    if (!growPlanName.trim()) {
      results.push({
        type: 'error',
        message: 'Plan name is required',
        icon: XCircle
      });
    }

    if (!startDate) {
      results.push({
        type: 'error',
        message: 'Start date is required',
        icon: XCircle
      });
    } else {
      const start = new Date(startDate);
      const now = new Date();
      if (start <= now) {
        results.push({
          type: 'error',
          message: 'Start date must be in the future',
          icon: XCircle
        });
      }
    }

    if (weeks.length === 0) {
      results.push({
        type: 'error',
        message: 'At least one week is required',
        icon: XCircle
      });
    }

    // Week validations
    weeks.forEach((week, index) => {
      const weekNum = index + 1;

      // Light validations
      if (!week.lightStart || !week.lightEnd) {
        results.push({
          type: 'error',
          message: `Week ${weekNum}: Light start and end times are required`,
          icon: XCircle
        });
      }

      // Climate validations
      if (week.vpd < 0.8 || week.vpd > 1.5) {
        results.push({
          type: 'warning',
          message: `Week ${weekNum}: VPD (${week.vpd} kPa) is outside optimal range (0.8-1.5 kPa)`,
          icon: AlertTriangle
        });
      }

      if (week.temperature < 18 || week.temperature > 28) {
        results.push({
          type: 'warning',
          message: `Week ${weekNum}: Temperature (${week.temperature}°C) is outside optimal range (18-28°C)`,
          icon: AlertTriangle
        });
      }

      if (week.humidity < 40 || week.humidity > 70) {
        results.push({
          type: 'warning',
          message: `Week ${weekNum}: Humidity (${week.humidity}%) is outside optimal range (40-70%)`,
          icon: AlertTriangle
        });
      }

      // Feeding validations
      if (week.feedControl) {
        if (week.EC < 1.0 || week.EC > 2.5) {
          results.push({
            type: 'warning',
            message: `Week ${weekNum}: EC (${week.EC}) is outside safe range (1.0-2.5)`,
            icon: AlertTriangle
          });
        }

        if (week.PH < 5.5 || week.PH > 6.5) {
          results.push({
            type: 'warning',
            message: `Week ${weekNum}: pH (${week.PH}) is outside optimal range (5.5-6.5)`,
            icon: AlertTriangle
          });
        }
      }
    });

    // Success messages
    if (results.length === 0) {
      results.push({
        type: 'success',
        message: 'Plan is valid and ready to save!',
        icon: CheckCircle
      });
    }

    return results;
  }, [weeks, startDate, growPlanName]);

  const getStatusColor = (type) => {
    switch (type) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'success': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const errorCount = validations.filter(v => v.type === 'error').length;
  const warningCount = validations.filter(v => v.type === 'warning').length;

  return (
    <Container>
      <Header>
        <Title>Plan Validation</Title>
        <StatusSummary>
          {errorCount > 0 && (
            <StatusItem color="#ef4444">
              <XCircle size={16} />
              {errorCount} errors
            </StatusItem>
          )}
          {warningCount > 0 && (
            <StatusItem color="#f59e0b">
              <AlertTriangle size={16} />
              {warningCount} warnings
            </StatusItem>
          )}
          {errorCount === 0 && warningCount === 0 && (
            <StatusItem color="#22c55e">
              <CheckCircle size={16} />
              Valid
            </StatusItem>
          )}
        </StatusSummary>
      </Header>

      <ValidationList>
        {validations.map((validation, index) => {
          const Icon = validation.icon;
          return (
            <ValidationItem key={index} type={validation.type}>
              <Icon size={16} color={getStatusColor(validation.type)} />
              <Message>{validation.message}</Message>
            </ValidationItem>
          );
        })}
      </ValidationList>
    </Container>
  );
};

export default PlanValidator;

const Container = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const StatusSummary = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.color};
`;

const ValidationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ValidationItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background: ${props => {
    switch (props.type) {
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'success': return 'rgba(34, 197, 94, 0.1)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'error': return 'rgba(239, 68, 68, 0.2)';
      case 'warning': return 'rgba(245, 158, 11, 0.2)';
      case 'success': return 'rgba(34, 197, 94, 0.2)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
`;

const Message = styled.span`
  font-size: 0.875rem;
  color: var(--main-text-color);
  line-height: 1.4;
  flex: 1;
`;