'use client';

import { useState, useEffect } from 'react';

export default function DriverPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
      <div className="bg-red-500/95 backdrop-blur-sm p-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-xl font-bold">🍕 Spago Delivery</h1>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span>Na dužnosti</span>
          </div>
        </div>
        <div className="text-right">
          <div>Marko Petrović</div>
          <div className="text-xs">ID: DRV001</div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center bg-white/90 p-3 rounded-xl">
              <div className="text-2xl font-bold text-red-500">8</div>
              <div className="text-xs text-gray-600">Danas dostavljeno</div>
            </div>
            <div className="text-center bg-white/90 p-3 rounded-xl">
              <div className="text-2xl font-bold text-red-500">2</div>
              <div className="text-xs text-gray-600">Na čekanju</div>
            </div>
            <div className="text-center bg-white/90 p-3 rounded-xl">
              <div className="text-2xl font-bold text-red-500">2.840</div>
              <div className="text-xs text-gray-600">RSD zarada</div>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-gray-800 mb-3">Trenutna dostava:</h3>
          <div className="bg-white rounded-xl p-4 border-l-4 border-red-500">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xl font-bold text-red-500">#2024001</span>
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">23 min</span>
            </div>
            
            <div className="mb-3">
              <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold mr-2">U dostavi</span>
              <span className="text-sm">📍 1.2km udaljenost</span>
            </div>
            
            <div className="text-gray-800 mb-4">
              <div className="font-bold">👤 Petar Nikolić</div>
              <div className="text-sm">📍 Knez Mihailova 42, Beograd<br/>📞 064/123-4567</div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="bg-gray-50 p-2 rounded text-sm">🍕 1x Capricciosa (velika)</div>
              <div className="bg-gray-50 p-2 rounded text-sm">🥤 1x Koka-kola 0.5L</div>
              <div className="bg-gray-50 p-2 rounded text-sm">💰 Ukupno: 1.440 RSD (Gotovina)</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                🧭 Navigacija
              </button>
              <button className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors">
                ✅ Dostavljeno
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Naredne dostave:</h3>
          <div className="space-y-3">
            {[2,3].map((i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <strong className="text-gray-800">#2024{i.toString().padStart(3, '0')}</strong><br/>
                  <small className="text-gray-600">Marija Jovanović - Svetogorska 15</small>
                </div>
                <button className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors">
                  📦 Preuzmi
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 