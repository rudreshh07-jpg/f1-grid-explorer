import React, {useEffect, useState} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Routes, Route, Link, useParams} from 'react-router-dom'
import {Menu, X, Search, ArrowRight, Trophy, Flag, Gauge, MapPinned, CalendarDays, BookOpen, Users, CarFront, Timer, ChevronRight, ExternalLink, History as HistoryIcon, SlidersHorizontal, ShieldCheck, LogIn, LogOut, Save, Plus, Trash2, RefreshCw, KeyRound} from 'lucide-react'
import './styles.css'

const API=import.meta.env.VITE_API_URL||'/api'
async function get(path){const r=await fetch(API+path); if(!r.ok) throw new Error(`API ${r.status}`); return r.json()}
async function send(path,options={}){const {headers,...rest}=options;const r=await fetch(API+path,{...rest,headers:{'Content-Type':'application/json',...(headers||{})}});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`API ${r.status}`);return data}

const teamTheme={
  Mercedes:{a:'#00a19c',b:'#087f78',glow:'#13d8c7'},Ferrari:{a:'#e10600',b:'#68000b',glow:'#ff1d17'},McLaren:{a:'#ff8700',b:'#9b4700',glow:'#ffb000'},'Red Bull Racing':{a:'#173b8f',b:'#17152e',glow:'#486dff'},'Racing Bulls':{a:'#4b5f9c',b:'#101735',glow:'#91a7ff'},Alpine:{a:'#2293d1',b:'#0a3564',glow:'#54c5ff'},'Haas F1 Team':{a:'#b8b8b8',b:'#222',glow:'#eee'},Audi:{a:'#b7b9bc',b:'#34373b',glow:'#fff'},Williams:{a:'#00a3e0',b:'#092e4d',glow:'#46d8ff'},'Aston Martin':{a:'#006f62',b:'#0c342f',glow:'#14bfae'},Cadillac:{a:'#d7d8da',b:'#27282c',glow:'#fff'}
}
const fallbackTheme={a:'#e10600',b:'#15151a',glow:'#ff332d'}
function theme(team){return teamTheme[team]||fallbackTheme}

function MediaImage({kind='driver',title='',className=''}){
  const label=kind==='driver'?'DRIVER PROFILE':kind==='team'?'TEAM VISUAL':'CIRCUIT VISUAL'
  const initials=(title||'F1').split(/\s+/).map(x=>x[0]).join('').slice(0,3).toUpperCase()
  return <div className={`media-placeholder ${className}`} aria-label={`${label}: ${title||'F1'}`}><span className="media-placeholder-mark">{initials}</span><strong>{title||'F1'}</strong><small>{label} • IMAGE NOT USED</small></div>
}


function Shell({children}){
  const [open,setOpen]=useState(false)
  const nav=[['/','Home'],['/drivers','Drivers'],['/teams','Teams'],['/circuits','Circuits'],['/champions','Champions'],['/archive','F1 Archive'],['/history','History'],['/strategy','Strategy & Tyres'],['/glossary','Glossary']]
  return <div className="app dark">
    <header className="nav"><Link className="brand" to="/" aria-label="Grid Formula Racing Explorer"><span className="brand-wordmark">GRID</span></Link><button className="mobile-menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
      <nav className={open?'nav-links show':'nav-links'}>{nav.map(([to,label])=><Link key={to} to={to} onClick={()=>setOpen(false)}>{label}</Link>)}<Link className="admin-link" to="/admin">ADMIN</Link></nav>
    </header>
    <main>{children}</main>
    <footer className="footer"><div><strong>GRID</strong><span>Independent Formula Racing Explorer</span></div><span>Dark interface • SQLite database • open-data sources listed in Attribution</span></footer>
  </div>
}

