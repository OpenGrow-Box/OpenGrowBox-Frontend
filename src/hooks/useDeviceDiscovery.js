import { useState, useEffect, useCallback, useRef } from 'react';
import { useHomeAssistant } from '../Components/Context/HomeAssistantContext';

const DEVICE_DISCOVERED_EVENT = 'ogb_device_discovered';

export default function useDeviceDiscovery() {
  const { connection, isOnline } = useHomeAssistant();
  const [proposals, setProposals] = useState([]);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!connection || !isOnline) return;

    const handleDeviceDiscovered = (event) => {
      const { proposal } = event.data || {};
      if (!proposal) return;
      
      setProposals(prev => {
        // Deduplicate by ID, IP address, or MAC address
        const isDuplicate = prev.some(p => 
          p.id === proposal.id || 
          (proposal.ip_address && p.ip_address === proposal.ip_address) ||
          (proposal.mac_address && p.mac_address === proposal.mac_address)
        );
        if (isDuplicate) return prev;
        return [...prev, { ...proposal, accepted: false, ignored: false }];
      });
    };

    const fetchExistingProposals = async () => {
      try {
        const result = await connection.sendMessagePromise({
          type: 'call_service',
          domain: 'opengrowbox',
          service: 'get_device_proposals',
          service_data: {},
          return_response: true,
        });
        
        const existing = result?.response?.proposals || [];
        if (existing.length > 0) {
          setProposals(prev => {
            const newProposals = existing.filter(
              p => !prev.some(existing => 
                existing.id === p.id || 
                (p.ip_address && existing.ip_address === p.ip_address) ||
                (p.mac_address && existing.mac_address === p.mac_address)
              )
            );
            return [...prev, ...newProposals.map(p => ({ ...p, accepted: false, ignored: false }))];
          });
        }
      } catch (err) {
        console.warn('Failed to fetch existing proposals:', err);
      }
    };

    const subscribe = async () => {
      try {
        // First fetch existing proposals
        await fetchExistingProposals();
        
        // Then subscribe to new events
        unsubscribeRef.current = await connection.subscribeEvents(
          handleDeviceDiscovered,
          DEVICE_DISCOVERED_EVENT
        );
      } catch (err) {
        console.warn('Failed to subscribe to device discovery events:', err);
      }
    };

    subscribe();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [connection, isOnline]);

  const acceptProposal = useCallback(async (proposalId, room = null, labels = [], name = null) => {
    if (!connection) return;
    try {
      await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'opengrowbox',
        service: 'accept_device_proposal',
        service_data: { 
          proposal_id: proposalId,
          room: room,
          labels: labels,
          name: name,
        },
      });
      setProposals(prev => prev.filter(p => p.id !== proposalId));
    } catch (err) {
      console.error('Failed to accept device proposal:', err);
    }
  }, [connection]);

  const ignoreProposal = useCallback(async (proposalId) => {
    if (!connection) return;
    try {
      await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'opengrowbox',
        service: 'ignore_device_proposal',
        service_data: { proposal_id: proposalId },
      });
      setProposals(prev => prev.filter(p => p.id !== proposalId));
    } catch (err) {
      console.error('Failed to ignore device proposal:', err);
    }
  }, [connection]);

  const dismissProposal = useCallback((proposalId) => {
    setProposals(prev => prev.filter(p => p.id !== proposalId));
  }, []);

  return { proposals, acceptProposal, ignoreProposal, dismissProposal };
}
