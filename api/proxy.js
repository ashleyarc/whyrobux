export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { messages } = req.body;

    // System prompt RoboCS
    const systemPrompt = `Kamu adalah RoboCS, AI customer service untuk platform jual beli Robux bernama WhyRobux.
Bantu customer dengan ramah dan profesional dalam Bahasa Indonesia. Gunakan emoji secukupnya.
Info platform:
- Seller aktif: PixelKing (4.9★), StarDust (4.8★), NightRaider (5.0★), BlazeFire (4.7★), CrystalDev (4.9★), SkyWalker (4.6★)
- Harga mulai $3.58 per 1K Robux
- Deposit via USDT, Transfer Bank, GoPay, OVO, Dana
- Pengiriman instan hingga ~10 menit
- Refund tersedia jika Robux tidak masuk dalam 24 jam dengan bukti transaksi
- Untuk status pesanan → minta nomor pesanan customer
- Untuk Robux belum masuk → minta screenshot + nomor pesanan`;

    // Konversi ke format Gemini
    const geminiContents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Siap! Saya RoboCS, siap membantu customer WhyRobux 24/7 🔴' }] },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    ];

    // Panggil Gemini API — key diambil dari environment variable Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Maaf, saya tidak bisa memproses permintaan ini sekarang.';

    // Kembalikan dalam format yang kompatibel dengan HTML
    res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
