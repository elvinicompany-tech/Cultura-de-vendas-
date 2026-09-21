/** Full Sales — endpoint de escrita autenticado. Sem leitura pública de cadastros. */
function doGet() { return json_({ok:true,service:'Full Sales — recebimento de cadastros'}); }
function json_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function constantEquals_(a,b){if(typeof a!=='string'||a.length!==b.length)return false;var diff=0;for(var i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function doPost(e) {
  var lock;
  try {
    var props=PropertiesService.getScriptProperties();
    var secret=props.getProperty('INTEGRATION_SECRET');
    var sheetId=props.getProperty('SPREADSHEET_ID');
    if(!secret||secret.length<32||!sheetId)return json_({ok:false,error:'not_configured'});
    var raw=e&&e.postData&&e.postData.contents||'';
    if(!raw||raw.length>20000)return json_({ok:false,error:'invalid_request'});
    var envelope=JSON.parse(raw);
    if(typeof envelope.payload!=='string'||!/^[0-9]{13}$/.test(String(envelope.timestamp))||Math.abs(Date.now()-Number(envelope.timestamp))>300000)return json_({ok:false,error:'invalid_request'});
    var bytes=Utilities.computeHmacSha256Signature(String(envelope.timestamp)+'.'+envelope.payload,secret,Utilities.Charset.UTF_8);
    var expected=bytes.map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');
    if(!constantEquals_(envelope.signature,expected))return json_({ok:false,error:'unauthorized'});
    var data=validateLead_(JSON.parse(envelope.payload));
    lock=LockService.getScriptLock();if(!lock.tryLock(15000))return json_({ok:false,error:'busy'});
    var ss=SpreadsheetApp.openById(sheetId), sheet=ss.getSheetByName('Cadastros');
    if(!sheet)throw Error('missing_sheet');
    var headers=['ID','Recebido em','Nome','WhatsApp','E-mail','Status','Responsável','Próximo contato','Observações','Segmento','Perfil','Faturamento mensal','Instagram','Origem','Campanha','Meio','Conteúdo','Termo','Página','Tipo','Atualizado em'];
    if(JSON.stringify(sheet.getRange(1,1,1,21).getValues()[0])!==JSON.stringify(headers))throw Error('invalid_headers');
    var last=sheet.getLastRow();
    if(last>1){
      var match=sheet.getRange(2,1,last-1,1).createTextFinder(data.submission_id).matchEntireCell(true).findNext();
      if(match){
        var saved=sheet.getRange(match.getRow(),1,1,21).getValues()[0];
        if(String(saved[4]).toLowerCase()!==data.email||String(saved[3]).replace(/\D/g,'')!==data.whatsapp)return json_({ok:false,error:'id_conflict'});
        return json_({ok:true,id:data.submission_id,duplicate:true});
      }
    }
    var next=last+1;
    if(next>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),1000);
    var now=new Date();
    var values=[data.submission_id,now,data.nome,data.whatsapp,data.email,'Novo','','','',SEGMENTS[data.segmento],ROLES[data.cargo],REVENUES[data.receita],data.instagram?'@'+data.instagram:'',data.utm_source||'Direto',data.utm_campaign,data.utm_medium,data.utm_content,data.utm_term,data.page,data.email.endsWith('@example.com')?'Teste':'Cadastro',now];
    values=values.map(function(v){return v instanceof Date?v:sheetText_(v);});
    // Format and validate the new row without copying any previous contact's data.
    if(next>2)sheet.getRange(2,1,1,21).copyTo(sheet.getRange(next,1,1,21),SpreadsheetApp.CopyPasteType.PASTE_FORMAT,false);
    sheet.getRange(next,4).setNumberFormat('@');
    sheet.getRange(next,1,1,21).setValues([values]);
    sheet.getRange(next,2).setNumberFormat('dd/MM/yyyy HH:mm');sheet.getRange(next,21).setNumberFormat('dd/MM/yyyy HH:mm');sheet.getRange(next,8).setNumberFormat('dd/MM/yyyy');
    sheet.getRange(next,6).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Novo','Em contato','Reunião agendada','Proposta enviada','Fechado','Sem interesse'],true).setAllowInvalid(false).build());
    sheet.getRange(next,20).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Cadastro','Teste'],true).setAllowInvalid(false).build());
    SpreadsheetApp.flush();
    return json_({ok:true,id:data.submission_id});
  }catch(err){return json_({ok:false,error:'save_failed'});}
  finally {if(lock&&lock.hasLock())lock.releaseLock();}
}

/** Execute uma vez depois de configurar as propriedades e importar a planilha. */
function prepararPlanilha() {
  var props=PropertiesService.getScriptProperties(),id=props.getProperty('SPREADSHEET_ID');
  if(!id||!props.getProperty('INTEGRATION_SECRET'))throw Error('Configure SPREADSHEET_ID e INTEGRATION_SECRET nas propriedades do script.');
  var ss=SpreadsheetApp.openById(id),s=ss.getSheetByName('Cadastros'),p=ss.getSheetByName('Painel');
  if(!s||!p)throw Error('Importe primeiro o modelo de planilha.');
  ss.setSpreadsheetLocale('pt_BR');ss.setSpreadsheetTimeZone('America/Sao_Paulo');
  s.setFrozenRows(1);s.setFrozenColumns(3);
  if(!s.getFilter())s.getRange(1,1,s.getMaxRows(),21).createFilter();
  // Open-ended ranges keep the dashboard working when new rows are added.
  var formulas=p.getRange('B5:B10').getFormulas().map(function(r){return [r[0].replace(/\$([A-Z]+)\$1001/g,'$$$1')];});
  p.getRange('B5:B10').setFormulas(formulas);
  p.getRange('E5:E10').setFormulas(p.getRange('E5:E10').getFormulas().map(function(r){return [r[0].replace(/\$([A-Z]+)\$1001/g,'$$$1')];}));
  p.getRange('B18').setValue('Configurada — aguarda teste de envio');
}
