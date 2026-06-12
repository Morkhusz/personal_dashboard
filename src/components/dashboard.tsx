import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  Bot, ChevronLeft, ChevronRight, CloudSun, Code2, Edit3, Gauge, GitPullRequest,
  Grip, Pause, Play, RefreshCcw, RotateCcw, SkipBack, SkipForward, Sparkles,
  Star, Sun, Timer, Users, Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PITCH = 192;
const CANVAS_WIDTH = 1524;
const CANVAS_HEIGHT = 792;
const STORAGE_KEY = "accusense-layout-v1";
const toneClasses = {
  blue: { bg: "bg-blue", stroke: "stroke-blue" }, green: { bg: "bg-green", stroke: "stroke-green" },
  amber: { bg: "bg-amber", stroke: "stroke-amber" }, red: { bg: "bg-red", stroke: "stroke-red" },
  purple: { bg: "bg-purple", stroke: "stroke-purple" },
} as const;

type Position = { x: number; y: number };
type WidgetSpec = { id: string; title: string; icon: ReactNode; width: number; height: number; x: number; y: number; content: ReactNode };

const issues = [
  ["polaris-api", "#428", "Corrigir cache do endpoint de métricas", "LC"],
  ["market-insights-client", "#191", "Novo filtro por período no dashboard", "MR"],
  ["tools-client", "#84", "Ajustar estados vazios da busca", "AV"],
  ["scrape-engine", "#306", "Retry exponencial para jobs falhos", "TS"],
  ["polaris-api", "#431", "Documentar webhooks de cobrança", "JP"],
  ["market-insights-client", "#197", "Otimizar bundle de gráficos", "BI"],
] as const;

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
  const columns = [
    ["Backlog", "green", issues.slice(0, 2)], ["Em progresso", "amber", issues.slice(2, 4)],
    ["Revisando", "purple", issues.slice(4, 5)], ["Pronto", "amber", issues.slice(5)],
  ] as const;
  return <div className="grid h-full grid-cols-4 gap-2">{columns.map(([name, tone, cards]) => <div className="min-w-0 overflow-hidden rounded-lg bg-secondary/45" key={name}>
    <div className="flex items-center gap-1.5 border-b border-border px-2 py-2 text-[10px] font-semibold"><span className={cn("h-1.5 w-1.5 rounded-full", toneClasses[tone].bg)} /> <span className="truncate">{name}</span><span className="ml-auto rounded-full bg-muted px-1.5 text-muted-foreground">{cards.length}</span></div>
    <div className="h-[280px] space-y-2 overflow-y-auto p-2">{cards.map(([repo, num, title, avatar]) => <div className="rounded-lg border border-border bg-card p-2.5 transition hover:border-primary/60 hover:brightness-110" key={num}>
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground"><Code2 className="size-3"/><span className="truncate">{repo}</span><span>{num}</span></div>
      <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-foreground">{title}</p>
      <span className="mt-2 grid size-5 place-items-center rounded-full bg-accent text-[8px] font-bold text-accent-foreground">{avatar}</span>
    </div>)}</div>
  </div>)}</div>;
}

function SpotifyWidget() {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(38);
  useEffect(() => { if (!playing) return; const id = window.setInterval(() => setProgress(v => (v >= 100 ? 0 : v + .25)), 500); return () => clearInterval(id); }, [playing]);
  const queue = [["Midnight City", "M83", "4:03"], ["Borderline", "Tame Impala", "3:57"], ["Instant Crush", "Daft Punk", "5:37"], ["Electric Feel", "MGMT", "3:50"], ["Dreams", "Fleetwood Mac", "4:17"]];
  return <div className="flex h-full flex-col"><div className="flex gap-3"><div className="grid size-20 shrink-0 place-items-center rounded-xl bg-spotify/15 text-4xl">🌌</div><div className="min-w-0 pt-2"><div className="truncate text-sm font-bold">Nightcall</div><div className="text-[10px] text-muted-foreground">Kavinsky</div><div className="mt-3 text-[9px] font-semibold text-spotify">PLAYING NOW</div></div></div>
    <div className="mt-3"><MetricBar value={progress} tone="green"/><div className="mt-1 flex justify-between text-[8px] text-muted-foreground"><span>1:42</span><span>4:20</span></div></div>
    <div className="flex items-center justify-center gap-2"><Button variant="ghost" size="icon" aria-label="Previous"><SkipBack/></Button><Button variant="spotify" size="icon" onClick={() => setPlaying(v => !v)} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause/> : <Play/>}</Button><Button variant="ghost" size="icon" aria-label="Next"><SkipForward/></Button></div>
    <div className="mt-2 min-h-0 flex-1 border-t border-border pt-2"><div className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Próximas</div>{queue.map((q, i) => <div className="grid grid-cols-[16px_1fr_auto] items-center gap-2 py-1 text-[9px]" key={q[0]}><span className="text-muted-foreground">{i + 1}</span><span className="truncate"><b>{q[0]}</b> <span className="text-muted-foreground">· {q[1]}</span></span><span className="text-muted-foreground">{q[2]}</span></div>)}</div>
  </div>;
}

