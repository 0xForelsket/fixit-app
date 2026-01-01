import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center p-4">
      <EmptyState
        icon={WifiOff}
        title="You are offline"
        description="It seems you have lost your internet connection. Check your connection and try again."
        className="max-w-md"
      >
        <div className="mt-6 flex justify-center gap-4">
          <Button asChild onClick={() => window.location.reload()}>
            <span className="cursor-pointer">Retry</span>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </EmptyState>
    </div>
  );
}
