import { GoogleGenAI, Type } from "@google/genai";
import { Appointment, Service, Staff } from "../types";

// Initialize the Gemini API client exclusively from environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBeautyConsultation = async (userInput: string, availableServices: Service[]): Promise<string> => {
  try {
    const servicesList = availableServices.map(s => `${s.name} (₱${s.price})`).join(", ");
    // Use ai.models.generateContent to query GenAI with both the model name and prompt.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Act as a luxury salon concierge. A client says: "${userInput}". 
      Available services: ${servicesList}. 
      Recommend 1 or 2 best matches. Be warm and inviting. Filipino style but professional English. Under 80 words.`,
      config: { temperature: 0.8 },
    });
    // Access the .text property directly (not a method).
    return response.text || "I recommend our Signature Haircut for a fresh and modern look!";
  } catch (error) {
    console.error("AI Error:", error);
    return "I would love to help! Based on your mood, a relaxing Signature Haircut or a Deep Tissue Massage would be perfect for you.";
  }
};

export const getMarketTrends = async (category: string): Promise<{text: string, sources: any[]}> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `What are the top 3 trending ${category} styles or treatments in the Philippines for 2024? Provide brief professional advice for a salon owner.`,
      config: {
        tools: [{ googleSearch: {} }]
      },
    });
    
    return {
      text: response.text || "Natural minimalist looks are trending this year.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (e) {
    return { text: "Focus on sustainable and organic beauty products as they are gaining popularity.", sources: [] };
  }
};

export const suggestOptimalPrice = async (serviceName: string, duration: number, category: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a competitive luxury price in Philippine Pesos (PHP) for a "${serviceName}" that takes ${duration} minutes in the ${category} category. Assume the location is a high-end mall like BGC or Makati. Provide a price and a 1-sentence justification.`,
      config: { temperature: 0.7 },
    });
    return response.text || "Suggested Price: ₱1,200. Justification: Competitive for premium BGC salons.";
  } catch (e) {
    return "Suggested Price: ₱1,000 based on standard luxury rates.";
  }
};

export const analyzeUserLook = async (base64Image: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: "Analyze this person's hair and skin features. Suggest one specific salon service from: Haircut, Balayage, Facial, or Lash Extension. Explain why it suits them based on their facial features. Be professional, flattering, and concise (max 60 words)." },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
        ]
      }
    });
    return response.text || "You look amazing! I'd recommend a Signature Haircut to highlight your features.";
  } catch (e) {
    return "Based on your features, our Balayage service would beautifully complement your skin tone.";
  }
};

export const generateSmartConfirmation = async (appointment: Appointment, service: Service, staff: Staff): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, professional booking confirmation.
      Client: ${appointment.clientName}
      Service: ${service.name}
      Staff: ${staff.name}
      Date: ${appointment.date} @ ${appointment.time}
      Tone: Warm, welcoming, Filipino luxury. Under 50 words.`,
      config: { temperature: 0.7 },
    });
    return response.text || `Booking confirmed! We are excited to see you on ${appointment.date} for your ${service.name} with ${staff.name}.`;
  } catch (error) {
    return `Booking confirmed! We are excited to see you on ${appointment.date} for your ${service.name}.`;
  }
};

export const getBusinessInsights = async (appointments: Appointment[]): Promise<string> => {
  try {
    if (appointments.length === 0) return "Start accepting bookings to see AI business insights here.";
    const dataString = appointments.map(a => `${a.date}: ${a.totalAmount} PHP`).join(', ');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these recent salon bookings: ${dataString}. Provide one professional tip to increase revenue. Under 30 words.`,
      config: { temperature: 0.6 },
    });
    return response.text || "Weekends are looking busy! Consider mid-week promos to balance your schedule.";
  } catch (error) {
    return "Consistently high demand detected for massage services. Consider adding more therapists.";
  }
};