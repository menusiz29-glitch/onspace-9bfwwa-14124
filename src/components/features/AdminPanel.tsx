import { useState, useEffect } from 'react';
import { Shield, Search, Users, Clock, CheckCircle, XCircle, Loader2, Trash2, Plus, Newspaper, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Toplam, Javob } from '@/types';
import { Ustoz, approveUstoz, deleteUstoz } from '@/lib/auth';
import { Textarea } from '@/components/ui/textarea';
import JavobTahlil from './JavobTahlil';

const ADMIN_CODE = 'admin2026';

interface Yangilik {
  id: string;
  sarlavha: string;
  matn: string;
  rasm_url: string | null;
  manba: string;
  created_at: string;
}

export default function AdminPanel() {
  const [kirish, setKirish] = useState(false);
  const [kod, setKod] = useState('');
  const [view, setView] = useState<'ustoz' | 'natija' | 'yangilik'>('ustoz');
  const [toplamKod, setToplamKod] = useState('');
  const [yuklanyapti, setYuklanyapti] = useState(false);
  const [toplam, setToplam] = useState<Toplam | null>(null);
  const [javoblar, setJavoblar] = useState<Javob[]>([]);
  const [ustozlar, setUstozlar] = useState<Ustoz[]>([]);
  const [yangiliklar, setYangiliklar] = useState<Yangilik[]>([]);
  const [yangiSarlavha, setYangiSarlavha] = useState('');
  const [yangiMatn, setYangiMatn] = useState('');
  const [yangiRasm, setYangiRasm] = useState('');
  const [yangiManba, setYangiManba] = useState('Bosh Prokuratura');
  const [tahlilModal, setTahlilModal] = useState<{
    kazus: string;
    togriJavob: string;
    oquvchiJavob: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (kirish) {
      if (view === 'ustoz') {
        ustozlarniYuklash();
      } else if (view === 'yangilik') {
        yangiliklarniYuklash();
      }
    }
  }, [kirish, view]);

  const adminKirish = () => {
    if (kod === ADMIN_CODE) {
      setKirish(true);
      toast({
        title: 'Xush kelibsiz, Admin!',
        description: 'Admin paneliga kirildi',
      });
    } else {
      toast({
        title: 'Xato',
        description: 'Admin kodi noto\'g\'ri',
        variant: 'destructive',
      });
    }
  };

  const ustozlarniYuklash = async () => {
    try {
      const { data, error } = await supabase
        .from('ustoz')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUstozlar(data as Ustoz[] || []);
    } catch (error: any) {
      console.error('Xato:', error);
      toast({
        title: 'Xato',
        description: 'Ustoz ro\'yxatini yuklashda xatolik',
        variant: 'destructive',
      });
    }
  };

  const ustozniTasdiqlash = async (ustozId: string, status: 'approved' | 'rejected') => {
    setYuklanyapti(true);
    try {
      await approveUstoz(ustozId, status);
      await ustozlarniYuklash();
      toast({
        title: 'Muvaffaqiyatli',
        description: status === 'approved' ? 'Ustoz tasdiqlandi' : 'Ustoz rad etildi',
      });
    } catch (error: any) {
      toast({
        title: 'Xato',
        description: error.message || 'Ustoz holatini o\'zgartirishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  const ustozniOchirish = async (ustozId: string, fullName: string) => {
    if (!confirm(`${fullName} ni o'chirmoqchimisiz? Bu amaldan qaytarib bo'lmaydi!`)) {
      return;
    }

    setYuklanyapti(true);
    try {
      await deleteUstoz(ustozId);
      await ustozlarniYuklash();
      toast({
        title: 'O\'chirildi',
        description: 'Ustoz muvaffaqiyatli o\'chirildi',
      });
    } catch (error: any) {
      toast({
        title: 'Xato',
        description: error.message || 'Ustoz o\'chirishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  const yangiliklarniYuklash = async () => {
    try {
      const { data, error } = await supabase
        .from('yangiliklar')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setYangiliklar(data as Yangilik[] || []);
    } catch (error: any) {
      console.error('Xato:', error);
      toast({
        title: 'Xato',
        description: 'Yangiliklar yuklanmadi',
        variant: 'destructive',
      });
    }
  };

  const yangiliQoshish = async () => {
    if (!yangiSarlavha.trim() || !yangiMatn.trim()) {
      toast({
        title: 'Xato',
        description: 'Sarlavha va matn to\'ldirilishi shart',
        variant: 'destructive',
      });
      return;
    }

    setYuklanyapti(true);
    try {
      const { error } = await supabase.from('yangiliklar').insert({
        sarlavha: yangiSarlavha.trim(),
        matn: yangiMatn.trim(),
        rasm_url: yangiRasm.trim() || null,
        manba: yangiManba.trim(),
      });

      if (error) throw error;

      setYangiSarlavha('');
      setYangiMatn('');
      setYangiRasm('');
      setYangiManba('Bosh Prokuratura');
      await yangiliklarniYuklash();

      toast({
        title: 'Muvaffaqiyatli',
        description: 'Yangilik qo\'shildi',
      });
    } catch (error: any) {
      toast({
        title: 'Xato',
        description: error.message || 'Yangilik qo\'shishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  const yangiliOchirish = async (id: string) => {
    if (!confirm('Bu yangilikni o\'chirmoqchimisiz?')) return;

    setYuklanyapti(true);
    try {
      const { error } = await supabase
        .from('yangiliklar')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await yangiliklarniYuklash();

      toast({
        title: 'O\'chirildi',
        description: 'Yangilik o\'chirildi',
      });
    } catch (error: any) {
      toast({
        title: 'Xato',
        description: error.message || 'Yangilik o\'chirishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  const natijalarniKorish = async () => {
    if (!toplamKod.trim() || toplamKod.trim().length !== 5) {
      toast({
        title: 'Xato',
        description: 'Toplam kodi 5 raqamdan iborat bo\'lishi kerak',
        variant: 'destructive',
      });
      return;
    }

    setYuklanyapti(true);
    try {
      const { data: toplamData, error: toplamError } = await supabase
        .from('toplamlar')
        .select('*')
        .eq('kod', toplamKod.trim())
        .single();

      if (toplamError || !toplamData) {
        toast({
          title: 'Toplam topilmadi',
          description: 'Kodni tekshirib qaytadan kiriting',
          variant: 'destructive',
        });
        return;
      }

      const { data: javoblarData, error: javoblarError } = await supabase
        .from('javoblar')
        .select('*')
        .eq('toplam_kod', toplamKod.trim())
        .order('created_at', { ascending: false });

      if (javoblarError) throw javoblarError;

      setToplam(toplamData as Toplam);
      setJavoblar(javoblarData as Javob[] || []);
      
      if (!javoblarData || javoblarData.length === 0) {
        toast({
          title: 'Javoblar yo\'q',
          description: 'Bu toplam uchun hali o\'quvchilar javob yuborishgan',
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

  const ortachaHisoblash = (baho: any[]) => {
    if (!baho || baho.length === 0) return 0;
    return Math.round(baho.reduce((sum: number, b: any) => sum + b.foiz, 0) / baho.length);
  };

  if (!kirish) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-2 border-red-500 animate-slide-up">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-500 text-white">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <CardTitle className="text-2xl">Admin Panel</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Admin kodi:
              </label>
              <Input
                type="password"
                placeholder="Admin kodi"
                value={kod}
                onChange={(e) => setKod(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && adminKirish()}
              />
            </div>
            <Button onClick={adminKirish} className="w-full" size="lg">
              <Shield className="mr-2 h-5 w-5" />
              Kirish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-2 border-red-500">
        <CardHeader className="bg-gradient-to-r from-red-600 to-red-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <CardTitle className="text-2xl">Admin Panel</CardTitle>
            </div>
            <Button onClick={() => setKirish(false)} variant="secondary" size="sm">
              Chiqish
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => setView('ustoz')}
              variant={view === 'ustoz' ? 'default' : 'outline'}
            >
              <Users className="h-4 w-4 mr-2" />
              Ustozlar
            </Button>
            <Button
              onClick={() => setView('natija')}
              variant={view === 'natija' ? 'default' : 'outline'}
            >
              <Search className="h-4 w-4 mr-2" />
              Natijalar
            </Button>
            <Button
              onClick={() => setView('yangilik')}
              variant={view === 'yangilik' ? 'default' : 'outline'}
            >
              <Newspaper className="h-4 w-4 mr-2" />
              Yangiliklar
            </Button>
          </div>
        </CardContent>
      </Card>

      {view === 'ustoz' && (
        <div className="space-y-4">
          {ustozlar.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Hali ustozlar yo'q
              </CardContent>
            </Card>
          ) : (
            ustozlar.map((ustoz) => (
              <Card key={ustoz.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{ustoz.full_name}</h3>
                      <p className="text-sm text-gray-600">@{ustoz.username}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Ro'yxatdan o'tgan: {new Date(ustoz.created_at).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ustoz.status === 'pending' && (
                        <>
                          <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm font-medium mr-2">
                            <Clock className="h-4 w-4" />
                            Kutilmoqda
                          </div>
                          <Button
                            onClick={() => ustozniTasdiqlash(ustoz.id, 'approved')}
                            disabled={yuklanyapti}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {yuklanyapti ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Tasdiqlash
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => ustozniTasdiqlash(ustoz.id, 'rejected')}
                            disabled={yuklanyapti}
                            variant="destructive"
                            size="sm"
                          >
                            {yuklanyapti ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Rad etish
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      {ustoz.status === 'approved' && (
                        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-2 rounded-full text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Tasdiqlangan
                        </div>
                      )}
                      {ustoz.status === 'rejected' && (
                        <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-2 rounded-full text-sm font-medium">
                          <XCircle className="h-4 w-4" />
                          Rad etilgan
                        </div>
                      )}
                      <Button
                        onClick={() => ustozniOchirish(ustoz.id, ustoz.full_name)}
                        disabled={yuklanyapti}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {view === 'yangilik' && (
        <div className="space-y-6">
          {/* Yangilik qo'shish */}
          <Card className="border-2 border-[hsl(221,83%,53%)]">
            <CardHeader className="bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(221,83%,43%)] text-white">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-6 w-6" />
                Yangilik qo'shish
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Sarlavha:
                </label>
                <Input
                  placeholder="Yangilik sarlavhasi"
                  value={yangiSarlavha}
                  onChange={(e) => setYangiSarlavha(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Matn:
                </label>
                <Textarea
                  placeholder="Yangilik matni"
                  value={yangiMatn}
                  onChange={(e) => setYangiMatn(e.target.value)}
                  rows={5}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Rasm URL (ixtiyoriy):
                </label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={yangiRasm}
                  onChange={(e) => setYangiRasm(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Manba:
                </label>
                <Input
                  placeholder="Bosh Prokuratura"
                  value={yangiManba}
                  onChange={(e) => setYangiManba(e.target.value)}
                />
              </div>

              <Button
                onClick={yangiliQoshish}
                disabled={yuklanyapti}
                className="w-full"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                {yuklanyapti ? 'Qo\'shilmoqda...' : 'Yangilik qo\'shish'}
              </Button>
            </CardContent>
          </Card>

          {/* Mavjud yangiliklar */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Mavjud yangiliklar ({yangiliklar.length})</h3>
            {yangiliklar.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  Hozircha yangiliklar yo'q
                </CardContent>
              </Card>
            ) : (
              yangiliklar.map((yangilik) => (
                <Card key={yangilik.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-2">{yangilik.sarlavha}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{yangilik.matn}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {yangilik.manba}
                          </span>
                          <span>
                            {new Date(yangilik.created_at).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => yangiliOchirish(yangilik.id)}
                        disabled={yuklanyapti}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 ml-4"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {view === 'natija' && !toplam && (
        <Card>
          <CardHeader>
            <CardTitle>Toplam natijalarini ko'rish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Toplam kodini kiriting:
              </label>
              <Input
                placeholder="12345"
                value={toplamKod}
                onChange={(e) => setToplamKod(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
                className="text-2xl font-bold text-center tracking-widest"
              />
            </div>

            <Button
              onClick={natijalarniKorish}
              disabled={yuklanyapti || toplamKod.length !== 5}
              className="w-full"
              size="lg"
            >
              <Search className="mr-2 h-5 w-5" />
              {yuklanyapti ? 'Yuklanmoqda...' : 'Natijalarni ko\'rish'}
            </Button>
          </CardContent>
        </Card>
      )}

      {view === 'natija' && toplam && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(221,83%,43%)] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{toplam.mavzu || 'Toplam natijalar'}</CardTitle>
                  <div className="flex items-center gap-6 text-sm text-blue-100">
                    <span>Kod: {toplam.kod}</span>
                    <span>Ustoz: {toplam.ustoz_ismi}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {javoblar.length} o'quvchi
                    </span>
                  </div>
                </div>
                <Button onClick={() => { setToplam(null); setJavoblar([]); setToplamKod(''); }} variant="secondary">
                  Orqaga
                </Button>
              </div>
            </CardHeader>
          </Card>

          {javoblar.map((javob) => {
            const ortacha = ortachaHisoblash(javob.baho);
            return (
              <Card key={javob.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg">{javob.oquvchi_ismi}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4" />
                        {new Date(javob.created_at).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">O'rtacha ball</p>
                      <p className={`text-4xl font-bold ${
                        ortacha >= 70 ? 'text-green-600' :
                        ortacha >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {ortacha}%
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {javob.baho.map((baho: any, idx: number) => {
                      const kazus = toplam.kazuslar[baho.kazus_index];
                      const oquvchiJavob = javob.javoblar.find(
                        (j: any) => j.kazus_index === baho.kazus_index
                      );

                      return (
                        <div key={idx} className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-[hsl(221,83%,53%)]">
                              Kazus {baho.kazus_index + 1}
                            </span>
                            <span className={`text-2xl font-bold ${
                              baho.foiz >= 70 ? 'text-green-600' :
                              baho.foiz >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {baho.foiz}%
                            </span>
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
      )}

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
