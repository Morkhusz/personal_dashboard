import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  Bot, CheckCircle2, ChevronLeft, ChevronRight, CloudSun, Code2, Edit3, Gauge, GitPullRequest,
  Clock3, Grip, LayoutDashboard, Minus, PanelRight, Pause, Play, Plus, RefreshCcw, RotateCcw, Settings, SkipBack, SkipForward, Sparkles,
  Square, Star, StickyNote, Sun, Timer, Trash2, Users, Wind, X, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { githubFetch, GITHUB_WIDGET_EVENT, readGitHubConfig } from "@/lib/github";
import { readSpotifyConfig, spotifyFetch, SPOTIFY_WIDGET_EVENT } from "@/lib/spotify";

const CANVAS_WIDTH = 1524;
const CANVAS_HEIGHT = 792;
const LEGACY_STORAGE_KEY = "accusense-layout-v1";
const TABS_STORAGE_KEY = "accusense-dashboard-tabs-v1";
const HTML_TITLE_STORAGE_KEY = "accusense-html-title-v1";
const STICKY_NOTES_STORAGE_KEY = "accusense-sticky-notes-v1";
export const WIDGET_SIZES_STORAGE_KEY = "accusense-widget-sizes-v1";
export const WIDGET_SIZES_EVENT = "accusense-widget-sizes-updated";
const toneClasses = {
  blue: { bg: "bg-blue", stroke: "stroke-blue" }, green: { bg: "bg-green", stroke: "stroke-green" },
  amber: { bg: "bg-amber", stroke: "stroke-amber" }, red: { bg: "bg-red", stroke: "stroke-red" },
  purple: { bg: "bg-purple", stroke: "stroke-purple" },
} as const;

type Position = { x: number; y: number };
export type WidgetSpec = { id: string; title: string; icon: ReactNode; width: number; height: number; x: number; y: number; content: ReactNode };
export type WidgetPreview = { id: string; width: number; height: number };
type DashboardTab = { id: string; name: string; width: number; height: number; positions: Record<string, Position>; hiddenWidgets: string[] };
type StickyNoteItem = { id: string; x: number; y: number; text: string; alarmAt?: number; ringing?: boolean };

const pipelines = [
  ["polaris-api", "main", "2m atrás", "ok"],
  ["market-insights", "feat/charts", "6m atrás", "run"],
  ["tools-client", "develop", "18m atrás", "fail"],
  ["scrape-engine", "main", "34m atrás", "ok"],
] as const;

const jokes = [
  ["Programação", "Por que o programador saiu do emprego?", "Porque ele não recebeu arrays."],
  ["DevOps", "How many DevOps engineers does it take to change a lightbulb?", "None. That's a hardware problem."],
  ["SQL", "Um SELECT entra num bar e vê duas mesas.", "Ele pergunta: posso fazer um JOIN com vocês?"],
  ["Git", "Why did the commit cross the road?", "To get to the other branch."],
  ["CSS", "Qual é o elemento mais dramático do CSS?", "O overflow: ele nunca consegue conter as emoções."],
  ["JS", "Why was JavaScript sad?", "Because it didn't Node how to Express itself."],
  ["IA", "O modelo pediu férias.", "Disse que precisava reduzir a temperatura."],
  ["Programação", "There are 10 kinds of people in the world.", "Those who understand binary and those who don't."],
  ["Git", "Meu código funciona, mas não sei por quê.", "Commit: 'não tocar — magia comprovada'."],
  ["SQL", "Why do database admins dislike nature?", "It has too many natural joins."],
] as const;

function Ring({ value, color = "blue", size = 132, stroke = 6, children }: { value: number; color?: "blue" | "red" | "green"; size?: number; stroke?: number; children: ReactNode }) {
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} aria-hidden="true">
        <circle className="stroke-ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle className={cn("gauge-ring", toneClasses[color].stroke)} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

function MetricBar({ value, tone = "blue" }: { value: number; tone?: "blue" | "amber" | "red" | "green" | "purple" }) {
  return <div className="h-1 overflow-hidden rounded-full bg-track"><div className={cn("h-full rounded-full transition-all duration-700", toneClasses[tone].bg)} style={{ width: `${value}%` }} /></div>;
}

