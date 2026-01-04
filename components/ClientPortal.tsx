
import React, { useMemo } from 'react';
import { Appointment, Service, AppointmentStatus } from '../types';
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
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClientPortalProps {
  phone: string;
  appointments: Appointment[];
  services: Service[];
}

const ClientPortal: React.FC<ClientPortalProps> = ({ phone, appointments, services }) => {
  const navigate = useNavigate();

  const myBookings = useMemo(() => {
    return appointments.filter(a => a.clientPhone === phone).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, phone]);

  const upcoming = myBookings.filter(a => new Date(a.date) >= new Date() && a.status !== AppointmentStatus.CANCELLED);
  const past = myBookings.filter(a => new Date(a.date) < new Date() || a.status === AppointmentStatus.CANCELLED);

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-10 rounded-[40px] border border-[#dadce0] shadow-sm">
           <div className="flex items-center gap-6">
              <div className="h-20 w-20 bg-[#4285F4] rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                 <User className="h-10 w-10" />
              </div>
              <div>
                 <h1 className="text-3xl font-black text-[#202124] tracking-tight">Welcome back!</h1>
                 <p className="text-[#5f6368] font-bold uppercase text-[10px] tracking-widest mt-1">Logged in as {phone}</p>
              </div>
           </div>
           <button 
             onClick={() => navigate('/book')}
             className="bg-[#4285F4] text-white px-8 py-4 rounded-full font-black flex items-center gap-3 hover:bg-[#1a73e8] transition-all shadow-lg shadow-blue-500/20"
           >
             <Plus className="h-5 w-5" /> Book New Service
           </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Summary Cards */}
           <div className="lg:col-span-2 space-y-8">
              <section className="space-y-6">
                 <h2 className="text-xl font-black text-[#202124] flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#4285F4]" /> Upcoming Visits
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
                          <Sparkles className="h-10 w-10 text-[#4285F4] mx-auto mb-3 opacity-20" />
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
                          <button className="text-[#4285F4] font-black text-xs uppercase tracking-widest flex items-center gap-1 hover:underline">
                             Review <ArrowRight className="h-3 w-3" />
                          </button>
                       </div>
                    )) : (
                       <div className="p-12 text-center opacity-30">
                          <p className="text-sm font-bold uppercase tracking-widest">No past visits</p>
                       </div>
                    )}
                 </div>
              </section>
           </div>

           {/* Sidebar Info */}
           <div className="space-y-8">
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
                 <button className="w-full bg-white text-[#202124] py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all">
                    Redeem Points
                 </button>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-[#dadce0] space-y-4">
                 <h3 className="font-black text-[#202124] text-lg">Need help?</h3>
                 <p className="text-xs text-[#5f6368] font-medium leading-relaxed">Questions about your booking? Message us on WhatsApp for instant assistance.</p>
                 <button className="w-full bg-[#25D366] text-white py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-green-500/20">
                    Chat with Us
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
