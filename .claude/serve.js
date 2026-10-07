const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..','site');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index';
 let f=path.join(root,p);if(!path.extname(f))f+='.html';
 fs.readFile(f,(e,d)=>{if(e){r.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});return r.end(fs.existsSync(root+'/404.html')?fs.readFileSync(root+'/404.html'):'404')}
 r.writeHead(200,{'Content-Type':types[path.extname(f).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});r.end(d)})}).listen(5510);
