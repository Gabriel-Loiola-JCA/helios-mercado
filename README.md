# Helios · Mercado

Parcela de mercado das linhas monitoradas pelo Helios (Apps Script): passageiros = poltronas ocupadas de cada ônibus na ClickBus, somados por viação, linha, data, classe e horário. Mostra se a JCA está perdendo passageiros para a concorrência ou se o mercado inteiro encolheu.

- **Dados**: API do Helios (App da Web do Apps Script, `?fmt=gz`). Abra o site pelo link do menu **Helios → Painel web** — ele traz a chave e o endereço da API no `#` do link, que ficam salvos só no navegador.
- **Espelho**: o mesmo painel também abre direto pelo Apps Script (`/exec?k=…`), com os dados embutidos.
- **Demonstração**: `?demo` carrega `demo.json` (dados fictícios).

Sem dependências: um `index.html` só, fonte Inter.
