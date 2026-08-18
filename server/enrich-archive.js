import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getContent, putContent } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const archivePath = path.join(__dirname, 'archive-data.json')

const SOURCES = {
  drivers: 'https://raw.githubusercontent.com/muharsyad/formula-one-datasets/main/drivers.csv',
  constructors: 'https://raw.githubusercontent.com/muharsyad/formula-one-datasets/main/constructors.csv',
  circuits: 'https://raw.githubusercontent.com/muharsyad/formula-one-datasets/main/circuits.csv',
  races: 'https://raw.githubusercontent.com/muharsyad/formula-one-datasets/main/races.csv',
  results: 'https://raw.githubusercontent.com/muharsyad/formula-one-datasets/main/race_results.csv'
}

function norm(value='') {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'')
}

function parseCsv(text) {
  const rows=[]
  let row=[], field='', quoted=false
  for(let i=0;i<text.length;i++){
    const ch=text[i], next=text[i+1]
    if(quoted){
      if(ch==='"' && next==='"'){field+='"';i++;continue}
      if(ch==='"'){quoted=false;continue}
      field+=ch
    }else{
      if(ch==='"'){quoted=true;continue}
      if(ch===','){row.push(field);field='';continue}
      if(ch==='\n'){
        row.push(field);field=''
        if(row.some(v=>v.trim()!=='')) rows.push(row)
        row=[]
        continue
      }
      if(ch!=='\r') field+=ch
    }
  }
  row.push(field)
  if(row.some(v=>v.trim()!=='')) rows.push(row)
  const headers=rows.shift().map(x=>x.trim())
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]??'').trim()])))
}

async function csv(url){
  const r=await fetch(url,{headers:{'User-Agent':'GRID-Formula-Racing-Explorer/4.7'}})
  if(!r.ok) throw new Error(`Open-data download failed: ${r.status} ${url}`)
  return parseCsv(await r.text())
}

function firstSeasonBy(rows,key){
  const out={}
  for(const r of rows){
    const id=r[key], season=Number(r.season)
    if(!id || !Number.isFinite(season)) continue
    out[id]=out[id]===undefined?season:Math.min(out[id],season)
  }
  return out
}

async function main(){
  console.log('Enriching archive from open Formula One datasets...')
  const [drivers,constructors,circuits,races,results]=await Promise.all([
    csv(SOURCES.drivers),csv(SOURCES.constructors),csv(SOURCES.circuits),
    csv(SOURCES.races),csv(SOURCES.results)
  ])

  const archive=JSON.parse(await fs.readFile(archivePath,'utf8'))
  const driverByName=new Map(drivers.map(x=>[norm(`${x.givenName} ${x.familyName}`),x]))
  const driverById=new Map(drivers.map(x=>[norm(x.driverId),x]))
  const constructorByName=new Map(constructors.map(x=>[norm(x.constructorName),x]))
  const constructorById=new Map(constructors.map(x=>[norm(x.constructorId),x]))
  const circuitByName=new Map(circuits.map(x=>[norm(x.circuitName),x]))
  const circuitById=new Map(circuits.map(x=>[norm(x.circuitId),x]))

  const driverFirst=firstSeasonBy(results,'driverId')
  const constructorFirst=firstSeasonBy(results,'constructorId')
  const circuitFirst=firstSeasonBy(races,'circuitId')
  const circuitLast={}
  const circuitCount={}
  for(const r of races){
    const id=r.circuitId, s=Number(r.season)
    if(!id || !Number.isFinite(s)) continue
    circuitLast[id]=circuitLast[id]===undefined?s:Math.max(circuitLast[id],s)
    circuitCount[id]=(circuitCount[id]||0)+1
  }

  for(const d of archive.drivers||[]){
    const r=driverByName.get(norm(d.name)) || driverById.get(norm(d.id))
    if(!r) continue
    d.firstName=r.givenName || d.firstName
    d.lastName=r.familyName || d.lastName
    d.nationality=r.nationality || d.nationality
    d.dateOfBirth=r.dateOfBirth || d.dateOfBirth
    d.abbreviation=r.code || d.abbreviation || '—'
    d.permanentNumber=r.permanentNumber || d.permanentNumber || '—'
    if(driverFirst[r.driverId]) d.firstSeason=driverFirst[r.driverId]
    d.debut=d.firstSeason || d.debut || 'Not recorded'
    d.dataSource='Open Formula One dataset (Ergast-derived) + F1DB archive'
  }

  for(const t of archive.constructors||[]){
    const r=constructorByName.get(norm(t.name)) || constructorById.get(norm(t.id))
    if(!r) continue
    t.nationality=r.nationality || t.nationality
    if(constructorFirst[r.constructorId]) t.firstSeason=constructorFirst[r.constructorId]
    t.dataSource='Open Formula One dataset (Ergast-derived) + F1DB archive'
  }

  for(const c of archive.circuits||[]){
    const r=circuitByName.get(norm(c.name)) || circuitById.get(norm(c.id))
    if(!r) continue
    c.country=r.country || c.country
    c.city=r.locality || c.city
    c.latitude=r.lat || c.latitude
    c.longitude=r.long || c.longitude
    if(circuitFirst[r.circuitId]) c.firstSeason=circuitFirst[r.circuitId]
    if(circuitLast[r.circuitId]) c.lastSeason=circuitLast[r.circuitId]
    if(circuitCount[r.circuitId]) c.grandPrixCount=circuitCount[r.circuitId]
    c.dataSource='Open Formula One dataset (Ergast-derived) + F1DB archive'
  }

  archive.syncedAt=new Date().toISOString()
  archive.source='F1DB + open Formula One dataset'
  await fs.writeFile(archivePath,JSON.stringify(archive,null,2),'utf8')

  for(const row of archive.drivers||[]) putContent('archive-drivers',row.id,row)
  for(const row of archive.constructors||[]) putContent('archive-teams',row.id,row)
  for(const row of archive.circuits||[]) putContent('archive-circuits',row.id,row)

  console.log(`Drivers: ${archive.drivers?.length||0}`)
  console.log(`Constructors: ${archive.constructors?.length||0}`)
  console.log(`Circuits: ${archive.circuits?.length||0}`)
  console.log('Archive enrichment complete.')
}

main().catch(error=>{console.error(error);process.exit(1)})
