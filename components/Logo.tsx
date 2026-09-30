// Menco 로고: 말풍선 안의 두 점(멘토·멘티)이 이어진 마크 + 그라데이션 글자 + 작은 풀네임
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="menco-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b5bf0" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
      </defs>
      <path
        d="M16 3.5C9.1 3.5 3.5 8.3 3.5 14.3c0 3.3 1.7 6.2 4.5 8.2l-1.2 5.3 5.6-3c1.2.3 2.4.5 3.6.5 6.9 0 12.5-4.8 12.5-10.9S22.9 3.5 16 3.5Z"
        fill="url(#menco-grad)"
      />
      <path d="M11.6 14.3h8.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="11.2" cy="14.3" r="2.6" fill="#fff" />
      <circle cx="20.8" cy="14.3" r="2.6" fill="#fff" />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="brand">
      <LogoMark />
      <span className="brand-text">
        <span className="brand-name">Menco</span>
        <span className="brand-sub">Mentor Connector</span>
      </span>
    </span>
  );
}
