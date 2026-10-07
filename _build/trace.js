const sharp=require('sharp'),potrace=require('potrace'),fs=require('fs');
(async()=>{
 const {data,info}=await sharp('logo-source.png').raw().toBuffer({resolveWithObject:true});
 const dark=(x,y)=>{const i=(y*info.width+x)*info.channels;return data[i]<100};
 function bbox(ya,yb){let x0=1e9,y0=1e9,x1=0,y1=0;for(let y=ya;y<=yb;y++)for(let x=0;x<info.width;x++)if(dark(x,y)){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}return {left:x0-2,top:y0-2,width:x1-x0+5,height:y1-y0+5}}
 const icon=bbox(250,620), text=bbox(630,760);console.log(icon,text);
 const S=4;
 async function tr(r,name){const buf=await sharp('logo-source.png').extract(r).resize(r.width*S,r.height*S,{kernel:'cubic'}).greyscale().png().toBuffer();
  return new Promise((res,rej)=>potrace.trace(buf,{threshold:120,turdSize:20,optTolerance:0.4,color:'currentColor'},(e,svg)=>{if(e)return rej(e);
   const d=[...svg.matchAll(/ d="([^"]+)"/g)].map(m=>m[1]).join(' ');
   // scale back to original px coords
   const out=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r.width*S} ${r.height*S}"><path fill="currentColor" fill-rule="evenodd" d="${d}"/></svg>`;
   fs.writeFileSync(name,out);res({name,len:out.length,w:r.width*S,h:r.height*S,d})}));}
 const a=await tr(icon,'logo-mark.svg'),b=await tr(text,'logo-word.svg');
 console.log(a.len,b.len);
 fs.writeFileSync('logo-parts.json',JSON.stringify({icon:{w:a.w,h:a.h,d:a.d},word:{w:b.w,h:b.h,d:b.d}}));
})();
