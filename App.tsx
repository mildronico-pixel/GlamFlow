
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Sparkles,
  User,
  X,
  LogOut,
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  UserCircle,
  Megaphone,
  Wifi,
  WifiOff,
  Database
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import BookingFlow from './components/BookingFlow';
import BeautyConcierge from './components/BeautyConcierge';
import AdminLogin from './components/AdminLogin';
import ClientLogin from './components/ClientLogin';
import ClientPortal from './components/ClientPortal';
import { Appointment, AppointmentStatus, Service, SiteSettings, Staff } from './types';
import { MOCK_APPOINTMENTS, SERVICES as INITIAL_SERVICES, STAFF as INITIAL_STAFF } from './constants';

// FIREBASE IMPORTS
import { db } from './firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, query, orderBy, deleteDoc } from 'firebase/firestore';

const INITIAL_SETTINGS: SiteSettings = {
  siteName: "GlamFlow",
  heroTitle: "Elevate your\ninner glow.",
  heroSubtitle: "Experience the fusion of Filipino hospitality and advanced Google AI. Your personalized beauty journey starts here.",
  aboutTitle: "AI Look Analysis",
  aboutContent: "Upload a photo to let our Gemini Vision AI analyze your unique features and recommend the perfect treatment.",
  footerText: "Premium beauty and wellness standards in Manila. Powered by intelligent booking systems.",
  contactEmail: "concierge@glamflow.ph",
  contactPhone: "+63 917 123 4567",
  whatsappNumber: "639171234567",
  bookingButtonText: "Book Appointment",
  footerTreatments: "Hair Styling\nSpa & Massage\nFacial Care\nNail Art",
  footerBookings: "My Account\nGift Cards",
  adminUsername: "admin",
  adminPassword: "admin123"
};

