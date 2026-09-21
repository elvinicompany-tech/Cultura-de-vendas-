# Full Sales System

Projeto recuperado com visual original e servidor Node.js (22 ou superior), sem dependências. Execute `npm run dev` para iniciar na porta 3000. O comando `npm test` executa nove testes locais.

A conexão com Google Sheets foi adiada a pedido do proprietário. O formulário devolve uma mensagem de configuração pendente, sem declarar sucesso nem redirecionar quando os dados não forem salvos.

## Conectar posteriormente
1. Importe modelo-cadastros.xlsx como uma planilha nativa do Google. Abas: Painel e Cadastros.
2. Em um projeto Apps Script, adicione Receiver.gs e Validation.gs da pasta google-apps-script. Configure o manifesto appsscript.json.
3. Nas propriedades do script defina SPREADSHEET_ID e INTEGRATION_SECRET (segredo aleatório de pelo menos 32 caracteres). Não coloque o segredo no navegador.
4. Autorize e execute prepararPlanilha uma vez. Publique o script como aplicativo web, executando como proprietário e acessível a qualquer pessoa. O endpoint verifica assinatura HMAC do servidor e não expõe os cadastros por GET.
5. No servidor do site, configure GOOGLE_SCRIPT_URL com a URL /exec, INTEGRATION_SECRET com o mesmo segredo e PUBLIC_ORIGIN com a origem HTTPS do site. Há um .env.example.
6. Faça um envio com teste@example.com. O registro é marcado Teste e não entra no Painel. Verifique que chegou uma única linha, mesmo reenviando a mesma requisição. Atualize Painel!B18 após confirmar a integração real.

Nunca publique arquivos .env. O servidor serve apenas a pasta public. O pacote não inclui credenciais nem dados de clientes. Vídeos e fontes continuam dependentes dos serviços externos originais. Rastreamentos públicos originais foram preservados.

Os testes usam um Google simulado. Não houve validação de gravação real porque a conexão foi adiada. O código do site foi recuperado de https://fap01.fullsalessystem.com/ .
