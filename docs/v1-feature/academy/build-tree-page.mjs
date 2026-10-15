// Builds the reviewable academy-tree page from src/learn/academyTree.mjs (single source of data).
//   node docs/v1-feature/academy/build-tree-page.mjs <out.html>
import { writeFileSync } from "node:fs";
import { NODES, TRACKS, PATHS, depthOf, ACADEMY_TREE_VERSION } from "../../../src/learn/academyTree.mjs";

const out = process.argv[2];
const data = { version: ACADEMY_TREE_VERSION, tracks: TRACKS, paths: PATHS,
  nodes: NODES.map((n) => ({ ...n, depth: depthOf(n.id) })) };
const legacyCount = NODES.filter((n) => n.legacy?.lesson).length;
const revise = NODES.filter((n) => n.legacy?.verdict === "REVISE").length;
const fresh = NODES.filter((n) => !n.legacy?.lesson && n.scope !== "later").length;
const later = NODES.filter((n) => n.scope === "later").length;

const css = `
/* Layout: one band per track, top to bottom in learning order; nodes left to right by prerequisite depth; a detail rail follows the picked node. */
:root{color-scheme:dark;
  --ground:#07101d;--band:#0b1828;--chip:#102238;--chip-hi:#182c46;--line:#1f3a5c;--ink:#eef3fb;--ink2:#9db0c8;--on-accent:#06101c;
  --blue:#6eb1fd;--green:#3ee08a;--gold:#ffd166;--purple:#8f8cff;
  --display:"Barlow Condensed","Bahnschrift","Arial Narrow",sans-serif;--body:"Geist","Segoe UI",system-ui,sans-serif;--mono:"Geist Mono",ui-monospace,Consolas,monospace}
*{box-sizing:border-box}
body{background:var(--ground);color:var(--ink);font-family:var(--body);margin:0;padding-inline:20px;padding-block:28px 60px;line-height:1.5}
.wrap{max-width:1240px;margin:0 auto;display:grid;gap:22px}
header h1{font-family:var(--display);font-weight:700;font-size:clamp(34px,6vw,58px);line-height:1;margin:0;letter-spacing:.01em;text-wrap:balance}
header p{color:var(--ink2);max-width:68ch;margin:10px 0 0}
.facts{display:flex;flex-wrap:wrap;gap:10px}
.fact{background:var(--band);border:1px solid var(--line);border-radius:10px;padding:8px 14px;font-family:var(--mono);font-size:13px;color:var(--ink2)}
.fact b{color:var(--ink);font-size:16px;margin-right:6px;font-variant-numeric:tabular-nums}
.paths{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.paths span{font-family:var(--display);font-size:18px;letter-spacing:.06em;color:var(--ink2);text-transform:uppercase;margin-right:4px}
button{font:inherit;color:inherit;cursor:pointer}
.path{background:transparent;border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-size:14px}
.path[aria-pressed="true"]{background:var(--blue);color:var(--on-accent);border-color:var(--blue);font-weight:600}
.pathnote{color:var(--ink2);font-size:14px;min-height:1.5em;margin-top:-12px}
.main{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:22px;align-items:start}
@media (max-width:900px){.main{grid-template-columns:minmax(0,1fr)}aside{position:static}}
.bands{display:grid;gap:10px;min-width:0}
.band{display:grid;grid-template-columns:200px minmax(0,1fr);gap:16px;background:var(--band);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
@media (max-width:640px){.band{grid-template-columns:minmax(0,1fr)}}
.band h2{font-family:var(--display);font-weight:700;font-size:24px;line-height:1.05;margin:0;letter-spacing:.02em}
.band h2 small{display:block;font-family:var(--mono);font-size:12px;color:var(--blue);letter-spacing:.08em;margin-bottom:4px}
.band p{color:var(--ink2);font-size:13px;margin:6px 0 0}
.nodes{display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;min-width:0}
.node{position:relative;text-align:left;background:var(--chip);border:1px solid var(--line);border-radius:10px;padding:8px 12px;font-size:14px;line-height:1.25;max-width:230px;transition:border-color .15s,opacity .15s}
.node:hover{border-color:var(--blue)}
.node:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.node .d{display:block;font-family:var(--mono);font-size:11px;color:var(--ink2);margin-top:3px}
.node.keep{box-shadow:inset 3px 0 0 var(--green)}
.node.revise{box-shadow:inset 3px 0 0 var(--gold)}
.node.new{box-shadow:inset 3px 0 0 var(--purple)}
.node.later{opacity:.55;border-style:dashed}
.node.picked{border-color:var(--gold);background:var(--chip-hi)}
.node.anc{border-color:var(--blue)}
.node.desc{border-color:var(--green)}
.bands.focus .node:not(.picked):not(.anc):not(.desc){opacity:.35}
.node.start::after{content:"START";position:absolute;top:-9px;right:8px;background:var(--blue);color:var(--on-accent);font-family:var(--mono);font-size:10px;padding:1px 6px;border-radius:6px}
aside{position:sticky;top:calc(env(safe-area-inset-top,0px) + 16px);background:var(--band);border:1px solid var(--line);border-radius:14px;padding:18px;display:grid;gap:12px;min-width:0}
aside h3{font-family:var(--display);font-size:30px;line-height:1.05;margin:0;text-wrap:balance}
aside .k{font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:var(--ink2);text-transform:uppercase;margin-bottom:2px}
aside p{margin:0;font-size:14px}
.tags{display:flex;flex-wrap:wrap;gap:6px}
.tag{font-family:var(--mono);font-size:12px;border:1px solid var(--line);border-radius:6px;padding:2px 8px;color:var(--ink2)}
.tag.v-keep{color:var(--green);border-color:var(--green)}.tag.v-revise{color:var(--gold);border-color:var(--gold)}.tag.v-new{color:var(--purple);border-color:var(--purple)}
.links button{background:none;border:none;padding:0;color:var(--blue);text-decoration:underline;font-size:14px}
.legend{display:flex;flex-wrap:wrap;gap:14px;font-size:13px;color:var(--ink2)}
.legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}
.foot{color:var(--ink2);font-size:13px;margin:0}
@media (prefers-reduced-motion:reduce){.node{transition:none}}
`;

