
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Appointment, Service, AppointmentStatus, SiteSettings } from '../types';
import { 
  Calendar, 
  Clock, 
  Tag, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  History,
  Star,
  Sparkles,
  ArrowRight,
  X,
  Loader2,
  MessageSquare,
  Send,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface ClientPortalProps {
  phone: string;
  appointments: Appointment[];
  services: Service[];
  settings: SiteSettings;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ phone, appointments, services, settings }) => {
  const navigate = useNavigate();
  const primaryColor = settings.primaryColor || '#4285F4';

  // Review State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const myBookings = useMemo(() => {
    return appointments.filter(a => a.clientPhone === phone).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, phone]);

  // Retrieve Client Name from booking history
  const clientName = useMemo(() => {
    const match = myBookings.find(a => a.clientName && a.clientName.trim() !== '');
    return match ? match.clientName : '';
  }, [myBookings]);

  const upcoming = myBookings.filter(a => new Date(a.date) >= new Date() && a.status !== AppointmentStatus.CANCELLED);
  const past = myBookings.filter(a => new Date(a.date) < new Date() || a.status === AppointmentStatus.CANCELLED);

  // Chat Subscription (Always Active)
  useEffect(() => {
    const q = query(
      collection(db, 'chats', phone, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsubscribe();
  }, [phone]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      await addDoc(collection(db, 'chats', phone, 'messages'), {
        text: chatInput,
        sender: 'client',
        createdAt: serverTimestamp()
      });
      setChatInput('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleNotifyAdmin = () => {
    if (!settings.whatsappNumber) return;
    const cleanNum = settings.whatsappNumber.replace(/\D/g, '');
    const message = `Hello! I sent a message on the GlamFlow Portal. Please check my inbox. \n\nClient: ${phone}`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanNum}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleOpenReview = (app: Appointment) => {
    setSelectedApp(app);
    setRating(5);
    setFeedback('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    
    setIsSubmitting(true);
    try {
      const appRef = doc(db, 'appointments', selectedApp.id);
      await updateDoc(appRef, {
        rating: rating,
        feedback: feedback
      });
      setReviewModalOpen(false);
      setSelectedApp(null);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 lg:p-10 rounded-[40px] border border-[#dadce0] shadow-sm">
           <div className="flex items-center gap-6">
              <div style={{ backgroundColor: primaryColor }} className="h-16 w-16 lg:h-20 lg:w-20 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                 <User className="h-8 w-8 lg:h-10 lg:w-10" />
              </div>
              <div>
                 <h1 className="text-2xl lg:text-3xl font-black text-[#202124] tracking-tight">
                    Welcome back{clientName ? `, ${clientName.split(' ')[0]}` : ''}!
                 </h1>
                 <p className="text-[#5f6368] font-bold uppercase text-[10px] tracking-widest mt-1">Logged in as {phone}</p>
              </div>
           </div>
           <button 
             onClick={() => navigate('/book')}
             style={{ backgroundColor: primaryColor }}
             className="w-full md:w-auto text-white px-8 py-4 rounded-full font-black flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-lg shadow-blue-500/20"
           >
             <Plus className="h-5 w-5" /> Book New Service
           </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Summary Cards (Left Column) */}
           <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
              <section className="space-y-6">
                 <h2 className="text-xl font-black text-[#202124] flex items-center gap-2">
                    <Calendar className="h-5 w-5" style={{ color: primaryColor }} /> Upcoming Visits
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcoming.length > 0 ? upcoming.map(app => (
                       <div key={app.id} className="bg-white p-6 rounded-[32px] border border-[#dadce0] hover:shadow-lg transition-all space-y-4">
                          <div className="flex justify-between items-start">
                             <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                               app.status === AppointmentStatus.CONFIRMED ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                             }`}>
                               {app.status}
                             </span>
                             <p className="text-[10px] font-black text-[#bdc1c6] uppercase tracking-widest">#{app.id}</p>
                          </div>
                          <div>
                             <p className="text-lg font-black text-[#202124]">{services.find(s => s.id === app.serviceId)?.name}</p>
                             <div className="flex items-center gap-2 text-xs font-bold text-[#5f6368] mt-1">
                                <Clock className="h-3 w-3" /> {app.date} @ {app.time}
                             </div>
                          </div>
                       </div>
                    )) : (
                       <div className="col-span-2 bg-[#e8f0fe]/30 border-2 border-dashed border-[#dadce0] p-12 rounded-[32px] text-center">
                          <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-20" style={{ color: primaryColor }} />
                          <p className="text-sm font-bold text-[#5f6368]">No upcoming appointments.</p>
                       </div>
                    )}
                 </div>
              </section>

              <section className="space-y-6">
                 <h2 className="text-xl font-black text-[#202124] flex items-center gap-2">
                    <History className="h-5 w-5 text-[#bdc1c6]" /> Service History
                 </h2>
                 <div className="bg-white rounded-[40px] border border-[#dadce0] overflow-hidden">
                    {past.length > 0 ? past.map(app => (
                       <div key={app.id} className="p-6 border-b border-[#f1f3f4] last:border-none flex justify-between items-center hover:bg-gray-50 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 bg-[#f1f3f4] rounded-full flex items-center justify-center text-[#5f6368]">
                                <Tag className="h-5 w-5" />
                             </div>
                             <div>
                                <p className="font-bold text-[#202124]">{services.find(s => s.id === app.serviceId)?.name}</p>
                                <p className="text-xs text-[#bdc1c6] font-medium">{app.date}</p>
                             </div>
                          </div>
                          
                          {app.rating ? (
                             <div className="flex flex-col items-end gap-1">
                                <div className="flex">
                                   {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`h-3 w-3 ${i < app.rating! ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                   ))}
                                </div>
                                <span className="text-[9px] font-black uppercase text-green-600 tracking-widest">Reviewed</span>
                             </div>
                          ) : (
                             <button 
                                onClick={() => handleOpenReview(app)}
                                className="font-black text-xs uppercase tracking-widest flex items-center gap-1 hover:underline"
                                style={{ color: primaryColor }}
                             >
                                Review <ArrowRight className="h-3 w-3" />
                             </button>
                          )}
                       </div>
                    )) : (
                       <div className="p-12 text-center opacity-30">
                          <p className="text-sm font-bold uppercase tracking-widest">No past visits</p>
                       </div>
                    )}
                 </div>
              </section>
           </div>

           {/* Sidebar Info (Right Column) */}
           <div className="space-y-8 order-1 lg:order-2">
              
              {/* EMBEDDED CHAT WIDGET */}
              <div className="bg-white rounded-[40px] border border-[#dadce0] shadow-sm flex flex-col h-[600px] overflow-hidden relative animate-in slide-in-from-right-4">
                  {/* Chat Header */}
                  <div className="p-6 text-white flex justify-between items-center shrink-0" style={{ backgroundColor: primaryColor }}>
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                           <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                           <h3 className="font-bold text-lg leading-none">Customer Support</h3>
                           <p className="text-[10px] opacity-80 uppercase tracking-widest mt-1">Direct to Admin</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <button 
                           onClick={handleNotifyAdmin}
                           className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                           title="Notify Admin via WhatsApp"
                        >
                           <Bell className="h-4 w-4" />
                        </button>
                        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                     </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth">
                     {chatMessages.length === 0 && (
                        <div className="text-center text-slate-400 mt-20 flex flex-col items-center">
                           <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                              <MessageSquare className="h-8 w-8 opacity-40" />
                           </div>
                           <p className="text-xs font-bold uppercase tracking-widest">Start a conversation</p>
                           <p className="text-[10px] text-slate-400 mt-1">We typically reply within minutes.</p>
                        </div>
                     )}
                     {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                           <div 
                              className={`max-w-[85%] p-3 px-4 rounded-2xl text-sm font-medium leading-relaxed ${
                                msg.sender === 'client' 
                                ? 'text-white rounded-tr-none shadow-md shadow-blue-500/10' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                              }`}
                              style={msg.sender === 'client' ? { backgroundColor: primaryColor } : {}}
                           >
                              {msg.text}
                           </div>
                        </div>
                     ))}
                     <div ref={chatEndRef} />
                  </div>

                  {/* Input Area */}
                  <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                     <input 
                        className="flex-grow bg-slate-100 border-none rounded-full px-6 py-3 text-sm font-medium outline-none focus:ring-2 transition-all"
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                     />
                     <button type="submit" disabled={!chatInput.trim()} style={{ backgroundColor: primaryColor }} className="text-white p-3 rounded-full hover:brightness-110 transition-colors disabled:opacity-50 shadow-md">
                        <Send className="h-5 w-5" />
                     </button>
                  </form>
              </div>

              <div className="bg-[#202124] p-8 rounded-[40px] text-white space-y-6 relative overflow-hidden shadow-2xl">
                 <Sparkles className="absolute top-4 right-4 h-6 w-6 text-amber-400 opacity-50" />
                 <div>
                    <h3 className="text-xl font-black">Beauty Perks</h3>
                    <p className="text-xs text-white/60 font-medium mt-1">Exclusive rewards for regular clients.</p>
                 </div>
                 <div className="space-y-4">
                    <div className="bg-white/10 p-4 rounded-2xl">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Loyalty Status</p>
                       <p className="text-lg font-bold flex items-center gap-2">Glam Silver <Star className="h-4 w-4 fill-amber-400 text-amber-400" /></p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Visits</p>
                       <p className="text-lg font-bold">{myBookings.length}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedApp && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -translate-y-10 translate-x-10"></div>
               
               <div className="flex justify-between items-center mb-6 relative z-10">
                  <div className="flex items-center gap-2 text-amber-500">
                     <Star className="h-6 w-6 fill-current" />
                     <h3 className="text-xl font-black text-[#202124]">Rate Experience</h3>
                  </div>
                  <button onClick={() => setReviewModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                     <X className="h-5 w-5 text-slate-400" />
                  </button>
               </div>

               <div className="relative z-10 space-y-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</p>
                     <p className="font-bold text-[#202124]">{services.find(s => s.id === selectedApp.serviceId)?.name}</p>
                     <p className="text-xs text-slate-500 mt-1">{selectedApp.date}</p>
                  </div>

                  <div className="flex justify-center gap-2 py-2">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                           key={star}
                           onClick={() => setRating(star)}
                           className="p-1 hover:scale-110 transition-transform focus:outline-none"
                        >
                           <Star 
                              className={`h-10 w-10 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                              strokeWidth={star <= rating ? 0 : 2}
                           />
                        </button>
                     ))}
                  </div>
                  <div className="text-center">
                     <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                        {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : 'Could be better'}
                     </p>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Comments (Optional)</label>
                     <textarea 
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Tell us what you liked..."
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium text-sm outline-none focus:ring-2 ring-amber-400/20 min-h-[100px] resize-none"
                     />
                  </div>

                  <button 
                     onClick={handleSubmitReview}
                     disabled={isSubmitting}
                     className="w-full bg-[#202124] text-white py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-lg hover:bg-black hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                     Submit Review
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ClientPortal;
