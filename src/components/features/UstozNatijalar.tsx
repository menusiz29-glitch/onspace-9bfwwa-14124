import { useState, useEffect } from 'react';
import { Search, Users, Calendar, FileText, ArrowLeft, Eye, Lightbulb, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Toplam, Javob } from '@/types';
import JavobTahlil from './JavobTahlil';

interface UstozNatijalarProps {
  ustozId: string;
  onTahrirlash?: (toplam: Toplam) => void;
}

export default function UstozNatijalar({ ustozId, onTahrirlash }: UstozNatijalarProps) {
  const [yuklanyapti, setYuklanyapti] = useState(false);
  const [toplamlar, setToplamlar] = useState<Toplam[]>([]);
  const [tanlanganToplam, setTanlanganToplam] = useState<Toplam | null>(null);
  const [javoblar, setJavoblar] = useState<Javob[]>([]);
  const [tahlilModal, setTahlilModal] = useState<{
    kazus: string;
    togriJavob: string;
    oquvchiJavob: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    toplamlarniYuklash();
  }, []);

  const toplamlarniYuklash = async () => {
    setYuklanyapti(true);
    try {
      const { data, error } = await supabase
        .from('toplamlar')
        .select('*')
        .eq('ustoz_id', ustozId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setToplamlar(data as Toplam[] || []);
    } catch (error: any) {
      console.error('Xato:', error);
      toast({
        title: 'Xato',
        description: 'Toplamlarni yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  const toplamniTanlash = async (toplam: Toplam) => {
    setYuklanyapti(true);
    try {
      const { data: javoblarData, error: javoblarError } = await supabase
        .from('javoblar')
        .select('*')
        .eq('toplam_kod', toplam.kod)
        .order('created_at', { ascending: false });

      if (javoblarError) throw javoblarError;

      setTanlanganToplam(toplam);
      setJavoblar(javoblarData as Javob[] || []);
      
      if (!javoblarData || javoblarData.length === 0) {
        toast({
          title: 'Javoblar yo\'q',
          description: 'Bu toplam uchun hali o\'quvchilar javob yuborishmagan',
        });
      }
    } catch (error: any) {
      console.error('Xato:', error);
      toast({
        title: 'Xato',
        description: 'Natijalarni yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  const ortachaBallHisoblash = (baho: any[]) => {
    if (!baho || baho.length === 0) return 0;
    return Math.round(baho.reduce((sum: number, b: any) => sum + b.ball, 0) / baho.length);
  };

  const qaytish = () => {
    setTanlanganToplam(null);
    setJavoblar([]);
  };

  // Batafsil natijalar ko'rinishi
  if (tanlanganToplam && javoblar.length > 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <Card>
          <CardHeader className="bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(221,83%,43%)] text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{tanlanganToplam.mavzu || 'Toplam natijalar'}</CardTitle>
                <div className="flex items-center gap-6 text-sm text-blue-100">
                  <span>Kod: {tanlanganToplam.kod}</span>
                  <span>Ustoz: {tanlanganToplam.ustoz_ismi}</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {javoblar.length} o'quvchi
                  </span>
                </div>
              </div>
              <Button onClick={qaytish} variant="secondary">
                Orqaga
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4">
          {javoblar.map((javob) => {
            const ortachaBall = ortachaBallHisoblash(javob.baho);
            const maksimalBall = javob.baho.length * 30;
            return (
              <Card key={javob.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg">{javob.oquvchi_ismi}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(javob.created_at).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Umumiy natija</p>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-4xl font-bold ${
                          ortachaBall >= 21 ? 'text-green-600' :
                          ortachaBall >= 15 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {ortachaBall}
                        </p>
                        <p className="text-2xl text-gray-500">/ {maksimalBall}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {javob.baho.map((baho: any, idx: number) => {
                      const kazus = tanlanganToplam.kazuslar[baho.kazus_index];
                      const oquvchiJavob = javob.javoblar.find(
                        (j: any) => j.kazus_index === baho.kazus_index
                      );

                      return (
                        <div key={idx} className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-[hsl(221,83%,53%)]">
                              Kazus {baho.kazus_index + 1}
                            </span>
                            <div>
                              <span className={`text-2xl font-bold ${
                                baho.ball >= 21 ? 'text-green-600' :
                                baho.ball >= 15 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {baho.ball}
                              </span>
                              <span className="text-lg text-gray-500"> / 30</span>
                            </div>
                          </div>
                          
                          <div className="text-sm space-y-2">
                            <div>
                              <p className="font-medium text-gray-500 mb-1">Kazus:</p>
                              <p className="text-gray-700 bg-gray-50 p-2 rounded">
                                {kazus.kazus}
                              </p>
                            </div>
                            
                            <div>
                              <p className="font-medium text-gray-500 mb-1">O'quvchi javobi:</p>
                              <p className="text-gray-700 bg-blue-50 p-2 rounded">
                                {oquvchiJavob?.javob || 'Javob berilmagan'}
                              </p>
                            </div>

                            <div>
                              <p className="font-medium text-gray-500 mb-1">AI izohi:</p>
                              <p className="text-gray-800 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                                {baho.izoh}
                              </p>
                            </div>

                            {/* Batafsil tahlil tugmasi */}
                            <div className="pt-2">
                              <Button
                                onClick={() => setTahlilModal({
                                  kazus: kazus.kazus,
                                  togriJavob: kazus.javob,
                                  oquvchiJavob: oquvchiJavob?.javob || '',
                                })}
                                variant="outline"
                                size="sm"
                                className="w-full border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-500 text-purple-700"
                              >
                                <Lightbulb className="h-4 w-4 mr-2" />
                                Batafsil tahlil (AI)
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Batafsil tahlil modali */}
        {tahlilModal && (
          <JavobTahlil
            kazusMatni={tahlilModal.kazus}
            togriJavob={tahlilModal.togriJavob}
            oquvchiJavobi={tahlilModal.oquvchiJavob}
            onClose={() => setTahlilModal(null)}
          />
        )}
      </div>
    );
  }

  // Javoblar yo'q holat
  if (tanlanganToplam && javoblar.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{tanlanganToplam.mavzu || 'Toplam'}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Kod: {tanlanganToplam.kod} • {tanlanganToplam.kazuslar.length} ta kazus
                </p>
              </div>
              <Button onClick={qaytish} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Orqaga
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Hali hech kim yechmagan</p>
              <p className="text-sm mt-2">Bu toplam uchun o'quvchilar javob yuborishmagan</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Toplamlar ro'yxati
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Mening toplamlarim
          </CardTitle>
        </CardHeader>
      </Card>

      {yuklanyapti ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-[hsl(221,83%,53%)] border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-500 mt-4">Yuklanmoqda...</p>
          </CardContent>
        </Card>
      ) : toplamlar.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Hali toplam yaratilmagan</p>
            <p className="text-sm mt-2">"Toplam yaratish" bo'limidan yangi toplam yarating</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {toplamlar.map((toplam) => {
            const javoblarSoni = javoblar.filter(j => j.toplam_kod === toplam.kod).length;
            return (
              <Card
                key={toplam.id}
                className="hover:shadow-xl transition-all cursor-pointer hover:scale-105 hover:border-[hsl(221,83%,53%)] border-2"
                onClick={() => toplamniTanlash(toplam)}
              >
                <CardHeader className="bg-gradient-to-br from-[hsl(221,83%,53%)]/10 to-[hsl(221,83%,43%)]/5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-lg font-bold text-[hsl(221,83%,53%)] mb-2">
                        {toplam.mavzu || 'Mavzusiz'}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">Kod:</div>
                      <div className="text-2xl font-bold text-[hsl(221,83%,53%)] tracking-wider">
                        {toplam.kod}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {onTahrirlash && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTahrirlash(toplam);
                          }}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                          title="Tahrirlash"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                      )}
                      <Eye className="h-6 w-6 text-[hsl(221,83%,53%)]" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Kazuslar:</span>
                      <span className="font-semibold text-[hsl(221,83%,53%)]">
                        {toplam.kazuslar.length} ta
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Yechganlar:</span>
                      <span className="font-semibold text-green-600">
                        {javoblarSoni} kishi
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 pt-2 border-t">
                      <Calendar className="h-3 w-3" />
                      {new Date(toplam.created_at).toLocaleDateString('uz-UZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
