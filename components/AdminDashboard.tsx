
import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  X,
  Loader2,
  Settings,
  Lock,
  ImageIcon,
  RefreshCw,
  LayoutDashboard,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  Scissors,
  UserCheck,
  Palette,
  Plus,
  Trash2,
  Edit2,
  Megaphone,
  Globe
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Appointment, AppointmentStatus, Service, SiteSettings, Staff } from '../types';

interface AdminDashboardProps {
  appointments: Appointment[];
  services: Service[];
  staff: Staff[];
  siteSettings: SiteSettings;
  promoMessage: string | null;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onServiceUpdate: (service: Service) => void;
  onServiceAdd: (service: Service) => void;
  onServiceDelete: (id: string) => void;
  onStaffUpdate: (staff: Staff) => void;
  onStaffAdd: (staff: Staff) => void;
  onStaffDelete: (id: string) => void;
  onPromoUpdate: (msg: string | null) => void;
  onSettingsUpdate: (settings: SiteSettings) => void;
  onBulkSync: (newApps: Appointment[]) => void;
  onRefresh?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  appointments, 
  services,
  staff,
  siteSettings,
  promoMessage,
  onStatusChange, 
  onServiceUpdate,
  onServiceAdd,
  onServiceDelete,
  onStaffUpdate,
  onStaffAdd,
  onStaffDelete,
  onPromoUpdate,
  onSettingsUpdate,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'staff' | 'branding' | 'settings'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [promoForm, setPromoForm] = useState<string>(promoMessage || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAppForView, setSelectedAppForView] = useState<Appointment | null>(null);

