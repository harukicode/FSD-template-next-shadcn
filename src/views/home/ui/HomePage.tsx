import { Header } from "@/widgets/header";

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Your App</h1>
          <p className="text-muted-foreground">Start building here.</p>
        </div>
      </main>
    </div>
  );
}