function OpenAICosts() {
  return <div><div className="grid grid-cols-2 gap-3"><div><div className="text-[9px] text-muted-foreground">Hoje</div><div className="mt-1 text-xl font-bold text-green">$12,48</div></div><div><div className="flex justify-between text-[9px]"><span className="text-muted-foreground">Mês atual</span><span>42%</span></div><div className="mt-2"><MetricBar value={42} tone="amber"/></div><div className="mt-1 text-[9px] text-muted-foreground">$211 / $500</div></div></div>
    <div className="my-3 rounded-md border border-amber/25 bg-amber/10 px-2 py-1 text-[8px] text-amber">⚠ 42% do limite mensal utilizado</div>
    <div className="grid grid-cols-3 gap-2">{[["GPT-4o", "$176"], ["Embeddings", "$24"], ["Whisper", "$11"]].map(x => <div className="rounded-md bg-secondary px-2 py-1.5" key={x[0]}><div className="text-[8px] text-muted-foreground">{x[0]}</div><b className="text-[10px]">{x[1]}</b></div>)}</div></div>;
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

function Leaderboard() { return <div>{[["🥇","LC","Lia Costa",18],["🥈","MR","Mauro Reis",14],["🥉","AV","Ana Vaz",11],["4","TS","Theo Silva",9]].map(([rank,initials,name,count])=><div className="grid grid-cols-[20px_24px_1fr_auto] items-center gap-2 border-b border-border/70 py-1.5 last:border-0" key={String(name)}><span className="text-[11px] text-center">{rank}</span><span className="grid size-6 place-items-center rounded-full bg-primary/15 text-[8px] font-bold text-primary">{initials}</span><span className="text-[9px] font-medium">{name}</span><b className="text-[10px] text-primary">{count} PRs</b></div>)}</div> }

function Weather() { return <div className="flex h-full flex-col"><div className="flex items-start justify-between"><CloudSun className="size-9 text-amber"/><div className="text-right"><div className="text-3xl font-bold">24°</div><div className="text-[8px] text-muted-foreground">Parcialmente nublado</div></div></div><div className="mt-3 grid grid-cols-3 gap-1 text-center text-[8px] text-muted-foreground"><span>sens. 25°</span><span>💧 68%</span><span><Wind className="inline size-3"/> 9 km/h</span></div><div className="mt-auto grid grid-cols-3 border-t border-border pt-2 text-center text-[8px]">{[["Seg","☀️","26°"],["Ter","🌦️","22°"],["Qua","☁️","23°"]].map(d=><div key={d[0]}><span className="text-muted-foreground">{d[0]}</span><div>{d[1]}</div><b>{d[2]}</b></div>)}</div></div> }

function Widget({ spec, position, editable, onDragEnd }: { spec: WidgetSpec; position: Position; editable: boolean; onDragEnd: (id: string, p: Position) => void }) {
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null); const [temp,setTemp]=useState<Position|null>(null);
  const onPointerDown=(e:ReactPointerEvent)=>{if(!editable)return; e.currentTarget.setPointerCapture(e.pointerId); drag.current={sx:e.clientX,sy:e.clientY,ox:position.x,oy:position.y};};
  const onPointerMove=(e:ReactPointerEvent)=>{if(!drag.current)return; setTemp({x:Math.max(0,Math.min(CANVAS_WIDTH-spec.width,drag.current.ox+e.clientX-drag.current.sx)),y:Math.max(0,Math.min(CANVAS_HEIGHT-spec.height,drag.current.oy+e.clientY-drag.current.sy))})};
  const onPointerUp=()=>{if(!drag.current)return; const p=temp??position; const snapped={x:Math.max(0,Math.min(CANVAS_WIDTH-spec.width,Math.round(p.x/PITCH)*PITCH)),y:Math.max(0,Math.min(CANVAS_HEIGHT-spec.height,Math.round(p.y/PITCH)*PITCH))};drag.current=null;setTemp(null);onDragEnd(spec.id,snapped)};
  const p=temp??position;
  return <article className={cn("widget absolute flex flex-col",editable&&"widget-editing")} style={{width:spec.width,height:spec.height,transform:`translate3d(${p.x}px, ${p.y}px, 0)`}}><header className={cn("flex h-9 shrink-0 items-center gap-2 border-b border-border px-3",editable&&"cursor-grab select-none active:cursor-grabbing")} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}><span className="text-primary">{spec.icon}</span><h2 className="text-[10px] font-bold uppercase tracking-[0.14em]">{spec.title}</h2>{editable&&<Grip className="ml-auto size-3 text-muted-foreground"/>}</header><div className="min-h-0 flex-1 p-3">{spec.content}</div></article>;
}

