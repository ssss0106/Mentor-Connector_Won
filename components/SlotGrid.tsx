"use client";

import { DAYS, HOURS, hourLabel, slotKey } from "@/lib/schedule";

interface Props {
  value: string[];
  onChange?: (v: string[]) => void; // 없으면 읽기 전용
}

// 요일 × 시간 주간 시간표. 칸을 눌러 가능한 시간을 켜고 끈다.
export default function SlotGrid({ value, onChange }: Props) {
  const toggle = (key: string) => {
    if (!onChange) return;
    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
  };

  return (
    <div className="slot-grid-wrap">
      <table className={`slot-grid ${onChange ? "" : "readonly"}`}>
        <thead>
          <tr>
            <th />
            {DAYS.map((d, i) => (
              <th key={d} className={i >= 5 ? "weekend" : ""}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((h) => (
            <tr key={h}>
              <th>{hourLabel(h)}</th>
              {DAYS.map((d, day) => {
                const key = slotKey(day, h);
                const on = value.includes(key);
                return (
                  <td key={key}>
                    <button
                      type="button"
                      className={`slot ${on ? "slot-on" : ""}`}
                      onClick={() => toggle(key)}
                      disabled={!onChange}
                      aria-label={`${d}요일 ${hourLabel(h)} ${on ? "가능" : "불가"}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
