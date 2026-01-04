
import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SiteSettings } from '../types';

interface AdminLoginProps {
  settings: SiteSettings;
  onLogin: (success: boolean) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ settings, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Check against settings credentials (defaults to admin / admin123)
    const validUsername = settings.adminUsername || 'admin';
    const validPassword = settings.adminPassword || 'admin123';

    setTimeout(() => {
      if (username === validUsername && password === validPassword) {
        onLogin(true);
        navigate('/admin');
      } else {
        onLogin(false);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8f9fa] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[40px] border border-[#dadce0] p-10 lg:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#4285F4]"></div>
          
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="h-20 w-20 bg-[#e8f0fe] rounded-[24px] flex items-center justify-center text-[#4285F4]">
              <ShieldCheck className="h-10 w-10" />
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-[#202124] tracking-tight">Admin Console</h2>
              <p className="text-sm text-[#5f6368] font-bold uppercase tracking-widest mt-2">Authentication Required</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-[#5f6368] ml-2">Username</label>
                <input 
                  type="text"
                  required
                  className="w-full p-4 bg-[#f1f3f4] border-none rounded-2xl font-bold outline-none focus:ring-2 ring-[#4285F4]/20"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-[#5f6368] ml-2">Password</label>
                <div className="relative">
                  <input 
                    type="password"
                    required
                    className="w-full p-4 bg-[#f1f3f4] border-none rounded-2xl font-bold outline-none focus:ring-2 ring-[#4285F4]/20"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#bdc1c6]" />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#4285F4] text-white py-5 rounded-full font-black shadow-xl hover:bg-[#1a73e8] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                {loading ? 'Authorizing...' : 'Access Dashboard'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="text-center mt-8">
           <p className="text-xs text-[#5f6368] font-medium">Protected by GlamFlow Enterprise Security</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