function GitHubKanban() {
  type GitHubIssue = { id:number;number:number;title:string;html_url:string;repository_url:string;user:{login:string}|null;labels:{name:string}[];pull_request?:unknown };
  const [items,setItems]=useState<GitHubIssue[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const load=async()=>{const config=readGitHubConfig();if(!config.token){setItems([]);return}setLoading(true);try{const repositories=config.repositories.split(",").map(repo=>repo.trim()).filter(Boolean);const paths=repositories.length?repositories.map(repo=>`/repos/${repo.includes("/")?repo:`${config.owner}/${repo}`}/issues?state=open&per_page=30`):[`/user/issues?filter=all&state=open&per_page=60`];const responses=await Promise.all(paths.map(path=>githubFetch(path,config.token)));const data=await Promise.all(responses.map(response=>response.json() as Promise<GitHubIssue[]>));setItems(data.flat().filter(item=>!item.pull_request));setError("")}catch(e){setError(e instanceof Error?e.message:"Erro no GitHub")}finally{setLoading(false)}};
  useEffect(()=>{void load();const id=window.setInterval(()=>void load(),60000);window.addEventListener(GITHUB_WIDGET_EVENT,load);return()=>{clearInterval(id);window.removeEventListener(GITHUB_WIDGET_EVENT,load)}},[]);
  const configured=Boolean(readGitHubConfig().token);
  if(!configured)return <div className="grid h-full place-items-center text-center"><div><GitPullRequest className="mx-auto size-9 text-primary"/><b className="mt-2 block text-sm">GitHub não configurado</b><span className="text-[9px] text-muted-foreground">Configure este widget em Componentes.</span></div></div>;
  const normalized=items.map(item=>[item.repository_url.split("/").pop()??"repo",`#${item.number}`,item.title,(item.user?.login??"GH").slice(0,2).toUpperCase(),item.html_url,item.labels.map(label=>label.name.toLowerCase())] as const);
  const columns = [
    ["Backlog", "green", normalized.filter(item=>!item[5].some(label=>label.includes("progress")||label.includes("review")||label.includes("done")))],
    ["Em progresso", "amber", normalized.filter(item=>item[5].some(label=>label.includes("progress")))],
    ["Revisando", "purple", normalized.filter(item=>item[5].some(label=>label.includes("review")))],
    ["Pronto", "amber", normalized.filter(item=>item[5].some(label=>label.includes("done")))],
  ] as const;
  return <div className="grid h-full grid-cols-4 gap-2">{columns.map(([name, tone, cards]) => <div className="min-w-0 overflow-hidden rounded-lg bg-secondary/45" key={name}>
    <div className="flex items-center gap-1.5 border-b border-border px-2 py-2 text-[10px] font-semibold"><span className={cn("h-1.5 w-1.5 rounded-full", toneClasses[tone].bg)} /> <span className="truncate">{name}</span><span className="ml-auto rounded-full bg-muted px-1.5 text-muted-foreground">{cards.length}</span></div>
    <div className="h-[280px] space-y-2 overflow-y-auto p-2">{cards.map(([repo, num, title, avatar, url]) => <a href={url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border bg-card p-2.5 transition hover:border-primary/60 hover:brightness-110" key={`${repo}-${num}`}>
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground"><Code2 className="size-3"/><span className="truncate">{repo}</span><span>{num}</span></div>
      <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-foreground">{title}</p>
      <span className="mt-2 grid size-5 place-items-center rounded-full bg-accent text-[8px] font-bold text-accent-foreground">{avatar}</span>
    </a>)}{!cards.length&&<p className="px-2 py-4 text-center text-[8px] text-muted-foreground">Nenhum item</p>}</div>
  </div>)}{(loading||error)&&<div className={cn("absolute bottom-2 left-3 right-3 rounded-md px-2 py-1 text-[8px]",error?"bg-red/10 text-red":"bg-secondary text-muted-foreground")}>{error||"Atualizando GitHub…"}</div>}</div>;
}

function SpotifyWidget() {
  type Track = { name:string;artists:{name:string}[];duration_ms:number;album?:{images?:{url:string}[]} };
  const [player,setPlayer]=useState<{is_playing:boolean;progress_ms:number;item:Track|null}|null>(null),[queue,setQueue]=useState<Track[]>([]),[error,setError]=useState("");
  const load=async()=>{if(!readSpotifyConfig().accessToken&&!readSpotifyConfig().refreshToken){setPlayer(null);return}try{const [current,queued]=await Promise.all([spotifyFetch("/me/player/currently-playing"),spotifyFetch("/me/player/queue")]);if(current.status===204){setPlayer(null)}else setPlayer(await current.json() as {is_playing:boolean;progress_ms:number;item:Track|null});setQueue((await queued.json() as {queue:Track[]}).queue.slice(0,5));setError("")}catch(e){setError(e instanceof Error?e.message:"Erro no Spotify")}};
  useEffect(()=>{void load();const id=window.setInterval(()=>void load(),15000);window.addEventListener(SPOTIFY_WIDGET_EVENT,load);return()=>{clearInterval(id);window.removeEventListener(SPOTIFY_WIDGET_EVENT,load)}},[]);
  const control=async(action:"previous"|"next"|"play"|"pause")=>{try{await spotifyFetch(`/me/player/${action}`,{method:action==="play"||action==="pause"?"PUT":"POST"});await load()}catch(e){setError(e instanceof Error?e.message:"Erro no Spotify")}};
  const track=player?.item, progress=track?Math.min(100,(player.progress_ms/track.duration_ms)*100):0, format=(ms:number)=>`${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,"0")}`;
  if(!readSpotifyConfig().clientId)return <div className="grid h-full place-items-center text-center"><div><div className="text-3xl">♫</div><b className="mt-2 block text-sm">Spotify não configurado</b><span className="text-[9px] text-muted-foreground">Configure este widget em Componentes.</span></div></div>;
  return <div className="flex h-full flex-col"><div className="flex gap-3"><div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-spotify/15 text-4xl">{track?.album?.images?.[0]?.url?<img src={track.album.images[0].url} alt={`Capa de ${track.name}`} className="size-full object-cover"/>:"♫"}</div><div className="min-w-0 pt-2"><div className="truncate text-sm font-bold">{track?.name??"Nada tocando"}</div><div className="truncate text-[10px] text-muted-foreground">{track?.artists.map(a=>a.name).join(", ")??"Abra o Spotify em um dispositivo"}</div><div className="mt-3 text-[9px] font-semibold text-spotify">{player?.is_playing?"PLAYING NOW":"PAUSADO"}</div></div></div>
    <div className="mt-3"><MetricBar value={progress} tone="green"/><div className="mt-1 flex justify-between text-[8px] text-muted-foreground"><span>{format(player?.progress_ms??0)}</span><span>{format(track?.duration_ms??0)}</span></div></div>
    <div className="flex items-center justify-center gap-2"><Button variant="ghost" size="icon" onClick={()=>void control("previous")} aria-label="Anterior"><SkipBack/></Button><Button variant="spotify" size="icon" onClick={()=>void control(player?.is_playing?"pause":"play")} aria-label={player?.is_playing?"Pausar":"Tocar"}>{player?.is_playing?<Pause/>:<Play/>}</Button><Button variant="ghost" size="icon" onClick={()=>void control("next")} aria-label="Próxima"><SkipForward/></Button></div>
    {error&&<div className="mb-1 rounded-md bg-red/10 px-2 py-1 text-[8px] text-red">{error}</div>}<div className="mt-2 min-h-0 flex-1 overflow-y-auto border-t border-border pt-2"><div className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Próximas</div>{queue.map((q,i)=><div className="grid grid-cols-[16px_1fr_auto] items-center gap-2 py-1 text-[9px]" key={`${q.name}-${i}`}><span className="text-muted-foreground">{i+1}</span><span className="truncate"><b>{q.name}</b> <span className="text-muted-foreground">· {q.artists.map(a=>a.name).join(", ")}</span></span><span className="text-muted-foreground">{format(q.duration_ms)}</span></div>)}</div>
  </div>;
}

function OpenAICosts() {
  return <div><div className="grid grid-cols-2 gap-3"><div><div className="text-[9px] text-muted-foreground">Hoje</div><div className="mt-1 text-xl font-bold text-green">$12,48</div></div><div><div className="flex justify-between text-[9px]"><span className="text-muted-foreground">Mês atual</span><span>42%</span></div><div className="mt-2"><MetricBar value={42} tone="amber"/></div><div className="mt-1 text-[9px] text-muted-foreground">$211 / $500</div></div></div>
    <div className="my-3 rounded-md border border-amber/25 bg-amber/10 px-2 py-1 text-[8px] text-amber">⚠ 42% do limite mensal utilizado</div>
    <div className="grid grid-cols-3 gap-2">{[["GPT-4o", "$176"], ["Embeddings", "$24"], ["Whisper", "$11"]].map(x => <div className="rounded-md bg-secondary px-2 py-1.5" key={x[0]}><div className="text-[8px] text-muted-foreground">{x[0]}</div><b className="text-[10px]">{x[1]}</b></div>)}</div></div>;
}

function AnthropicCosts() {
  return <div><div className="grid grid-cols-2 gap-3"><div><div className="text-[9px] text-muted-foreground">Hoje</div><div className="mt-1 text-xl font-bold text-purple">$9,82</div></div><div><div className="flex justify-between text-[9px]"><span className="text-muted-foreground">Mês atual</span><span>38%</span></div><div className="mt-2"><MetricBar value={38} tone="purple"/></div><div className="mt-1 text-[9px] text-muted-foreground">$189 / $500</div></div></div>
    <div className="my-3 rounded-md border border-purple/25 bg-purple/10 px-2 py-1 text-[8px] text-purple">38% do limite mensal utilizado</div>
    <div className="grid grid-cols-3 gap-2">{[["Sonnet", "$142"], ["Haiku", "$31"], ["Opus", "$16"]].map(x => <div className="rounded-md bg-secondary px-2 py-1.5" key={x[0]}><div className="text-[8px] text-muted-foreground">{x[0]}</div><b className="text-[10px]">{x[1]}</b></div>)}</div></div>;
}

function ClaudeUsage() {
  return <div><div className="absolute right-4 top-3 rounded-full bg-purple/15 px-2 py-1 text-[8px] text-purple">Sonnet 4.5</div>{[["Limite 5h", 67, "amber"], ["Limite semanal", 76, "red"]].map(([l, v, t]) => <div className="mb-3" key={l}><div className="mb-1.5 flex justify-between text-[9px]"><span className="text-muted-foreground">{l}</span><span>{v}%</span></div><MetricBar value={Number(v)} tone={t as "amber" | "red"}/></div>)}<div className="mt-4 grid grid-cols-3 gap-2">{[["tokens hoje", "184k"], ["custo mês", "$94"], ["mensagens", "218"]].map(x => <div className="rounded-md bg-secondary p-1.5 text-center" key={x[0]}><b className="block text-[10px]">{x[1]}</b><span className="text-[7px] text-muted-foreground">{x[0]}</span></div>)}</div></div>;
}

function Pipeline() { return <div className="space-y-1">{pipelines.map(([repo, branch, ago, status]) => <div className="grid grid-cols-[8px_1fr_auto] items-center gap-2 border-b border-border/70 py-1.5 last:border-0" key={repo}><span className={cn("size-2 rounded-full", status === "ok" ? "bg-green" : status === "fail" ? "bg-red" : "animate-pulse bg-amber")} /><div className="min-w-0"><b className="block truncate text-[9px]">{repo}</b><span className="text-[8px] text-muted-foreground">{branch}</span></div><span className="text-[8px] text-muted-foreground">{ago}</span></div>)}</div> }

function EnergyMeter() {
  const moods = [{e:"😴",l:"Exausto",v:1},{e:"😤",l:"Tenso",v:2},{e:"😐",l:"Estável",v:3},{e:"😊",l:"Bem",v:4},{e:"🔥",l:"No pique",v:5}];
  const [selected, setSelected] = useState(3); const mood = moods[selected];
  const history = [["Seg", 4, "😊", 12], ["Ter", 5, "🔥", 15], ["Qua", 3, "😐", 11], ["Qui", 4, "😊", 14], ["Hoje", mood.v, mood.e, 17]] as const;
  return <div className="flex h-full flex-col"><div className="text-center"><div className="text-5xl">{mood.e}</div><div className="mt-1 text-sm font-bold">{mood.l}</div><div className="text-[9px] text-muted-foreground">17 votos hoje</div></div><div className="my-3 flex justify-center gap-1">{moods.map((m,i)=><Button key={m.e} variant={i===selected?"secondary":"ghost"} size="iconSm" onClick={()=>setSelected(i)} aria-label={m.l}>{m.e}</Button>)}</div>
    <div className="space-y-2">{history.map(([day,val,emoji,votes])=><div className="grid grid-cols-[28px_1fr_18px_18px] items-center gap-1.5 text-[8px]" key={day}><span className="text-muted-foreground">{day}</span><MetricBar value={val*20} tone={val>=4?"green":val===3?"amber":"red"}/><span>{emoji}</span><span className="text-muted-foreground">{votes}</span></div>)}</div>
    <div className="mt-auto border-t border-border pt-3"><div className="flex -space-x-1">{["LC","MR","AV","TS","JP"].map(a=><span className="grid size-6 place-items-center rounded-full border border-card bg-secondary text-[7px] font-bold" key={a}>{a}</span>)}</div><div className="mt-2 text-[8px] text-muted-foreground">Próxima votação em <b className="text-foreground">2h 34m</b></div></div></div>;
}

function Pomodoro() {
  const modes = [{label:"Foco 25m", sec:1500, tone:"red" as const},{label:"Pausa 5m",sec:300,tone:"green" as const},{label:"Pausa 15m",sec:900,tone:"green" as const}];
  const [mode,setMode]=useState(0), [left,setLeft]=useState(1500), [running,setRunning]=useState(false), [session,setSession]=useState(2);
  useEffect(()=>{if(!running)return; const id=window.setInterval(()=>setLeft(v=>{if(v<=1){setRunning(false);setSession(s=>Math.min(4,s+1));return modes[mode].sec}return v-1}),1000);return()=>clearInterval(id)},[running,mode]);
  const switchMode=(i:number)=>{setMode(i);setLeft(modes[i].sec);setRunning(false)}; const pct=100-left/modes[mode].sec*100; const time=`${String(Math.floor(left/60)).padStart(2,"0")}:${String(left%60).padStart(2,"0")}`;
  return <div className="flex h-full flex-col"><div className="grid grid-cols-3 gap-1">{modes.map((m,i)=><Button variant={mode===i?"secondary":"ghost"} size="xs" key={m.label} onClick={()=>switchMode(i)}>{m.label}</Button>)}</div><div className="mx-auto my-4"><Ring value={pct} color={modes[mode].tone}><div><div className="text-3xl font-bold tracking-tight">{time}</div><div className="mt-1 text-[9px] text-muted-foreground">sessão {session} / 4</div></div></Ring></div>
    <div className="flex justify-center gap-2">{[1,2,3,4].map(n=><span key={n} className={cn("size-2 rounded-full",n<session?"bg-red":n===session?"animate-pulse bg-red":"bg-track")}/>)}</div><div className="mt-3 flex justify-center gap-2"><Button variant="focus" size="sm" onClick={()=>setRunning(v=>!v)}>{running?<Pause/>:<Play/>}{running?"Pausar":"Iniciar"}</Button><Button variant="outline" size="icon" onClick={()=>setLeft(0)} aria-label="Skip"><SkipForward/></Button><Button variant="outline" size="icon" onClick={()=>{setLeft(modes[mode].sec);setRunning(false)}} aria-label="Reset"><RotateCcw/></Button></div>
    <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3">{[["completas","6"],["tempo focado","2h 30m"],["meta diária","75%"]].map(x=><div className="text-center" key={x[0]}><b className="block text-[10px]">{x[1]}</b><span className="text-[7px] text-muted-foreground">{x[0]}</span></div>)}</div></div>;
}

function JokeWidget() {
  const [index,setIndex]=useState(0),[revealed,setRevealed]=useState(false),[rating,setRating]=useState(0); const joke=jokes[index];
  const move=(d:number)=>{setIndex(i=>(i+d+jokes.length)%jokes.length);setRevealed(false);setRating(0)};
  return <div className="flex h-full flex-col"><span className="w-fit rounded-full bg-primary/15 px-2 py-1 text-[8px] font-semibold text-primary">{joke[0]}</span><p className="mt-4 text-base font-semibold leading-6">{joke[1]}</p><div className="my-3 flex items-center gap-2 text-muted-foreground"><span className="h-px flex-1 bg-border"/><Sparkles className="size-3"/><span className="h-px flex-1 bg-border"/></div><div className="min-h-14"><p className={cn("text-sm leading-5 transition duration-300",revealed?"translate-y-0 opacity-100":"translate-y-1 opacity-0")}>{joke[2]}</p>{!revealed&&<Button variant="secondary" size="sm" onClick={()=>setRevealed(true)}>Ver resposta</Button>}</div>
    <div className="mt-auto flex items-center justify-between"><div className="flex">{[1,2,3,4,5].map(n=><Button variant="ghost" size="star" key={n} onClick={()=>setRating(n)} aria-label={`${n} stars`}><Star className={cn(n<=rating&&"fill-amber text-amber")}/></Button>)}</div><div className="flex gap-1"><Button variant="outline" size="iconSm" onClick={()=>move(-1)} aria-label="Previous"><ChevronLeft/></Button><Button variant="outline" size="iconSm" onClick={()=>move(1)} aria-label="Next"><ChevronRight/></Button></div></div></div>;
}

function YesNoWidget() {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const ask = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("https://yesno.wtf/api");
      if (!response.ok) throw new Error("Failed to fetch answer");
      const data = await response.json() as { answer?: string };
      if (data.answer !== "yes" && data.answer !== "no") throw new Error("Invalid answer");
      setAnswer(data.answer);
    } catch {
      setError(true);
      setAnswer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void ask(); }, []);

  return <div className="flex h-full items-center justify-between gap-4">
    <div className="flex min-w-0 items-center gap-3">
      <div className={cn("grid size-14 shrink-0 place-items-center rounded-full", answer === "yes" ? "bg-green/15 text-green" : answer === "no" ? "bg-red/15 text-red" : "bg-secondary text-muted-foreground")}>
        {loading ? <RefreshCcw className="size-6 animate-spin"/> : answer === "yes" ? <CheckCircle2 className="size-7"/> : answer === "no" ? <XCircle className="size-7"/> : <Sparkles className="size-6"/>}
      </div>
      <div className="min-w-0">
        <div className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">Resposta do universo</div>
        <div className={cn("mt-1 text-2xl font-black uppercase", answer === "yes" ? "text-green" : answer === "no" ? "text-red" : "text-foreground")}>
          {loading ? "Pensando…" : error ? "Tente outra vez" : answer === "yes" ? "Sim" : "Não"}
        </div>
      </div>
    </div>
    <Button variant="outline" size="icon" onClick={() => void ask()} disabled={loading} aria-label="Perguntar novamente"><RefreshCcw className={cn(loading && "animate-spin")}/></Button>
  </div>;
}

