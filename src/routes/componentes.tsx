import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, Eye, Gauge, Link2, Save, SlidersHorizontal } from "lucide-react";
import { Dashboard, Widget, useWidgetSpecs, WIDGET_SIZES_EVENT, WIDGET_SIZES_STORAGE_KEY, type WidgetPreview } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { beginSpotifyAuthorization, completeSpotifyAuthorization, readSpotifyConfig, saveSpotifyConfig, type SpotifyConfig } from "@/lib/spotify";

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
  const [savedId, setSavedId] = useState<string | null>(null);
  const [editingSize, setEditingSize] = useState<"width" | "height" | null>(null);
  const [exactValue, setExactValue] = useState("");
  const [spotifyDraft,setSpotifyDraft]=useState<SpotifyConfig>({clientId:"",redirectUri:""});
  const [spotifyMessage,setSpotifyMessage]=useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WIDGET_SIZES_STORAGE_KEY) ?? "{}") as Record<string, { width?: number; height?: number }>;
      setSizes(Object.fromEntries(specs.map((spec) => [spec.id, {
        width: saved[spec.id]?.width ?? spec.width,
        height: saved[spec.id]?.height ?? spec.height,
      }])));
    } catch { localStorage.removeItem(WIDGET_SIZES_STORAGE_KEY); }
  }, [specs]);
  useEffect(()=>{
    const stored=readSpotifyConfig();
    setSpotifyDraft({...stored,redirectUri:stored.redirectUri||`${window.location.origin}/componentes`});
    const params=new URLSearchParams(window.location.search),code=params.get("code"),state=params.get("state"),oauthError=params.get("error");
    if(oauthError){setSpotifyMessage("A autorização do Spotify foi cancelada.");window.history.replaceState({},"","/componentes");return}
    if(code&&state){void completeSpotifyAuthorization(code,state).then(()=>{setSpotifyDraft(readSpotifyConfig());setSpotifyMessage("Conta Spotify conectada.");window.history.replaceState({},"","/componentes")}).catch(error=>setSpotifyMessage(error instanceof Error?error.message:"Falha ao conectar o Spotify"))}
  },[]);

  if (!selected) return null;
  const size = sizes[selected.id] ?? { width: selected.width, height: selected.height };
  const updateSize = (key: "width" | "height", value: number) => {
    const limit = key === "width" ? [180, 900] : [140, 720];
    const next = Math.max(limit[0], Math.min(limit[1], value));
    setSizes((current) => ({ ...current, [selected.id]: { ...size, [key]: next } }));
    setSavedId(null);
  };
  const startExactEdit = (key: "width" | "height") => {
    setEditingSize(key);
    setExactValue(String(size[key]));
  };
  const finishExactEdit = () => {
    if (!editingSize) return;
    const parsed = Number(exactValue);
    if (Number.isFinite(parsed)) updateSize(editingSize, Math.round(parsed));
    setEditingSize(null);
  };
  const saveSize = () => {
    let stored: Record<string, { width: number; height: number }> = {};
    try { stored = JSON.parse(localStorage.getItem(WIDGET_SIZES_STORAGE_KEY) ?? "{}"); } catch { stored = {}; }
    localStorage.setItem(WIDGET_SIZES_STORAGE_KEY, JSON.stringify({ ...stored, [selected.id]: size }));
    window.dispatchEvent(new Event(WIDGET_SIZES_EVENT));
    setSavedId(selected.id);
  };
  const resizeSelected = (next: { width: number; height: number }) => {
    setSizes((current) => ({ ...current, [selected.id]: next }));
    setSavedId(null);
  };
  const saveSpotify=()=>{
    const clientId=spotifyDraft.clientId.trim(),redirectUri=spotifyDraft.redirectUri.trim();
    if(!/^[A-Za-z0-9]{16,64}$/.test(clientId)){setSpotifyMessage("Informe um Client ID válido do Spotify.");return}
    try { const url=new URL(redirectUri);if(url.protocol!=="https:"&&url.hostname!=="localhost")throw new Error(); } catch { setSpotifyMessage("Informe uma URI HTTPS válida (ou localhost).");return }
    saveSpotifyConfig({...readSpotifyConfig(),clientId,redirectUri});
    setSpotifyDraft(readSpotifyConfig());setSpotifyMessage("Configuração salva neste componente.");
  };
  const connectSpotify=async()=>{saveSpotify();const config={...readSpotifyConfig(),clientId:spotifyDraft.clientId.trim(),redirectUri:spotifyDraft.redirectUri.trim()};if(config.clientId&&config.redirectUri)await beginSpotifyAuthorization(config)};

  if (dashboardPreview) {
    return <Dashboard previewWidget={dashboardPreview} onPreviewResize={(next) => { setDashboardPreview((current) => current ? { ...current, ...next } : current); resizeSelected(next); }} onExitPreview={() => setDashboardPreview(null)} />;
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
            <div className="ml-auto flex items-center gap-4 rounded-xl border border-border bg-card p-3">
              <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
              <div className="grid w-48 gap-2"><div className="flex h-5 items-center justify-between"><Label htmlFor="component-width" className="text-[9px] text-muted-foreground">Largura</Label>{editingSize === "width" ? <Input aria-label="Valor exato da largura" autoFocus className="h-5 w-16 px-1.5 text-right text-[9px]" type="number" min={180} max={900} value={exactValue} onChange={(event) => setExactValue(event.target.value)} onFocus={(event) => event.currentTarget.select()} onBlur={finishExactEdit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setEditingSize(null); }} /> : <span className="cursor-text rounded px-1 text-[9px] font-semibold hover:bg-secondary" title="Clique duas vezes para digitar um valor exato" onDoubleClick={() => startExactEdit("width")}>{size.width}px</span>}</div><Slider id="component-width" min={180} max={900} step={6} value={[size.width]} onValueChange={([value]) => updateSize("width", value ?? size.width)} aria-label="Largura do componente" /></div>
              <div className="grid w-48 gap-2"><div className="flex h-5 items-center justify-between"><Label htmlFor="component-height" className="text-[9px] text-muted-foreground">Altura</Label>{editingSize === "height" ? <Input aria-label="Valor exato da altura" autoFocus className="h-5 w-16 px-1.5 text-right text-[9px]" type="number" min={140} max={720} value={exactValue} onChange={(event) => setExactValue(event.target.value)} onFocus={(event) => event.currentTarget.select()} onBlur={finishExactEdit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setEditingSize(null); }} /> : <span className="cursor-text rounded px-1 text-[9px] font-semibold hover:bg-secondary" title="Clique duas vezes para digitar um valor exato" onDoubleClick={() => startExactEdit("height")}>{size.height}px</span>}</div><Slider id="component-height" min={140} max={720} step={4} value={[size.height]} onValueChange={([value]) => updateSize("height", value ?? size.height)} aria-label="Altura do componente" /></div>
              <Button size="sm" variant={savedId === selected.id ? "secondary" : "default"} onClick={saveSize}>{savedId === selected.id ? <Check /> : <Save />}{savedId === selected.id ? "Salvo" : "Salvar alteração"}</Button>
            </div>
          </div>

          {selected.id==="spotify"&&<div className="mx-6 mt-5 grid grid-cols-[1fr_1fr_auto] items-end gap-3 rounded-xl border border-spotify/25 bg-spotify/5 p-4"><div className="grid gap-2"><Label htmlFor="spotify-client-id">Spotify Client ID</Label><Input id="spotify-client-id" maxLength={64} placeholder="Client ID do app no Spotify Developer Dashboard" value={spotifyDraft.clientId} onChange={event=>setSpotifyDraft(current=>({...current,clientId:event.target.value.replace(/[^A-Za-z0-9]/g,"")}))}/></div><div className="grid gap-2"><Label htmlFor="spotify-redirect-uri">Redirect URI</Label><Input id="spotify-redirect-uri" type="url" maxLength={300} value={spotifyDraft.redirectUri} onChange={event=>setSpotifyDraft(current=>({...current,redirectUri:event.target.value}))}/></div><div className="flex gap-2"><Button variant="outline" onClick={saveSpotify}><Save/>Salvar dados</Button><Button variant="spotify" onClick={()=>void connectSpotify()}><Link2/>{spotifyDraft.accessToken||spotifyDraft.refreshToken?"Reconectar":"Conectar Spotify"}</Button></div><p className="col-span-full text-[10px] text-muted-foreground">Cadastre exatamente esta Redirect URI no Spotify Developer Dashboard. Não é necessário Client Secret; a conexão usa OAuth PKCE. Os dados ficam em <b className="text-foreground">accusense-widget-config:spotify</b> no localStorage.</p>{spotifyMessage&&<p className="col-span-full text-[10px] text-spotify">{spotifyMessage}</p>}</div>}
          <div className="canvas relative min-h-[620px] overflow-auto p-12">
            <div className="relative mx-auto" style={{ width: size.width, height: size.height }}>
              <Widget spec={previewSpec} position={{ x: 0, y: 0 }} editable={false} resizable canvasWidth={900} canvasHeight={720} onDragEnd={() => undefined} onResize={resizeSelected} />
            </div>
            <p className="mt-6 text-center text-[10px] text-muted-foreground">O preview muda imediatamente. Clique em “Salvar alteração” para aplicar o tamanho em todos os dashboards.</p>
          </div>
        </section>
      </div>
    </main>
  );
}