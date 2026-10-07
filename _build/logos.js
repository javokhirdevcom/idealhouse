const sharp=require('sharp'),fs=require('fs');
const P=JSON.parse(fs.readFileSync('logo-parts.json'));
const r=d=>d.replace(/-?\d+\.\d+/g,n=>String(Math.round(+n)));
const mark=r(P.icon.d), word=r(P.word.d);
const MW=P.icon.w, MH=P.icon.h, WW=P.word.w, WH=P.word.h;
const NAVY='#16191c';
const ws=1.62, wy=Math.round((MH-WH*ws)/2), wx=MW+190, TW=Math.round(wx+WW*ws);
const horiz=c=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TW} ${MH}" role="img" aria-label="Ideal House"><g fill="${c}" fill-rule="evenodd"><path d="${mark}"/><path transform="translate(${wx} ${wy}) scale(${ws})" d="${word}"/></g></svg>`;
const markSvg=(c,bg)=>{const pad=Math.round(MW*0.14),S=MW+pad*2;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">${bg?`<rect width="${S}" height="${S}" rx="${Math.round(S*0.22)}" fill="${bg}"/>`:''}<path transform="translate(${pad} ${pad+Math.round((MW-MH)/2)})" fill="${c}" fill-rule="evenodd" d="${mark}"/></svg>`};
// stacked (original layout)
const sw=Math.max(MW,WW), sg=Math.round(MH*0.14), SH=MH+sg+WH;
const stacked=c=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sw} ${SH}"><g fill="${c}" fill-rule="evenodd"><path transform="translate(${Math.round((sw-MW)/2)} 0)" d="${mark}"/><path transform="translate(${Math.round((sw-WW)/2)} ${MH+sg})" d="${word}"/></g></svg>`;
const A='../site/assets/';
fs.writeFileSync(A+'logo.svg',horiz(NAVY));
fs.writeFileSync(A+'logo-wit.svg',horiz('#ffffff'));
fs.writeFileSync('../site/favicon.svg',markSvg(NAVY));
fs.writeFileSync('mark-tile.svg',markSvg('#ffffff',NAVY));
fs.writeFileSync('stacked.svg',stacked(NAVY));
console.log('horiz ratio',TW/MH, 'sizes',fs.statSync(A+'logo.svg').size);
(async()=>{
 const tile=Buffer.from(fs.readFileSync('mark-tile.svg'));
 const plain=Buffer.from(markSvg(NAVY,'#ffffff'));
 await sharp(tile,{density:300}).resize(32,32).png().toFile('../site/favicon-32.png');
 await sharp(plain,{density:300}).resize(180,180).flatten({background:'#fff'}).png().toFile('../site/apple-touch-icon.png');
 await sharp(tile,{density:300}).resize(192,192).png().toFile('../site/assets/icon-192.png');
 await sharp(tile,{density:300}).resize(512,512).png().toFile('../site/assets/icon-512.png');
 // logo for schema / sharing: stacked on brand mist background like original
 const st=Buffer.from(stacked(NAVY));
 const inner=await sharp(st,{density:200}).resize({width:620}).png().toBuffer();
 const im=await sharp(inner).metadata();
 await sharp({create:{width:800,height:800,channels:4,background:'#f3efe7'}}).composite([{input:inner,left:Math.round((800-im.width)/2),top:Math.round((800-im.height)/2)}]).png().toFile('../site/assets/logo-ideal-house.png');
 // favicon.ico (png-in-ico, 32px)
 const png=fs.readFileSync('../site/favicon-32.png');const h=Buffer.alloc(22);h.writeUInt16LE(0,0);h.writeUInt16LE(1,2);h.writeUInt16LE(1,4);h[6]=32;h[7]=32;h[8]=0;h[9]=0;h.writeUInt16LE(1,10);h.writeUInt16LE(32,12);h.writeUInt32LE(png.length,14);h.writeUInt32LE(22,18);
 fs.writeFileSync('../site/favicon.ico',Buffer.concat([h,png]));
 console.log('icons ok');
})();