function Weather() { return <div className="flex h-full flex-col"><div className="flex items-start justify-between"><CloudSun className="size-9 text-amber"/><div className="text-right"><div className="text-3xl font-bold">24°</div><div className="text-[8px] text-muted-foreground">Parcialmente nublado</div></div></div><div className="mt-3 grid grid-cols-3 gap-1 text-center text-[8px] text-muted-foreground"><span>sens. 25°</span><span>💧 68%</span><span><Wind className="inline size-3"/> 9 km/h</span></div><div className="mt-auto grid grid-cols-3 border-t border-border pt-2 text-center text-[8px]">{[["Seg","☀️","26°"],["Ter","🌦️","22°"],["Qua","☁️","23°"]].map(d=><div key={d[0]}><span className="text-muted-foreground">{d[0]}</span><div>{d[1]}</div><b>{d[2]}</b></div>)}</div></div> }

function StickyNotes() {
  const [notes,setNotes]=useState<StickyNoteItem[]>([]),[editingId,setEditingId]=useState<string|null>(null),[alarmId,setAlarmId]=useState<string|null>(null),[minutes,setMinutes]=useState("5");
  const drag=useRef<{id:string;dx:number;dy:number}|null>(null),audio=useRef<AudioContext|null>(null),soundTimer=useRef<number|null>(null);
  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(STICKY_NOTES_STORAGE_KEY)??"[]") as StickyNoteItem[];setNotes(saved.map(note=>({...note,ringing:Boolean(note.ringing||(note.alarmAt&&note.alarmAt<=Date.now()))})))}catch{localStorage.removeItem(STICKY_NOTES_STORAGE_KEY)}},[]);
  useEffect(()=>{localStorage.setItem(STICKY_NOTES_STORAGE_KEY,JSON.stringify(notes))},[notes]);
  useEffect(()=>{const id=window.setInterval(()=>setNotes(current=>current.map(note=>note.alarmAt&&note.alarmAt<=Date.now()?{...note,ringing:true}:note)),500);return()=>clearInterval(id)},[]);
  const ringing=notes.some(note=>note.ringing);
  useEffect(()=>{const beep=()=>{try{const AudioContextClass=window.AudioContext;const context=audio.current??new AudioContextClass();audio.current=context;void context.resume();const oscillator=context.createOscillator(),gain=context.createGain();oscillator.frequency.value=880;gain.gain.setValueAtTime(.16,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.32);oscillator.connect(gain);gain.connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+.33)}catch{return}};if(ringing){beep();soundTimer.current=window.setInterval(beep,900)}return()=>{if(soundTimer.current!==null){clearInterval(soundTimer.current);soundTimer.current=null}}},[ringing]);
  const move=(event:ReactPointerEvent)=>{const active=drag.current;if(!active)return;setNotes(current=>current.map(note=>note.id===active.id?{...note,x:Math.max(0,Math.min(window.innerWidth-180,event.clientX-active.dx)),y:Math.max(48,Math.min(window.innerHeight-180,event.clientY-active.dy))}:note))};
  const stopDrag=()=>{drag.current=null};
  const create=(event:ReactPointerEvent)=>{const id=`sticky-${Date.now()}`,x=Math.max(0,event.clientX-90),y=Math.max(48,event.clientY-90);event.currentTarget.setPointerCapture(event.pointerId);drag.current={id,dx:90,dy:90};setNotes(current=>[...current,{id,x,y,text:""}])};
  const beginMove=(note:StickyNoteItem)=>(event:ReactPointerEvent)=>{if((event.target as HTMLElement).closest("button, textarea"))return;event.currentTarget.setPointerCapture(event.pointerId);drag.current={id:note.id,dx:event.clientX-note.x,dy:event.clientY-note.y}};
  const fontSize=(text:string)=>{const length=text.trim().length,words=text.trim().split(/\s+/).filter(Boolean).length;return Math.max(11,Math.min(25,25-Math.max(0,length-35)*.1-Math.max(0,words-7)*.35))};
  const setAlarm=()=>{if(!alarmId)return;const value=Number(minutes);if(!Number.isFinite(value)||value<=0)return;setNotes(current=>current.map(note=>note.id===alarmId?{...note,alarmAt:Date.now()+value*60000,ringing:false}:note));setAlarmId(null)};
  const stopAlarm=(id:string)=>setNotes(current=>current.map(note=>note.id===id?{...note,alarmAt:undefined,ringing:false}:note));
  return <><div className="fixed inset-0 z-40 pointer-events-none">{notes.map((note,index)=>{const remainingMinutes=note.alarmAt?Math.max(0,Math.ceil((note.alarmAt-Date.now())/60000)):null;return <article key={note.id} className={cn("pointer-events-auto fixed h-[180px] w-[180px] touch-none select-none border-2 bg-sticky text-sticky-foreground shadow-xl transition-[border-color,box-shadow]",note.ringing?"animate-pulse border-red shadow-glow-red":note.alarmAt?"border-green":"border-sticky/80")} style={{left:note.x,top:note.y,zIndex:41+index,transform:"rotate(-1deg)"}} onPointerDown={beginMove(note)} onPointerMove={move} onPointerUp={stopDrag} onDoubleClick={()=>setEditingId(note.id)}>
    <Button variant="ghost" size="iconSm" className="absolute right-1 top-1 z-10 text-sticky-foreground hover:bg-sticky-foreground/10" onClick={()=>setNotes(current=>current.filter(item=>item.id!==note.id))} aria-label="Apagar post-it"><X/></Button>
    <div className="absolute inset-x-3 bottom-9 top-3 overflow-y-auto whitespace-pre-wrap break-words pr-7 text-left font-semibold leading-tight" style={{fontSize:`${fontSize(note.text)}px`}}>{editingId===note.id?<Textarea autoFocus aria-label="Texto do post-it" className="h-full min-h-0 resize-none border-0 bg-transparent p-0 text-left text-inherit shadow-none focus-visible:ring-0" value={note.text} maxLength={500} onPointerDown={event=>event.stopPropagation()} onChange={event=>setNotes(current=>current.map(item=>item.id===note.id?{...item,text:event.target.value}:item))} onBlur={()=>setEditingId(null)}/>:note.text||<span className="flex h-full items-center justify-center text-center text-sm font-medium opacity-55">Clique duas vezes para escrever</span>}</div>
    <Button variant="ghost" size={note.alarmAt&&!note.ringing?"sm":"iconSm"} className={cn("absolute bottom-1 left-1/2 h-7 -translate-x-1/2 text-sticky-foreground hover:bg-sticky-foreground/10",note.alarmAt&&!note.ringing&&"gap-1 bg-sticky-foreground/10 px-2 text-[10px]")} onClick={()=>note.ringing?stopAlarm(note.id):(setAlarmId(note.id),setMinutes("5"))} aria-label={note.ringing?"Parar notificação":remainingMinutes!==null?`${remainingMinutes} minutos restantes — alterar notificação`:"Definir notificação"}>{note.ringing?<Square className="fill-current"/>:remainingMinutes!==null?<><Timer className="size-3.5"/><span>{remainingMinutes} min</span></>:<Clock3/>}</Button>
  </article>})}</div>
  <div className="fixed bottom-5 right-5 z-[46] h-24 w-24 cursor-grab touch-none select-none" onPointerDown={create} onPointerMove={move} onPointerUp={stopDrag} role="button" tabIndex={0} aria-label="Arraste para criar um post-it"><div className="absolute inset-1 translate-x-2 translate-y-2 rotate-3 border border-sticky-foreground/15 bg-sticky/70 shadow-lg"/><div className="absolute inset-1 translate-x-1 translate-y-1 rotate-1 border border-sticky-foreground/15 bg-sticky/85"/><div className="absolute inset-1 grid place-items-center border border-sticky-foreground/20 bg-sticky text-sticky-foreground shadow-xl"><StickyNote className="size-7"/><span className="absolute bottom-2 text-[8px] font-bold uppercase tracking-wider">Arraste</span></div></div>
  <Dialog open={alarmId!==null} onOpenChange={open=>{if(!open)setAlarmId(null)}}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>Lembrar deste post-it</DialogTitle><DialogDescription>Daqui a quantos minutos você quer ser notificado?</DialogDescription></DialogHeader><div className="grid gap-2"><Label htmlFor="sticky-minutes">Minutos</Label><Input id="sticky-minutes" autoFocus type="number" min={1} max={10080} value={minutes} onChange={event=>setMinutes(event.target.value)}/></div><DialogFooter><Button variant="outline" onClick={()=>setAlarmId(null)}>Cancelar</Button><Button onClick={setAlarm}><Clock3/>Ativar lembrete</Button></DialogFooter></DialogContent></Dialog></>;
}

