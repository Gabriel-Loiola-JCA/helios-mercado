# Helios · Mercado

Parcela de mercado das linhas monitoradas pelo Helios (Apps Script): passageiros = poltronas ocupadas de cada ônibus na ClickBus, somados por viação, linha, data, classe e horário. Mostra se a JCA está perdendo passageiros para a concorrência ou se o mercado inteiro encolheu.

- **Dados**: API do Helios (App da Web do Apps Script, `?fmt=gz`). No celular ou em um navegador novo, o titular pode usar **Entrar com Google** diretamente no site. O link do menu **Helios → Painel web** também funciona e salva o acesso no navegador.
- **Espelho**: o mesmo painel também abre direto pelo Apps Script (`/exec?k=…`), com os dados embutidos.
- **Demonstração**: `?demo` carrega `demo.json` (dados fictícios).

Sem dependências: um `index.html` só, fonte Inter.
