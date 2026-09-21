'use strict';
// Shared validation, used by the Node server and copied into Apps Script.
var SEGMENTS = {'saude':'Saúde','financas':'Finanças','juridico':'Jurídico','tecnologia-saas':'Tecnologia/SaaS','industria':'Indústria','servicos-mentoria':'Serviços/Mentoria','outro':'Outro'};
var ROLES = {'socio-empresario':'Sócio / empresário','gerente-lider':'Gerente / líder','colaborador-funcionario':'Colaborador / funcionário','prestador-freelancer':'Prestador / freelancer'};
var REVENUES = {'abaixo-30k':'Abaixo de R$ 30 mil','30k-50k':'R$ 30 mil a R$ 50 mil','50k-100k':'R$ 50 mil a R$ 100 mil','100k-300k':'R$ 100 mil a R$ 300 mil','300k-500k':'R$ 300 mil a R$ 500 mil','500k-1m':'R$ 500 mil a R$ 1 milhão','acima-1m':'Acima de R$ 1 milhão'};
function cleanText_(v,max) { return typeof v==='string' ? v.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max) : ''; }
function validateLead_(input) {
  if(!input || typeof input!=='object' || Array.isArray(input))throw Error('Cadastro inválido.');
  var d={};
  ['submission_id','nome','email','whatsapp','segmento','cargo','receita','instagram','utm_source','utm_campaign','utm_medium','utm_content','utm_term','page'].forEach(function(k){ d[k]=cleanText_(input[k],k==='page'?600:k==='nome'?120:254); });
  if(cleanText_(input.website,100))throw Error('Não foi possível enviar este cadastro.');
  if(!/^[a-zA-Z0-9_-]{16,100}$/.test(d.submission_id))throw Error('Identificador inválido. Reabra a página.');
  if(d.nome.length<2)throw Error('Informe seu nome.');
  d.email=d.email.toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))throw Error('Informe um e-mail válido.');
  d.whatsapp=d.whatsapp.replace(/\D/g,'');
  if(!/^[1-9][0-9]{7,14}$/.test(d.whatsapp))throw Error('Informe um WhatsApp válido com código do país.');
  if(!Object.prototype.hasOwnProperty.call(SEGMENTS,d.segmento)||!Object.prototype.hasOwnProperty.call(ROLES,d.cargo)||!Object.prototype.hasOwnProperty.call(REVENUES,d.receita))throw Error('Preencha segmento, perfil e faturamento.');
  d.instagram=d.instagram.replace(/^@/,'').slice(0,60);
  if(d.instagram&&!/^[a-zA-Z0-9_.]{1,30}$/.test(d.instagram))throw Error('Informe apenas o usuário do Instagram, sem link.');
  if(['50k-100k','100k-300k','300k-500k','500k-1m','acima-1m'].indexOf(d.receita)>=0&&!d.instagram)throw Error('Informe seu Instagram.');
  // No personal information or tracking IDs in stored page URLs.
  d.page=d.page.split(/[?#]/)[0];
  if(!/^https?:\/\//.test(d.page))d.page='';
  return d;
}
function sheetText_(v) { var s=String(v==null?'':v);return /^[=+\-@]/.test(s)?"'"+s:s; }
