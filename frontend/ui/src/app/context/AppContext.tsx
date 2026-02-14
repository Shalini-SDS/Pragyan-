import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_DOCTORS, MOCK_NURSES, MOCK_PATIENTS } from '../data/mockData';

// Types
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contactNumber: string;
  symptoms: string;
  previousConditions: string;
  guardianName: string;
  guardianContact: string;
  doctorsFollowing: string[];
  vitals: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  riskLevel?: 'Low' | 'Medium' | 'High';
  recommendedDepartment?: string;
  registeredAt: Date;
  testReports?: {
    bloodSugar?: number;
    height?: number;
    weight?: number;
  };
  medications?: Medication[];
  surgeries?: Surgery[];
  organHealth?: {
    [key: string]: {
      status: 'Good' | 'Caution' | 'Critical';
      notes: string;
      recommendations: string[];
      alerts: string[];
    };
  };
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  administeredBy: string;
  administeredAt: Date;
  status: 'Active' | 'Completed' | 'Discontinued';
}

export interface Surgery {
  id: string;
  type: string;
  scheduledDate?: Date;
  performedDate?: Date;
  surgeon: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  notes: string;
}

export interface Doctor {
  id: string;
  name: string;
  photo: string;
  department: string;
  qualification: string;
  licenseNumber: string;
  experience: number;
  opdDays: string[];
  opdTime: string;
  maxPatientsPerDay: number;
  currentTokenCount: number;
  onLeave: boolean;
  emergencyOnCall: boolean;
  roomNumber: string;
  floor: string;
  consultationFee: number;
  teleconsultAvailable: boolean;
  admittingPrivileges: boolean;
  surgicalClearance: boolean;
  extensionNumber: string;
  available: boolean;
}

export interface Nurse {
  id: string;
  name: string;
  photo: string;
  department: string;
  shift: string;
  experienceYears: number;
  patientsAssigned: string[];
  available: boolean;
  extensionNumber: string;
}

export interface BedAvailability {
  category: string;
  total: number;
  occupied: number;
  available: number;
}

export interface Equipment {
  name: string;
  total: number;
  inUse: number;
  available: number;
}

export interface DepartmentLoad {
  department: string;
  doctorsAvailable: number;
  waitingPatients: number;
}

export interface AmbulanceRequest {
  id: string;
  patientId: string;
  patientName: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  pickupLocation: string;
  destination: string;
  requestedAt: Date;
  status: 'Pending' | 'Accepted' | 'En Route' | 'Arrived' | 'Completed' | 'Cancelled';
  assignedAmbulanceId?: string;
  estimatedArrival?: number; // in minutes
  currentLocation?: string;
  driverName?: string;
  driverContact?: string;
  notes?: string;
}

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  status: 'Available' | 'On Route' | 'Maintenance';
  currentLocation?: string;
  driverName: string;
  driverContact: string;
  equipmentLevel: 'Basic' | 'Advanced' | 'Critical Care';
}