const script = `
const DATA=__DATA__;
const byId=new Map(DATA.nodes.map(n=>[n.id,n]));
const kids=new Map(DATA.nodes.map(n=>[n.id,[]]));DATA.nodes.forEach(n=>n.prereqs.forEach(p=>kids.get(p).push(n.id)));
const FORMAT={film:"Diagram film",table:"Real-table walkthrough",toy:"Hands-on toy",worked:"Worked example, then your turn",contrast:"Mistake beside the fix",decision:"Graded decisions",drill:"Puzzles",match:"Gauntlet rival"};
const kind=n=>n.scope==="later"?"later":n.legacy&&n.legacy.verdict==="REVISE"?"revise":n.legacy&&n.legacy.lesson?"keep":"new";
const walk=(id,next,acc=new Set())=>{for(const x of next(id)){if(!acc.has(x)){acc.add(x);walk(x,next,acc)}}return acc};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const bands=document.getElementById("bands"),detail=document.getElementById("detail");
DATA.tracks.forEach(t=>{
  const b=document.createElement("section");b.className="band";b.setAttribute("aria-label",t.title);
  b.innerHTML='<div><h2><small>TRACK '+String(t.n).padStart(2,"0")+'</small>'+esc(t.title)+'</h2><p>'+esc(t.promise)+'</p></div><div class="nodes"></div>';
  const box=b.querySelector(".nodes");
  DATA.nodes.filter(n=>n.track===t.id).sort((a,c)=>a.depth-c.depth).forEach(n=>{
    const el=document.createElement("button");el.className="node "+kind(n);el.id="n-"+n.id;el.type="button";
    el.innerHTML=esc(n.title)+'<span class="d">step '+n.depth+(n.legacy&&n.legacy.lesson?" · lesson exists":"")+'</span>';
    el.addEventListener("click",()=>pick(n.id));box.appendChild(el)});
  bands.appendChild(b)});
function pick(id){const n=byId.get(id);const anc=walk(id,x=>byId.get(x).prereqs),desc=walk(id,x=>kids.get(x));
  bands.classList.add("focus");
  DATA.nodes.forEach(m=>{const el=document.getElementById("n-"+m.id);el.classList.toggle("picked",m.id===id);el.classList.toggle("anc",anc.has(m.id));el.classList.toggle("desc",desc.has(m.id));if(m.id===id)el.setAttribute("aria-current","true");else el.removeAttribute("aria-current")});
  const k=kind(n),vt={keep:"Existing lesson · keep",revise:"Existing lesson · revise",new:"New lesson",later:"Later scope"}[k];
  const link=ids=>ids.length?ids.map(x=>'<button type="button" data-go="'+x+'">'+esc(byId.get(x).title)+'</button>').join(", "):"None";
  detail.innerHTML='<div class="tags"><span class="tag v-'+(k==="later"?"new":k)+'">'+vt+'</span><span class="tag">'+esc(DATA.tracks.find(t=>t.id===n.track).title)+'</span></div>'+
   '<h3>'+esc(n.title)+'</h3>'+
   '<div><div class="k">Teaches</div><p>'+esc(n.objective)+'</p></div>'+
   (n.misconception?'<div><div class="k">Fixes the belief</div><p>&ldquo;'+esc(n.misconception)+'&rdquo;</p></div>':'')+
   '<div><div class="k">Taught as</div><div class="tags">'+n.formats.map(f=>'<span class="tag">'+FORMAT[f]+'</span>').join("")+'</div></div>'+
   (n.practice?'<div><div class="k">Practice</div><p>'+esc([n.practice.topic&&("Puzzles: "+n.practice.topic),n.practice.opponent&&("Rival: "+n.practice.opponent)].filter(Boolean).join(" · "))+'</p></div>':'')+
   (n.legacy?'<div><div class="k">Carries over</div><p>'+esc([n.legacy.lesson,n.legacy.concept].filter(Boolean).join(" · "))+'</p></div>':'')+
   '<div class="links"><div class="k">Needs first</div><p>'+link(n.prereqs)+'</p></div>'+
   '<div class="links"><div class="k">Opens next</div><p>'+link(kids.get(id))+'</p></div>';
  detail.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{pick(b.dataset.go);document.getElementById("n-"+b.dataset.go).focus()}));
}
const pg=document.querySelector(".paths");
DATA.paths.forEach(p=>{const b=document.createElement("button");b.className="path";b.type="button";b.textContent=p.title;b.setAttribute("aria-pressed","false");
  b.addEventListener("click",()=>{pg.querySelectorAll(".path").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
    document.querySelectorAll(".node.start").forEach(x=>x.classList.remove("start"));document.getElementById("n-"+p.start).classList.add("start");
    document.getElementById("pathnote").textContent=p.note;pick(p.start)});pg.appendChild(b)});
pg.querySelector(".path").click();
`.replace("__DATA__", JSON.stringify(data).replace(/</g, "\\u003c"));

