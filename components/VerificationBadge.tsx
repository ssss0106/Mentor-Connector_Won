import { VERIFICATION_LABEL } from "@/lib/data";
import type { VerificationStatus } from "@/lib/types";

export default function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <span className={`badge verify-${status}`}>
      {status === "approved" ? "✓ " : ""}
      {VERIFICATION_LABEL[status]}
    </span>
  );
}
