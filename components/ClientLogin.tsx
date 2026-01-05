
import React, { useState } from 'react';
import { Phone, ArrowRight, Loader2, Smartphone, Heart, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

interface ClientLoginProps {
  onLogin: (phone: string, pin: string) => Promise<boolean>;
  settings: any; // Added to match interface usage in App.tsx
}

const ClientLogin: React.FC<ClientLoginProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from || '/portal';
  const isRedirectedFromBooking = location.state?.from === '/book';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10 || !pin) return;
    
    setLoading(true);
    setError('');
    
    try {
      const success = await onLogin(phone, pin);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('Incorrect Security PIN. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8f9fa] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white rounded-[40px] border border-[#dadce0] p-10 lg:p-12 shadow-2xl relative overflow-hidden">
          {/* Back to Home Button */}
          <Link to="/" className="absolute top-6 left-6 z-20 p-2 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-full transition-all">
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="absolute top-0 right-0 w-32 h-32 bg-[#e8f0fe] rounded-full -translate-y-16 translate-x-16 -z-0"></div>
          
          <div className="flex flex-col items-center text-center space-y-8 relative z-10">
            <div className="h-20 w-20 bg-[#fce8f3] rounded-[24px] flex items-center justify-center text-[#e91e63]">
              <Heart className="h-10 w-10 fill-current" />
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-[#202124] tracking-tight">Client Portal</h2>
              <p className="text-sm text-[#5f6368] font-bold uppercase tracking-widest mt-2">
                {isRedirectedFromBooking ? 'Sign in to book your service' : 'Manage your beauty journey'}
              </p>
            </div>

            {isRedirectedFromBooking && (
              <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-blue-100">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-left">Almost there! Please sign in with your phone number to continue your booking.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 w-full animate-in shake">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-[#5f6368] ml-2">Mobile Number</label>
                <div className="relative">
                   <input 
                    type="tel"
                    required
                    autoFocus
                    placeholder="0917 XXX XXXX"
                    className="w-full p-4 bg-[#f1f3f4] border-none rounded-2xl font-bold outline-none focus:ring-2 ring-[#4285F4]/20 pl-12"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5f6368]" />
                </div>
              </div>
              
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-[#5f6368] ml-2">Security PIN</label>
                <div className="relative">
                  <input 
                    type="password"
                    required
                    placeholder="••••"
                    className="w-full p-4 bg-[#f1f3f4] border-none rounded-2xl font-bold outline-none focus:ring-2 ring-[#4285F4]/20 pl-12"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5f6368]" />
                </div>
                <p className="text-[10px] text-[#5f6368] ml-2 italic">
                  * First time? Use a new PIN to register. Returning? Use your existing PIN.
                </p>
              </div>

              <button 
                type="submit"
                disabled={loading || phone.length < 10 || !pin}
                className="w-full bg-[#202124] text-white py-5 rounded-full font-black shadow-xl hover:bg-black hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-30"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                {isRedirectedFromBooking ? 'Sign In & Continue' : 'Sign In / Register'}
              </button>
            </form>
            
            <p className="text-xs text-[#5f6368] font-medium leading-relaxed">
              Your security is our priority. <br/>
              <span className="text-[#4285F4] font-bold">Your PIN protects your booking history.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;
