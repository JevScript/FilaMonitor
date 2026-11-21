# Anexo A — Ficha do Problema

* **Solução:** FilaMonitor BES — Triagem e Fila Inteligente de Monitoria e Dúvidas por Disciplina
* **Equipe, turma e integrantes:** Jean Vicente Lima Da Silva — Turma BES (Atuação individual com autorização prévia do Prof. Mario Jorge Pereira)

| Campo | Preenchimento |
| :--- | :--- |
| **Público** | Estudantes e monitores de disciplinas práticas do curso de Bacharelado em Engenharia de Software (BES) da UCSal. |
| **Situação** | Durante horários de pico de monitoria, vésperas de entregas de atividades práticas/avaliações e momentos em que monitores estão ausentes ou organizam apoios remotos. |
| **Problema** | Em disciplinas e horários de maior demanda, formam-se filas desorganizadas no WhatsApp com dúvidas repetidas e espera prolongada, sem visibilidade sobre a disponibilidade do monitor, posição na fila ou agenda de reforços remotos. |
| **Impacto** | Ansiedade e atraso no desbloqueio de atividades próximas ao prazo (espera relatada de 30 min a 2 horas), desistência de tirar dúvidas por bagunça no chat e retrabalho quando respostas não ficam registradas em base pesquisável. |
| **Alternativa atual** | Grupos informais de WhatsApp e mensagens diretas sem fila ordenada, sem indicador de status de disponibilidade do monitor e sem histórico pesquisável de dúvidas resolvidas. |
| **Hipótese crítica** | Se os estudantes visualizarem o status de disponibilidade do monitor/reforços e consultarem dúvidas já respondidas por tópico (Auto-FAQ) antes de entrar em uma fila priorizada, o autoatendimento resolve casos recorrentes e organiza o atendimento nos momentos de pico. |
| **Evidência** | Entrevistas estruturadas com 5 participantes da comunidade acadêmica de BES (4 estudantes e 1 estudante com experiência como monitor) realizadas em novembro de 2026. |
| **Recorte** | Aplicação web local com mural de disponibilidade/reforço remoto, triagem preventiva via Auto-FAQ por tópico, fila priorizada de chamados e retroalimentação automática da base de conhecimento. |

---

# Anexo B — Registro de Validação

*Nota: Os participantes foram anonimizados em conformidade com as diretrizes éticas do manual POOALAB (sem exposição de nomes completos ou dados pessoais).*

| Data e perfil | Hipótese | Evidência observada | Decisão |
| :--- | :--- | :--- | :--- |
| 20/11/2026 — Estudante BES #1 | A demora de resposta no WhatsApp prejudica estudantes perto de entregas. | Relatou usar o grupo do WhatsApp; embora seja atendido, a variação de disponibilidade gera demora e ansiedade em atividades práticas perto do prazo. Apontou que ver perguntas já respondidas evitaria repetição. | Manter o **Mural de Disponibilidade** no topo da tela e a consulta prévia ao **FAQ**. |
| 20/11/2026 — Estudante BES #2 | O excesso de mensagens no grupo faz alunos desistirem de pedir ajuda. | Confirmou que evita mandar dúvida quando o grupo tem muitas mensagens e prefere tentar sozinho antes. Apontou como mais útil: ver dúvidas respondidas, posição na fila e disponibilidade do monitor. | Destacar o indicador de **posição na fila** e o **status online/ausente** do monitor. |
| 20/11/2026 — Estudante BES #3 | Em vésperas de entrega há gargalo, fila longa e falta de visibilidade. | Relatou espera de **30 min a 2 horas** perto da entrega (às vezes após o prazo) e desistência devido à enxurrada de prints soltos sem saber se o monitor está online. Considerou o **Auto-FAQ filtrado por tópico** o recurso mais útil. | Priorizar o fluxo **Triagem Auto-FAQ antes da abertura de chamado** e a priorização por urgência (`BLOQUEADO_ENTREGA`). |
| 20/11/2026 — Estudante BES / Ex-Monitor #4 | Monitores sempre enfrentam filas intensas de dúvidas repetidas. | **Nuance registrada:** Como monitor, relatou que produzir materiais práticos de apoio reduzia drasticamente as dúvidas repetidas e evitava filas longas em sua disciplina — diferente de cenários sem esse material prévio, onde as perguntas se acumulam. | **Validação cruzada:** Confirmou que estruturar respostas e materiais prévios reduz a fila na origem, justificando a combinação entre **Auto-FAQ preventivo** e **Fila Priorizada** para picos sem suporte prévio. |
| 20/11/2026 — Estudante BES #5 | Todos os alunos da turma dependem ativamente de monitoria síncrona. | **Contradição registrada:** Informou não ter o costume de acionar monitores por pesquisar e resolver dificuldades sozinho, mas validou que uma **lista de dúvidas já respondidas** seria a funcionalidade mais útil. | Confirmar que o MVP não deve forçar abertura de chamado, mantendo o **Auto-FAQ aberto para consulta direta**. |

* **Síntese dos aprendizados:** As entrevistas revelaram dois cenários complementares: (1) em disciplinas práticas durante picos de entrega ou sem materiais prévios, formam-se filas e gargalos no WhatsApp com esperas de 30 minutos a 2 horas e desistências; e (2) quando o monitor disponibiliza materiais estruturados ou o estudante é veterano autônomo, o autoatendimento evita a fila humana.
* **Mudanças realizadas no problema ou na solução:** Equilibrar a proposta do MVP entre **autoatendimento preventivo (Auto-FAQ + mural de horários de reforço remoto)** para evitar filas desnecessárias e **fila priorizada por urgência (`Strategy`)** para organizar os gargalos reais em vésperas de entrega.
