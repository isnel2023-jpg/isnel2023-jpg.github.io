// Generado por build/build.py a partir del Portal de Santi original. No editar a mano: edita build.py o months.js.
window.startPortal = function(CFG, P){
// ---------- constants ----------
const OFF = -CFG.tzOffsetHours*3600e3; // zona horaria del colaborador
const COMMISSION = CFG.commission, COMMISSION_BRANDS = CFG.commissionBrands, BASE_PAY = CFG.basePay;
const SALES_GOALS = CFG.salesGoals; // meta base / meta alta
const BRANDS_SELL = CFG.brands;
const SOURCES = ["WhatsApp","Instagram","Messenger","Facebook","Llamada","Referido","Base antigua"];
const CHECK_HOURS = CFG.checkHours;
const STAGES = {
  nuevo:{n:"Nuevo",c:"acc"}, sin_respuesta:{n:"No contesta",c:""}, contactado:{n:"Contactado",c:""},
  interesado:{n:"Interesado",c:"warn"}, pendiente_pago:{n:"Pendiente de pago",c:"warn"},
  vendido:{n:"Vendido",c:"on"}, frio:{n:"No interesado / frío",c:"bad"}
};
const PRIORITY = {pendiente_pago:0, interesado:1, contactado:2, sin_respuesta:3, nuevo:4, frio:9, vendido:9};
const CONTENT = (CFG.content||[]).filter(x=>{const k=new Date(Date.now()+(CFG.tzOffsetHours||0)*3600e3).toISOString().slice(0,10);return (!x.from||x.from<=k)&&(!x.to||x.to>=k)}); // tareas vigentes hoy
const GOAL_NEW = CFG.goals.newCalls, GOAL_FU = CFG.goals.followUps, GOAL_CHAT = CFG.goals.chats;
const LEGACY = CFG.legacyTexts===true;
const ME = CFG.__member||null, LEGO = CFG.legacyOwner||null;
const MINE = x=>!ME||(((x&&x.by)||LEGO)===ME);
const PT = CFG.portalTitle || ("Portal de "+(CFG.shortName||CFG.displayName));
const PCT = (Math.round(COMMISSION*1000)/10)+"%";
const BONUS = CFG.bonus && CFG.bonus.amount ? CFG.bonus : null;
const bonusOf = (t)=>BONUS && t>=BONUS.goal ? BONUS.amount : 0;
const SHOW_THEME = CONTENT.length>0 && CFG.contentTheme!==false;
const PROPOSAL = CFG.monthlyProposal===true;
const monthLast = (m)=>m+"-"+String(new Date(Date.UTC(+m.slice(0,4),+m.slice(5,7),0)).getUTCDate()).padStart(2,"0");
const proposalFor = (m)=>Object.values(S.days).map(d=>d&&d.proposal).find(p=>p&&p.month===m&&p.sentAt);
function proposalBanner(){const m=today().slice(0,7),last=monthLast(m);if(proposalFor(m)||today()<addDays(last,-4))return "";
  return `<div class="banner">📝 <b>Propuesta de venta de ${fmtMonth(m)}:</b> entrégala a más tardar el ${fmtDay(last)}. Escríbela en <b>Resumen</b>.</div>`}
function proposalPanel(){const m=today().slice(0,7),last=monthLast(m),p=proposalFor(m);
  return `<section class="panel"><div class="panel-h"><h2>Propuesta de venta de ${fmtMonth(m)}</h2><span class="muted">Se entrega a más tardar el ${fmtDay(last)}</span></div>
    <p style="margin:0 0 8px">Con tu experiencia vendiendo este mes, escribe tu propuesta para vender más: qué aprendiste de los clientes, qué funcionó, qué no funcionó, qué estrategias nuevas propones y qué necesitarías para lograrlo.</p>
    ${p?`<div class="banner">✅ Enviada a Isnel ${fmtWhen(p.sentAt)}.</div><div style="white-space:pre-wrap;margin-top:8px">${esc(p.text)}</div>`
      :`<textarea id="propTxt" rows="9" style="width:100%" placeholder="1. Lo que aprendí este mes…&#10;2. Lo que funcionó…&#10;3. Lo que no funcionó…&#10;4. Mi propuesta para vender más…&#10;5. Lo que necesito…">${esc(S.propDraft||"")}</textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="btn pri" type="button" data-act="sendProp">Enviar propuesta a Isnel</button></div>`}
  </section>`}
const NAME = CFG.displayName, SHORT = CFG.shortName||CFG.displayName;
const fmtGoal = n=>"$"+Number(n).toLocaleString("en-US");
const contentLine = (ct,mult)=>CONTENT.map(x=>`${x.n} ${ct[x.k]||0}/${x.goal*(mult||1)}`).join(" · ");
const LANGS = {es:"Español",en:"Inglés"};
const THEMES = [
  {d:"Domingo",w:"Reporte semanal",h:"Hoy mandas el reporte de la semana a Isnel, a cualquier hora del día."},
  {d:"Lunes",w:"Inspirar",h:"Frases, historias de amor, entregas que emocionan. Arranca la semana con sentimiento."},
  {d:"Martes",w:"Educar",h:"Cuidado de las flores, significado de los colores, cómo escoger el ramo ideal."},
  {d:"Miércoles",w:"Vender",h:"Oferta vigente, precio claro y llamado a escribir por WhatsApp."},
  {d:"Jueves",w:"Conectar",h:"Detrás de cámaras, clientes reales, capturas de chats y entregas."},
  {d:"Viernes",w:"Fidelizar",h:"Agradecer a clientes, recompra, planes del fin de semana."},
  {d:"Sábado",w:"Entretener",h:"Trends, humor y reels con potencial viral."}
];

// ---------- time helpers (Colombia) ----------
const co = (ms)=>new Date((ms??Date.now())-OFF);
const pad = n=>String(n).padStart(2,"0");
const dayKey = (ms)=>{const d=co(ms);return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())};
const hhmm = (ms)=>{const d=co(ms);let h=d.getUTCHours();const ap=h>=12?"p. m.":"a. m.";h=h%12||12;return h+":"+pad(d.getUTCMinutes())+" "+ap};
const coHour = (ms)=>co(ms).getUTCHours();
const dayStartMs = (key)=>{const [y,m,d]=key.split("-").map(Number);return Date.UTC(y,m-1,d)+OFF};
const addDays = (key,n)=>dayKey(dayStartMs(key)+n*864e5+3600e3);
const atHour = (key,h)=>dayStartMs(key)+h*3600e3;
const localInputToMs = (v)=>{if(!v)return null;const [d,t]=v.split("T");const [y,m,dd]=d.split("-").map(Number);const [h,mi]=(t||"0:0").split(":").map(Number);return Date.UTC(y,m-1,dd,h,mi)+OFF};
const msToLocalInput = (ms)=>{if(!ms)return "";const d=co(ms);return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())+"T"+pad(d.getUTCHours())+":"+pad(d.getUTCMinutes())};
const DOW = ["dom","lun","mar","mié","jue","vie","sáb"];
const dow = (key)=>new Date(dayStartMs(key)-OFF).getUTCDay();
const fmtDay = (key)=>{if(!key)return "—";const d=new Date(dayStartMs(key)-OFF);return DOW[d.getUTCDay()]+" "+d.getUTCDate()+"/"+(d.getUTCMonth()+1)};
const today = ()=>dayKey();
const fmtWhen = (ms)=>{const k=dayKey(ms);const t=today();if(k===t)return "Hoy "+hhmm(ms);if(k===addDays(t,1))return "Mañana "+hhmm(ms);if(k===addDays(t,-1))return "Ayer "+hhmm(ms);return fmtDay(k)+" "+hhmm(ms)};
const relDay = (k)=>{const t=today();if(k===t)return "hoy";if(k===addDays(t,1))return "mañana";if(k===addDays(t,-1))return "ayer";return fmtDay(k)};
const weekStart = (key)=>addDays(key,-((dow(key)+6)%7));
const MONTHS=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const fmtMonth = (m)=>{const [y,mm]=m.split("-");return MONTHS[+mm-1]+" "+y};
const money = n=>"$"+(Math.round((n||0)*100)/100).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:2});
const esc = s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = ()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const digits = s=>String(s||"").replace(/\D/g,"").slice(-10);
const sleep = ms=>new Promise(r=>setTimeout(r,ms));
const nz = v=>{const n=parseFloat(v);return isNaN(n)?0:n};
const ordNo = s=>s&&s.orderNo?"#"+s.orderNo:"sin n.º";

// ---------- state ----------
const S = {months:{}, leads:{}, sales:{}, tasks:{}, days:{}, ready:{leads:false,sales:false,tasks:false,days:false}, tab:"hoy", leadQuery:"", leadBrand:"todas", colLimit:{}, openLead:null, orderFilter:"proximas", month:today().slice(0,7), db:null, sample:null, assets:null, offline:false, dragging:false, showAdd:false, showImport:false, importing:null, draft:null};
try{const t=localStorage.getItem("ps_tab");if(t)S.tab=t}catch(e){}
const view = document.getElementById("view");
const layer = document.getElementById("layer");
function toast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2800)}

// ---------- db (append-only from the page: nothing is deleted or rewritten by hand) ----------
function saveErr(msg){
  let el=document.getElementById("saveErr");
  if(!msg){if(el)el.remove();return}
  if(!el){el=document.createElement("div");el.id="saveErr";el.setAttribute("role","alert");el.style.cssText="position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:50;max-width:640px;margin:0 auto;background:var(--bad);color:#fff;padding:12px 14px;border-radius:12px;font-weight:600;display:flex;gap:10px;align-items:center";document.body.appendChild(el)}
  el.innerHTML=`<span style="flex:1">${esc(msg)}</span><button type="button" class="btn sm" style="color:var(--ink)" aria-label="Cerrar aviso">Cerrar</button>`;
  el.querySelector("button").onclick=()=>el.remove();
}
const NO_PERM="Ese cambio no está permitido: lo que ya quedó registrado no se puede cambiar ni borrar. Si es un error, avísale a Isnel.";
async function save(col,obj,quiet){
  if(!S.db){if(!quiet)saveErr("NO SE GUARDÓ: el portal no está conectado. Revisa tu internet, vuelve a entrar y avísale a Isnel si sigue pasando.");return false}
  for(let i=0;i<2;i++){
    try{const body=JSON.parse(JSON.stringify(obj)),prev=LAST[col+"/"+obj.id];await S.db.collection(col).doc(obj.id).set(body);try{record(col,body,prev)}catch(e){};try{if(col==="sales"&&prev)notifyOrderChange(prev,body)}catch(e){};if(document.getElementById("saveErr"))saveErr(null);return true}
    catch(e){
      if((e.code==="resource_exhausted"||e.code==="unavailable")&&i===0){await sleep(1500+Math.random()*1000);continue}
      if(!quiet)saveErr("NO SE GUARDÓ: "+(e.code==="quota_exceeded"?"la base de datos está llena. Avísale a Isnel.":e.code==="permission_denied"?(e.message||NO_PERM):e.code==="unauthenticated"?"tu sesión terminó. Vuelve a entrar con tu contraseña.":e.code==="invalid_argument"?NO_PERM:"intenta otra vez. Si sigue fallando, avísale a Isnel."));
      return false;
    }
  }
}
// ---------- historial: cada guardado queda anotado; borrados o cambios hechos por fuera se detectan ----------
const TAB=uid();
const DEV=(()=>{const u=navigator.userAgent||"";const os=/iPhone|iPad/.test(u)?"iPhone/iPad":/Android/.test(u)?"Android":/Mac/.test(u)?"Mac":/Windows/.test(u)?"Windows":"otro equipo";const br=/Edg\//.test(u)?"Edge":/Chrome\//.test(u)?"Chrome":/Safari\//.test(u)?"Safari":/Firefox\//.test(u)?"Firefox":"navegador";return os+" · "+br})();
const LAST={}, RAW={}, FRESH={};
const H={pend:{},shards:{},known:new Set(),queue:[],chunk:null,timer:null,busy:false,ready:false,alerts:{},pedidos:{},day:null,dayDocs:{},unsubDay:null,detected:false};
const LABEL={leads:"el lead",sales:"la orden",tasks:"la tarea",days:"el registro del día"};
function stable(v){if(Array.isArray(v))return "["+v.map(stable).join(",")+"]";if(v&&typeof v==="object")return "{"+Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>JSON.stringify(k)+":"+stable(v[k])).join(",")+"}";return JSON.stringify(v)}
function fp(o){const s=stable(o);let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}return (h>>>0).toString(36)+"."+s.length}
const shardOf=(col,id)=>col+"-"+(String(id).slice(-1).toLowerCase().replace(/[^a-z0-9]/,"_")||"_");
const nameOf=(col,o,id)=>col==="days"?"día "+id:String((o&&(o.name||o.client||o.title))||id).slice(0,80);
function describe(col,p,n){
  if(col==="days"){
    p=p||{};const out=[];
    if(n.start&&!p.start)out.push("Empezó turno");
    if(n.end&&!p.end)out.push("Cerró turno");
    const pc=(p.checkins||[]).length,nc=(n.checkins||[]).length;
    if(nc>pc)(n.checkins||[]).slice(pc).forEach(c=>{if(c.slot!=="inicio")out.push(`Check-in ${c.slot==="20"?8:(+c.slot-12)} p. m.: ${c.text}`)});
    else if(nc&&(n.checkins||[]).some((c,i)=>c.ai&&!((p.checkins||[])[i]||{}).ai))out.push("Respuesta de la IA al check-in");
    (n.contentLog||[]).slice((p.contentLog||[]).length).forEach(x=>{const c=CONTENT.find(y=>y.k===x.k);out.push("+1 "+(c?c.n:x.k==="abbaAnswered"?"mensaje ABBA respondido":x.k))});
    if((n.notes||"")!==(p.notes||""))out.push("Editó las notas del reporte");
    if(n.reportSent&&n.reportSent!==p.reportSent)out.push("Marcó el reporte diario como enviado");
    if(n.weeklySent&&n.weeklySent!==p.weeklySent)out.push("Marcó el reporte semanal como enviado");
    return out.join(" · ")||"Día actualizado";
  }
  if(col==="leads"){
    if(!p)return `Lead creado: ${n.name}${n.phone?" ("+n.phone+")":""}`;
    const added=(n.history||[]).slice((p.history||[]).length).map(h=>h.text);
    return `${n.name}: `+(added.join(" · ")||(p.stage!==n.stage?"Etapa → "+((STAGES[n.stage]||{}).n||n.stage):"actualizado"));
  }
  if(col==="sales"){
    if(!p)return `Orden subida ${ordNo(n)}: ${n.client} · ${money(n.total)} · pagado ${money(n.paid)}`;
    const added=(n.log||[]).slice((p.log||[]).length).map(x=>x.text);
    return `Orden ${ordNo(n)} (${n.client}): `+(added.join(" · ")||"actualizada");
  }
  if(col==="tasks"){if(!p)return "Tarea nueva: "+n.title;if(n.done&&!p.done)return "Tarea hecha: "+n.title;return "Tarea actualizada: "+n.title}
  return col+" actualizado";
}
function snapOf(col,o){
  if(col==="sales"){const c={...o};delete c.orderText;return c}
  if(col==="leads"&&JSON.stringify(o).length>4000)return {id:o.id,name:o.name,phone:o.phone,brand:o.brand,source:o.source,stage:o.stage,nextFU:o.nextFU,fuStep:o.fuStep,notes:o.notes,created:o.created,createdDay:o.createdDay,historyCount:(o.history||[]).length};
  return o;
}
function record(col,body,prev){
  LAST[col+"/"+body.id]=body;
  const v={h:fp(body),n:nameOf(col,body,body.id)},sh=shardOf(col,body.id);
  (H.shards[sh]=H.shards[sh]||{})[body.id]=v;
  (H.pend[sh]=H.pend[sh]||{})[body.id]=v;
  H.queue.push({t:Date.now(),col,id:body.id,act:prev?"cambio":"crear",txt:describe(col,prev,body).slice(0,600),dev:DEV,snap:snapOf(col,body)});
  clearTimeout(H.timer);H.timer=setTimeout(flushHist,800);
}
async function flushHist(){
  if(H.busy||!S.db||!H.ready){clearTimeout(H.timer);H.timer=setTimeout(flushHist,1500);return}
  H.busy=true;
  try{
    const pend=H.pend;H.pend={};
    for(const [sh,m] of Object.entries(pend)){
      const ref=S.db.collection("huellas").doc(sh),full=()=>ref.set({col:sh.split("-")[0],h:{...H.shards[sh]}});
      try{if(H.known.has(sh))await ref.update({h:m});else{await full();H.known.add(sh)}}
      catch(e){try{if(e.code==="invalid_argument"){await full();H.known.add(sh)}else throw e}catch(e2){H.pend[sh]={...m,...(H.pend[sh]||{})}}}
    }
    if(H.queue.length){
      const batch=H.queue.splice(0),k=today();
      if(!H.chunk||H.chunk.day!==k)H.chunk={day:k,n:1,entries:[]};
      let entries=H.chunk.entries.concat(batch);
      if(JSON.stringify(entries).length>180000&&H.chunk.entries.length){H.chunk={day:k,n:H.chunk.n+1,entries:[]};entries=batch.slice()}
      try{await S.db.collection("historial").doc(`${k}_${TAB}_${H.chunk.n}`).set({day:k,tab:TAB,dev:DEV,n:H.chunk.n,entries});H.chunk.entries=entries}
      catch(e){H.queue=batch.concat(H.queue)}
    }
  }finally{H.busy=false}
  if(H.queue.length||Object.keys(H.pend).length){clearTimeout(H.timer);H.timer=setTimeout(flushHist,3000)}
}
window.addEventListener("pagehide",()=>{flushHist()});
function alertar(col,id,tipo,h,name){
  if(!S.db)return;
  const aid=(col+"_"+id+"_"+tipo+"_"+h).replace(/[^A-Za-z0-9_\-.~:@+]/g,"_").slice(0,190);
  if(H.alerts[aid])return;
  const what=LABEL[col]||col;
  const a={t:Date.now(),day:today(),col,docId:id,tipo,nombre:name,dev:DEV,txt:tipo==="borrado"?`Se borró ${what} “${name}” por fuera del portal`:tipo==="cambiado"?`Se cambió ${what} “${name}” por fuera del portal`:`Apareció ${what} “${name}” creado por fuera del portal`};
  H.alerts[aid]={...a,id:aid};
  S.db.collection("alertas").doc(aid).set(a).catch(()=>{delete H.alerts[aid]});
}
function detect(){
  if(H.detected||!H.ready||!["leads","sales","tasks","days"].every(c=>FRESH[c]))return;
  H.detected=true;
  for(const [sh,m] of Object.entries(H.shards)){
    const col=sh.split("-")[0];if(!LABEL[col])continue;
    for(const [id,v] of Object.entries(m)){
      const raw=RAW[col+"/"+id];
      if(raw===undefined)alertar(col,id,"borrado",v.h,v.n||id);
      else{const ch=fp(raw);if(ch!==v.h)alertar(col,id,"cambiado",ch,nameOf(col,raw,id))}
    }
  }
  for(const col of Object.keys(LABEL))for(const id of Object.keys(S[col]||{})){
    if(!(H.shards[shardOf(col,id)]||{})[id]){const raw=RAW[col+"/"+id];if(raw)alertar(col,id,"creado",fp(raw),nameOf(col,raw,id))}
  }
  if(S.tab==="historial")histRender();
  setTimeout(migrateNoName,1500);
}
async function bootHist(db){
  try{
    const snap=await db.collection("huellas").get();
    snap.docs.forEach(d=>{const b=d.data()||{};H.known.add(d.id);H.shards[d.id]={...(b.h||{}),...(H.shards[d.id]||{})}});
    H.ready=true;
  }catch(e){setTimeout(()=>bootHist(db),5000);return}
  db.collection("alertas").onSnapshot(s=>{const m={};s.docs.forEach(d=>m[d.id]={...d.data(),id:d.id});H.alerts=m;paintTabs();if(S.tab==="historial")histRender()},()=>{});
  db.collection("pedidos_claude").onSnapshot(s=>{const m={};s.docs.forEach(d=>m[d.id]={...d.data(),id:d.id});H.pedidos=m;if(S.tab==="historial")histRender()},()=>{});
  flushHist();detect();
}
function histRender(){const a=document.activeElement;if(S.dragging||(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)))return;render()}
function ensureHistDay(k){
  if(H.day===k||!S.db)return;
  H.day=k;H.dayDocs={};if(H.unsubDay)H.unsubDay();
  H.unsubDay=S.db.collection("historial").where("day","==",k).onSnapshot(s=>{const m={};s.docs.forEach(d=>m[d.id]=d.data());H.dayDocs=m;if(S.tab==="historial")histRender()},()=>{});
}
function vHistorial(){
  const sel=S.histDay||today();
  ensureHistDay(sel);
  const al=Object.values(H.alerts).sort((a,b)=>b.t-a.t);
  const pe=Object.values(H.pedidos).sort((a,b)=>b.t-a.t);
  const ents=Object.values(H.dayDocs).flatMap(d=>d.entries||[]).sort((a,b)=>b.t-a.t);
  return `
  <section class="panel">
    <div class="panel-h"><h2>Historial</h2></div>
    <p class="muted" style="margin:0">Todo lo que se hace en el portal queda anotado aquí con la hora y el equipo desde donde se hizo. Desde el portal no se puede borrar nada.</p>
  </section>
  <section class="panel" ${al.length?'style="border-color:var(--bad)"':""}>
    <div class="panel-h"><h2>Alertas</h2><span class="pill ${al.length?"bad":"on"}">${al.length?al.length+" alerta"+(al.length>1?"s":""):"Sin alertas"}</span></div>
    <p class="muted" style="margin:0;font-size:.88rem">Registros borrados, cambiados o creados por fuera del portal (por ejemplo, pidiéndoselo a Claude en el chat). Se revisa cada vez que se abre el portal.</p>
    <div class="list">${al.length?al.map(a=>`<div class="row late"><div class="main"><div class="t" style="white-space:normal">${esc(a.txt)}</div><div class="s">Detectado ${fmtWhen(a.t)} · al abrir el portal en ${esc(a.dev||"—")}</div></div></div>`).join(""):`<div class="empty">Nada borrado ni cambiado por fuera del portal.</div>`}</div>
  </section>
  <section class="panel">
    <div class="panel-h"><h2>Pedidos hechos a Claude</h2><span class="muted">${pe.length}</span></div>
    <p class="muted" style="margin:0;font-size:.88rem">Cuando alguien le pide a Claude en el chat que cambie o borre algo del portal, Claude lo anota aquí antes de hacerlo.</p>
    <div class="list">${pe.length?pe.map(p=>`<div class="row"><div class="main"><div class="t" style="white-space:normal">${esc(p.pedido)}</div><div class="s" style="white-space:normal">${fmtWhen(p.t)}${p.accion?" · "+esc(p.accion):""}</div></div></div>`).join(""):`<div class="empty">Nadie le ha pedido cambios a Claude.</div>`}</div>
  </section>
  <section class="panel">
    <div class="panel-h"><h2>Registro del día</h2><input type="date" id="hDay" value="${sel}" max="${today()}" aria-label="Día del registro" style="border:1px solid var(--line);border-radius:9px;padding:6px 8px;background:var(--bg)"></div>
    <div class="tl">${ents.length?ents.map(e=>`<div class="ci"><div class="h">${hhmm(e.t)}</div><div class="b"><div>${esc(e.txt)}</div><div class="muted" style="font-size:.8rem">${esc(e.dev||"")}</div></div></div>`).join(""):`<div class="empty">No hay registros este día.</div>`}</div>
  </section>`;
}

function dayDoc(k){return S.days[k]||{id:k,start:null,end:null,checkins:[],content:{},abbaAnswered:0,abbaPending:0,notes:""}}
async function saveDay(d){S.days[d.id]=d;render();await save("days",d)}

