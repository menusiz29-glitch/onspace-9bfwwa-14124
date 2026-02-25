import { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Toplam, BahoNatija } from '@/types';

export default function ToplamYechish() {
  const [bosqich, setBosqich] = useState<'kod' | 'javob' | 'natija'>('kod');
  const [kod, setKod] = useState('');
  const [oquvchiIsmi, setOquvchiIsmi] = useState('');
  const [toplam, setToplam] = useState<Toplam | null>(null);
  const [javoblar, setJavoblar] = useState<string[]>([]);
  const [yuklanyapti, setYuklanyapti] = useState(false);
  const [natija, setNatija] = useState<BahoNatija[] | null>(null);
  const { toast } = useToast();
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    const handleCopyPaste = (e: ClipboardEvent) => {
      if (bosqich === 'javob') {
        e.preventDefault();
        toast({
          title: 'Taqiqlangan',
          description: 'Copy/Paste ishlatish mumkin emas',
          variant: 'destructive',
        });
      }
    };

    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);

    return () => {
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
    };
  }, [bosqich]);

  const toplamniYuklash = async () => {
    if (!kod.trim() || kod.trim().length !== 5) {
      toast({
        title: 'Xato',
        description: 'Toplam kodi 5 raqamdan iborat bo\'lishi kerak',
        variant: 'destructive',
      });
      return;
    }

    if (!oquvchiIsmi.trim()) {
      toast({
        title: 'Xato',
        description: 'Ism va familiyangizni kiriting',
        variant: 'destructive',
      });
      return;
    }

    setYuklanyapti(true);
    try {
      const { data, error } = await supabase
        .from('toplamlar')
        .select('*')
        .eq('kod', kod.trim())
        .single();

      if (error || !data) {
        toast({
          title: 'Toplam topilmadi',
          description: 'Kodni tekshirib qaytadan kiriting',
          variant: 'destructive',
        });
        return;
      }

      // Oldin topshirganmi tekshirish
      const { data: mavjudJavob } = await supabase
        .from('javoblar')
        .select('id')
        .eq('toplam_kod', kod.trim())
        .eq('oquvchi_ismi', oquvchiIsmi.trim())
        .single();

      if (mavjudJavob) {
        toast({
          title: 'Allaqachon topshirilgan',
          description: 'Siz bu toplamni oldin yechgansiz',
          variant: 'destructive',
        });
        return;
      }

      setToplam(data as Toplam);
      setJavoblar(new Array(data.kazuslar.length).fill(''));
      setBosqich('javob');
    } catch (error: any) {
      console.error('Xato:', error);
      toast({
        title: 'Xato',
        description: 'Toplamni yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  const javobYuborish = async () => {
    if (!toplam) return;

    const toliqlari = javoblar.filter(j => j.trim());
    if (toliqlari.length === 0) {
      toast({
        title: 'Xato',
        description: 'Kamida bitta javob yozing',
        variant: 'destructive',
      });
      return;
    }

    setYuklanyapti(true);
    try {
      const javoblarData = javoblar.map((javob, index) => ({
        kazus_index: index,
        javob: javob.trim(),
      })).filter(j => j.javob);

      const { data, error } = await supabase.functions.invoke('baholash', {
        body: {
          toplam_kod: kod.trim(),
          oquvchi_ismi: oquvchiIsmi.trim(),
          javoblar: javoblarData,
        },
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const textContent = await error.context?.text();
            errorMessage = `[Kod: ${statusCode}] ${textContent || error.message || 'Noma\'lum xato'}`;
          } catch {
            errorMessage = `${error.message || 'Javobni o\'qib bo\'lmadi'}`;
          }
        }
        throw new Error(errorMessage);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setNatija(data.baho as BahoNatija[]);
      setBosqich('natija');
      
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Javoblaringiz baholandi',
      });
    } catch (error: any) {
      console.error('Xato:', error);
      toast({
        title: 'Xato',
        description: error.message || 'Javobni yuborishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  const qaytadanBoshlash = () => {
    setBosqich('kod');
    setKod('');
    setOquvchiIsmi('');
    setToplam(null);
    setJavoblar([]);
    setNatija(null);
  };

  if (bosqich === 'kod') {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Toplam kodini kiriting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Ism va familiya:
              </label>
              <Input
                placeholder="Ism Familiya"
                value={oquvchiIsmi}
                onChange={(e) => setOquvchiIsmi(e.target.value)}
                maxLength={100}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                5 xonali kod:
              </label>
              <Input
                placeholder="12345"
                value={kod}
                onChange={(e) => setKod(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
                className="text-2xl font-bold text-center tracking-widest"
              />
            </div>

            <Button
              onClick={toplamniYuklash}
              disabled={yuklanyapti || kod.length !== 5 || !oquvchiIsmi.trim()}
              className="w-full"
              size="lg"
            >
              {yuklanyapti ? 'Yuklanmoqda...' : 'Toplamni boshlash'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bosqich === 'javob' && toplam) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(221,83%,43%)] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">O'quvchi:</p>
                <p className="text-xl font-bold">{oquvchiIsmi}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Toplam kodi:</p>
                <p className="text-xl font-bold">{kod}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Diqqat:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Copy/Paste ishlamaydi</li>
              <li>Faqat bir marta yuborishingiz mumkin</li>
              <li>Barcha savollarga javob berish majburiy emas</li>
            </ul>
          </div>
        </div>

        {toplam.kazuslar.map((kazus, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-[hsl(221,83%,53%)]">Kazus {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-gray-800 whitespace-pre-wrap">{kazus.kazus}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Sizning javobingiz:
                </label>
                <Textarea
                  ref={(el) => (textareaRefs.current[index] = el)}
                  placeholder="Javobingizni yozing..."
                  value={javoblar[index]}
                  onChange={(e) => {
                    const yangi = [...javoblar];
                    yangi[index] = e.target.value;
                    setJavoblar(yangi);
                  }}
                  rows={6}
                  className="resize-none"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          onClick={javobYuborish}
          disabled={yuklanyapti}
          className="w-full"
          size="lg"
        >
          {yuklanyapti ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Baholanmoqda...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Javoblarni yuborish
            </>
          )}
        </Button>
      </div>
    );
  }

  // Javobda xato qismlarni highlight qilish
  const highlightedJavob = (javob: string, xatolar: any[]) => {
    if (!xatolar || xatolar.length === 0) {
      return <span className="text-gray-700">{javob}</span>;
    }

    const qismlar: JSX.Element[] = [];
    let oxirgiIndex = 0;

    xatolar.forEach((xato, idx) => {
      const xatoIndex = javob.toLowerCase().indexOf(xato.xato.toLowerCase(), oxirgiIndex);
      
      if (xatoIndex !== -1) {
        // Xatogacha bo'lgan oddiy matn
        if (xatoIndex > oxirgiIndex) {
          qismlar.push(
            <span key={`text-${idx}`}>
              {javob.substring(oxirgiIndex, xatoIndex)}
            </span>
          );
        }

        // Xato qism
        const bgColor = xato.tur === 'imlo' ? 'bg-yellow-100 border-yellow-400 text-yellow-900' : 'bg-red-100 border-red-400 text-red-900';
        const hoverColor = xato.tur === 'imlo' ? 'bg-yellow-700' : 'bg-green-700';
        
        qismlar.push(
          <span
            key={`error-${idx}`}
            className={`${bgColor} px-1 rounded cursor-help border-b-2 relative group`}
          >
            {javob.substring(xatoIndex, xatoIndex + xato.xato.length)}
            {/* Tooltip */}
            <span className={`invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 ${hoverColor} text-white text-sm rounded-lg whitespace-nowrap shadow-lg z-10`}>
              ✓ To'g'ri: {xato.togri}
              <span className={`absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-${xato.tur === 'imlo' ? 'yellow' : 'green'}-700`}></span>
            </span>
          </span>
        );

        oxirgiIndex = xatoIndex + xato.xato.length;
      }
    });

    // Qolgan matn
    if (oxirgiIndex < javob.length) {
      qismlar.push(
        <span key="text-end">
          {javob.substring(oxirgiIndex)}
        </span>
      );
    }

    return <span>{qismlar}</span>;
  };

  if (bosqich === 'natija' && natija && toplam) {
    const ortachaBall = Math.round(
      natija.reduce((sum, n) => sum + n.ball, 0) / natija.length
    );
    const maksimalBall = natija.length * 30;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-2 border-[hsl(221,83%,53%)]">
          <CardHeader className="bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(221,83%,43%)] text-white">
            <CardTitle className="text-2xl">Natijalar</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-2">Umumiy natija:</p>
              <div className="flex items-baseline gap-3">
                <p className="text-6xl font-bold text-[hsl(221,83%,53%)]">{ortachaBall}</p>
                <p className="text-3xl text-gray-500">/ {maksimalBall}</p>
              </div>
              <p className="text-sm text-gray-500 mt-2">O'rtacha: {ortachaBall} ball (har bir kazus 30 balldan baholanadi)</p>
            </div>

            {natija.map((baho, index) => {
              const kazus = toplam.kazuslar[baho.kazus_index];
              return (
                <Card key={index} className="border-2">
                  <CardHeader className="bg-gray-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Kazus {baho.kazus_index + 1}</CardTitle>
                      <div className="text-right">
                        <span className={`text-3xl font-bold ${
                          baho.ball >= 21 ? 'text-green-600' :
                          baho.ball >= 15 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {baho.ball}
                        </span>
                        <span className="text-xl text-gray-500"> / 30</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Kazus:</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {kazus.kazus}
                      </p>
                    </div>
                    
                    {/* Batafsil tahlil - avtomatik */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
                      <h4 className="font-bold text-purple-900 mb-3 text-sm">📊 Batafsil tahlil</h4>
                      
                      {/* O'quvchi javobi (xatolar bilan) */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-600 mb-2">Sizning javobingiz:</p>
                        <div className="text-sm bg-white p-3 rounded border border-purple-200 leading-relaxed">
                          {highlightedJavob(
                            javoblar[baho.kazus_index] || 'Javob berilmagan',
                            baho.batafsil_tahlil.xatolar
                          )}
                        </div>
                        {baho.batafsil_tahlil.xatolar.length > 0 && (
                          <p className="text-xs text-purple-600 mt-1 italic">
                            💡 Rangli qismlar ustiga sichqonchani olib boring
                          </p>
                        )}
                      </div>

                      {/* Xatolar ro'yxati */}
                      {baho.batafsil_tahlil.xatolar.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-600 mb-2">Topilgan xatolar:</p>
                          <div className="space-y-2">
                            {baho.batafsil_tahlil.xatolar.map((xato: any, idx: number) => (
                              <div key={idx} className={`text-xs p-2 rounded border ${
                                xato.tur === 'imlo' 
                                  ? 'bg-yellow-50 border-yellow-300' 
                                  : 'bg-red-50 border-red-300'
                              }`}>
                                <span className={`inline-block px-2 py-0.5 rounded text-white font-bold mr-2 ${
                                  xato.tur === 'imlo' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}>
                                  {xato.tur === 'imlo' ? '📝 Imlo' : '❌ Mazmun'}
                                </span>
                                <span className={xato.tur === 'imlo' ? 'text-yellow-900' : 'text-red-900'}>
                                  "{xato.xato}" → "{xato.togri}"
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Yetishmayotganlar */}
                      {baho.batafsil_tahlil.yetishmayotganlar.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-600 mb-2">Javobda yozilmay qolgan:</p>
                          <ul className="space-y-1">
                            {baho.batafsil_tahlil.yetishmayotganlar.map((element: string, idx: number) => (
                              <li key={idx} className="text-xs bg-orange-50 border border-orange-200 p-2 rounded text-orange-900">
                                • {element}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* A'lo natija */}
                      {baho.batafsil_tahlil.xatolar.length === 0 && baho.batafsil_tahlil.yetishmayotganlar.length === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-1" />
                          <p className="text-sm font-bold text-green-900">A'lo javob!</p>
                          <p className="text-xs text-green-700">Javobda jiddiy xatolar yo'q</p>
                        </div>
                      )}

                      {/* Izoh */}
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <p className="text-xs font-medium text-gray-600 mb-1">AI izohi:</p>
                        <p className="text-xs text-gray-700 bg-white p-2 rounded border border-purple-200">
                          {baho.izoh}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Button onClick={qaytadanBoshlash} className="w-full" size="lg">
              Bosh sahifaga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
