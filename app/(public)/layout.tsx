import { AppShell } from "@/components/app-shell";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