// ---------- derived ----------
function callsOn(k){
  let nw=0,fu=0,ans=0,cn=0,cf=0,cans=0;
  for(const l of Object.values(S.leads))for(const h of (l.history||[])){
    if(h.day!==k||!MINE(h))continue;
    if(h.kind==="call"){if(h.isNew)nw++;else fu++;if(h.outcome!=="no_contesto")ans++}
    else if(h.kind==="chat"){if(h.isNew)cn++;else cf++;if(h.outcome!=="no_contesto")cans++}
  }
  return {nw,fu,ans,cn,cf,cans,chats:cn+cf};
}
function newCallsToday(l,k){return (l.history||[]).filter(h=>h.kind==="call"&&h.day===k&&h.isNew).length}
const orders = ()=>Object.values(S.sales).filter(s=>s.status!=="cancelada"); // canceladas no cuentan en ventas, cobros ni comisiones
const cancelled = (a,b)=>Object.values(S.sales).filter(s=>s.status==="cancelada"&&(!a||inRange(s.cancelDay,a,b))).sort((x,y)=>(y.cancelT||0)-(x.cancelT||0));
function ordersCreatedOn(k){return salesBetween(k,k)}
function ordersPaidOn(k){return paidBetween(k,k)}
function commissionOf(s){return MINE(s)&&COMMISSION_BRANDS.includes(s.brand)?s.total*COMMISSION:0}
function inRange(k,a,b){return !!k&&k>=a&&k<=b}
// Extras añadidos después (s.addons): cada uno suma en ventas el día en que se añadió.
const addSum=arr=>arr.reduce((x,e)=>x+(e.amount||0),0);
function addonSlice(s,adds,base){
  const ex=adds.filter(e=>e.kind!=="delivery"&&e.kind!=="ajuste"),dl=adds.filter(e=>e.kind==="delivery");
  if(base){const tot=s.total-addSum((s.addons||[]).filter(e=>!adds.includes(e)));return adds.length||tot!==s.total?{...s,total:tot,extras:[...(s.extras||[]),...ex.map(e=>({name:e.concept}))],extrasAmt:(s.extrasAmt||0)+addSum(ex),deliveryAmt:(s.deliveryAmt||0)+addSum(dl)}:s}
  return {...s,_addonOnly:true,_full:s.total,saleDay:adds[0].day,total:addSum(adds),natQty:0,dyeQty:0,extras:ex.map(e=>({name:e.concept})),extrasAmt:addSum(ex),deliveryAmt:addSum(dl),product:(adds.every(e=>e.kind==="ajuste")?"AJUSTE: ":"EXTRA añadido: ")+adds.map(e=>e.concept+" "+money(e.amount)).join(", ")};
}
function salesBetween(a,b){
  const out=[];
  orders().filter(MINE).forEach(s=>{const adds=(s.addons||[]).filter(e=>inRange(e.day,a,b));
    if(inRange(s.saleDay,a,b))out.push(addonSlice(s,adds,true));
    else if(adds.length)out.push(addonSlice(s,adds,false));});
  return out;
}
// Pagos completos en el rango (lo que genera comisión): la orden base el día que pagaron el total, y los extras añadidos a una orden ya pagada el día que se pagó el extra.
function paidBetween(a,b){
  const out=[];
  orders().filter(MINE).forEach(s=>{const sep=(s.addons||[]).filter(e=>e.sep),setl=sep.filter(e=>inRange(e.settledDay,a,b));
    const baseIn=!!s.paidDay&&inRange(s.paidDay,a,b)&&(s.status==="pagada"||sep.length>0);
    const amt=(baseIn?s.total-addSum(sep):0)+addSum(setl);
    if(baseIn||setl.length)out.push({...s,_full:s.total,total:amt});});
  return out;
}
function commPendOf(s){if(!MINE(s)||s.status==="pagada")return 0;const amt=s.paidDay?addSum((s.addons||[]).filter(e=>e.sep&&!e.settledDay)):s.total;return COMMISSION_BRANDS.includes(s.brand)?amt*COMMISSION:0}
function sumTotal(arr){return arr.reduce((x,s)=>x+(s.total||0),0)}
function productStats(arr){
  const r={orders:arr.filter(s=>!s._addonOnly).length,total:0,nat:0,dye:0,extrasAmt:0,extrasCount:0,delivery:0,deliveries:0,byBrand:{}};
  arr.forEach(s=>{r.total+=s.total||0;r.nat+=s.natQty||0;r.dye+=s.dyeQty||0;r.extrasAmt+=s.extrasAmt||0;r.extrasCount+=(s.extras||[]).length;r.delivery+=s.deliveryAmt||0;if(s.deliveryAmt)r.deliveries++;r.byBrand[s.brand]=(r.byBrand[s.brand]||0)+(s.total||0)});
  r.ticket=r.orders?r.total/r.orders:0;
  return r;
}
function fuQueue(){
  const end=atHour(addDays(today(),1),0);
  return Object.values(S.leads).filter(l=>l.nextFU&&l.nextFU<end&&!["vendido","frio"].includes(l.stage))
    .sort((a,b)=>(PRIORITY[a.stage]-PRIORITY[b.stage])||(a.nextFU-b.nextFU));
}
function newQueue(){
  const k=today();
  return Object.values(S.leads).filter(l=>(l.fuStep||0)===0&&!["vendido","frio"].includes(l.stage)&&newCallsToday(l,k)<2)
    .sort((a,b)=>((a.source==="Base antigua")-(b.source==="Base antigua"))||(b.created-a.created));
}
function tasksDue(){const end=atHour(addDays(today(),1),0);return Object.values(S.tasks).filter(t=>!t.done&&t.due&&t.due<end)}
function confirmQueue(){const k=today();return orders().filter(s=>s.status!=="pagada"&&s.deliveryDay&&s.deliveryDay<=k&&s.snoozeDay!==k).sort((a,b)=>a.deliveryDay.localeCompare(b.deliveryDay))}
function ordersFor(k){return orders().filter(s=>s.deliveryDay===k).sort((a,b)=>a.created-b.created)}
function openTasksFor(id){return Object.values(S.tasks).filter(t=>!t.done&&t.leadId===id).length}
function weeklySentFor(ws){const sun=addDays(ws,6);return dayDoc(sun).weeklySent||null}

// ---------- shift / clock ----------
const shiftBtn=document.getElementById("shiftBtn"), shiftPill=document.getElementById("shiftPill"), shiftTxt=document.getElementById("shiftTxt");
function dur(ms){const m=Math.max(0,Math.round(ms/6e4));return Math.floor(m/60)+" h "+pad(m%60)+" min"}
function paintClock(){
  document.getElementById("clk").textContent=hhmm();
  const d=dayDoc(today());
  if(d.start&&!d.end){shiftPill.className="pill on";shiftTxt.textContent="En turno · "+dur(Date.now()-d.start);shiftBtn.textContent="Terminar turno";shiftBtn.className="btn";shiftBtn.disabled=false}
  else if(d.start&&d.end){shiftPill.className="pill";shiftTxt.textContent="Turno cerrado · "+dur(d.end-d.start);shiftBtn.textContent="Turno cerrado";shiftBtn.className="btn ghost";shiftBtn.disabled=true}
  else{shiftPill.className="pill";shiftTxt.textContent="Fuera de turno";shiftBtn.textContent="Empezar turno";shiftBtn.className="btn pri";shiftBtn.disabled=false}
}
shiftBtn.onclick=async()=>{
  const d={...dayDoc(today())};
  if(d.start&&!d.end){
    if(!shiftBtn.dataset.confirm){shiftBtn.dataset.confirm="1";shiftBtn.textContent="Toca otra vez para cerrar";setTimeout(()=>{delete shiftBtn.dataset.confirm;paintClock()},4000);return}
    delete shiftBtn.dataset.confirm;d.end=Date.now();await saveDay(d);toast("Turno cerrado. Revisa y envía tu reporte.");S.tab="reporte";render()
  }
  else if(!d.start){d.start=Date.now();d.checkins=[...(d.checkins||[]),{t:Date.now(),slot:"inicio",text:"Empecé turno"}];await saveDay(d);toast("Turno iniciado."+(SHOW_THEME?" Hoy toca: "+THEMES[dow(today())].w:""))}
  paintClock();
};
setInterval(()=>{paintClock();checkinTick()},30000);

