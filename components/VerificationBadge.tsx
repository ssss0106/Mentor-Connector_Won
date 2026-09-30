import { ENROLLMENT_LABEL, VERIFICATION_LABEL } from "@/lib/data";
import type { VerificationStatus } from "@/lib/types";

// kind: "background" = 성범죄·아동학대 경력 조회, "enrollment" = 재학 인증
export default function VerificationBadge({
  status,
  kind = "background",
}: {
  status: VerificationStatus;
  kind?: "background" | "enrollment";
}) {
  const label = (kind === "enrollment" ? ENROLLMENT_LABEL : VERIFICATION_LABEL)[status];
  return (
    <span className={`badge verify-${status}`}>
      {status === "approved" ? "✓ " : ""}
      {label}
    </span>
  );
}
