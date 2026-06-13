import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Eye, Gauge, SlidersHorizontal } from "lucide-react";
import { Dashboard, Widget, useWidgetSpecs, type WidgetPreview } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/componentes")({
  head: () => ({
    meta: [
      { title: "Componentes — Accusense Dev" },
      { name: "description", content: "Edite e pré-visualize os widgets do dashboard Accusense Dev." },
      { property: "og:title", content: "Componentes — Accusense Dev" },
      { property: "og:description", content: "Edite e pré-visualize os widgets do dashboard Accusense Dev." },
    ],
  }),
  component: ComponentsPage,
});

function ComponentsPage() {
  const specs = useWidgetSpecs();
  const [selectedId, setSelectedId] = useState(specs[0]?.id ?? "");
  const selected = specs.find((spec) => spec.id === selectedId) ?? specs[0];
  const [sizes, setSizes] = useState<Record<string, { width: number; height: number }>>(() =>
    Object.fromEntries(specs.map((spec) => [spec.id, { width: spec.width, height: spec.height }])),
  );
  const [dashboardPreview, setDashboardPreview] = useState<WidgetPreview | null>(null);

  if (!selected) return null;
  const size = sizes[selected.id] ?? { width: selected.width, height: selected.height };
  const updateSize = (key: "width" | "height", value: string) => {
    const limit = key === "width" ? [180, 900] : [140, 720];
    const parsed = Number(value);
    const next = Number.isFinite(parsed) ? Math.max(limit[0], Math.min(limit[1], parsed)) : limit[0];
    setSizes((current) => ({ ...current, [selected.id]: { ...size, [key]: next } }));
  };

  if (dashboardPreview) {
    return <Dashboard previewWidget={dashboardPreview} onExitPreview={() => setDashboardPreview(null)} />;
  }

  const previewSpec = { ...selected, width: size.width, height: size.height };
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-border bg-background/90 px-4 backdrop-blur-xl">
        <Button variant="ghost" size="sm" asChild><Link to="/"><ChevronLeft />Dashboard</Link></Button>
        <div className="ml-3 flex items-center gap-2 border-l border-border pl-4">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground"><Gauge className="size-4" /></span>
          <div><h1 className="text-sm font-bold">Componentes</h1><p className="text-[9px] text-muted-foreground">Editor de widgets</p></div>
        </div>
        <Button className="ml-auto" size="sm" onClick={() => setDashboardPreview({ id: selected.id, ...size })}><Eye />Ver no Dashboard</Button>
      </header>

      <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)] pt-14">
        <aside className="fixed bottom-0 left-0 top-14 w-[260px] overflow-y-auto border-r border-border bg-card/45 p-3">
          <div className="mb-3 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Todos os componentes</div>
          <nav className="space-y-1" aria-label="Lista de componentes">
            {specs.map((spec) => <Button key={spec.id} variant={spec.id === selected.id ? "secondary" : "ghost"} className={cn("h-11 w-full justify-start px-3", spec.id === selected.id && "text-primary")} onClick={() => setSelectedId(spec.id)}><span className="grid size-7 place-items-center rounded-md bg-primary/10">{spec.icon}</span><span className="truncate text-xs">{spec.title}</span></Button>)}
          </nav>
        </aside>

        <section className="col-start-2 grid min-h-[calc(100vh-3.5rem)] grid-rows-[auto_1fr]">
          <div className="flex items-center gap-3 border-b border-border bg-card/25 px-6 py-4">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">{selected.icon}</span>
            <div><h2 className="text-base font-bold">{selected.title}</h2><p className="text-[10px] text-muted-foreground">{size.width} × {size.height} px</p></div>
            <div className="ml-auto flex items-end gap-3 rounded-xl border border-border bg-card p-3">
              <SlidersHorizontal className="mb-2 size-4 text-muted-foreground" />
              <div className="grid gap-1"><Label htmlFor="component-width" className="text-[9px] text-muted-foreground">Largura</Label><Input id="component-width" className="w-24" type="number" min={180} max={900} value={size.width} onChange={(event) => updateSize("width", event.target.value)} /></div>
              <div className="grid gap-1"><Label htmlFor="component-height" className="text-[9px] text-muted-foreground">Altura</Label><Input id="component-height" className="w-24" type="number" min={140} max={720} value={size.height} onChange={(event) => updateSize("height", event.target.value)} /></div>
            </div>
          </div>

          <div className="canvas relative min-h-[620px] overflow-auto p-12">
            <div className="relative mx-auto" style={{ width: size.width, height: size.height }}>
              <Widget spec={previewSpec} position={{ x: 0, y: 0 }} editable={false} canvasWidth={size.width} canvasHeight={size.height} onDragEnd={() => undefined} />
            </div>
            <p className="mt-6 text-center text-[10px] text-muted-foreground">As alterações desta tela são temporárias e não modificam o dashboard original.</p>
          </div>
        </section>
      </div>
    </main>
  );
}