export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let messages;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    messages = body.messages;
  } catch {
    return res.status(400).json({ errorMsg: '⚠️ 요청 형식이 잘못됐어요.' });
  }

  if (!messages) return res.status(400).json({ errorMsg: '⚠️ 메시지가 없어요.' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: '당신은 친절한 동아리 AI 어시스턴트입니다. 한국어로 친근하게 답변해주세요. 파일이 첨부된 경우 꼼꼼히 분석하고 핵심을 요약해주세요.',
        messages,
      }),
    });

    const data = await response.json();

    if (data.error) {
      const type = data.error.type;
      if (type === 'authentication_error') return res.status(200).json({ errorMsg: '❌ API 키가 잘못됐어요. 운영진에게 문의해주세요.' });
      if (type === 'billing_error') return res.status(200).json({ errorMsg: '💳 크레딧이 부족해요. 운영진에게 문의해주세요.' });
      if (type === 'rate_limit_error') return res.status(200).json({ errorMsg: '⏳ 요청이 너무 많아요. 잠깐 후 다시 시도해주세요.' });
      return res.status(200).json({ errorMsg: `⚠️ 오류: ${data.error.message}` });
    }

    res.status(200).json(data);
  } catch (e) {
    res.status(200).json({ errorMsg: '🔌 서버 연결 실패. 잠시 후 다시 시도해주세요.' });
  }
}
