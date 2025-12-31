/**
 * Safe Mode Confirmation Modal
 * Prevents accidental changes on mobile devices by requiring explicit confirmation
 */

import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

const SafeModeConfirmModal = ({ 
    isOpen, 
    onConfirm, 
    onCancel, 
    entityName, 
    currentValue, 
    newValue,
    changeType = 'change' // 'change', 'toggle', 'input'
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
    };

    const handleCancel = () => {
        onCancel();
    };

    // Format values for display
    const formatValue = (value) => {
        if (typeof value === 'boolean') {
            return value ? 'ON' : 'OFF';
        }
        if (value === 'on' || value === 'YES' || value === 'true') return 'ON';
        if (value === 'off' || value === 'NO' || value === 'false') return 'OFF';
        return String(value);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <ModalOverlay
                    as={motion.div}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleCancel}
                >
                    <ModalContent
                        as={motion.div}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ModalHeader>
                            <SafeIcon><Shield size={20} /></SafeIcon>
                            <ModalTitle>Confirm Change</ModalTitle>
                        </ModalHeader>

                        <ModalBody>
                            <EntityName>{entityName}</EntityName>
                            
                            <ChangePreview>
                                <ValueBox>
                                    <ValueLabel>Current</ValueLabel>
                                    <CurrentValue>{formatValue(currentValue)}</CurrentValue>
                                </ValueBox>
                                
                                <Arrow>→</Arrow>
                                
                                <ValueBox>
                                    <ValueLabel>New</ValueLabel>
                                    <NewValue>{formatValue(newValue)}</NewValue>
                                </ValueBox>
                            </ChangePreview>

                            <InfoText>
                                Safe Mode is active. Confirm to apply this change.
                            </InfoText>
                        </ModalBody>

                        <ModalFooter>
                            <CancelButton onClick={handleCancel}>
                                Cancel
                            </CancelButton>
                            <ConfirmButton onClick={handleConfirm}>
                                ✓ Confirm
                            </ConfirmButton>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            )}
        </AnimatePresence>
    );
};

export default SafeModeConfirmModal;

// Styled Components

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
    background: var(--main-bg-card-color);
    border-radius: 16px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid var(--border-color);
    overflow: hidden;
`;

const ModalHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px;
    background: linear-gradient(135deg, 
        rgba(59, 130, 246, 0.1) 0%, 
        rgba(37, 99, 235, 0.1) 100%
    );
    border-bottom: 1px solid var(--border-color);
`;

const SafeIcon = styled.div`
    font-size: 28px;
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
`;

const ModalTitle = styled.h3`
    margin: 0;
    color: var(--main-text-color);
    font-size: 1.25rem;
    font-weight: 600;
`;

const ModalBody = styled.div`
    padding: 24px;
`;

const EntityName = styled.div`
    color: var(--main-text-color);
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 20px;
    text-align: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
`;

const ChangePreview = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
`;

const ValueBox = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-color);
    border-radius: 12px;
`;

const ValueLabel = styled.div`
    font-size: 0.75rem;
    color: var(--placeholder-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
`;

const CurrentValue = styled.div`
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--main-text-color);
    word-break: break-word;
    text-align: center;
`;

const NewValue = styled.div`
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary-accent);
    word-break: break-word;
    text-align: center;
`;

const Arrow = styled.div`
    font-size: 24px;
    color: var(--placeholder-text-color);
    flex-shrink: 0;
`;

const InfoText = styled.div`
    text-align: center;
    font-size: 0.85rem;
    color: var(--placeholder-text-color);
    line-height: 1.5;
`;

const ModalFooter = styled.div`
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid var(--border-color);
`;

const Button = styled.button`
    flex: 1;
    padding: 14px 20px;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    
    /* Large touch targets for mobile */
    min-height: 48px;
    
    &:active {
        transform: scale(0.97);
    }
`;

const CancelButton = styled(Button)`
    background: rgba(255, 255, 255, 0.1);
    color: var(--main-text-color);
    border: 1px solid var(--border-color);
    
    &:hover {
        background: rgba(255, 255, 255, 0.15);
    }
`;

const ConfirmButton = styled(Button)`
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    
    &:hover {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }
`;
