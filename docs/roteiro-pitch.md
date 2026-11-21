# Anexo D — Roteiro do Pitch e Demonstração (5 Minutos)

* **Solução:** FilaMonitor BES — Triagem e Fila Inteligente de Monitoria e Dúvidas por Disciplina
* **Apresentação:** Jean Vicente Lima Da Silva — Turma BES (Mostra: 03/12/2026)

| Parte | Tempo | Conteúdo esperado | Roteiro / Anotações |
| :--- | :--- | :--- | :--- |
| **Abertura** | 0:00 – 0:40 | Nome da solução e frase concreta sobre o problema. | Apresentar o **FilaMonitor BES**: em horários de pico e vésperas de entrega em BES, formam-se filas desorganizadas no WhatsApp sem visibilidade de disponibilidade do monitor, horários de reforço remoto ou histórico pesquisável. |
| **Público e contexto** | 0:00 – 0:40 | Quem enfrenta o problema e em qual situação. | Estudantes e monitores de disciplinas práticas de BES na UCSal durante horários de pico e fechamento de entregas. |
| **Evidências** | 0:40 – 1:15 | O que foi descoberto e qual hipótese precisou mudar. | 5 entrevistas reais em BES confirmaram filas e espera de **30 min a 2h** no WhatsApp em picos de entrega, enquanto o relato de um ex-monitor mostrou que disponibilizar respostas/materiais prévios reduz a fila na origem — validando unir **Auto-FAQ preventivo** com **Fila Priorizada**. |
| **Proposta** | 1:15 – 1:50 | Qual resultado o MVP permite alcançar. | Centralizar status do monitor, agenda de reforço remoto, triagem preventiva por Auto-FAQ e fila priorizada por urgência (`BLOQUEADO_ENTREGA`). |
| **Demonstração** | 1:50 – 3:30 | Execução ao vivo do fluxo principal com dados preparados. | 1) **Visão Aluno:** mostrar mural de status/reforço e testar dúvida de `SOLID` (`João Pedro`) no Auto-FAQ, clicando em *"Sim, resolveu"* para evitar abrir chamado.<br>2) **Strategy:** alternar seletor entre *Urgência + Ordem* e *FIFO* mostrando reordenação dinâmica.<br>3) **Visão Monitor + Observer:** iniciar atendimento, responder e marcar *"Publicar solução na Base de FAQ"*, comprovando que o item aparece imediatamente na busca. |
| **Decisões e limites** | 3:30 – 4:20 | Justificativa do escopo e limitações conhecidas. | Explicar aplicação de **Strategy** (priorização), **Observer** (retroalimentação FAQ), **Repository** (persistência JSON) e testes (`npm test`). Declarar limites: sem API real do WhatsApp, sem login institucional e persistência local. |
| **Aprendizado** | 4:20 – 5:00 | Resultado alcançado e próximo passo mais importante. | Contrastar relatos de alunos em picos de entrega com a experiência de ex-monitor mostrou que a melhor solução evita filas repetitivas antes mesmo de ordená-las. Próximo passo: piloto real em disciplinas práticas de BES com notificações automáticas. |