const html = `<title>Flop52 Academy Tree</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Geist:wght@400;500;600&family=Geist+Mono:wght@500&display=swap">
<style>${css}</style>
<div class="wrap">
<header>
  <h1>The Flop52 Academy Tree</h1>
  <p>Every idea a player meets, from never having held a deck to game theory, in the order it can be learned. Pick a concept to see what it teaches, the belief it fixes, how it is taught, what it needs first (blue) and what it opens next (green).</p>
</header>
<div class="facts">
  <div class="fact"><b>${NODES.length}</b>concepts</div>
  <div class="fact"><b>${TRACKS.length}</b>tracks</div>
  <div class="fact"><b>${legacyCount}</b>existing lessons placed</div>
  <div class="fact"><b>${revise}</b>marked to revise</div>
  <div class="fact"><b>${fresh}</b>new for V1</div>
  <div class="fact"><b>${later}</b>later scope</div>
</div>
<div class="legend"><span><i style="background:var(--green)"></i>Existing lesson, keep</span><span><i style="background:var(--gold)"></i>Existing lesson, revise</span><span><i style="background:var(--purple)"></i>New lesson to build</span><span><i style="border:1px dashed var(--ink2)"></i>Later scope</span></div>
<div class="paths" role="group" aria-label="Starting paths"><span>Start as</span></div>
<div class="pathnote" id="pathnote"></div>
<div class="main">
  <div class="bands" id="bands"></div>
  <aside id="detail" aria-live="polite"></aside>
</div>
<p class="foot">Draft ${data.version}, 6 October 2026. Plan data only: the live curriculum, lessons, grading and progress are unchanged.</p>
</div>
<script>${script}</script>
`;
writeFileSync(out, html);
console.log(`wrote ${out} (${html.length} bytes)`);
