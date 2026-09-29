"use client";

interface Props {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
}

// 여러 개를 고를 수 있는 칩 버튼 그룹
export default function ChipSelect({ options, value, onChange, max }: Props) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else if (!max || value.length < max) onChange([...value, opt]);
  };
  return (
    <div className="chips">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          className={`chip ${value.includes(opt) ? "chip-on" : ""}`}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