// ---------- hourly check-in ----------
let ciOpen=false;
function checkinTick(){
  if(ciOpen||!S.ready.days||S.dragging)return;
  const d=dayDoc(today());if(!d.start||d.end)return;
  const h=coHour();
  const slot=CHECK_HOURS.filter(x=>x<=h&&atHour(today(),x)>d.start-30*6e4).pop();
  if(slot===undefined)return;
  if((d.checkins||[]).some(c=>c.slot===String(slot)))return;
  openCheckin(slot);
}
function progressText(){
  const k=today(),c=callsOn(k),d=dayDoc(k),ct=d.content||{};
  const ws=weekStart(k),wk=sumTotal(salesBetween(ws,addDays(ws,6)));
  return `${SHOW_THEME?`Tema de contenido de hoy: ${THEMES[dow(k)].w}. `:""}Llamadas nuevas ${c.nw}/${GOAL_NEW}, follow-ups ${c.fu}/${GOAL_FU}, chats con clientes en inglés ${c.chats}/${GOAL_CHAT} (aparte de las llamadas), ${LEGACY?`historias Gaby ${ct.gabyStories||0}/3, post Gaby ${ct.gabyPost||0}/1, historias Ruiz ${ct.ruizStories||0}/3, post Ruiz ${ct.ruizPost||0}/1, versículo ABBA ${ct.abbaVerse||0}/1, videos ABBA ${ct.abbaVideos||0}`:contentLine(ct)}. Ventas de la semana ${money(wk)} de una meta de ${fmtGoal(SALES_GOALS.week[0])} (meta alta ${fmtGoal(SALES_GOALS.week[1])}). Follow-ups pendientes ${fuQueue().length}, leads sin llamar ${newQueue().length}.`;
}
function openCheckin(slot){
  ciOpen=true;
  const label=slot===20?"Cierre de las 8:00 p. m.":"Check-in de las "+(slot-12)+":00 p. m.";
  layer.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="ciT"><div class="card2">
    <span class="lbl">${esc(label)}</span><h2 id="ciT">¿En qué estás ahora?</h2>
    <p class="muted" style="margin:0">Cuenta en una o dos líneas qué hiciste la última hora y qué sigue.</p>
    <div class="fld"><textarea id="ciTxt" placeholder="Ej: Llamé a 15 de la base, 3 interesados. Ahora voy con las historias de Ruiz."></textarea></div>
    <div id="ciAi" class="ai" hidden></div>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" id="ciLater" type="button">Después</button><button class="btn pri" id="ciSend" type="button">Enviar check-in</button></div>
  </div></div>`;
  document.title="Check-in pendiente · "+PT;
  const ta=document.getElementById("ciTxt");ta.focus();
  const done=()=>{layer.innerHTML="";document.title=PT;ciOpen=false};
  document.getElementById("ciLater").onclick=()=>{layer.innerHTML="";document.title=PT;setTimeout(()=>{ciOpen=false},10*6e4)};
  document.getElementById("ciSend").onclick=async()=>{
    const text=ta.value.trim();if(!text){ta.focus();return}
    const btn=document.getElementById("ciSend");btn.disabled=true;btn.textContent="Guardando…";
    const entry={t:Date.now(),slot:String(slot),text,ai:""};
    const d={...dayDoc(today())};d.checkins=[...(d.checkins||[]),entry];await saveDay(d);
    if(!S.sample){done();toast("Check-in guardado");return}
    const box=document.getElementById("ciAi");box.hidden=false;box.textContent="Pensando…";
    try{
      const prompt=`${CFG.coachIntro||`Eres el coach de ventas de ${SHORT}. Metas diarias: ${GOAL_NEW} llamadas a leads nuevos, ${GOAL_FU} follow-ups y ${CONTENT.length?contentLine({},1):"chats en inglés "+GOAL_CHAT}. Meta de ventas: ${fmtGoal(SALES_GOALS.week[0])} por semana (meta alta ${fmtGoal(SALES_GOALS.week[1])}). Su ingreso es mayormente comisión del ${PCT} sobre ventas pagadas.`}\nHora: ${hhmm()} (${CFG.tzLabel}). Progreso: ${progressText()}\nSu check-in: "${text}"\nResponde en español de Colombia, de tú, máximo 2 frases cortas: reconoce lo hecho con un número concreto y dile exactamente qué priorizar la próxima hora para llegar a las metas. Sin emojis ni saludos.`;
      const {text:ai}=await S.sample(prompt,{modelTier:"quick",cache:false,onText:({text})=>{box.textContent=text}});
      const d2={...dayDoc(today())};d2.checkins=(d2.checkins||[]).map(c=>c.t===entry.t?{...c,ai}:c);await saveDay(d2);
    }catch(e){box.textContent="Check-in guardado."}
    btn.textContent="Listo";btn.disabled=false;btn.onclick=done;
  };
}

// ---------- tabs ----------
const TABS=[["hoy","Hoy"],["leads","Leads"],["ordenes","Órdenes"],...(CFG.orderCreator?[["crear","Crear orden"]]:[]),["tareas","Tareas"],["reporte","Reporte"],["resumen","Resumen"],["historial","Historial"],["guia","Guía"]];
function paintTabs(){
  const k=today();
  const badges={hoy:fuQueue().length,ordenes:confirmQueue().length,tareas:tasksDue().length,reporte:(dow(k)===0&&!weeklySentFor(weekStart(k)))?1:0,historial:Object.keys(H.alerts).length};
  document.getElementById("tabs").innerHTML=TABS.map(([key,n])=>`<button class="tab" role="tab" type="button" data-tab="${key}" aria-selected="${S.tab===key}">${n}${badges[key]?`<span class="badge">${badges[key]}</span>`:""}</button>`).join("");
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;try{localStorage.setItem("ps_tab",S.tab)}catch(e){};render();window.scrollTo(0,0)});
}

// ---------- render ----------
let sortables=[];
function render(){
  if(S.dragging)return;
  paintTabs();paintClock();
  sortables.forEach(s=>{try{s.destroy()}catch(e){}});sortables=[];
  const banner=S.offline?`<div class="banner">No se pudo conectar con la base de datos todavía. Lo que ves puede estar desactualizado.</div>`:"";
  const fn={hoy:vHoy,leads:vLeads,ordenes:vOrdenes,crear:vCrear,tareas:vTareas,reporte:vReporte,resumen:vResumen,historial:vHistorial,guia:vGuia}[S.tab]||vHoy;
  view.innerHTML=banner+topNotices()+fn();
  bind();P.hydrateBlobs(view);
  if(S.openLead)openLead(S.openLead,true);
}
function topNotices(){
  let out="";
  const k=today();
  if(dow(k)===0&&!weeklySentFor(weekStart(k))&&S.tab!=="reporte")out+=`<div class="notice"><div class="main"><b>Hoy es domingo: manda tu reporte semanal a Isnel</b><div class="muted" style="font-size:.88rem">A cualquier hora de hoy. Ya está armado, solo cópialo y envíalo.</div></div><button class="btn pri sm" type="button" data-goto="reporte">Ir al reporte</button></div>`;
  const q=confirmQueue();
  if(q.length&&S.tab!=="ordenes"){const s=q[0];
    out+=`<div class="notice" role="status"><div class="main"><b>${s.deliveryDay===k?"Entrega hoy":"Entrega "+relDay(s.deliveryDay)}: orden ${esc(ordNo(s))} · ${esc(s.client)}</b><div class="muted" style="font-size:.88rem">Falta cobrar ${money(s.total-s.paid)} de ${money(s.total)}. ¿Ya pagaron completo?${q.length>1?` · ${q.length-1} orden${q.length>2?"es":""} más por confirmar`:""}</div></div>
    <button class="btn ok sm" type="button" data-paidfull="${s.id}">Sí, pagaron completo</button><button class="btn sm" type="button" data-snooze="${s.id}">Todavía no</button></div>`}
  return out;
}
function goalRow(name,val,goal,sub,key){
  const pct=Math.min(100,Math.round(val/goal*100));
  const ctrl=`<span class="count">${val}/${goal}</span>${key?`<button class="step" type="button" data-inc="${key}" aria-label="Sumar uno a ${esc(name)}">+</button>`:""}`;
  return `<div class="goal ${val>=goal?"done":""}"><div><div class="name">${esc(name)}</div>${sub?`<div class="sub">${esc(sub)}</div>`:""}</div><div class="ctrl">${ctrl}</div><div class="bar"><i style="width:${pct}%"></i></div></div>`;
}
function salesMeter(title,val,goals,sub){
  const top=goals[1]*1.0;const pct=v=>Math.min(100,v/top*100);
  const hitBase=val>=goals[0],hitTop=val>=goals[1];
  const status=hitTop?`<span class="pill on">Meta alta lograda</span>`:hitBase?`<span class="pill on">Meta base lograda · faltan ${money(goals[1]-val)} para la alta</span>`:`<span class="pill warn">Faltan ${money(goals[0]-val)} para la meta base</span>`;
  return `<div class="meter"><div class="head"><div><div class="lbl">${esc(title)}</div><div class="big">${money(val)}</div>${sub?`<div class="muted" style="font-size:.85rem">${sub}</div>`:""}</div>${status}</div>
    <div class="track" role="img" aria-label="${esc(title)}: ${money(val)} de ${money(goals[0])} y ${money(goals[1])}"><div class="fill ${hitBase?"base":""}" style="width:${pct(val)}%"></div><div class="tick" style="left:${pct(goals[0])}%"></div><div class="tick" style="left:calc(100% - 2px)"></div></div>
    <div class="ticks"><span style="left:${pct(goals[0])}%">Meta base<br><b class="num">${money(goals[0])}</b></span><span style="left:100%">Meta alta<br><b class="num">${money(goals[1])}</b></span></div></div>`;
}
// ---------- leads sin nombre: consecutivo "Cliente #N" por orden de creación ----------
const NONAME=/^\s*(n\.?\s*n\.?|sin\s*nombre|no\s*name|-+|\.+|x+|\?+)\s*$/i;
function nextClientNo(){let m=0;Object.values(S.leads).forEach(l=>{const r=/^Cliente #(\d+)$/.exec(l.name||"");if(r)m=Math.max(m,+r[1])});return m+1}
let MIGRATING=false,MIGRATED=false;
async function migrateNoName(){
  if(MIGRATING||MIGRATED||!S.db||S.offline)return;
  const list=Object.values(S.leads).filter(l=>NONAME.test(l.name||"")).sort((a,b)=>(a.created||0)-(b.created||0)||String(a.id).localeCompare(String(b.id)));
  if(!list.length){MIGRATED=true;return}
  MIGRATING=true;let n=nextClientNo();
  for(const l of list){
    const cur=S.leads[l.id];if(!cur||!NONAME.test(cur.name||""))continue;
    const name="Cliente #"+(n++),k=today();
    const nl={...cur,name,history:[...(cur.history||[]),{t:Date.now(),day:k,kind:"note",text:"Sin nombre → numerado como "+name}]};
    S.leads[nl.id]=nl;
    if(!(await save("leads",nl,true))){n--;S.leads[l.id]=cur;break}
    await sleep(120);
  }
  MIGRATING=false;MIGRATED=!Object.values(S.leads).some(l=>NONAME.test(l.name||""));
  render();
}
function leadRow(l,extra){
  const st=STAGES[l.stage]||STAGES.nuevo;
  const late=l.nextFU&&l.nextFU<Date.now();
  return `<div class="row click ${extra||""}" data-lead="${l.id}" tabindex="0"><div class="main"><div class="t">${esc(l.name)}</div><div class="s">${l.lang==="en"?"Inglés · ":""}${esc(l.brand)} · ${esc(l.phone||"sin número")}${l.nextFU?` · ${late?"vencido ":""}${fmtWhen(l.nextFU)}`:""}${l.source==="Base antigua"?" · base":""}</div></div><span class="pill ${st.c}">${st.n}</span></div>`;
}

function vHoy(){
  const k=today(),c=callsOn(k),d=dayDoc(k),ct=d.content||{},th=THEMES[dow(k)];
  const created=ordersCreatedOn(k),paid=ordersPaidOn(k);
  const comm=paid.reduce((a,s)=>a+commissionOf(s),0);
  const nq=newQueue(), fq=fuQueue(), td=tasksDue(), tom=ordersFor(addDays(k,1));
  const ws=weekStart(k),wk=sumTotal(salesBetween(ws,addDays(ws,6)));
  const ci=(d.checkins||[]).slice().sort((a,b)=>a.t-b.t);
  return `
  ${PROPOSAL?proposalBanner():""}
  ${SHOW_THEME?`<section class="theme"><div class="day">${th.d}</div><div class="what">${dow(k)===0?th.w:"Contenido de hoy: "+th.w}</div><div class="how">${th.h}</div></section>`:""}
  <section class="panel">${salesMeter("Ventas de esta semana",wk,SALES_GOALS.week,`Semana del ${fmtDay(ws)} al ${fmtDay(addDays(ws,6))} · ${salesBetween(ws,addDays(ws,6)).length} órdenes`)}</section>
  <section class="summary">
    <div class="stat"><span class="lbl">Llamadas hoy</span><b>${c.nw+c.fu}</b><span class="muted">${c.ans} contestaron</span></div>
    <div class="stat"><span class="lbl">Chats hoy (inglés)</span><b>${c.chats}/${GOAL_CHAT}</b><span class="muted">${c.cans} respondieron</span></div>
    <div class="stat"><span class="lbl">Vendido hoy</span><b>${money(sumTotal(created))}</b><span class="muted">${created.filter(s=>!s._addonOnly).length} orden${created.filter(s=>!s._addonOnly).length===1?"":"es"}${created.some(s=>s._addonOnly)?" + extras":""}</span></div>
    ${COMMISSION?`<div class="stat hl"><span class="lbl">Comisión ganada hoy</span><b>${money(comm)}</b><span class="muted">pagos completos de hoy</span></div>`:""}
    <div class="stat"><span class="lbl">Entregas mañana</span><b>${tom.length}</b><span class="muted">${tom.filter(s=>s.status!=="pagada").length} por cobrar</span></div>
  </section>
  <div class="grid2">
    <section class="panel">
      <div class="panel-h"><h2>Metas de hoy</h2><span class="muted">${fmtDay(k)}</span></div>
      <div class="goals">
        ${goalRow("Llamadas a leads nuevos",c.nw,GOAL_NEW,"Solo cuentan las que marcas con “Ya lo llamé” · incluye la base antigua · máximo 2 llamadas por lead al día")}
        ${goalRow("Follow-ups por llamada",c.fu,GOAL_FU,"Leads que ya contactaste antes · solo cuentan con “Ya lo llamé”")}
        ${goalRow("Chats con clientes en inglés",c.chats,GOAL_CHAT,`Se cuentan aparte, no suman a las llamadas · ${c.cn} nuevos · ${c.cf} follow-ups`)}
        ${CONTENT.map(x=>goalRow(x.n,ct[x.k]||0,x.goal,x.sub,x.k)).join("")}
        ${SHOW_THEME?goalRow("Mensajes ABBA respondidos",d.abbaAnswered||0,Math.max(1,d.abbaAnswered||0),"Toca + por cada lead de ABBA que respondas","abbaAnswered"):""}
      </div>
      <div class="lock">Lo que marcas queda guardado y no se puede restar. Si te equivocas, avísale a Isnel.</div>
    </section>
    <section class="panel">
      <div class="panel-h"><h2>Por llamar ahora</h2><button class="btn sm pri" type="button" data-act="newLead">+ Lead</button></div>
      <span class="lbl">Follow-ups de hoy (${fq.length})</span>
      <div class="list">${fq.length?fq.slice(0,12).map(l=>leadRow(l,l.nextFU<Date.now()?"late":"due")).join("")+(fq.length>12?`<button class="more" type="button" data-goto="leads">Ver los ${fq.length} en el tablero</button>`:""):`<div class="empty">No hay follow-ups agendados para hoy.</div>`}</div>
      <span class="lbl">Leads sin llamar (${nq.length})</span>
      <div class="list">${nq.length?nq.slice(0,12).map(l=>leadRow(l)).join("")+(nq.length>12?`<button class="more" type="button" data-goto="leads">Ver los ${nq.length} en el tablero</button>`:""):`<div class="empty">No hay leads pendientes de llamar. Agrega o importa la base desde Leads.</div>`}</div>
      ${td.length?`<span class="lbl">Tareas para hoy (${td.length})</span><div class="list">${td.map(taskRow).join("")}</div>`:""}
    </section>
  </div>
  <section class="panel">
    <div class="panel-h"><h2>Entregas de mañana · ${fmtDay(addDays(k,1))}</h2><button class="btn sm" type="button" data-goto="ordenes">Ver lista para producción</button></div>
    <div class="list">${tom.length?tom.map(orderRow).join(""):`<div class="empty">No hay órdenes para mañana.</div>`}</div>
  </section>
  <section class="panel">
    <div class="panel-h"><h2>Bitácora del turno</h2><span class="muted">Check-in a las 5, 6, 7 y 8 p. m.</span></div>
    ${ci.length?`<div class="tl">${ci.map(x=>`<div class="ci"><div class="h">${hhmm(x.t)}</div><div class="b"><div>${esc(x.text)}</div>${x.ai?`<div class="ai">${esc(x.ai)}</div>`:""}</div></div>`).join("")}</div>`:`<div class="empty">Cuando empieces el turno, aquí queda el registro de cada hora.</div>`}
    ${d.start&&!d.end?`<div><button class="btn sm" type="button" data-act="manualCheckin">Hacer check-in ahora</button></div>`:""}
  </section>`;
}

// ---------- leads: kanban ----------
function leadCard(l){
  const late=l.nextFU&&l.nextFU<Date.now()&&!["vendido","frio"].includes(l.stage);
  const due=l.nextFU&&dayKey(l.nextFU)===today();
  const tk=openTasksFor(l.id);
  const calls=(l.history||[]).filter(h=>h.kind==="call"&&h.day===today()).length;
  return `<div class="card ${late?"late":due?"due":""}" data-lead="${l.id}" data-id="${l.id}" tabindex="0">
    <div class="t">${esc(l.name)}</div>
    <div class="s"><span class="tag ${l.brand==="Gaby Flowers"?"g":""}">${l.brand==="Gaby Flowers"?"Gaby":"ABBA"}</span>${l.lang==="en"?`<span class="tag">Inglés · chat</span>`:""}${l.source==="Base antigua"?`<span class="tag">Base</span>`:""}<span class="num">${esc(l.phone||"sin número")}</span></div>
    ${l.nextFU||tk||calls?`<div class="s">${l.nextFU?`<span>${late?"Vencido · ":""}${fmtWhen(l.nextFU)}</span>`:""}${tk?`<span>· ${tk} tarea${tk>1?"s":""}</span>`:""}${calls?`<span>· ${calls} llamada${calls>1?"s":""} hoy</span>`:""}</div>`:""}
  </div>`;
}
function filteredLeads(){
  const q=S.leadQuery.toLowerCase(),qd=digits(S.leadQuery);
  return Object.values(S.leads).filter(l=>(S.leadBrand==="todas"||l.brand===S.leadBrand)&&(!q||(l.name+" "+(l.notes||"")).toLowerCase().includes(q)||(qd.length>=3&&digits(l.phone).includes(qd))));
}
function vLeads(){
  const ls=filteredLeads();
  const by={};Object.keys(STAGES).forEach(k=>by[k]=[]);
  ls.forEach(l=>(by[l.stage]||by.nuevo).push(l));
  Object.values(by).forEach(arr=>arr.sort((a,b)=>((a.nextFU||9e15)-(b.nextFU||9e15))||((a.source==="Base antigua")-(b.source==="Base antigua"))||(b.created-a.created)));
  const total=Object.keys(S.leads).length, base=Object.values(S.leads).filter(l=>l.source==="Base antigua");
  const baseLeft=base.filter(l=>(l.fuStep||0)===0&&!["frio","vendido"].includes(l.stage)).length;
  return `
  <section class="panel">
    <div class="panel-h"><h2>Tablero de leads</h2><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm pri" type="button" data-act="toggleAdd">${S.showAdd?"Cerrar":"+ Lead nuevo"}</button><button class="btn sm" type="button" data-act="toggleImport">${S.showImport?"Cerrar":"Importar lista"}</button></div></div>
    ${S.showAdd?leadForm():""}
    ${S.showImport?importPanel():""}
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <div class="fld" style="flex:1;min-width:200px"><input id="lq" type="search" placeholder="Buscar por nombre, número o nota" value="${esc(S.leadQuery)}" aria-label="Buscar lead"></div>
      <div class="chips">${[["todas","Todas"],["Gaby Flowers","Gaby"],["ABBA Roses","ABBA"]].map(([k,n])=>`<button class="chip" type="button" data-lb="${k}" aria-pressed="${S.leadBrand===k}">${n}</button>`).join("")}</div>
    </div>
    <div class="muted" style="font-size:.85rem"><span class="num">${total}</span> leads${base.length?` · base antigua: <span class="num">${base.length-baseLeft}/${base.length}</span> ya llamados`:""} · Arrastra las tarjetas entre columnas para cambiar la etapa.</div>
  </section>
  <div class="board" id="board">
    ${Object.entries(STAGES).map(([k,v])=>{const arr=by[k];const lim=S.colLimit[k]||40;return `<div class="col"><div class="col-h"><span>${v.n}</span><span class="n">${arr.length}</span></div>
      <div class="col-b" data-stage="${k}">${arr.slice(0,lim).map(leadCard).join("")}</div>
      ${arr.length>lim?`<div style="padding:0 8px 8px"><button class="more" style="width:100%" type="button" data-more="${k}">Ver ${Math.min(40,arr.length-lim)} más</button></div>`:""}</div>`}).join("")}
  </div>`;
}
function leadForm(){return `<form class="f" id="leadForm">
  <div class="fld"><label for="lfName">Nombre (si no lo sabes, déjalo vacío y queda como "Cliente #")</label><input id="lfName" placeholder="María Pérez"></div>
  <div class="fld"><label for="lfPhone">Teléfono</label><input id="lfPhone" inputmode="tel" placeholder="(305) 555-0123"></div>
  <div class="fld"><label for="lfBrand">Marca</label><select id="lfBrand">${BRANDS_SELL.map(b=>`<option>${b}</option>`).join("")}</select></div>
  <div class="fld"><label for="lfLang">Idioma del cliente</label><select id="lfLang"><option value="es">Español (se llama)</option><option value="en">Inglés (se escribe por chat)</option></select></div>
  <div class="fld"><label for="lfSrc">Entró por</label><select id="lfSrc">${SOURCES.map(s=>`<option>${s}</option>`).join("")}</select></div>
  <div class="fld full"><label for="lfNote">Qué pidió (opcional)</label><input id="lfNote" placeholder="100 rosas rojas para el sábado"></div>
  <div><button class="btn pri" type="submit">Guardar lead</button></div></form>`}
function importPanel(){
  if(S.importing){const p=S.importing;return `<div class="panel" style="background:var(--sunk)"><b id="impTxt">Importando ${p.done}/${p.total}…</b><div class="prog"><i id="impBar" style="width:${Math.round(p.done/p.total*100)}%"></i></div><span class="muted">No cierres la página hasta que termine.</span></div>`}
  return `<form class="f" id="importForm" style="background:var(--sunk);padding:12px;border-radius:12px">
    <div class="fld full"><label for="imText">Pega la lista: un contacto por línea, con nombre y número (sirve copiar columnas de Excel o Google Sheets)</label><textarea id="imText" style="min-height:120px" placeholder="María Pérez, 305 555 0123&#10;Carlos Gómez	786-555-0199&#10;+1 954 555 0101"></textarea></div>
    <div class="fld"><label for="imFile">O sube un archivo .csv / .txt</label><input id="imFile" type="file" accept=".csv,.txt,text/csv,text/plain"></div>
    <div class="fld"><label for="imBrand">Marca</label><select id="imBrand">${BRANDS_SELL.map(b=>`<option>${b}</option>`).join("")}</select></div>
    <div class="fld"><label for="imLang">Idioma de estos clientes</label><select id="imLang"><option value="es">Español (se llaman)</option><option value="en">Inglés (se escribe por chat)</option></select></div>
    <div class="fld"><label for="imSrc">Origen</label><select id="imSrc">${SOURCES.map(s=>`<option ${s==="Base antigua"?"selected":""}>${s}</option>`).join("")}</select></div>
    <div class="full muted" style="font-size:.85rem">Los números repetidos o que ya están en el tablero se saltan solos. Todos entran en la columna “Nuevo”.</div>
    <div><button class="btn pri" type="submit">Importar</button></div></form>`;
}
function parseLines(txt){
  const out=[];
  for(const raw of txt.split(/\r?\n/)){
    const line=raw.trim();if(!line)continue;
    const parts=line.split(/\t|;|,/).map(s=>s.replace(/^"|"$/g,"").trim()).filter(Boolean);
    let phone="",nameParts=[];
    for(const p of parts){if(!phone&&digits(p).length>=7&&/^[\d\s()+.\-]+$/.test(p))phone=p;else nameParts.push(p)}
    if(!phone){const m=line.match(/[+\d][\d\s().\-]{6,}\d/);if(m){phone=m[0].trim();nameParts=[line.replace(m[0],"").replace(/[,;\t]+/g," ").trim()]}}
    const name=nameParts.join(" ").replace(/\s+/g," ").trim();
    if(!phone&&(!name||/^(nombre|name|contacto|telefono|teléfono|phone)/i.test(name)))continue;
    out.push({name:name||("Contacto "+phone),phone});
  }
  return out;
}
async function runImport(rows,brand,source,lang){
  const seen=new Set(Object.values(S.leads).map(l=>digits(l.phone)).filter(Boolean));
  const fresh=[];for(const r of rows){const d=digits(r.phone);if(d&&seen.has(d))continue;if(d)seen.add(d);fresh.push(r)}
  if(!fresh.length){toast("No hay contactos nuevos en esa lista");return}
  const k=today();
  S.importing={done:0,total:fresh.length};render();
  let fails=0;
  for(const r of fresh){
    const now=Date.now();
    const l={id:uid(),name:r.name,phone:r.phone,brand,source,lang:lang||"es",stage:"nuevo",created:now,createdDay:k,notes:"",fuStep:0,nextFU:null,history:[{t:now,day:k,kind:"note",text:"Importado ("+source+")"}]};
    S.leads[l.id]=l;
    if(!await save("leads",l,true))fails++;
    S.importing.done++;
    const p=document.getElementById("impBar");if(p)p.style.width=Math.round(S.importing.done/S.importing.total*100)+"%";
    const b=document.getElementById("impTxt");if(b)b.textContent=`Importando ${S.importing.done}/${S.importing.total}…`;
    await sleep(40);
  }
  S.importing=null;S.showImport=false;render();
  toast(`${fresh.length-fails} contactos importados${fails?` · ${fails} fallaron, impórtalos otra vez`:""}`);
}
function bindBoard(){
  if(!window.Sortable)return;
  view.querySelectorAll(".col-b").forEach(el=>{
    sortables.push(new Sortable(el,{group:"leads",animation:150,ghostClass:"ghostcard",delay:180,delayOnTouchOnly:true,sort:false,
      onStart:()=>{S.dragging=true},
      onEnd:async(ev)=>{
        S.dragging=false;
        const id=ev.item.dataset.id,to=ev.to.dataset.stage;
        const l=S.leads[id];
        if(!l||!to||l.stage===to){render();return}
        await changeStage(l,to);
        if(to==="vendido"){openLead(id);setTimeout(()=>{const b=layer.querySelector('[data-out="vendio"]');b&&b.click()},50)}
      }}));
  });
}
async function changeStage(l,to){
  const n={...l,stage:to,history:[...(l.history||[]),{t:Date.now(),day:today(),kind:"stage",text:"Etapa → "+STAGES[to].n}]};
  if(["frio","vendido"].includes(to))n.nextFU=null;
  if(to!=="nuevo"&&(n.fuStep||0)===0&&!["frio","vendido"].includes(to)){n.fuStep=1;if(!n.nextFU)n.nextFU=atHour(addDays(today(),1),16)}
  S.leads[n.id]=n;render();await save("leads",n);toast("Movido a "+STAGES[to].n);
}

// ---------- orders ----------
function orderLine(s){
  const bits=[];
  if(s.natQty)bits.push(`${s.natQty} naturales`);
  if(s.dyeQty)bits.push(`${s.dyeQty} tinturadas`);
  if((s.extras||[]).length)bits.push(`extras ${money(s.extrasAmt)}`);
  if(s.deliveryAmt)bits.push(`delivery ${money(s.deliveryAmt)}`);
  return bits.join(" · ");
}
function orderRow(s){
  const comm=commissionOf(s),pend=s.status!=="pagada";
  const isImg=(s.fileType||"").startsWith("image/");
  const file=s.fileId?(isImg?`<button type="button" class="btn sm ghost" style="padding:0;border:0" data-viewfile="${s.id}" aria-label="Ver orden de ${esc(s.client)}"><img class="thumb" data-blob="${esc(s.fileId)}" alt="Orden de ${esc(s.client)}"></button>`:`<button class="btn sm" type="button" data-viewfile="${s.id}">Ver PDF</button>`):"";
  const late=pend&&s.deliveryDay&&s.deliveryDay<today();
  return `<div class="row ${pend?(late?"late":"due"):""}">${file}<div class="main"><div class="t">Orden ${esc(ordNo(s))} · ${esc(s.client)} · ${money(s.total)}</div>
    <div class="s">${esc(s.brand)}${s.product?" · "+esc(s.product):""} · entrega ${s.deliveryDay?relDay(s.deliveryDay):"sin fecha"}${s.delivered?" · entregada":""}</div>
    ${orderLine(s)?`<div class="s">${esc(orderLine(s))}</div>`:""}
    <div class="s" style="white-space:normal"><b>Total ${money(s.total)}</b> · ${pend?`pagó ${money(s.paid)} · falta ${money(s.total-s.paid)}`:`pagó ${money(s.paid)} completo · pagada ${relDay(s.paidDay)}${comm?` · +${money(comm)} comisión`:""}`}${(s.payments||[]).length>1?` · pagos: ${(s.payments||[]).map(p=>money(p.amount)+" "+relDay(dayKey(p.t))).join(", ")}`:""}</div>
    ${(s.addons||[]).filter(e=>e.kind!=="ajuste").length?`<div class="s" style="white-space:normal">Extras añadidos: ${(s.addons||[]).filter(e=>e.kind!=="ajuste").map(e=>`${esc(e.concept)} ${money(e.amount)} (${relDay(e.day)}${e.paidNow||e.settledDay?", pagado":", por cobrar"})`).join(" · ")}</div>`:""}${(s.addons||[]).filter(e=>e.kind==="ajuste").length?`<div class="s" style="white-space:normal;color:var(--bad)">Ajustes: ${(s.addons||[]).filter(e=>e.kind==="ajuste").map(e=>`${esc(e.concept)} −${money(-e.amount)} (${relDay(e.day)})`).join(" · ")}${(s.payments||[]).some(p=>p.refund)?` · devuelto al cliente ${money(-(s.payments||[]).filter(p=>p.refund).reduce((a,p)=>a+p.amount,0))}`:""}</div>`:""}</div>
    ${s.status==="cancelada"?`<div class="s" style="white-space:normal;color:var(--bad)"><b>Cancelada ${s.cancelDay?relDay(s.cancelDay):""}</b>${s.cancelReason?" · "+esc(s.cancelReason):""} · se restó ${money(s.total)} de las ventas${s.paid?` · había pagado ${money(s.paid)}`:""}</div>`:""}
    <div class="acts">${s.status==="cancelada"?`<span class="pill bad">Cancelada</span>`:`${pend?`<span class="pill warn">Por cobrar</span><button class="btn sm" type="button" data-pay="${s.id}">Registrar pago</button>`:`<span class="pill on">Pagada</span>`}
    <button class="btn sm" type="button" data-addon="${s.id}">+ Añadir extra</button>
    <button class="btn sm" type="button" data-ajuste="${s.id}">− Restar dinero</button>
    ${s.delivered?"":`<button class="btn sm ghost" type="button" data-deliv="${s.id}">Marcar entregada</button>`}`}</div></div>`;
}
function productionText(k){
  const os=ordersFor(k);
  const lines=[`ÓRDENES PARA ENTREGAR — ${fmtDay(k)}`,`Total: ${os.length} orden${os.length===1?"":"es"}`,``];
  os.forEach((s,i)=>{
    lines.push(`${i+1}. ORDEN ${ordNo(s)} — ${s.client}${s.phone?" · "+s.phone:""} — ${s.brand}`);
    if(s.product)lines.push(`   Pedido: ${s.product}`);
    if(s.natQty||s.dyeQty)lines.push(`   Rosas: ${s.natQty||0} naturales · ${s.dyeQty||0} tinturadas`);
    if((s.extras||[]).length)lines.push(`   Extras: ${s.extras.map(e=>e.name).join(", ")}`);
    if((s.addons||[]).filter(e=>e.kind!=="delivery"&&e.kind!=="ajuste").length)lines.push(`   Extras añadidos después: ${s.addons.filter(e=>e.kind!=="delivery"&&e.kind!=="ajuste").map(e=>e.concept).join(", ")}`);
    if((s.addons||[]).some(e=>e.kind==="ajuste"))lines.push(`   OJO, ajustes: ${s.addons.filter(e=>e.kind==="ajuste").map(e=>e.concept).join(", ")}`);
    if(s.notes)lines.push(`   Detalles: ${s.notes}`);
    lines.push(`   Total ${money(s.total)} · Pagado ${money(s.paid)} · ${s.status==="pagada"?"PAGADA":"POR COBRAR "+money(s.total-s.paid)}`);
    lines.push(``);
  });
  if(!os.length)lines.push("No hay órdenes para ese día.");
  return lines.join("\n");
}
function orderForm(p,lead){
  const dr=S.draft&&S.draft.p===p?S.draft:{};
  const v=(k,def)=>esc(dr[k]??def??"");
  return `<form class="f" id="${p}Form" data-lead="${lead?lead.id:(dr.leadId||"")}">
    <div class="fld full"><label for="${p}File">Orden (PDF, foto o captura)</label>
      <div class="drop" id="${p}Drop">${dr.preview?`<img src="${dr.preview}" alt="Vista previa de la orden">`:dr.fileName?`<b>${esc(dr.fileName)}</b>`:`<span>Sube la misma orden que le mandas a producción. La IA llena los datos sola.</span>`}
      <input id="${p}File" type="file" accept="application/pdf,image/png,image/jpeg,image/webp"></div>
      <span class="muted" id="${p}AiMsg" style="font-size:.85rem"></span></div>
    <div class="fld full"><label for="${p}Txt">O pega el texto de la orden</label><textarea id="${p}Txt" placeholder="Cliente: Ana Ruiz · 100 rosas rojas + globo $15 · delivery $18 · Total $213 · Abonó $100 · Entrega 10 de noviembre">${v("orderText")}</textarea>${S.sample?`<div style="margin-top:6px"><button class="btn sm" type="button" id="${p}Ai">Leer texto con IA</button></div>`:""}</div>
    <div class="fld"><label for="${p}No">Número de orden</label><input id="${p}No" required value="${v("orderNo")}" placeholder="Ej: 1045"></div>
    <div class="fld"><label for="${p}Client">Cliente</label><input id="${p}Client" required value="${v("client",lead&&lead.name)}"></div>
    <div class="fld"><label for="${p}Phone">Teléfono</label><input id="${p}Phone" inputmode="tel" value="${v("phone",lead&&lead.phone)}"></div>
    <div class="fld"><label for="${p}Brand">Marca</label><select id="${p}Brand">${BRANDS_SELL.map(b=>`<option ${(dr.brand||(lead&&lead.brand))===b?"selected":""}>${b}</option>`).join("")}</select></div>
    <div class="fld"><label for="${p}Del">Fecha de entrega</label><input id="${p}Del" type="date" required value="${v("deliveryDay",today())}"></div>
    <div class="fld full"><label for="${p}Prod">Producto</label><input id="${p}Prod" value="${v("product")}" placeholder="Ramo de 100 rosas rojas"></div>
    <div class="sep lbl">Detalle de lo vendido</div>
    <div class="fld"><label for="${p}Nat">Rosas naturales (cantidad)</label><input id="${p}Nat" type="number" min="0" step="1" value="${v("natQty","0")}"></div>
    <div class="fld"><label for="${p}Dye">Rosas tinturadas (cantidad)</label><input id="${p}Dye" type="number" min="0" step="1" value="${v("dyeQty","0")}"></div>
    <div class="fld"><label for="${p}Ext">Extras (separados por coma)</label><input id="${p}Ext" value="${v("extrasTxt")}" placeholder="Globo, oso de peluche"></div>
    <div class="fld"><label for="${p}ExtAmt">Valor de los extras (USD)</label><input id="${p}ExtAmt" type="number" min="0" step="0.01" value="${v("extrasAmt","0")}"></div>
    <div class="fld"><label for="${p}DelAmt">Delivery (USD)</label><input id="${p}DelAmt" type="number" min="0" step="0.01" value="${v("deliveryAmt","0")}"></div>
    <div class="sep lbl">Pago</div>
    <div class="fld"><label for="${p}Total">Total de la orden (USD)</label><input id="${p}Total" type="number" min="0" step="0.01" required value="${v("total")}"></div>
    <div class="fld"><label for="${p}Paid">Ya pagó (USD)</label><input id="${p}Paid" type="number" min="0" step="0.01" value="${v("paid","0")}"></div>
    <div class="fld full"><label for="${p}Notes">Detalles para producción (opcional)</label><input id="${p}Notes" value="${v("notes")}" placeholder="Tarjeta: Feliz aniversario mi amor · entrega 2–4 p. m."></div>
    <div class="full lock">Revisa bien antes de subir: una orden subida ya no se puede editar ni borrar.</div>
    <div><button class="btn pri" type="submit" id="${p}Save">Subir orden</button></div></form>`;
}
let pdfLoading=null;
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
async function pdfLib(){
  if(window.pdfjsLib)return window.pdfjsLib;
  if(!pdfLoading)pdfLoading=(async()=>{
    const base="/portal/vendor/"; // librería servida desde el propio dominio (sirve también desde /portal/<empresa>/)
    await loadScript(base+"pdf.min.js");
    await loadScript(base+"pdf.worker.min.js"); // runs on the main thread: workers from the CDN are blocked
    window.pdfjsLib.GlobalWorkerOptions.workerSrc=base+"pdf.worker.min.js";
    return window.pdfjsLib;
  })();
  return pdfLoading;
}
async function readPdf(file){
  const lib=await pdfLib();
  const doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),disableWorker:true}).promise;
  let text="";
  for(let i=1;i<=Math.min(doc.numPages,3);i++){const pg=await doc.getPage(i);const tc=await pg.getTextContent();text+=tc.items.map(x=>x.str).join(" ")+"\n"}
  const pg=await doc.getPage(1);const vp=pg.getViewport({scale:1.6});
  const cv=document.createElement("canvas");cv.width=vp.width;cv.height=vp.height;
  await pg.render({canvasContext:cv.getContext("2d"),viewport:vp}).promise;
  const img=await new Promise(r=>cv.toBlob(r,"image/png"));
  return {text:text.trim(),img,preview:cv.toDataURL("image/jpeg",.6)};
}
function bindOrderForm(form,p){
  if(!form)return;
  const $=(id)=>form.querySelector("#"+p+id);
  const cur=()=>S.draft&&S.draft.p===p?S.draft:null;
  let file=cur()?cur().file:null, pdfImg=cur()?cur().pdfImg:null, pdfText=cur()?cur().pdfText:"";
  const keep=()=>{S.draft={p,file,pdfImg,pdfText,preview:cur()?cur().preview:null,fileName:file&&file.name,orderText:$("Txt").value,orderNo:$("No").value,client:$("Client").value,phone:$("Phone").value,brand:$("Brand").value,product:$("Prod").value,natQty:$("Nat").value,dyeQty:$("Dye").value,extrasTxt:$("Ext").value,extrasAmt:$("ExtAmt").value,deliveryAmt:$("DelAmt").value,total:$("Total").value,paid:$("Paid").value,deliveryDay:$("Del").value,notes:$("Notes").value,leadId:form.dataset.lead}};
  form.addEventListener("input",keep);
  const setPreview=(src)=>{keep();S.draft.preview=src;const d=$("Drop");const old=d.querySelector("img,span,b");const im=document.createElement("img");im.src=src;im.alt="Vista previa de la orden";if(old)old.replaceWith(im);else d.prepend(im)};
  const msg=$("AiMsg");
  async function extract(txt,img){
    if(!S.sample){msg.textContent="Llena los datos a mano.";return}
    msg.textContent="La IA está leyendo la orden…";
    try{
      const lim=img?await S.sample.limits().catch(()=>null):null;
      const prompt=`Extrae los datos de esta orden de una floristería en Miami (Gaby Flowers o ABBA Roses). Hoy es ${today()} (AAAA-MM-DD). Responde SOLO un objeto JSON con estas claves:
{"numero_orden": string|null (número o código de la orden, ej. "1045"), "cliente": string|null, "telefono": string|null, "marca": "Gaby Flowers"|"ABBA Roses"|null, "producto": string|null (resumen corto, ej. "Ramo 100 rosas rojas"), "rosas_naturales": number (cantidad total de rosas naturales; 0 si no hay), "rosas_tinturadas": number (cantidad de rosas tinturadas, ej. azules o pintadas; 0 si no hay), "extras": [{"nombre": string, "precio": number|null}] (globos, osos, chocolates, toppers, cintas, letras, pétalos, mariposas, etc.; [] si no hay), "delivery": number|null (USD del envío), "total": number|null (USD total de la orden), "abonado": number|null (USD ya pagado; 0 si no dice), "fecha_entrega": "AAAA-MM-DD"|null (convierte "10 de noviembre", "mañana", etc. con la fecha de hoy), "detalles": string|null (mensaje de tarjeta, hora o dirección de entrega)}
No inventes datos que no aparezcan.${txt?"\n\nTexto de la orden:\n"+txt.slice(0,8000):""}`;
      const opts={modelTier:"default",cache:false};
      if(img&&lim&&lim.images)opts.images=[img];
      else if(img&&!txt){msg.textContent="La IA no puede ver imágenes en esta vista. Pega el texto o llena los campos.";return}
      const r=await S.sample.json(prompt,opts);
      if(!r||typeof r!=="object"){msg.textContent="No pude leer la orden. Llena los campos a mano.";return}
      if(r.numero_orden&&!$("No").value)$("No").value=String(r.numero_orden).replace(/^#/,"");
      if(r.cliente)$("Client").value=r.cliente;
      if(r.telefono)$("Phone").value=r.telefono;
      if(r.marca&&BRANDS_SELL.includes(r.marca))$("Brand").value=r.marca;
      if(r.producto)$("Prod").value=r.producto;
      $("Nat").value=Math.max(0,Math.round(nz(r.rosas_naturales)));
      $("Dye").value=Math.max(0,Math.round(nz(r.rosas_tinturadas)));
      const ex=Array.isArray(r.extras)?r.extras.filter(e=>e&&e.nombre):[];
      $("Ext").value=ex.map(e=>e.nombre).join(", ");
      $("ExtAmt").value=ex.reduce((a,e)=>a+nz(e.precio),0);
      if(r.delivery!=null)$("DelAmt").value=nz(r.delivery);
      if(r.total!=null)$("Total").value=nz(r.total);
      if(r.abonado!=null)$("Paid").value=nz(r.abonado);
      if(r.fecha_entrega&&/^\d{4}-\d{2}-\d{2}$/.test(r.fecha_entrega))$("Del").value=r.fecha_entrega;
      if(r.detalles)$("Notes").value=r.detalles;
      keep();msg.textContent="Listo. Revisa que todo esté bien y sube la orden.";
    }catch(e){msg.textContent=e.code==="not_granted"?"La IA no está activada. Llena los campos a mano.":e.code==="rate_limited"?"Muchas solicitudes seguidas; intenta en un rato o llena a mano.":"No pude leer la orden. Llena los campos a mano."}
  }
  $("File").onchange=async()=>{
    file=$("File").files[0]||null;pdfImg=null;pdfText="";keep();
    if(!file)return;
    if(file.type==="application/pdf"||/\.pdf$/i.test(file.name)){
      msg.textContent="Abriendo el PDF…";
      try{const r=await readPdf(file);pdfImg=r.img;pdfText=r.text;setPreview(r.preview);S.draft.pdfImg=pdfImg;S.draft.pdfText=pdfText;await extract(pdfText,pdfImg)}
      catch(e){msg.textContent="No pude abrir el PDF. Pega el texto o llena los campos."}
    }else if(file.type.startsWith("image/")){
      const r=new FileReader();r.onload=()=>setPreview(r.result);r.readAsDataURL(file);
      await extract("",file);
    }
  };
  const ai=$("Ai");
  if(ai)ai.onclick=async()=>{const t=$("Txt").value.trim();if(!t){msg.textContent="Pega primero el texto de la orden.";return}ai.disabled=true;await extract(t,null);ai.disabled=false};
  form.onsubmit=async(e)=>{e.preventDefault();
    const total=nz($("Total").value);let paid=nz($("Paid").value);
    const orderNo=$("No").value.trim().replace(/^#/,"");
    if(!orderNo){toast("Pon el número de orden");$("No").focus();return}
    if(Object.values(S.sales).some(o=>String(o.orderNo||"").toLowerCase()===orderNo.toLowerCase())){toast("Ya hay una orden con el número "+orderNo);$("No").focus();return}
    if(total<=0){toast("Pon el total de la orden");$("Total").focus();return}
    paid=Math.min(paid,total);
    const btn=$("Save");btn.disabled=true;btn.textContent="Subiendo…";
    let fileId=null,fileType=null;
    if(file){
      if(!S.assets)toast("No se pudo guardar el archivo en esta vista; la orden se guarda sin archivo");
      else{try{const r=await S.assets.upload(file,file.type?undefined:{type:"application/pdf"});fileId=r.id;fileType=r.contentType}catch(err){toast(err.code==="too_large"?"El archivo pesa más de 20 MB; se guarda sin archivo":"No se pudo guardar el archivo; la orden se guarda sin él")}}
    }
    const k=today(),full=paid>=total;
    let leadId=form.dataset.lead||"";
    const phone=$("Phone").value.trim();
    if(!leadId&&digits(phone).length>=7){const m=Object.values(S.leads).find(l=>digits(l.phone)===digits(phone));if(m)leadId=m.id}
    const extras=$("Ext").value.split(",").map(x=>x.trim()).filter(Boolean).map(name=>({name}));
    const s={id:uid(),leadId,orderNo,client:$("Client").value.trim(),phone,brand:$("Brand").value,product:$("Prod").value.trim(),
      natQty:Math.max(0,Math.round(nz($("Nat").value))),dyeQty:Math.max(0,Math.round(nz($("Dye").value))),extras,extrasAmt:nz($("ExtAmt").value),deliveryAmt:nz($("DelAmt").value),
      notes:$("Notes").value.trim(),orderText:($("Txt").value.trim()||pdfText||"").slice(0,4000),total,paid,status:full?"pagada":"pendiente",saleDay:k,paidDay:full?k:null,deliveryDay:$("Del").value||k,delivered:false,fileId,fileType,created:Date.now(),payments:paid?[{t:Date.now(),amount:paid}]:[],log:[{t:Date.now(),text:`Orden subida · ${money(total)} · pagado ${money(paid)}`}]};
    S.sales[s.id]=s;S.draft=null;
    if(leadId&&S.leads[leadId]){const l=S.leads[leadId];const n={...l,stage:full?"vendido":"pendiente_pago",nextFU:null,amount:total,history:[...(l.history||[]),{t:Date.now(),day:k,kind:"note",text:`Orden ${money(total)} · entrega ${fmtDay(s.deliveryDay)}${full?" · pagada completa":` · abonó ${money(paid)}`}`}]};if((n.fuStep||0)===0)n.fuStep=1;S.leads[n.id]=n;await save("leads",n)}
    if(S.openLead)closeLead();
    render();await save("sales",s);
    toast(full?`Orden subida y pagada${COMMISSION?" · comisión "+money(commissionOf(s)):""}`:`Orden subida · por cobrar ${money(total-paid)} · te aviso el ${fmtDay(s.deliveryDay)}`);
  };
}
function vOrdenes(){
  const k=today(),tom=addDays(k,1);
  const cq=confirmQueue();
  let os=orders();
  const f=S.orderFilter;
  if(f==="proximas")os=os.filter(s=>s.deliveryDay>=k).sort((a,b)=>a.deliveryDay.localeCompare(b.deliveryDay));
  else if(f==="cobrar")os=os.filter(s=>s.status!=="pagada").sort((a,b)=>(a.deliveryDay||"").localeCompare(b.deliveryDay||""));
  else if(f==="pagadas")os=os.filter(s=>s.status==="pagada").sort((a,b)=>(b.paidDay||"").localeCompare(a.paidDay||""));
  else if(f==="canceladas")os=cancelled();
  else os=os.sort((a,b)=>b.created-a.created);
  const pend=orders().filter(s=>s.status!=="pagada");
  return `
  ${cq.length?`<section class="panel" style="border-color:var(--warn)"><div class="panel-h"><h2>Confirma el pago</h2><span class="pill warn">${cq.length}</span></div>
    <p class="muted" style="margin:0">Estas órdenes ya llegaron a su fecha de entrega y no están pagadas completas. Cuando confirmes el pago completo, la comisión cuenta hoy.</p>
    <div class="list">${cq.map(s=>`<div class="row due"><div class="main"><div class="t">Orden ${esc(ordNo(s))} · ${esc(s.client)} · ${money(s.total)}</div><div class="s">Entrega ${relDay(s.deliveryDay)} · total ${money(s.total)} · pagó ${money(s.paid)} · falta ${money(s.total-s.paid)}</div></div><div class="acts"><button class="btn ok sm" type="button" data-paidfull="${s.id}">Pagaron completo</button><button class="btn sm" type="button" data-pay="${s.id}">Abono parcial</button><button class="btn sm ghost" type="button" data-snooze="${s.id}">Todavía no</button></div></div>`).join("")}</div></section>`:""}
  ${COMMISSION?`<div class="rule"><b>Comisión:</b> el ${PCT} se gana el día que el cliente paga el <b>total</b>. Si abonan hoy y pagan el resto el día de la entrega, la comisión cuenta ese día.</div>`:""}
  <section class="panel"><div class="panel-h"><h2>Subir orden</h2><span class="muted">Cada venta = una orden</span></div>${orderForm("of")}</section>
  <section class="panel">
    <div class="panel-h"><h2>Para producción · ${fmtDay(tom)}</h2><span class="muted">${ordersFor(tom).length} orden${ordersFor(tom).length===1?"":"es"}</span></div>
    <pre class="rep" id="prodText">${esc(productionText(tom))}</pre>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" type="button" data-copy="prodText">Copiar lista</button><a class="btn" href="https://wa.me/?text=${encodeURIComponent(productionText(tom))}" target="_blank" rel="noopener">Abrir en WhatsApp</a></div>
  </section>
  <section class="panel">
    <div class="panel-h"><h2>Órdenes</h2><span class="muted">${pend.length} por cobrar · ${money(pend.reduce((a,s)=>a+s.total-s.paid,0))}</span></div>
    <div class="chips">${[["proximas","Próximas entregas"],["cobrar","Por cobrar"],["pagadas","Pagadas"],["todas","Todas"],["canceladas",`Canceladas (${cancelled().length})`]].map(([k2,n])=>`<button class="chip" type="button" data-of="${k2}" aria-pressed="${f===k2}">${n}</button>`).join("")}</div>
    <div class="list">${os.length?os.map(orderRow).join(""):`<div class="empty">No hay órdenes en esta vista. Sube la primera arriba.</div>`}</div>
  </section>`;
}
async function markPaidFull(s){
  const k=today();
  const n={...s,paid:s.total,status:"pagada",paidDay:s.paidDay||k,addons:(s.addons||[]).map(e=>e.sep&&!e.settledDay?{...e,settledDay:k}:e),payments:[...(s.payments||[]),{t:Date.now(),amount:s.total-s.paid}],log:[...(s.log||[]),{t:Date.now(),text:"Pago completo confirmado"}]};
  S.sales[n.id]=n;
  if(n.leadId&&S.leads[n.leadId]){const l=S.leads[n.leadId];const nl={...l,stage:"vendido",nextFU:null,history:[...(l.history||[]),{t:Date.now(),day:k,kind:"note",text:"Pago completo recibido"}]};S.leads[nl.id]=nl;await save("leads",nl)}
  render();await save("sales",n);
  toast(COMMISSION?`Pagada completa · comisión ${money(paidBetween(k,k).filter(x=>x.id===n.id).reduce((a,x)=>a+commissionOf(x),0))} ganada hoy`:"Pagada completa");
}
function payModal(s){
  if(!s)return;
  const falta=s.total-s.paid;
  layer.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="pmT"><div class="card2">
    <h2 id="pmT">Registrar pago · orden ${esc(ordNo(s))} · ${esc(s.client)}</h2>
    <p class="muted" style="margin:0">Total ${money(s.total)} · ya pagó ${money(s.paid)} · falta <b>${money(falta)}</b></p>
    <div class="fld"><label for="pmAmt">Monto recibido (USD)</label><input id="pmAmt" type="number" min="0" step="0.01" value="${falta}"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" type="button" id="pmNo">Cancelar</button><button class="btn ok" type="button" id="pmOk">Guardar pago</button></div></div></div>`;
  document.getElementById("pmNo").onclick=()=>{layer.innerHTML=""};
  document.getElementById("pmOk").onclick=async()=>{
    const amt=nz(document.getElementById("pmAmt").value);if(amt<=0)return;
    layer.innerHTML="";
    if(s.paid+amt>=s.total){await markPaidFull(s);return}
    const n={...s,paid:s.paid+amt,payments:[...(s.payments||[]),{t:Date.now(),amount:amt}],log:[...(s.log||[]),{t:Date.now(),text:"Abono "+money(amt)}]};
    S.sales[n.id]=n;render();await save("sales",n);toast(`Abono guardado · falta ${money(n.total-n.paid)}`);
  };
}

