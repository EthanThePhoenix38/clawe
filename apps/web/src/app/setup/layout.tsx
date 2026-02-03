import type { ReactNode } from "react";

export default function SetupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="from-background to-muted flex min-h-svh items-center justify-center bg-gradient-to-b p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