export function Widget({ spec, position, editable, resizable = false, canvasWidth, canvasHeight, preview = false, onDragEnd, onResize }: { spec: WidgetSpec; position: Position; editable: boolean; resizable?: boolean; canvasWidth: number; canvasHeight: number; preview?: boolean; onDragEnd: (id: string, p: Position) => void; onResize?: (size: { width: number; height: number }) => void }) {
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null); const [temp,setTemp]=useState<Position|null>(null);
  const resize=useRef<{sx:number;sy:number;width:number;height:number;axis:"x"|"y"|"both"}|null>(null);
  const onPointerDown=(e:ReactPointerEvent)=>{if(!editable)return; e.currentTarget.setPointerCapture(e.pointerId); drag.current={sx:e.clientX,sy:e.clientY,ox:position.x,oy:position.y};};
  const onPointerMove=(e:ReactPointerEvent)=>{if(!drag.current)return; setTemp({x:Math.max(0,Math.min(canvasWidth-spec.width,drag.current.ox+e.clientX-drag.current.sx)),y:Math.max(0,Math.min(canvasHeight-spec.height,drag.current.oy+e.clientY-drag.current.sy))})};
  const onPointerUp=()=>{if(!drag.current)return; const p=temp??position; const placed={x:Math.max(0,Math.min(canvasWidth-spec.width,Math.round(p.x))),y:Math.max(0,Math.min(canvasHeight-spec.height,Math.round(p.y)))};drag.current=null;setTemp(null);onDragEnd(spec.id,placed)};
  const startResize=(axis:"x"|"y"|"both")=>(e:ReactPointerEvent)=>{e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);resize.current={sx:e.clientX,sy:e.clientY,width:spec.width,height:spec.height,axis}};
  const moveResize=(e:ReactPointerEvent)=>{if(!resize.current||!onResize)return;const {sx,sy,width,height,axis}=resize.current;onResize({width:axis==="y"?width:Math.max(180,Math.min(900,Math.round(width+e.clientX-sx))),height:axis==="x"?height:Math.max(140,Math.min(720,Math.round(height+e.clientY-sy)))})};
  const stopResize=(e:ReactPointerEvent)=>{if(!resize.current)return;e.stopPropagation();resize.current=null};
  const p=temp??position;
  return <article className={cn("widget absolute flex flex-col",editable&&"widget-editing",preview&&"z-30 ring-2 ring-primary/60")} style={{width:spec.width,height:spec.height,transform:`translate3d(${p.x}px, ${p.y}px, 0)`}}><header className={cn("flex h-9 shrink-0 items-center gap-2 border-b border-border px-3",editable&&"cursor-grab select-none active:cursor-grabbing")} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}><span className="text-primary">{spec.icon}</span><h2 className="text-[10px] font-bold uppercase tracking-[0.14em]">{spec.title}</h2>{preview&&<span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider text-primary">Preview</span>}{editable&&<Grip className={cn("size-3 text-muted-foreground",!preview&&"ml-auto")}/>}</header><div className="min-h-0 flex-1 p-3">{spec.content}</div>{resizable&&<><div role="separator" aria-orientation="vertical" aria-label="Redimensionar largura" className="absolute bottom-2 right-0 top-9 z-40 w-2 cursor-ew-resize touch-none" onPointerDown={startResize("x")} onPointerMove={moveResize} onPointerUp={stopResize}/><div role="separator" aria-orientation="horizontal" aria-label="Redimensionar altura" className="absolute bottom-0 left-2 right-2 z-40 h-2 cursor-ns-resize touch-none" onPointerDown={startResize("y")} onPointerMove={moveResize} onPointerUp={stopResize}/><div role="separator" aria-label="Redimensionar componente" className="absolute bottom-0 right-0 z-50 size-4 cursor-nwse-resize touch-none rounded-tl-md border-l border-t border-primary/70 bg-primary/20" onPointerDown={startResize("both")} onPointerMove={moveResize} onPointerUp={stopResize}/></>}</article>;
}

