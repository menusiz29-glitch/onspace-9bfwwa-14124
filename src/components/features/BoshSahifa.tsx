import { useState, useEffect } from 'react';
import { Newspaper, Calendar, RefreshCw, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Yangilik {
  id: string;
  sarlavha: string;
  matn: string;
  rasm_url: string | null;
  manba: string;
  created_at: string;
}

export default function BoshSahifa() {
  const [yangiliklar, setYangiliklar] = useState<Yangilik[]>([]);
  const [yuklanyapti, setYuklanyapti] = useState(true);
  const [oxirgiYangilanish, setOxirgiYangilanish] = useState(new Date());
  const { toast } = useToast();

  const yangiliklarniYuklash = async () => {
    try {
      const { data, error } = await supabase
        .from('yangiliklar')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setYangiliklar(data as Yangilik[] || []);
      setOxirgiYangilanish(new Date());
    } catch (error: any) {
      console.error('Xato:', error);
      toast({
        title: 'Xato',
        description: 'Yangiliklar yuklanmadi',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  useEffect(() => {
    yangiliklarniYuklash();

    // Har 3 soatda avtomatik yangilash (3 * 60 * 60 * 1000 = 10800000 ms)
    const interval = setInterval(() => {
      yangiliklarniYuklash();
      toast({
        title: 'Yangilandi',
        description: 'Yangiliklar avtomatik yangilandi',
      });
    }, 10800000); // 3 soat

    return () => clearInterval(interval);
  }, []);

  const qoldaYangilash = () => {
    setYuklanyapti(true);
    yangiliklarniYuklash();
  };

  if (yuklanyapti && yangiliklar.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-20 text-center">
            <div className="animate-spin h-16 w-16 border-4 border-[hsl(221,83%,53%)] border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-500 mt-4 text-lg">Yangiliklar yuklanmoqda...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <Card className="border-2 border-[hsl(221,83%,53%)] shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[hsl(221,83%,53%)] via-[hsl(221,83%,48%)] to-[hsl(221,83%,43%)] text-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-[hsl(43,96%,56%)] p-3 rounded-xl animate-pulse-slow">
                  <Newspaper className="h-10 w-10 text-[hsl(221,83%,53%)]" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Prokuratura Yangiliklari</h1>
                  <p className="text-blue-100 text-lg">O'zbekiston Respublikasi Bosh Prokuraturasi</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-blue-100 mt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Oxirgi yangilanish: {oxirgiYangilanish.toLocaleString('uz-UZ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>{yangiliklar.length} ta yangilik</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={qoldaYangilash}
              disabled={yuklanyapti}
              variant="secondary"
              size="lg"
              className="ml-4"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${yuklanyapti ? 'animate-spin' : ''}`} />
              Yangilash
            </Button>
          </div>
        </div>
      </Card>

      {/* Yangiliklar */}
      {yangiliklar.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-gray-500">
            <Newspaper className="h-20 w-20 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium">Hozircha yangiliklar yo'q</p>
            <p className="text-sm mt-2">Admin panelidan yangilik qo'shing</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {yangiliklar.map((yangilik, index) => (
            <Card
              key={yangilik.id}
              className="group hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 hover:border-[hsl(221,83%,53%)] animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Rasm */}
              {yangilik.rasm_url && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={yangilik.rasm_url}
                    alt={yangilik.sarlavha}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="bg-[hsl(43,96%,56%)] text-[hsl(221,83%,53%)] px-3 py-1 rounded-full text-xs font-bold">
                      {yangilik.manba}
                    </span>
                  </div>
                </div>
              )}

              {/* Content */}
              <CardHeader className="pb-3">
                <CardTitle className="text-xl leading-tight group-hover:text-[hsl(221,83%,53%)] transition-colors line-clamp-2">
                  {yangilik.sarlavha}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {yangilik.matn}
                </p>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(yangilik.created_at).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,53%)]/10"
                  >
                    Batafsil →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info banner */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-full">
              <RefreshCw className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-1">Avtomatik yangilanish</h3>
              <p className="text-sm text-blue-700">
                Yangiliklar har 3 soatda avtomatik yangilanadi. Qo'lda yangilash uchun yuqoridagi "Yangilash" tugmasini bosing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out backwards;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
