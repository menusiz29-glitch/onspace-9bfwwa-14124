import { useState } from 'react';
import { Toplam } from '@/types';
import { LogOut, FileText, BarChart3, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ustoz } from '@/lib/auth';
import UstozAuth from './UstozAuth';
import ToplamYaratish from './ToplamYaratish';
import UstozNatijalar from './UstozNatijalar';
import UstozStatistika from './UstozStatistika';

export default function UstozKabineti() {
  const [ustoz, setUstoz] = useState<Ustoz | null>(null);
  const [activeTab, setActiveTab] = useState<'yaratish' | 'natijalar' | 'statistika'>('yaratish');
  const [tahrirlashToplam, setTahrirlashToplam] = useState<Toplam | null>(null);

  const handleLogout = () => {
    setUstoz(null);
    setActiveTab('yaratish');
    setTahrirlashToplam(null);
  };

  const handleTahrirlash = (toplam: Toplam) => {
    setTahrirlashToplam(toplam);
    setActiveTab('yaratish');
  };

  const handleTahrirlashTugadi = () => {
    setTahrirlashToplam(null);
    setActiveTab('natijalar');
  };

  if (!ustoz) {
    return <UstozAuth onLogin={setUstoz} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Ustoz profili */}
      <Card className="border-2 border-[hsl(221,83%,53%)] shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(221,83%,43%)] text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{ustoz.full_name}</CardTitle>
              <p className="text-sm text-blue-100 mt-1">@{ustoz.username}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Chiqish
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => setActiveTab('yaratish')}
              variant={activeTab === 'yaratish' ? 'default' : 'outline'}
            >
              <FileText className="h-4 w-4 mr-2" />
              Toplam yaratish
            </Button>
            <Button
              onClick={() => setActiveTab('natijalar')}
              variant={activeTab === 'natijalar' ? 'default' : 'outline'}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Natijalar
            </Button>
            <Button
              onClick={() => setActiveTab('statistika')}
              variant={activeTab === 'statistika' ? 'default' : 'outline'}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Statistika
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tanlangan sahifa */}
      <div className="animate-slide-in">
        {activeTab === 'yaratish' && (
          <ToplamYaratish 
            ustozId={ustoz.id} 
            tahrirlashToplam={tahrirlashToplam}
            onTahrirlashTugadi={handleTahrirlashTugadi}
          />
        )}
        {activeTab === 'natijalar' && (
          <UstozNatijalar 
            ustozId={ustoz.id} 
            onTahrirlash={handleTahrirlash}
          />
        )}
        {activeTab === 'statistika' && <UstozStatistika ustozId={ustoz.id} />}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
