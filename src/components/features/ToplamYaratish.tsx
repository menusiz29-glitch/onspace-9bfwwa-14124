import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Kazus } from '@/types';

interface ToplamYaratishProps {
  ustozId: string;
  tahrirlashToplam?: { id: string; kod: string; mavzu: string; kazuslar: Kazus[] } | null;
  onTahrirlashTugadi?: () => void;
}

export default function ToplamYaratish({ ustozId, tahrirlashToplam, onTahrirlashTugadi }: ToplamYaratishProps) {
  const [mavzu, setMavzu] = useState('');
  const [kazuslar, setKazuslar] = useState<Kazus[]>([{ kazus: '', javob: '' }]);
  const [yuklanyapti, setYuklanyapti] = useState(false);
  const [natija, setNatija] = useState<{ kod: string } | null>(null);
  const [tahrirlashRejimi, setTahrirlashRejimi] = useState(false);
  const [keynAflotunYoqilgan, setKeynAflotunYoqilgan] = useState(true);
  const { toast } = useToast();

  // Tahrirlash ma'lumotlarini yuklash va sozlamalarni tekshirish
  useEffect(() => {
    if (tahrirlashToplam) {
      setMavzu(tahrirlashToplam.mavzu || '');
      setKazuslar(tahrirlashToplam.kazuslar);
      setTahrirlashRejimi(true);
    }
    sozlamaOlish();
  }, [tahrirlashToplam]);

  const sozlamaOlish = async () => {
    try {
      const { data, error } = await supabase
        .from('tizim_sozlamalari')
        .select('qiymat')
        .eq('kalit', 'keyn_aflotun_kod')
        .single();

      if (error) throw error;
      if (data) {
        setKeynAflotunYoqilgan(data.qiymat);
      }
    } catch (error: any) {
      console.error('Sozlama olishda xato:', error);
      // Default true qilib qo'yamiz
      setKeynAflotunYoqilgan(true);
    }
  };

  const kazusQoshish = () => {
    if (kazuslar.length < 30) {
      setKazuslar([...kazuslar, { kazus: '', javob: '' }]);
    } else {
      toast({
        title: 'Ogohlantirish',
        description: 'Maksimal 30 ta kazus qo\'shish mumkin',
        variant: 'destructive',
      });
    }
  };

  const kazusOchirish = (index: number) => {
    if (kazuslar.length > 1) {
      setKazuslar(kazuslar.filter((_, i) => i !== index));
    }
  };

  const kazusOzgartirish = (index: number, field: 'kazus' | 'javob', value: string) => {
    const yangi = [...kazuslar];
    yangi[index][field] = value;
    setKazuslar(yangi);
  };

  const kodGeneratsiya = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  const toplamYaratish = async () => {
    // Avval Keyn-Aflotun sozlamasini tekshirish
    if (!keynAflotunYoqilgan) {
      toast({
        title: 'Xatolik',
        description: 'Keyn-Aflotun kod generatsiyasi o\'chirilgan. Admin bilan bog\'laning.',
        variant: 'destructive',
      });
      return;
    }

    if (!mavzu.trim()) {
      toast({
        title: 'Xato',
        description: 'Toplam mavzusini kiriting',
        variant: 'destructive',
      });
      return;
    }

    const toliqlari = kazuslar.filter(k => k.kazus.trim() && k.javob.trim());
    if (toliqlari.length === 0) {
      toast({
        title: 'Xato',
        description: 'Kamida bitta kazus va javob kiriting',
        variant: 'destructive',
      });
      return;
    }

    setYuklanyapti(true);
    try {
      let kod = kodGeneratsiya();
      let urinishlar = 0;
      
      // Noyob kod topish
      while (urinishlar < 10) {
        const { data: mavjud } = await supabase
          .from('toplamlar')
          .select('kod')
          .eq('kod', kod)
          .single();
        
        if (!mavjud) break;
        kod = kodGeneratsiya();
        urinishlar++;
      }

      // Ustoz ma'lumotlarini olish
      const { data: ustozData } = await supabase
        .from('ustoz')
        .select('full_name')
        .eq('id', ustozId)
        .single();

      const { error } = await supabase.from('toplamlar').insert({
        kod,
        ustoz_id: ustozId,
        ustoz_ismi: ustozData?.full_name || 'Ustoz',
        mavzu: mavzu.trim(),
        kazuslar: toliqlari,
      });

      if (error) throw error;

      setNatija({ kod });
      setMavzu('');
      setKazuslar([{ kazus: '', javob: '' }]);
      
      toast({
        title: 'Muvaffaqiyatli!',
        description: `Toplam yaratildi. Kod: ${kod}`,
      });
    } catch (error: any) {
      console.error('Xato:', error);
      toast({
        title: 'Xato',
        description: error.message || 'Toplamni yaratishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  const toplamYangilash = async () => {
    if (!tahrirlashToplam) return;

    if (!mavzu.trim()) {
      toast({
        title: 'Xato',
        description: 'Toplam mavzusini kiriting',
        variant: 'destructive',
      });
      return;
    }

    const toliqlari = kazuslar.filter(k => k.kazus.trim() && k.javob.trim());
    if (toliqlari.length === 0) {
      toast({
        title: 'Xato',
        description: 'Kamida bitta kazus va javob kiriting',
        variant: 'destructive',
      });
      return;
    }

    setYuklanyapti(true);
    try {
      const { error } = await supabase
        .from('toplamlar')
        .update({
          mavzu: mavzu.trim(),
          kazuslar: toliqlari,
        })
        .eq('id', tahrirlashToplam.id);

      if (error) throw error;

      toast({
        title: 'Muvaffaqiyatli!',
        description: `Toplam yangilandi. Kod: ${tahrirlashToplam.kod}`,
      });

      if (onTahrirlashTugadi) {
        onTahrirlashTugadi();
      }
    } catch (error: any) {
      console.error('Xato:', error);
      toast({
        title: 'Xato',
        description: error.message || 'Toplamni yangilashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  if (natija) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-green-500 bg-green-50 shadow-xl animate-scale-in">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-full animate-bounce">
                <Check className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-green-700">Toplam muvaffaqiyatli yaratildi!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-6 rounded-lg border-2 border-green-300">
              <p className="text-sm text-gray-600 mb-2">Toplam kodi:</p>
              <p className="text-5xl font-bold text-[hsl(221,83%,53%)] text-center tracking-wider">
                {natija.kod}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Muhim:</p>
                <p>Bu kodni o'quvchilarga yuboring. Ular bu kod orqali toplamni yechadilar.</p>
              </div>
            </div>
            <Button onClick={() => {
              setNatija(null);
              if (onTahrirlashTugadi) {
                onTahrirlashTugadi();
              }
            }} className="w-full" size="lg">
              {tahrirlashRejimi ? 'Orqaga qaytish' : 'Yangi toplam yaratish'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Agar Keyn-Aflotun o'chirilgan bo'lsa, xabar ko'rsatish
  if (!keynAflotunYoqilgan && !tahrirlashRejimi) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-red-500 bg-red-50 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-red-500 p-3 rounded-full">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-red-700 text-xl">Toplam yaratish o'chirilgan</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-6 rounded-lg border-2 border-red-300">
              <p className="text-gray-700 text-lg mb-4">
                Keyn-Aflotun kod generatsiya tizimi administrator tomonidan o'chirilgan.
              </p>
              <p className="text-gray-600">
                Toplam yaratish funksiyasini yoqish uchun admin bilan bog'laning.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{tahrirlashRejimi ? `Toplamni tahrirlash (Kod: ${tahrirlashToplam?.kod})` : 'Toplam ma\'lumotlari'}</CardTitle>
            {tahrirlashRejimi && onTahrirlashTugadi && (
              <Button onClick={onTahrirlashTugadi} variant="outline" size="sm">
                Bekor qilish
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Toplam mavzusi: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Masalan: Jinoyat huquqi asoslari, Fuqarolik huquqi, va boshqalar..."
              value={mavzu}
              onChange={(e) => setMavzu(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[hsl(221,83%,53%)] text-lg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Kazuslar ({kazuslar.length}/30)</CardTitle>
          <Button onClick={kazusQoshish} disabled={kazuslar.length >= 30} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Kazus qo'shish
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {kazuslar.map((kazus, index) => (
            <div key={index} className="border-2 border-gray-200 rounded-lg p-4 space-y-4 relative hover:border-[hsl(221,83%,53%)] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[hsl(221,83%,53%)]">Kazus {index + 1}</span>
                {kazuslar.length > 1 && (
                  <Button
                    onClick={() => kazusOchirish(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Kazus matni:
                </label>
                <Textarea
                  placeholder="Huquqiy vaziyatni batafsil yozing..."
                  value={kazus.kazus}
                  onChange={(e) => kazusOzgartirish(index, 'kazus', e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  To'g'ri javob:
                </label>
                <Textarea
                  placeholder="To'g'ri javobni yozing..."
                  value={kazus.javob}
                  onChange={(e) => kazusOzgartirish(index, 'javob', e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        onClick={tahrirlashRejimi ? toplamYangilash : toplamYaratish}
        disabled={yuklanyapti}
        className="w-full"
        size="lg"
      >
        {yuklanyapti 
          ? (tahrirlashRejimi ? 'Saqlanmoqda...' : 'Yaratilmoqda...') 
          : (tahrirlashRejimi ? 'Toplamni yangilash' : 'Toplamni saqlash va kod olish')
        }
      </Button>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
