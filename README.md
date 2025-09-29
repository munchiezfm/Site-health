# 📊 Site-health (Google Apps Script)

Script em **Google Apps Script** para monitorar a disponibilidade de sites e APIs.  
Ele executa pings periódicos, registra estatísticas de uptime/falhas em planilhas do Google Drive e envia relatórios diários e alertas por e-mail.

## ✨ Funcionalidades
- 🔍 Monitoramento de múltiplos sites com intervalo configurável.
- 📈 Registro automático de métricas em planilhas do Google Sheets.
- 📉 Cálculo de uptime diário (%).
- 📧 Envio de alertas imediatos por e-mail quando um servidor fica indisponível.
- 📊 Relatório diário consolidado em Excel (enviado como anexo).
- ⏱️ Configuração de gatilhos automáticos (cron interno do Apps Script).

## 📂 Estrutura
- `health.gs` → script principal com:
  - `Observer()` → executa os pings nos sites configurados.
  - `verificarEEnviarAlerta()` → envia e-mails apenas uma vez por falha.
  - `enviarRelatorioDiario()` → gera relatório consolidado e envia aos administradores.
  - `criarGatilho()` → configura os gatilhos de tempo automaticamente.

## ⚙️ Configuração
1. Abra [Google Apps Script](https://script.google.com/) e crie um novo projeto.
2. Copie o conteúdo de `health.gs` para o editor.
3. Configure:
   - Lista de sites no array `config`.
   - Endereços de e-mail em `ADMIN_EMAILS`.
   - Pasta/nome do arquivo no `ExcelDB`.
4. No menu **Triggers**, adicione:
   - `Observer()` para rodar a cada 5 minutos.
   - `enviarRelatorioDiario()` para rodar diariamente às 20h.
   *(ou execute `criarGatilho()` para criar automaticamente).*

## 📊 Exemplo de saída no relatório
| Domínio                               | Total de Pings | Falhas | Uptime (%) |
|---------------------------------------|----------------|--------|------------|
| https://webrtc-app-9teq.onrender.com  | 288            | 4      | 98.61%     |
| https://kumbo.onrender.com            | 144            | 0      | 100.00%    |
| https://nestapi-qk2o.onrender.com     | 288            | 12     | 95.83%     |

O relatório é salvo em uma planilha no Google Drive e enviado por e-mail como **Excel**.

## 📜 Licença
Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](./LICENSE).