const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); 
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-24 right-4 z-[300] flex items-center gap-3 px-6 py-4 rounded-[20px] shadow-2xl animate-in slide-in-from-right-8 ${
      type === 'success' ? 'bg-[#34A853] text-white' : 
      type === 'error' ? 'bg-[#EA4335] text-white' : 
      'bg-[#4285F4] text-white'
    }`}>
      {type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : 
       type === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" /> :
       <Database className="h-5 w-5 shrink-0" />}
      <p className="font-bold text-sm leading-tight">{message}</p>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X className="h-4 w-4" /></button>
    </div>
  );
};

const Navigation = ({ 
  isLoggedIn, 
  isAdmin, 
  onLogout, 
  siteName 
}: { 
  isLoggedIn: boolean; 
  isAdmin: boolean; 
  onLogout: () => void;
  siteName: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-[#dadce0]">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 bg-[#4285F4] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black text-[#202124] tracking-tight">{siteName}</span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          <Link to="/" className={`text-sm font-black uppercase tracking-widest ${location.pathname === '/' ? 'text-[#4285F4]' : 'text-[#5f6368] hover:text-[#202124]'}`}>Home</Link>
          <Link to="/book" className="bg-[#4285F4] text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#1a73e8] transition-all shadow-md">Book Now</Link>
          
          <div className="h-8 w-px bg-[#dadce0] mx-2"></div>
          
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Link to={isAdmin ? "/admin" : "/portal"} className="flex items-center gap-2 text-[#202124] font-bold hover:text-[#4285F4]">
                <div className="h-8 w-8 bg-[#f1f3f4] rounded-full flex items-center justify-center">
                  {isAdmin ? <LayoutDashboard className="h-4 w-4 text-[#4285F4]" /> : <User className="h-4 w-4 text-[#5f6368]" />}
                </div>
                <span className="text-sm font-black uppercase tracking-tighter">{isAdmin ? 'Admin Console' : 'My Account'}</span>
              </Link>
              <button onClick={onLogout} className="p-2 text-[#EA4335] hover:bg-red-50 rounded-full transition-all" title="Logout">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 text-[#5f6368] font-black text-xs uppercase tracking-widest hover:text-[#202124]">
              <UserCircle className="h-5 w-5" /> Sign In
            </Link>
          )}
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 text-[#5f6368]"><Menu className="h-6 w-6" /></button>
      </div>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-[150] p-6 flex flex-col gap-6 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-[#4285F4]" />
              <span className="text-xl font-black">{siteName}</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2"><X className="h-6 w-6" /></button>
          </div>
          <Link to="/" onClick={() => setIsOpen(false)} className="text-2xl font-black">Home</Link>
          <Link to="/book" onClick={() => setIsOpen(false)} className="text-2xl font-black text-[#4285F4]">Book Now</Link>
          {isLoggedIn ? (
            <>
              <Link to={isAdmin ? "/admin" : "/portal"} onClick={() => setIsOpen(false)} className="text-2xl font-black">{isAdmin ? 'Admin Hub' : 'Portal'}</Link>
              <button onClick={() => { onLogout(); setIsOpen(false); }} className="text-2xl font-black text-[#EA4335] text-left">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)} className="text-2xl font-black">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
};

const App: React.FC = () => {
  // STATE
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [promoMessage, setPromoMessage] = useState<string | null>("Book now and experience AI-enhanced beauty! ✨");
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clientPhone, setClientPhone] = useState<string>('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [isConnected, setIsConnected] = useState(true); // Default true for Firebase

  // --- FIREBASE REALTIME LISTENERS ---
  
  // 1. Listen for Appointments
  useEffect(() => {
    const q = query(collection(db, "appointments"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id // Use Firebase Document ID
      })) as Appointment[];
      setAppointments(apps);
    }, (error) => {
      console.error("Firebase Appt Error:", error);
      setIsConnected(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen for Services
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "services"), (snapshot) => {
      const srvs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Service));
      if (srvs.length > 0) setServices(srvs);
    });
    return () => unsubscribe();
  }, []);

  // 3. Listen for Staff
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "staff"), (snapshot) => {
      const stf = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Staff));
      if (stf.length > 0) setStaff(stf);
    });
    return () => unsubscribe();
  }, []);

  // 4. Listen for Settings
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "config", "siteSettings"), (doc) => {
      if (doc.exists()) {
        setSiteSettings(doc.data() as SiteSettings);
      }
    });
    return () => unsubscribe();
  }, []);
  
  // 5. Listen for Promo
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "config", "promo"), (doc) => {
      if (doc.exists()) {
        setPromoMessage(doc.data().message);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- ACTIONS ---

  const handleBookingComplete = async (app: Appointment) => {
    try {
      // Remove ID before adding (let Firebase auto-gen ID, or use predefined)
      // Since we want to use our custom IDs for references, we setDoc
      await setDoc(doc(db, "appointments", app.id), app);
      showToast("Booking Synced to Cloud!", "success");
    } catch (e: any) {
      showToast("Error saving booking: " + e.message, "error");
    }
  };

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      const appRef = doc(db, "appointments", id);
      await updateDoc(appRef, { status });
      showToast(`Status updated to ${status}`, "success");
    } catch (e: any) {
      showToast("Update failed", "error");
    }
  };

  const handleServiceUpdate = async (service: Service) => {
    if (!service.id) return;
    try {
      await setDoc(doc(db, "services", service.id), service);
      showToast("Service Updated", "success");
    } catch (e) { showToast("Error updating service", "error"); }
  };
  
  const handleServiceAdd = async (service: Service) => {
    try {
      // Create a ref with a generated ID if empty
      const newRef = doc(collection(db, "services"));
      const newService = { ...service, id: newRef.id };
      await setDoc(newRef, newService);
      showToast("Service Added", "success");
    } catch (e) { showToast("Error adding service", "error"); }
  };

  const handleServiceDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "services", id));
      showToast("Service Deleted", "success");
    } catch (e) { showToast("Error deleting service", "error"); }
  };

  // Staff Actions
  const handleStaffUpdate = async (st: Staff) => {
    if (!st.id) return;
    await setDoc(doc(db, "staff", st.id), st);
    showToast("Staff Updated", "success");
  };

  const handleStaffAdd = async (st: Staff) => {
    const newRef = doc(collection(db, "staff"));
    const newStaff = { ...st, id: newRef.id };
    await setDoc(newRef, newStaff);
    showToast("Staff Added", "success");
  };

  const handleStaffDelete = async (id: string) => {
    await deleteDoc(doc(db, "staff", id));
    showToast("Staff Deleted", "success");
  };

  const handleSettingsUpdate = async (newSettings: SiteSettings) => {
    await setDoc(doc(db, "config", "siteSettings"), newSettings);
    showToast("Settings Saved", "success");
  };

  const onPromoUpdate = async (msg: string | null) => {
    await setDoc(doc(db, "config", "promo"), { message: msg });
  };

  const handleClientLogin = (phone: string, pin: string) => {
    setIsLoggedIn(true);
    setIsAdmin(false);
    setClientPhone(phone);
    showToast("Welcome back!", "success");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setClientPhone('');
    showToast("Logged out", "success");
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col selection:bg-[#4285F4]/30">
        <Navigation isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={handleLogout} siteName={siteSettings.siteName} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        {/* Connection Status - Only show if disconnected (Firebase handles offline gracefully) */}
        {isAdmin && !isConnected && (
            <div className="fixed bottom-4 left-4 z-[200] px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg bg-red-500 text-white animate-pulse">
                <WifiOff className="h-3 w-3" /> Offline Mode
            </div>
        )}

        {promoMessage && (
          <div className="bg-[#202124] text-white py-3 px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 relative z-[90]">
            <Megaphone className="h-4 w-4 text-amber-400" />
            <span>{promoMessage}</span>
            <button onClick={() => onPromoUpdate(null)} className="opacity-50 hover:opacity-100 transition-opacity"><X className="h-4 w-4" /></button>
          </div>
        )}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage services={services} settings={siteSettings} appointments={appointments} />} />
            <Route path="/book" element={isLoggedIn ? <BookingFlow services={services} staff={staff} siteSettings={siteSettings} onBookingComplete={handleBookingComplete} clientPhone={clientPhone} /> : <Navigate to="/login" state={{ from: '/book' }} replace />} />
            <Route path="/login" element={<ClientLogin onLogin={handleClientLogin} />} />
            <Route path="/portal" element={isLoggedIn && !isAdmin ? <ClientPortal phone={clientPhone} appointments={appointments} services={services} /> : <Navigate to="/login" replace />} />
            <Route path="/admin-login" element={isAdmin ? <Navigate to="/admin" replace /> : <AdminLogin settings={siteSettings} onLogin={(s) => { if (s) { setIsLoggedIn(true); setIsAdmin(true); } }} />} />
            <Route path="/admin" element={isAdmin ? <AdminDashboard appointments={appointments} services={services} staff={staff} siteSettings={siteSettings} promoMessage={promoMessage} onStatusChange={handleStatusChange} onServiceUpdate={handleServiceUpdate} onServiceAdd={handleServiceAdd} onServiceDelete={handleServiceDelete} onStaffUpdate={handleStaffUpdate} onStaffAdd={handleStaffAdd} onStaffDelete={handleStaffDelete} onSettingsUpdate={handleSettingsUpdate} onPromoUpdate={onPromoUpdate} onBulkSync={() => {}} /> : <Navigate to="/admin-login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BeautyConcierge services={services} />
      </div>
    </HashRouter>
  );
};

export default App;
