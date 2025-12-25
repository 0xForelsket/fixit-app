export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">FixIt</h1>
        <p className="text-lg text-muted-foreground mb-8">
          CMMS Lite - Machine Maintenance Tracking
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </main>
  );
}
