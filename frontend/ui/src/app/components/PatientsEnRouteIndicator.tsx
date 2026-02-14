import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Ambulance, Navigation, Clock, AlertTriangle, MapPin } from 'lucide-react';

export function PatientsEnRouteIndicator() {
  const { ambulanceRequests } = useApp();

  // Get patients currently being transported
  const enRouteRequests = ambulanceRequests.filter(
    (request) => request.status === 'En Route' || request.status === 'Accepted'
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600 dark:text-red-400 border-red-600 dark:border-red-400';
      case 'High':
        return 'text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-400';
      case 'Medium':
        return 'text-yellow-600 dark:text-yellow-400 border-yellow-600 dark:border-yellow-400';
      case 'Low':
        return 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400 border-gray-600 dark:border-gray-400';
    }
  };

  if (enRouteRequests.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <Card className="dark:bg-gray-900 dark:border-gray-800 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 10, 0, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              <Ambulance className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-bold text-lg dark:text-white">Patients En Route to Hospital</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {enRouteRequests.length} patient{enRouteRequests.length !== 1 ? 's' : ''} currently being transported
              </p>
            </div>
            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-lg px-4 py-2">
              {enRouteRequests.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {enRouteRequests.map((request) => (
              <motion.div
                key={request.id}
                whileHover={{ x: 4 }}
                className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold dark:text-white">{request.patientName}</h4>
                      <Badge variant="outline" className={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{request.patientId}</p>
                  </div>
                  {request.status === 'En Route' && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 animate-pulse">
                        En Route
                      </Badge>
                    </motion.div>
                  )}
                  {request.status === 'Accepted' && (
                    <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      Dispatched
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-600 dark:text-gray-400">Pickup</p>
                      <p className="font-medium dark:text-white truncate">{request.pickupLocation}</p>
                    </div>
                  </div>

                  {request.status === 'En Route' && request.currentLocation && (
                    <div className="flex items-start gap-2 text-sm">
                      <Navigation className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 dark:text-gray-400">Current Location</p>
                        <p className="font-medium dark:text-white truncate">{request.currentLocation}</p>
                      </div>
                    </div>
                  )}

                  {request.status === 'En Route' && request.estimatedArrival !== undefined && (
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-600 dark:text-gray-400">ETA</p>
                        <p className="font-medium dark:text-white">
                          {request.estimatedArrival > 0
                            ? `${request.estimatedArrival} minutes`
                            : 'Arriving now'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {request.priority === 'Critical' && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                      Critical priority - Prepare emergency team
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
