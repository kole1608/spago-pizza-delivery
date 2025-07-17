'use client';

import { useState, useEffect } from 'react';

export default function KitchenPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-blue-600 text-white">
      <div className="bg-red-500/95 backdrop-blur-sm p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-bold">🍕 Spago Pizza - Kitchen Display</h1>
        <div className="flex gap-8 items-center">
          <div className="text-center">
            <div className="text-2xl font-bold">5</div>
            <div className="text-xs opacity-80">Na čekanju</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">3</div>
            <div className="text-xs opacity-80">U pripremi</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">2</div>
            <div className="text-xs opacity-80">Spremno</div>
          </div>
          <div className="text-lg font-bold">
            {currentTime.toLocaleTimeString('sr-RS')}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">📋 Aktivne porudžbine</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white text-black rounded-xl p-5 border-l-4 border-red-500 hover:shadow-lg transition-all">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-red-500">#2024{i.toString().padStart(3, '0')}</span>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">19:3{i}</div>
                    <div className="text-lg font-bold text-red-500">1{i} min</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
                  <strong>👤 Petar Nikolić</strong><br/>
                  📍 Knez Mihailova 42<br/>
                  💰 1.440 RSD (Gotovina)
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <div>
                      <div className="font-bold">Capricciosa (velika)</div>
                      <div className="text-xs text-gray-600">Bez luka</div>
                    </div>
                    <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                    🚀 Započni
                  </button>
                  <button className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors">
                    ⏸️ Pauza
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 