function Page({title,kicker,subtitle,children}){return <div className="page"><div className="page-head"><span className="kicker">{kicker}</span><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{children}</div>}
function Panel({children,className=''}){return <div className={`panel ${className}`}>{children}</div>}function DetailModal({kicker='F1 GUIDE',title,subtitle,icon=null,sections=[],onClose}){
 useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous}},[])
 return <div className="modal-backdrop" onMouseDown={onClose}>
   <div className="education-modal panel" onMouseDown={e=>e.stopPropagation()}>
     <button className="modal-close icon-btn" onClick={onClose}><X/></button>
     {icon}<span className="kicker">{kicker}</span><h2>{title}</h2>
     {subtitle&&<p className="modal-lead">{subtitle}</p>}
     <div className="education-sections">{sections.filter(x=>x&&((x.body&&String(x.body).trim())||(x.items&&x.items.length))).map((x,i)=><section className="education-section" key={`${x.title||'section'}-${i}`}><span className="kicker">{x.title}</span>{x.body&&<p>{x.body}</p>}{x.items&&<ul>{x.items.map((item,j)=><li key={j}>{item}</li>)}</ul>}</section>)}</div>
     <button className="btn ghost modal-bottom-close" onClick={onClose}>Close</button>
   </div>
 </div>
}
function educationalSections(item,kind){
 const term=item?.term||item?.name||item?.title||'F1 topic'; const definition=item?.definition||item?.detail||item?.description||item?.body||item?.simple||'';
 const generic={
  glossary:[{title:'WHAT IT MEANS',body:item?.explanation||definition},{title:'HOW IT APPEARS ON A RACE WEEKEND',body:item?.raceUse||`You may hear ${term} mentioned by the driver, race engineer, commentator or team strategy group when discussing car behaviour, timing or race decisions.`},{title:'BEGINNER EXAMPLE',body:item?.example||`Imagine a driver approaching a corner or race situation where ${term.toLowerCase()} affects the car. The team watches the effect in timing and driver feedback, then changes the setup, driving approach or strategy accordingly.`},{title:'WHY IT MATTERS',body:item?.whyItMatters||`Understanding ${term} makes team radio, commentary and timing screens much easier to follow.`},{title:'QUICK TIP',body:item?.beginnerTip||'Focus first on what the term changes: speed, grip, energy, tyre life, track position or the rules.'}],
  session:[{title:'WHAT THIS SESSION IS',body:item?.explanation||definition},{title:'WHAT TEAMS DO',body:item?.whatHappens||'Teams use the session to collect timing, tyre, setup and reliability information and to decide what they need to change before the next session.'},{title:'WHAT A BEGINNER SHOULD WATCH',body:item?.watchFor||'Compare lap times, tyre compounds, track position and whether drivers are doing short or long runs. One lap time does not always tell the whole story.'},{title:'WHY IT MATTERS',body:item?.whyItMatters||'The session helps teams build a competitive and reliable car for qualifying and the race.'},{title:'SIMPLE EXAMPLE',body:item?.example||`If a driver is fast over one lap but struggles over several laps, the team may learn something important about setup or tyre behaviour during ${item?.name||'this session'}.`}],
  rule:[{title:'THE RULE',body:item?.explanation||definition},{title:'HOW IT WORKS',body:item?.howItWorks||'Race control, the FIA and the stewards apply the sporting and technical regulations throughout the weekend. The exact consequence depends on the incident and the relevant regulation.'},{title:'BEGINNER EXAMPLE',body:item?.example||`A simple example is a driver gaining an advantage while breaking the ${item?.title||'rule'}. Officials can review the evidence and decide whether action is required.`},{title:'WHY IT MATTERS',body:item?.whyItMatters||'Rules exist so drivers and teams compete under the same sporting framework and racing remains safe and fair.'},{title:'REMEMBER',body:item?.beginnerTip||'The important idea is not only the penalty; it is the behaviour the rule is designed to control.'}],
  strategy:[{title:'WHAT THE STRATEGY DOES',body:item?.explanation||item?.simple||definition},{title:'HOW IT WORKS',body:item?.how},{title:'WHEN TEAMS USE IT',body:item?.when},{title:'TRADE-OFF',body:item?.tradeoff||'Every strategy trades one advantage for another: tyre freshness, track position, pit-lane time, clean air or flexibility later in the race.'},{title:'BEGINNER EXAMPLE',body:item?.example||`A team may choose ${item?.name||'this strategy'} when the expected time gained on track is greater than the time lost by changing tyres or changing the timing of the stop.`}],
  tyre:[{title:'WHAT THIS TYRE IS',body:item?.explanation||item?.detail||definition},{title:'WHEN TO USE IT',body:item?.conditions||item?.use},{title:'WHAT THE DRIVER FEELS',body:item?.driverFeel||'A tyre that is working well gives predictable grip. Outside its operating window, the driver can feel a loss of traction, braking performance or cornering confidence.'},{title:'BEGINNER EXAMPLE',body:item?.example||'If the track is cool and a tyre is difficult to bring into its operating window, a team may prefer a different compound or adjust the strategy.'},{title:'STRATEGY NOTE',body:item?.strategyNote||'Tyre choice is not only about peak grip. Teams also consider degradation, temperature, track position, weather and the number of new sets available.'}],
  flag:[{title:'WHAT THE FLAG MEANS',body:item?.explanation||item?.detail||definition},{title:'WHAT THE DRIVER SHOULD DO',body:item?.whatToDo},{title:'WHY RACE CONTROL USES IT',body:item?.why},{title:'BEGINNER EXAMPLE',body:item?.example||`If ${term.toLowerCase()} is shown, the driver must react to the instruction. Marshals and race control use flags to communicate quickly when radio communication alone is not enough.`},{title:'WHAT TO WATCH FOR',body:item?.watchFor||'Look at where the flag is displayed, whether it is shown to one driver or the whole field, and how the cars change speed or behaviour afterwards.'}]
 }; return generic[kind]||generic.glossary
}


function Home(){const [drivers,setDrivers]=useState([]),[circuits,setCircuits]=useState([]);useEffect(()=>{Promise.all([get('/drivers'),get('/circuits')]).then(([d,c])=>{setDrivers(d);setCircuits(c)})},[]);const next=circuits.find(c=>new Date(c.date)>=new Date())||circuits[0];return <div>
 <section className="home-hero"><div className="hero-bg"></div><div className="page home-hero-inner"><div><span className="kicker">2026 FIA FORMULA ONE WORLD CHAMPIONSHIP</span><h1>FORMULA 1,<br/><em>EXPLORED.</em></h1><p>Drivers, teams, circuits, history, rules and race strategy — presented as a fast F1 editorial experience.</p><div className="hero-actions"><Link className="btn primary" to="/drivers">Explore the grid <ArrowRight/></Link><Link className="btn ghost" to="/circuits">Explore circuits</Link></div></div><div className="hero-feature"><span className="round">NEXT RACE</span><b>R{String(next?.round||14).padStart(2,'0')}</b><strong>{next?.name||'Zandvoort'}</strong><span>{next?.country} • {next?.date}</span></div></div></section>
 <section className="page section"><div className="section-head"><div><span className="kicker">THE GRID</span><h2>Current drivers</h2></div><Link className="text-link" to="/drivers">View all <ArrowRight/></Link></div><div className="driver-grid large">{drivers.slice(0,8).map(d=><DriverCard d={d} key={d.id}/>)}</div></section>
 <section className="page section"><div className="stats-strip"><div><b>1950</b><span>World Championship began</span></div><div><b>{drivers.length}</b><span>Current drivers</span></div><div><b>{circuits.length}</b><span>2026 venues</span></div><div><b>77+</b><span>Years of history</span></div></div></section>
 </div>}

function DriverCard({d}){const t=theme(d.team);return <Link to={`/drivers/${encodeURIComponent(d.id)}`} className="driver-card editorial" style={{'--a':t.a,'--b':t.b,'--glow':t.glow}}><div className="driver-card-bg"></div><div className="driver-copy"><span className="driver-first">{(d.name||'').split(' ').slice(0,-1).join(' ')}</span><strong>{(d.name||'').split(' ').slice(-1).join(' ')}</strong><span className="driver-team">{d.team}</span><span className="driver-num">{d.number}</span><span className="driver-country">{d.flag} {d.nationality}</span></div><div className="driver-photo"><MediaImage kind="driver" slug={d.id} title={d.name} alt={d.name} className="driver-media" position="50% 18%"/></div><span className="card-arrow"><ArrowRight/></span></Link>}

