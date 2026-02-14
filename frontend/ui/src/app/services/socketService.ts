/**
 * Socket.IO Service
 * 
 * Handles real-time communication with the backend for:
 * - Emergency alerts
 * - Risk level updates
 * - Triage updates
 * - Staff availability changes
 * - Hospital alerts
 */

import io, { Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private url: string;
  private userId: string | null = null;
  private userRole: string | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor(url: string = import.meta.env.VITE_API_URL || 'http://localhost:5000') {
    this.url = url;
  }

  /**
   * Connect to Socket.IO server
   */
  connect(userId: string, userRole: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.socket?.connected) {
          resolve();
          return;
        }

        this.userId = userId;
        this.userRole = userRole;

        this.socket = io(this.url, {
          query: {
            user_id: userId,
            user_role: userRole,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
          console.log('✅ Connected to Socket.IO server');
          this.emit('socket_connected');
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('❌ Disconnected from Socket.IO server');
          this.emit('socket_disconnected');
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          this.emit('socket_error', { error });
          reject(error);
        });

        // Register default listeners
        this.registerDefaultListeners();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket?.connected) {
      this.socket.disconnect();
    }
  }

  /**
   * Register default event listeners
   */
  private registerDefaultListeners(): void {
    if (!this.socket) return;

    // Connection response
    this.socket.on('connection_response', (data) => {
      console.log('Connection response:', data);
      this.emit('connection_response', data);
    });

    // Patient alerts
    this.socket.on('patient_alert', (data) => {
      console.log('🚨 Patient Alert:', data);
      this.emit('patient_alert', data);
    });

    // Risk updates
    this.socket.on('risk_updated', (data) => {
      console.log('⚠️ Risk Updated:', data);
      this.emit('risk_updated', data);
    });

    // Triage updates
    this.socket.on('triage_updated', (data) => {
      console.log('🔄 Triage Updated:', data);
      this.emit('triage_updated', data);
    });

    // Hospital alerts
    this.socket.on('hospital_alert', (data) => {
      console.log('🏥 Hospital Alert:', data);
      this.emit('hospital_alert', data);
    });

    // Staff availability changes
    this.socket.on('staff_availability_changed', (data) => {
      console.log('👤 Staff Availability Changed:', data);
      this.emit('staff_availability_changed', data);
    });

    // Bed status changes
    this.socket.on('bed_status_changed', (data) => {
      console.log('🛏️ Bed Status Changed:', data);
      this.emit('bed_status_changed', data);
    });

    // Room joined
    this.socket.on('room_joined', (data) => {
      console.log('Room joined:', data);
      this.emit('room_joined', data);
    });

    // Room left
    this.socket.on('room_left', (data) => {
      console.log('Room left:', data);
      this.emit('room_left', data);
    });
  }

  /**
   * Join a room for real-time updates
   */
  joinRoom(room: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected. Attempting to join room anyway.');
    }
    this.socket?.emit('join_room', { room });
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected. Attempting to leave room anyway.');
    }
    this.socket?.emit('leave_room', { room });
  }

  /**
   * Join patient room for updates
   */
  joinPatientRoom(patientId: string): void {
    this.joinRoom(`patient_${patientId}`);
  }

  /**
   * Leave patient room
   */
  leavePatientRoom(patientId: string): void {
    this.leaveRoom(`patient_${patientId}`);
  }

  /**
   * Join hospital room for updates
   */
  joinHospitalRoom(hospitalId: string): void {
    this.joinRoom(`hospital_${hospitalId}`);
  }

  /**
   * Leave hospital room
   */
  leaveHospitalRoom(hospitalId: string): void {
    this.leaveRoom(`hospital_${hospitalId}`);
  }

  /**
   * Join triage queue room
   */
  joinTriageQueue(): void {
    this.joinRoom('triage_queue');
  }

  /**
   * Leave triage queue room
   */
  leaveTriageQueue(): void {
    this.leaveRoom('triage_queue');
  }

  /**
   * Register event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Unregister event listener
   */
  off(event: string, callback: Function): void {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data?: any): void {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in listener for event '${event}':`, error);
      }
    });
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
let socketService: SocketService | null = null;

export function getSocketService(): SocketService {
  if (!socketService) {
    socketService = new SocketService();
  }
  return socketService;
}

export function createSocketService(url?: string): SocketService {
  socketService = new SocketService(url);
  return socketService;
}

export default SocketService;
