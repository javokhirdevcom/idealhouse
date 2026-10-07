const sharp=require('sharp'),fs=require('fs'),path=require('path');
const photos=require('./photos');
const OUT='../site/img';fs.mkdirSync(OUT,{recursive:true});
const files=fs.readdirSync('../pic').filter(f=>f.endsWith('.jpg')).sort();
const WIDTHS=[480,800,1280,1600];
(async()=>{
  const meta={};
  for(const p of photos){
    const src='../pic/'+files[p.i];const img=sharp(src).rotate();const m=await img.metadata();
    const ws=WIDTHS.filter(w=>w<m.width);ws.push(Math.min(m.width,1600));const uniq=[...new Set(ws)].sort((a,b)=>a-b);
    for(const w of uniq){const o=`${OUT}/${p.slug}-${w}.webp`;if(!fs.existsSync(o))await sharp(src).rotate().resize({width:w}).webp({quality:74,effort:5}).toFile(o)}
    meta[p.slug]={w:m.width,h:m.height,widths:uniq};
  }
  fs.writeFileSync('img-meta.json',JSON.stringify(meta,null,1));
  // Open Graph image 1200x630
  const hero=photos.find(p=>p.i===4);
  await sharp('../pic/'+files[hero.i]).resize(1200,630,{fit:'cover'}).jpeg({quality:80,mozjpeg:true}).toFile(OUT+'/og-ideal-house.jpg');
  console.log('done',Object.keys(meta).length);
})();