const ADMIN_EMAIL="isnel2023@gmail.com";
// Correo a Isnel por cualquier cambio en una orden ya registrada (los extras ya mandan su propio correo; "Todavía no" no manda nada)
const PORTAL_NAME=PT;
const ORDER_FIELDS=[["total","Total",1],["paid","Pagado",1],["status","Estado"],["deliveryDay","Entrega"],["delivered","Entregada"],["client","Cliente"],["phone","Teléfono"],["product","Producto"],["orderNo","N.º de orden"],["brand","Marca"],["deliveryAmt","Delivery",1],["extrasAmt","Extras",1],["notes","Notas"]];
async function notifyOrderChange(p,n){
  const ch=ORDER_FIELDS.filter(([k])=>JSON.stringify(p[k]??null)!==JSON.stringify(n[k]??null)).map(([k,l,m])=>`- ${l}: ${m?money(p[k]||0):String(p[k]??"—")} → ${m?money(n[k]||0):String(n[k]??"—")}`);
  const pays=(n.payments||[]).slice((p.payments||[]).length).map(x=>`- Pago registrado: ${money(x.amount)} (${fmtWhen(x.t)})`);
  const logs=(n.log||[]).slice((p.log||[]).length).map(x=>x.text);
  const addedAddon=(n.addons||[]).length>(p.addons||[]).length;
  if(addedAddon&&!ch.filter(x=>!/^- (Total|Pagado|Estado):/.test(x)).length)return; // ya avisó notifyExtra
  if(!ch.length&&!pays.length)return; // p. ej. "Todavía no" (solo pospone el aviso)
  const subj=`${PORTAL_NAME} · Cambio en la orden ${ordNo(n)} (${n.client})`;
  const body=[`Se cambió una orden ya registrada en el ${PORTAL_NAME}.`,``,`Orden: ${ordNo(n)} · ${n.client}${n.phone?" · "+n.phone:""} · ${n.brand}`,``,`QUÉ CAMBIÓ`,...ch,...pays,...(logs.length?[``,`Registro: ${logs.join(" · ")}`]:[]),``,`Ahora: total ${money(n.total)} · pagado ${money(n.paid)}${n.total>n.paid?" · falta "+money(n.total-n.paid):""} · ${n.status}`,`Cuándo: ${fmtWhen(Date.now())} (hora Colombia)`,`Desde: ${DEV}`].join("\n");
  const id=("cambio_"+n.id+"_"+Date.now()).replace(/[^A-Za-z0-9_\-]/g,"_");
  let sent=false,code="";
  try{const mcp=P.mcp;if(!mcp)code="sin_conexion";else{await mcp.callTool("Gmail","send_message",{to:[ADMIN_EMAIL],subject:subj,body});sent=true}}catch(x){code=(x&&x.code)||"error"}
  try{await S.db.collection("avisos_cambios").doc(id).set({t:Date.now(),saleId:n.id,orden:n.orderNo||"",cliente:n.client||"",cambios:[...ch,...pays].join(" | ").slice(0,1500),dev:DEV,enviado:sent,error:code})}catch(x){}
}
async function notifyExtra(prev,n,e){
  const subj=`${PT} · Extra añadido a la orden ${ordNo(n)} (${n.client}) +${money(e.amount)}`;
  const body=[
    `Se añadió un extra a una orden en el ${PT}.`,``,
    `Orden: ${ordNo(n)} · ${n.client}${n.phone?" · "+n.phone:""} · ${n.brand}`,
    `Extra: ${e.concept} (${e.kind==="delivery"?"domicilio / delivery":"extra"})`,
    `Monto: ${money(e.amount)} · ${e.paidNow?"ya lo pagó":"POR COBRAR"}`,
    `Total de la orden: ${money(prev.total)} → ${money(n.total)} · pagado ${money(n.paid)}${n.total>n.paid?" · falta "+money(n.total-n.paid):""}`,
    `Cuándo: ${fmtWhen(e.t)} (hora Colombia)`,
    `Desde: ${DEV}`,``,
    `Al final de este correo el servidor anota quién lo hizo.`
  ].join("\n");
  const id=("extra_"+n.id+"_"+e.t).replace(/[^A-Za-z0-9_\-]/g,"_");
  let sent=false,code="";
  try{
    const mcp=P.mcp;
    if(!mcp)code="sin_conexion";
    else{await mcp.callTool("Gmail","send_message",{to:[ADMIN_EMAIL],subject:subj,body});sent=true}
  }catch(x){code=(x&&x.code)||"error"}
  try{await S.db.collection("avisos_extras").doc(id).set({t:Date.now(),saleId:n.id,orden:n.orderNo||"",cliente:n.client||"",concepto:e.concept,monto:e.amount,dev:DEV,enviado:sent,error:code})}catch(x){}
  if(!sent){
    const why="no se pudo enviar ahora.";
    saveErr(`El extra SÍ se guardó, pero NO se pudo mandar el correo de aviso a Isnel: ${why} Avísale a Isnel por WhatsApp del extra ${e.concept} ${money(e.amount)} en la orden ${ordNo(n)}.`);
  }
  return sent;
}
// Visor del invoice dentro del portal (abrir /_blob en pestaña nueva daba "not found")
async function viewFile(s){
  if(!s||!s.fileId)return;
  const isImg=(s.fileType||"").startsWith("image/");
  layer.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="vfT"><div class="card2" style="max-width:900px;width:calc(100vw - 24px);max-height:92vh;overflow:auto">
    <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap"><h2 id="vfT" style="margin:0">Orden ${esc(ordNo(s))} · ${esc(s.client)}</h2>
    <div style="display:flex;gap:8px"><button class="btn sm" type="button" id="vfX">Cerrar</button></div></div>
    <div id="vfBody" style="display:flex;flex-direction:column;gap:10px;align-items:center"><div class="muted">Cargando el invoice…</div></div></div></div>`;
  let url=null;
  const close=()=>{layer.innerHTML="";if(url)URL.revokeObjectURL(url)};
  document.getElementById("vfX").onclick=close;
  const body=document.getElementById("vfBody");
  try{
    const r=await P.fetchFile(s.fileId);
    if(!r.ok)throw new Error("http "+r.status);
    const blob=await r.blob();url=URL.createObjectURL(blob);
    
    if(isImg){body.innerHTML=`<img src="${url}" alt="Orden de ${esc(s.client)}" style="max-width:100%;height:auto;border-radius:8px">`;return}
    const lib=await pdfLib();
    const doc=await lib.getDocument({data:new Uint8Array(await blob.arrayBuffer()),disableWorker:true}).promise;
    if(!document.getElementById("vfBody"))return;
    body.innerHTML="";
    const w=Math.min(860,body.clientWidth||860);
    for(let i=1;i<=doc.numPages;i++){
      const pg=await doc.getPage(i);const v1=pg.getViewport({scale:1});
      const sc=w/v1.width,dpr=Math.min(2,window.devicePixelRatio||1),vp=pg.getViewport({scale:sc*dpr});
      const cv=document.createElement("canvas");cv.width=vp.width;cv.height=vp.height;cv.style.cssText=`width:${w}px;max-width:100%;height:auto;border:1px solid var(--line,#ddd);border-radius:6px;background:#fff`;
      if(!document.getElementById("vfBody"))return;
      body.appendChild(cv);
      await pg.render({canvasContext:cv.getContext("2d"),viewport:vp}).promise;
    }
  }catch(e){
    if(document.getElementById("vfBody"))body.innerHTML=`<div class="banner">No se pudo abrir el invoice (${esc(String(e&&e.message||e))}). Intenta otra vez o avísale a Isnel.</div>`;
  }
}
function addonModal(s){
  if(!s)return;
  layer.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="adT"><div class="card2">
    <h2 id="adT">Añadir extra · orden ${esc(ordNo(s))} · ${esc(s.client)}</h2>
    <p class="muted" style="margin:0">Para cuando el cliente pide algo más sobre una orden que ya existe (banda personalizada, domicilio, letra, globo…). Se suma al total de la orden y cuenta en las ventas de <b>hoy</b>. Total actual ${money(s.total)}.</p>
    <p class="muted" style="margin:0">Al guardar, a Isnel le llega un correo avisando qué extra se añadió.</p>
    <div class="chips">${[["Banda personalizada","extra"],["Domicilio","delivery"],["Letra","extra"],["Globo","extra"]].map(([n,k])=>`<button class="chip" type="button" data-adq="${n}" data-adk="${k}">${n}</button>`).join("")}</div>
    <div class="fld"><label for="adC">Qué pidieron</label><input id="adC" placeholder="Ej: Banda personalizada"></div>
    <div class="fld"><label for="adK">Tipo</label><select id="adK"><option value="extra">Extra</option><option value="delivery">Domicilio / delivery</option></select></div>
    <div class="fld"><label for="adA">Monto (USD)</label><input id="adA" type="number" min="0" step="0.01" placeholder="15"></div>
    <label style="display:flex;gap:8px;align-items:center"><input id="adP" type="checkbox" checked> Ya lo pagó</label>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" type="button" id="adNo">Cancelar</button><button class="btn ok" type="button" id="adOk">Añadir a la orden</button></div></div></div>`;
  layer.querySelectorAll("[data-adq]").forEach(b=>b.onclick=()=>{document.getElementById("adC").value=b.dataset.adq;document.getElementById("adK").value=b.dataset.adk;document.getElementById("adA").focus()});
  document.getElementById("adNo").onclick=()=>{layer.innerHTML=""};
  document.getElementById("adOk").onclick=async()=>{
    const concept=document.getElementById("adC").value.trim(),amt=nz(document.getElementById("adA").value),paidNow=document.getElementById("adP").checked,kind=document.getElementById("adK").value;
    if(!concept){document.getElementById("adC").focus();return}
    if(amt<=0){document.getElementById("adA").focus();return}
    layer.innerHTML="";
    const k=today(),t=Date.now(),sep=!!s.paidDay;
    const e={t,day:k,concept,kind,amount:amt,paidNow,sep,settledDay:sep&&paidNow?k:null};
    let n={...s,total:s.total+amt,addons:[...(s.addons||[]),e],log:[...(s.log||[]),{t,text:`Extra añadido: ${concept} +${money(amt)} (${paidNow?"pagado":"por cobrar"}) · total ${money(s.total+amt)}`}]};
    if(paidNow){n.paid=s.paid+amt;n.payments=[...(s.payments||[]),{t,amount:amt}]}
    if(n.paid>=n.total){n.status="pagada";n.paidDay=s.paidDay||k}else n.status="pendiente";
    S.sales[n.id]=n;render();const ok=await save("sales",n);
    if(ok){toast(`Extra añadido · orden ahora en ${money(n.total)}${n.status==="pagada"?"":" · falta "+money(n.total-n.paid)}`);
      if(await notifyExtra(s,n,e))toast("Aviso enviado al correo de Isnel");}
  };
}

// ---------- tasks ----------
function taskRow(t){
  const late=t.due&&t.due<Date.now();
  const lead=t.leadId&&S.leads[t.leadId];
  return `<div class="row ${t.done?"":late?"late":"due"}">${t.done?`<span class="pill on">Hecha</span>`:`<button class="btn sm" type="button" data-task="${t.id}">Hecha</button>`}<div class="main"><div class="t" style="${t.done?"text-decoration:line-through;color:var(--muted)":""}">${esc(t.title)}</div><div class="s">${t.due?fmtWhen(t.due):"Sin fecha"}${lead?` · ${esc(lead.name)}`:""}</div></div>${lead?`<button class="btn sm ghost" type="button" data-openlead="${lead.id}">Ver lead</button>`:""}</div>`;
}
function vTareas(){
  const all=Object.values(S.tasks);
  const open=all.filter(t=>!t.done).sort((a,b)=>(a.due||9e15)-(b.due||9e15));
  const done=all.filter(t=>t.done).sort((a,b)=>(b.doneAt||0)-(a.doneAt||0)).slice(0,15);
  const opts=Object.values(S.leads).filter(l=>l.source!=="Base antigua"||l.fuStep).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,500);
  return `
  <section class="panel"><div class="panel-h"><h2>Nueva tarea</h2></div>
  <form class="f" id="taskForm">
    <div class="fld full"><label for="tfTitle">Qué hay que hacer</label><input id="tfTitle" required placeholder="Llamar a Carlos para confirmar dirección"></div>
    <div class="fld"><label for="tfDue">Cuándo (hora Colombia)</label><input id="tfDue" type="datetime-local" value="${msToLocalInput(atHour(addDays(today(),1),16))}"></div>
    <div class="fld"><label for="tfLead">Lead (opcional)</label><select id="tfLead"><option value="">—</option>${opts.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join("")}</select></div>
    <div><button class="btn pri" type="submit">Agregar</button></div>
  </form></section>
  <section class="panel"><div class="panel-h"><h2>Pendientes</h2><span class="muted">${open.length}</span></div>
    <div class="list">${open.length?open.map(taskRow).join(""):`<div class="empty">Sin tareas pendientes.</div>`}</div>
    ${done.length?`<span class="lbl">Hechas recientemente</span><div class="list">${done.map(taskRow).join("")}</div>`:""}
  </section>`;
}

