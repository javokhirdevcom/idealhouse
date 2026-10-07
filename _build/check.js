const puppeteer=require('puppeteer-core');const fs=require('fs');
const urls=fs.readFileSync('../site/sitemap.xml','utf8').match(/<loc>[^<]+/g).map(s=>s.slice(5).replace('https://www.idealhouse.nl',''));
(async()=>{const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
for(const w of [1440,360]){for(const u of urls){const pg=await b.newPage();await pg.setViewport({width:w,height:800,isMobile:w<700,hasTouch:w<700});const errs=[];
pg.on('pageerror',e=>errs.push(e.message));pg.on('response',r=>{if(r.status()>=400)errs.push(r.status()+' '+r.url())});
await pg.goto('http://localhost:5510'+u,{waitUntil:'networkidle0'});
const r=await pg.evaluate(()=>({ov:document.documentElement.scrollWidth-window.innerWidth,h1:document.querySelectorAll('h1').length,t:document.title.length,d:document.querySelector('meta[name=description]').content.length,noalt:[...document.images].filter(i=>!i.hasAttribute('alt')).length,ld:(()=>{try{JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);return 1}catch(e){return 0}})()}));
if(r.ov>0||r.h1!==1||errs.length||r.noalt||!r.ld)console.log(w,u,JSON.stringify(r),errs);
await pg.close()}}
// interactions
const pg=await b.newPage();await pg.setViewport({width:390,height:800,isMobile:true,hasTouch:true});await pg.goto('http://localhost:5510/projecten',{waitUntil:'networkidle0'});
await pg.click('[data-filter="badkamer"]');const vis=await pg.$$eval('.masonry .pcard',t=>t.filter(x=>!x.hidden).length);
await pg.evaluate(()=>document.querySelector('.masonry .pcard:not([hidden])').click());await new Promise(r=>setTimeout(r,500));
const lb=await pg.evaluate(()=>({open:document.getElementById('lightbox').classList.contains('is-open'),count:document.querySelector('.lb__count').textContent,loaded:document.querySelector('.lb__img').complete}));
await pg.screenshot({path:'_lb.png'});
await pg.click('[data-menu-open]').catch(()=>{});await pg.keyboard.press('Escape');await pg.click('[data-menu-open]');await new Promise(r=>setTimeout(r,600));await pg.screenshot({path:'_menu.png'});
console.log('filter visible',vis,'lightbox',JSON.stringify(lb));await b.close()})();
