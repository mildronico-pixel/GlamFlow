
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Service, Staff, Appointment, AppointmentStatus, SiteSettings } from '../types';
import { 
  Check, 
  ChevronRight, 
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  Calendar,
  Camera,
  MessageSquare,
  CreditCard,
  Loader2,
  UserCheck,
  AlertCircle,
  Upload,
  Coffee // Added Coffee icon
} from 'lucide-react';
import { generateSmartConfirmation } from '../services/geminiService';

interface BookingFlowProps {
  services: Service[];
  staff: Staff[];
  siteSettings: SiteSettings;
  onBookingComplete: (app: Appointment) => void;
  clientPhone: string;
}

const BookingFlow: React.FC<BookingFlowProps> = ({ services, staff, siteSettings, onBookingComplete, clientPhone }) => {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  
  const [clientInfo, setClientInfo] = useState({ 
    name: '', 
    phone: clientPhone, 
    email: '' 
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'GCASH' | 'BANK_TRANSFER' | 'CASH'>('GCASH');
  const [referenceCode, setReferenceCode] = useState('');
  const [paymentProofBase64, setPaymentProofBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  // Define Time Slots including Lunch
  const TIME_SLOTS = [
    '09:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', // Lunch Slot
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push({
        full: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-PH', { weekday: 'short' }).toUpperCase(),
        dayNum: d.getDate(),
        month: d.toLocaleDateString('en-PH', { month: 'short' }).toUpperCase()
      });
    }
    return dates;
  }, []);

  useEffect(() => {
    if (location.state?.serviceId) {
      const service = services.find(s => s.id === location.state.serviceId);
      if (service) {
        setSelectedService(service);
        setStep(2);
      }
    }
  }, [location, services]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Scale down image to avoid payload size limits in Google Sheets
          const MAX_WIDTH = 400; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Compress quality to 0.5 to keep string short
          resolve(canvas.toDataURL('image/jpeg', 0.5)); 
        };
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressedBase64 = await compressImage(file);
        setPaymentProofBase64(compressedBase64);
      } catch (err) { console.error(err); } 
      finally { setIsCompressing(false); }
    }
  };

  const finalizeBooking = async () => {
    if (!selectedService || !selectedStaff || !selectedTime) return;
    setIsSubmitting(true);
    try {
      const newApp: Appointment = {
        id: `GLAM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        clientName: clientInfo.name.trim(),
        clientEmail: clientInfo.email,
        clientPhone: clientInfo.phone,
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        date: selectedDate,
        time: selectedTime,
        status: AppointmentStatus.PENDING,
        paymentMethod,
        referenceCode: referenceCode.trim(),
        paymentProof: paymentProofBase64 || undefined,
        totalAmount: selectedService.price,
        createdAt: new Date().toISOString()
      };
      
      const smartMsg = await generateSmartConfirmation(newApp, selectedService, selectedStaff);
      setConfirmationMessage(smartMsg);
      
      await onBookingComplete(newApp);
      setStep(6);
    } catch (e) { 
      // Fallback
      setConfirmationMessage("Booking confirmed successfully!");
      setStep(6); 
    } 
    finally { setIsSubmitting(false); }
  };

  const stepLabels = ['SERVICE', 'EXPERT', 'CONTACT', 'SCHEDULE', 'PAYMENT', 'DONE'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
      <Link to="/" className="inline-flex items-center text-[#5f6368] font-bold mb-6 gap-2 hover:text-[#4285F4]">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="bg-white rounded-[40px] border border-[#dadce0] overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[750px]">
        {/* Left Stepper (Hidden on Mobile) */}
        <div className="bg-[#F8F9FA] w-full lg:w-72 p-12 border-r border-[#dadce0] hidden lg:block relative">
          <div className="space-y-12">
            {stepLabels.map((label, index) => {
              const currentStepNum = index + 1;
              const isActive = step === currentStepNum;
              const isCompleted = step > currentStepNum;
              return (
                <div key={label} className="flex items-center gap-6">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-black border-4 transition-all ${
                    isActive ? 'bg-[#4285F4] text-white border-white ring-4 ring-[#4285F4]/10 shadow-lg' : 
                    isCompleted ? 'bg-[#34A853] text-white border-white' : 'bg-white text-[#dadce0] border-[#f1f3f4]'
                  }`}>
                    {isCompleted ? <Check className="h-6 w-6" strokeWidth={3} /> : currentStepNum}
                  </div>
                  <span className={`text-[11px] font-black tracking-widest ${isActive ? 'text-[#202124]' : 'text-[#bdc1c6]'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 lg:p-16">
          {step === 1 && (
            <div className="space-y-10 animate-in fade-in">
              <h2 className="text-5xl font-black text-[#202124]">Select Treatment</h2>
              <div className="grid grid-cols-1 gap-5">
                {services.map(s => (
                  <button key={s.id} onClick={() => { setSelectedService(s); setStep(2); }} className="flex items-center p-6 border border-[#dadce0] rounded-[32px] hover:border-[#4285F4] transition-all text-left bg-white hover:shadow-xl group">
                    <img src={s.image} className="h-20 w-20 rounded-[20px] object-cover mr-6" />
                    <div className="flex-grow">
                      <p className="font-black text-lg text-[#202124] group-hover:text-[#4285F4]">{s.name}</p>
                      <p className="text-sm text-[#5f6368] font-bold mt-1 uppercase tracking-wider">₱{s.price} • {s.duration} MINS</p>
                    </div>
                    <ChevronRight className="h-6 w-6 text-[#dadce0]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
             <div className="space-y-10 animate-in fade-in">
                <h2 className="text-5xl font-black text-[#202124]">Choose Expert</h2>
                <div className="grid grid-cols-1 gap-5">
                   {staff.map(member => (
                     <button key={member.id} onClick={() => { setSelectedStaff(member); setStep(3); }} className="flex items-center p-6 border border-[#dadce0] rounded-[32px] hover:border-[#4285F4] transition-all text-left bg-white hover:shadow-xl">
                        <img src={member.avatar} className="h-20 w-20 rounded-full mr-6" />
                        <div className="flex-grow">
                           <p className="font-black text-lg">{member.name}</p>
                           <p className="text-xs text-[#5f6368] font-bold uppercase tracking-widest">{member.role}</p>
                        </div>
                        <ChevronRight className="h-6 w-6 text-[#dadce0]" />
                     </button>
                   ))}
                </div>
                <button onClick={() => setStep(1)} className="text-[#5f6368] font-bold flex items-center gap-2 mt-6"><ArrowLeft className="h-4 w-4" /> Back to services</button>
             </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-in fade-in">
              <h2 className="text-5xl font-black text-[#202124]">Your Details</h2>
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-[#bdc1c6] ml-4">Full Name</label>
                  <input placeholder="Ex. Juan Dela Cruz" className="w-full p-6 bg-[#f8f9fa] border-none rounded-[28px] outline-none font-black text-lg" value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} />
                </div>
                <button disabled={!clientInfo.name.trim()} onClick={() => setStep(4)} className="w-full bg-[#4285F4] text-white py-6 rounded-full font-black text-lg shadow-xl disabled:opacity-30">Next: Schedule Visit</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 animate-in fade-in">
              <h2 className="text-5xl font-black text-[#202124]">Pick Schedule</h2>
              <div className="space-y-8">
                 <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
                    {availableDates.map((date) => (
                      <button 
                        key={date.full}
                        onClick={() => setSelectedDate(date.full)}
                        className={`flex flex-col items-center justify-center min-w-[85px] h-[115px] rounded-[32px] border-2 transition-all ${selectedDate === date.full ? 'bg-[#4285F4] border-[#4285F4] text-white shadow-xl' : 'bg-white border-[#f1f3f4] text-[#5f6368]'}`}
                      >
                        <span className="text-[10px] font-black tracking-widest uppercase opacity-60">{date.month}</span>
                        <span className="text-3xl font-black">{date.dayNum}</span>
                        <span className="text-[10px] font-black tracking-widest uppercase opacity-60">{date.dayName}</span>
                      </button>
                    ))}
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {TIME_SLOTS.map(t => {
                      const isLunch = t === '12:00 PM';
                      return (
                        <button 
                          key={t} 
                          disabled={isLunch}
                          onClick={() => !isLunch && setSelectedTime(t)} 
                          className={`p-5 rounded-[24px] font-black border-2 transition-all flex flex-col items-center justify-center gap-1 min-h-[80px]
                            ${isLunch 
                              ? 'bg-amber-50 border-amber-100 text-amber-800/60 cursor-not-allowed' 
                              : selectedTime === t 
                                ? 'bg-[#4285F4] text-white border-[#4285F4] shadow-lg scale-105' 
                                : 'bg-white border-[#dadce0] hover:border-[#4285F4]'
                            }`}
                        >
                          {isLunch && <Coffee className="h-5 w-5 mb-1 opacity-70" />}
                          <span>{t}</span>
                          {isLunch && <span className="text-[9px] uppercase tracking-widest font-bold text-amber-600">Lunch Break</span>}
                        </button>
                      );
                    })}
                 </div>
              </div>
              <button disabled={!selectedTime} onClick={() => setStep(5)} className="w-full bg-[#4285F4] text-white py-6 rounded-full font-black text-lg shadow-xl disabled:opacity-30">Next: Payment Details</button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-10 animate-in fade-in flex flex-col h-full">
              <h2 className="text-5xl font-black text-[#202124]">Settlement</h2>
              
              <div className="bg-[#f8f9fa] p-8 rounded-[40px] border border-[#dadce0] space-y-8 flex-grow">
                 <div className="flex gap-4">
                    <button onClick={() => setPaymentMethod('GCASH')} className={`flex-1 p-6 rounded-[32px] border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'GCASH' ? 'border-[#4285F4] bg-white shadow-xl' : 'border-[#f1f3f4] grayscale opacity-40'}`}>
                       <Smartphone className="h-7 w-7 text-blue-600" />
                       <span className="font-black text-[10px] tracking-widest uppercase">GCASH</span>
                    </button>
                    <button onClick={() => setPaymentMethod('BANK_TRANSFER')} className={`flex-1 p-6 rounded-[32px] border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'BANK_TRANSFER' ? 'border-[#4285F4] bg-white shadow-xl' : 'border-[#f1f3f4] grayscale opacity-40'}`}>
                       <CreditCard className="h-7 w-7 text-gray-600" />
                       <span className="font-black text-[10px] tracking-widest uppercase">BANK</span>
                    </button>
                 </div>

                 <div className="text-center space-y-8">
                    <div className="inline-block p-6 bg-white rounded-[40px] border border-[#dadce0] shadow-xl">
                       <img src={paymentMethod === 'GCASH' ? (siteSettings.gcashQr || "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GCash") : (siteSettings.bankQr || "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Bank")} className="h-48 w-48 object-contain" />
                       <p className="mt-4 font-black text-lg">Scan to Pay</p>
                    </div>

                    <div className="space-y-6 text-left max-w-sm mx-auto">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-[#5f6368] ml-2">Reference Code</label>
                          <input value={referenceCode} onChange={e => setReferenceCode(e.target.value)} placeholder="Enter code here" className="w-full p-5 bg-white border border-[#dadce0] rounded-[24px] outline-none font-black" />
                       </div>
                       
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-[#5f6368] ml-2">Proof of Payment</label>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full py-8 border-4 border-dashed rounded-[32px] flex flex-col items-center gap-3 transition-all ${paymentProofBase64 ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-[#dadce0] text-[#5f6368] hover:border-[#4285F4]'}`}
                          >
                             <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                             {isCompressing ? <Loader2 className="h-8 w-8 animate-spin" /> : paymentProofBase64 ? <CheckCircle2 className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
                             <span className="font-black text-xs uppercase tracking-widest">
                                {paymentProofBase64 ? 'RECEIPT UPLOADED' : 'CLICK TO UPLOAD RECEIPT IMAGE'}
                             </span>
                          </button>
                       </div>
                    </div>
                 </div>
              </div>

              <button 
                onClick={finalizeBooking} 
                disabled={isSubmitting || !referenceCode.trim() || !paymentProofBase64 || isCompressing}
                className="w-full bg-[#4285F4] text-white py-6 rounded-full font-black text-lg shadow-xl shadow-blue-500/25 mt-8 disabled:opacity-20"
              >
                {isSubmitting ? 'Confirming...' : 'Complete My Reservation'}
              </button>
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col items-center justify-center text-center space-y-8 py-20 animate-in zoom-in-95">
              <div className="h-28 w-28 bg-[#34A853] text-white rounded-full flex items-center justify-center shadow-xl">
                <CheckCircle2 className="h-16 w-16" />
              </div>
              <h2 className="text-6xl font-black text-[#202124]">Booked!</h2>
              <div className="bg-[#f8f9fa] p-8 rounded-[40px] border border-[#dadce0] max-w-md">
                 <p className="text-[#5f6368] font-bold italic leading-relaxed">"{confirmationMessage}"</p>
              </div>
              <Link to="/portal" className="bg-[#202124] text-white px-12 py-5 rounded-full font-black text-lg shadow-xl">Go to Dashboard</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;
