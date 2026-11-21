# FilaMonitor BES

MVP funcional de triagem e fila inteligente de monitoria desenvolvido para a disciplina **POOALAB — Programação Orientada a Objetos Avançada** (Engenharia de Software, UCSal — 2026.2). O sistema centraliza a disponibilidade de monitores, agendas de reforço remoto, triagem preventiva por base de conhecimento (Auto-FAQ) e fila priorizada de atendimento.

---

## Integrante e Turma

* **Estudante:** Jean Vicente Lima Da Silva
* **Turma:** Bacharelado em Engenharia de Software (BES)
* **Formato:** Equipe individual, previamente autorizada pelo Prof. Mario Jorge Pereira conforme previsto no manual da atividade.

---

## Problema, Público e Proposta de Valor

* **Público:** Estudantes e monitores de disciplinas práticas de BES (com foco principal em disciplinas introdutórias, como *Algoritmos e Programação* e *POO Básica*, onde há maior necessidade de acompanhamento).
* **Problema:** Em vésperas de entregas e horários de pico, estudantes não sabem se há monitor disponível nem quando ocorrerão aulas de reforço remoto, enquanto dúvidas se perdem em grupos informais de WhatsApp sem ordem ou histórico pesquisável.
* **Proposta de Valor:** Reduzir o atrito de busca por ajuda através de um mural único de disponibilidade/reforço remoto, autoatendimento imediato via **Auto-FAQ** por tópico e uma **fila ordenada por prioridade** que evita retrabalho do monitor e garante atendimento justo aos alunos bloqueados.

---

## Tecnologias e Justificativas

* **Node.js (v20+) e TypeScript (v5+):** Permitem tipagem estática forte para modelar interfaces, classes, encapsulamento e padrões de projeto de POO Avançada com alta confiabilidade.
* **Express (v4+):** Servidor HTTP leve para expor a API REST e servir o frontend estático localmente sem exigir configuração complexa de build.
* **HTML5, CSS3 e JavaScript puro (`src/public/`):** Interface web limpa, responsiva e de alto contraste, sem dependências de bundlers externos.
* **Persistência local em JSON (`demo/dados-demo.json`):** Garante execução 100% autocontida e offline-first para a demonstração presencial, isolada por meio do padrão *Repository*.

### Conceitos de POO Avançada e SOLID Aplicados

* **Encapsulamento e Máquina de Estados (`Chamado`):** Atributos privados com validação interna de transições de ciclo de vida (`AGUARDANDO` $\rightarrow$ `EM_ATENDIMENTO` $\rightarrow$ `RESOLVIDO`), impedindo alterações inválidas de estado.
* **Padrão GoF Strategy + Open/Closed Principle (`EstrategiaPriorizacao`):** Permite alternar em tempo de execução (via seletor na interface) entre `PrioridadeUrgenciaEOrdemStrategy` (prioriza alunos bloqueados perto de entregas) e `FifoSimplesStrategy` (ordem estrita de chegada) sem alterar o serviço `MonitoriaService`.
* **Padrão GoF Observer (`ChamadoObserver` / `AutoFaqObserver`):** Ao concluir um atendimento com a opção *"Publicar solução na Base de FAQ"* marcada, o `AutoFaqObserver` reage ao evento de conclusão e indexa automaticamente um novo `ItemFaq` pesquisável.
* **Padrão Repository + Dependency Inversion (`IMonitoriaRepository`):** A camada de aplicação depende apenas da abstração, permitindo persistência em arquivo JSON (`JsonMonitoriaRepository`) e testes isolados em memória.

---

## Pré-requisitos e Instalação

* **Pré-requisitos:** Node.js `v20.0.0` ou superior (testado em Node `v24`) e `npm`.

```bash
# 1. Instalar dependências do projeto
npm install

# 2. Executar a suíte de testes automatizados
npm test

# 3. Iniciar o servidor web local
npm start
