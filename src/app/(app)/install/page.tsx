import { PageLayout } from "@/components/ui/page-layout";
import { Monitor, Smartphone } from "lucide-react";

export default function InstallPage() {
  return (
    <PageLayout
      id="install-page"
      title="Install Application"
      subtitle="Get Started"
      description="ADD FIXIT TO YOUR DEVICE FOR QUICK ACCESS"
      bgSymbol="IN"
    >

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Monitor className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Desktop Installation</h2>
          </div>
          <p className="mb-4 text-muted-foreground">
            Install the app on your computer for a native-like experience.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Open the app in Chrome or Edge.</li>
            <li>
              Look for the{" "}
              <strong className="font-medium text-foreground">Install</strong>{" "}
              icon in the address bar (usually on the right).
            </li>
            <li>
              Click{" "}
              <strong className="font-medium text-foreground">Install</strong>{" "}
              and follow the prompts.
            </li>
            <li>
              Alternatively, click the browser menu (⋮) and select{" "}
              <strong className="font-medium text-foreground">
                Install FixIt
              </strong>
              .
            </li>
          </ol>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Smartphone className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Mobile Installation</h2>
          </div>
          <p className="mb-4 text-muted-foreground">
            Add to your home screen for quick access on the go.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">iOS (Safari)</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>
                  Tap the{" "}
                  <strong className="font-medium text-foreground">Share</strong>{" "}
                  button at the bottom.
                </li>
                <li>
                  Scroll down and tap{" "}
                  <strong className="font-medium text-foreground">
                    Add to Home Screen
                  </strong>
                  .
                </li>
                <li>
                  Tap{" "}
                  <strong className="font-medium text-foreground">Add</strong>{" "}
                  to confirm.
                </li>
              </ol>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Android (Chrome)</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>
                  Tap the{" "}
                  <strong className="font-medium text-foreground">Menu</strong>{" "}
                  button (⋮).
                </li>
                <li>
                  Tap{" "}
                  <strong className="font-medium text-foreground">
                    Install App
                  </strong>{" "}
                  or{" "}
                  <strong className="font-medium text-foreground">
                    Add to Home Screen
                  </strong>
                  .
                </li>
                <li>Follow the on-screen instructions.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
