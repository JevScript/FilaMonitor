# Anexo E — Declaração de Uso de Inteligência Artificial e de Componentes de Terceiros

* **Solução:** FilaMonitor BES — Triagem e Fila Inteligente de Monitoria e Dúvidas por Disciplina
* **Turma:** BES
* **Equipe:** Individual (autorizada previamente pelo Prof. Mario Jorge Pereira)
* **Integrantes:** Jean Vicente Lima Da Silva

## 1. Uso de inteligência artificial
**Houve uso de IA?** ( X ) Sim  ( ) Não

| Ferramenta ou modelo | Finalidade ou tarefa | Parte afetada | Revisão e validação realizadas |
| :--- | :--- | :--- | :--- |
| Google Gemini | Análise do manual POOALAB, delimitação de escopo do MVP, auditoria documental e estruturação dos anexos e roteiro do pitch. | `docs/` e `README.md` | Todo texto foi revisado, ajustado ao contexto real da disciplina e fundamentado nas 5 entrevistas reais registradas no Anexo B. |
| Antigravity (Agente de Código) | Apoio na geração da estrutura TypeScript, entidades de domínio, padrões GoF (Strategy, Observer, Repository), frontend local e testes. | `src/`, `tests/` e `demo/` | Código inspecionado manualmente, executado localmente e validado via suíte automatizada (`npm test`) e teste ponta a ponta (`npm start`). |

* **Observações sobre o uso de IA:** Nenhuma saída de IA foi utilizada como evidência de validação com usuários. Nenhum dado pessoal, credencial ou documento institucional restrito foi inserido nas ferramentas.

## 2. Componentes e recursos de terceiros
**Houve uso de componentes de terceiros?** ( X ) Sim  ( ) Não

| Componente ou recurso | Origem ou link | Versão e licença | Função e alterações realizadas |
| :--- | :--- | :--- | :--- |
| Node.js | [https://nodejs.org](https://nodejs.org) | v20+ / v24 (MIT) | Ambiente de execução e módulos nativos (`node:test`, `node:assert/strict`, `node:fs`, `node:path`, `node:crypto`). |
| TypeScript | [https://www.typescriptlang.org](https://www.typescriptlang.org) | v5.x (Apache-2.0) | Tipagem estática, interfaces, enums e modelagem orientada a objetos. |
| Express | [https://expressjs.com](https://expressjs.com) | v4.x (MIT) | Servidor HTTP local para exposição da API REST e entrega dos arquivos estáticos de `src/public/`. |

## 3. Materiais ou código preexistentes
**Houve material produzido antes do PooaLAB?** ( ) Sim  ( X ) Não

* **Identificação e origem:** Não se aplica.
* **Contribuição nova realizada pela equipe:** Todo o código-fonte, arquitetura de domínio, massa de dados fictícia e documentação foram desenvolvidos especificamente para o POOALAB 2026.2.

## 4. Declaração da equipe
Declaramos que as informações acima são completas e verdadeiras; que revisamos e testamos as contribuições apoiadas por IA; que identificamos as fontes, licenças e partes preexistentes relevantes; que não apresentamos como autoria própria material de terceiros; e que não compartilhamos dados pessoais, credenciais ou informações restritas de forma indevida.

* **Responsável pela submissão:** Jean Vicente Lima Da Silva

### Ciência dos integrantes

| Nome completo | Assinatura ou registro de ciência | Data |
| :--- | :--- | :--- |
| Jean Vicente Lima Da Silva | *Ciência registrada digitalmente pelo autor da submissão* | 23/11/2026 |