// ---------- reports ----------
function statsLines(st){
  return [`- Rosas naturales: ${st.nat} · Rosas tinturadas: ${st.dye}`,`- Extras: ${st.extrasCount} (${money(st.extrasAmt)}) · Delivery: ${st.deliveries} envíos (${money(st.delivery)})`,`- Ticket promedio: ${money(st.ticket)}`];
}
function dailyReport(k){
  const c=callsOn(k),d=dayDoc(k),ct=d.content||{};
  const created=ordersCreatedOn(k),paid=ordersPaidOn(k),st=productStats(created);
  const comm=paid.reduce((a,s)=>a+commissionOf(s),0);
  const ws=weekStart(k),wk=sumTotal(salesBetween(ws,addDays(ws,6)));
  const lines=[
    `REPORTE DIARIO — ${fmtDay(k)} — ${NAME}`,
    d.start?`Turno: ${hhmm(d.start)} a ${d.end?hhmm(d.end):"(abierto)"}${d.end?` (${dur(d.end-d.start)})`:""}`:"Turno: no marcado",
    ...(CONTENT.length?[``,`CONTENIDO (tema: ${THEMES[dow(k)].w})`,
    ...(LEGACY?[`- Gaby Flowers: ${ct.gabyStories||0}/3 historias · ${ct.gabyPost||0}/1 post`,
    `- Ruiz Creationz: ${ct.ruizStories||0}/3 historias · ${ct.ruizPost||0}/1 post`,
    `- ABBA Roses: versículo ${ct.abbaVerse?"sí":"no"} · ${ct.abbaVideos||0} videos · ${d.abbaAnswered||0} mensajes respondidos`]:CONTENT.map(x=>`- ${x.n}: ${ct[x.k]||0}/${x.goal}`))]:[]),
    ``,`LLAMADAS`,
    `- Leads nuevos: ${c.nw}/${GOAL_NEW}`,
    `- Follow-ups: ${c.fu}/${GOAL_FU}`,
    `- Contestaron: ${c.ans}`,
    ``,`CHATS (clientes en inglés, aparte de las llamadas)`,
    `- Total: ${c.chats}/${GOAL_CHAT} · Nuevos: ${c.cn} · Follow-ups: ${c.cf} · Respondieron: ${c.cans}`,
    ``,`VENTAS DE HOY (${st.orders} órdenes${created.length>st.orders?` + ${created.length-st.orders} extra${created.length-st.orders>1?"s":""} añadido${created.length-st.orders>1?"s":""}`:""} · ${money(st.total)})`,
    ...(created.length?created.map(s=>`- Orden ${ordNo(s)} · ${s.client} — ${s.product||s.brand} — ${money(s.total)}${s._addonOnly?` (orden ahora en ${money(s._full)})`:""} · entrega ${fmtDay(s.deliveryDay)} · ${s.status==="pagada"?"pagada":`abonó ${money(s.paid)}`}`):["- Ninguna"]),
    ...(created.length?statsLines(st):[]),
    ``,`PAGOS COMPLETADOS HOY (${paid.length}) → comisión ganada: ${money(comm)}`,
    ...paid.map(s=>{const hoy=(s.payments||[]).filter(p=>dayKey(p.t)===k).reduce((a,p)=>a+(p.amount||0),0);return `- Orden ${ordNo(s)} · ${s.client} — total ${money(s._full??s.total)}${(s._full??s.total)!==s.total?` (comisión sobre ${money(s.total)})`:""} · pagó hoy ${money(hoy)} · pagado completo ${money(s.paid)}`}),
    ``,`META SEMANAL: ${money(wk)} de ${money(SALES_GOALS.week[0])} (meta alta ${money(SALES_GOALS.week[1])})`,
    ...(cancelled(k,k).length?[``,`ÓRDENES CANCELADAS HOY (${cancelled(k,k).length}) → se restan ${money(cancelled(k,k).reduce((a,s)=>a+s.total,0))} de las ventas`,...cancelled(k,k).map(s=>`- Orden ${ordNo(s)} · ${s.client} — ${money(s.total)}${s.cancelReason?" · "+s.cancelReason:""}`),``]:[]),
    `Entregas de mañana: ${ordersFor(addDays(k,1)).length} · Follow-ups agendados para mañana: ${Object.values(S.leads).filter(l=>l.nextFU&&dayKey(l.nextFU)===addDays(k,1)).length}`,
  ];
  if(d.notes)lines.push(``,`NOTAS: ${d.notes}`);
  return lines.join("\n");
}
function weeklyReport(ws){
  const we=addDays(ws,6);let nw=0,fu=0,ans=0,chs=0;const content={};
  for(let i=0;i<7;i++){const k=addDays(ws,i);const c=callsOn(k);nw+=c.nw;fu+=c.fu;ans+=c.ans;chs+=c.chats;const ct=dayDoc(k).content||{};CONTENT.forEach(x=>content[x.k]=(content[x.k]||0)+(ct[x.k]||0))}
  const sold=salesBetween(ws,we),paid=paidBetween(ws,we),st=productStats(sold);
  const calls=nw+fu,close=calls?Math.round(st.orders/calls*1000)/10:0;
  const pend=orders().filter(s=>s.status!=="pagada");
  const m=ws.slice(0,7),ms=sumTotal(salesBetween(m+"-01",m+"-31"));
  return [
    `REPORTE SEMANAL — ${fmtDay(ws)} a ${fmtDay(we)} — ${NAME}`,``,
    `VENTAS DE LA SEMANA: ${money(st.total)} en ${st.orders} órdenes${sold.length>st.orders?` + ${sold.length-st.orders} extra(s) añadido(s)`:""}`,
    `Meta base ${money(SALES_GOALS.week[0])}: ${st.total>=SALES_GOALS.week[0]?"LOGRADA":"faltaron "+money(SALES_GOALS.week[0]-st.total)} · Meta alta ${money(SALES_GOALS.week[1])}: ${st.total>=SALES_GOALS.week[1]?"LOGRADA":"faltaron "+money(SALES_GOALS.week[1]-st.total)}`,
    ...sold.map(s=>`- ${fmtDay(s.saleDay)} Orden ${ordNo(s)} · ${s.client} —${money(s.total)}${s._addonOnly?" (extra añadido)":""} (${s.status==="pagada"?"pagada":"por cobrar"})`),``,
    `QUÉ SE VENDIÓ`,...statsLines(st),``,
    `PAGOS COMPLETOS ESTA SEMANA: ${paid.length} · comisión ${money(paid.reduce((a,s)=>a+commissionOf(s),0))}`,``,
    `LLAMADAS: ${calls} (nuevos ${nw}/${GOAL_NEW*5} · follow-ups ${fu}/${GOAL_FU*5}) · contestaron ${ans} · ${close}% de cierre por llamada`,`CHATS con clientes en inglés: ${chs}/${GOAL_CHAT*5}`,``,
    LEGACY?`CONTENIDO: Gaby ${content.gabyStories||0}/15 historias, ${content.gabyPost||0}/5 posts · Ruiz ${content.ruizStories||0}/15 historias, ${content.ruizPost||0}/5 posts · ABBA versículo ${content.abbaVerse||0}/5, videos ${content.abbaVideos||0}/5–10`:CONTENT.length?`CONTENIDO: ${contentLine(content,5)}`:"",CONTENT.length?``:"",
    `MES (${fmtMonth(m)}): ${money(ms)} de ${money(SALES_GOALS.month[0])} (meta alta ${money(SALES_GOALS.month[1])})`,
    `POR COBRAR: ${pend.length} órdenes · ${money(pend.reduce((a,s)=>a+s.total-s.paid,0))}`,
    ...(cancelled(ws,we).length?[``,`CANCELADAS ESTA SEMANA: ${cancelled(ws,we).length} · se restaron ${money(cancelled(ws,we).reduce((a,s)=>a+s.total,0))}`,...cancelled(ws,we).map(s=>`- Orden ${ordNo(s)} · ${s.client} — ${money(s.total)} (vendida ${fmtDay(s.saleDay)}, cancelada ${fmtDay(s.cancelDay)})${s.cancelReason?" · "+s.cancelReason:""}`)]:[])
  ].join("\n");
}
function vReporte(){
  const k=today(),d=dayDoc(k),isSun=dow(k)===0;
  const ws=weekStart(k);
  const dr=dailyReport(k), wr=weeklyReport(ws), wsent=weeklySentFor(ws);
  const weekly=`<section class="panel" ${isSun?'style="border-color:var(--accent)"':""}>
    <div class="panel-h"><h2>Reporte semanal</h2><span class="pill ${wsent?"on":isSun?"warn":""}">${wsent?"Enviado "+fmtWhen(wsent):"Se envía el domingo "+fmtDay(addDays(ws,6))+", a cualquier hora"}</span></div>
    <p class="muted" style="margin:0">Todos los domingos, a cualquier hora del día, le mandas este reporte a Isnel. Se arma solo con lo que registraste en la semana.</p>
    <pre class="rep" id="wrText">${esc(wr)}</pre>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" type="button" data-copy="wrText" data-markweek="${ws}">${isSun?"Copiar y marcar enviado":"Copiar reporte semanal"}</button><a class="btn" href="https://wa.me/?text=${encodeURIComponent(wr)}" target="_blank" rel="noopener">Abrir en WhatsApp</a></div>
  </section>`;
  const daily=`<section class="panel">
    <div class="panel-h"><h2>Reporte diario</h2><span class="pill ${d.reportSent?"on":"warn"}">${d.reportSent?"Enviado "+hhmm(d.reportSent):"Antes de las 8:00 p. m."}</span></div>
    <p class="muted" style="margin:0">Se arma solo con lo que registraste hoy. Revisa, agrega una nota si hace falta y mándaselo a Isnel.</p>
    <div class="fld"><label for="dNotes">Notas o bloqueos del día</label><textarea id="dNotes" placeholder="Ej: dos clientes pidieron entrega el domingo">${esc(d.notes||"")}</textarea></div>
    <pre class="rep" id="drText">${esc(dr)}</pre>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" type="button" data-copy="drText" data-mark="1">Copiar y marcar enviado</button><a class="btn" href="https://wa.me/?text=${encodeURIComponent(dr)}" target="_blank" rel="noopener">Abrir en WhatsApp</a></div>
  </section>`;
  return isSun?weekly+daily:daily+weekly;
}
function vResumen(){
  if(S.months[S.month])return vResumenCerrado(S.months[S.month])+monthsCompare();
  const m=S.month,a=m+"-01",b=m+"-31";
  const paid=paidBetween(a,b);
  const sold=salesBetween(a,b),st=productStats(sold);
  const pend=orders().filter(s=>s.status!=="pagada"&&COMMISSION_BRANDS.includes(s.brand));
  const comm=paid.reduce((x,s)=>x+commissionOf(s),0),commPend=pend.reduce((x,s)=>x+commPendOf(s),0);
  const dayKeys=Object.keys(S.days).filter(k=>k.startsWith(m)).sort().reverse();
  const months=[...new Set([...Object.keys(S.months),today().slice(0,7),...Object.keys(S.days).map(k=>k.slice(0,7)),...orders().map(s=>(s.paidDay||s.saleDay||"").slice(0,7)).filter(Boolean)])].sort().reverse();
  // weeks touching the month
  const weeks=[];let w=weekStart(a);while(w<=b&&w.slice(0,7)<=m){weeks.push(w);w=addDays(w,7)}
  const wrows=weeks.map(ws=>{const v=sumTotal(salesBetween(ws,addDays(ws,6)));return `<tr><td>${fmtDay(ws)} – ${fmtDay(addDays(ws,6))}</td><td class="r">${money(v)}</td><td><span class="pill ${v>=SALES_GOALS.week[1]?"on":v>=SALES_GOALS.week[0]?"on":ws<=today()?"warn":""}">${v>=SALES_GOALS.week[1]?"Meta alta":v>=SALES_GOALS.week[0]?"Meta base":ws>today()?"Por venir":"Debajo de la meta"}</span></td><td>${weeklySentFor(ws)?"✓":"—"}</td></tr>`}).join("");
  const rows=dayKeys.map(k=>{const d=S.days[k],c=callsOn(k),ct=d.content||{};
    const contentDone=CONTENT.filter(x=>(ct[x.k]||0)>=x.goal).length;
    const ok=c.nw>=GOAL_NEW&&c.fu>=GOAL_FU&&c.chats>=GOAL_CHAT&&contentDone===CONTENT.length;
    const late=d.start&&d.start>atHour(k,16)+15*6e4;const cis=(d.checkins||[]).filter(x=>x.slot&&x.slot!=="inicio").length;
    return `<tr><td>${fmtDay(k)}</td><td class="r">${d.start?`<span style="color:${late?"var(--bad)":"inherit"}">${hhmm(d.start)}</span>`:"—"}</td><td class="r">${cis}/4</td><td class="r">${d.start&&d.end?dur(d.end-d.start).replace(" min",""):d.start?"abierto":"—"}</td><td class="r">${c.nw}/${GOAL_NEW}</td><td class="r">${c.fu}/${GOAL_FU}</td><td class="r">${c.chats}/${GOAL_CHAT}</td><td class="r">${contentDone}/${CONTENT.length}</td><td class="r">${money(sumTotal(ordersCreatedOn(k)))}</td><td><span class="pill ${ok?"on":"warn"}">${ok?"Cumplió":"Incompleto"}</span></td><td>${d.reportSent?"✓":"—"}</td></tr>`}).join("");
  return `
  <section class="panel">
    <div class="panel-h"><h2>Ventas de ${fmtMonth(m)}</h2><select id="mSel" aria-label="Mes">${months.map(x=>`<option value="${x}" ${x===m?"selected":""}>${fmtMonth(x)}</option>`).join("")}</select></div>
    ${salesMeter("Ventas del mes",st.total,SALES_GOALS.month,`${sold.length} órdenes · ticket promedio ${money(st.ticket)}`)}
    <div class="scroll"><table class="t"><thead><tr><th>Semana</th><th class="r">Vendido</th><th>Meta (${fmtGoal(SALES_GOALS.week[0])} / ${fmtGoal(SALES_GOALS.week[1])})</th><th>Reporte</th></tr></thead><tbody>${wrows}</tbody></table></div>
  </section>
  <section class="panel">
    <div class="panel-h"><h2>Qué se vendió</h2><span class="muted">${fmtMonth(m)}</span></div>
    <div class="summary">
      ${cancelled(a,b).length?`<div class="stat"><span class="lbl">Canceladas</span><b>${money(cancelled(a,b).reduce((x,s)=>x+s.total,0))}</b><span class="muted">${cancelled(a,b).length} orden${cancelled(a,b).length===1?"":"es"} · ya restadas de las ventas</span></div>`:""}
      <div class="stat"><span class="lbl">Rosas naturales</span><b>${st.nat.toLocaleString("en-US")}</b></div>
      <div class="stat"><span class="lbl">Rosas tinturadas</span><b>${st.dye.toLocaleString("en-US")}</b></div>
      <div class="stat"><span class="lbl">Extras</span><b>${money(st.extrasAmt)}</b><span class="muted">${st.extrasCount} vendidos</span></div>
      <div class="stat"><span class="lbl">Delivery</span><b>${money(st.delivery)}</b><span class="muted">${st.deliveries} envíos</span></div>
      ${Object.entries(st.byBrand).map(([br,v])=>`<div class="stat"><span class="lbl">${esc(br)}</span><b>${money(v)}</b></div>`).join("")}
    </div>
  </section>
  <section class="panel">
    <div class="panel-h"><h2>Pago de ${esc(SHORT)}</h2><span class="muted">${fmtMonth(m)}</span></div>
    <div class="summary">
      ${COMMISSION?`<div class="stat"><span class="lbl">Pagado completo ${esc(COMMISSION_BRANDS.join(", "))} (hasta hoy)</span><b>${money(comm/COMMISSION)}</b><span class="muted">${paid.filter(s=>commissionOf(s)).length} órdenes pagadas completas · los abonos cuentan cuando terminen de pagar</span></div>
      <div class="stat"><span class="lbl">Por cobrar (${esc(COMMISSION_BRANDS.join(", "))})</span><b>${money(commPend/COMMISSION)}</b><span class="muted">total de ${pend.length} órdenes sin pagar completo (ya abonaron ${money(commPend/COMMISSION-pend.reduce((x,s)=>x+(s.total-s.paid),0))})</span></div>
      <div class="stat hl"><span class="lbl">${PCT} ganado</span><b>${money(comm)}</b></div>
      <div class="stat"><span class="lbl">${PCT} por cobrar</span><b>${money(commPend)}</b><span class="muted">cuando paguen completo</span></div>`:""}
      <div class="stat"><span class="lbl">Sueldo base</span><b>${money(BASE_PAY)}</b></div>
      ${BONUS?`<div class="stat${st.total>=BONUS.goal?" hl":""}"><span class="lbl">Bono por llegar a ${money(BONUS.goal)}</span><b>${money(bonusOf(st.total))}</b><span class="muted">${st.total>=BONUS.goal?"¡Meta lograda!":"Te faltan "+money(BONUS.goal-st.total)+" para ganar "+money(BONUS.amount)}</span></div>`:""}
      <div class="stat hl"><span class="lbl">Total a pagar</span><b>${money(BASE_PAY+comm+bonusOf(st.total))}</b><span class="muted">sueldo base${COMMISSION?" + "+PCT+" ganado":""}${BONUS?" + bono si llegas a la meta":""}</span></div>
    </div>
  </section>
  ${PROPOSAL&&S.month===today().slice(0,7)?proposalPanel():""}
  ${monthsCompare()}
  <section class="panel">
    <div class="panel-h"><h2>Días del mes</h2></div>
    <div class="scroll">${rows?`<table class="t"><thead><tr><th>Día</th><th class="r">Entrada</th><th class="r">Check-ins</th><th class="r">Horas</th><th class="r">Nuevos</th><th class="r">Follow-ups</th><th class="r">Chats</th><th class="r">Contenido</th><th class="r">Vendido</th><th>Metas</th><th>Reporte</th></tr></thead><tbody>${rows}</tbody></table>`:`<div class="empty">Todavía no hay días registrados este mes.</div>`}</div>
  </section>`;
}
function vGuia(){
  const t=dow(today());
  return `
  <section class="panel">
    <h2>Cómo funciona tu día</h2>
    <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
      <li>Marca <b>Empezar turno</b> al conectarte (referencia: 4:00 p. m. hora Colombia). Organizas tu tiempo como quieras; se mide por metas.</li>
      <li>Cada hora (5, 6, 7 y 8 p. m.) el portal te pide un check-in corto y la IA te dice qué priorizar.</li>
      <li><b>Deja el portal abierto todo el turno.</b> Si lo cierras, no te aparece el check-in y a Isnel le llega una alerta de que no lo hiciste. Si pasa, ábrelo y usa “Hacer check-in ahora”.</li>
      <li>Entra siempre con tu contraseña personal (no la compartas). Si sale un aviso rojo de “NO SE GUARDÓ”, avísale a Isnel de inmediato.</li>
      ${SHOW_THEME?`<li>Revisa el tema de contenido del día y publica según ese tema.</li>`:""}
      <li>Registra o importa los leads. Llama cada lead máximo 2 veces el mismo día.</li>
      <li>Después de llamar a un lead toca <b>“Ya lo llamé”</b> y escoge cómo te fue. Solo eso suma a la meta de llamadas; agregar el lead no cuenta como llamada. El follow-up se agenda solo (día 1, 3 y 7). Si no le interesa, va a “No interesado / frío”.</li>
      <li>Los clientes en inglés se marcan con idioma “Inglés” y se contactan por chat: toca <b>“Le escribí por chat”</b>. Los chats se cuentan aparte, no suman a las llamadas.</li>
      <li>Cada venta: sube el PDF de la orden (el mismo que mandas a producción) con su <b>número de orden</b>. La IA llena todo; tú revisas y subes.</li>
      <li>Si no pagó todo, el día de la entrega el portal te pide confirmar el pago.${COMMISSION?" Ahí se gana la comisión.":""}</li>
      <li>Antes de las 8:00 p. m.: manda a producción la lista de entregas de mañana y copia tu reporte diario para Isnel.</li>
      <li><b>Todos los domingos, a cualquier hora, mandas el reporte semanal.</b></li>
    </ol>
  </section>
  <div class="grid2">
  <section class="panel"><h2>Metas de ventas</h2>
    <table class="t"><thead><tr><th></th><th class="r">Semana</th><th class="r">Mes</th></tr></thead><tbody>
    <tr><td>Meta base</td><td class="r">${fmtGoal(SALES_GOALS.week[0])}</td><td class="r">${fmtGoal(SALES_GOALS.month[0])}</td></tr>
    <tr><td>Meta alta</td><td class="r">${fmtGoal(SALES_GOALS.week[1])}</td><td class="r">${fmtGoal(SALES_GOALS.month[1])}</td></tr></tbody></table>
    <p class="muted" style="margin:0;font-size:.85rem">Se cuenta el total de cada orden subida, en la semana de lunes a domingo.</p>
  </section>
  <section class="panel"><h2>Metas diarias</h2>
    <table class="t"><thead><tr><th>Qué</th><th class="r">Día</th><th class="r">Semana</th></tr></thead><tbody>
    <tr><td>Llamadas a leads nuevos</td><td class="r">${GOAL_NEW}</td><td class="r">${GOAL_NEW*5}</td></tr>
    <tr><td>Follow-ups</td><td class="r">${GOAL_FU}</td><td class="r">${GOAL_FU*5}</td></tr>
    <tr><td>Chats con clientes en inglés</td><td class="r">${GOAL_CHAT}</td><td class="r">${GOAL_CHAT*5}</td></tr>
    ${LEGACY?`<tr><td>Historias + post Gaby</td><td class="r">3 + 1</td><td class="r">15 + 5</td></tr>
    <tr><td>Historias + post Ruiz</td><td class="r">3 + 1</td><td class="r">15 + 5</td></tr>
    <tr><td>Versículo ABBA</td><td class="r">1</td><td class="r">5</td></tr>
    <tr><td>Videos ABBA</td><td class="r">1–2</td><td class="r">5–10</td></tr>`:CONTENT.map(x=>`<tr><td>${esc(x.n)}</td><td class="r">${x.goal}</td><td class="r">${x.goal*5}</td></tr>`).join("")}</tbody></table>
  </section>
  </div>
  <div class="grid2">
  ${SHOW_THEME?`<section class="panel"><h2>Plan de contenido semanal</h2>
    <table class="t"><tbody>${[1,2,3,4,5,6,0].map(i=>`<tr style="${i===t?"background:var(--accent-soft)":""}"><td><b>${THEMES[i].d}</b></td><td>${THEMES[i].w}</td></tr>`).join("")}</tbody></table>
  </section>`:""}
  ${BRANDS_SELL.includes("Gaby Flowers")?`<section class="panel"><h2>La base de 900 leads de Gaby</h2>
    <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
      <li>Importa la lista desde Leads → “Importar lista”, con origen “Base antigua”.</li>
      <li>Las llamadas a la base cuentan como llamadas a leads nuevos.</li>
      <li>Los leads que entran hoy por anuncios van primero; la base se llama en los ratos libres.</li>
      <li>Filtra: si no le interesa, arrástralo a “No interesado / frío”.</li>
      <li>Al principio agrega a mano solo los leads importantes que van entrando.</li>
    </ul>
  </section>`:""}
  </div>
  <div class="grid2">
  <section class="panel"><h2>Pago</h2>
    ${CFG.payNote?`<p style="margin:0">${esc(CFG.payNote)}</p>`:`<p style="margin:0">Sueldo base <b class="num">${fmtGoal(BASE_PAY)}</b> al mes + <b>${PCT}</b> del total de cada venta de ${esc(COMMISSION_BRANDS.join(", "))}. Se paga mensual.</p>`}
    ${COMMISSION?`<div class="rule">La comisión se gana el día que el cliente paga el total.</div>`:""}
  </section>
  <section class="panel"><h2>Reglas</h2>
    <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
      <li>Todo lo que registras queda guardado tal cual: no se puede editar ni borrar. Si te equivocas, avísale a Isnel y él lo corrige.</li>
      <li>Cada cosa que haces queda anotada en la pestaña <b>Historial</b> con la hora y el equipo. Si algo se borra o se cambia por fuera del portal, aparece ahí como alerta.</li>
      <li>Nunca repetir contenido entre Gaby Flowers y Ruiz Creationz.</li>
      <li>ABBA Roses tiene un solo número: <b class="num">(786) 431-6738</b>.</li>
      <li>Al cliente se le habla de tú. Nunca inventar precios ni promociones.</li>
    </ul>
  </section>
  </div>
  <section class="panel"><h2>Documentos</h2>
    <div class="list">
      ${(CFG.docsLinks||[]).filter(d=>/^https:\/\//.test(d.url||"")).map(d=>`<a class="row" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer"><div class="main"><div class="t">${esc(d.t)}</div><div class="s">${esc(d.s||"")}</div></div></a>`).join("")||`<div class="empty">Sin documentos.</div>`}
    </div>
  </section>`;
}

// ---------- lead drawer ----------
function openLead(id,keep){
  const l=S.leads[id];if(!l){S.openLead=null;layer.innerHTML="";return}
  const ex=layer.querySelector(".drawer");
  if(keep&&ex&&ex.dataset.id===id&&document.activeElement&&layer.contains(document.activeElement)&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;
  if(keep&&ex&&ex.dataset.id===id&&layer.querySelector("#dofForm"))return;
  S.openLead=id;
  const st=STAGES[l.stage]||STAGES.nuevo;
  const k=today(), isNew=(l.fuStep||0)===0, todayNew=newCallsToday(l,k), maxed=isNew&&todayNew>=2;
  const hist=(l.history||[]).slice().sort((a,b)=>b.t-a.t);
  const wa=digits(l.phone).length===10?"1"+digits(l.phone):String(l.phone||"").replace(/\D/g,"");
  const en=l.lang==="en";
  const outBtns=(ch,dis)=>{const t=ch==="call"?{interesado:"Contestó · interesado",contesto:"Contestó · lo piensa",no_contesto:"No contestó",no_interesado:"No le interesa"}:{interesado:"Respondió · interesado",contesto:"Respondió · lo piensa",no_contesto:"No respondió",no_interesado:"No le interesa"};return `<div class="outcomes" data-box="${ch}" hidden style="margin-top:4px">${Object.entries(t).map(([k2,v])=>`<button class="btn" type="button" data-out="${k2}" data-ch="${ch}" ${dis?"disabled":""}>${v}</button>`).join("")}</div>`};
  const callBox=`<div class="panel" style="padding:12px;margin-top:8px;gap:6px"><div class="panel-h"><h3>Llamada</h3><span class="muted" style="font-size:.8rem">Suma a la meta de llamadas</span></div>${maxed?`<div class="banner">Ya lo llamaste 2 veces hoy. Mándale un chat; queda agendado para mañana.</div>`:`<button class="btn pri" type="button" data-step="call" style="justify-content:center">Ya lo llamé</button><span class="muted" style="font-size:.8rem">Tócalo solo después de llamarlo de verdad. Luego escoge cómo te fue.</span>`}${outBtns("call",maxed)}</div>`;
  const chatBox=`<div class="panel" style="padding:12px;margin-top:8px;gap:6px"><div class="panel-h"><h3>Chat</h3><span class="muted" style="font-size:.8rem">WhatsApp o mensaje · se cuenta aparte</span></div><button class="btn${en?" pri":""}" type="button" data-step="chat" style="justify-content:center">Le escribí por chat</button>${outBtns("chat",false)}</div>`;
  layer.innerHTML=`<div class="scrim" data-close="1"></div><aside class="drawer" data-id="${l.id}" role="dialog" aria-modal="true" aria-labelledby="dlName">
    <div class="drawer-h"><div style="flex:1;min-width:0"><h2 id="dlName" style="overflow:hidden;text-overflow:ellipsis">${esc(l.name)}</h2><div class="muted" style="font-size:.85rem">${esc(l.brand)} · ${esc(l.source||"—")} · ${fmtDay(l.createdDay)}</div></div><span class="pill ${st.c}">${st.n}</span><button class="btn sm ghost" type="button" data-close="1" aria-label="Cerrar">✕</button></div>
    <div class="drawer-b">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="num" style="font-size:1.1rem;user-select:all">${esc(l.phone||"Sin número")}</span>${l.phone?`<button class="btn sm" type="button" data-copytxt="${esc(l.phone)}">Copiar</button><a class="btn sm" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>`:""}</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="lbl">Idioma</span><select id="dlLang" aria-label="Idioma del cliente" style="border:1px solid var(--line);border-radius:8px;padding:4px 8px;background:var(--bg)">${Object.entries(LANGS).map(([k2,v])=>`<option value="${k2}" ${(l.lang||"es")===k2?"selected":""}>${v}</option>`).join("")}</select>${en?`<span class="pill warn">Cliente en inglés: contáctalo por chat</span>`:""}</div>
      <div><span class="lbl">${isNew?`Primer contacto${en?"":` · llamada ${Math.min(todayNew+1,2)} de 2 hoy`}`:`Follow-up ${Math.min(l.fuStep,3)} de 3`}</span>
      ${en?chatBox+callBox:callBox+chatBox}
      <button class="btn ok" type="button" data-out="vendio" style="width:100%;margin-top:8px;justify-content:center">Vendí · subir orden</button></div>
      <div id="saleSlot"></div>
      <div class="fld"><label for="dlNote">Nota rápida</label><div style="display:flex;gap:6px"><input id="dlNote" placeholder="Quiere rosas amarillas, entrega el viernes"><button class="btn sm" type="button" data-act="addNote">Guardar</button></div></div>
      <div class="fld"><label for="dlNext">Próximo follow-up (hora Colombia)</label><div style="display:flex;gap:6px"><input id="dlNext" type="datetime-local" value="${msToLocalInput(l.nextFU)}"><button class="btn sm" type="button" data-act="setNext">Agendar</button></div>
        <div class="chips" style="margin-top:4px"><button class="chip" type="button" data-quick="2h">En 2 horas</button><button class="chip" type="button" data-quick="tom">Mañana 4 p. m.</button><button class="chip" type="button" data-quick="3d">En 3 días</button></div></div>
      <div class="fld"><label for="dlTask">Tarea para este lead</label><div style="display:flex;gap:6px;flex-wrap:wrap"><input id="dlTask" placeholder="Mandarle fotos de ramos amarillos" style="flex:1;min-width:160px"><input id="dlTaskDue" type="datetime-local" value="${msToLocalInput(atHour(addDays(today(),1),16))}" style="width:auto" aria-label="Fecha de la tarea"><button class="btn sm" type="button" data-act="addTask">Agregar</button></div></div>
      <div class="fld"><label for="dlStage">Etapa</label><select id="dlStage">${Object.entries(STAGES).map(([k2,v])=>`<option value="${k2}" ${l.stage===k2?"selected":""}>${v.n}</option>`).join("")}</select></div>
      ${S.sample?`<div><button class="btn sm" type="button" data-act="aiMsg">Redactar WhatsApp con IA</button><div id="aiOut" style="margin-top:8px"></div></div>`:""}
      <div><span class="lbl">Historial</span><div class="hist" style="margin-top:6px">${hist.length?hist.map(h=>`<div><span class="when">${fmtWhen(h.t)}</span><span>${esc(h.text)}</span></div>`).join(""):`<span class="muted">Sin actividad todavía.</span>`}</div></div>
    </div></aside>`;
  bindDrawer(l);
}
function closeLead(){S.openLead=null;layer.innerHTML="";if(S.draft&&S.draft.p==="dof")S.draft=null}
const OUT_TXT={interesado:"Contestó, interesado",contesto:"Contestó, lo va a pensar",no_contesto:"No contestó",no_interesado:"No le interesa"};
const CHAT_TXT={interesado:"Respondió, interesado",contesto:"Respondió, lo va a pensar",no_contesto:"No respondió",no_interesado:"No le interesa"};
async function logCall(l,out,ch){
  const now=Date.now(),k=today(),isNew=(l.fuStep||0)===0,chat=ch==="chat";
  const n={...l,history:[...(l.history||[])]};
  const prior=newCallsToday(l,k);
  n.history.push(chat
    ?{t:now,day:k,kind:"chat",isNew,outcome:out,text:(isNew?"Chat (nuevo): ":`Chat follow-up ${Math.min(l.fuStep,3)}: `)+CHAT_TXT[out]}
    :{t:now,day:k,kind:"call",isNew,outcome:out,text:(isNew?`Llamada ${prior+1} (nuevo): `:`Follow-up ${Math.min(l.fuStep,3)} por llamada: `)+OUT_TXT[out]});
  let msg=chat?"Chat registrado":"Llamada registrada";
  if(out==="no_interesado"){n.stage="frio";n.nextFU=null;if(isNew)n.fuStep=1;msg="Movido a No interesado"}
  else if(out==="interesado"||out==="contesto"){
    n.stage=out==="interesado"?"interesado":"contactado";
    if(isNew){n.fuStep=1;n.nextFU=atHour(addDays(k,1),16)}else advanceFU(n,k);
    msg=n.nextFU?"Follow-up agendado: "+fmtWhen(n.nextFU):"Sin más follow-ups: pasa a frío";
  }else if(out==="no_contesto"){
    if(n.stage==="nuevo")n.stage="sin_respuesta";
    if(isNew&&chat){n.fuStep=1;n.nextFU=atHour(addDays(k,1),16);msg="Sin respuesta al chat. Follow-up mañana"}
    else if(isNew){
      if(prior+1>=2){n.fuStep=1;n.nextFU=atHour(addDays(k,1),16);msg="2 llamadas hoy. Mándale WhatsApp; follow-up mañana"}
      else{n.nextFU=null;msg="Vuelve a llamarlo más tarde hoy"}
    }else{advanceFU(n,k);msg=n.nextFU?"Sin respuesta. Siguiente follow-up: "+fmtWhen(n.nextFU):"3 follow-ups sin respuesta: pasa a frío"}
  }
  S.leads[n.id]=n;render();await save("leads",n);toast(msg);
}
function advanceFU(n,k){
  const step=n.fuStep||1;
  if(step===1){n.fuStep=2;const d=addDays(n.createdDay,3);n.nextFU=atHour(d<=k?addDays(k,2):d,16)}
  else if(step===2){n.fuStep=3;const d=addDays(n.createdDay,7);n.nextFU=atHour(d<=k?addDays(k,4):d,16)}
  else{n.fuStep=4;n.nextFU=null;if(!["pendiente_pago","vendido"].includes(n.stage))n.stage="frio"}
}
function bindDrawer(l){
  layer.querySelectorAll("[data-close]").forEach(e=>e.onclick=closeLead);
  layer.querySelectorAll("[data-out]").forEach(b=>b.onclick=()=>{
    if(b.dataset.out==="vendio"){const slot=document.getElementById("saleSlot");slot.innerHTML=`<div class="panel" style="background:var(--ok-soft);border-color:var(--ok)"><h3>Subir orden</h3>${orderForm("dof",l)}</div>`;bindOrderForm(slot.querySelector("form"),"dof");slot.scrollIntoView({block:"nearest"});return}
    logCall(l,b.dataset.out,b.dataset.ch||"call");
  });
  layer.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{const box=layer.querySelector(`[data-box="${b.dataset.step}"]`);if(box){box.hidden=false;b.hidden=true;const f=box.querySelector("button:not([disabled])");f&&f.focus()}});
  const lg=layer.querySelector("#dlLang");
  if(lg)lg.onchange=async(e)=>{e.target.blur();const v=e.target.value;const n={...l,lang:v,history:[...(l.history||[]),{t:Date.now(),day:today(),kind:"note",text:"Idioma: "+LANGS[v]}]};S.leads[n.id]=n;await save("leads",n);openLead(n.id);toast(v==="en"?"Marcado en inglés: contáctalo por chat":"Marcado en español")};
  const q=(s)=>layer.querySelector(s);
  q('[data-act="addNote"]').onclick=async()=>{const v=q("#dlNote").value.trim();if(!v)return;const n={...l,history:[...(l.history||[]),{t:Date.now(),day:today(),kind:"note",text:v}],notes:(l.notes?l.notes+" · ":"")+v};S.leads[n.id]=n;q("#dlNote").blur();render();await save("leads",n);toast("Nota guardada")};
  q('[data-act="setNext"]').onclick=async()=>{const ms=localInputToMs(q("#dlNext").value);if(!ms)return;q("#dlNext").blur();await setNext(l,ms)};
  q('[data-act="addTask"]').onclick=async()=>{const v=q("#dlTask").value.trim();if(!v)return;const t={id:uid(),title:v,due:localInputToMs(q("#dlTaskDue").value),leadId:l.id,done:false,created:Date.now()};S.tasks[t.id]=t;q("#dlTask").blur();render();await save("tasks",t);toast("Tarea agregada")};
  layer.querySelectorAll("[data-quick]").forEach(b=>b.onclick=()=>{const t=b.dataset.quick;setNext(l,t==="2h"?Date.now()+2*3600e3:t==="tom"?atHour(addDays(today(),1),16):atHour(addDays(today(),3),16))});
  q("#dlStage").onchange=async(e)=>{e.target.blur();await changeStage(l,e.target.value)};
  layer.querySelectorAll("[data-copytxt]").forEach(b=>b.onclick=()=>copy(b.dataset.copytxt));
  const ai=q('[data-act="aiMsg"]');
  if(ai)ai.onclick=async()=>{
    const out=q("#aiOut");out.innerHTML=`<div class="ai">Pensando…</div>`;
    const box=out.firstChild;ai.disabled=true;
    const h=(l.history||[]).slice(-6).map(x=>x.text).join("; ");
    try{
      const {text}=await S.sample(`Redacta UN mensaje de WhatsApp corto (máximo 3 frases) para un cliente de la floristería ${l.brand} en Miami. Tono cálido y cercano, ${l.lang==="en"?"escrito en inglés (el cliente habla inglés)":"de tú, en español latino"}, máximo 1 emoji. Objetivo: retomar la conversación y llevarlo a comprar o a contestar una llamada. No inventes precios ni promociones.\nCliente: ${l.name}. Etapa: ${STAGES[l.stage].n}. ${l.source==="Base antigua"?"Es un cliente antiguo que escribió hace tiempo. ":""}Notas: ${l.notes||"sin notas"}. Historial: ${h||"sin historial"}.\nFirma ${CFG.signName||SHORT}. Responde solo con el texto del mensaje.`,{modelTier:"quick",cache:false,onText:({text})=>{box.textContent=text}});
      box.textContent=text;
      const c=document.createElement("button");c.className="btn sm";c.type="button";c.style.marginTop="6px";c.textContent="Copiar mensaje";c.onclick=()=>copy(text);out.appendChild(c);
    }catch(e){box.textContent=e.code==="not_granted"?"La IA no está activada en esta vista.":e.code==="rate_limited"?"Muchas solicitudes seguidas. Intenta en un rato.":"No se pudo redactar. Intenta otra vez."}
    ai.disabled=false;
  };
}
async function setNext(l,ms){const n={...l,nextFU:ms,history:[...(l.history||[]),{t:Date.now(),day:today(),kind:"note",text:"Follow-up agendado: "+fmtWhen(ms)}]};if((n.fuStep||0)===0)n.fuStep=1;S.leads[n.id]=n;render();await save("leads",n);toast("Agendado: "+fmtWhen(ms))}

// ---------- meses cerrados (archivados) y comparación entre meses ----------
function liveMonth(m){return Object.keys(S.days).some(k=>k.startsWith(m))||Object.values(S.sales).some(s=>(s.saleDay||"").startsWith(m))}
function monthTotals(){
  // meses cerrados (resumen guardado) + meses con datos vivos en el portal
  const out={};
  Object.values(S.months).forEach(x=>{out[x.month]={m:x.month,sales:x.sales.total,orders:x.sales.orders,comm:x.pay.commission,calls:x.activity.newCalls+x.activity.followUps,closed:true}});
  const live=new Set([today().slice(0,7),...Object.keys(S.days).map(k=>k.slice(0,7)),...Object.values(S.sales).map(s=>(s.saleDay||"").slice(0,7)).filter(Boolean)]);
  live.forEach(m=>{if(out[m])return;const a=m+"-01",b=m+"-31";const st=productStats(salesBetween(a,b));const comm=paidBetween(a,b).reduce((x,s)=>x+commissionOf(s),0);
    let calls=0;Object.keys(S.days).filter(k=>k.startsWith(m)).forEach(k=>{const c=callsOn(k);calls+=c.nw+c.fu});
    out[m]={m,sales:st.total,orders:st.orders,comm,calls,closed:false}});
  return Object.values(out).sort((a,b)=>a.m.localeCompare(b.m)).slice(-12);
}
function barChart(rows,key,label,fmt){
  const max=Math.max(1,...rows.map(r=>r[key]||0));
  const H=140,bw=Math.max(18,Math.min(48,Math.floor(560/Math.max(1,rows.length))-10));
  const W=rows.length*(bw+10)+10;
  const bars=rows.map((r,i)=>{const h=Math.round((r[key]||0)/max*(H-30));const x=10+i*(bw+10);
    return `<g><rect x="${x}" y="${H-18-h}" width="${bw}" height="${h}" rx="4" fill="${r.closed?"var(--muted)":"var(--accent)"}"><title>${esc(fmtMonth(r.m))}: ${esc(fmt(r[key]||0))}</title></rect>
    <text x="${x+bw/2}" y="${H-4}" text-anchor="middle" font-size="10" fill="var(--muted)">${MONTHS[+r.m.slice(5)-1].slice(0,3)}</text>
    <text x="${x+bw/2}" y="${Math.max(10,H-22-h)}" text-anchor="middle" font-size="9" fill="var(--ink)">${esc(fmt(r[key]||0).replace(/\.00$/,""))}</text></g>`}).join("");
  return `<div><div class="lbl" style="margin-bottom:4px">${esc(label)}</div><div class="scroll"><svg role="img" aria-label="${esc(label)}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${bars}</svg></div></div>`;
}
function monthsCompare(){
  const rows=monthTotals();
  if(rows.length<2)return "";
  const n=x=>String(Math.round(x));
  return `<section class="panel"><div class="panel-h"><h2>Comparar meses</h2><span class="muted">gris = mes cerrado y archivado</span></div>
    <div class="grid2">${barChart(rows,"sales","Ventas",money)}${barChart(rows,"comm","Comisión ganada",money)}${barChart(rows,"orders","Órdenes",n)}${barChart(rows,"calls","Llamadas (nuevas + follow-ups)",n)}</div>
    <div class="scroll"><table class="t"><thead><tr><th>Mes</th><th class="r">Ventas</th><th class="r">Órdenes</th><th class="r">Comisión</th><th class="r">Llamadas</th><th class="r">vs. mes anterior</th></tr></thead><tbody>
    ${rows.map((r,i)=>{const p=rows[i-1];const d=p&&p.sales?Math.round((r.sales-p.sales)/p.sales*100):null;return `<tr><td>${fmtMonth(r.m)}${r.closed?" · cerrado":""}</td><td class="r">${money(r.sales)}</td><td class="r">${r.orders}</td><td class="r">${money(r.comm)}</td><td class="r">${r.calls}</td><td class="r">${d==null?"—":(d>=0?"+":"")+d+"%"}</td></tr>`}).join("")}
    </tbody></table></div></section>`;
}
function vResumenCerrado(x){
  const s=x.sales,p=x.pay,a=x.activity;
  const months=[...new Set([...Object.keys(S.months),today().slice(0,7)])].sort().reverse();
  return `<section class="panel">
    <div class="panel-h"><h2>Ventas de ${fmtMonth(x.month)}</h2><select id="mSel" aria-label="Mes">${months.map(m=>`<option value="${m}" ${m===S.month?"selected":""}>${fmtMonth(m)}</option>`).join("")}</select></div>
    <div class="banner" style="background:var(--sunk);color:var(--muted)">Mes cerrado el ${fmtDay(dayKey(x.closedAt))}. El detalle (órdenes, PDFs y registros) quedó guardado en el archivo del cierre; aquí ves el resumen.</div>
    ${salesMeter("Ventas del mes",s.total,x.goals?[x.goals[0],x.goals[1]]:SALES_GOALS.month,`${s.orders} órdenes · ticket promedio ${money(s.ticket)}`)}
    <div class="scroll"><table class="t"><thead><tr><th>Semana</th><th class="r">Vendido</th></tr></thead><tbody>${(x.weeks||[]).map(w=>`<tr><td>${fmtDay(w.from)} – ${fmtDay(w.to)}</td><td class="r">${money(w.total)}</td></tr>`).join("")}</tbody></table></div>
  </section>
  <section class="panel"><div class="panel-h"><h2>Qué se vendió</h2><span class="muted">${fmtMonth(x.month)}</span></div>
    <div class="summary">
      ${s.cancelled?`<div class="stat"><span class="lbl">Canceladas</span><b>${money(s.cancelledAmt)}</b><span class="muted">${s.cancelled} orden${s.cancelled===1?"":"es"}</span></div>`:""}
      <div class="stat"><span class="lbl">Rosas naturales</span><b>${(s.nat||0).toLocaleString("en-US")}</b></div>
      <div class="stat"><span class="lbl">Rosas tinturadas</span><b>${(s.dye||0).toLocaleString("en-US")}</b></div>
      <div class="stat"><span class="lbl">Extras</span><b>${money(s.extrasAmt)}</b><span class="muted">${s.extrasCount} vendidos</span></div>
      <div class="stat"><span class="lbl">Delivery</span><b>${money(s.delivery)}</b><span class="muted">${s.deliveries} envíos</span></div>
      ${Object.entries(s.byBrand||{}).map(([br,v])=>`<div class="stat"><span class="lbl">${esc(br)}</span><b>${money(v)}</b></div>`).join("")}
    </div></section>
  <section class="panel"><div class="panel-h"><h2>Pago de ${esc(SHORT)}</h2><span class="muted">${fmtMonth(x.month)}</span></div>
    <div class="summary">
      ${p.rate?`<div class="stat hl"><span class="lbl">${Math.round(p.rate*1000)/10}% ganado</span><b>${money(p.commission)}</b></div>`:""}
      <div class="stat"><span class="lbl">Sueldo base</span><b>${money(p.basePay)}</b></div>
      ${p.bonusGoal?`<div class="stat${p.bonus?" hl":""}"><span class="lbl">Bono por llegar a ${money(p.bonusGoal)}</span><b>${money(p.bonus||0)}</b><span class="muted">${p.bonus?"meta lograda":"no se llegó a la meta"}</span></div>`:""}
      <div class="stat hl"><span class="lbl">Total del mes</span><b>${money(p.total)}</b></div>
      ${p.rate?`<div class="stat"><span class="lbl">Comisión pendiente al cierre</span><b>${money(p.commissionPendingAtClose)}</b><span class="muted">se gana cuando paguen</span></div>`:""}
    </div></section>
  <section class="panel"><div class="panel-h"><h2>Actividad del mes</h2></div>
    <div class="summary">
      <div class="stat"><span class="lbl">Días trabajados</span><b>${a.daysWorked}</b><span class="muted">${a.hours} horas</span></div>
      <div class="stat"><span class="lbl">Días con todas las metas</span><b>${a.metDays}</b></div>
      <div class="stat"><span class="lbl">Llamadas nuevas</span><b>${a.newCalls}</b></div>
      <div class="stat"><span class="lbl">Follow-ups</span><b>${a.followUps}</b><span class="muted">${a.answered} contestaron</span></div>
      <div class="stat"><span class="lbl">Chats</span><b>${a.chats}</b></div>
      <div class="stat"><span class="lbl">Check-ins</span><b>${a.checkins}</b><span class="muted">${a.reports} reportes enviados</span></div>
    </div></section>`;
}

