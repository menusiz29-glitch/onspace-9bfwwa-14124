import { useState } from 'react';
import { X, Loader2, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface XatoQism {
  xato: string;
  togri: string;
}

interface TahlilNatija {
  xatolar: XatoQism[];
  yetishmayotganlar: string[];
}

interface JavobTahlilProps {
  kazusMatni: string;
  togriJavob: string;
  oquvchiJavobi: string;
  onClose: () => void;
}

export default function JavobTahlil({ kazusMatni, togriJavob, oquvchiJavobi, onClose }: JavobTahlilProps) {
  const [yuklanyapti, setYuklanyapti] = useState(false);
  const [tahlil, setTahlil] = useState<TahlilNatija | null>(null);
  const { toast } = useToast();

  const tahlilQilish = async () => {
    setYuklanyapti(true);
    try {
      const prompt = `Siz huquq sohasida mutaxassis ekspertsiz. Quyidagi kazus uchun o'quvchi javobi va to'g'ri javob berilgan.

Kazus:
${kazusMatni}

To'g'ri javob:
${togriJavob}

O'quvchi javobi:
${oquvchiJavobi}

Iltimos, o'quvchi javobini batafsil tahlil qiling va quyidagilarni aniqlang:

1. **Xato qismlar**: O'quvchi javobidagi mazmun jihatidan noto'g'ri, chalg'ituvchi yoki xato yozilgan qismlarni aniqlang. Har bir xato qism uchun to'g'ri variantni ham bering. Faqat jiddiy xatolarni ko'rsating (kichik uslubiy farqlarni e'tiborsiz qoldiring).

2. **Yetishmayotgan ma'lumotlar**: To'g'ri javobda bor, lekin o'quvchi javobida yozilmay qolgan muhim ma'lumotlar, faktlar, huquqiy asoslar yoki xulosalarni aniqlang.

MUHIM: Javobni faqat va faqat quyidagi JSON formatda bering (boshqa hech narsa yozmang):

{
  "xatolar": [
    {"xato": "o'quvchi yozgan xato matn", "togri": "to'g'ri yozilishi kerak bo'lgan variant"},
    {"xato": "...", "togri": "..."}
  ],
  "yetishmayotganlar": ["yetishmayotgan element 1", "yetishmayotgan element 2"]
}

Agar xatolar yoki yetishmayotgan ma'lumotlar bo'lmasa, bo'sh array qaytaring.`;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onspace-ai-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: 'gpt-4o',
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('AI tahlil xizmati javob bermadi');
      }

      const data = await response.json();
      const aiContent = data.choices[0].message.content;

      // JSON ni parse qilish
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI javobini parse qilishda xatolik');
      }

      const natija = JSON.parse(jsonMatch[0]) as TahlilNatija;
      setTahlil(natija);
    } catch (error: any) {
      console.error('Tahlil xatosi:', error);
      toast({
        title: 'Xato',
        description: error.message || 'Tahlil qilishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  // Javobni highlight qilib ko'rsatish
  const highlightedJavob = () => {
    if (!tahlil || tahlil.xatolar.length === 0) {
      return <p className="text-gray-700 leading-relaxed">{oquvchiJavobi}</p>;
    }

    let javob = oquvchiJavobi;
    const qismlar: JSX.Element[] = [];
    let oxirgiIndex = 0;

    // Xato qismlarni topish va highlight qilish
    tahlil.xatolar.forEach((xato, idx) => {
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

        // Xato qism (qizil, hover bilan)
        qismlar.push(
          <span
            key={`error-${idx}`}
            className="bg-red-100 text-red-700 px-1 rounded cursor-help border-b-2 border-red-400 relative group"
          >
            {javob.substring(xatoIndex, xatoIndex + xato.xato.length)}
            {/* Tooltip */}
            <span className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-green-700 text-white text-sm rounded-lg whitespace-nowrap shadow-lg z-10 animate-fade-in">
              ✓ To'g'ri: {xato.togri}
              <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-green-700"></span>
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

    return <p className="text-gray-700 leading-relaxed">{qismlar}</p>;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-[hsl(221,83%,53%)] animate-scale-in">
        <CardHeader className="bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(221,83%,43%)] text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Lightbulb className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">Batafsil tahlil</CardTitle>
            </div>
            <Button onClick={onClose} variant="secondary" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Kazus */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Kazus:
            </h3>
            <p className="text-blue-800 text-sm leading-relaxed">{kazusMatni}</p>
          </div>

          {/* To'g'ri javob */}
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              To'g'ri javob:
            </h3>
            <p className="text-green-800 text-sm leading-relaxed">{togriJavob}</p>
          </div>

          {/* O'quvchi javobi */}
          <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
            <h3 className="font-bold text-gray-900 mb-2">O'quvchi javobi:</h3>
            {tahlil ? (
              highlightedJavob()
            ) : (
              <p className="text-gray-700 text-sm leading-relaxed">{oquvchiJavobi}</p>
            )}
          </div>

          {/* Tahlil tugmasi */}
          {!tahlil && (
            <Button
              onClick={tahlilQilish}
              disabled={yuklanyapti}
              className="w-full"
              size="lg"
            >
              {yuklanyapti ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  AI tahlil qilyapti...
                </>
              ) : (
                <>
                  <Lightbulb className="h-5 w-5 mr-2" />
                  AI bilan batafsil tahlil qilish
                </>
              )}
            </Button>
          )}

          {/* Tahlil natijalari */}
          {tahlil && (
            <div className="space-y-4 animate-slide-in">
              {/* Xatolar */}
              {tahlil.xatolar.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Topilgan xatolar ({tahlil.xatolar.length})
                  </h3>
                  <div className="space-y-3">
                    {tahlil.xatolar.map((xato, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-red-200">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="text-red-700 font-medium">Xato:</span>{' '}
                              <span className="bg-red-100 text-red-800 px-1 rounded">{xato.xato}</span>
                            </p>
                            <p className="text-sm mt-1">
                              <span className="text-green-700 font-medium">To'g'ri:</span>{' '}
                              <span className="bg-green-100 text-green-800 px-1 rounded">{xato.togri}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-red-600 mt-3 italic">
                    💡 Yuqoridagi qizil ajratilgan qismlar ustiga sichqonchani olib boring - to'g'ri variant ko'rinadi
                  </p>
                </div>
              )}

              {/* Yetishmayotganlar */}
              {tahlil.yetishmayotganlar.length > 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Javobda yozilmay qolgan ({tahlil.yetishmayotganlar.length})
                  </h3>
                  <ul className="space-y-2">
                    {tahlil.yetishmayotganlar.map((element, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-white p-3 rounded border border-yellow-200">
                        <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded min-w-[24px] text-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-yellow-900">{element}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Agar xato va yetishmayotganlar bo'lmasa */}
              {tahlil.xatolar.length === 0 && tahlil.yetishmayotganlar.length === 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-3" />
                  <h3 className="font-bold text-green-900 text-xl mb-2">A'lo javob!</h3>
                  <p className="text-green-700">
                    Javobda jiddiy xatolar topilmadi va barcha muhim ma'lumotlar yoritilgan.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
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

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
