
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  SearchIcon, 
  Sparkles, 
  CheckCircle2, 
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Camera,
  Ticket,
  Loader2,
  Globe,
  CloudOff,
  ShieldCheck,
  Database
} from 'lucide-react';
import { Service, SiteSettings, Appointment, AppointmentStatus } from '../types';
import { analyzeUserLook } from '../services/geminiService';
// FIREBASE IMPORTS
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface LandingPageProps {
  services: Service[];
  settings: SiteSettings;
  appointments: Appointment[];
}

const LandingPage: React.FC<LandingPageProps> = ({ services, settings, appointments }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleTrackBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const qStr = trackQuery.trim();
    if (!qStr) return;

    setIsTracking(true);
    setTrackError(null);
    setTrackResult(null);
    setSearchStatus('Searching database...');

    try {
      // 1. Check Local State First (Fastest)
      const localMatch = appointments.find(a => 
        (a.id && a.id.toUpperCase() === qStr.toUpperCase()) || 
        (a.referenceCode && a.referenceCode.toUpperCase() === qStr.toUpperCase())
      );

      if (localMatch) {
        setTrackResult({
          ...localMatch,
          serviceName: services.find(s => s.id === localMatch.serviceId)?.name,
          source: 'Local Cache'
        });
        setIsTracking(false);
        setSearchStatus('');
        return;
      }

      // 2. Query Firestore (Source of Truth)
      // Check by ID
      const bookingsRef = collection(db, "appointments");
      let q = query(bookingsRef, where("id", "==", qStr.toUpperCase()));
      let snapshot = await getDocs(q);

      // If not found by ID, check by Reference Code
      if (snapshot.empty) {
         q = query(bookingsRef, where("referenceCode", "==", qStr.toUpperCase()));
         snapshot = await getDocs(q);
      }

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data() as Appointment;
        setTrackResult({
          ...data,
          serviceName: services.find(s => s.id === data.serviceId)?.name || 'Service',
          source: 'Cloud Database'
        });
      } else {
        setTrackError("Booking not found. Please check your Reference ID.");
      }

    } catch (error: any) {
      console.error("Tracking Error:", error);
      setTrackError("Unable to connect to database. Please try again.");
    } finally {
      setIsTracking(false);
      setSearchStatus('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        analyzeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64: string) => {
    setIsAnalyzing(true);
    const pureBase64 = base64.split(',')[1];
    const result = await analyzeUserLook(pureBase64);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="animate-in fade-in duration-700">
      <section className="bg-white py-16 lg:py-24 overflow-hidden relative border-b border-[#f1f3f4]">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#e8f0fe] rounded-l-[100px] -z-10 translate-x-20 hidden lg:block opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-16 relative">
          <div className="flex-1 space-y-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#E8F0FE] text-[#1967D2] px-4 py-2 rounded-full text-sm font-bold">
              <CheckCircle2 className="h-4 w-4" /> <span>Google Cloud Partner Salon</span>
            </div>
            <h1 className="text-5xl lg:text-8xl font-extrabold text-[#202124] tracking-tight leading-[1.1] whitespace-pre-line">
              {settings.heroTitle}
            </h1>
            <p className="text-xl text-[#5f6368] max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              {settings.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/book" className="w-full sm:w-auto bg-[#4285F4] text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-[#1a73e8] transition-all google-shadow text-center">
                {settings.bookingButtonText}
              </Link>
              <button onClick={() => document.getElementById('track-section')?.scrollIntoView({behavior: 'smooth'})} className="w-full sm:w-auto bg-white border border-[#dadce0] text-[#5f6368] px-10 py-5 rounded-full font-bold text-lg hover:bg-[#f8f9fa] transition-all text-center flex items-center justify-center gap-2">
                <Ticket className="h-5 w-5 text-[#4285F4]" /> Track Booking
              </button>
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <img 
              src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800" 
              className="rounded-[40px] w-full h-[600px] object-cover google-shadow border-8 border-white relative z-10"
              alt="Salon Visual"
            />
          </div>
        </div>
      </section>

      <section id="track-section" className="py-24 bg-[#F8F9FA]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white border border-[#dadce0] rounded-[48px] p-8 lg:p-16 text-center shadow-xl">
            <div className="h-16 w-16 bg-[#4285F4]/10 text-[#4285F4] rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchIcon className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-black text-[#202124] Check Your Status">Check Your Status</h2>
            <p className="text-[#5f6368] font-medium mt-2 mb-8">Enter your Booking Reference ID (e.g., GLAM-XXXX).</p>
            
            <form onSubmit={handleTrackBooking} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Reference Code" 
                className="flex-grow p-4 bg-[#f8f9fa] border border-[#dadce0] rounded-2xl outline-none focus:ring-2 ring-[#4285F4]/20 font-bold uppercase"
              />
              <button 
                disabled={isTracking}
                className="bg-[#4285F4] text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-[#1a73e8] transition-all flex items-center justify-center min-w-[120px]"
              >
                {isTracking ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
              </button>
            </form>

            {isTracking && (
              <p className="text-xs font-bold text-[#4285F4] animate-pulse mt-4">{searchStatus}</p>
            )}

            {trackResult && (
              <div className="mt-12 bg-white p-8 rounded-[32px] border border-[#34A853]/30 text-left animate-in slide-in-from-top-4 shadow-2xl relative">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 inline-block ${
                      trackResult.status === 'CONFIRMED' ? 'bg-[#34A853]/10 text-[#34A853]' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {trackResult.status} Booking
                    </span>
                    <h3 className="text-2xl font-black">{trackResult.clientName}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-[#5f6368] uppercase tracking-widest">REF ID</p>
                    <p className="font-black text-[#4285F4] text-xl">{trackResult.id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[#f1f3f4]">
                  <div>
                    <p className="text-[10px] font-black text-[#5f6368] uppercase tracking-widest mb-1">Service</p>
                    <p className="font-bold text-[#202124]">{trackResult.serviceName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#5f6368] uppercase tracking-widest mb-1">Schedule</p>
                    <p className="font-bold text-[#202124]">{trackResult.date} at {trackResult.time}</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-[#f1f3f4] flex justify-between items-center">
                   <div className="flex items-center gap-2 text-[#34A853]">
                      <Database className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{trackResult.source || 'Verified Record'}</span>
                   </div>
                   <Link to="/portal" className="text-[#4285F4] font-black text-xs uppercase tracking-widest hover:underline flex items-center gap-1">
                      Full Details <ArrowRight className="h-3 w-3" />
                   </Link>
                </div>
              </div>
            )}

            {trackError && !isTracking && (
              <div className="mt-8 flex flex-col items-center gap-2 text-[#EA4335] font-bold animate-in shake">
                <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 w-full max-w-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CloudOff className="h-5 w-5" />
                    <span>No matching record.</span>
                  </div>
                  <p className="text-[10px] opacity-80 leading-relaxed font-medium">{trackError}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="ai-consultant" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-[#4285F4] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                <Camera className="h-3 w-3" /> Visual Analysis
              </div>
              <h2 className="text-4xl font-bold text-[#202124]">{settings.aboutTitle}</h2>
              <p className="text-lg text-[#5f6368] leading-relaxed">
                {settings.aboutContent}
              </p>
              
              <div className="flex flex-col gap-4">
                 <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-3 bg-[#f8f9fa] border-2 border-dashed border-[#dadce0] p-8 rounded-[32px] hover:border-[#4285F4] hover:bg-[#e8f0fe]/20 transition-all group"
                 >
                    <Upload className="h-8 w-8 text-[#5f6368] group-hover:text-[#4285F4]" />
                    <span className="font-bold text-[#5f6368] group-hover:text-[#4285F4]">Upload Photo to Start</span>
                 </button>
              </div>
           </div>
           
           <div className="bg-white p-4 rounded-[40px] border border-[#dadce0] min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
              {previewImage ? (
                 <div className="w-full h-full space-y-4 animate-in fade-in duration-500">
                    <img src={previewImage} className="w-full h-64 object-cover rounded-[32px]" />
                    {isAnalyzing ? (
                       <div className="flex flex-col items-center gap-4 py-8">
                          <RefreshCw className="h-8 w-8 text-[#4285F4] animate-spin" />
                          <p className="font-bold text-[#4285F4]">Processing features...</p>
                       </div>
                    ) : (
                       <div className="bg-[#e8f0fe] p-6 rounded-[24px] border border-[#4285F4]/20">
                          <div className="flex items-center gap-2 mb-2 text-[#4285F4]">
                             <Sparkles className="h-4 w-4" />
                             <span className="font-black text-xs uppercase tracking-widest">Recommendation</span>
                          </div>
                          <p className="text-[#1967d2] font-medium italic">"{analysisResult}"</p>
                          <button onClick={() => navigate('/book')} className="mt-6 w-full bg-[#4285F4] text-white py-3 rounded-full font-bold text-sm">Book This Now</button>
                       </div>
                    )}
                 </div>
              ) : (
                 <div className="text-center opacity-30 space-y-4">
                    <ImageIcon className="h-20 w-20 mx-auto" />
                    <p className="font-bold uppercase tracking-widest text-sm">Awaiting Analysis</p>
                 </div>
              )}
           </div>
        </div>
      </section>

      <section id="explore" className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#202124]">Signature Menu</h2>
          <p className="text-[#5f6368] mt-4 text-lg">Exquisite treatments tailored for you.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s) => (
            <div key={s.id} className="bg-white google-card border border-[#dadce0] overflow-hidden flex flex-col group h-full">
              <div className="relative h-56 overflow-hidden">
                <img src={s.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-[#202124] mb-2">{s.name}</h3>
                <p className="text-sm text-[#70757a] leading-relaxed mb-6">{s.category} treatment • {s.duration}m</p>
                <div className="mt-auto flex justify-between items-center pt-6 border-t border-[#f1f3f4]">
                  <span className="text-2xl font-bold text-[#202124]">₱{s.price}</span>
                  <button onClick={() => navigate('/book', { state: { serviceId: s.id } })} className="bg-[#4285F4] text-white p-3 rounded-full hover:bg-[#1a73e8] google-shadow">
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-2">
                 <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="h-6 w-6 text-[#4285F4]" />
                    <span className="text-2xl font-black text-[#202124]">{settings.siteName}</span>
                 </div>
                 <p className="text-[#5f6368] font-medium leading-relaxed max-w-sm">
                    {settings.footerText}
                 </p>
              </div>
              <div>
                 <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#202124] mb-6">Experience</h4>
                 <ul className="space-y-3 text-sm font-bold text-[#5f6368]">
                    <li><button onClick={() => navigate('/book')} className="hover:text-[#4285F4] transition-colors">Schedule Service</button></li>
                    <li><button onClick={() => document.getElementById('ai-consultant')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-[#4285F4] transition-colors">Gemini Look Analysis</button></li>
                    <li><button onClick={() => document.getElementById('track-section')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-[#4285F4] transition-colors">Booking Status</button></li>
                 </ul>
              </div>
              <div>
                 <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#202124] mb-6">Organization</h4>
                 <ul className="space-y-4">
                    <li>
                       <Link to="/admin-login" className="inline-flex items-center gap-2 bg-[#f8f9fa] border border-[#dadce0] px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#5f6368] hover:bg-[#E8F0FE] hover:text-[#4285F4] hover:border-[#4285F4] transition-all">
                          <ShieldCheck className="h-4 w-4" /> Admin Console Hub
                       </Link>
                    </li>
                    <li className="text-[10px] font-black uppercase tracking-[0.2em] text-[#bdc1c6] pl-4">Staff Directory</li>
                    <li className="text-[10px] font-black uppercase tracking-[0.2em] text-[#bdc1c6] pl-4">Business Analytics</li>
                 </ul>
              </div>
           </div>
           <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#bdc1c6]">
              <p>© 2024 {settings.siteName} Powered by Gemini AI.</p>
              <div className="flex gap-6">
                 <span>Security Standards</span>
                 <span>Data Privacy</span>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
