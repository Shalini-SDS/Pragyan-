/**
 * Real-Time Alerts Panel Component
 * 
 * Displays real-time alerts and notifications from Socket.IO
 */

import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { AlertCircle, Bell, X, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';
import { Button } from './ui/button';

export function RealtimeAlertsPanel() {
  const { alerts, unreadCount, removeAlert, markAsRead, clearAll } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Alert Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Alerts Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Real-Time Alerts ({alerts.length})
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alerts List */}
          <div className="overflow-y-auto flex-1">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No alerts yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border-l-4 ${getAlertColor(alert.type)} cursor-pointer hover:opacity-80 transition-opacity ${
                      !alert.read ? 'border-l-blue-500 bg-opacity-100' : 'border-l-gray-300 opacity-75'
                    }`}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">{getAlertIcon(alert.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatTime(alert.timestamp)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAlert(alert.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="bg-gray-50 p-3 border-t flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearAll()}
                className="text-xs"
              >
                Clear All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RealtimeAlertsPanel;