  // Editors State
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // --- Statistics Logic ---
  const stats = useMemo(() => {
    const totalRevenue = appointments
      .filter(a => a.status !== AppointmentStatus.CANCELLED)
      .reduce((acc, curr) => acc + curr.totalAmount, 0);
    
    const pendingCount = appointments.filter(a => a.status === AppointmentStatus.PENDING).length;
    const confirmedCount = appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length;
    
    // Chart Data: Last 7 Days
    const chartData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayApps = appointments.filter(a => a.date === dateStr && a.status !== AppointmentStatus.CANCELLED);
      const dayRevenue = dayApps.reduce((acc, curr) => acc + curr.totalAmount, 0);
      
      chartData.push({
        name: dayName,
        revenue: dayRevenue,
        bookings: dayApps.length
      });
    }

    return { totalRevenue, pendingCount, confirmedCount, chartData };
  }, [appointments]);

  // Filter appointments based on selected date
  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => app.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  const handleSaveSettings = () => {
    setIsSaving(true);
    
    onSettingsUpdate(settingsForm);
    // Also save promo
    onPromoUpdate(promoForm || null);
    
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleManualRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  // Service Handlers
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      onServiceUpdate(editingService);
      setEditingService(null);
    } else if (isAddingService) {
      // Mock ID generation
      const newService = { ...editingService!, id: `s${Date.now()}` } as Service;
      onServiceAdd(newService);
      setIsAddingService(false);
      setEditingService(null);
    }
  };

  // Staff Handlers
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      onStaffUpdate(editingStaff);
      setEditingStaff(null);
    } else if (isAddingStaff) {
      const newStaff = { ...editingStaff!, id: `st${Date.now()}` } as Staff;
      onStaffAdd(newStaff);
      setIsAddingStaff(false);
      setEditingStaff(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 font-sans text-slate-800">
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 lg:top-0 z-40 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
             <div className="flex items-center gap-3 text-slate-900 font-black text-xl tracking-tight mr-4 shrink-0">
                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <span className="hidden sm:inline">Admin<span className="text-blue-600">Hub</span></span>
             </div>
             
             <div className="flex gap-1">
                {[
                  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                  { id: 'services', label: 'Services', icon: Scissors },
                  { id: 'staff', label: 'Team', icon: Users },
                  { id: 'branding', label: 'Branding', icon: Palette },
                  { id: 'settings', label: 'System', icon: Settings },
                ].map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 pl-4">
            <div className="h-10 w-10 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-500/20">
              AD
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign className="h-16 w-16 text-blue-600" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Revenue</p>
                 <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">₱{stats.totalRevenue.toLocaleString()}</span>
                 </div>
                 <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">
                    <TrendingUp className="h-3 w-3" /> +12% this week
                 </div>
              </div>

              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Users className="h-16 w-16 text-purple-600" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Bookings</p>
                 <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{appointments.length}</span>
                 </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">
                    <ArrowUpRight className="h-3 w-3" /> New leads
                 </div>
              </div>

              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Clock className="h-16 w-16 text-amber-500" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Actions</p>
                 <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{stats.pendingCount}</span>
                 </div>
                 <p className="mt-4 text-[10px] font-bold text-amber-600">Requires verification</p>
              </div>

               <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[24px] shadow-xl shadow-blue-500/30 text-white relative overflow-hidden">
                 <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white/10 rounded-full blur-2xl"></div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">System Status</p>
                 <div className="mt-2">
                    <span className="text-2xl font-black">Online</span>
                 </div>
                 <p className="mt-4 text-[10px] font-bold text-blue-100 flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                    Firebase Live
                 </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Analytics Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-lg text-slate-800">Revenue Analytics</h3>
                  <select className="bg-slate-50 border-none text-xs font-bold text-slate-500 rounded-lg p-2 outline-none">
                    <option>Last 7 Days</option>
                  </select>
                </div>
                <div className="h-[300px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.chartData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4285F4" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4285F4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} tickFormatter={(val) => `₱${val}`} />
                        <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold'}}
                          itemStyle={{color: '#4285F4'}}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#4285F4" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>

              {/* Date Navigator */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center h-full">
                  <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest mb-4">Selected Date</h3>
                  <div className="flex items-center gap-6 mb-6">
                    <button onClick={() => {
                      const d = new Date(selectedDate); d.setDate(d.getDate() - 1);
                      setSelectedDate(d.toISOString().split('T')[0]);
                    }} className="h-10 w-10 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-600 transition-colors"><ChevronLeft className="h-6 w-6" /></button>
                    
                    <div>
                       <span className="block text-4xl font-black text-slate-800 tracking-tighter">{new Date(selectedDate).getDate()}</span>
                       <span className="block text-sm font-bold text-blue-600 uppercase tracking-widest">{new Date(selectedDate).toLocaleDateString('en-US', { month: 'long' })}</span>
                    </div>
                    
                    <button onClick={() => {
                      const d = new Date(selectedDate); d.setDate(d.getDate() + 1);
                      setSelectedDate(d.toISOString().split('T')[0]);
                    }} className="h-10 w-10 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-600 transition-colors"><ChevronRight className="h-6 w-6" /></button>
                  </div>
                  <div className="w-full bg-slate-50 py-3 rounded-xl">
                     <p className="text-xs font-bold text-slate-500">{filteredAppointments.length} Appointments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="font-black text-lg text-slate-800">Booking Schedule</h3>
                 <button className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline">View All History</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Time</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredAppointments.length > 0 ? filteredAppointments.map(app => (
                      <tr key={app.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-8 py-5 font-black text-slate-700 text-sm">{app.time}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className="h-8 w-8 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-[10px] font-black text-slate-600">
                                {app.clientName.charAt(0)}
                             </div>
                             <div>
                                <p className="font-bold text-slate-900 text-sm">{app.clientName}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{app.clientPhone}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className="font-bold text-sm text-slate-700">{services.find(s => s.id === app.serviceId)?.name || 'Unknown'}</span>
                           <span className="block text-[10px] font-bold text-slate-400 mt-1">₱{app.totalAmount} • {app.paymentMethod}</span>
                        </td>
                        <td className="px-8 py-5">
                          <select 
                            value={app.status} 
                            onChange={(e) => onStatusChange(app.id, e.target.value as AppointmentStatus)}
                            className={`text-[10px] font-black uppercase tracking-widest border-none rounded-lg p-2 outline-none w-full cursor-pointer transition-all ${
                              app.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                              app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <option value={AppointmentStatus.PENDING}>PENDING</option>
                            <option value={AppointmentStatus.CONFIRMED}>CONFIRMED</option>
                            <option value={AppointmentStatus.CANCELLED}>CANCELLED</option>
                          </select>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {app.paymentProof ? (
                            <button 
                              onClick={() => setSelectedAppForView(app)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                            >
                              <ImageIcon className="h-3 w-3" /> View Receipt
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Proof</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-32 text-center opacity-40">
                          <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                          <p className="font-bold text-lg text-slate-400">No bookings for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-2">Relax and recharge</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900">Services Menu</h2>
                <button 
                  onClick={() => { setIsAddingService(true); setEditingService({ id: '', name: '', price: 0, duration: 60, category: 'Hair', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400' }); }}
                  className="bg-slate-900 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Service
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(s => (
                  <div key={s.id} className="bg-white rounded-[32px] border border-slate-100 p-4 shadow-sm group hover:shadow-xl transition-all">
                     <div className="relative h-48 rounded-[24px] overflow-hidden mb-4">
                        <img src={s.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-2 right-2 flex gap-2">
                           <button onClick={() => { setEditingService(s); setIsAddingService(false); }} className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-blue-500 hover:text-white transition-colors shadow-lg"><Edit2 className="h-4 w-4" /></button>
                           <button onClick={() => onServiceDelete(s.id)} className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                     </div>
                     <div className="px-2 pb-2">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="font-black text-lg text-slate-800 leading-tight">{s.name}</h3>
                           <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">₱{s.price}</span>
                        </div>
                        <div className="flex gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                           <span>{s.category}</span>
                           <span>•</span>
                           <span>{s.duration} mins</span>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
             
             {/* Edit/Add Modal */}
             {(editingService || isAddingService) && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <form onSubmit={handleSaveService} className="bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95">
                     <h3 className="text-xl font-black mb-6">{isAddingService ? 'Add New Service' : 'Edit Service'}</h3>
                     <div className="space-y-4">
                        <div>
                           <label className="text-[10px] font-black uppercase text-slate-400">Service Name</label>
                           <input required value={editingService?.name} onChange={e => setEditingService({...editingService!, name: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400">Price (PHP)</label>
                              <input required type="number" value={editingService?.price} onChange={e => setEditingService({...editingService!, price: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" />
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400">Duration (Min)</label>
                              <input required type="number" value={editingService?.duration} onChange={e => setEditingService({...editingService!, duration: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" />
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase text-slate-400">Category</label>
                           <input required value={editingService?.category} onChange={e => setEditingService({...editingService!, category: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase text-slate-400">Image URL</label>
                           <input required value={editingService?.image} onChange={e => setEditingService({...editingService!, image: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" />
                        </div>
                     </div>
                     <div className="flex gap-4 mt-8">
                        <button type="button" onClick={() => { setEditingService(null); setIsAddingService(false); }} className="flex-1 py-4 font-black uppercase tracking-widest text-xs text-slate-500 hover:bg-slate-50 rounded-2xl">Cancel</button>
                        <button type="submit" className="flex-1 bg-slate-900 text-white py-4 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:scale-105 transition-transform">Save Service</button>
                     </div>
                  </form>
               </div>
             )}
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900">Meet the Experts</h2>
                <button 
                  onClick={() => { setIsAddingStaff(true); setEditingStaff({ id: '', name: '', role: 'Specialist', rating: 5.0, avatar: 'https://i.pravatar.cc/150' }); }}
                  className="bg-slate-900 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Member
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map(st => (
                   <div key={st.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                      <img src={st.avatar} className="h-20 w-20 rounded-full object-cover shadow-md" />
                      <div className="flex-grow">
                         <h3 className="font-black text-lg text-slate-900">{st.name}</h3>
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{st.role}</p>
                         <p className="text-xs font-bold text-amber-500 mt-1">★ {st.rating}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                          <button onClick={() => { setEditingStaff(st); setIsAddingStaff(false); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded-full"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => onStaffDelete(st.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-full"><Trash2 className="h-4 w-4" /></button>
                      </div>
                   </div>
                ))}
             </div>

             {/* Edit/Add Staff Modal */}
             {(editingStaff || isAddingStaff) && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <form onSubmit={handleSaveStaff} className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95">
                     <h3 className="text-xl font-black mb-6">{isAddingStaff ? 'Add Team Member' : 'Edit Profile'}</h3>
                     <div className="space-y-4">
                        <div>
                           <label className="text-[10px] font-black uppercase text-slate-400">Full Name</label>
                           <input required value={editingStaff?.name} onChange={e => setEditingStaff({...editingStaff!, name: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase text-slate-400">Role / Title</label>
                           <input required value={editingStaff?.role} onChange={e => setEditingStaff({...editingStaff!, role: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase text-slate-400">Avatar URL</label>
                           <input required value={editingStaff?.avatar} onChange={e => setEditingStaff({...editingStaff!, avatar: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" />
                        </div>
                     </div>
                     <div className="flex gap-4 mt-8">
                        <button type="button" onClick={() => { setEditingStaff(null); setIsAddingStaff(false); }} className="flex-1 py-4 font-black uppercase tracking-widest text-xs text-slate-500 hover:bg-slate-50 rounded-2xl">Cancel</button>
                        <button type="submit" className="flex-1 bg-slate-900 text-white py-4 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:scale-105 transition-transform">Save Profile</button>
                     </div>
                  </form>
               </div>
             )}
          </div>
        )}

        {/* BRANDING TAB */}
        {activeTab === 'branding' && (
           <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full translate-x-10 -translate-y-10"></div>
                 <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 relative z-10 mb-6">
                    <Globe className="h-5 w-5 text-purple-600" /> Site Content
                 </h3>
                 <div className="space-y-6 relative z-10">
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hero Title (Landing Page)</label>
                       <textarea 
                          value={settingsForm.heroTitle} 
                          onChange={e => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg outline-none focus:border-purple-500 focus:bg-white transition-all min-h-[100px]"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hero Subtitle</label>
                       <textarea 
                          value={settingsForm.heroSubtitle} 
                          onChange={e => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none focus:border-purple-500 focus:bg-white transition-all min-h-[80px]"
                       />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Site Name</label>
                          <input 
                             value={settingsForm.siteName} 
                             onChange={e => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                             className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-purple-500 transition-all"
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                          <input 
                             value={settingsForm.contactPhone} 
                             onChange={e => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                             className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-purple-500 transition-all"
                          />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                 <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 relative z-10 mb-6">
                    <Megaphone className="h-5 w-5 text-amber-500" /> Promo Ticker
                 </h3>
                 <div className="relative z-10">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Announcement</label>
                    <input 
                       value={promoForm} 
                       onChange={e => setPromoForm(e.target.value)}
                       placeholder="e.g. 50% OFF on all services this weekend!"
                       className="w-full p-4 bg-amber-50 border border-amber-100 text-amber-900 rounded-2xl font-bold outline-none focus:border-amber-500 transition-all"
                    />
                 </div>
              </div>

              <div className="flex justify-end pt-4">
                 <button 
                    onClick={handleSaveSettings} 
                    disabled={isSaving}
                    className="bg-slate-900 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-70"
                 >
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {isSaving ? 'Updating Site...' : 'Publish Changes'}
                 </button>
              </div>
           </div>
        )}

        {/* SYSTEM SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
               <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full translate-x-10 -translate-y-10"></div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 relative z-10">
                     <Lock className="h-5 w-5 text-blue-600" /> Admin Access
                  </h3>
                  <p className="text-sm text-slate-500 mb-6 relative z-10">
                     Update your login credentials to secure the dashboard. (Will be saved to Cloud)
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                        <input 
                           value={settingsForm.adminUsername || ''} 
                           onChange={e => setSettingsForm({ ...settingsForm, adminUsername: e.target.value })}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <input 
                           type="password"
                           value={settingsForm.adminPassword || ''} 
                           onChange={e => setSettingsForm({ ...settingsForm, adminPassword: e.target.value })}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                     </div>
                  </div>
               </div>

            <div className="flex justify-end pt-4 pb-12">
               <button 
                  onClick={handleSaveSettings} 
                  disabled={isSaving}
                  className="bg-slate-900 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-70"
               >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Receipt View Modal */}
      {selectedAppForView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h4 className="font-black text-slate-900 text-lg">Payment Verification</h4>
              <button onClick={() => setSelectedAppForView(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="text-center space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Code</p>
                 <p className="text-3xl font-black text-blue-600 font-mono tracking-tight">{selectedAppForView.referenceCode || 'NONE'}</p>
              </div>
              
              <div className="bg-slate-100 rounded-3xl border border-slate-200 p-2">
                {selectedAppForView.paymentProof ? (
                  <img 
                    src={selectedAppForView.paymentProof} 
                    className="w-full h-auto max-h-[400px] object-contain rounded-2xl bg-white shadow-sm" 
                    alt="Receipt" 
                  />
                ) : (
                  <div className="h-40 flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">No Image Data</div>
                )}
              </div>

              <div className="flex gap-4 pt-2">
                 <button 
                  onClick={() => setSelectedAppForView(null)}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => { onStatusChange(selectedAppForView.id, AppointmentStatus.CONFIRMED); setSelectedAppForView(null); }}
                  className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
