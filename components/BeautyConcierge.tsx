
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, MessageCircle, Bot, Mic, MicOff, Volume2 } from 'lucide-react';
import { getBeautyConsultation } from '../services/geminiService';
import { Service } from '../types';
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface BeautyConciergeProps {
  services: Service[];
}

const BeautyConcierge: React.FC<BeautyConciergeProps> = ({ services }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Hello! I am your AI Beauty Concierge. How are you feeling today? I can help you find the perfect treatment.' }
  ]);
  const [loading, setLoading] = useState(false);
  
  // Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const botResponse = await getBeautyConsultation(userMsg, services);
    setChat(prev => [...prev, { role: 'bot', text: botResponse }]);
    setLoading(false);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const toggleVoice = async () => {
    if (isVoiceActive) {
      if (sessionRef.current) sessionRef.current.close();
      setIsVoiceActive(false);
      setIsListening(false);
      return;
    }

    setIsVoiceActive(true);
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        systemInstruction: 'You are a warm, luxury salon concierge in Manila. Help clients choose treatments. Be concise and friendly.'
      },
      callbacks: {
        onopen: () => {
          setIsListening(true);
          console.log('Voice session opened');
        },
        onmessage: async (msg) => {
          const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioData && audioContextRef.current) {
            const buffer = await decodeAudioData(decode(audioData), audioContextRef.current, 24000, 1);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            const startTime = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
            source.start(startTime);
            nextStartTimeRef.current = startTime + buffer.duration;
          }
        },
        onclose: () => setIsVoiceActive(false),
        onerror: (e) => console.error('Voice error:', e)
      }
    });

    sessionRef.current = await sessionPromise;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      {isOpen ? (
        <div className="bg-white w-[350px] sm:w-[400px] h-[550px] rounded-[32px] border border-[#dadce0] google-shadow flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-[#4285F4] p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6" />
              <div>
                <p className="font-bold leading-none">AI Concierge</p>
                <p className="text-[10px] opacity-80 uppercase tracking-widest mt-1">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleVoice}
                className={`p-2 rounded-full transition-all ${isVoiceActive ? 'bg-red-500 shadow-inner' : 'hover:bg-white/20'}`}
                title="Voice Chat"
              >
                {isVoiceActive ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8F9FA]">
            {isVoiceActive && (
              <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in zoom-in-95">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#4285F4] rounded-full animate-ping opacity-20"></div>
                  <div className="h-24 w-24 bg-[#4285F4] rounded-full flex items-center justify-center relative z-10">
                    <Volume2 className="h-10 w-10 text-white animate-pulse" />
                  </div>
                </div>
                <p className="font-bold text-[#4285F4]">Voice Mode Active</p>
                <p className="text-xs text-[#70757a] text-center max-w-[200px]">Speak naturally to your concierge. I can hear you!</p>
              </div>
            )}
            
            {!isVoiceActive && chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                  msg.role === 'user' 
                  ? 'bg-[#4285F4] text-white rounded-tr-none shadow-sm' 
                  : 'bg-white text-[#3c4043] border border-[#dadce0] rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {!isVoiceActive && loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#dadce0] p-4 rounded-2xl animate-pulse flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          {!isVoiceActive && (
            <div className="p-4 bg-white border-t border-[#dadce0] flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Tell me how you feel..."
                className="flex-grow bg-[#f1f3f4] border-none rounded-full px-6 text-sm focus:ring-2 ring-[#4285F4] outline-none"
              />
              <button onClick={handleSend} className="bg-[#4285F4] text-white p-3 rounded-full hover:bg-[#1a73e8] shadow-md active:scale-90 transition-all">
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-[#4285F4] text-white p-4 rounded-full google-shadow hover:scale-110 transition-transform flex items-center gap-2 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          <Sparkles className="h-6 w-6 relative z-10" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-sm relative z-10 whitespace-nowrap">Open Beauty Concierge</span>
        </button>
      )}
    </div>
  );
};

export default BeautyConcierge;
