// 이름(또는 id)으로 모양이 정해지는 일러스트 아바타. 실제 사진 대신 사용한다.

const BGS = ["#eef0ff", "#ffe6d5", "#e3f6e8", "#fff3d6", "#fde2ec", "#e0f2ff"];
const SHIRTS = ["#5b5bf0", "#ff8a3d", "#2fa36b", "#e0a800", "#e45a84", "#1f8fd6"];
const HAIRS = ["#2d2a3e", "#5a3b2e", "#1d1f2c", "#7a4a2a"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function Avatar({ seed, size = 52 }: { seed: string; size?: number }) {
  const h = hash(seed);
  const bg = BGS[h % BGS.length];
  const shirt = SHIRTS[(h >> 3) % SHIRTS.length];
  const hair = HAIRS[(h >> 6) % HAIRS.length];
  const style = (h >> 9) % 3; // 0: 짧은 머리, 1: 긴 머리, 2: 앞머리
  const glasses = (h >> 11) % 3 === 0;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label="프로필 이미지" style={{ borderRadius: "50%", flexShrink: 0 }}>
      <circle cx="40" cy="40" r="40" fill={bg} />
      {style === 1 && <path d="M18 40c0-18 10-28 22-28s22 10 22 28v26H18z" fill={hair} />}
      <path d="M12 80c0-16 12-24 28-24s28 8 28 24z" fill={shirt} />
      <rect x="34" y="46" width="12" height="12" rx="4" fill="#f6c9a4" />
      <circle cx="40" cy="36" r="17" fill="#ffd9b8" />
      {style === 0 && <path d="M23 34c0-12 7-19 17-19s17 7 17 19c-5-6-13-8-17-8s-12 2-17 8z" fill={hair} />}
      {style === 1 && <path d="M23 34c0-12 7-19 17-19s17 7 17 19c-6-3-12-9-15-13-3 5-11 11-19 13z" fill={hair} />}
      {style === 2 && <path d="M22 36c0-13 8-21 18-21s18 8 18 21c-4-2-6-6-7-9-6 5-18 7-29 9z" fill={hair} />}
      {glasses ? (
        <g stroke="#2d2a3e" strokeWidth="1.8" fill="none">
          <circle cx="33" cy="38" r="5" />
          <circle cx="47" cy="38" r="5" />
          <path d="M38 38h4" />
        </g>
      ) : (
        <>
          <circle cx="33" cy="38" r="2" fill="#2d2a3e" />
          <circle cx="47" cy="38" r="2" fill="#2d2a3e" />
        </>
      )}
      <path d="M35 45c3 3 7 3 10 0" stroke="#2d2a3e" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="29" cy="44" r="3" fill="#ffb3a0" opacity=".6" />
      <circle cx="51" cy="44" r="3" fill="#ffb3a0" opacity=".6" />
    </svg>
  );
}
