// 이름(또는 id)으로 모양이 정해지는 사람 아바타. 이미지는 /avatar/[seed] 에서 만든다.

export default function Avatar({ seed, size = 52 }: { seed: string; size?: number }) {
  return (
    <img
      src={`/avatar/${encodeURIComponent(seed)}`}
      width={size}
      height={size}
      alt="프로필 이미지"
      style={{ borderRadius: "50%", flexShrink: 0, display: "block", background: "#eef0ff" }}
    />
  );
}