// ---------- crear orden por voz (pestaña "Crear orden") ----------
// El vendedor dicta la orden, la IA la arma, se revisa, se genera el PDF de taller
// con la plantilla de la marca y se pasa a Órdenes para subirla como cualquier otra.
const CO_MES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const coFecha = (k)=>{if(!k||!/^\d{4}-\d{2}-\d{2}$/.test(k))return "";const [y,m,d]=k.split("-").map(Number);return d+" "+CO_MES[m-1]+" "+y+(k===today()?" (hoy)":k===addDays(today(),1)?" (mañana)":"")};
function coState(){if(!S.co)S.co={txt:"",d:null,pdf:null,preview:null,pdfText:"",rec:null};return S.co}
function coNextNo(){const ns=Object.values(S.sales).map(o=>parseInt(String(o.orderNo||"").replace(/\D/g,""),10)).filter(n=>n>0&&n<100000);return String((ns.length?Math.max(...ns):0)+1).padStart(3,"0")}
const coLines = (t)=>String(t||"").split("\n").map(x=>x.trim()).filter(Boolean);
const coItems = (t)=>coLines(t).map(l=>{const i=l.lastIndexOf("|");return i<0?{desc:l,precio:0}:{desc:l.slice(0,i).trim(),precio:nz(l.slice(i+1).replace(/[$,\s]/g,""))}});
const coTotal = (d)=>coItems(d.lineasTxt).reduce((a,x)=>a+x.precio,0);
function coMissing(d){
  const m=[],items=coItems(d.lineasTxt),tot=coTotal(d),todo=(d.titulo+" "+d.lineasTxt+" "+d.detallesTxt).toLowerCase();
  if(!String(d.cliente||"").trim())m.push("Nombre del cliente");
  if(String(d.telefono||"").replace(/\D/g,"").length<7)m.push("Teléfono del cliente");
  if(!items.length||items.some(x=>x.precio<=0))m.push("El precio de cada cosa en el desglose");
  if(/rosa/.test(todo)&&nz(d.nat)+nz(d.dye)<=0)m.push("Cuántas rosas son naturales y cuántas tinturadas");
  if(!d.fecha)m.push(d.entrega==="domicilio"?"Fecha de entrega":"Fecha en que recoge");
  if(!String(d.hora||"").trim())m.push(d.entrega==="domicilio"?"Hora de entrega":"Hora en que recoge");
  if(d.entrega==="domicilio"){if(!String(d.direccion||"").trim())m.push("Dirección de entrega");if(!String(d.recibe_nombre||"").trim())m.push("Nombre de quien recibe")}
  if(!d.pagoDicho)m.push("Cuánto pagó ya el cliente (puede ser $0)");
  if(tot-nz(d.abonado)>0&&!String(d.metodo||"").trim())m.push("Cómo va a pagar lo que falta (cash, Zelle, tarjeta…)");
  if(d.tarjetaLleva&&!String(d.tarjeta||"").trim())m.push("El texto de la tarjeta");
  if((d.cintaLleva||/cinta|banda/.test(todo))&&!String(d.cinta||"").trim())m.push("El texto de la cinta personalizada");
  return m;
}

