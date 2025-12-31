import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';

const AdminPanelContainer = styled.div`
  margin-top: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
`;

const AdminHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const AdminTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
`;

const AdminBadge = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-align: left;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const AdminPanel = () => {
  const { connection, currentRoom } = useHomeAssistant();
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    revenue: 0,
    supportTickets: 0
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [connection, currentRoom]);

  const checkAdminStatus = async () => {
    if (!connection) {
      setLoading(false);
      return;
    }

    try {
      // Check if current user has admin permissions via HA service
      const response = await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'opengrowbox',
        service: 'get_user_permissions',
        service_data: {
          room: currentRoom
        }
      });

      // Check if user has admin role
      const permissions = response?.result?.permissions || [];
      setIsAdmin(permissions.includes('admin') || permissions.includes('administrator'));

      // Get admin statistics
      if (permissions.includes('admin') || permissions.includes('administrator')) {
        await loadAdminStats();
      }
    } catch (error) {
      // Silently handle missing service - admin panel won't be displayed
      // This is expected behavior when the opengrowbox integration doesn't have admin features
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      const response = await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'opengrowbox',
        service: 'get_admin_stats',
        service_data: {
          room: currentRoom
        }
      });

      const stats = response?.result || {};
      setAdminStats({
        totalUsers: stats.total_users || 0,
        activeSubscriptions: stats.active_subscriptions || 0,
        revenue: stats.revenue || 0,
        supportTickets: stats.support_tickets || 0
      });
    } catch (error) {
      // Silently handle missing admin stats service
      // Admin panel will still display with zero stats
    }
  };

  const handleUserManagement = async () => {
    // Navigate to user management or open modal
    console.log('Opening user management...');
  };

  const handleSubscriptionManagement = async () => {
    // Navigate to subscription management
    console.log('Opening subscription management...');
  };

  const handleFeatureFlags = async () => {
    // Navigate to feature flag management
    console.log('Opening feature flag management...');
  };

  const handleAnalytics = async () => {
    // Navigate to admin analytics
    console.log('Opening admin analytics...');
  };

  if (loading) {
    return (
      <AdminPanelContainer>
        <AdminTitle>Loading admin panel...</AdminTitle>
      </AdminPanelContainer>
    );
  }

  if (!isAdmin) {
    return null; // Don't show admin panel if user is not admin
  }

  return (
    <AdminPanelContainer>
      <AdminHeader>
        <AdminTitle>Admin Panel</AdminTitle>
        <AdminBadge>Administrator</AdminBadge>
      </AdminHeader>

      <StatsGrid>
        <StatCard>
          <StatValue>{adminStats.totalUsers.toLocaleString()}</StatValue>
          <StatLabel>Total Users</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{adminStats.activeSubscriptions.toLocaleString()}</StatValue>
          <StatLabel>Active Subscriptions</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>${adminStats.revenue.toLocaleString()}</StatValue>
          <StatLabel>Revenue</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{adminStats.supportTickets}</StatValue>
          <StatLabel>Support Tickets</StatLabel>
        </StatCard>
      </StatsGrid>

      <ActionGrid>
        <ActionButton onClick={handleUserManagement}>
          👥 User Management
        </ActionButton>

        <ActionButton onClick={handleSubscriptionManagement}>
          💳 Subscriptions
        </ActionButton>

        <ActionButton onClick={handleFeatureFlags}>
          🚩 Feature Flags
        </ActionButton>

        <ActionButton onClick={handleAnalytics}>
          📊 Analytics
        </ActionButton>
      </ActionGrid>
    </AdminPanelContainer>
  );
};

export default AdminPanel;