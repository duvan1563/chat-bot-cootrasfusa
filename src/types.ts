import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Booking {
  id?: string;
  userUid: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  status: 'pending' | 'paid';
  amount: number;
  passengers: number;
  passengerName: string;
  passengerId: string;
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}