function Drivers(){const [rows,setRows]=useState([]),[q,setQ]=useState(''),[champ,setChamp]=useState('all');useEffect(()=>{get('/drivers').then(setRows)},[]);const filtered=rows.filter(d=>{const text=JSON.stringify(d).toLowerCase();const champion=Number(d.championships||d.career?.championships||0)>0;return text.includes(q.toLowerCase())&&(champ==='all'||champion)});return <Page title="Current Drivers" kicker="2026 GRID" subtitle="The current Formula 1 grid only. Historical drivers live in F1 Archive. Search by name, team or nationality."><div className="filterbar driver-filters"><label><span>Search current drivers</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search driver, team or nationality..."/><Search/></label><label><span>Championship</span><select value={champ} onChange={e=>setChamp(e.target.value)}><option value="all">All drivers</option><option value="champion">World champions</option></select></label><strong>{filtered.length} shown</strong></div><div className="driver-grid large">{filtered.map(d=><DriverCard d={d} key={d.id}/>)}</div></Page>}

function DriverDetail(){const {id}=useParams();const [d,setD]=useState(null);useEffect(()=>{let alive=true;const load=async()=>{try{const x=await get('/drivers/'+encodeURIComponent(id));if(alive)setD(x);return}catch{}try{const rows=await get('/drivers');const key=decodeURIComponent(id).toLowerCase();const x=rows.find(r=>String(r.id).toLowerCase()===key||slugify(r.name)===key||String(r.name).toLowerCase()===key);if(alive)setD(x||null)}catch{if(alive)setD(null)}};load();return()=>{alive=false}},[id]);if(!d)return <Page title="Driver profile" kicker="F1 DRIVER"><Panel>Driver not found.</Panel></Page>;const t=theme(d.team);const season=d.season||{};const career=d.career||{};return <Page title={d.name.toUpperCase()} kicker={`#${d.number} • ${d.team}`} subtitle={`${d.flag} ${d.nationality} • F1 debut ${d.debut}`}>
 <div className="profile-top"><Panel className="profile-photo" style={{'--a':t.a,'--b':t.b}}><div className="profile-number">#{d.number}</div><MediaImage kind="driver" slug={d.id} title={d.name} alt={d.name} className="driver-profile-media" position="50% 18%" priority/><div className="profile-team">{d.team}</div></Panel><Panel className="profile-info"><span className="kicker">PERSONAL INFORMATION</span><Info label="Nationality" value={`${d.flag} ${d.nationality}`}/><Info label="Date of birth" value={d.dob}/><Info label="Birthplace" value={d.birthplace}/><Info label="F1 debut" value={d.debut}/><Info label="Driver number" value={`#${d.number}`}/></Panel></div>
 <div className="metrics">{[['World titles',career.championships??d.championships,Trophy],['Grand Prix wins',career.wins??d.wins,Flag],['Podiums',career.podiums??d.podiums,Users],['Pole positions',career.poles??d.poles,Gauge],['Fastest laps',d.fastestLaps??'—',Timer],['Grand Prix starts',career.grandsPrix??'—',CalendarDays]].map(([l,v,I])=><Panel className="metric" key={l}><I/><strong>{v}</strong><span>{l}</span></Panel>)}</div>
 <div className="profile-lower"><Panel><span className="kicker">2026 SEASON</span><h2>Current campaign</h2><div className="stat-table">{[['Championship position',season.position?`${season.position}${ordinal(season.position)}`:'—'],['Season points',season.points??'—'],['Grand Prix wins',season.wins??'—'],['Grand Prix podiums',season.podiums??'—'],['Grand Prix poles',season.poles??'—'],['DHL fastest laps',season.fastestLaps??'—'],['DNFs',season.dnfs??'—']].map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>)}</div></Panel><Panel><span className="kicker">CAREER STATS</span><h2>Career snapshot</h2><div className="stat-table">{[['Grands Prix entered',career.grandsPrix??'—'],['Career points',career.points??'—'],['Highest race finish',career.wins?`1 (x${career.wins})`:'—'],['Podiums',career.podiums??'—'],['Highest grid position',career.poles?`1 (x${career.poles})`:'—'],['Pole positions',career.poles??'—'],['World championships',career.championships??d.championships],['DNFs',career.dnfs??'—']].map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>)}</div></Panel></div>
 <Panel className="source-note"><ShieldCheck size={18}/><span>Statistics are stored in the local database. Admin can run <b>Sync driver data</b> to refresh this profile from the public F1 results data API.</span></Panel>
 </Page>}
function ordinal(n){return n===1?'st':n===2?'nd':n===3?'rd':'th'}
function Info({label,value}){return <div className="info-row"><span>{label}</span><b>{value||'—'}</b></div>}

