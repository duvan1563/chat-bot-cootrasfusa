import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Check, CheckCheck, Menu, MoreVertical, Phone, Video, Search, Paperclip, Smile, Mic, Bus, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { processChat } from '../services/geminiService';
import { Message, Booking } from '../types';
import { TICKET_PRICE } from '../constants';
import { cn } from '../lib/utils';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState<Booking | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initial greeting
    setMessages([
      {
        id: '1',
        text: "¡Hola! 👋 Bienvenido a Cotransfusa, la mejor de la región. ✨\n\n¿En qué puedo ayudarte hoy?\n1. 🎫 Comprar un tiquete\n2. 📝 Quejas, reclamos o felicitaciones",
        sender: 'bot',
        timestamp: Date.now()
      }
    ]);
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage].map(m => ({ text: m.text, sender: m.sender }));
      const response = await processChat(chatHistory as any);
      
      const botText = response.text || "Lo siento, no pude procesar tu solicitud. ¿Podrías repetirlo?";
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === 'bookTicket') {
            const args = call.args as any;
            
            // Safety check: Don't show payment if model used placeholders
            const isPlaceholder = (val: string) => 
              val.includes('[') || val.includes(']') || 
              val.toLowerCase().includes('nombre') || 
              val.toLowerCase().includes('documento') ||
              val.toLowerCase().includes('id');

            if (isPlaceholder(args.passengerName) || isPlaceholder(args.passengerId)) {
              console.warn("Model attempted to book with placeholder data:", args);
              continue; 
            }

            const newBooking: Booking = {
              userUid: auth.currentUser?.uid || 'anonymous',
              origin: args.origin,
              destination: args.destination,
              date: args.date,
              time: args.time,
              passengers: args.passengers,
              passengerName: args.passengerName,
              passengerId: args.passengerId,
              amount: args.passengers * TICKET_PRICE,
              status: 'pending',
              createdAt: Timestamp.now()
            };

            const docRef = await addDoc(collection(db, 'bookings'), newBooking);
            setShowPayment({ ...newBooking, id: docRef.id });
          }

          if (call.name === 'requestTaxi') {
            const args = call.args as any;
            // Simulate sending request to taxi company
            setTimeout(() => {
              const taxiMessage: Message = {
                id: (Date.now() + 500).toString(),
                text: `🚖 *Servicio de Taxi Asociado*\n\nHola! Hemos recibido tu solicitud para recogerte en *${args.pickupLocation}* a las *${args.pickupTime}*. \n\nUn conductor se pondrá en contacto contigo en breve para confirmar la placa del vehículo. ✅`,
                sender: 'bot',
                timestamp: Date.now()
              };
              setMessages(prev => [...prev, taxiMessage]);
            }, 2000);
          }
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: 'bot',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Hubo un error al procesar tu mensaje. Por favor intenta de nuevo. ⚠️",
        sender: 'bot',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!showPayment || !showPayment.id) return;
    
    // Simulate payment
    try {
      // In a real app, we'd update the booking status in Firestore
      // For now, we'll just show a success message
      const successMessage: Message = {
        id: Date.now().toString(),
        text: `✅ ¡Pago exitoso! Tu reserva para ${showPayment.origin} -> ${showPayment.destination} el ${showPayment.date} a las ${showPayment.time} ha sido confirmada. ¡Buen viaje! 🚌✨`,
        sender: 'bot',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, successMessage]);
      setShowPayment(null);
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#efeae2] relative overflow-hidden">
      {/* Header */}
      <header className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Cotransfusa Assistant</h2>
            <p className="text-xs text-white/80">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <Video className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100" />
          <Phone className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100" />
          <MoreVertical className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100" />
        </div>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
        style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'contain' }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn(
                "flex w-full",
                msg.sender === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] px-3 py-2 rounded-lg shadow-sm relative",
                  msg.sender === 'user' 
                    ? "bg-[#d9fdd3] text-slate-800 rounded-tr-none" 
                    : "bg-white text-slate-800 rounded-tl-none"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender === 'user' && (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal Overlay */}
      <AnimatePresence>
        {showPayment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="bg-[#075e54] p-6 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Confirmar Pago</h3>
                <p className="text-white/80 text-sm">Resumen de tu reserva</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ruta:</span>
                  <span className="font-semibold text-slate-800">{showPayment.origin} → {showPayment.destination}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fecha:</span>
                  <span className="font-semibold text-slate-800">{showPayment.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Hora:</span>
                  <span className="font-semibold text-slate-800">{showPayment.time}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pasajeros:</span>
                  <span className="font-semibold text-slate-800">{showPayment.passengers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pasajero:</span>
                  <span className="font-semibold text-slate-800">{showPayment.passengerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Documento:</span>
                  <span className="font-semibold text-slate-800">{showPayment.passengerId}</span>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-800">Total:</span>
                  <span className="text-2xl font-black text-[#075e54]">${showPayment.amount.toLocaleString()} COP</span>
                </div>
                <button 
                  onClick={handlePayment}
                  className="w-full bg-[#25d366] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#128c7e] transition-colors active:scale-95"
                >
                  Pagar Ahora
                </button>
                <button 
                  onClick={() => setShowPayment(null)}
                  className="w-full text-slate-400 py-2 font-medium hover:text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <footer className="bg-[#f0f2f5] p-2 flex items-center gap-2 z-10">
        <div className="flex items-center gap-3 px-2">
          <Smile className="w-6 h-6 text-slate-500 cursor-pointer" />
          <Paperclip className="w-6 h-6 text-slate-500 cursor-pointer" />
        </div>
        <form onSubmit={handleSendMessage} className="flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="w-full bg-white rounded-lg px-4 py-2 text-sm focus:outline-none shadow-sm"
          />
        </form>
        <div className="flex items-center justify-center w-10 h-10 bg-[#075e54] rounded-full text-white cursor-pointer hover:bg-[#128c7e] transition-colors shadow-md" onClick={() => handleSendMessage()}>
          {inputText.trim() ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </div>
      </footer>
    </div>
  );
}
