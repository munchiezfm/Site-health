var ExcelDB = {
  criarAbaNoArquivo: function (nomePasta, nomeArquivo, nomeAba, dados) {
    let pasta;
    // Verifica se a pasta existe, se não, cria
    const pastas = DriveApp.getFoldersByName(nomePasta);
    pasta = pastas.hasNext() ? pastas.next() : DriveApp.createFolder(nomePasta);
    // Verifica se o arquivo já existe
    const arquivos = pasta.getFilesByName(nomeArquivo);
    let planilha;
    if (arquivos.hasNext()) {
      planilha = SpreadsheetApp.open(arquivos.next());
    } else {
      planilha = SpreadsheetApp.create(nomeArquivo);
      const arquivoPlanilha = DriveApp.getFileById(planilha.getId());
      pasta.addFile(arquivoPlanilha);
      DriveApp.getRootFolder().removeFile(arquivoPlanilha);
    }
    // Verifica se a aba do dia já existe → remove
    let sheet = planilha.getSheetByName(nomeAba);
    if (sheet) {
      planilha.deleteSheet(sheet);
    }
    // Cria nova aba com os dados do dia
    sheet = planilha.insertSheet(nomeAba);
    sheet.getRange(1, 1, dados.length, dados[0].length).setValues(dados);
    return { id: planilha.getId(), nome: nomeArquivo, aba: nomeAba, url: planilha.getUrl() };
  }
};
/** ============================
 * Configuração de Pings
 * ============================
 */
var config = [
  { url: "https://webrtc-app-9teq.onrender.com", interval: 5 },
  { url: "https://kumbo.onrender.com", interval: 10 },
  { url: "https://nestapi-qk2o.onrender.com", interval: 5 }
];
// E-mails para receber relatórios
var ADMIN_EMAILS = [
  "walteralexandresantana@gmail.com",
  "walteralexandresantana6@gmail.com"
];
// Acumulador de estatísticas
var stats = {};
/**
 * Executa os pings
 */
function Observer() {
  var props = PropertiesService.getScriptProperties();
  var now = Date.now();
  config.forEach(function (site) {
    var lastRun = parseInt(props.getProperty(site.url)) || 0;
    var elapsedMinutes = (now - lastRun) / 60000;
    if (elapsedMinutes >= site.interval) {
      try {
        var response = UrlFetchApp.fetch(site.url, { muteHttpExceptions: true });
        var status = response.getResponseCode();
        Logger.log("Ping em: " + site.url + " | Status: " + status);
        props.setProperty(site.url, now.toString());
        if (!stats[site.url]) stats[site.url] = { total: 0, erros: 0 };
        stats[site.url].total++;
        if (status !== 200) {
          stats[site.url].erros++;
          verificarEEnviarAlerta(site.url, "Status: " + status, props);
        } else {
          props.deleteProperty("alert_" + site.url);
        }
      } catch (e) {
        Logger.log("Erro ao pingar " + site.url + ": " + e);
        if (!stats[site.url]) stats[site.url] = { total: 0, erros: 0 };
        stats[site.url].total++;
        stats[site.url].erros++;
        verificarEEnviarAlerta(site.url, "Exception: " + e, props);
      }
    }
  });
  CacheService.getScriptCache().put("pingStats", JSON.stringify(stats), 21600);
}
/**
 * Envia alerta de erro apenas uma vez até o servidor voltar
 */
function verificarEEnviarAlerta(url, detalhe, props) {
  var key = "alert_" + url;
  if (props.getProperty(key)) {
    Logger.log("Alerta já enviado para " + url + ", ignorando...");
    return;
  }
  var corpo = `
    <h2>:batedor: Erro detectado no monitoramento</h2>
    <p><b>Domínio:</b> ${url}</p>
    <p><b>Detalhe:</b> ${detalhe}</p>
    <p><i>Este aviso será enviado apenas uma vez até o servidor voltar ao normal.</i></p>
  `;
  ADMIN_EMAILS.forEach(function (email) {
    MailApp.sendEmail({
      to: email,
      subject: ":batedor: Alerta de falha no servidor - " + url,
      htmlBody: corpo
    });
  });
  props.setProperty(key, "true");
  Logger.log("Alerta enviado para administradores sobre falha em: " + url);
}
/**
 * Envia relatório diário às 20h
 */
function enviarRelatorioDiario() {
  var statsCache = CacheService.getScriptCache().get("pingStats");
  if (!statsCache) {
    Logger.log("Nenhum dado coletado hoje.");
    return;
  }
  var stats = JSON.parse(statsCache);
  var hoje = new Date();
  var dataStr = hoje.toISOString().split("T")[0];
  // Dados para Excel
  var dados = [["Domínio", "Total de Pings", "Falhas", "Uptime (%)"]];
  for (var url in stats) {
    var total = stats[url].total;
    var erros = stats[url].erros;
    var uptime = total > 0 ? (((total - erros) / total) * 100).toFixed(2) : "0.00";
    dados.push([url, total, erros, uptime + "%"]);
  }
  // Adiciona aba ao arquivo histórico
  var nomeArquivo = "ObserverRender_Historico";
  var nomeAba = "Diario_" + dataStr;
  var resultado = ExcelDB.criarAbaNoArquivo("ObserverRender", nomeArquivo, nomeAba, dados);
  // Corpo do e-mail
  var corpo = `
    <h1>:gráfico_de_barras: Relatório diário de servidores</h1>
    <p>Data: ${dataStr}</p>
    <p>Segue em anexo a planilha com o relatório do dia.</p>
  `;
  // Exporta apenas a aba do dia e envia em anexo
  var arquivo = DriveApp.getFileById(resultado.id);
  var blobXLSX = arquivo.getAs(MimeType.MICROSOFT_EXCEL);
  ADMIN_EMAILS.forEach(function (email) {
    MailApp.sendEmail({
      to: email,
      subject: ":gráfico_de_barras: Relatório diário (" + dataStr + ")",
      htmlBody: corpo,
      attachments: [blobXLSX]
    });
  });
  Logger.log("Relatório criado e enviado por anexo: " + resultado.id + " (aba " + nomeAba + ")");
}
/**
 * Gatilhos automáticos
 */
function criarGatilho() {
  ScriptApp.newTrigger('Observer')
    .timeBased()
    .everyMinutes(5)
    .create();
  ScriptApp.newTrigger('enviarRelatorioDiario')
    .timeBased()
    .atHour(20)
    .everyDays(1)
    .create();
}





