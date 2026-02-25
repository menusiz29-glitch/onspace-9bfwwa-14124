import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface KazusJavob {
  kazus: string;
  javob: string;
}

interface OquvchiJavob {
  kazus_index: number;
  javob: string;
}

interface XatoQism {
  xato: string;
  togri: string;
  tur: 'imlo' | 'mazmun';
}

interface BatafilTahlil {
  xatolar: XatoQism[];
  yetishmayotganlar: string[];
}

interface BahoNatija {
  kazus_index: number;
  ball: number;
  izoh: string;
  batafsil_tahlil: BatafilTahlil;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { toplam_kod, oquvchi_ismi, javoblar } = await req.json();

    if (!toplam_kod || !oquvchi_ismi || !javoblar) {
      return new Response(
        JSON.stringify({ error: 'Toplam kodi, ism va javoblar talab qilinadi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Toplamni olish
    const { data: toplam, error: toplamError } = await supabaseAdmin
      .from('toplamlar')
      .select('*')
      .eq('kod', toplam_kod)
      .single();

    if (toplamError || !toplam) {
      return new Response(
        JSON.stringify({ error: 'Toplam topilmadi' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Oldindan yuborgan yoki yo'qligini tekshirish
    const { data: mavjudJavob } = await supabaseAdmin
      .from('javoblar')
      .select('id')
      .eq('toplam_kod', toplam_kod)
      .eq('oquvchi_ismi', oquvchi_ismi)
      .single();

    if (mavjudJavob) {
      return new Response(
        JSON.stringify({ error: 'Siz allaqachon bu toplamni topshirgansiz' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const kazuslar = toplam.kazuslar as KazusJavob[];
    const oquvchiJavoblar = javoblar as OquvchiJavob[];

    // AI bilan baholash
    const bahoNatijalari: BahoNatija[] = [];
    
    for (const oquvchiJavob of oquvchiJavoblar) {
      const kazus = kazuslar[oquvchiJavob.kazus_index];
      
      if (!kazus) continue;

      const prompt = `Siz huquq sohasida QATTIQ baholovchi ekspertsiz. O'quvchi javobini TO'G'RI JAVOBGA QATTIQ SOLISHTIRING va MAZMUNAN TEKSHIRING.

KAZUS:
${kazus.kazus}

TO'G'RI JAVOB (ustoz yozgan - bu STANDART):
${kazus.javob}

O'QUVCHI JAVOBI:
${oquvchiJavob.javob}

QATTIQ BAHOLASH MEZONLARI:

1. MAZMUNAN TEKSHIRISH (eng muhim):
   - O'quvchi javobi to'g'ri javobdagi ASOSIY fikrlarni qamrab olganmi?
   - To'g'ri javobdagi muhim faktlar, huquqiy asoslar, qonun moddalari yozilganmi?
   - O'quvchi javobi to'g'ri javobga MAZMUNAN mos keladimi?
   - AGAR o'quvchi javobi to'g'ri javobdan BUTUNLAY farq qilsa yoki asosiy fikrlarni o'tkazib yuborgan bo'lsa - PAST BALL (1-10 ball)
   - AGAR o'quvchi noto'g'ri huquqiy asos, noto'g'ri qonun moddasi yoki butunlay noto'g'ri xulosalar bergan bo'lsa - PAST BALL (1-8 ball)

2. BALL BERISH QOIDALARI:
   - 25-30 ball: FAQAT to'g'ri javobga JUDA YAQINda, barcha asosiy nuqtalar mavjud, kichik kamchiliklar bo'lishi mumkin
   - 20-24 ball: To'g'ri javobning 70-80% qamrab olingan, ayrim muhim nuqtalar yetishmayapti
   - 15-19 ball: To'g'ri javobning 50-70% qamrab olingan, ko'plab muhim ma'lumotlar yetishmayapti
   - 10-14 ball: To'g'ri javobning 30-50% qamrab olingan, juda ko'p kamchiliklar
   - 1-9 ball: To'g'ri javobdan jiddiy farq qiladi, asosiy fikrlar yo'q yoki butunlay noto'g'ri

3. XATOLARNI ANIQLASH:
   - "imlo": faqat imlo, yozuv, grammatika xatolari
   - "mazmun": NOTO'G'RI faktlar, NOTO'G'RI huquqiy asoslar, NOTO'G'RI qonun moddalari, NOTO'G'RI xulosalar

4. YETISHMAYOTGANLARNI ANIQLASH:
   - To'g'ri javobda bor, lekin o'quvchi javobida yo'q bo'lgan MUHIM ma'lumotlarni sanang

MUHIM: Javobni FAQAT quyidagi JSON formatda bering (boshqa hech narsa yozmang):

{
  "ball": [1-30 orasida raqam],
  "izoh": "Qisqa izoh (2-3 jumla) - nima uchun bu ballni bergansiz",
  "xatolar": [
    {"xato": "xato matn", "togri": "to'g'ri variant", "tur": "imlo yoki mazmun"},
    {"xato": "...", "togri": "...", "tur": "..."}
  ],
  "yetishmayotganlar": ["yetishmayotgan element 1", "yetishmayotgan element 2"]
}

Agar xatolar yoki yetishmayotgan ma'lumotlar bo'lmasa, bo'sh array [] qaytaring.`;

      try {
        const aiResponse = await fetch(`${Deno.env.get('ONSPACE_AI_BASE_URL')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('ONSPACE_AI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (!aiResponse.ok) {
          console.error('AI xato:', await aiResponse.text());
          bahoNatijalari.push({
            kazus_index: oquvchiJavob.kazus_index,
            ball: 15,
            izoh: 'Baholashda texnik xatolik yuz berdi.',
            batafsil_tahlil: { xatolar: [], yetishmayotganlar: [] },
          });
          continue;
        }

        const aiData = await aiResponse.json();
        const aiText = aiData.choices[0]?.message?.content || '';

        // JSON ni parse qilish
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('AI JSON qaytarmadi:', aiText);
          bahoNatijalari.push({
            kazus_index: oquvchiJavob.kazus_index,
            ball: 15,
            izoh: 'Baholashda texnik xatolik yuz berdi.',
            batafsil_tahlil: { xatolar: [], yetishmayotganlar: [] },
          });
          continue;
        }

        const natija = JSON.parse(jsonMatch[0]);
        
        bahoNatijalari.push({
          kazus_index: oquvchiJavob.kazus_index,
          ball: Math.min(30, Math.max(1, natija.ball || 15)),
          izoh: natija.izoh || 'Javob baholandi.',
          batafsil_tahlil: {
            xatolar: natija.xatolar || [],
            yetishmayotganlar: natija.yetishmayotganlar || [],
          },
        });
      } catch (aiError) {
        console.error('AI baholash xatosi:', aiError);
        bahoNatijalari.push({
          kazus_index: oquvchiJavob.kazus_index,
          ball: 15,
          izoh: 'Baholashda xatolik yuz berdi.',
          batafsil_tahlil: { xatolar: [], yetishmayotganlar: [] },
        });
      }
    }

    // Natijani saqlash
    const { data: javobData, error: javobError } = await supabaseAdmin
      .from('javoblar')
      .insert({
        toplam_id: toplam.id,
        toplam_kod,
        oquvchi_ismi,
        javoblar: oquvchiJavoblar,
        baho: bahoNatijalari,
      })
      .select()
      .single();

    if (javobError) {
      console.error('Javob saqlash xatosi:', javobError);
      return new Response(
        JSON.stringify({ error: 'Javobni saqlashda xatolik' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, baho: bahoNatijalari }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Umumiy xato:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Server xatosi' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
