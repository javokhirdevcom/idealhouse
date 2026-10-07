// usage: node shot.js <path> <width> <out> [full=1] [height]
const puppeteer=require('puppeteer-core');
(async()=>{
 const [,,p='/',w='1440',out='shot.png',full='1',h='900']=process.argv;
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
 const pg=await b.newPage();
 const mobile=+w<700;
 await pg.setViewport({width:+w,height:+h,deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
 const errs=[];pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push(e.message));pg.on('requestfailed',r=>errs.push('FAILED '+r.url()));
 pg.on('response',r=>{if(r.status()>=400)errs.push(r.status()+' '+r.url())});
 await pg.goto('http://localhost:5510'+p,{waitUntil:'networkidle0'});
 await pg.evaluate(async()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'));document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager');
   for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}window.scrollTo(0,0)});
 await new Promise(r=>setTimeout(r,1200));
 await pg.screenshot({path:out,fullPage:full==='1'});
 const ov=await pg.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth?('H-OVERFLOW '+document.documentElement.scrollWidth):'ok');
 console.log(ov,errs.join('\n'));
 await b.close();
})();
