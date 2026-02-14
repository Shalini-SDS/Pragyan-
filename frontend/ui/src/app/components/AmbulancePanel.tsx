import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Ambulance as AmbulanceIcon,
  MapPin,
  Clock,
  Phone,
  User,
  Activity,
  CheckCircle,
  XCircle,
  Navigation,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import type { AmbulanceRequest } from '../context/AppContext';

interface AmbulancePanelProps {
  patientId?: string;
  patientName?: string;
}

export function AmbulancePanel({ patientId, patientName }: AmbulancePanelProps) {
  const {
    ambulances,
    ambulanceRequests,
    requestAmbulance,
    acceptAmbulanceRequest,
    updateAmbulanceRequest,
    cancelAmbulanceRequest,
  } = useApp();

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    pickupLocation: '',
    destination: 'City Hospital, Main Building',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    notes: '',
  });

  // Simulate location updates
  useEffect(() => {
    const interval = setInterval(() => {
      ambulanceRequests.forEach((request) => {
        if (request.status === 'En Route' && request.estimatedArrival && request.estimatedArrival > 0) {
          updateAmbulanceRequest(request.id, {
            estimatedArrival: request.estimatedArrival - 1,
            currentLocation: `Moving towards ${request.destination}`,
          });
        } else if (request.status === 'En Route' && request.estimatedArrival === 0) {
          updateAmbulanceRequest(request.id, {
            status: 'Arrived',
          });
        }
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [ambulanceRequests, updateAmbulanceRequest]);

  const handleRequestAmbulance = () => {
    if (!patientId || !patientName) return;

    requestAmbulance({
      patientId,
      patientName,
      priority: requestForm.priority,
      pickupLocation: requestForm.pickupLocation,
      destination: requestForm.destination,
      notes: requestForm.notes,
    });

    setRequestForm({
      pickupLocation: '',
      destination: 'City Hospital, Main Building',
      priority: 'Medium',
      notes: '',
    });
    setShowRequestForm(false);
  };

  const handleAcceptRequest = (requestId: string, ambulanceId: string) => {
    acceptAmbulanceRequest(requestId, ambulanceId);
    // Set initial estimated arrival
    updateAmbulanceRequest(requestId, {
      status: 'En Route',
      estimatedArrival: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
      currentLocation: 'Hospital Parking',
      driverName: ambulances.find((a) => a.id === ambulanceId)?.driverName,
      driverContact: ambulances.find((a) => a.id === ambulanceId)?.driverContact,
    });
  };

  const getStatusColor = (status: AmbulanceRequest['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'Accepted':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'En Route':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'Arrived':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'Completed':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
      case 'Cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getPriorityColor = (priority: AmbulanceRequest['priority']) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 animate-pulse';
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

  const activeRequests = ambulanceRequests.filter(
    (r) => r.status !== 'Completed' && r.status !== 'Cancelled'
  );

  const availableAmbulances = ambulances.filter((a) => a.status === 'Available');

  return (
    <div className="space-y-6">
      {/* Ambulance Fleet Status */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AmbulanceIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="dark:text-white">Ambulance Fleet</span>
            </div>
            {patientId && (
              <Button
                onClick={() => setShowRequestForm(!showRequestForm)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Request Ambulance
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {availableAmbulances.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">On Route</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {ambulances.filter((a) => a.status === 'On Route').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Requests</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {activeRequests.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Request Form */}
          <AnimatePresence>
            {showRequestForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label htmlFor="pickupLocation" className="dark:text-gray-300">
                        Pickup Location
                      </Label>
                      <Input
                        id="pickupLocation"
                        value={requestForm.pickupLocation}
                        onChange={(e) =>
                          setRequestForm({ ...requestForm, pickupLocation: e.target.value })
                        }
                        placeholder="Enter pickup address..."
                        className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="destination" className="dark:text-gray-300">
                        Destination
                      </Label>
                      <Input
                        id="destination"
                        value={requestForm.destination}
                        onChange={(e) =>
                          setRequestForm({ ...requestForm, destination: e.target.value })
                        }
                        className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="priority" className="dark:text-gray-300">
                        Priority Level
                      </Label>
                      <select
                        id="priority"
                        value={requestForm.priority}
                        onChange={(e) =>
                          setRequestForm({
                            ...requestForm,
                            priority: e.target.value as 'Low' | 'Medium' | 'High' | 'Critical',
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="notes" className="dark:text-gray-300">
                        Additional Notes
                      </Label>
                      <Textarea
                        id="notes"
                        value={requestForm.notes}
                        onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                        placeholder="Medical condition, special requirements..."
                        className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleRequestAmbulance}
                        disabled={!requestForm.pickupLocation}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        Submit Request
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowRequestForm(false)}
                        className="dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ambulance List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
              Fleet Status
            </h4>
            {ambulances.map((ambulance) => (
              <motion.div
                key={ambulance.id}
                whileHover={{ x: 4 }}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge
                        className={
                          ambulance.status === 'Available'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : ambulance.status === 'On Route'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }
                      >
                        {ambulance.status}
                      </Badge>
                      <span className="font-medium dark:text-white">{ambulance.vehicleNumber}</span>
                      <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                        {ambulance.equipmentLevel}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="dark:text-gray-300">{ambulance.driverName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span className="dark:text-gray-300">{ambulance.driverContact}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Active Ambulance Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeRequests.map((request) => (
                <motion.div
                  key={request.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold dark:text-white">{request.patientName}</h4>
                        <Badge variant="outline" className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.patientId}</p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-600 dark:text-gray-400">Pickup</p>
                        <p className="font-medium dark:text-white">{request.pickupLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-600 dark:text-gray-400">Destination</p>
                        <p className="font-medium dark:text-white">{request.destination}</p>
                      </div>
                    </div>
                  </div>

                  {request.status === 'En Route' && (
                    <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                          {request.currentLocation}
                        </span>
                      </div>
                      {request.estimatedArrival !== undefined && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm text-purple-700 dark:text-purple-400">
                            ETA: {request.estimatedArrival} minutes
                          </span>
                        </div>
                      )}
                      {request.driverName && (
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm text-purple-700 dark:text-purple-400">
                            Driver: {request.driverName} ({request.driverContact})
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {request.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                      {request.notes}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {request.status === 'Pending' && availableAmbulances.length > 0 && (
                      <select
                        onChange={(e) => handleAcceptRequest(request.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white text-sm"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Assign Ambulance
                        </option>
                        {availableAmbulances.map((ambulance) => (
                          <option key={ambulance.id} value={ambulance.id}>
                            {ambulance.vehicleNumber} - {ambulance.equipmentLevel}
                          </option>
                        ))}
                      </select>
                    )}

                    {request.status === 'Arrived' && (
                      <Button
                        onClick={() =>
                          updateAmbulanceRequest(request.id, { status: 'Completed' })
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Completed
                      </Button>
                    )}

                    {(request.status === 'Pending' || request.status === 'Accepted') && (
                      <Button
                        variant="outline"
                        onClick={() => cancelAmbulanceRequest(request.id)}
                        className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    Requested: {new Date(request.requestedAt).toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
