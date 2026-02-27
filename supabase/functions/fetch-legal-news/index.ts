import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface NewsItem {
  sarlavha: string;
  matn: string;
  rasm_url: string;
  manba: string;
  yangilik_url: string;
}

interface NewsAPIArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  source: {
    name: string;
  };
  publishedAt: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Huquq yangiliklarini NewsAPI dan olish boshlandi...');

    const NEWSAPI_KEY = Deno.env.get('NEWSAPI_KEY');
    if (!NEWSAPI_KEY) {
      throw new Error('NewsAPI key topilmadi');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // NewsAPI dan huquq yangiliklarini olish
    const searchQuery = 'law OR legal OR court OR justice OR "human rights" OR "international law" OR "criminal law"';
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWSAPI_KEY}`;

    console.log('NewsAPI ga so\'rov yuborilmoqda...');
    const newsApiResponse = await fetch(newsApiUrl);

    if (!newsApiResponse.ok) {
      const errorText = await newsApiResponse.text();
      console.error('NewsAPI xatosi:', errorText);
      throw new Error(`NewsAPI: ${newsApiResponse.status} - ${errorText}`);
    }

    const newsApiData = await newsApiResponse.json();
    console.log(`NewsAPI dan ${newsApiData.articles?.length || 0} ta yangilik olindi`);

    if (!newsApiData.articles || newsApiData.articles.length === 0) {
      throw new Error('NewsAPI dan yangiliklar topilmadi');
    }

    // Eng yaxshi 3 ta yangiliklarni tanlash
    const news: NewsItem[] = [];
    const articles = newsApiData.articles as NewsAPIArticle[];

    for (const article of articles) {
      if (news.length >= 3) break;

      // Faqat to'liq ma'lumotli yangiliklarni olish
      if (!article.title || !article.description || !article.url) {
        continue;
      }

      // Default rasm (agar yangilikda rasm bo'lmasa)
      const defaultImages = [
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&h=400&fit=crop',
      ];

      news.push({
        sarlavha: article.title.substring(0, 200),
        matn: article.description.substring(0, 500),
        rasm_url: article.urlToImage || defaultImages[news.length % 3],
        manba: article.source.name || 'International Legal News',
        yangilik_url: article.url,
      });
    }

    // Agar 3 tadan kam yangilik topilgan bo'lsa, default yangiliklarni qo'shish
    const defaultNews: NewsItem[] = [
      {
        sarlavha: 'International Court of Justice Recent Developments',
        matn: 'The International Court of Justice continues to deliver landmark judgments on international law, human rights, and state sovereignty issues affecting nations worldwide.',
        rasm_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop',
        manba: 'International Court of Justice',
        yangilik_url: 'https://www.icj-cij.org',
      },
      {
        sarlavha: 'European Court of Human Rights Latest Judgments',
        matn: 'The European Court of Human Rights continues to shape human rights law across Europe with important decisions on fundamental freedoms and civil liberties.',
        rasm_url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop',
        manba: 'European Court of Human Rights',
        yangilik_url: 'https://www.echr.coe.int',
      },
      {
        sarlavha: 'International Criminal Court Updates',
        matn: 'The International Criminal Court continues investigating and prosecuting individuals for genocide, crimes against humanity, and war crimes globally.',
        rasm_url: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&h=400&fit=crop',
        manba: 'International Criminal Court',
        yangilik_url: 'https://www.icc-cpi.int',
      },
    ];

    while (news.length < 3) {
      news.push(defaultNews[news.length]);
    }

    const finalNews = news.slice(0, 3);

    // Eski yangiliklarni o'chirish
    const { error: deleteError } = await supabaseAdmin
      .from('yangiliklar')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Eski yangiliklarni o\'chirishda xato:', deleteError);
    }

    // Yangi yangiliklarni qo'shish
    const { error: insertError } = await supabaseAdmin
      .from('yangiliklar')
      .insert(finalNews);

    if (insertError) {
      console.error('Yangi yangiliklarni qo\'shishda xato:', insertError);
      throw insertError;
    }

    console.log(`${finalNews.length} ta yangilik muvaffaqiyatli yangilandi (NewsAPI dan)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${finalNews.length} ta real huquq yangiligi yangilandi`,
        news: finalNews 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('NewsAPI: Yangiliklar yangilashda xato:', error);
    return new Response(
      JSON.stringify({ 
        error: `NewsAPI: ${error.message || 'Yangiliklar yangilashda xatolik'}`,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