export function useWidgetSpecs() {
  const defaults = useMemo<WidgetSpec[]>(()=>[
    {id:"kanban",title:"GitHub Kanban",icon:<GitPullRequest className="size-3.5"/>,width:540,height:372,x:0,y:0,content:<GitHubKanban/>},
    {id:"spotify",title:"Spotify Now Playing",icon:<Play className="size-3.5"/>,width:282,height:372,x:576,y:0,content:<SpotifyWidget/>},
    {id:"openai",title:"OpenAI Costs",icon:<Bot className="size-3.5"/>,width:282,height:180,x:960,y:0,content:<OpenAICosts/>},
    {id:"claude",title:"Claude Usage",icon:<Gauge className="size-3.5"/>,width:282,height:180,x:960,y:192,content:<ClaudeUsage/>},
    {id:"anthropic",title:"Anthropic Costs",icon:<Bot className="size-3.5"/>,width:282,height:180,x:1242,y:192,content:<AnthropicCosts/>},
    {id:"weather",title:"São Paulo",icon:<Sun className="size-3.5"/>,width:180,height:180,x:1344,y:0,content:<Weather/>},
    {id:"energy",title:"Team Energy Meter",icon:<Users className="size-3.5"/>,width:282,height:372,x:0,y:420,content:<EnergyMeter/>},
    {id:"pomodoro",title:"Pomodoro Timer",icon:<Timer className="size-3.5"/>,width:282,height:372,x:384,y:420,content:<Pomodoro/>},
    {id:"joke",title:"Joke of the Day",icon:<Sparkles className="size-3.5"/>,width:372,height:282,x:768,y:420,content:<JokeWidget/>},
    {id:"pipeline",title:"CI/CD Pipeline",icon:<Code2 className="size-3.5"/>,width:372,height:180,x:1152,y:420,content:<Pipeline/>},
    {id:"yesno",title:"Sim ou Não",icon:<Sparkles className="size-3.5"/>,width:282,height:180,x:1242,y:612,content:<YesNoWidget/>},
  ],[]);
  const [specs,setSpecs]=useState(defaults);
  useEffect(()=>{
    const loadSizes=()=>{
      try {
        const saved=JSON.parse(localStorage.getItem(WIDGET_SIZES_STORAGE_KEY)??"{}") as Record<string,{width?:number;height?:number}>;
        setSpecs(defaults.map(spec=>{
          const size=saved[spec.id];
          return size?{...spec,width:Math.max(180,Math.min(900,Number(size.width)||spec.width)),height:Math.max(140,Math.min(720,Number(size.height)||spec.height))}:spec;
        }));
      } catch { localStorage.removeItem(WIDGET_SIZES_STORAGE_KEY);setSpecs(defaults); }
    };
    loadSizes();
    window.addEventListener("storage",loadSizes);
    window.addEventListener(WIDGET_SIZES_EVENT,loadSizes);
    return()=>{window.removeEventListener("storage",loadSizes);window.removeEventListener(WIDGET_SIZES_EVENT,loadSizes)};
  },[defaults]);
  return specs;
}