function vCrear(){
  const st=coState(),d=st.d;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const f=(k,lbl,type,extra)=>`<div class="fld${extra&&extra.full?" full":""}"><label for="co_${k}">${lbl}</label>${type==="area"
    ?`<textarea id="co_${k}" data-k="${k}" rows="${(extra&&extra.rows)||3}" placeholder="${esc((extra&&extra.ph)||"")}">${esc(d[k]??"")}</textarea>`
    :type==="sel"?`<select id="co_${k}" data-k="${k}">${extra.opts.map(([v,n])=>`<option value="${esc(v)}" ${String(d[k])===v?"selected":""}>${esc(n)}</option>`).join("")}</select>`
    :`<input id="co_${k}" data-k="${k}" type="${type||"text"}" value="${esc(d[k]??"")}"${type==="number"?' min="0" step="0.01"':""} placeholder="${esc((extra&&extra.ph)||"")}">`}</div>`;
  const total=d?coTotal(d):0,cobrar=d?Math.max(0,total-nz(d.abonado)):0;
  return `<section class="panel">
    <div class="panel-h"><h2>Crear orden</h2><span class="muted">Habla y la IA arma la orden</span></div>
    <p style="margin:0 0 10px">Dila de corrido, como se la dirías a producción: <b>cliente y teléfono</b>, qué lleva (cantidad y colores de rosas, papel, extras), <b>el texto de la tarjeta</b>, si <b>recoge en tienda o es a domicilio</b> (dirección y quién recibe), <b>fecha y hora</b>, precios, <b>cuánto pagó y cómo</b>, y por dónde llegó el cliente.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <button class="btn pri co-mic${st.rec?" rec":""}" type="button" data-act="coMic">${st.rec?"⏹ Detener":"🎤 Toca y habla"}</button>
      ${SR?"":`<span class="muted" style="font-size:.85rem">Si no te sale el micrófono aquí, toca el cuadro de abajo y usa el 🎤 del teclado.</span>`}
    </div>
    <textarea id="coTxt" rows="5" style="width:100%;margin-top:10px" placeholder="Ej: Cliente Laura Gómez, 305 555 1234. Cien rosas, cuarenta rojas, treinta amarillas y treinta rosadas, papel blanco, con tarjeta que diga… Recoge en tienda hoy a las 2 de la tarde. Son 160 dólares, paga cash al recoger. Llegó por Messenger.">${esc(st.txt)}</textarea>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
      <button class="btn pri" type="button" data-act="coAi">✨ ${d?"Actualizar la orden con lo dictado":"Armar la orden"}</button>
      ${d||st.txt?`<button class="btn" type="button" data-act="coReset">Empezar de nuevo</button>`:""}
    </div>
    <span class="muted" id="coMsg" style="font-size:.85rem"></span>
    ${d&&((d.faltan||[]).length||coMissing(d).length)?`<div class="banner" style="background:var(--warn-soft);color:var(--ink);margin-top:10px;display:block">
      <b>Antes de crear la orden faltan estos datos:</b>
      <ul style="margin:6px 0;padding-left:20px">${((d.faltan||[]).length?d.faltan:coMissing(d)).map(q=>`<li>${esc(q)}</li>`).join("")}</ul>
      Contesta hablando: toca 🎤, responde y luego toca <b>“Actualizar la orden con lo dictado”</b>. También puedes llenarlo abajo.</div>`:""}
  </section>
  ${d?`<section class="panel"><div class="panel-h"><h2>Revisa la orden</h2><span class="muted">Corrige lo que haga falta</span></div>
    <form class="f" id="coForm" onsubmit="return false">
      ${f("no","Número de orden")}
      ${BRANDS_SELL.length>1?f("brand","Marca","sel",{opts:BRANDS_SELL.map(b=>[b,b])}):""}
      ${f("cliente","Cliente")}${f("telefono","Teléfono","tel")}
      ${f("titulo","Producto (título de la orden)","text",{full:true,ph:"100 rosas — 40 rojas + 30 amarillas + 30 rosadas"})}
      ${f("detallesTxt","Detalles (uno por línea)","area",{full:true,ph:"40 rojas · 30 amarillas · 30 rosadas\nPapel blanco\nCon tarjeta"})}
      ${f("tarjeta","Texto de la tarjeta (vacío = sin tarjeta)","area",{full:true,rows:5})}
      ${f("cinta","Texto de la cinta personalizada (vacío = sin cinta)","area",{full:true,rows:2})}
      ${f("entrega","Entrega","sel",{opts:[["recoge","Recoge en tienda"],["domicilio","Entrega a domicilio"]]})}
      ${f("recibe_nombre",d.entrega==="domicilio"?"Quién recibe":"Nombre de quien recoge")}
      ${d.entrega==="domicilio"?f("recibe_telefono","Teléfono de quien recibe","tel")+f("direccion","Dirección","text",{full:true}):""}
      ${f("fecha","Fecha","date")}${f("hora","Hora","text",{ph:"2:00 pm"})}
      ${f("lineasTxt","Desglose (una línea por cada cosa: descripción | precio)","area",{full:true,rows:5,ph:"100 rosas rojas naturales ($1.50 c/u) | 150\nCinta personalizada | 15\nDelivery | 20"})}
      <div class="fld"><label>Total</label><b class="num" id="coTot" style="font-size:1.2rem">${money(total)}</b></div>
      ${f("abonado","Ya pagó (USD)","number")}${f("metodoAbono","Cómo pagó eso","text",{ph:"Zelle"})}${f("metodo","Cómo paga lo que falta","text",{ph:"CASH al recoger"})}
      ${f("canal","Canal","text",{ph:"Meta Ads → Messenger"})}
      <div class="sep lbl">Para el conteo del portal</div>
      ${f("nat","Rosas naturales","number")}${f("dye","Rosas tinturadas","number")}
      ${f("extrasTxt","Extras (separados por coma)")}${f("extrasAmt","Valor de los extras","number")}${f("deliveryAmt","Delivery (USD)","number")}
      <div class="full muted">Por cobrar: <b id="coCob">${money(cobrar)}</b></div>
    </form>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <button class="btn pri" type="button" data-act="coPdf">📄 Ver PDF de la orden</button>
      ${st.pdf?`<button class="btn" type="button" data-act="coDl">⬇ Descargar PDF</button><button class="btn pri" type="button" data-act="coSubir">Pasar a Órdenes para subirla</button>`:""}
    </div>
    ${st.preview?`<div class="drop" style="margin-top:10px"><img src="${st.preview}" alt="Vista previa del PDF de la orden"></div>`:""}
  </section>`:""}`;
}

async function coAi(){
  const st=coState(),msg=document.getElementById("coMsg");
  const txt=(document.getElementById("coTxt").value||"").trim();st.txt=txt;
  if(!txt){msg.textContent="Primero dicta o escribe la orden.";return}
  if(!S.sample){msg.textContent="La IA no está disponible ahora. Inténtalo en un rato.";return}
  const brand=(st.d&&st.d.brand)||BRANDS_SELL[0];
  msg.textContent="La IA está armando la orden…";
  const prev=st.d?`\n\nORDEN ACTUAL (actualízala con lo nuevo del dictado y con las respuestas; conserva lo que no cambie):\n${JSON.stringify({cliente:st.d.cliente,telefono:st.d.telefono,titulo:st.d.titulo,detalles:coLines(st.d.detallesTxt),tarjeta:st.d.tarjeta,cinta:st.d.cinta,entrega:st.d.entrega,recibe_nombre:st.d.recibe_nombre,recibe_telefono:st.d.recibe_telefono,direccion:st.d.direccion,fecha:st.d.fecha,hora:st.d.hora,lineas:coItems(st.d.lineasTxt),rosas_naturales:nz(st.d.nat),rosas_tinturadas:nz(st.d.dye),abonado:nz(st.d.abonado),pago_dicho:!!st.d.pagoDicho,metodo_abono:st.d.metodoAbono,metodo_pago:st.d.metodo,canal:st.d.canal})}`:"";
  const prompt=`Eres el asistente de órdenes de ${brand}, una floristería en Miami. Un vendedor dictó una orden por voz; el dictado puede tener errores (palabras mal oídas, números en letras): corrígelos con sentido común, pero NUNCA inventes datos que no dijo. Hoy es ${today()} (AAAA-MM-DD); convierte "hoy", "mañana", "el viernes", etc. a fecha.
Arma la ORDEN DE TALLER de la tienda, con todo bien desglosado.

REGLAS DEL DESGLOSE ("lineas"):
- Una línea por CADA cosa que se cobra, cada una con su precio: las rosas (cantidad, color y si son naturales o tinturadas), y aparte cada extra (cinta personalizada, globo, peluche, letra, chocolates, etc.) y el delivery. Nunca juntes varias cosas en una sola línea.
- Si las rosas son de varios colores con un solo precio, va en una sola línea (ej. "100 rosas naturales: 40 rojas + 30 amarillas + 30 rosadas"). Si naturales y tinturadas tienen precios distintos, van en líneas separadas.
- Si el vendedor dijo solo el total y no cuánto vale cada cosa, NO lo repartas tú: pregúntalo en "faltan".
- La suma de las líneas es el total de la orden.

PREGUNTAS ("faltan"): una pregunta corta y clara (en español, de tú) por CADA dato obligatorio que no esté ni en el dictado ni en la orden actual. Obligatorios:
nombre y teléfono del cliente · qué lleva (cantidad de rosas, colores, naturales o tinturadas) · precio de cada cosa · si es pick-up (recoge en tienda) o delivery · si es delivery: dirección completa y nombre y teléfono de quien recibe · fecha y hora (de recogida o de entrega) · cuánto pagó ya (puede ser $0) y cómo paga lo que falta · si lleva tarjeta: el texto exacto · si lleva cinta personalizada: el texto exacto de la cinta.
Si un dato ya está, no lo preguntes. Si está todo, "faltan": [].

Responde SOLO un objeto JSON con estas claves:
{"cliente": string|null, "telefono": string|null,
"titulo": string (título corto como en la orden de taller, ej. "100 rosas — 40 rojas + 30 amarillas + 30 rosadas"),
"detalles": [string] (viñetas como en la orden de taller: colores y cantidades "40 rojas · 30 amarillas · 30 rosadas", papel ("Papel blanco"), moño, extras, "Con tarjeta (texto abajo — está en inglés, copiar tal cual)" si la tarjeta va en inglés, "Con cinta personalizada (texto abajo)"),
"tarjeta_lleva": boolean, "tarjeta": string|null (texto EXACTO de la tarjeta, en el idioma en que lo dictaron, con buena ortografía y puntuación; usa \\n entre saludo, cuerpo y despedida),
"cinta_lleva": boolean, "cinta": string|null (texto EXACTO de la cinta personalizada),
"entrega": "recoge"|"domicilio", "recibe_nombre": string|null, "recibe_telefono": string|null, "direccion": string|null,
"fecha": "AAAA-MM-DD"|null, "hora": string|null (ej. "2:00 pm"),
"lineas": [{"desc": string, "tipo": "rosas_naturales"|"rosas_tinturadas"|"extra"|"delivery", "cantidad": number (cantidad de rosas o de unidades), "precio": number (precio TOTAL de esa línea)}],
"pago_dicho": boolean (true si el vendedor dijo cuánto pagó ya, aunque sea $0), "abonado": number,
"metodo_abono": string|null (cómo pagó lo que YA pagó, ej. "Zelle"; null si no ha pagado nada),
"metodo_pago": string|null (cómo va a pagar LO QUE FALTA, ej. "CASH", "Zelle", "Tarjeta"; null si ya pagó todo),
"canal": string|null (por dónde llegó el cliente, ej. "Meta Ads → Messenger", "WhatsApp", "Instagram", "Llamada"),
"faltan": [string]}${prev}

DICTADO (puede traer al final las respuestas a las preguntas):
${txt.slice(0,8000)}`;
  try{
    const r=await S.sample.json(prompt,{modelTier:"default",cache:false});
    if(!r||typeof r!=="object")throw new Error("vacío");
    const o=st.d||{no:coNextNo(),brand};
    const L=(Array.isArray(r.lineas)?r.lineas:[]).filter(l=>l&&l.desc);
    const sumT=(t)=>L.filter(l=>l.tipo===t).reduce((a,l)=>a+nz(l.precio),0),cntT=(t)=>L.filter(l=>l.tipo===t).reduce((a,l)=>a+Math.round(nz(l.cantidad)),0);
    const lineTxt=(l)=>{const q=Math.round(nz(l.cantidad)),p=nz(l.precio);const unit=/^rosas_/.test(l.tipo)&&q>1&&p>0&&!/c\/u/.test(l.desc)?` (${money2(p/q)} c/u)`:"";return `${String(l.desc).replace(/\|/g,"/")}${unit} | ${p}`};
    const ex=L.filter(l=>l.tipo==="extra");
    st.d={...o,cliente:r.cliente||o.cliente||"",telefono:r.telefono||o.telefono||"",titulo:r.titulo||o.titulo||"",
      detallesTxt:Array.isArray(r.detalles)&&r.detalles.length?r.detalles.join("\n"):(o.detallesTxt||""),
      tarjetaLleva:!!r.tarjeta_lleva||!!r.tarjeta,tarjeta:r.tarjeta||"",cintaLleva:!!r.cinta_lleva||!!r.cinta,cinta:r.cinta||"",
      entrega:r.entrega==="domicilio"?"domicilio":"recoge",recibe_nombre:r.recibe_nombre||"",recibe_telefono:r.recibe_telefono||"",direccion:r.direccion||"",
      fecha:/^\d{4}-\d{2}-\d{2}$/.test(r.fecha||"")?r.fecha:(o.fecha||""),hora:r.hora||"",
      lineasTxt:L.length?L.map(lineTxt).join("\n"):(o.lineasTxt||""),
      pagoDicho:!!r.pago_dicho||!!o.pagoDicho,abonado:nz(r.abonado),metodoAbono:r.metodo_abono||"",metodo:r.metodo_pago||"",canal:r.canal||"",
      nat:L.length?cntT("rosas_naturales"):(o.nat||0),dye:L.length?cntT("rosas_tinturadas"):(o.dye||0),
      extrasTxt:ex.map(e=>e.desc).join(", "),extrasAmt:sumT("extra"),deliveryAmt:sumT("delivery"),
      faltan:(Array.isArray(r.faltan)?r.faltan:[]).filter(x=>typeof x==="string"&&x.trim()).slice(0,12)};
    st.pdf=null;st.preview=null;render();
    const m=document.getElementById("coMsg");if(m)m.textContent=(st.d.faltan.length||coMissing(st.d).length)?"La IA necesita unos datos más (mira la lista).":"Listo. Revisa los datos y toca “Ver PDF de la orden”.";
  }catch(e){msg.textContent=e.code==="not_granted"?"La IA no está activada.":e.code==="rate_limited"?"Muchas solicitudes seguidas; intenta en un rato.":"No pude armar la orden. Intenta otra vez o dila más despacio."}
}

async function coBuildPdf(d){
  if(!window.PDFLib)await loadScript("/portal/vendor/pdf-lib.min.js");
  const {PDFDocument,StandardFonts,rgb}=window.PDFLib;
  const doc=await PDFDocument.create();
  doc.setTitle("Orden #"+d.no+" · "+(d.brand||BRANDS_SELL[0]));
  const H=1800;let pg=doc.addPage([612,H]); // hoja alta; al final se encoge a carta si hace falta
  const F={tb:await doc.embedFont(StandardFonts.TimesRomanBold),ti:await doc.embedFont(StandardFonts.TimesRomanItalic),tr:await doc.embedFont(StandardFonts.TimesRoman),h:await doc.embedFont(StandardFonts.Helvetica),hb:await doc.embedFont(StandardFonts.HelveticaBold)};
  const hex=(h)=>rgb(parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255);
  const TH=CFG.orderTheme||{};
  const C={ac:hex(TH.accent||"#1f3d2c"),mu:hex("#666666"),tx:hex("#1a1a1a"),red:hex("#b3261e"),box:hex(TH.box||"#f4f3ee"),ln:hex("#c9c9c9"),wh:hex("#ffffff")};
  const W=612,M=40,R=W-M;let y=H-40;
  const clean=(s)=>String(s??"").replace(/[→➜➡]/g,"->").replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[^\x20-\x7E\xA0-\xFF—–…•€]/g,"").replace(/\s+/g," ").trim();
  const wd=(s,f,z)=>f.widthOfTextAtSize(clean(s),z);
  const t=(s,x,yy,f,z,c)=>{s=clean(s);if(s)pg.drawText(s,{x,y:yy,size:z,font:f,color:c||C.tx})};
  const tr=(s,yy,f,z,c)=>t(s,R-wd(s,f,z),yy,f,z,c);
  const sp=(s,x,yy,f,z,c,g)=>{for(const ch of clean(s)){pg.drawText(ch,{x,y:yy,size:z,font:f,color:c});x+=f.widthOfTextAtSize(ch,z)+g}};
  const hl=(yy,th,c)=>pg.drawLine({start:{x:M,y:yy},end:{x:R,y:yy},thickness:th,color:c||C.ln});
  const wrap=(s,f,z,max)=>{const out=[];let cur="";for(const w of clean(s).split(" ")){const n=cur?cur+" "+w:w;if(f.widthOfTextAtSize(n,z)>max&&cur){out.push(cur);cur=w}else cur=n}if(cur)out.push(cur);return out};
  const need=()=>{};
  const sec=(s)=>{need(34);y-=4;sp(s,M,y,F.hb,9,C.ac,1.8);hl(y-5,.8);y-=21};
  const brand=d.brand||BRANDS_SELL[0];
  const logo=(CFG.orderLogos||{})[brand]||(brand===BRANDS_SELL[0]?CFG.orderLogo:null);
  const seller=(P&&P.me&&P.me.role==="admin")?(P.me.name||"Isnel"):SHORT;
  // encabezado
  let top=y;
  if(logo){
    try{const png=await doc.embedPng(await (await fetch(logo)).arrayBuffer());const h=72,w=png.width*h/png.height;pg.drawImage(png,{x:M,y:top-h,width:w,height:h});sp("ORDEN DE TALLER",M,top-h-14,F.hb,9,C.mu,2.2);y=top-h-24}
    catch(e){t(brand,M,top-22,F.tb,26,C.ac);sp("ORDEN DE TALLER",M,top-38,F.hb,9,C.mu,2.2);y=top-50}
  }else{t(brand,M,top-22,F.tb,26,C.ac);sp("ORDEN DE TALLER",M,top-38,F.hb,9,C.mu,2.2);y=top-50}
  tr("Orden",top-6,F.h,11);tr("#"+d.no,top-28,F.hb,20);tr("Recibida: "+coFecha(today()).replace(/ \(.*\)$/,""),top-44,F.h,10);
  y=Math.min(y,top-52);pg.drawLine({start:{x:M,y},end:{x:R,y},thickness:3,color:C.ac});y-=16;
  // producto
  sec("PRODUCTO");
  for(const l of wrap(d.titulo||"Orden",F.tb,17,R-M)){need(24);t(l,M,y,F.tb,17);y-=22}
  y-=2;
  for(const b of coLines(d.detallesTxt)){for(const [i,l] of wrap(b,F.tr,11,R-M-24).entries()){need(16);if(i===0)pg.drawCircle({x:M+9,y:y+3.5,size:1.8,color:C.tx});t(l,M+20,y,F.tr,11);y-=16}}
  // tarjeta
  if(String(d.tarjeta||"").trim()){
    y-=4;sec("TARJETA — TEXTO PARA ESCRIBIR");
    const rows=[];for(const p of String(d.tarjeta).split("\n")){if(!p.trim()){rows.push("");continue}rows.push(...wrap(p,F.ti,12,R-M-28))}
    while(rows.length&&rows[rows.length-1]==="")rows.pop();
    const h=rows.length*16+16;need(h+8);
    pg.drawRectangle({x:M,y:y-h+12,width:R-M,height:h,color:C.box,borderColor:C.ac,borderWidth:1});
    let yy=y-4;for(const l of rows){if(l)t(l,M+14,yy,F.ti,12);yy-=16}
    y-=h+10;
  }
  // cinta personalizada
  if(String(d.cinta||"").trim()){
    y-=4;sec("CINTA PERSONALIZADA — TEXTO");
    const rows=[];for(const p of String(d.cinta).split("\n"))if(p.trim())rows.push(...wrap(p,F.tb,13,R-M-28));
    const h=rows.length*17+16;need(h+8);
    pg.drawRectangle({x:M,y:y-h+12,width:R-M,height:h,color:C.box,borderColor:C.ac,borderWidth:1});
    let yy=y-4;for(const l of rows){t(l,M+14,yy,F.tb,13);yy-=17}
    y-=h+10;
  }
  // entrega
  sec("ENTREGA");need(26);
  t(d.entrega==="domicilio"?"ENTREGA A DOMICILIO":"RECOGE EN TIENDA",M,y,F.tb,17);y-=22;
  const fld=(lbl,val)=>{need(34);sp(lbl,M,y,F.h,8,C.mu,1.2);t(val||"",M,y-14,F.tr,11.5);hl(y-22,.8,C.mu);y-=33};
  if(d.entrega==="domicilio"){fld("QUIÉN RECIBE",[d.recibe_nombre,d.recibe_telefono].filter(Boolean).join(" · "));fld("DIRECCIÓN",d.direccion)}
  else fld("NOMBRE DE QUIEN RECOGE",d.recibe_nombre);
  {need(34);const mid=M+(R-M)/2;sp("FECHA",M,y,F.h,8,C.mu,1.2);t(coFecha(d.fecha),M,y-14,F.tr,11.5);sp("HORA",mid+10,y,F.h,8,C.mu,1.2);t(d.hora||"",mid+10,y-14,F.tr,11.5);
   pg.drawLine({start:{x:M,y:y-22},end:{x:mid-10,y:y-22},thickness:.8,color:C.mu});pg.drawLine({start:{x:mid+10,y:y-22},end:{x:R,y:y-22},thickness:.8,color:C.mu});y-=33}
  // desglose
  sec("DESGLOSE");
  const items=coItems(d.lineasTxt),total=items.reduce((a,x)=>a+x.precio,0),ab=Math.min(nz(d.abonado),total),cob=Math.max(0,total-ab);
  for(const it of items){const ls=wrap(it.desc,F.h,11,R-M-90);ls.forEach((l,i)=>{need(18);t(l,M,y,F.h,11);if(i===0)tr(money2(it.precio),y,F.h,11);y-=16});y-=2}
  need(nz(d.abonado)>0?80:62);pg.drawLine({start:{x:M,y:y+8},end:{x:R,y:y+8},thickness:2,color:C.ac});y-=12;
  t("TOTAL",M,y,F.hb,15);tr(money2(total),y,F.hb,15);y-=12;
  if(ab>0){y-=8;t("YA PAGÓ"+(d.metodoAbono?" ("+d.metodoAbono+")":""),M,y,F.h,11);tr("-"+money2(ab),y,F.h,11);y-=10}
  pg.drawLine({start:{x:M,y},end:{x:R,y},thickness:2,color:C.ac});y-=24;
  const cuando=d.entrega==="domicilio"?"al entregar":"al recoger";
  if(cob>0){t("COBRAR AL ENTREGAR / RECOGER",M,y,F.hb,14,C.red);tr(money2(cob),y,F.hb,14,C.red)}else{t("PAGADO COMPLETO",M,y,F.hb,14,C.ac);tr(money2(0)+" por cobrar",y,F.hb,12,C.ac)}
  y-=30;
  const pill=cob>0?`COBRAR ${money2(cob)}${d.metodo?" · "+d.metodo.toUpperCase():""} ${cuando}`:"PAGADO";
  const pw=wd(pill,F.hb,9)+pill.length*0.6+20;
  pg.drawRectangle({x:M,y:y-6,width:pw,height:20,color:cob>0?C.red:C.ac});sp(pill,M+10,y,F.hb,9,C.wh,.6);
  if(d.canal){const s="Canal: "+d.canal;t(s,(M+pw+R-wd("Vendedor: "+seller,F.h,9))/2-wd(s,F.h,9)/2,y,F.h,9,C.mu)}
  tr("Vendedor: "+seller,y,F.h,9,C.mu);
  // una sola hoja carta: si no cabe, se reduce todo en proporción
  const bottom=Math.max(0,y-26),h=H-bottom,sc=Math.min(1,792/h);
  const out=await PDFDocument.create();out.setTitle("Orden #"+d.no+" · "+brand);
  const src=await PDFDocument.load(await doc.save());
  const emb=await out.embedPage(src.getPage(0),{left:0,right:612,bottom,top:H});
  out.addPage([612,792]).drawPage(emb,{x:(612-612*sc)/2,y:792-h*sc,width:612*sc,height:h*sc});
  return await out.save();
}
const money2=(n)=>"$"+nz(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});

