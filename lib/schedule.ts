// 멘토의 주간 가능 시간표와 예약 가능한 실제 날짜·시간 계산.
// 시간표 한 칸 = 1시간, 키 형식은 "요일-시" (요일 0=월 … 6=일), 예: "1-19" = 화요일 19:00~20:00

export const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
export const HOURS = Array.from({ length: 14 }, (_, i) => i + 9); // 09:00 ~ 22:00 시작

export const slotKey = (day: number, hour: number) => `${day}-${hour}`;

export function parseSlot(key: string) {
  const [day, hour] = key.split("-").map(Number);
  return { day, hour };
}

export const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

// 시간표 → 매칭용 대략적인 시간대 ("평일 저녁" 등)
const BANDS: { label: string; weekend: boolean; from: number; to: number }[] = [
  { label: "평일 오후", weekend: false, from: 12, to: 17 },
  { label: "평일 저녁", weekend: false, from: 18, to: 22 },
  { label: "주말 오전", weekend: true, from: 9, to: 11 },
  { label: "주말 오후", weekend: true, from: 12, to: 17 },
  { label: "주말 저녁", weekend: true, from: 18, to: 22 },
];

export function slotsToBands(slots: string[]): string[] {
  const set = new Set<string>();
  for (const k of slots) {
    const { day, hour } = parseSlot(k);
    const band = BANDS.find((b) => b.weekend === day >= 5 && hour >= b.from && hour <= b.to);
    if (band) set.add(band.label);
  }
  return BANDS.map((b) => b.label).filter((l) => set.has(l));
}

// 시드 멘토용: 대략적인 시간대 → 예시 시간표
const BAND_SAMPLE: Record<string, string[]> = {
  "평일 오후": ["0-15", "0-16", "2-15", "2-16"],
  "평일 저녁": ["1-19", "1-20", "3-19", "3-20"],
  "주말 오전": ["5-10", "5-11"],
  "주말 오후": ["5-14", "5-15", "6-14", "6-15"],
  "주말 저녁": ["6-19", "6-20"],
};

export const sampleSlots = (bands: string[]) => bands.flatMap((b) => BAND_SAMPLE[b] ?? []);

// "화 19~21시, 토 14~16시" 처럼 요약
export function summarizeSlots(slots: string[]): string {
  const byDay = new Map<number, number[]>();
  for (const k of slots) {
    const { day, hour } = parseSlot(k);
    byDay.set(day, [...(byDay.get(day) ?? []), hour]);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, hours]) => {
      hours.sort((a, b) => a - b);
      const ranges: string[] = [];
      let start = hours[0];
      let prev = hours[0];
      for (const h of [...hours.slice(1), Infinity]) {
        if (h !== prev + 1) {
          ranges.push(`${start}~${prev + 1}시`);
          start = h;
        }
        prev = h;
      }
      return `${DAYS[day]} ${ranges.join(", ")}`;
    })
    .join(" · ");
}

// 로컬 날짜 → "YYYY-MM-DD"
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// JS getDay() (0=일) → 우리 요일 인덱스 (0=월)
const dayIndex = (d: Date) => (d.getDay() + 6) % 7;

export interface DaySlots {
  date: string; // YYYY-MM-DD
  label: string; // 10/14(화)
  hours: number[];
}

// 오늘부터 N일 동안, 시간표에 맞는 실제 예약 가능 시간 (지금부터 1시간 이내 시간은 제외)
export function upcomingSlots(slots: string[], days = 14, now = new Date()): DaySlots[] {
  const result: DaySlots[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const hours = slots
      .map(parseSlot)
      .filter((s) => s.day === dayIndex(d))
      .map((s) => s.hour)
      .filter((h) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h).getTime() > now.getTime() + 3600_000)
      .sort((a, b) => a - b);
    if (hours.length) result.push({ date: dateKey(d), label: `${d.getMonth() + 1}/${d.getDate()}(${DAYS[dayIndex(d)]})`, hours });
  }
  return result;
}

// 신청 일시 표시: "10/14(화) 19:00~20:00" (예전 형식 데이터는 그대로 표시)
export function formatSession(date: string, time: string) {
  const m = /^(\d{2}):00$/.exec(time);
  const d = new Date(`${date}T00:00:00`);
  if (!m || isNaN(d.getTime())) return `${date} · ${time}`;
  const h = Number(m[1]);
  return `${d.getMonth() + 1}/${d.getDate()}(${DAYS[dayIndex(d)]}) ${hourLabel(h)}~${hourLabel(h + 1)}`;
}