function Teams(){const [data,setData]=useState([]),[q,setQ]=useState('');useEffect(()=>{get('/teams').then(setData)},[]);const filtered=data.filter(t=>JSON.stringify(t).toLowerCase().includes(q.toLowerCase()));return <Page title="Teams" kicker="11 CONSTRUCTORS" subtitle="Explore every 2026 team with its drivers, power unit, base, principal, championship record and current-season points."><div className="filterbar"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search teams or drivers..."/><span>{filtered.length} teams</span></div><div className="team-grid editorial-teams">{filtered.map((t,i)=><TeamCard t={t} i={i} key={t.id||t.name}/>)}</div></Page>}
function TeamCard({t,i}){const th=theme(t.name);return <Link to={`/teams/${encodeURIComponent(t.id||t.name)}`} className="team-card editorial" style={{'--a':th.a,'--b':th.b,'--glow':th.glow}}><div className="team-photo"><MediaImage kind="team" slug={slugify(t.name)} title={t.name} alt={`${t.name} team`} position="50% 35%"/><div className="team-shade"></div></div><div className="team-copy"><span className="team-index">{String(i+1).padStart(2,'0')}</span><h2>{t.name}</h2><div className="team-drivers"><span>{t.driver1}</span><span>{t.driver2}</span></div><div className="team-bottom"><span><small>2026 POINTS</small><b>{t.seasonPoints??t.points2026??0}</b></span><span><small>WORLD TITLES</small><b>{t.championships??0}</b></span><span><small>POWER UNIT</small><b>{t.powerUnit}</b></span></div></div><ArrowRight className="team-arrow"/></Link>}
function slugify(s){return String(s||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function TeamDetail(){const {id}=useParams();const [data,setData]=useState([]);useEffect(()=>{get('/teams').then(setData)},[]);const t=data.find(x=>String(x.id||x.name)===decodeURIComponent(id));if(!t)return <Page title="Team profile" kicker="TEAM"><Panel>Team not found.</Panel></Page>;const th=theme(t.name);return <Page title={t.name} kicker={`${t.flag||''} CURRENT CONSTRUCTOR`} subtitle={`${t.driver1} • ${t.driver2}`}><div className="team-detail-hero"><Panel className="team-hero-photo" style={{'--a':th.a,'--b':th.b}}><MediaImage kind="team" slug={slugify(t.name)} title={t.name} alt={t.name} position="50% 35%" priority/></Panel><Panel className="team-hero-info"><span className="kicker">TEAM IDENTITY</span><h2>{t.name}</h2><p>{t.base||'Formula 1 constructor'} • {t.principal||'—'}</p><div className="driver-pair"><span>{t.driver1}</span><span>{t.driver2}</span></div><div className="team-detail-stats"><Info label="Power unit" value={t.powerUnit}/><Info label="Base" value={t.base}/><Info label="Team principal" value={t.principal}/><Info label="World titles" value={t.championships}/><Info label="2026 points" value={t.seasonPoints??t.points2026}/></div></Panel></div></Page>}

function Circuits(){const [data,setData]=useState([]),[q,setQ]=useState('');useEffect(()=>{get('/circuits').then(setData)},[]);const filtered=data.filter(c=>JSON.stringify(c).toLowerCase().includes(q.toLowerCase()));return <Page title="Circuit Explorer" kicker="2026 GRAND PRIX VENUES" subtitle="Every circuit uses the same clean track-layout treatment, with circuit history, famous corners and record information."><div className="filterbar"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search circuit, country or city..."/><span>{filtered.length} circuits</span></div><div className="circuit-grid editorial-circuits">{filtered.map(c=><Link className="circuit-card editorial" to={`/circuits/${c.round}`} key={c.round}><div className="circuit-map"><MediaImage kind="circuit" title={c.name}/><span className="round-badge">R{String(c.round).padStart(2,'0')}</span></div><div className="circuit-copy"><span className="kicker">{c.flag} {c.country}</span><h2>{c.name}</h2><p>{c.city}</p><div className="circuit-stats"><span><b>{c.length}</b> km</span><span><b>{c.laps}</b> laps</span><span><b>{c.turns}</b> turns</span></div>{c.sprint&&<span className="sprint-tag">SPRINT</span>}</div><ArrowRight/></Link>)}</div></Page>}
function circuitSlug(c){return c?.layoutSvg||slugify(c?.name||c?.country||'circuit')}
function CircuitDetail(){const {round}=useParams();const [data,setData]=useState([]);useEffect(()=>{get('/circuits').then(setData)},[]);const c=data.find(x=>String(x.round)===String(round));if(!c)return <Page title="Circuit profile" kicker="CIRCUIT"><Panel>Circuit not found.</Panel></Page>;return <Page title={c.name.toUpperCase()} kicker={`${c.flag} ${c.country} • ROUND ${String(c.round).padStart(2,'0')}`} subtitle={`${c.city} • ${c.date}`}><div className="circuit-detail"><Panel className="track-layout"><div className="track-layout-head"><div><span className="kicker">TRACK LAYOUT</span><h2>{c.name}</h2></div><span className="round-badge">R{String(c.round).padStart(2,'0')}</span></div><div className="track-image circuit-font-visual"><MediaImage kind="circuit" title={c.name}/></div><div className="track-description"><span className="kicker">ABOUT THE CIRCUIT</span><p>{c.description||'A detailed circuit profile with historical context, racing characteristics and key corners.'}</p><div className="corner-list"><span><b>Opened</b>{c.openedYear||'—'}</span><span><b>Famous corners</b>{c.famousCorners||'—'}</span><span><b>First F1 Grand Prix</b>{c.firstGrandPrix||'—'}</span></div><div className="circuit-guide-grid"><div><span className="kicker">TRACK GUIDE</span><p>{c.trackGuide||c.description}</p></div><div><span className="kicker">RACING FOCUS</span><p>{c.racingFocus||'Braking, tyre management and aerodynamic balance all shape the lap.'}</p></div><div><span className="kicker">HISTORY</span><p>{c.historyNote||`Opened in ${c.openedYear||'—'} • first F1 Grand Prix ${c.firstGrandPrix||'—'}`}</p></div><div><span className="kicker">BEGINNER TIP</span><p>{c.beginnerTip||'Start by watching the major braking zones and the famous corners listed above.'}</p></div></div></div></Panel><Panel className="circuit-info"><span className="kicker">CIRCUIT INFORMATION</span><h2>{c.name}</h2><div className="circuit-info-grid"><Info label="Country" value={`${c.flag} ${c.country}`}/><Info label="City" value={c.city}/><Info label="Circuit length" value={`${c.length} km`}/><Info label="Race laps" value={c.laps}/><Info label="Race distance" value={`${c.distance} km`}/><Info label="Turns" value={c.turns}/><Info label="Sprint weekend" value={c.sprint?'Yes':'No'}/></div><div className="record-grid single-record"><div><span>FASTEST LAP</span><b>{c.records?.race?.time||c.fastestLapTime||'Not yet available'}</b><small>{c.records?.race?.driver?`${c.records.race.driver} • ${c.records.race.year}`:c.fastestLapDriver?`${c.fastestLapDriver} • ${c.fastestLapYear||''}`:'Historical record sync available in Admin'}</small></div></div><div className="circuit-note"><MapPinned/> <span>Circuit records and archive metadata are stored in SQLite and can be refreshed from Admin.</span></div></Panel></div></Page>}

function Champions(){
 const [tab,setTab]=useState('drivers'),[drivers,setDrivers]=useState([]),[constructors,setConstructors]=useState([]),[selected,setSelected]=useState(null),[winner,setWinner]=useState(null)
 useEffect(()=>{Promise.all([get('/world-champions'),get('/constructor-champions')]).then(([a,b])=>{setDrivers(a);setConstructors(b)})},[])
 const source=tab==='drivers'?drivers:constructors
 const list=source.flatMap(x=>String(x.years||'').split(',').flatMap(part=>{const t=part.trim();const m=t.match(/^(\d{4})[–-](\d{4})$/);if(!m)return /^\d{4}$/.test(t)?[{year:Number(t),name:x.name,titles:x.titles}]:[];const a=Number(m[1]),b=Number(m[2]);return Array.from({length:b-a+1},(_,i)=>({year:a+i,name:x.name,titles:x.titles}))})).sort((a,b)=>a.year-b.year||a.name.localeCompare(b.name))
 async function openChampion(x){
   setSelected(x); setWinner(null)
   try{
     if(tab==='drivers'){
       const [current,historic]=await Promise.all([get('/drivers'),get(`/archive/drivers?scope=historical&q=${encodeURIComponent(x.name)}`)])
       const exact=[...current,...historic].find(d=>String(d.name||'').toLowerCase()===String(x.name).toLowerCase()) || historic[0] || current.find(d=>String(d.name||'').toLowerCase().includes(String(x.name).toLowerCase()))
       if(exact){
         if(exact.id && exact.status==='historical'){
           try{setWinner(await get(`/archive/driver/${encodeURIComponent(exact.id)}/detail`));return}catch{}
         }
         setWinner(exact)
       }
     }else{
       const rows=await get(`/archive/teams?scope=historical&q=${encodeURIComponent(x.name)}`)
       setWinner(rows[0]||x)
     }
   }catch{setWinner(x)}
 }
 const championSections=selected ? (tab==='drivers' ? [
   {title:'CHAMPIONSHIP YEAR',body:`${selected.year} — ${selected.name} won the Formula 1 Drivers' World Championship.`},
   {title:'WINNER DETAILS',items:[`Nationality: ${winner?.nationality||'Not available in the archive record.'}`,`F1 debut: ${winner?.debut||winner?.firstSeason||'Not available in the archive record.'}`,`Date of birth: ${winner?.dateOfBirth||winner?.dob||'Not available in the archive record.'}`,`World championships: ${winner?.championships??winner?.career?.championships??selected.titles??'Not available.'}`]},
   {title:'CAREER SNAPSHOT',items:[`Grand Prix wins: ${winner?.wins??winner?.career?.wins??'Not available.'}`,`Podiums: ${winner?.podiums??winner?.career?.podiums??'Not available.'}`,`Pole positions: ${winner?.poles??winner?.career?.poles??'Not available.'}`]},
   {title:'FOR A BEGINNER',body:`This card represents the championship awarded for the ${selected.year} season. The winner shown here is the driver who finished the season with the championship title, not simply the winner of the final Grand Prix.`}
 ]:[
   {title:'CHAMPIONSHIP YEAR',body:`${selected.year} — ${selected.name} won the Formula 1 Constructors' World Championship.`},
   {title:'CONSTRUCTOR DETAILS',items:[`Constructor: ${winner?.name||selected.name}`,`Nationality: ${winner?.nationality||'Not available in the archive record.'}`,`First season: ${winner?.firstSeason||'Not available in the archive record.'}`,`World championships: ${winner?.championships??selected.titles??'Not available.'}`]},
   {title:'FOR A BEGINNER',body:`The Constructors' Championship is awarded to the team/constructor based on its drivers' combined championship results across the season.`}
 ]) : []
 return <Page title="Champions" kicker="WORLD CHAMPIONSHIP" subtitle="Champions are shown chronologically, one championship year at a time. Click any year to open the winner's details.">
   <div className="champ-tabs"><button className={tab==='drivers'?'active':''} onClick={()=>setTab('drivers')}><Trophy/>World Champion <span>{tab==='drivers'?list.length:drivers.length}</span></button><button className={tab==='constructors'?'active':''} onClick={()=>setTab('constructors')}><CarFront/>Constructor Champion <span>{tab==='constructors'?list.length:constructors.length}</span></button></div>
   <div className="champion-grid">{list.map((x,i)=><button className="champion-card panel clickable-guide" key={`${x.year}-${x.name}`} onClick={()=>openChampion(x)}><span className="champion-index">{String(i+1).padStart(2,'0')}</span><span className="kicker">{tab==='drivers'?'WORLD DRIVER':'CONSTRUCTOR'} CHAMPION</span><h2>{x.year}</h2><p>{x.name}</p><strong>OPEN WINNER DETAILS <ArrowRight/></strong></button>)}</div>
   {selected&&<DetailModal kicker={`${tab==='drivers'?'WORLD CHAMPION':'CONSTRUCTOR CHAMPION'} • ${selected.year}`} title={selected.name} subtitle={`${selected.year} championship winner`} sections={championSections} onClose={()=>{setSelected(null);setWinner(null)}}/>}
 </Page>
}


function Archive(){const [tab,setTab]=useState('drivers'),[q,setQ]=useState(''),[rows,setRows]=useState([]),[meta,setMeta]=useState(null);useEffect(()=>{get('/archive/meta').then(setMeta)},[]);useEffect(()=>{get(`/archive/${tab}?scope=historical&q=${encodeURIComponent(q)}`).then(setRows)},[tab,q]);return <Page title="F1 Archive" kicker="1950 → PRESENT" subtitle="The archive is for historical drivers, constructors and circuits. Current drivers remain in the Drivers section."><Panel className="archive-hero"><div><span className="kicker">THE F1 MEMORY</span><h2>Past meets present.</h2><p>{meta?.counts?.drivers||917} drivers • {meta?.counts?.constructors||187} constructors • {meta?.counts?.circuits||78} circuits</p></div></Panel><div className="archive-tabs">{[['drivers','Drivers',Users],['teams','Teams',CarFront],['circuits','Circuits',MapPinned]].map(([k,l,I])=><button className={tab===k?'active':''} onClick={()=>setTab(k)} key={k}><I/>{l}</button>)}</div><div className="filterbar"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={`Search historic ${tab}...`}/><span>{rows.length} found</span></div><div className="archive-grid">{rows.slice(0,500).map(x=><Link className="archive-card" to={tab==='drivers'?`/archive/driver/${x.id}`:tab==='teams'?`/archive/team/${x.id}`:`/archive/circuit/${x.id}`} key={x.id}><div className="archive-monogram">{(x.name||'F1').split(/\s+/).map(z=>z[0]).join('').slice(0,3)}</div><div><span className="status historic">HISTORIC</span><h3>{x.name}</h3><p>{x.nationality||x.country||x.city||'Metadata syncing…'}</p></div><ArrowRight/></Link>)}</div></Page>}
function ArchiveDetail({type}){
 const {id}=useParams();
 const [item,setItem]=useState(null);
 useEffect(()=>{
   let alive=true;
   const load=async()=>{
     try{
       if(type==='driver'){
         const x=await get(`/archive/driver/${encodeURIComponent(id)}/detail`);
         if(alive)setItem(x);
         return;
       }
       const rows=await get(`/archive/${type}s?scope=historical`);
       if(alive)setItem(rows.find(x=>String(x.id)===String(id)));
     }catch{
       if(alive)setItem(null);
     }
   };
   load();
   return()=>{alive=false};
 },[id,type]);

 if(!item)return <Page title="Archive profile" kicker="F1 HISTORY"><Panel>Loading…</Panel></Page>;

 const driverStats = type==='driver' ? [
   ['Grand Prix starts', item.grandsPrix ?? '—'],
   ['Wins', item.wins ?? '—'],
   ['Podiums', item.podiums ?? '—'],
   ['Fastest laps', item.fastestLaps ?? '—'],
   ['Career points', item.careerPoints ?? '—']
 ] : [];

 const detailTitle = type==='driver' ? 'DRIVER PROFILE' : type==='team' ? 'CONSTRUCTOR PROFILE' : 'CIRCUIT PROFILE';
 const summary = item.summary ||
   (type==='driver'
     ? `${item.name} is part of the historical Formula 1 archive.`
     : type==='team'
       ? `${item.name} is a historical Formula 1 constructor recorded in the archive.`
       : `${item.name} is a historical Formula 1 venue recorded in the archive.`);

 return <Page title={item.name} kicker="F1 ARCHIVE" subtitle={item.nationality||item.country||''}>
   <div className="archive-detail-grid">
     <Panel className="archive-photo">
       {type==='circuit'
         ? <div className="archive-circuit-layout"><MediaImage kind="circuit" title={item.name}/></div>
         : <MediaImage kind={type==='driver'?'driver':'team'} slug={slugify(item.name)} title={item.name} alt={item.name} priority/>}
     </Panel>

     <Panel className="archive-detail-copy">
       <span className="status historic">{detailTitle}</span>
       <h2>{item.name}</h2>
       <p className="archive-description">{summary}</p>

       {type==='driver'&&<>
         <div className="archive-info-grid">
           <Info label="Nationality" value={item.nationality||'Not recorded in the available open dataset'}/>
           <Info label="Date of birth" value={item.dateOfBirth||item.dob||'Not recorded'}/>
           <Info label="F1 debut" value={item.debut||item.firstSeason||'Not recorded'}/>
           <Info label="Abbreviation" value={item.abbreviation||item.code||'Not recorded'}/>
           <Info label="Permanent number" value={item.permanentNumber||'Not recorded'}/>
           <Info label="First name" value={item.firstName||'Not recorded'}/>
           <Info label="Last name" value={item.lastName||'Not recorded'}/>
           <Info label="Data source" value="Open F1 dataset + archive race history"/>
         </div>
         <div className="metrics archive-metrics">
           {driverStats.map(([label,value])=><Panel className="metric" key={label}><strong>{value}</strong><span>{label}</span></Panel>)}
         </div>
       </>}

       {type==='team'&&<>
         <div className="archive-info-grid">
           <Info label="Nationality" value={item.nationality||'Not recorded in the available open dataset'}/>
           <Info label="First season" value={item.firstSeason||'Not recorded'}/>
           <Info label="Grand Prix entries" value={item.grandPrixEntries||'Not recorded'}/>
           <Info label="Race wins" value={item.wins??'Not recorded'}/>
           <Info label="Archive status" value="Historical constructor"/>
           <Info label="Data source" value="Open F1 constructor dataset + race history"/>
         </div>
         <p className="archive-description">This constructor record combines identity information with the earliest recorded championship participation and race-history totals available in the open dataset.</p>
       </>}

       {type==='circuit'&&<>
         <div className="archive-info-grid">
           <Info label="Country" value={item.country||'Not recorded'}/>
           <Info label="City" value={item.city||'Not recorded'}/>
           <Info label="Coordinates" value={`${item.latitude??'—'}, ${item.longitude??'—'}`}/>
           <Info label="First F1 season" value={item.firstSeason||'Not recorded'}/>
           <Info label="Last recorded F1 season" value={item.lastSeason||'Not recorded'}/>
           <Info label="Grand Prix events" value={item.grandPrixCount||'Not recorded'}/>
           <Info label="Data source" value="Open F1 circuit dataset + race calendar history"/>
         </div>
         <p className="archive-description">The archive record combines the circuit's location with the first and last recorded Formula 1 seasons and the number of recorded Grand Prix events in the open race calendar.</p>
       </>}
     </Panel>
   </div>
 </Page>
}

function History(){const [rows,setRows]=useState([]),[selected,setSelected]=useState(null);useEffect(()=>{get('/history').then(setRows)},[]);return <Page title="The Story of F1" kicker="FROM 1950 TO TODAY" subtitle="Major sporting and technical regulation milestones, with beginner-friendly explanations. Click a year to open the complete breakdown immediately."><Panel className="history-hero"><span className="kicker">THE BEGINNING</span><h2>From one championship<br/>to a global sport.</h2><p>Explore the regulation milestones that changed engines, aerodynamics, tyres, safety, budgets and racing.</p></Panel><div className="history-list">{rows.map(r=><button className="history-row" onClick={()=>setSelected(r)} key={r.id}><span className="history-year">{r.year}</span><span><b>{r.title}</b><small>{r.summary}</small></span><ArrowRight/></button>)}</div>{selected&&<DetailModal kicker={`REGULATION BREAKDOWN • ${selected.year}`} title={selected.title} subtitle={selected.summary} sections={[{title:'WHY IT CHANGED',body:selected.why},{title:'WHAT WAS INTRODUCED',items:selected.regulations||[]},{title:'SPORTING & TECHNICAL IMPACT',body:selected.impact},{title:'REAL-WORLD EXAMPLE',body:selected.example},{title:'FOR A BEGINNER',body:selected.beginner}] } onClose={()=>setSelected(null)}/>}</Page>}

function Strategy(){
 const [strategies,setStrategies]=useState([]),[tyres,setTyres]=useState([]),[selected,setSelected]=useState(null)
 useEffect(()=>{Promise.all([get('/strategies'),get('/tyres')]).then(([a,b])=>{setStrategies(a);setTyres(b)})},[])
 const typeCards=[
  {id:'soft',name:'Soft',mark:'RED',color:'#e10600',summary:'Highest peak grip of the selected dry compounds.',detail:'The soft tyre is the fastest-gripping of the three slick compounds nominated for a particular weekend. It normally gives strong one-lap performance but can degrade faster.',use:'Qualifying • short aggressive stints'},
  {id:'medium',name:'Medium',mark:'YELLOW',color:'#ffd600',summary:'Balanced grip, warm-up and durability.',detail:'The medium tyre sits between the nominated hard and soft compounds. It is often useful when a team wants flexibility between pace and stint life.',use:'Race stints • flexible strategy'},
  {id:'hard',name:'Hard',mark:'WHITE',color:'#f6f6f7',summary:'Longest-life slick of the three nominated compounds.',detail:'The hard tyre normally sacrifices some peak grip for durability and can be valuable when degradation is high or a long stint is required.',use:'Long stints • high degradation'},
  {id:'intermediate',name:'Intermediate',mark:'GREEN',color:'#13c47a',summary:'Wet track without substantial standing water.',detail:'The green intermediate is designed for damp, wet or drying conditions where slicks no longer provide enough grip but a full wet is not yet necessary.',use:'Light rain • damp • drying track'},
  {id:'wet',name:'Full Wet',mark:'BLUE',color:'#1d8cff',summary:'Heavy rain and significant standing water.',detail:'The blue full wet displaces substantially more water than an intermediate and is designed for the wettest conditions in which racing is possible.',use:'Heavy rain • standing water'}
 ]
 const compounds=tyres.filter(t=>/^c[1-5]$/i.test(t.compound||t.id)).sort((a,b)=>Number((a.compound||a.id).slice(1))-Number((b.compound||b.id).slice(1)))
 const compoundType={c1:'Hard when selected as the hardest nomination',c2:'Hard / Medium depending on the three-compound nomination',c3:'Hard / Medium / Soft depending on the three-compound nomination',c4:'Medium / Soft depending on the nomination',c5:'Soft when selected as the softest nomination'}
 return <Page title="Strategy & Tyres" kicker="THE RACE, EXPLAINED" subtitle="Understand pit-stop strategy, the five 2026 slick compounds and the two wet-weather tyre types. Click any card for a beginner-friendly explanation.">
   <div className="strategy-grid">{strategies.map((x,i)=><button className="strategy-card panel clickable-guide" onClick={()=>setSelected({kind:'strategy',item:x})} key={x.id}><span className="strategy-num">{String(i+1).padStart(2,'0')}</span><span className="strategy-tag">{x.type}</span><h3>{x.name}</h3><p>{x.simple}</p><div className="strategy-box"><b>How it works</b><span>{x.how}</span></div><div className="strategy-box"><b>Best when</b><span>{x.when}</span></div><span className="click-more">Open full explanation <ArrowRight/></span></button>)}</div>
   <div className="guide-section tyre-types-section"><div className="section-head"><div><span className="kicker">TYRE TYPES</span><h2>Hard • Medium • Soft • Intermediate • Full Wet</h2></div></div><p className="strategy-disclaimer">Hard, Medium and Soft are the three dry-weather labels used for the compounds selected for a particular Grand Prix. Intermediate and Full Wet are the dedicated wet-weather tyres.</p><div className="tyre-grid tyre-type-grid">{typeCards.map(t=><button className="tyre-card clickable-guide" key={t.id} style={{'--tyre-color':t.color}} onClick={()=>setSelected({kind:'tyre',item:t})}><span className="tyre-dot"></span><span className="tyre-mark">{t.mark}</span><h3>{t.name}</h3><b>{t.summary}</b><p>{t.detail}</p><span>{t.use}</span><span className="click-more">Open tyre guide <ArrowRight/></span></button>)}</div></div>
   <div className="guide-section compound-section"><div className="section-head"><div><span className="kicker">2026 SLICK COMPOUNDS</span><h2>C1 • C2 • C3 • C4 • C5</h2></div></div><p className="strategy-disclaimer">The 2026 dry range runs from C1, the hardest, to C5, the softest. The three compounds nominated for a weekend are then labelled Hard, Medium and Soft in order from hardest to softest.</p><div className="compound-grid">{compounds.map(t=>{const id=(t.compound||t.id).toLowerCase();return <button className="compound-card panel clickable-guide" key={t.id} style={{'--tyre-color':t.color||'var(--red)'}} onClick={()=>setSelected({kind:'tyre',item:t})}><div className="compound-heading"><span className="tyre-dot"></span><span className="compound-code">{t.compound||t.id.toUpperCase()}</span><span className="compound-role">{compoundType[id]||'Nomination-dependent label'}</span></div><h3>{t.name}</h3><p>{t.detail}</p><div className="compound-facts"><span><b>Estimated stint</b>{t.estimatedLaps||'Condition-dependent'}</span><span><b>Typical use</b>{t.use}</span><span><b>Grip profile</b>{t.grip}</span></div><span className="click-more">Open compound details <ArrowRight/></span></button>})}</div></div>
   <Panel className="tyre-allocation"><span className="kicker">WEEKEND ALLOCATION</span><h2>How many sets are available?</h2><div className="allocation-grid"><div><b>13</b><span>Dry-weather sets</span><small>Standard-format maximum reference for each driver.</small></div><div><b>5</b><span>Intermediate sets</span><small>Green wet-weather tyre sets under the 2026 sporting framework.</small></div><div><b>2</b><span>Full Wet sets</span><small>Blue wet-weather tyre sets under the 2026 sporting framework.</small></div><div><b>2H • 3M • 8S</b><span>Standard dry reference</span><small>Hard, Medium and Soft set split; weekend rules can impose mandatory specifications and returns.</small></div></div></Panel>
   {selected&&<DetailModal kicker={selected.kind==='tyre'?'TYRE GUIDE':'RACE STRATEGY'} title={selected.item.name} subtitle={selected.item.grip||selected.item.summary||selected.item.simple} sections={educationalSections(selected.item,selected.kind)} onClose={()=>setSelected(null)}/>} 
 </Page>
}


function Glossary(){const [data,setData]=useState([]),[q,setQ]=useState(''),[letter,setLetter]=useState('ALL'),[selected,setSelected]=useState(null);useEffect(()=>{get('/glossary').then(setData)},[]);const letters=['ALL',...Array.from(new Set(data.map(x=>x.letter))).sort()];const filtered=data.filter(x=>(letter==='ALL'||x.letter===letter)&&(x.term+' '+x.definition+' '+(x.explanation||'')).toLowerCase().includes(q.toLowerCase()));return <Page title="F1 Glossary" kicker="SPEAK THE LANGUAGE" subtitle="A searchable beginner-friendly dictionary of F1 words, technical ideas and race-weekend language. Click any term for a deeper explanation, example and beginner tips."><div className="glossary-tools"><div className="filterbar"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search a term, e.g. DRS, ground effect, graining..."/><span>{filtered.length}</span></div><div className="letter-bar">{letters.map(l=><button className={letter===l?'active':''} onClick={()=>setLetter(l)} key={l}>{l}</button>)}</div></div><div className="glossary-list">{filtered.map(x=><button className="glossary-item" onClick={()=>setSelected(x)} key={`${x.letter}-${x.term}`}><span>{x.letter}</span><div><h3>{x.term}</h3><p>{x.definition}</p></div><ChevronRight/></button>)}</div>{selected&&<DetailModal kicker={`TERM • ${selected.letter}`} title={selected.term} subtitle={selected.definition} sections={educationalSections(selected,'glossary')} onClose={()=>setSelected(null)}/>}</Page>}


function Admin(){const [token,setToken]=useState(sessionStorage.getItem('f1_admin_token')||''),[login,setLogin]=useState({username:'admin',password:''}),[type,setType]=useState('drivers'),[rows,setRows]=useState([]),[selected,setSelected]=useState(null),[text,setText]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);const auth={headers:{Authorization:`Bearer ${token}`}};useEffect(()=>{if(token)load(type)},[token,type]);async function load(t){try{const r=await getAdmin(`/admin/content/${t}`);setRows(r)}catch{setToken('');sessionStorage.removeItem('f1_admin_token')}}async function getAdmin(path){const r=await fetch(API+path,{headers:auth.headers});const x=await r.json();if(!r.ok)throw new Error(x.error||'Unauthorized');return x}async function loginNow(e){e.preventDefault();try{const x=await send('/admin/login',{method:'POST',body:JSON.stringify(login)});setToken(x.token);sessionStorage.setItem('f1_admin_token',x.token);setMessage('Logged in.')}catch(e){setMessage(e.message)}}async function save(){try{setBusy(true);const data=JSON.parse(text);const x=await send(`/admin/content/${type}/${selected.id}`,{method:'PUT',headers:auth.headers,body:JSON.stringify(data)});setMessage('Saved to SQLite.');setRows(r=>r.map(a=>a.id===x.id?x:a));setSelected(x);setText(JSON.stringify(x,null,2))}catch(e){setMessage(e.message)}finally{setBusy(false)}}async function add(){const data={id:`new-${Date.now()}`,name:'New record'};await send(`/admin/content/${type}`,{method:'POST',headers:auth.headers,body:JSON.stringify(data)});load(type)}async function remove(){if(!selected)return;if(!confirm(`Delete ${selected.name||selected.id}?`))return;await send(`/admin/content/${type}/${selected.id}`,{method:'DELETE',headers:auth.headers});setSelected(null);setText('');load(type)}async function sync(){try{setBusy(true);const x=await send('/admin/sync-public-data',{method:'POST',headers:auth.headers});setMessage(`Public-data sync finished: ${x.updated} drivers updated, ${x.errors?.length||0} errors.`);load('drivers')}catch(e){setMessage(e.message)}finally{setBusy(false)}}async function syncCircuits(){try{setBusy(true);const x=await send('/admin/sync-circuit-records',{method:'POST',headers:auth.headers});setMessage(`Circuit record sync finished: ${x.updated} circuits checked.`);load('circuits')}catch(e){setMessage(e.message)}finally{setBusy(false)}}async function changePassword(){const p=prompt('Enter a new admin password (12+ characters):');if(!p)return;try{await send('/admin/password',{method:'PUT',headers:auth.headers,body:JSON.stringify({password:p})});setMessage('Password changed.')}catch(e){setMessage(e.message)}}async function logout(){try{await send('/admin/logout',{method:'POST',headers:auth.headers})}catch{}sessionStorage.removeItem('f1_admin_token');setToken('');setSelected(null);setText('');setMessage('Logged out securely.')}if(!token)return <Page title="Admin" kicker="CONTENT MANAGEMENT" subtitle="Database-backed editing for your F1 Grid Explorer."><Panel className="admin-login"><ShieldCheck/><h2>Admin access</h2><p>Use the local admin account created when the database was seeded.</p><form onSubmit={loginNow}><input value={login.username} onChange={e=>setLogin({...login,username:e.target.value})} placeholder="Username"/><input type="password" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})} placeholder="Password"/><button className="btn primary"><LogIn/>Sign in</button></form><p className="admin-hint">Use the ADMIN_USERNAME and ADMIN_PASSWORD values from your .env file. Use a strong password of at least 12 characters.</p><span className="error-text">{message}</span></Panel></Page>;return <Page title="Admin" kicker="SQLITE CONTENT CONTROL" subtitle="Edit stored content, add records, delete records and refresh current driver statistics from public F1 results data."><div className="admin-toolbar"><div className="admin-select"><label>Content</label><select value={type} onChange={e=>{setType(e.target.value);setSelected(null);setText('')}}>{['drivers','teams','circuits','flags','sessions','rules','strategies','tyres','glossary','history','world-champions','constructor-champions'].map(x=><option key={x}>{x}</option>)}</select></div><button className="btn primary" onClick={add}><Plus/>Add</button><button className="btn ghost" onClick={()=>load(type)}><RefreshCw/>Reload</button><button className="btn ghost" disabled={busy} onClick={sync}><RefreshCw/>Sync driver data</button><button className="btn ghost" disabled={busy} onClick={syncCircuits}><MapPinned/>Sync circuit records</button><button className="btn ghost" onClick={changePassword}><KeyRound/>Password</button><button className="btn ghost danger-btn" onClick={logout}><LogOut/>Log out</button></div>{message&&<div className="admin-message">{message}</div>}<div className="admin-grid"><Panel className="admin-list"><div className="admin-list-head"><b>{rows.length} records</b></div>{rows.slice(0,500).map(x=><button className={selected?.id===x.id?'admin-row active':'admin-row'} key={x.id} onClick={()=>{setSelected(x);setText(JSON.stringify(x,null,2))}}><span>{x.name||x.term||x.title||x.year||x.id}</span><small>{x.team||x.type||x.year||''}</small></button>)}</Panel><Panel className="admin-editor">{selected?<><div className="admin-editor-head"><div><span className="kicker">EDIT RECORD</span><h2>{selected.name||selected.term||selected.title||selected.id}</h2></div><div><button className="icon-btn danger" onClick={remove}><Trash2/></button></div></div><textarea value={text} onChange={e=>setText(e.target.value)} spellCheck="false"/><button className="btn primary" disabled={busy} onClick={save}><Save/>Save to database</button></>:<div className="admin-empty"><SlidersHorizontal/><h2>Select a record</h2><p>The editor stores the JSON object directly in SQLite, so you can update fields without rebuilding the frontend.</p></div>}</Panel></div></Page>}

function App(){return <Shell><Routes><Route path="/" element={<Home/>}/><Route path="/drivers" element={<Drivers/>}/><Route path="/drivers/:id" element={<DriverDetail/>}/><Route path="/teams" element={<Teams/>}/><Route path="/teams/:id" element={<TeamDetail/>}/><Route path="/circuits" element={<Circuits/>}/><Route path="/circuits/:round" element={<CircuitDetail/>}/><Route path="/champions" element={<Champions/>}/><Route path="/archive" element={<Archive/>}/><Route path="/archive/driver/:id" element={<ArchiveDetail type="driver"/>}/><Route path="/archive/team/:id" element={<ArchiveDetail type="team"/>}/><Route path="/archive/circuit/:id" element={<ArchiveDetail type="circuit"/>}/><Route path="/history" element={<History/>}/><Route path="/strategy" element={<Strategy/>}/><Route path="/glossary" element={<Glossary/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<Page title="404" kicker="NOT FOUND"><Link className="btn primary" to="/">Return home</Link></Page>}/></Routes></Shell>}

createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>)