function bindCrear(){
  const st=coState();
  const ta=document.getElementById("coTxt");if(ta)ta.oninput=()=>{st.txt=ta.value};
  const form=document.getElementById("coForm");
  if(form)form.querySelectorAll("[data-k]").forEach(el=>{
    el.oninput=el.onchange=(ev)=>{st.d[el.dataset.k]=el.value;if(el.dataset.k==="abonado")st.d.pagoDicho=true;if(el.dataset.k==="tarjeta")st.d.tarjetaLleva=!!el.value.trim();if(el.dataset.k==="cinta")st.d.cintaLleva=!!el.value.trim();
      if(st.pdf){st.pdf=null;st.preview=null;view.querySelectorAll('[data-act="coDl"],[data-act="coSubir"]').forEach(x=>x.remove());const im=view.querySelector('img[alt="Vista previa del PDF de la orden"]');if(im)im.parentNode.remove()}
      if(el.dataset.k==="entrega"&&ev.type==="change"){render();return}
      const tt=coTotal(st.d),a=document.getElementById("coTot"),c=document.getElementById("coCob");if(a)a.textContent=money(tt);if(c)c.textContent=money(Math.max(0,tt-nz(st.d.abonado)))};
  });
  const on=(a,fn)=>{const b=view.querySelector(`[data-act="${a}"]`);if(b)b.onclick=fn};
  on("coMic",()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(st.rec){try{st.rec.stop()}catch(e){}return}
    if(!SR){toast("Este navegador no tiene dictado aquí. Toca el cuadro y usa el micrófono del teclado.");ta&&ta.focus();return}
    const r=new SR();r.lang=CFG.voiceLang||"es-US";r.continuous=true;r.interimResults=true;
    const base=ta.value.trim()?ta.value.trim()+" ":"";let fin="";
    r.onresult=(e)=>{let tmp="";for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i][0].transcript;if(e.results[i].isFinal)fin+=x.trim()+" ";else tmp+=x}const el=document.getElementById("coTxt");if(el){el.value=(base+fin+tmp).trimStart();st.txt=el.value}};
    r.onerror=(e)=>{toast(e.error==="not-allowed"||e.error==="service-not-allowed"?"Dale permiso al micrófono en el navegador y toca otra vez.":e.error==="no-speech"?"No te escuché. Toca y habla otra vez.":"El dictado se detuvo. Toca otra vez para seguir.")};
    r.onend=()=>{st.rec=null;const el=document.getElementById("coTxt");if(el)st.txt=el.value;render()};
    try{r.start();st.rec=r;render()}catch(e){toast("No se pudo abrir el micrófono.")}
  });
  on("coAi",async()=>{const b=view.querySelector('[data-act="coAi"]');b.disabled=true;if(st.rec){try{st.rec.stop()}catch(e){}}await coAi();b.disabled=false});
  on("coReset",()=>{if(st.rec){try{st.rec.stop()}catch(e){}}S.co=null;render()});
  on("coPdf",async()=>{
    const d=st.d;if(!d.no||!String(d.no).trim()){toast("Pon el número de orden");return}
    if(Object.values(S.sales).some(o=>String(o.orderNo||"").toLowerCase()===String(d.no).replace(/^#/,"").toLowerCase())){toast("Ya hay una orden con el número "+d.no);return}
    const miss=coMissing(d);if(miss.length){render();toast("Falta: "+miss[0]);return}
    if((d.faltan||[]).length){toast("Primero contesta lo que pregunta la IA y toca “Actualizar la orden”");return}
    const b=view.querySelector('[data-act="coPdf"]');b.disabled=true;b.textContent="Armando el PDF…";
    try{st.pdf=await coBuildPdf(d);const r=await readPdf(new File([st.pdf],"orden.pdf",{type:"application/pdf"}));st.preview=r.preview;st.pdfText=r.text;render()}
    catch(e){b.disabled=false;b.textContent="📄 Ver PDF de la orden";toast("No pude armar el PDF. Revisa los datos e intenta otra vez.")}
  });
  on("coDl",()=>{const u=URL.createObjectURL(new Blob([st.pdf],{type:"application/pdf"}));const a=document.createElement("a");a.href=u;a.download=`orden-${st.d.no}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000)});
  on("coSubir",()=>{
    const d=st.d,file=new File([st.pdf],`orden-${d.no}.pdf`,{type:"application/pdf"});
    const notes=[String(d.tarjeta||"").trim()?"Tarjeta: "+String(d.tarjeta).replace(/\s*\n\s*/g," / "):"",String(d.cinta||"").trim()?"Cinta: "+String(d.cinta).replace(/\s*\n\s*/g," / "):"",d.entrega==="domicilio"?"Domicilio: "+[d.direccion,d.recibe_nombre].filter(Boolean).join(" · "):"Recoge en tienda",d.hora?"Hora: "+d.hora:"",d.canal?"Canal: "+d.canal:"",d.metodoAbono&&nz(d.abonado)>0?"Abonó "+money2(d.abonado)+" por "+d.metodoAbono:"",d.metodo?"Falta pagar por: "+d.metodo:""].filter(Boolean).join(" · ");
    S.draft={p:"of",file,pdfImg:null,pdfText:st.pdfText,preview:st.preview,fileName:file.name,orderText:st.txt.slice(0,4000),orderNo:String(d.no).replace(/^#/,""),client:d.cliente||d.recibe_nombre||"",phone:d.telefono||"",brand:d.brand||BRANDS_SELL[0],product:d.titulo,
      natQty:String(d.nat||0),dyeQty:String(d.dye||0),extrasTxt:d.extrasTxt||"",extrasAmt:String(d.extrasAmt||0),deliveryAmt:String(d.deliveryAmt||0),total:String(coTotal(d)),paid:String(Math.min(nz(d.abonado),coTotal(d))),deliveryDay:d.fecha||today(),notes:notes.slice(0,400),leadId:""};
    S.co=null;S.tab="ordenes";render();
    setTimeout(()=>{const f=document.getElementById("ofForm");if(f)f.scrollIntoView({behavior:"smooth",block:"start"})},80);
    toast("Revisa los datos y toca “Subir orden”");
  });
}

// ---------- restar dinero a una orden (errores, devoluciones, descuentos) ----------
// Se guarda como un "ajuste": un extra con monto negativo (kind "ajuste"). Resta del total,
// de las ventas del día en que se hace y de la comisión. Si el cliente ya había pagado más
// que el nuevo total, se registra la devolución como un pago negativo (refund).
// Siempre pide el código de Isnel (el servidor lo exige para cualquier cambio de total).
const AJ_TIPOS = ["Error en la orden","Devolución","Descuento","Producto dañado o faltante","Entrega tarde","Otro"];
function ajusteModal(s){
  if(!s)return;
  layer.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="ajT"><div class="card2">
    <h2 id="ajT">Restar dinero · orden ${esc(ordNo(s))} · ${esc(s.client)}</h2>
    <p class="muted" style="margin:0">Para errores, devoluciones o descuentos sobre una orden que ya existe. Se resta del total de la orden y de las ventas de <b>hoy</b>${COMMISSION?", y también de la comisión":""}. Necesita el código de Isnel.</p>
    <p class="muted" style="margin:0">Total actual ${money(s.total)} · pagó ${money(s.paid)}${s.total>s.paid?" · falta "+money(s.total-s.paid):" · pagada completa"}.</p>
    <div class="fld"><label for="ajK">Motivo</label><select id="ajK">${AJ_TIPOS.map(x=>`<option>${x}</option>`).join("")}</select></div>
    <div class="fld"><label for="ajC">Qué pasó</label><input id="ajC" placeholder="Ej: faltaron 20 rosas, se le descuentan"></div>
    <div class="fld"><label for="ajA">Monto a restar (USD)</label><input id="ajA" type="number" min="0" step="0.01" max="${s.total}" placeholder="20"></div>
    <div id="ajRes" class="banner" style="background:var(--sunk);color:var(--ink)">Escribe el monto para ver cómo queda la orden.</div>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" type="button" id="ajNo">Cancelar</button><button class="btn pri" type="button" id="ajOk">Restar y pedir código</button></div></div></div>`;
  const $=(id)=>document.getElementById(id);
  const calc=()=>{const amt=Math.min(nz($("ajA").value),s.total),nt=s.total-amt,refund=Math.max(0,s.paid-nt);return {amt,nt,refund,np:s.paid-refund}};
  const paint=()=>{const c=calc();if(c.amt<=0){$("ajRes").textContent="Escribe el monto para ver cómo queda la orden.";return}
    $("ajRes").innerHTML=`Nuevo total <b>${money(c.nt)}</b> (antes ${money(s.total)}) · ${c.refund>0?`<b style="color:var(--bad)">hay que devolverle ${money(c.refund)} al cliente</b>`:c.np>=c.nt?"queda pagada completa":`falta cobrar <b>${money(c.nt-c.np)}</b>`}`};
  $("ajA").oninput=paint;
  $("ajNo").onclick=()=>{layer.innerHTML=""};
  $("ajOk").onclick=async()=>{
    const tipo=$("ajK").value,desc=$("ajC").value.trim(),c=calc();
    if(!desc){$("ajC").focus();toast("Cuenta qué pasó");return}
    if(c.amt<=0){$("ajA").focus();return}
    if(nz($("ajA").value)>s.total){toast("No puedes restar más que el total de la orden");$("ajA").focus();return}
    layer.innerHTML="";
    const k=today(),t=Date.now(),sep=!!s.paidDay;
    const e={t,day:k,concept:`${tipo}: ${desc}`,kind:"ajuste",reason:tipo,amount:-c.amt,paidNow:sep,sep,settledDay:sep?k:null};
    const n={...s,total:c.nt,addons:[...(s.addons||[]),e],log:[...(s.log||[]),{t,text:`Ajuste: ${tipo} · ${desc} · −${money(c.amt)} · total ${money(c.nt)}${c.refund>0?` · devolución al cliente ${money(c.refund)}`:""}`}]};
    if(c.refund>0){n.paid=c.np;n.payments=[...(s.payments||[]),{t,amount:-c.refund,refund:true}]}
    if(n.paid>=n.total){n.status="pagada";n.paidDay=s.paidDay||k}else n.status="pendiente";
    S.sales[n.id]=n;render();const ok=await save("sales",n);
    if(ok){toast(`Ajuste guardado · orden ahora en ${money(n.total)}${c.refund>0?" · devolver "+money(c.refund):n.status==="pagada"?"":" · falta "+money(n.total-n.paid)}`);
      try{await P.mcp.callTool("Gmail","send_message",{to:[ADMIN_EMAIL],subject:`${PORTAL_NAME} · Ajuste aplicado a la orden ${ordNo(n)} (${n.client}) −${money(c.amt)}`,
        body:[`Se aplicó el ajuste que autorizaste con tu código.`,``,`Orden: ${ordNo(n)} · ${n.client}${n.phone?" · "+n.phone:""} · ${n.brand}`,`Motivo: ${tipo}`,`Qué pasó: ${desc}`,`Monto restado: ${money(c.amt)}`,`Total: ${money(s.total)} → ${money(n.total)}`,c.refund>0?`DEVOLVER AL CLIENTE: ${money(c.refund)}`:`Pagado ${money(n.paid)}${n.status==="pagada"?" · pagada completa":" · falta "+money(n.total-n.paid)}`,`Cuándo: ${fmtWhen(t)}`,``,`Al final de este correo el servidor anota quién lo hizo.`].join("\n")})}catch(x){}}
  };
}

// ---------- binding ----------
async function copy(text){try{await navigator.clipboard.writeText(text);toast("Copiado");return true}catch(e){toast("Selecciona el texto y cópialo a mano");return false}}
function bind(){
  if(S.tab==="crear")bindCrear();
  view.querySelectorAll("[data-lead]").forEach(e=>{if(e.tagName==="FORM")return;e.onclick=(ev)=>{if(ev.target.closest("input,button"))return;openLead(e.dataset.lead)};e.onkeydown=(ev)=>{if(ev.key==="Enter")openLead(e.dataset.lead)}});
  view.querySelectorAll("[data-openlead]").forEach(b=>b.onclick=()=>openLead(b.dataset.openlead));
  view.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>{S.tab=b.dataset.goto;render();window.scrollTo(0,0)});
  view.querySelectorAll("[data-inc]").forEach(b=>b.onclick=async()=>{
    const key=b.dataset.inc;const d={...dayDoc(today())};
    if(key==="abbaAnswered")d[key]=(d[key]||0)+1;
    else{d.content={...(d.content||{})};d.content[key]=(d.content[key]||0)+1}
    d.contentLog=[...(d.contentLog||[]),{t:Date.now(),k:key}];
    await saveDay(d);
  });
  const pt=document.getElementById("propTxt");if(pt)pt.oninput=()=>{S.propDraft=pt.value};
  view.querySelectorAll('[data-act="sendProp"]').forEach(b=>b.onclick=async()=>{
    const txt=(document.getElementById("propTxt")||{}).value||"";if(txt.trim().length<40){toast("Escribe tu propuesta completa antes de enviarla.");return}
    const m=today().slice(0,7);b.disabled=true;b.textContent="Enviando…";
    try{await P.mcp.callTool("Gmail","send_message",{to:[ADMIN_EMAIL],subject:`📝 Propuesta de venta de ${fmtMonth(m)} · ${NAME} · ${PT}`,body:`Propuesta de venta de ${NAME} (${PT}) para ${fmtMonth(m)}:\n\n${txt.trim()}\n\nEnviada desde el portal ${fmtWhen(Date.now())}.`})}
    catch(e){b.disabled=false;b.textContent="Enviar propuesta a Isnel";toast("No se pudo enviar. Revisa tu internet e inténtalo otra vez.");return}
    const d={...dayDoc(today())};d.proposal={month:m,text:txt.trim(),sentAt:Date.now()};S.propDraft="";await saveDay(d);toast("Propuesta enviada a Isnel")});
  view.querySelectorAll('[data-act="newLead"]').forEach(b=>b.onclick=()=>{S.tab="leads";S.showAdd=true;render();setTimeout(()=>{const i=document.getElementById("lfName");i&&i.focus()},50)});
  view.querySelectorAll('[data-act="toggleAdd"]').forEach(b=>b.onclick=()=>{S.showAdd=!S.showAdd;S.showImport=false;render()});
  view.querySelectorAll('[data-act="toggleImport"]').forEach(b=>b.onclick=()=>{if(S.importing)return;S.showImport=!S.showImport;S.showAdd=false;render()});
  view.querySelectorAll('[data-act="manualCheckin"]').forEach(b=>b.onclick=()=>openCheckin(Math.max(17,coHour())));
  view.querySelectorAll("[data-more]").forEach(b=>b.onclick=()=>{S.colLimit[b.dataset.more]=(S.colLimit[b.dataset.more]||40)+40;render()});
  view.querySelectorAll("[data-lb]").forEach(b=>b.onclick=()=>{S.leadBrand=b.dataset.lb;render()});
  view.querySelectorAll("[data-of]").forEach(b=>b.onclick=()=>{S.orderFilter=b.dataset.of;render()});
  view.querySelectorAll("[data-pay]").forEach(b=>b.onclick=()=>payModal(S.sales[b.dataset.pay]));
  view.querySelectorAll("[data-viewfile]").forEach(b=>b.onclick=()=>viewFile(S.sales[b.dataset.viewfile]));
  view.querySelectorAll("[data-addon]").forEach(b=>b.onclick=()=>addonModal(S.sales[b.dataset.addon]));
  view.querySelectorAll("[data-ajuste]").forEach(b=>b.onclick=()=>ajusteModal(S.sales[b.dataset.ajuste]));
  view.querySelectorAll("[data-paidfull]").forEach(b=>b.onclick=()=>{const s=S.sales[b.dataset.paidfull];if(s)markPaidFull(s)});
  view.querySelectorAll("[data-snooze]").forEach(b=>b.onclick=async()=>{const s=S.sales[b.dataset.snooze];if(!s)return;const n={...s,snoozeDay:today(),log:[...(s.log||[]),{t:Date.now(),text:"Aún sin pago completo"}]};S.sales[n.id]=n;render();await save("sales",n);toast("Te lo vuelvo a preguntar mañana")});
  view.querySelectorAll("[data-deliv]").forEach(b=>b.onclick=async()=>{const s=S.sales[b.dataset.deliv];if(!s)return;const n={...s,delivered:true,deliveredDay:today(),log:[...(s.log||[]),{t:Date.now(),text:"Entregada"}]};S.sales[n.id]=n;render();await save("sales",n);toast(n.status==="pagada"?"Entregada":"Entregada · sigue por cobrar "+money(n.total-n.paid))});
  const lf=document.getElementById("leadForm");
  if(lf)lf.onsubmit=async(e)=>{e.preventDefault();const k=today();
    let name=document.getElementById("lfName").value.trim();if(!name||NONAME.test(name))name="Cliente #"+nextClientNo();
    const phone=document.getElementById("lfPhone").value.trim();
    const dup=digits(phone).length>=7&&Object.values(S.leads).find(l=>digits(l.phone)===digits(phone));
    if(dup){toast("Ese número ya está: "+dup.name);openLead(dup.id);return}
    const note=document.getElementById("lfNote").value.trim();
    const l={id:uid(),name,phone,brand:document.getElementById("lfBrand").value,source:document.getElementById("lfSrc").value,lang:document.getElementById("lfLang").value,stage:"nuevo",created:Date.now(),createdDay:k,notes:note,fuStep:0,nextFU:null,history:[{t:Date.now(),day:k,kind:"note",text:"Lead creado"+(note?": "+note:"")}]};
    S.leads[l.id]=l;S.showAdd=false;render();await save("leads",l);toast(l.lang==="en"?"Lead guardado. Escríbele por chat.":"Lead guardado. Cuando lo llames, toca “Ya lo llamé”.");openLead(l.id)};
  const imf=document.getElementById("importForm");
  if(imf)imf.onsubmit=async(e)=>{e.preventDefault();
    let txt=document.getElementById("imText").value;
    const f=document.getElementById("imFile").files[0];
    if(f)txt+="\n"+await f.text();
    const rows=parseLines(txt);
    if(!rows.length){toast("No encontré contactos en esa lista");return}
    runImport(rows,document.getElementById("imBrand").value,document.getElementById("imSrc").value,document.getElementById("imLang").value);
  };
  const lq=document.getElementById("lq");
  if(lq){let tm;lq.oninput=()=>{clearTimeout(tm);tm=setTimeout(()=>{S.leadQuery=lq.value;const pos=lq.selectionStart;render();const n=document.getElementById("lq");n.focus();n.setSelectionRange(pos,pos)},250)}}
  if(S.tab==="leads")bindBoard();
  bindOrderForm(document.getElementById("ofForm"),"of");
  const tf=document.getElementById("taskForm");
  if(tf)tf.onsubmit=async(e)=>{e.preventDefault();const t={id:uid(),title:document.getElementById("tfTitle").value.trim(),due:localInputToMs(document.getElementById("tfDue").value),leadId:document.getElementById("tfLead").value,done:false,created:Date.now()};if(!t.title)return;S.tasks[t.id]=t;render();await save("tasks",t);toast("Tarea agregada")};
  view.querySelectorAll("[data-task]").forEach(b=>b.onclick=async()=>{const t={...S.tasks[b.dataset.task],done:true,doneAt:Date.now()};S.tasks[t.id]=t;render();await save("tasks",t)});
  const dn=document.getElementById("dNotes");
  if(dn){let tm;dn.oninput=()=>{clearTimeout(tm);tm=setTimeout(async()=>{const d={...dayDoc(today()),notes:dn.value};S.days[d.id]=d;await save("days",d);const p=document.getElementById("drText");if(p)p.textContent=dailyReport(today())},900)}}
  view.querySelectorAll("[data-copy]").forEach(b=>b.onclick=async()=>{
    const ok=await copy(document.getElementById(b.dataset.copy).textContent);if(!ok)return;
    if(b.dataset.mark){const d={...dayDoc(today()),reportSent:Date.now()};await saveDay(d)}
    if(b.dataset.markweek&&dow(today())===0){const d={...dayDoc(today()),weeklySent:Date.now()};await saveDay(d);toast("Reporte semanal marcado como enviado")}
  });
  const ms=document.getElementById("mSel");if(ms)ms.onchange=()=>{S.month=ms.value;render()};
  const hd=document.getElementById("hDay");if(hd)hd.onchange=()=>{S.histDay=hd.value||today();hd.blur();render()};
}

// ---------- boot ----------
render();
(async()=>{
  const db=P.db;
  S.db=db;
  if(!db){view.innerHTML=`<div class="banner">No se pudo abrir la base de datos. Revisa tu internet y vuelve a entrar.</div>`;return}
  const timer=setTimeout(()=>{S.offline=true;Object.keys(S.ready).forEach(k=>S.ready[k]=true);render()},10000);
  const cols=["leads","sales","tasks","days"];
  let pending=null;
  const safeRender=()=>{
    if(S.importing||S.dragging)return;
    const a=document.activeElement;
    if(a&&(view.contains(a)||layer.contains(a))&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)){paintTabs();return}
    if(layer.querySelector("#dofForm")||(S.tab==="ordenes"&&S.draft)||(S.tab==="crear"&&S.co&&(S.co.txt||S.co.d||S.co.rec))){paintTabs();return}
    render();checkinTick();
  };
  for(const c of cols){
    db.collection(c).onSnapshot(snap=>{
      const m={};snap.docs.forEach(d=>{const b=d.data();m[d.id]={...b,id:d.id};RAW[c+"/"+d.id]=b;LAST[c+"/"+d.id]=b});
      try{snap.docChanges().forEach(ch=>{if(ch.type==="removed"){const k2=c+"/"+ch.doc.id;delete RAW[k2];delete LAST[k2];if(H.ready&&!snap.metadata.fromCache){const b=ch.doc.data()||{};alertar(c,ch.doc.id,"borrado",((H.shards[shardOf(c,ch.doc.id)]||{})[ch.doc.id]||{}).h||"x",nameOf(c,b,ch.doc.id))}}})}catch(e){}
      if(!snap.metadata.fromCache){FRESH[c]=true;setTimeout(detect,0)}
      S[c]=m;S.ready[c]=true;
      if(!snap.metadata.fromCache&&cols.every(x=>S.ready[x])){clearTimeout(timer);S.offline=false}
      if(cols.every(x=>S.ready[x])){clearTimeout(pending);pending=setTimeout(safeRender,120)}
    },()=>{clearTimeout(timer);S.offline=true;render()});
  }
  bootHist(db);
  db.collection("months").onSnapshot(s=>{const m={};s.docs.forEach(d=>m[d.id]=d.data());S.months=m;if(S.tab==="resumen")render()},()=>{});
  try{await db.collection("visits").doc(today()).set({t:Date.now()})}
  catch(e){if(e.code==="unauthenticated")saveErr("Tu sesión terminó. Vuelve a entrar con tu contraseña.")}
  S.sample=P.sample;
  S.assets=P.assets;
  if(S.tab==="ordenes"||S.openLead)render();
})();

};
