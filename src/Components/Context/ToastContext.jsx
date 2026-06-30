import { createContext, useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';
import { FaLeaf, FaRocket, FaDatabase, FaTimes } from 'react-icons/fa';

const ToastContext = createContext();

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 380px;
  width: calc(100vw - 40px);
  pointer-events: none;
`;

const ToastItem = styled.div`
  pointer-events: auto;
  background: rgba(25, 25, 35, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 4px solid ${({ $type }) =>
    $type === 'success' ? 'var(--success-color, #4ade80)' :
    $type === 'info' ? 'var(--primary-accent, #007AFF)' :
    'var(--warning-color, #fbbf24)'};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
  animation: ${slideIn} 0.35s ease-out;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ToastHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const ToastIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $type }) =>
    $type === 'success' ? 'rgba(74, 222, 128, 0.15)' :
    $type === 'info' ? 'rgba(0, 122, 255, 0.15)' :
    'rgba(251, 191, 36, 0.15)'};
  color: ${({ $type }) =>
    $type === 'success' ? '#4ade80' :
    $type === 'info' ? '#60a5fa' :
    '#fbbf24'};
  flex-shrink: 0;
`;

const ToastBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const ToastTitle = styled.h4`
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--main-text-color, #fff);
`;

const ToastMessage = styled.p`
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--secondary-text-color, rgba(255,255,255,0.75));
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  padding: 4px;
  margin: -8px -8px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  &:hover { color: rgba(255,255,255,0.9); }
`;

const ToastActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: ${({ $primary }) => $primary ? 'var(--primary-accent, #007AFF)' : 'rgba(255,255,255,0.08)'};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: transform 0.15s, background 0.2s;
  &:hover {
    transform: translateY(-1px);
    background: ${({ $primary }) => $primary ? 'var(--primary-hover, #005bb5)' : 'rgba(255,255,255,0.14)'};
  }
`;

const getIcon = (type) => {
  if (type === 'success') return <FaLeaf />;
  if (type === 'info') return <FaRocket />;
  return <FaDatabase />;
};

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast?.onDismiss) toast.onDismiss();
      return prev.filter(t => t.id !== id);
    });
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(({
    title,
    message,
    type = 'info',
    duration = 8000,
    actions = [],
    onDismiss,
  }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    setToasts(prev => {
      const duplicate = prev.find(t =>
        t.title === title && t.message === message
      );
      if (duplicate) return prev;
      return [...prev, { id, title, message, type, actions, onDismiss }];
    });

    if (duration && duration > 0) {
      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [removeToast]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <ToastItem key={toast.id} $type={toast.type}>
            <ToastHeader>
              <ToastIcon $type={toast.type}>{getIcon(toast.type)}</ToastIcon>
              <ToastBody>
                {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
                {toast.message && <ToastMessage>{toast.message}</ToastMessage>}
              </ToastBody>
              <CloseButton onClick={() => removeToast(toast.id)} aria-label="Close">
                <FaTimes />
              </CloseButton>
            </ToastHeader>
            {toast.actions.length > 0 && (
              <ToastActions>
                {toast.actions.map((action, idx) => (
                  <ActionButton
                    key={idx}
                    $primary={action.primary}
                    onClick={() => {
                      if (action.onClick) action.onClick();
                      if (action.dismiss !== false) removeToast(toast.id);
                    }}
                  >
                    {action.icon === 'database' ? <FaDatabase /> : <FaRocket />}
                    {action.label}
                  </ActionButton>
                ))}
              </ToastActions>
            )}
          </ToastItem>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { ToastProvider };

export default ToastContext;
