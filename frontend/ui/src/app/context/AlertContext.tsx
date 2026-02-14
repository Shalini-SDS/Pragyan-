/**
 * Real-time Alert Context
 * 
 * Manages real-time alerts from Socket.IO
 */

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { getSocketService } from '../services/socketService';

export type AlertType = 'critical' | 'warning' | 'info' | 'success';
export type AlertSource = 'patient_alert' | 'risk_updated' | 'triage_updated' | 'hospital_alert' | 'staff_availability_changed' | 'bed_status_changed';

export interface Alert {
  id: string;
  type: AlertType;
  source: AlertSource;
  title: string;
  message: string;
  data: any;
  timestamp: string;
  read: boolean;
}

interface AlertContextType {
  alerts: Alert[];
  unreadCount: number;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void;
  removeAlert: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const socketService = getSocketService();

    // Handle patient alerts
    socketService.on('patient_alert', (data) => {
      const alertType = data.alert_type === 'critical' ? 'critical' : 'warning';
      addAlert({
        type: alertType,
        source: 'patient_alert',
        title: `Patient ${data.patient_id} Alert`,
        message: data.message || `Critical alert for patient ${data.patient_id}`,
        data,
      });
    });

    // Handle risk updates
    socketService.on('risk_updated', (data) => {
      const riskLevelMap: Record<string, AlertType> = {
        critical: 'critical',
        high: 'warning',
        medium: 'info',
        low: 'success',
      };

      addAlert({
        type: riskLevelMap[data.risk_level] || 'info',
        source: 'risk_updated',
        title: `Risk Update: ${data.patient_id}`,
        message: `Risk level changed to ${data.risk_level} (Score: ${(data.risk_score * 100).toFixed(1)}%)`,
        data,
      });
    });

    // Handle triage updates
    socketService.on('triage_updated', (data) => {
      addAlert({
        type: 'info',
        source: 'triage_updated',
        title: 'Triage Update',
        message: `Triage ${data.triage_id} status changed to ${data.status}`,
        data,
      });
    });

    // Handle hospital alerts
    socketService.on('hospital_alert', (data) => {
      addAlert({
        type: data.alert_type === 'emergency' ? 'critical' : 'warning',
        source: 'hospital_alert',
        title: 'Hospital Alert',
        message: data.message || `Hospital ${data.hospital_id} alert`,
        data,
      });
    });

    // Handle staff availability changes
    socketService.on('staff_availability_changed', (data) => {
      const status = data.available ? 'available' : 'unavailable';
      addAlert({
        type: 'info',
        source: 'staff_availability_changed',
        title: `Staff Status Change`,
        message: `${data.staff_type} ${data.staff_id} is now ${status}`,
        data,
      });
    });

    // Handle bed status changes
    socketService.on('bed_status_changed', (data) => {
      addAlert({
        type: 'info',
        source: 'bed_status_changed',
        title: 'Bed Status Update',
        message: `Bed availability updated for hospital ${data.hospital_id}`,
        data,
      });
    });

    return () => {
      // Cleanup listeners
      socketService.off('patient_alert', addAlert);
      socketService.off('risk_updated', addAlert);
      socketService.off('triage_updated', addAlert);
      socketService.off('hospital_alert', addAlert);
      socketService.off('staff_availability_changed', addAlert);
      socketService.off('bed_status_changed', addAlert);
    };
  }, []);

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setAlerts((prev) => [newAlert, ...prev]);

    // Auto-remove after 10 seconds for info/success alerts
    if (alert.type === 'info' || alert.type === 'success') {
      setTimeout(() => {
        removeAlert(newAlert.id);
      }, 10000);
    }
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <AlertContext.Provider
      value={{
        alerts,
        unreadCount,
        addAlert,
        removeAlert,
        markAsRead,
        clearAll,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts(): AlertContextType {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertProvider');
  }
  return context;
}
