import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import LoadingScreen from '@/components/features/LoadingScreen';
import BoshSahifa from '@/components/features/BoshSahifa';
import ToplamYechish from '@/components/features/ToplamYechish';
import UstozKabineti from '@/components/features/UstozKabineti';
import AdminPanel from '@/components/features/AdminPanel';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('asosiy');

  return (
    <>
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      
      <div className={`min-h-screen transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {/* Orqa fon qatlami - xiraroq */}
        <div className="fixed inset-0 bg-gradient-to-br from-[hsl(221,83%,53%)]/98 via-[hsl(221,83%,48%)]/98 to-[hsl(221,83%,43%)]/98 backdrop-blur-md" />
        
        {/* Kontent */}
        <div className="relative z-10">
          <Header activeTab={activeTab} onTabChange={setActiveTab} />
          
          <main className="container mx-auto px-4 py-8">
            {activeTab === 'asosiy' && <BoshSahifa />}
            {activeTab === 'yechish' && <ToplamYechish />}
            {activeTab === 'ustoz' && <UstozKabineti />}
            {activeTab === 'admin' && <AdminPanel />}
          </main>
        </div>
        
        <Toaster />
      </div>
    </>
  );
}
