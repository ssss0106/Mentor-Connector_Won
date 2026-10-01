// 서버 전용: 운영자에게 알림 메시지를 보낸다.
// ALERT_WEBHOOK_URL(Slack 또는 Discord의 수신 웹훅 주소)이 없으면 아무것도 보내지 않는다.
// 알림 전송이 실패해도 요약 기능은 계속 동작해야 하므로 오류는 삼킨다.

export async function sendAlert(text: string): Promise<boolean> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return false;
  const discord = /discord(app)?\.com\/api\/webhooks\//.test(url);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discord ? { content: text.slice(0, 1900) } : { text }),
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