interface AppContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'registeredAt'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  getPatient: (id: string) => Patient | undefined;
  doctors: Doctor[];
  updateDoctor: (id: string, updates: Partial<Doctor>) => void;
  nurses: Nurse[];
  updateNurse: (id: string, updates: Partial<Nurse>) => void;
  beds: BedAvailability[];
  equipment: Equipment[];
  departmentLoads: DepartmentLoad[];
  emergencyStatus: 'Normal' | 'Busy' | 'Critical';
  addMedication: (patientId: string, medication: Omit<Medication, 'id' | 'administeredAt'>) => void;
  addSurgery: (patientId: string, surgery: Omit<Surgery, 'id'>) => void;
  updateSurgery: (patientId: string, surgeryId: string, updates: Partial<Surgery>) => void;
  ambulances: Ambulance[];
  ambulanceRequests: AmbulanceRequest[];
  requestAmbulance: (request: Omit<AmbulanceRequest, 'id' | 'requestedAt' | 'status'>) => void;
  acceptAmbulanceRequest: (requestId: string, ambulanceId: string) => void;
  updateAmbulanceRequest: (requestId: string, updates: Partial<AmbulanceRequest>) => void;
  cancelAmbulanceRequest: (requestId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock initial data
const initialDoctors: Doctor[] = MOCK_DOCTORS;
const initialNurses: Nurse[] = MOCK_NURSES;
const initialPatients: Patient[] = MOCK_PATIENTS;

const initialBeds: BedAvailability[] = [
  { category: 'General Ward Beds', total: 120, occupied: 98, available: 22 },
  { category: 'ICU Beds', total: 20, occupied: 18, available: 2 },
  { category: 'NICU', total: 10, occupied: 7, available: 3 },
  { category: 'Emergency Beds', total: 15, occupied: 14, available: 1 },
  { category: 'Isolation Beds', total: 12, occupied: 9, available: 3 },
];

const initialEquipment: Equipment[] = [
  { name: 'Ventilators', total: 25, inUse: 22, available: 3 },
  { name: 'Dialysis Units', total: 10, inUse: 9, available: 1 },
  { name: 'Operation Theaters', total: 6, inUse: 5, available: 1 },
  { name: 'CT Scanners', total: 3, inUse: 2, available: 1 },
  { name: 'MRI Machines', total: 2, inUse: 1, available: 1 },
  { name: 'X-Ray Machines', total: 5, inUse: 3, available: 2 },
];

const initialDepartmentLoads: DepartmentLoad[] = [
  { department: 'Cardiology', doctorsAvailable: 3, waitingPatients: 18 },
  { department: 'Neurology', doctorsAvailable: 2, waitingPatients: 10 },
  { department: 'Emergency', doctorsAvailable: 4, waitingPatients: 25 },
  { department: 'Pediatrics', doctorsAvailable: 3, waitingPatients: 15 },
  { department: 'Orthopedics', doctorsAvailable: 2, waitingPatients: 8 },
  { department: 'Pulmonology', doctorsAvailable: 2, waitingPatients: 12 },
];

const initialAmbulances: Ambulance[] = [
  { id: 'A1', vehicleNumber: 'XYZ123', status: 'Available', driverName: 'John Doe', driverContact: '1234567890', equipmentLevel: 'Basic' },
  { id: 'A2', vehicleNumber: 'XYZ456', status: 'Available', driverName: 'Jane Smith', driverContact: '0987654321', equipmentLevel: 'Advanced' },
  { id: 'A3', vehicleNumber: 'XYZ789', status: 'Available', driverName: 'Alice Johnson', driverContact: '1122334455', equipmentLevel: 'Critical Care' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [nurses, setNurses] = useState<Nurse[]>(initialNurses);
  const [beds, setBeds] = useState<BedAvailability[]>(initialBeds);
  const [equipment, setEquipment] = useState<Equipment[]>(initialEquipment);
  const [departmentLoads, setDepartmentLoads] = useState<DepartmentLoad[]>(initialDepartmentLoads);
  const [emergencyStatus, setEmergencyStatus] = useState<'Normal' | 'Busy' | 'Critical'>('Busy');
  const [ambulances, setAmbulances] = useState<Ambulance[]>(initialAmbulances);
  const [ambulanceRequests, setAmbulanceRequests] = useState<AmbulanceRequest[]>([]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update bed availability
      setBeds((prevBeds) =>
        prevBeds.map((bed) => {
          const change = Math.random() > 0.5 ? 1 : -1;
          const newOccupied = Math.max(0, Math.min(bed.total, bed.occupied + change));
          return {
            ...bed,
            occupied: newOccupied,
            available: bed.total - newOccupied,
          };
        })
      );

      // Update emergency status based on ICU availability
      const icuBeds = beds.find((b) => b.category === 'ICU Beds');
      if (icuBeds) {
        if (icuBeds.available <= 2) {
          setEmergencyStatus('Critical');
        } else if (icuBeds.available <= 5) {
          setEmergencyStatus('Busy');
        } else {
          setEmergencyStatus('Normal');
        }
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [beds]);

  const addPatient = (patient: Omit<Patient, 'id' | 'registeredAt'>) => {
    const newPatient: Patient = {
      ...patient,
      id: `P${String(patients.length + 1).padStart(3, '0')}`,
      registeredAt: new Date(),
      organHealth: calculateOrganHealth(patient),
    };
    setPatients((prev) => [...prev, newPatient]);
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((patient) => (patient.id === id ? { ...patient, ...updates } : patient))
    );
  };

  const getPatient = (id: string) => {
    return patients.find((p) => p.id === id);
  };

  const updateDoctor = (id: string, updates: Partial<Doctor>) => {
    setDoctors((prev) => prev.map((doctor) => (doctor.id === id ? { ...doctor, ...updates } : doctor)));
  };

  const updateNurse = (id: string, updates: Partial<Nurse>) => {
    setNurses((prev) => prev.map((nurse) => (nurse.id === id ? { ...nurse, ...updates } : nurse)));
  };

  const addMedication = (patientId: string, medication: Omit<Medication, 'id' | 'administeredAt'>) => {
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          const newMedication: Medication = {
            ...medication,
            id: `M${Date.now()}`,
            administeredAt: new Date(),
          };
          return {
            ...patient,
            medications: [...(patient.medications || []), newMedication],
          };
        }
        return patient;
      })
    );
  };

  const addSurgery = (patientId: string, surgery: Omit<Surgery, 'id'>) => {
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          const newSurgery: Surgery = {
            ...surgery,
            id: `S${Date.now()}`,
          };
          return {
            ...patient,
            surgeries: [...(patient.surgeries || []), newSurgery],
          };
        }
        return patient;
      })
    );
  };

  const updateSurgery = (patientId: string, surgeryId: string, updates: Partial<Surgery>) => {
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          return {
            ...patient,
            surgeries: patient.surgeries?.map((surgery) =>
              surgery.id === surgeryId ? { ...surgery, ...updates } : surgery
            ),
          };
        }
        return patient;
      })
    );
  };

  const requestAmbulance = (request: Omit<AmbulanceRequest, 'id' | 'requestedAt' | 'status'>) => {
    const newRequest: AmbulanceRequest = {
      ...request,
      id: `R${Date.now()}`,
      requestedAt: new Date(),
      status: 'Pending',
    };
    setAmbulanceRequests((prev) => [...prev, newRequest]);
  };

  const acceptAmbulanceRequest = (requestId: string, ambulanceId: string) => {
    setAmbulanceRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: 'Accepted',
              assignedAmbulanceId: ambulanceId,
            }
          : request
      )
    );
    setAmbulances((prev) =>
      prev.map((ambulance) =>
        ambulance.id === ambulanceId
          ? {
              ...ambulance,
              status: 'On Route',
            }
          : ambulance
      )
    );
  };

  const updateAmbulanceRequest = (requestId: string, updates: Partial<AmbulanceRequest>) => {
    setAmbulanceRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? {
              ...request,
              ...updates,
            }
          : request
      )
    );
  };

  const cancelAmbulanceRequest = (requestId: string) => {
    const request = ambulanceRequests.find((r) => r.id === requestId);
    setAmbulanceRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Cancelled',
            }
          : r
      )
    );
    if (request?.assignedAmbulanceId) {
      setAmbulances((prev) =>
        prev.map((ambulance) =>
          ambulance.id === request.assignedAmbulanceId
            ? {
                ...ambulance,
                status: 'Available',
              }
            : ambulance
        )
      );
    }
  };

  const value: AppContextType = {
    patients,
    addPatient,
    updatePatient,
    getPatient,
    doctors,
    updateDoctor,
    nurses,
    updateNurse,
    beds,
    equipment,
    departmentLoads,
    emergencyStatus,
    addMedication,
    addSurgery,
    updateSurgery,
    ambulances,
    ambulanceRequests,
    requestAmbulance,
    acceptAmbulanceRequest,
    updateAmbulanceRequest,
    cancelAmbulanceRequest,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Helper function to calculate organ health based on patient data
function calculateOrganHealth(patient: Omit<Patient, 'id' | 'registeredAt'>): Patient['organHealth'] {
  const organHealth: Patient['organHealth'] = {};

  // Heart health assessment
  if (patient.vitals.heartRate || patient.vitals.bloodPressure) {
    const hr = patient.vitals.heartRate || 0;
    const bp = patient.vitals.bloodPressure || '';
    const [systolic] = bp.split('/').map(Number);

    let status: 'Good' | 'Caution' | 'Critical' = 'Good';
    const recommendations: string[] = [];
    const alerts: string[] = [];

    if (hr > 100 || systolic > 140) {
      status = 'Caution';
      recommendations.push('Monitor blood pressure regularly', 'Reduce salt intake', 'Moderate exercise');
      alerts.push('Elevated vital signs detected');
    }

    organHealth.heart = {
      status,
      notes: `Heart rate: ${hr} bpm, Blood pressure: ${bp}`,
      recommendations,
      alerts,
    };
  }

  // Lungs health assessment
  if (patient.vitals.oxygenSaturation || patient.vitals.respiratoryRate) {
    const o2 = patient.vitals.oxygenSaturation || 100;
    const rr = patient.vitals.respiratoryRate || 16;

    let status: 'Good' | 'Caution' | 'Critical' = 'Good';
    const recommendations: string[] = ['Deep breathing exercises', 'Avoid smoking'];
    const alerts: string[] = [];

    if (o2 < 95 || rr > 20) {
      status = 'Caution';
      alerts.push('Respiratory parameters need monitoring');
      recommendations.push('Oxygen supplementation may be needed');
    }

    organHealth.lungs = {
      status,
      notes: `Oxygen saturation: ${o2}%, Respiratory rate: ${rr}/min`,
      recommendations,
      alerts,
    };
  }

  return organHealth;
}