import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { getContent, getContentById, putContent, deleteContent, findUser, verifyPassword, updatePassword, seedDatabase } from './db.js'
import './seed.js'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.join(__dirname, '..')
const archivePath = path.join(__dirname, 'archive-data.json')

const allowedOrigin = process.env.APP_ORIGIN || null
app.use(cors({origin:(origin,cb)=>{if(!origin || !allowedOrigin || origin===allowedOrigin) return cb(null,true); cb(new Error('CORS origin denied'))}}))
app.use(express.json({limit:'2mb'}))
app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff')
  res.setHeader('X-Frame-Options','DENY')
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()')
  if (process.env.NODE_ENV==='production') res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains')
  next()
})

// The first run is self-contained: the SQLite database is created and populated automatically.
let archive = { drivers: [], constructors: [], circuits: [], generatedAt: null }
try { archive = JSON.parse(fs.readFileSync(archivePath,'utf8')) } catch {}


const sessions = new Map()
const SESSION_TTL_MS = 8 * 60 * 60 * 1000
const loginAttempts = new Map()
const LOGIN_WINDOW_MS = 10 * 60 * 1000
const LOGIN_MAX_ATTEMPTS = 6
function clientIp(req){ return String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim() }
function loginAllowed(req){ const key=clientIp(req); const now=Date.now(); const a=loginAttempts.get(key); if(!a || now-a.started>LOGIN_WINDOW_MS){loginAttempts.set(key,{started:now,count:1});return true} if(a.count>=LOGIN_MAX_ATTEMPTS)return false; a.count++; return true }
function createSession(user){ const token=randomBytes(32).toString('hex'); sessions.set(token,{id:user.id,username:user.username,role:user.role,createdAt:Date.now(),expiresAt:Date.now()+SESSION_TTL_MS}); return token }
const ADMIN_TYPES = new Set(['drivers','teams','circuits','flags','sessions','rules','strategies','tyres','glossary','history','world-champions','constructor-champions'])
const ARCHIVE_LAYOUTS={'monza':'monza-7','mexico-city':'mexico-city-3','interlagos':'interlagos-2','zandvoort':'zandvoort-5','spa-francorchamps':'spa-francorchamps-4','catalunya':'catalunya-6','monaco':'monaco-6','madring':'madring-1','baku':'baku-1','sepang':'sepang-1','marina-bay':'marina-bay-4','melbourne':'melbourne-2','miami':'miami-1','silverstone':'silverstone-8','shanghai':'shanghai-1','suzuka':'suzuka-2','spielberg':'spielberg-3','hungaroring':'hungaroring-3','austin':'austin-1','las-vegas':'las-vegas-1','losail':'lusail-1','yas-marina':'yas-marina-2','jeddah':'jeddah-1','imola':'imola-3','hockenheimring':'hockenheimring-4','istanbul':'istanbul-1','kyalami':'kyalami-2','paul-ricard':'paul-ricard-1','magny-cours':'magny-cours-3','estoril':'estoril-2','jerez':'jerez-2','watkins-glen':'watkins-glen-1','fuji':'fuji-2'}
function archiveLayoutSvg(item){const id=String(item?.id||'').toLowerCase().replace(/_/g,'-');const name=String(item?.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');return ARCHIVE_LAYOUTS[id]||ARCHIVE_LAYOUTS[name]||null}
async function fetchJolpicaCollection(path, key, limit=100){
  const out=[]; const headers={'User-Agent':'F1GridExplorer/4.3 archive-metadata-sync'}
  for(let offset=0; offset<2000; offset+=limit){
    const r=await fetch(`https://api.jolpi.ca/ergast/f1/${path}?limit=${limit}&offset=${offset}`,{headers});
    if(!r.ok) break;
    const d=await r.json(); const table=d?.MRData?.[key]||{}; const rows=Array.isArray(table)?table:(table[key.endsWith('Table')?key.replace('Table','s'):key+'s']||[]); out.push(...rows);
    if(rows.length<limit) break;
  }
  return out
}
async function enrichArchiveMetadata(){
  try{
    const [drivers,circuits]=await Promise.all([
      fetchJolpicaCollection('drivers','DriverTable'),
      fetchJolpicaCollection('circuits','CircuitTable')
    ])
    const driverMap=new Map(drivers.map(x=>[String(x.driverId),x]));
    for(const x of getContent('archive-drivers')){
      const a=driverMap.get(String(x.id));
      if(a) putContent('archive-drivers',x.id,{...x,nationality:x.nationality||a.nationality||null,dateOfBirth:x.dateOfBirth||a.dateOfBirth||null,permanentNumber:x.permanentNumber||a.permanentNumber||null,abbreviation:x.abbreviation||a.code||null,wikipediaUrl:x.wikipediaUrl||a.url||null})
    }
    const circuitMap=new Map(circuits.map(x=>[String(x.circuitId),x]));
    for(const x of getContent('archive-circuits')){
      const a=circuitMap.get(String(x.id));
      putContent('archive-circuits',x.id,{...x,country:x.country||a?.Location?.country||null,city:x.city||a?.Location?.locality||null,latitude:x.latitude||a?.Location?.lat||null,longitude:x.longitude||a?.Location?.long||null,wikipediaUrl:x.wikipediaUrl||a?.url||null,layoutSvg:x.layoutSvg||archiveLayoutSvg(x)||null,description:x.description||`A historic Formula 1 circuit in ${x.city||a?.Location?.locality||x.country||'the archive'}.`})
    }
    console.log(`Archive metadata enrichment completed: ${drivers.length} drivers, ${circuits.length} circuits.`)
  }catch(e){console.log('Archive metadata enrichment skipped:',e.message)}
}
async function enrichArchiveDriverDebut(id){
  const item=getContentById('archive-drivers',id); if(!item || item.debut || item.firstSeason) return item;
  try{
    const r=await fetch(`https://api.jolpi.ca/ergast/f1/drivers/${encodeURIComponent(id)}/seasons/?limit=100`,{headers:{'User-Agent':'F1GridExplorer/4.3 archive-debut-sync'}});
    if(r.ok){const d=await r.json(); const seasons=(d?.MRData?.SeasonTable?.Seasons||[]).map(x=>Number(x.season)).filter(Boolean).sort((a,b)=>a-b); if(seasons.length){const updated={...item,firstSeason:seasons[0],debut:seasons[0],debutSource:'Jolpica F1 historical season endpoint'}; putContent('archive-drivers',id,updated); return updated}}
  }catch{}
  return item
}
setTimeout(enrichArchiveMetadata,1200)
const slugify = value => String(value||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const json = (res, value) => res.json(value)

app.get('/api/health', (_,res)=>json(res,{ok:true,service:'f1-grid-api',database:'sqlite',date:'2026-08-18'}))
app.get('/api/meta', (_,res)=>{ const now=Date.now(); const next=getContent('circuits').filter(c=>c.date&&new Date(c.date).getTime()>=now-6*60*60*1000).sort((a,b)=>new Date(a.date)-new Date(b.date))[0]; json(res,{season:2026,statsUpdatedAt:new Date().toISOString().slice(0,10),database:'SQLite',nextRace:next?.name||null,nextRaceDate:next?.date||null}) })

for (const type of ['drivers','teams','circuits','flags','sessions','rules','strategies','tyres','glossary','history','world-champions','constructor-champions']) {
  app.get(`/api/${type}`, (_,res)=>json(res,getContent(type)))
  app.get(`/api/${type}/:id`, (req,res)=>{
    const item=getContentById(type,req.params.id)
    item ? json(res,item) : res.status(404).json({error:`${type} record not found`})
  })
}

app.get('/api/calendar',(_,res)=>json(res,getContent('circuits')))

function archiveRows(type) {
  const map={drivers:'archive-drivers',teams:'archive-teams',circuits:'archive-circuits'}
  return getContent(map[type])
}
app.get('/api/archive/meta',(_,res)=>json(res,{generatedAt:archive.generatedAt,source:archive.source,currentSeason:archive.currentSeason,counts:{drivers:getContent('archive-drivers').length,constructors:getContent('archive-teams').length,circuits:getContent('archive-circuits').length}}))
app.get('/api/archive/driver/:id/detail',async(req,res)=>{ const item=await enrichArchiveDriverDebut(req.params.id); item?res.json(item):res.status(404).json({error:'Archive driver not found'}) })
app.get('/api/archive/:type',(req,res)=>{
  const type=req.params.type
  if(!['drivers','teams','circuits'].includes(type)) return res.status(404).json({error:'Invalid archive type'})
  const scope=req.query.scope||'all'
  const q=String(req.query.q||'').trim().toLowerCase()
  const aliases={former:'historical',active:'active',historical:'historical'}
  let rows=archiveRows(type).map(x=>type==='circuits'?{...x,layoutSvg:x.layoutSvg||archiveLayoutSvg(x),description:x.description||`A historic Formula 1 circuit in ${x.city||x.country||'the archive'}.`}:x)
  if(scope!=='all') rows=rows.filter(x=>x.status===(aliases[scope]||scope))
  if(q) rows=rows.filter(x=>JSON.stringify(x).toLowerCase().includes(q))
  res.json(rows)
})

// -------- Search / autocomplete --------
app.get('/api/search', (req,res)=>{
  const q=String(req.query.q||'').trim().toLowerCase()
  if(!q) return res.json({suggestions:[],drivers:[],teams:[],circuits:[],historicDrivers:[]})
  const drivers=getContent('drivers'), teams=getContent('teams'), circuits=getContent('circuits'), historicDrivers=getContent('archive-drivers')
  const score=(item,fields)=>{
    const text=fields.map(k=>String(item[k]||'')).join(' ').toLowerCase()
    const name=String(item.name||'').toLowerCase()
    if(name===q) return 100
    if(name.startsWith(q)) return 90
    if(text.includes(q)) return 60
    return 0
  }
  const make=(rows,fields,type,href)=>rows.map(x=>({...x,type,href,score:score(x,fields)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||String(a.name).localeCompare(String(b.name)))
  const all=[...make(drivers,['name','team','nationality'],'driver',x=>`/drivers/${x.id}`),...make(teams,['name','driver1','driver2'],'team',x=>`/teams/${encodeURIComponent(x.id||x.name)}`),...make(circuits,['name','country','city','famousCorners','description','trackGuide'],'circuit',x=>`/circuits/${x.round||x.id}`),...make(historicDrivers,['name','nationality','code'],'historic-driver',x=>`/archive/driver/${x.id}`)]
  res.json({suggestions:all.slice(0,8),drivers:all.filter(x=>x.type==='driver'),teams:all.filter(x=>x.type==='team'),circuits:all.filter(x=>x.type==='circuit'),historicDrivers:all.filter(x=>x.type==='historic-driver')})
})

// -------- Admin --------
function auth(req,res,next){
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'')
  const user=sessions.get(token)
  if(!user || user.expiresAt<Date.now()){ if(token) sessions.delete(token); return res.status(401).json({error:'Admin session expired. Please sign in again.'}) }
  req.user=user; next()
}
app.post('/api/admin/login',(req,res)=>{
  if(!loginAllowed(req)) return res.status(429).json({error:'Too many login attempts. Try again in 10 minutes.'})
  const username=String(req.body?.username||'').trim()
  const password=String(req.body?.password||'')
  const user=findUser(username)
  if(!user || !verifyPassword(password,user.password_hash,user.salt)) return res.status(401).json({error:'Invalid username or password'})
  const token=createSession(user)
  res.json({token,username:user.username,role:user.role,expiresIn:SESSION_TTL_MS})
})
app.post('/api/admin/logout',auth,(req,res)=>{
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,''); sessions.delete(token); res.json({ok:true})
})
app.get('/api/admin/me',auth,(req,res)=>res.json(req.user))
app.put('/api/admin/password',auth,(req,res)=>{ const password=String(req.body?.password||''); if(password.length<12)return res.status(400).json({error:'Password must be at least 12 characters'}); updatePassword(req.user.username,password); res.json({ok:true}) })
app.get('/api/admin/content/:type',auth,(req,res)=>{ if(!ADMIN_TYPES.has(req.params.type)) return res.status(400).json({error:'Invalid content type'}); res.json(getContent(req.params.type)) })
app.post('/api/admin/content/:type',auth,(req,res)=>{ if(!ADMIN_TYPES.has(req.params.type)) return res.status(400).json({error:'Invalid content type'}); const data=req.body||{}; const id=String(data.id||data.slug||data.name||Date.now()); putContent(req.params.type,id,{...data,id}); res.json({ok:true,id}) })
app.put('/api/admin/content/:type/:id',auth,(req,res)=>{ if(!ADMIN_TYPES.has(req.params.type)) return res.status(400).json({error:'Invalid content type'}); const current=getContentById(req.params.type,req.params.id); if(!current)return res.status(404).json({error:'Record not found'}); const data={...current,...(req.body||{}),id:current.id||req.params.id}; putContent(req.params.type,req.params.id,data); res.json(data) })
app.delete('/api/admin/content/:type/:id',auth,(req,res)=>{ if(!ADMIN_TYPES.has(req.params.type)) return res.status(400).json({error:'Invalid content type'}); deleteContent(req.params.type,req.params.id); res.json({ok:true}) })

function parseNum(s){ if(s==null)return 0; const m=String(s).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/); return m?Number(m[0]):0 }
function parseCount(text,label,nextLabels=[]){ const esc=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); const next=nextLabels.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'); const re=new RegExp(`${esc}\\s*([\\d,.]+(?:\\.\\d+)?)${next?`(?=\\s*(?:${next}))`:''}`,'i'); const m=text.match(re); return m?parseNum(m[1]):0 }
async function fetchJolpicaRows(path, key, limit=100){
  const out=[]
  const headers={'User-Agent':'F1GridExplorer/4.4 public-data-sync'}
  for(let offset=0; offset<2000; offset+=limit){
    const r=await fetch(`https://api.jolpi.ca/ergast/f1/${path}?limit=${limit}&offset=${offset}`,{headers})
    if(!r.ok) throw new Error(`Jolpica ${r.status}`)
    const d=await r.json()
    const table=d?.MRData?.RaceTable||d?.MRData?.QualifyingTable||d?.MRData?.ResultsTable||{}
    const rows=table?.Races||[]
    if(!rows.length) break
    out.push(...rows)
    if(rows.length<limit) break
  }
  return out
}
function jolpicaDriverId(d){
  const aliases={'kimi-antonelli':'antonelli','arvid-lindblad':'lindblad','isack-hadjar':'hadjar','liam-lawson':'lawson','oliver-bearman':'bearman','nico-hulkenberg':'hulkenberg','gabriel-bortoleto':'bortoleto','franco-colapinto':'colapinto','alexander-albon':'albon','fernando-alonso':'alonso','lance-stroll':'stroll','valtteri-bottas':'bottas','sergio-perez':'perez'}
  return aliases[d.id]||String(d.id).replace(/-/g,'_')
}
async function syncDriverPage(d){
  const apiId=jolpicaDriverId(d)
  const [races,qualifying]=await Promise.all([
    fetchJolpicaRows(`drivers/${encodeURIComponent(apiId)}/results`,'RaceTable'),
    fetchJolpicaRows(`drivers/${encodeURIComponent(apiId)}/qualifying`,'RaceTable')
  ])
  let wins=0,podiums=0,fastestLaps=0,grandsPrix=0
  const season={position:d.season?.position||null,points:0,grandPrixRaces:0,grandPrixPoints:0,wins:0,podiums:0,poles:0,fastestLaps:0,dnfs:0}
  for(const race of races){
    for(const x of race.Results||[]){
      grandsPrix++
      const p=Number(x.position)
      const isFastest=String(x.FastestLap?.rank)==='1'
      if(p===1) wins++
      if(p>=1&&p<=3) podiums++
      if(isFastest) fastestLaps++
      if(String(race.season)==='2026'){
        season.grandPrixRaces++
        season.points+=Number(x.points)||0
        season.grandPrixPoints+=Number(x.points)||0
        if(p===1) season.wins++
        if(p>=1&&p<=3) season.podiums++
        if(isFastest) season.fastestLaps++
        if(String(x.status||'').toLowerCase().match(/retired|accident|engine|gearbox|collision|damage|spun|crash|mechanical|disqualified/)) season.dnfs++
      }
    }
  }
  let poles=0, currentPole=0
  for(const race of qualifying){
    for(const x of race.QualifyingResults||[]){
      if(String(x.position)==='1'){poles++;if(String(race.season)==='2026')currentPole++}
    }
  }
  season.poles=currentPole
  const currentSeasonWins=season.wins,currentSeasonPodiums=season.podiums,currentSeasonFastest=season.fastestLaps
  const updated={...d,wins,podiums,poles,fastestLaps,career:{...(d.career||{}),grandsPrix, wins,podiums,poles,fastestLaps},season:{...season,wins:currentSeasonWins,podiums:currentSeasonPodiums,poles:currentPole,fastestLaps:currentSeasonFastest},statsUpdatedAt:new Date().toISOString().slice(0,10),statsSource:'Jolpica F1 public data'}
  putContent('drivers',d.id,updated)
  return updated
}
function lapSeconds(v){if(!v)return null;const m=String(v).match(/^(?:(\d+):)?(\d+)(?:\.(\d+))?$/);if(!m)return null;return Number(m[1]||0)*60+Number(m[2])+Number(`0.${m[3]||0}`)}
const JOLPICA_CIRCUITS={1:'albert_park',2:'shanghai',3:'suzuka',4:'miami',5:'villeneuve',6:'monaco',7:'catalunya',8:'red_bull_ring',9:'silverstone',10:'spa',11:'hungaroring',12:'zandvoort',13:'monza',14:null,15:'baku',16:'sepang',17:'marina_bay',18:'americas',19:'rodriguez',20:'interlagos',21:'las_vegas',22:'losail',23:'yas_marina'}
function cleanCircuitRecord(c){ const records={...(c.records||{})}; delete records.qualifying; return {...c,records} }
function normalizeCircuitRecords(){ for(const c of getContent('circuits')) putContent('circuits',c.id,cleanCircuitRecord(c)) }
normalizeCircuitRecords()
async function syncCircuitRecords(){
  const headers={'User-Agent':'F1GridExplorer/4.2 circuit-record-sync'},out=[]
  for(const raw of getContent('circuits')){ const c=cleanCircuitRecord(raw); const cid=JOLPICA_CIRCUITS[c.round]; if(!cid) continue; try {
    const r=await fetch(`https://api.jolpi.ca/ergast/f1/circuits/${cid}/results/?limit=1000`,{headers}); let race=null
    if(r.ok){const d=await r.json();for(const rr of d?.MRData?.RaceTable?.Races||[])for(const x of rr.Results||[]){const t=x.FastestLap?.Time?.time||x.fastestLapTime;const sec=lapSeconds(t);if(sec!=null&&(!race||sec<race.sec))race={sec,time:t,driver:`${x.Driver?.givenName||''} ${x.Driver?.familyName||''}`.trim(),year:Number(rr.season)}}}
    const updated={...c,records:{race:race?{time:race.time,driver:race.driver,year:race.year}:c.records?.race||null}}; putContent('circuits',c.id,updated); out.push({round:c.round,name:c.name,records:updated.records})
  } catch(e){out.push({round:c.round,name:c.name,error:e.message})} }
  return out
}
app.post('/api/admin/sync-circuit-records',auth,async(_,res)=>{try{const results=await syncCircuitRecords();res.json({ok:true,updated:results.length,results})}catch(e){res.status(500).json({error:e.message})}})

async function syncAllPublicData(){
  const rows=getContent('drivers'); const results=[]; const errors=[]
  for(const d of rows){ try { const updated=await syncDriverPage(d); results.push({id:d.id,name:d.name,ok:true,wins:updated.wins,podiums:updated.podiums,poles:updated.poles,season:updated.season}) } catch(e){ errors.push({id:d.id,name:d.name,error:String(e.message||e)}) } }
  let circuitResults=[]; try { circuitResults=await syncCircuitRecords() } catch(e) { errors.push({type:'circuits',error:String(e.message||e)}) }
  return {ok:true,updated:results.length,results,errors,circuitResults,finishedAt:new Date().toISOString()}
}
app.post('/api/admin/sync-public-data',auth,async(_,res)=>{try{res.json(await syncAllPublicData())}catch(e){res.status(500).json({error:e.message})}})

const syncStatePath=path.join(__dirname,'sync-state.json')
function readSyncState(){try{return JSON.parse(fs.readFileSync(syncStatePath,'utf8'))}catch{return {}}}
function writeSyncState(x){try{fs.writeFileSync(syncStatePath,JSON.stringify(x,null,2))}catch{}}
async function autoSyncAfterRaceWeekend(){
  const races=getContent('circuits').filter(c=>c.date).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const now=Date.now(); const completed=races.filter(c=>now-new Date(c.date).getTime()>20*60*60*1000); const last=completed.at(-1); if(!last)return
  const state=readSyncState(); if(state.lastCompletedRaceDate===last.date)return
  console.log(`[auto-sync] Race weekend complete: ${last.name} (${last.date}). Refreshing driver and circuit data…`)
  try { const result=await syncAllPublicData(); writeSyncState({lastCompletedRaceDate:last.date,lastCompletedRaceRound:last.round,lastSyncAt:result.finishedAt}); console.log(`[auto-sync] Updated ${result.updated} drivers; ${result.circuitResults.length} circuits.`) } catch(e){ console.log('[auto-sync] skipped:',e.message) }
}
setTimeout(autoSyncAfterRaceWeekend,15000)
setInterval(autoSyncAfterRaceWeekend,6*60*60*1000)

app.use(express.static(path.join(root,'dist')))
app.use((req,res,next)=>{ if(req.path.startsWith('/api')) return next(); const index=path.join(root,'dist','index.html'); if(fs.existsSync(index)) return res.sendFile(index); next() })

const PORT=process.env.PORT||4000
app.listen(PORT,()=>console.log(`F1 Grid API running on http://localhost:${PORT}`))
