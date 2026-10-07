const sharp=require('sharp');const [,,f,h='1300']=process.argv;
(async()=>{const m=await sharp(f).metadata();let n=0;for(let y=0;y<m.height;y+=+h){await sharp(f).extract({left:0,top:y,width:m.width,height:Math.min(+h,m.height-y)}).jpeg({quality:70}).toFile(f.replace('.png',`_${n++}.jpg`))}console.log(m.width,m.height,n)})();
