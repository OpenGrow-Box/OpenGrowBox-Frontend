/**
 * Safe Mode Hook
 * Provides confirmation modal for preventing accidental changes on mobile devices
 */

import { useState, useCallback } from 'react';
import { useGlobalState } from '../Components/Context/GlobalContext';

export const useSafeMode = () => {
    const { state } = useGlobalState();
    const isSafeModeEnabled = state?.Settings?.safeModeEnabled ?? true; // Default to enabled

    const [confirmationState, setConfirmationState] = useState({
        isOpen: false,
        entityName: '',
        currentValue: null,
        newValue: null,
        resolvePromise: null,
        rejectPromise: null,
    });

    /**
     * Request user confirmation for a change
     * @param {string} entityName - Name of the entity being changed
     * @param {any} currentValue - Current value
     * @param {any} newValue - New value to be applied
     * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
     */
    const confirmChange = useCallback((entityName, currentValue, newValue) => {
        // If Safe Mode is disabled, immediately confirm
        if (!isSafeModeEnabled) {
            return Promise.resolve(true);
        }

        // Return a promise that will be resolved when user confirms/cancels
        return new Promise((resolve, reject) => {
            setConfirmationState({
                isOpen: true,
                entityName,
                currentValue,
                newValue,
                resolvePromise: resolve,
                rejectPromise: reject,
            });
        });
    }, [isSafeModeEnabled]);

    /**
     * Handle user confirmation
     */
    const handleConfirm = useCallback(() => {
        if (confirmationState.resolvePromise) {
            confirmationState.resolvePromise(true);
        }
        setConfirmationState({
            isOpen: false,
            entityName: '',
            currentValue: null,
            newValue: null,
            resolvePromise: null,
            rejectPromise: null,
        });
    }, [confirmationState]);

    /**
     * Handle user cancellation
     */
    const handleCancel = useCallback(() => {
        if (confirmationState.resolvePromise) {
            confirmationState.resolvePromise(false);
        }
        setConfirmationState({
            isOpen: false,
            entityName: '',
            currentValue: null,
            newValue: null,
            resolvePromise: null,
            rejectPromise: null,
        });
    }, [confirmationState]);

    return {
        isSafeModeEnabled,
        confirmChange,
        confirmationState,
        handleConfirm,
        handleCancel,
    };
};
