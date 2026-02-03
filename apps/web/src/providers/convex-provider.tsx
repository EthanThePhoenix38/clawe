"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { ConfigResponse } from "@/lib/config/types";

type ConvexState = "loading" | "needs-setup" | "ready" | "error";

export const ConvexClientProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<ConvexState>("loading");
  const [client, setClient] = useState<ConvexReactClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeConvex = async () => {
      try {
        const response = await fetch("/api/config");
        const data = (await response.json()) as ConfigResponse;

        if (!mounted) return;

        if (data.configured && data.config.convexUrl) {
          const convexClient = new ConvexReactClient(data.config.convexUrl);
          setClient(convexClient);
          setState("ready");
        } else {
          setState("needs-setup");
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load config");
        setState("error");
      }
    };

    initializeConvex();

    return () => {
      mounted = false;
    };
  }, []);

  // Setup pages don't need Convex context - render children directly
  if (pathname?.startsWith("/setup")) {
    // If Convex is ready and user is on setup, still provide context
    // so setup/complete can use Convex to mark onboarding complete
    if (client) {
      return <ConvexProvider client={client}>{children}</ConvexProvider>;
    }
    return <>{children}</>;
  }

  // Loading state
  if (state === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to initialize</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Needs Convex setup - redirect to welcome
  if (state === "needs-setup") {
    router.replace("/setup/welcome");
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground">Redirecting to setup...</div>
      </div>
    );
  }

  // Ready - provide Convex context
  return <ConvexProvider client={client!}>{children}</ConvexProvider>;
};
