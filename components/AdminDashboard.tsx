
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Globe,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  Power,
  Wifi,
  WifiOff,
  LogOut,
  CalendarX,
  FileText,
  PieChart,
  Printer,
  MessageCircle,
  Send,
  Bell,
  Upload, // Added Upload icon
  ImagePlus, // Added ImagePlus icon for empty state
  Database // Added Database icon
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
import { db } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where } from 'firebase/firestore';

interface AdminDashboardProps {
  appointments: Appointment[];
  services: Service[];
  staff: Staff[];
  siteSettings: SiteSettings;
  promoMessage: string | null;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onAppointmentAdd: (app: Appointment) => void;
  onAppointmentDelete: (id: string) => void;
  onServiceUpdate: (service: Service) => void;
  onServiceAdd: (service: Service) => void;
  onServiceDelete: (id: string) => void;
  onStaffUpdate: (staff: Staff) => void;
  onStaffAdd: (staff: Staff) => void;
  onStaffDelete: (id: string) => void;
  onPromoUpdate: (msg: string | null) => void;
  onSettingsUpdate: (settings: SiteSettings) => void;
  onBulkSync: (newApps: Appointment[]) => void;
  onLogout: () => void;
  onRefresh?: () => void;
  onSeedData: () => void; // New Prop for seeding data
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  appointments, 
  services,
  staff,
  siteSettings,
  promoMessage,
  onStatusChange, 
  onAppointmentAdd,
  onAppointmentDelete,
  onServiceUpdate,
  onServiceAdd,
  onServiceDelete,
  onStaffUpdate,
  onStaffAdd,
  onStaffDelete,
  onPromoUpdate,
  onSettingsUpdate,
  onLogout,
  onRefresh,
  onSeedData
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'staff' | 'branding' | 'settings'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [promoForm, setPromoForm] = useState<string>(promoMessage || "");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAppForView, setSelectedAppForView] = useState<Appointment | null>(null);

  // Editors State
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  
  // Image Upload State
  const [isCompressing, setIsCompressing] = useState(false);

  // Blocking State
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockForm, setBlockForm] = useState({
    staffId: '',
    time: '09:00 AM',
    clientName: 'RESERVED / BLOCKED',
    notes: ''
  });

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);

  // Auth Verification State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Chat State
  const [activeChat, setActiveChat] = useState<{ phone: string; name: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const TIME_SLOTS = [
    '09:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  useEffect(() => {
    setSettingsForm(siteSettings);
  }, [siteSettings]);

  useEffect(() => {
    setPromoForm(promoMessage || "");
  }, [promoMessage]);

  useEffect(() => {
    if (activeChat) {
      const q = query(
        collection(db, 'chats', activeChat.phone, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChatMessages(msgs);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });
      return () => unsubscribe();
    }
  }, [activeChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat) return;

    try {
      await addDoc(collection(db, 'chats', activeChat.phone, 'messages'), {
        text: chatInput,
        sender: 'admin',
        createdAt: serverTimestamp()
      });
      setChatInput('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  // Image Compression Helper
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        };
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'service' | 'staff') => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file);
        if (type === 'service' && editingService) {
          setEditingService({ ...editingService, image: compressed });
        } else if (type === 'staff' && editingStaff) {
          setEditingStaff({ ...editingStaff, avatar: compressed });
        }
      } catch (e) {
        console.error("Upload error", e);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  // ... (Stats Logic kept same as previous)
  const stats = useMemo(() => {
    const totalRevenue = appointments
      .filter(a => a.status !== AppointmentStatus.CANCELLED)
      .reduce((acc, curr) => acc + curr.totalAmount, 0);
    
    const pendingCount = appointments.filter(a => a.status === AppointmentStatus.PENDING).length;
    const confirmedCount = appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length;
    
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

  const reportData = useMemo(() => {
    const validApps = appointments.filter(a => a.status !== AppointmentStatus.CANCELLED);
    
    const byPayment = {
      GCASH: validApps.filter(a => a.paymentMethod === 'GCASH').length,
      BANK: validApps.filter(a => a.paymentMethod === 'BANK_TRANSFER').length,
      CASH: validApps.filter(a => a.paymentMethod === 'CASH').length,
    };
    
    const total = validApps.length || 1; 

    return {
      totalSales: validApps.reduce((acc, curr) => acc + curr.totalAmount, 0),
      count: validApps.length,
      percentages: {
        GCASH: Math.round((byPayment.GCASH / total) * 100),
        BANK: Math.round((byPayment.BANK / total) * 100),
        CASH: Math.round((byPayment.CASH / total) * 100),
      },
      counts: byPayment
    };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => app.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  const handleExportSales = () => {
    const headers = [
      'Date', 'Time', 'Client Name', 'Client Phone', 'Service', 'Price (PHP)', 
      'Staff', 'Status', 'Payment Method', 'Reference Code'
    ];

    const rows = appointments.map(app => {
      const serviceName = services.find(s => s.id === app.serviceId)?.name || 'Unknown Service';
      const staffName = staff.find(s => s.id === app.staffId)?.name || 'Unknown Staff';
      
      const safeClientName = `"${app.clientName.replace(/"/g, '""')}"`;
      const safeServiceName = `"${serviceName.replace(/"/g, '""')}"`;
      const safeStaffName = `"${staffName.replace(/"/g, '""')}"`;
      
      return [
        app.date, app.time, safeClientName, `'${app.clientPhone}`, safeServiceName,
        app.totalAmount, safeStaffName, app.status, app.paymentMethod, app.referenceCode || 'N/A'
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GlamFlow_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowReportModal(false);
  };

  const handleBlockSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockForm.staffId) {
      alert("Please select a staff member");
      return;
    }

    const newApp: Appointment = {
      id: `BLOCK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      clientName: blockForm.clientName,
      clientEmail: '',
      clientPhone: 'N/A',
      serviceId: services[0]?.id || 'block', 
      staffId: blockForm.staffId,
      date: selectedDate,
      time: blockForm.time,
      status: AppointmentStatus.CONFIRMED,
      paymentMethod: 'CASH',
      totalAmount: 0,
      referenceCode: 'ADMIN-BLOCK',
      createdAt: new Date().toISOString()
    };

    onAppointmentAdd(newApp);
    setIsBlocking(false);
    setBlockForm({ staffId: '', time: '09:00 AM', clientName: 'RESERVED / BLOCKED', notes: '' });
  };

  const initiateSaveSettings = () => {
    if (activeTab === 'settings') {
      const isSensitiveChange = 
        settingsForm.adminPassword !== siteSettings.adminPassword ||
        settingsForm.adminUsername !== siteSettings.adminUsername;
      
      if (isSensitiveChange) {
        setShowAuthModal(true);
        setAuthError('');
        setAuthInput('');
        return;
      }
    }
    handleSaveSettings();
  };

  const handleVerifyAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (authInput === siteSettings.adminPassword) {
      handleSaveSettings();
      setShowAuthModal(false);
      setAuthInput('');
    } else {
      setAuthError('Incorrect current password.');
    }
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    onSettingsUpdate(settingsForm);
    onPromoUpdate(promoForm || null);
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    
    if (isAddingService) {
      onServiceAdd(editingService);
    } else {
      onServiceUpdate(editingService);
    }
    setEditingService(null);
    setIsAddingService(false);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    if (isAddingStaff) {
      onStaffAdd(editingStaff);
    } else {
      onStaffUpdate(editingStaff);
    }
    setEditingStaff(null);
    setIsAddingStaff(false);
  };

  const openWhatsApp = (phone: string, name?: string) => {
    if (!phone) return;
    let formatted = phone.replace(/\D/g, ''); 
    if (formatted.startsWith('0')) {
      formatted = '63' + formatted.substring(1);
    }
    const message = name 
      ? `Hello ${name}, this is from GlamFlow regarding your appointment.`
      : `Hello, this is from GlamFlow regarding your appointment.`;
    window.open(`https://api.whatsapp.com/send?phone=${formatted}&text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 font-sans text-slate-800">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-report-modal, #printable-report-modal * { visibility: visible; }
          #printable-report-modal { position: absolute; left: 0; top: 0; width: 100%; height: auto !important; margin: 0; padding: 0; overflow: visible !important; border: none; box-shadow: none; background: white; z-index: 9999; }
          .no-print { display: none !important; }
          .overflow-y-auto { overflow: visible !important; height: auto !important; }
        }
      `}</style>

      {/* Top Nav (Same as before) */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:gap-8 overflow-x-auto no-scrollbar min-w-0 flex-1">
             <div className="flex items-center gap-2 text-slate-900 font-black text-lg lg:text-xl tracking-tight shrink-0">
                <div className="h-8 w-8 lg:h-10 lg:w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <LayoutDashboard className="h-4 w-4 lg:h-5 lg:w-5" />
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    <tab.icon className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                ))}
             </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-3 shrink-0 pl-2 lg:pl-4 border-l border-slate-100">
             {!siteSettings.isOnline && (
               <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest animate-pulse whitespace-nowrap">
                  <WifiOff className="h-3 w-3" /> <span className="hidden md:inline">Offline</span>
               </div>
             )}
            <button 
              onClick={onLogout}
              className="h-8 w-8 lg:h-10 lg:w-10 bg-white rounded-full flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm border border-slate-100"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 lg:h-10 lg:w-10 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-[10px] lg:text-xs shadow-lg shadow-blue-500/20">
              AD
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* ... Dashboard Header & Stats ... */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h2 className="text-2xl font-black text-slate-800">Dashboard Overview</h2>
                  <p className="text-slate-500 font-medium text-sm">Welcome back to your control center.</p>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => setIsBlocking(true)} className="flex items-center gap-3 bg-amber-500 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 group justify-center">
                    <CalendarX className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>Block Time / Walk-in</span>
                 </button>
                 <button onClick={() => setShowReportModal(true)} className="flex items-center gap-3 bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group justify-center hidden md:flex">
                    <FileText className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                    <span>View Reports</span>
                 </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Revenue</p>
                 <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">₱{stats.totalRevenue.toLocaleString()}</span>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Bookings</p>
                 <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{appointments.length}</span>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Actions</p>
                 <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{stats.pendingCount}</span>
                 </div>
              </div>
               <div className={`p-6 rounded-[24px] shadow-xl text-white relative overflow-hidden transition-all ${siteSettings.isOnline ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/30' : 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-slate-500/30'}`}>
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">System Status</p>
                 <div className="mt-2">
                    <span className="text-2xl font-black">{siteSettings.isOnline ? 'Online' : 'Maintenance'}</span>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-lg text-slate-800">Revenue Analytics</h3>
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
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#4285F4" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>

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

            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="font-black text-lg text-slate-800">Booking Schedule</h3>
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
                           <div className="text-[10px] font-bold text-slate-400">{staff.find(s => s.id === app.staffId)?.name}</div>
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
                          <div className="flex items-center justify-end gap-2">
                             <button onClick={() => setActiveChat({ phone: app.clientPhone, name: app.clientName })} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm">
                                <MessageCircle className="h-3 w-3" /> Chat
                             </button>
                             {app.paymentProof && (
                                <button onClick={() => setSelectedAppForView(app)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm">
                                  <ImageIcon className="h-3 w-3" /> View
                                </button>
                             )}
                             <button onClick={() => { if (window.confirm("Delete?")) onAppointmentDelete(app.id); }} className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all">
                                <Trash2 className="h-4 w-4" />
                             </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-32 text-center opacity-40">
                          <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                          <p className="font-bold text-lg text-slate-400">No bookings for this date</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SERVICES TAB & STAFF TAB (Kept existing content structure) */}
        {activeTab === 'services' && (
          <div className="animate-in fade-in space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Service Menu</h2>
                <p className="text-slate-500 font-medium text-sm">Manage your treatments.</p>
              </div>
              <button 
                onClick={() => { setEditingService({ id: '', name: '', duration: 60, price: 0, category: 'Hair', image: '' }); setIsAddingService(true); }}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Service
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex gap-4 group hover:shadow-xl transition-all">
                   <img src={s.image} className="h-24 w-24 rounded-2xl object-cover bg-slate-100" />
                   <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                         <div>
                            <h3 className="font-black text-slate-800">{s.name}</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{s.category}</p>
                         </div>
                      </div>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                         <p className="text-lg font-black text-blue-600">₱{s.price}</p>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingService(s)} className="p-2 hover:bg-slate-100 rounded-full"><Edit2 className="h-4 w-4 text-slate-500" /></button>
                            <button onClick={() => onServiceDelete(s.id)} className="p-2 hover:bg-red-50 rounded-full"><Trash2 className="h-4 w-4 text-red-500" /></button>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="animate-in fade-in space-y-8">
             <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Team Members</h2>
                <p className="text-slate-500 font-medium text-sm">Manage your staff and experts.</p>
              </div>
              <button 
                onClick={() => { setEditingStaff({ id: '', name: '', role: '', rating: 5, avatar: '' }); setIsAddingStaff(true); }}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Staff
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {staff.map(s => (
                 <div key={s.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm text-center group hover:shadow-xl transition-all relative">
                    <button onClick={() => onStaffDelete(s.id)} className="absolute top-4 right-4 p-2 hover:bg-red-50 rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                    <button onClick={() => setEditingStaff(s)} className="absolute top-4 left-4 p-2 hover:bg-blue-50 rounded-full text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="h-4 w-4" /></button>
                    
                    <img src={s.avatar} className="h-24 w-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg" />
                    <h3 className="font-black text-lg text-slate-800">{s.name}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">{s.role}</p>
                    <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-black">
                       ★ {s.rating}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* BRANDING TAB - UPDATED WITH COLORS */}
        {activeTab === 'branding' && (
           <div className="animate-in fade-in max-w-3xl mx-auto space-y-8">
              <div className="text-center">
                 <h2 className="text-2xl font-black text-slate-800">Site Branding</h2>
                 <p className="text-slate-500 font-medium text-sm">Customize how your salon appears to clients.</p>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-6">
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Site Name</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500/20" value={settingsForm.siteName} onChange={e => setSettingsForm({...settingsForm, siteName: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Hero Title</label>
                    <textarea className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500/20 h-24" value={settingsForm.heroTitle} onChange={e => setSettingsForm({...settingsForm, heroTitle: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Hero Subtitle</label>
                    <textarea className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500/20 h-24" value={settingsForm.heroSubtitle} onChange={e => setSettingsForm({...settingsForm, heroSubtitle: e.target.value})} />
                 </div>
                 
                 {/* Color Settings */}
                 <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Primary Color</label>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                           <input 
                              type="color" 
                              value={settingsForm.primaryColor || '#4285F4'}
                              onChange={e => setSettingsForm({...settingsForm, primaryColor: e.target.value})}
                              className="h-10 w-10 rounded-full border-none cursor-pointer"
                           />
                           <span className="font-bold text-slate-600 uppercase text-xs">{settingsForm.primaryColor || '#4285F4'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">Buttons, Highlights, Icons</p>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Secondary Color</label>
                         <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                           <input 
                              type="color" 
                              value={settingsForm.secondaryColor || '#202124'}
                              onChange={e => setSettingsForm({...settingsForm, secondaryColor: e.target.value})}
                              className="h-10 w-10 rounded-full border-none cursor-pointer"
                           />
                           <span className="font-bold text-slate-600 uppercase text-xs">{settingsForm.secondaryColor || '#202124'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">Headings, Dark Backgrounds</p>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100">
                    <button onClick={initiateSaveSettings} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex justify-center gap-2">
                       {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
           <div className="animate-in fade-in max-w-3xl mx-auto space-y-8">
              <div className="text-center">
                 <h2 className="text-2xl font-black text-slate-800">System Configuration</h2>
                 <p className="text-slate-500 font-medium text-sm">Manage contacts, payments, and security.</p>
              </div>
              
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                       <h4 className="font-black text-slate-800">Maintenance Mode</h4>
                       <p className="text-xs text-slate-500 font-bold">Disable booking site for customers</p>
                    </div>
                    <button 
                      onClick={() => setSettingsForm({...settingsForm, isOnline: !settingsForm.isOnline})}
                      className={`w-14 h-8 rounded-full transition-colors relative ${settingsForm.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                       <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${settingsForm.isOnline ? 'left-7' : 'left-1'}`}></div>
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">WhatsApp Number</label>
                       <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="63917..." value={settingsForm.whatsappNumber} onChange={e => setSettingsForm({...settingsForm, whatsappNumber: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Contact Email</label>
                       <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={settingsForm.contactEmail} onChange={e => setSettingsForm({...settingsForm, contactEmail: e.target.value})} />
                    </div>
                 </div>

                 <div>
                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Lock className="h-4 w-4" /> Admin Credentials</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Username</label>
                          <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={settingsForm.adminUsername} onChange={e => setSettingsForm({...settingsForm, adminUsername: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                          <input type="password" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={settingsForm.adminPassword} onChange={e => setSettingsForm({...settingsForm, adminPassword: e.target.value})} />
                       </div>
                    </div>
                 </div>

                 {/* New Data Management Section */}
                 <div>
                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Database className="h-4 w-4" /> Data Management</h4>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                       <div>
                          <p className="font-bold text-slate-700 text-sm">Populate Demo Content</p>
                          <p className="text-xs text-slate-500">Add sample services and staff to database.</p>
                       </div>
                       <button 
                          onClick={onSeedData}
                          className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-2"
                       >
                          <RefreshCw className="h-4 w-4" /> Load Sample Data
                       </button>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100">
                    <button onClick={initiateSaveSettings} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black shadow-lg transition-all flex justify-center gap-2">
                       {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save System Settings
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* ... (Existing Modals: Chat, Security, Report, Block, etc.) ... */}
         {/* Security Verification Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
             <form onSubmit={handleVerifyAndSave} className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 p-8">
                <div className="text-center mb-6">
                   <h3 className="font-black text-lg text-slate-900">Security Verification</h3>
                   <p className="text-sm text-slate-500 mt-2">Enter current password to confirm changes.</p>
                </div>
                <input type="password" required placeholder="Current Password" value={authInput} onChange={e => setAuthInput(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-center text-lg outline-none mb-4" />
                {authError && <p className="text-red-500 text-xs font-bold text-center mb-4">{authError}</p>}
                <div className="flex gap-3">
                   <button type="button" onClick={() => setShowAuthModal(false)} className="flex-1 py-4 font-black uppercase tracking-widest text-xs text-slate-500 hover:bg-slate-50 rounded-2xl">Cancel</button>
                   <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all">Verify</button>
                </div>
             </form>
          </div>
        )}
        
        {/* VIEW APPOINTMENT DETAILS MODAL */}
        {selectedAppForView && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 relative flex flex-col md:flex-row max-h-[90vh]">
                <button 
                  onClick={() => setSelectedAppForView(null)} 
                  className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full text-slate-900 z-10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                {/* Image Section */}
                <div className="w-full md:w-1/2 bg-slate-100 flex items-center justify-center p-4 min-h-[300px]">
                   {selectedAppForView.paymentProof ? (
                      <img 
                        src={selectedAppForView.paymentProof} 
                        className="max-w-full max-h-full object-contain rounded-xl shadow-md cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(selectedAppForView.paymentProof, '_blank')}
                        title="Click to zoom"
                      />
                   ) : (
                      <div className="text-slate-400 flex flex-col items-center">
                         <ImageIcon className="h-12 w-12 mb-2" />
                         <span className="text-xs font-bold uppercase tracking-widest">No Proof Uploaded</span>
                      </div>
                   )}
                </div>

                {/* Details Section */}
                <div className="w-full md:w-1/2 p-8 overflow-y-auto">
                   <div className="mb-6">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ${
                        selectedAppForView.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        selectedAppForView.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {selectedAppForView.status}
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedAppForView.clientName}</h3>
                      <p className="text-sm font-bold text-slate-500">{selectedAppForView.clientPhone}</p>
                   </div>

                   <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service</p>
                         <p className="font-bold text-slate-800">{services.find(s => s.id === selectedAppForView.serviceId)?.name}</p>
                         <p className="text-xs text-slate-500 mt-1">with {staff.find(s => s.id === selectedAppForView.staffId)?.name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                            <p className="font-bold text-slate-800">{selectedAppForView.date}</p>
                         </div>
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</p>
                            <p className="font-bold text-slate-800">{selectedAppForView.time}</p>
                         </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment ({selectedAppForView.paymentMethod})</p>
                            <span className="font-black text-blue-600">₱{selectedAppForView.totalAmount}</span>
                         </div>
                         <p className="text-xs font-bold text-slate-700 break-all">Ref: {selectedAppForView.referenceCode || 'N/A'}</p>
                      </div>
                   </div>
                   
                   <div className="mt-8 flex gap-2">
                      <button 
                        onClick={() => {
                           if (window.confirm("Confirm this payment?")) {
                              onStatusChange(selectedAppForView.id, AppointmentStatus.CONFIRMED);
                              setSelectedAppForView(null);
                           }
                        }}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20"
                      >
                         Approve
                      </button>
                      <button 
                         onClick={() => setSelectedAppForView(null)}
                         className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                      >
                         Close
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
        
        {/* SERVICE EDIT/ADD MODAL */}
        {(editingService || isAddingService) && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
              <div className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 relative">
                 <button 
                    onClick={() => { setEditingService(null); setIsAddingService(false); }}
                    className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
                 >
                    <X className="h-5 w-5 text-slate-400" />
                 </button>
                 <h3 className="text-2xl font-black text-slate-800 mb-6">
                    {isAddingService ? 'Add New Service' : 'Edit Service'}
                 </h3>
                 <form onSubmit={handleSaveService} className="space-y-4">
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Service Name</label>
                       <input 
                          required 
                          className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500/20" 
                          value={editingService?.name} 
                          onChange={e => setEditingService({...editingService!, name: e.target.value})} 
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Price (PHP)</label>
                          <input 
                             type="number" 
                             required 
                             className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500/20" 
                             value={editingService?.price} 
                             onChange={e => setEditingService({...editingService!, price: Number(e.target.value)})} 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Duration (min)</label>
                          <input 
                             type="number" 
                             required 
                             className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500/20" 
                             value={editingService?.duration} 
                             onChange={e => setEditingService({...editingService!, duration: Number(e.target.value)})} 
                          />
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category</label>
                       <select 
                          className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500/20"
                          value={editingService?.category}
                          onChange={e => setEditingService({...editingService!, category: e.target.value})}
                       >
                          <option value="Hair">Hair</option>
                          <option value="Spa">Spa</option>
                          <option value="Skincare">Skincare</option>
                          <option value="Nails">Nails</option>
                       </select>
                    </div>
                    
                    {/* NEW IMAGE PREVIEW & UPLOAD SECTION */}
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Service Image</label>
                       
                       {/* Main Preview Container */}
                       <div className="relative group w-full h-48 bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center mb-3">
                          {editingService?.image ? (
                             <>
                                <img src={editingService.image} className="w-full h-full object-cover" />
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                      type="button"
                                      onClick={() => document.getElementById('service-img-upload')?.click()}
                                      className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-xs hover:bg-slate-100 flex items-center gap-2"
                                   >
                                      <Upload className="h-3 w-3" /> Change Photo
                                   </button>
                                   <button 
                                      type="button"
                                      onClick={() => setEditingService({...editingService!, image: ''})}
                                      className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-red-600 flex items-center gap-2"
                                   >
                                      <Trash2 className="h-3 w-3" /> Remove
                                   </button>
                                </div>
                             </>
                          ) : (
                             <div className="text-center p-4">
                                <ImagePlus className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-[10px] text-slate-400 font-bold uppercase">No Image Selected</p>
                             </div>
                          )}
                       </div>

                       {/* Controls */}
                       <div className="flex gap-2">
                          <input 
                             className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500/20 text-xs" 
                             value={editingService?.image?.startsWith('data:') ? '' : editingService?.image} 
                             onChange={e => setEditingService({...editingService!, image: e.target.value})} 
                             placeholder={editingService?.image?.startsWith('data:') ? "Image uploaded from gallery" : "Paste image URL here"}
                             disabled={editingService?.image?.startsWith('data:')}
                          />
                          <button 
                             type="button"
                             onClick={() => document.getElementById('service-img-upload')?.click()}
                             className="px-6 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center"
                             title="Upload from Gallery"
                          >
                             {isCompressing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                          </button>
                          <input 
                             id="service-img-upload" 
                             type="file" 
                             accept="image/*" 
                             className="hidden" 
                             onChange={(e) => handleImageUpload(e, 'service')} 
                          />
                       </div>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all mt-4">
                       {isAddingService ? 'Create Service' : 'Save Changes'}
                    </button>
                 </form>
              </div>
           </div>
        )}

        {/* STAFF EDIT/ADD MODAL */}
        {(editingStaff || isAddingStaff) && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
              <div className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 relative">
                 <button 
                    onClick={() => { setEditingStaff(null); setIsAddingStaff(false); }}
                    className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
                 >
                    <X className="h-5 w-5 text-slate-400" />
                 </button>
                 <h3 className="text-2xl font-black text-slate-800 mb-6">
                    {isAddingStaff ? 'Add Team Member' : 'Edit Member'}
                 </h3>
                 <form onSubmit={handleSaveStaff} className="space-y-4">
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                       <input 
                          required 
                          className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500/20" 
                          value={editingStaff?.name} 
                          onChange={e => setEditingStaff({...editingStaff!, name: e.target.value})} 
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Role/Title</label>
                          <input 
                             required 
                             className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500/20" 
                             value={editingStaff?.role} 
                             onChange={e => setEditingStaff({...editingStaff!, role: e.target.value})} 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rating</label>
                          <input 
                             type="number" 
                             step="0.1"
                             max="5"
                             required 
                             className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500/20" 
                             value={editingStaff?.rating} 
                             onChange={e => setEditingStaff({...editingStaff!, rating: Number(e.target.value)})} 
                          />
                       </div>
                    </div>
                    
                    {/* STAFF PHOTO UPLOAD SECTION */}
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Profile Photo</label>
                       
                       <div className="flex items-center gap-6 mb-3">
                          <div className="relative group h-24 w-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                             {editingStaff?.avatar ? (
                                <>
                                   <img src={editingStaff.avatar} className="w-full h-full object-cover" />
                                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => document.getElementById('staff-img-upload')?.click()}>
                                      <Upload className="h-6 w-6 text-white" />
                                   </div>
                                </>
                             ) : (
                                <UserCheck className="h-8 w-8 text-slate-300" />
                             )}
                          </div>
                          
                          <div className="flex-1 flex flex-col gap-2">
                              <div className="flex gap-2">
                                 <input 
                                    className="flex-1 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500/20 text-xs" 
                                    value={editingStaff?.avatar?.startsWith('data:') ? '' : editingStaff?.avatar} 
                                    onChange={e => setEditingStaff({...editingStaff!, avatar: e.target.value})} 
                                    placeholder={editingStaff?.avatar?.startsWith('data:') ? "Photo uploaded" : "Paste image URL"}
                                    disabled={editingStaff?.avatar?.startsWith('data:')}
                                 />
                                 <button 
                                    type="button"
                                    onClick={() => document.getElementById('staff-img-upload')?.click()}
                                    className="px-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
                                 >
                                    {isCompressing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-slate-600" />}
                                 </button>
                                 <input 
                                    id="staff-img-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleImageUpload(e, 'staff')} 
                                 />
                              </div>
                              {editingStaff?.avatar && (
                                 <button 
                                    type="button"
                                    onClick={() => setEditingStaff({...editingStaff!, avatar: ''})}
                                    className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest text-left"
                                 >
                                    Remove Photo
                                 </button>
                              )}
                          </div>
                       </div>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all mt-4">
                       {isAddingStaff ? 'Add Member' : 'Save Changes'}
                    </button>
                 </form>
              </div>
           </div>
        )}

        {/* REPORT MODAL */}
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 no-print">
            <div id="printable-report-modal" className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div>
                    <h2 className="text-2xl font-black text-slate-800">Business Report</h2>
                    <p className="text-slate-500 font-bold text-sm">Generated on {new Date().toLocaleDateString()}</p>
                 </div>
                 <div className="flex gap-2 no-print">
                    <button onClick={() => window.print()} className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                       <Printer className="h-5 w-5" />
                    </button>
                    <button onClick={() => setShowReportModal(false)} className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                       <X className="h-5 w-5" />
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100">
                       <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Total Sales</p>
                       <p className="text-3xl font-black text-blue-700">₱{reportData.totalSales.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-green-50 rounded-[32px] border border-green-100">
                       <p className="text-xs font-black uppercase tracking-widest text-green-500 mb-2">Completed Visits</p>
                       <p className="text-3xl font-black text-green-700">{reportData.count}</p>
                    </div>
                    <div className="p-6 bg-purple-50 rounded-[32px] border border-purple-100">
                       <p className="text-xs font-black uppercase tracking-widest text-purple-400 mb-2">Top Method</p>
                       <p className="text-3xl font-black text-purple-700">GCASH ({reportData.percentages.GCASH}%)</p>
                    </div>
                 </div>

                 <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                    <h3 className="font-black text-lg mb-6">Payment Distribution</h3>
                    <div className="space-y-4">
                       <div className="flex items-center gap-4">
                          <span className="w-16 font-bold text-xs">GCASH</span>
                          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-500" style={{ width: `${reportData.percentages.GCASH}%` }}></div>
                          </div>
                          <span className="w-12 text-right font-bold text-xs">{reportData.counts.GCASH}</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="w-16 font-bold text-xs">BANK</span>
                          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500" style={{ width: `${reportData.percentages.BANK}%` }}></div>
                          </div>
                          <span className="w-12 text-right font-bold text-xs">{reportData.counts.BANK}</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="w-16 font-bold text-xs">CASH</span>
                          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: `${reportData.percentages.CASH}%` }}></div>
                          </div>
                          <span className="w-12 text-right font-bold text-xs">{reportData.counts.CASH}</span>
                       </div>
                    </div>
                 </div>

                 <div>
                    <h3 className="font-black text-lg mb-4">Recent Transactions</h3>
                    <table className="w-full text-left text-sm">
                       <thead>
                          <tr className="border-b border-slate-200">
                             <th className="pb-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date</th>
                             <th className="pb-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">Client</th>
                             <th className="pb-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">Amount</th>
                             <th className="pb-3 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Method</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {appointments.slice(0, 5).map(app => (
                             <tr key={app.id}>
                                <td className="py-3 font-bold text-slate-700">{app.date}</td>
                                <td className="py-3 font-medium text-slate-600">{app.clientName}</td>
                                <td className="py-3 font-black text-slate-900">₱{app.totalAmount}</td>
                                <td className="py-3 text-right font-bold text-slate-500 text-xs">{app.paymentMethod}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 no-print">
                 <button onClick={handleExportSales} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" /> Download Full CSV Report
                 </button>
              </div>
            </div>
          </div>
        )}
        
        {activeChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
             <div className="bg-white w-full max-w-lg h-[600px] rounded-[40px] shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95">
                <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">{activeChat.name.charAt(0)}</div>
                      <div>
                         <h3 className="font-black text-lg leading-none">{activeChat.name}</h3>
                         <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">{activeChat.phone}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <button onClick={() => openWhatsApp(activeChat.phone, activeChat.name)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><Bell className="h-5 w-5" /></button>
                      <button onClick={() => setActiveChat(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="h-6 w-6" /></button>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                   {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${msg.sender === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                            {msg.text}
                         </div>
                      </div>
                   ))}
                   <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                   <input className="flex-grow bg-slate-100 border-none rounded-full px-6 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                   <button type="submit" disabled={!chatInput.trim()} className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"><Send className="h-5 w-5" /></button>
                </form>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
