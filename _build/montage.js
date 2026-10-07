// node montage.js shot.png sliceHeight cols out-prefix : places vertical slices side by side
const sharp=require('sharp');const [,,f,h='1400',cols='4',pre='_mont']=process.argv;
(async()=>{const m=await sharp(f).metadata();const H=+h,C=+cols,W=m.width,gap=16;const n=Math.ceil(m.height/H);let k=0;
for(let s=0;s<n;s+=C){const parts=[];for(let j=0;j<C&&s+j<n;j++){const y=(s+j)*H;parts.push({input:await sharp(f).extract({left:0,top:y,width:W,height:Math.min(H,m.height-y)}).toBuffer(),left:j*(W+gap),top:0})}
await sharp({create:{width:C*(W+gap),height:H,channels:3,background:'#ff00ff'}}).composite(parts).jpeg({quality:72}).toFile(`${pre}_${k++}.jpg`)}console.log(k)})();
