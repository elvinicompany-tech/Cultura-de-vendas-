import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, createHash } from 'node:crypto';
import validation from './lead-validation.cjs';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
export function createServer(config=process.env, transport=fetch) {
  const limits=new Map();
  function limited(key){const now=Date.now();const prev=limits.get(key);const item=prev&&prev.until>now?prev:{count:0,until:now+60000};item.count++;limits.set(key,item);if(limits.size>10000)for(const [k,v] of limits)if(v.until<now)limits.delete(k);return item.count>12;}
  return http.createServer(async(req,res)=>{
    const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
    try {
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/api/health')return reply(200,{ok:true,configured:Boolean(config.GOOGLE_SCRIPT_URL&&config.INTEGRATION_SECRET)});
      if(url.pathname.startsWith('/api/')){
        if(url.pathname!=='/api/lead')return reply(404,{ok:false,error:'Rota não encontrada.'});
        if(req.method!=='POST')return reply(405,{ok:false,error:'Método inválido.'});
        if(!config.GOOGLE_SCRIPT_URL||!config.INTEGRATION_SECRET)return reply(503,{ok:false,error:'O recebimento de cadastros está em configuração. Tente novamente em breve.'});
        if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.GOOGLE_SCRIPT_URL))return reply(503,{ok:false,error:'Integração indisponível.'});
        const expected=config.PUBLIC_ORIGIN || `http://${req.headers.host}`;
        if(req.headers.origin&&req.headers.origin!==expected)return reply(403,{ok:false,error:'Origem não autorizada.'});
        if(!String(req.headers['content-type']||'').startsWith('application/json'))return reply(415,{ok:false,error:'Formato inválido.'});
        if(Number(req.headers['content-length']||0)>16384)return reply(413,{ok:false,error:'Cadastro muito grande.'});
        let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>16384)return reply(413,{ok:false,error:'Cadastro muito grande.'});}
        let lead;try {lead=validation.validateLead_(JSON.parse(raw));}catch(e){return reply(400,{ok:false,error:e.message});}
        const key=createHash('sha256').update(lead.email+'|'+lead.whatsapp).digest('hex');
        if(limited(key))return reply(429,{ok:false,error:'Muitas tentativas. Aguarde um minuto.'});
        const timestamp=String(Date.now()),payload=JSON.stringify(lead);
        const signature=createHmac('sha256',config.INTEGRATION_SECRET).update(timestamp+'.'+payload).digest('hex');
        let remote,result;
        try {remote=await transport(config.GOOGLE_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({timestamp,payload,signature}),redirect:'follow',signal:AbortSignal.timeout(25000)});result=await remote.json();}catch{return reply(502,{ok:false,error:'Não conseguimos confirmar o envio. Seus dados continuam no formulário. Tente novamente.'});}
        if(!remote.ok||result.ok!==true||result.id!==lead.submission_id)return reply(502,{ok:false,error:'Não conseguimos confirmar o cadastro na planilha. Tente novamente.'});
        return reply(200,{ok:true,id:lead.submission_id});
      }
      if(!['GET','HEAD'].includes(req.method))return reply(405,{ok:false});
      const relative=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const file=path.resolve(root,relative);
      if(!file.startsWith(root+path.sep))return reply(404,{ok:false});
      let data;try{data=await readFile(file);}catch{return reply(404,{ok:false});}
      res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':path.extname(file)==='.html'?'no-cache':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:data);
    }catch{if(!res.headersSent)reply(500,{ok:false,error:'Não foi possível concluir o envio.'});else res.end();}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||3000);createServer().listen(port,'0.0.0.0',()=>console.log(`Site disponível na porta ${port}. Integração ${process.env.GOOGLE_SCRIPT_URL&&process.env.INTEGRATION_SECRET?'configurada':'pendente'}.`));
}
