import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, where, Timestamp } from 'firebase/firestore';
import { Booking } from '../types';
import { ORIGINS, DESTINATIONS, SCHEDULES } from '../constants';
import { Bus, Users, Calendar, MapPin, Clock, Search, Filter, ArrowRight, TrendingUp, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const BUS_CAPACITY = 20;

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOrigin, setSelectedOrigin] = useState(ORIGINS[0]);
  const [selectedDestination, setSelectedDestination] = useState(DESTINATIONS[1]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getAvailability = (time: string) => {
    const bookedSeats = bookings
      .filter(b => b.date === selectedDate && b.origin === selectedOrigin && b.destination === selectedDestination && b.time === time)
      .reduce((acc, b) => acc + b.passengers, 0);
    
    return {
      booked: bookedSeats,
      available: Math.max(0, BUS_CAPACITY - bookedSeats),
      percentage: Math.min(100, (bookedSeats / BUS_CAPACITY) * 100)
    };
  };

  const totalRevenue = bookings
    .filter(b => b.status === 'paid')
    .reduce((acc, b) => acc + b.amount, 0);

  const totalPassengers = bookings
    .reduce((acc, b) => acc + b.passengers, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cotransfusa Admin</h1>
            <p className="text-slate-500">Monitor real-time bus availability and bookings.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Live Dashboard
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6"
          >
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Passengers</p>
              <h3 className="text-2xl font-black text-slate-900">{totalPassengers}</h3>
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6"
          >
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <h3 className="text-2xl font-black text-slate-900">${totalRevenue.toLocaleString()} COP</h3>
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6"
          >
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <Bus className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Routes</p>
              <h3 className="text-2xl font-black text-slate-900">{ORIGINS.length * (DESTINATIONS.length - 1)}</h3>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Filter className="w-5 h-5" />
            Route Availability Filter
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Origin</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-200 appearance-none"
                >
                  {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-center pt-6">
              <ArrowRight className="text-slate-300 w-6 h-6" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-200 appearance-none"
                >
                  {DESTINATIONS.filter(d => d !== selectedOrigin).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Availability Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SCHEDULES.map((time) => {
            const { booked, available, percentage } = getAvailability(time);
            return (
              <motion.div 
                key={time}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "bg-white p-5 rounded-3xl border transition-all",
                  percentage >= 90 ? "border-red-100 bg-red-50/30" : "border-slate-100 hover:border-slate-200"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {time}
                  </div>
                  <span className={cn(
                    "text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter",
                    percentage >= 90 ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {percentage >= 90 ? "Full" : "Available"}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="text-2xl font-black text-slate-900">{available}</div>
                    <div className="text-xs font-bold text-slate-400">Seats Left</div>
                  </div>
                  
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        percentage >= 90 ? "bg-red-500" : percentage >= 50 ? "bg-amber-500" : "bg-green-500"
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>{booked} Booked</span>
                    <span>{BUS_CAPACITY} Total</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