export function Dashboard() {
  const [clock,setClock]=useState(""),[editable,setEditable]=useState(false);
  const specs: WidgetSpec[] = useMemo(()=>[
    {id:"kanban",title:"GitHub Kanban",icon:<GitPullRequest className="size-3.5"/>,width:540,height:372,x:0,y:0,content:<GitHubKanban/>},
    {id:"spotify",title:"Spotify Now Playing",icon:<Play className="size-3.5"/>,width:282,height:372,x:576,y:0,content:<SpotifyWidget/>},
    {id:"openai",title:"OpenAI Costs",icon:<Bot className="size-3.5"/>,width:282,height:180,x:960,y:0,content:<OpenAICosts/>},
    {id:"claude",title:"Claude Usage",icon:<Gauge className="size-3.5"/>,width:282,height:180,x:960,y:192,content:<ClaudeUsage/>},
    {id:"weather",title:"São Paulo",icon:<Sun className="size-3.5"/>,width:180,height:180,x:1344,y:0,content:<Weather/>},
    {id:"energy",title:"Team Energy Meter",icon:<Users className="size-3.5"/>,width:282,height:372,x:0,y:420,content:<EnergyMeter/>},
    {id:"pomodoro",title:"Pomodoro Timer",icon:<Timer className="size-3.5"/>,width:282,height:372,x:384,y:420,content:<Pomodoro/>},
    {id:"joke",title:"Joke of the Day",icon:<Sparkles className="size-3.5"/>,width:372,height:282,x:768,y:420,content:<JokeWidget/>},
    {id:"pipeline",title:"CI/CD Pipeline",icon:<Code2 className="size-3.5"/>,width:372,height:180,x:1152,y:228,content:<Pipeline/>},
    {id:"leaderboard",title:"PR Leaderboard",icon:<GitPullRequest className="size-3.5"/>,width:282,height:180,x:1242,y:612,content:<Leaderboard/>},
  ],[]);
  const defaults=useMemo(()=>Object.fromEntries(specs.map(s=>[s.id,{x:s.x,y:s.y}])),[specs]); const [positions,setPositions]=useState<Record<string,Position>>(defaults);
  useEffect(()=>{const saved=localStorage.getItem(STORAGE_KEY);if(saved){try{setPositions({...defaults,...JSON.parse(saved)})}catch{localStorage.removeItem(STORAGE_KEY)}}},[defaults]);
  useEffect(()=>{const tick=()=>setClock(new Intl.DateTimeFormat("pt-BR",{weekday:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date()));tick();const id=window.setInterval(tick,1000);return()=>clearInterval(id)},[]);
  const move=(id:string,p:Position)=>setPositions(old=>{const next={...old,[id]:p};localStorage.setItem(STORAGE_KEY,JSON.stringify(next));return next});
  const reset=()=>{localStorage.removeItem(STORAGE_KEY);window.location.reload()};
  return <main className="min-h-screen bg-background text-foreground"><nav className="fixed inset-x-0 top-0 z-50 h-12 border-b border-border bg-background/90 backdrop-blur-xl"><div className="grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:flex"><div className="flex min-w-0 items-center gap-2"><div className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Gauge className="size-4"/></div><div className="truncate text-sm font-bold tracking-tight">Accusense <span className="font-normal text-muted-foreground">dev</span></div></div><div className="flex shrink-0 items-center gap-1.5 sm:ml-auto"><Button variant={editable?"secondary":"ghost"} size="sm" onClick={()=>setEditable(v=>!v)}><Edit3/><span className="hidden sm:inline">{editable?"Concluir":"Editar layout"}</span></Button><Button variant="ghost" size="sm" onClick={reset}><RefreshCcw/><span className="hidden md:inline">Resetar</span></Button><div className="hidden border-l border-border pl-3 font-mono text-[10px] text-muted-foreground lg:block">{clock}</div><div className="ml-1 flex items-center gap-2 rounded-full bg-green/10 px-2.5 py-1 text-[9px] font-semibold text-green"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-60"/><span className="relative inline-flex size-2 rounded-full bg-green"/></span>3 services live</div></div></div></nav>
    <section className="pt-12"><div className="overflow-auto p-3"><div className="canvas relative mx-auto" style={{width:CANVAS_WIDTH,height:CANVAS_HEIGHT}}>{specs.map(s=><Widget key={s.id} spec={s} position={positions[s.id]??{x:s.x,y:s.y}} editable={editable} onDragEnd={move}/>)}</div></div></section></main>;
}