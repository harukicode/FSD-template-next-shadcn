import { Header } from "@/widgets/header";
import { Counter } from "@/features/example-counter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@/shared/ui";

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">FSD Template</h1>
              <Badge>v0.1.0</Badge>
            </div>
            <p className="text-muted-foreground">
              A production-ready Next.js template following Feature-Sliced Design architecture.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Redux Counter</CardTitle>
                <CardDescription>
                  Example feature using Redux Toolkit slice. Demonstrates the features layer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Counter />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tech Stack</CardTitle>
                <CardDescription>Technologies used in this template</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    { name: "Next.js 14+", desc: "App Router, RSC" },
                    { name: "Redux Toolkit", desc: "Global state management" },
                    { name: "TanStack Query", desc: "Server state & caching" },
                    { name: "shadcn/ui", desc: "UI component system" },
                    { name: "TypeScript", desc: "Type safety" },
                    { name: "Tailwind CSS", desc: "Utility-first styling" },
                    { name: "Lucide Icons", desc: "Icon library" },
                  ].map((tech) => (
                    <li key={tech.name} className="flex items-center justify-between">
                      <span className="font-medium">{tech.name}</span>
                      <span className="text-muted-foreground">{tech.desc}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>FSD Architecture Layers</CardTitle>
              <CardDescription>Understanding the structure of this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {[
                  { layer: "app/", desc: "Providers, global styles, routing (Next.js App Router)" },
                  { layer: "pages/", desc: "Full page compositions assembled from lower layers" },
                  { layer: "widgets/", desc: "Complex independent UI sections (Header, Sidebar)" },
                  { layer: "features/", desc: "User interactions & business operations (auth, cart)" },
                  { layer: "entities/", desc: "Business entities: User, Product, Order" },
                  { layer: "shared/", desc: "Reusable infrastructure: UI kit, API, utils, store" },
                ].map(({ layer, desc }) => (
                  <div key={layer} className="flex gap-3">
                    <code className="min-w-[90px] font-mono text-xs text-primary">{layer}</code>
                    <span className="text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