export function Dashboard({ previewWidget, onExitPreview, onPreviewResize }: { previewWidget?: WidgetPreview; onExitPreview?: () => void; onPreviewResize?: (size: { width: number; height: number }) => void } = {}) {
  const [clock,setClock]=useState(""),[editable,setEditable]=useState(false),[hydrated,setHydrated]=useState(false);
  const [configOpen,setConfigOpen]=useState(false),[htmlTitle,setHtmlTitle]=useState("Accusense Dev — Engineering Command Center");
  const [configDraft,setConfigDraft]=useState({name:"Accusense Dev",htmlTitle:"Accusense Dev — Engineering Command Center",width:String(CANVAS_WIDTH),height:String(CANVAS_HEIGHT)});
  const specs = useWidgetSpecs();
  const [previewPosition,setPreviewPosition]=useState<Position>({x:80,y:80});
  const previewSpec=previewWidget?specs.find(spec=>spec.id===previewWidget.id):undefined;
  const defaults=useMemo(()=>Object.fromEntries(specs.map(s=>[s.id,{x:s.x,y:s.y}])),[specs]);
  const [tabs,setTabs]=useState<DashboardTab[]>([{id:"main",name:"Accusense Dev",width:CANVAS_WIDTH,height:CANVAS_HEIGHT,positions:defaults,hiddenWidgets:[]}]);
  const [activeTabId,setActiveTabId]=useState("main");
  const activeTab=tabs.find(tab=>tab.id===activeTabId)??tabs[0];
  useEffect(()=>{
    const savedTabs=localStorage.getItem(TABS_STORAGE_KEY);
    if(savedTabs){
      try {
        const parsed=JSON.parse(savedTabs) as {tabs?:DashboardTab[];activeTabId?:string};
        if(parsed.tabs?.length){setTabs(parsed.tabs.map(tab=>({...tab,width:tab.width??CANVAS_WIDTH,height:tab.height??CANVAS_HEIGHT,positions:{...defaults,...tab.positions},hiddenWidgets:tab.hiddenWidgets??[]})));setActiveTabId(parsed.tabs.some(tab=>tab.id===parsed.activeTabId)?parsed.activeTabId??parsed.tabs[0].id:parsed.tabs[0].id)}
      } catch { localStorage.removeItem(TABS_STORAGE_KEY); }
    } else {
      const legacy=localStorage.getItem(LEGACY_STORAGE_KEY);
      if(legacy){try{setTabs([{id:"main",name:"Accusense Dev",width:CANVAS_WIDTH,height:CANVAS_HEIGHT,positions:{...defaults,...JSON.parse(legacy)},hiddenWidgets:[]}])}catch{localStorage.removeItem(LEGACY_STORAGE_KEY)}}
    }
    const savedHtmlTitle=localStorage.getItem(HTML_TITLE_STORAGE_KEY);if(savedHtmlTitle)setHtmlTitle(savedHtmlTitle);
    setHydrated(true);
  },[defaults]);
  useEffect(()=>{if(hydrated)localStorage.setItem(TABS_STORAGE_KEY,JSON.stringify({tabs,activeTabId}))},[tabs,activeTabId,hydrated]);
  useEffect(()=>{document.title=htmlTitle;if(hydrated)localStorage.setItem(HTML_TITLE_STORAGE_KEY,htmlTitle)},[htmlTitle,hydrated]);
  useEffect(()=>{const tick=()=>setClock(new Intl.DateTimeFormat("pt-BR",{weekday:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date()));tick();const id=window.setInterval(tick,1000);return()=>clearInterval(id)},[]);
  const move=(id:string,p:Position)=>setTabs(old=>old.map(tab=>tab.id===activeTabId?{...tab,positions:{...tab.positions,[id]:p}}:tab));
  const reset=()=>setTabs(old=>old.map(tab=>tab.id===activeTabId?{...tab,positions:defaults}:tab));
  const addTab=()=>{const id=`dashboard-${Date.now()}`;const tab:DashboardTab={id,name:`Dashboard ${tabs.length+1}`,width:CANVAS_WIDTH,height:CANVAS_HEIGHT,positions:{...defaults},hiddenWidgets:[]};setTabs(old=>[...old,tab]);setActiveTabId(id);setEditable(false)};
  const renameTab=(tab:DashboardTab)=>{const name=window.prompt("Nome do dashboard",tab.name)?.trim();if(name)setTabs(old=>old.map(item=>item.id===tab.id?{...item,name:name.slice(0,28)}:item))};
  const removeTab=(id:string)=>{if(tabs.length===1)return;const index=tabs.findIndex(tab=>tab.id===id);const next=tabs.filter(tab=>tab.id!==id);setTabs(next);if(activeTabId===id)setActiveTabId(next[Math.max(0,index-1)].id)};
  const toggleWidget=(id:string)=>setTabs(old=>old.map(tab=>tab.id===activeTabId?{...tab,hiddenWidgets:tab.hiddenWidgets.includes(id)?tab.hiddenWidgets.filter(widgetId=>widgetId!==id):[...tab.hiddenWidgets,id]}:tab));
  const openConfig=()=>{if(!activeTab)return;setConfigDraft({name:activeTab.name,htmlTitle,width:String(activeTab.width),height:String(activeTab.height)});setConfigOpen(true)};
  const saveConfig=()=>{if(!activeTab)return;const width=Math.max(600,Math.min(4000,Number(configDraft.width)||CANVAS_WIDTH));const height=Math.max(400,Math.min(3000,Number(configDraft.height)||CANVAS_HEIGHT));const name=configDraft.name.trim().slice(0,40)||"Dashboard";const nextHtmlTitle=configDraft.htmlTitle.trim().slice(0,60)||"Accusense Dev";setTabs(old=>old.map(tab=>tab.id===activeTabId?{...tab,name,width,height}:tab));setHtmlTitle(nextHtmlTitle);setConfigOpen(false)};
  return <main className="min-h-screen bg-background text-foreground"><nav className="fixed inset-x-0 top-0 z-50 h-12 border-b border-border bg-background/90 backdrop-blur-xl"><div className="grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:flex"><div className="flex min-w-0 items-center gap-2"><div className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Gauge className="size-4"/></div><div className="truncate text-sm font-bold tracking-tight">{activeTab?.name??"Accusense Dev"}</div></div><div className="flex shrink-0 items-center gap-1.5 sm:ml-auto">{previewWidget?<Button variant="secondary" size="sm" onClick={onExitPreview}><ChevronLeft/>Voltar aos componentes</Button>:<><Button variant={editable?"secondary":"ghost"} size="sm" onClick={()=>setEditable(v=>!v)}><Edit3/><span className="hidden sm:inline">{editable?"Concluir":"Editar layout"}</span></Button><Dialog open={configOpen} onOpenChange={setConfigOpen}><DialogTrigger asChild><Button variant="ghost" size="sm" onClick={openConfig}><Settings/><span className="hidden sm:inline">Config</span></Button></DialogTrigger><DialogContent className="border-border bg-card sm:max-w-md"><DialogHeader><DialogTitle>Configurar dashboard</DialogTitle><DialogDescription>Defina o espaço de trabalho e os títulos exibidos.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="grid gap-2"><Label htmlFor="dashboard-title">Título do dashboard</Label><Input id="dashboard-title" maxLength={40} value={configDraft.name} onChange={e=>setConfigDraft(d=>({...d,name:e.target.value}))}/></div><div className="grid gap-2"><Label htmlFor="html-title">Título do HTML</Label><Input id="html-title" maxLength={60} value={configDraft.htmlTitle} onChange={e=>setConfigDraft(d=>({...d,htmlTitle:e.target.value}))}/></div><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label htmlFor="dashboard-width">Width</Label><Input id="dashboard-width" type="number" min={600} max={4000} value={configDraft.width} onChange={e=>setConfigDraft(d=>({...d,width:e.target.value}))}/></div><div className="grid gap-2"><Label htmlFor="dashboard-height">Height</Label><Input id="dashboard-height" type="number" min={400} max={3000} value={configDraft.height} onChange={e=>setConfigDraft(d=>({...d,height:e.target.value}))}/></div></div><p className="text-[11px] text-muted-foreground">Limites: 600–4000 px de largura e 400–3000 px de altura.</p></div><DialogFooter><Button variant="outline" asChild><Link to="/componentes" onClick={()=>setConfigOpen(false)}><LayoutDashboard/>Componentes</Link></Button><Button variant="outline" onClick={()=>setConfigOpen(false)}>Cancelar</Button><Button onClick={saveConfig}>Salvar</Button></DialogFooter></DialogContent></Dialog><Button variant="ghost" size="sm" onClick={reset}><RefreshCcw/><span className="hidden md:inline">Resetar</span></Button></>}<div className="hidden border-l border-border pl-3 font-mono text-[10px] text-muted-foreground lg:block">{clock}</div><div className="ml-1 flex items-center gap-2 rounded-full bg-green/10 px-2.5 py-1 text-[9px] font-semibold text-green"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-60"/><span className="relative inline-flex size-2 rounded-full bg-green"/></span>3 services live</div></div></div></nav>
    <section className="pb-24 pt-12"><div className="overflow-auto p-3"><div className="canvas relative mx-auto" style={{width:activeTab?.width??CANVAS_WIDTH,height:activeTab?.height??CANVAS_HEIGHT}}>{activeTab&&specs.filter(s=>!activeTab.hiddenWidgets.includes(s.id)).map(s=><Widget key={`${activeTab.id}-${s.id}`} spec={s} position={activeTab.positions[s.id]??{x:s.x,y:s.y}} editable={editable} canvasWidth={activeTab.width} canvasHeight={activeTab.height} onDragEnd={move}/>)}{activeTab&&previewSpec&&previewWidget&&<Widget spec={{...previewSpec,width:previewWidget.width,height:previewWidget.height}} position={previewPosition} editable resizable preview canvasWidth={activeTab.width} canvasHeight={activeTab.height} onDragEnd={(_,position)=>setPreviewPosition(position)} onResize={onPreviewResize}/>}</div></div></section>
    {!previewWidget&&<Sheet><SheetTrigger asChild><Button title="Gerenciar widgets" variant="secondary" size="icon" className="fixed right-4 top-1/2 z-40 size-11 -translate-y-1/2 rounded-full shadow-xl" aria-label="Gerenciar widgets"><PanelRight className="size-5"/></Button></SheetTrigger><SheetContent className="w-[360px] border-border bg-card p-0 sm:max-w-[360px]"><SheetHeader className="border-b border-border p-5"><SheetTitle>Widgets</SheetTitle><SheetDescription>Adicione ou remova widgets do dashboard <b className="text-foreground">{activeTab?.name}</b>.</SheetDescription></SheetHeader><div className="space-y-2 p-4">{specs.map(spec=>{const visible=activeTab&&!activeTab.hiddenWidgets.includes(spec.id);return <div key={spec.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{spec.icon}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{spec.title}</div><div className="text-[10px] text-muted-foreground">{visible?"Visível no dashboard":"Não adicionado"}</div></div><Button variant={visible?"outline":"default"} size="sm" onClick={()=>toggleWidget(spec.id)}>{visible?<><Minus/>Remover</>:<><Plus/>Adicionar</>}</Button></div>})}</div></SheetContent></Sheet>}
    {!previewWidget&&<><StickyNotes/><nav aria-label="Dashboards" className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none"><div className="dashboard-dock pointer-events-auto flex max-w-full items-end gap-1 overflow-x-auto rounded-2xl border border-border bg-card/85 p-1.5 shadow-2xl backdrop-blur-2xl">{tabs.map(tab=><div key={tab.id} className="group relative flex shrink-0 items-center"><Button title={`${tab.name} — duplo clique para renomear`} variant={tab.id===activeTabId?"secondary":"ghost"} size="sm" className={cn("dock-app h-12 min-w-12 flex-col gap-0.5 rounded-xl px-2",tab.id===activeTabId&&"text-primary")} onClick={()=>{setActiveTabId(tab.id);setEditable(false)}} onDoubleClick={()=>renameTab(tab)}><LayoutDashboard className="size-5"/><span className="max-w-24 truncate text-[8px]">{tab.name}</span></Button>{tabs.length>1&&tab.id===activeTabId&&<Button title="Remover dashboard" variant="destructive" size="iconSm" className="absolute -right-1.5 -top-1.5 size-5 rounded-full opacity-0 shadow-lg transition-opacity group-hover:opacity-100 focus:opacity-100" onClick={()=>removeTab(tab.id)}><Trash2 className="size-2.5"/><span className="sr-only">Remover {tab.name}</span></Button>}<span className={cn("absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary transition-opacity",tab.id===activeTabId?"opacity-100":"opacity-0")}/></div>)}<div className="mx-1 h-10 w-px shrink-0 self-center bg-border"/><Button title="Novo dashboard" variant="ghost" size="icon" className="dock-app size-12 shrink-0 rounded-xl" onClick={addTab}><Plus className="size-5"/><span className="sr-only">Novo dashboard</span></Button></div></nav></>}
  </main>;
}