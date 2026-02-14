/**
 * Socket.IO Hook
 * 
 * Manages Socket.IO connection lifecycle
 */

import { useEffect, useCallback } from 'react';
import { getSocketService } from '../services/socketService';
import { useAuth } from './AuthContext';

export function useSocketIO() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      const socketService = getSocketService();
      if (socketService.isConnected()) {
        socketService.disconnect();
      }
      return;
    }

    const connectSocket = async () => {
      try {
        const socketService = getSocketService();
        await socketService.connect(user.id, user.role);
      } catch (error) {
        console.error('Failed to connect to Socket.IO:', error);
      }
    };

    connectSocket();

    return () => {
      // Optional: Disconnect on unmount
      // getSocketService().disconnect();
    };
  }, [isAuthenticated, user]);

  const joinPatientMonitoring = useCallback((patientId: string) => {
    const socketService = getSocketService();
    if (socketService.isConnected()) {
      socketService.joinPatientRoom(patientId);
    }
  }, []);

  const leavePatientMonitoring = useCallback((patientId: string) => {
    const socketService = getSocketService();
    if (socketService.isConnected()) {
      socketService.leavePatientRoom(patientId);
    }
  }, []);

  const joinHospitalUpdates = useCallback((hospitalId: string) => {
    const socketService = getSocketService();
    if (socketService.isConnected()) {
      socketService.joinHospitalRoom(hospitalId);
    }
  }, []);

  const leaveHospitalUpdates = useCallback((hospitalId: string) => {
    const socketService = getSocketService();
    if (socketService.isConnected()) {
      socketService.leaveHospitalRoom(hospitalId);
    }
  }, []);

  const joinTriageQueue = useCallback(() => {
    const socketService = getSocketService();
    if (socketService.isConnected()) {
      socketService.joinTriageQueue();
    }
  }, []);

  const leaveTriageQueue = useCallback(() => {
    const socketService = getSocketService();
    if (socketService.isConnected()) {
      socketService.leaveTriageQueue();
    }
  }, []);

  return {
    joinPatientMonitoring,
    leavePatientMonitoring,
    joinHospitalUpdates,
    leaveHospitalUpdates,
    joinTriageQueue,
    leaveTriageQueue,
  };
}

export default useSocketIO;
