import type { ReactNode } from "react";
import { OdooLayoutClient } from "./OdooLayoutClient";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <OdooLayoutClient>{children}</OdooLayoutClient>;
}
