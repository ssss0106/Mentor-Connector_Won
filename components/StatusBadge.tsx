import { STATUS_LABEL } from "@/lib/data";
import type { RequestStatus } from "@/lib/types";

export default function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}
