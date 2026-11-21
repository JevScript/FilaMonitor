# Anexo C — Definição do MVP

* **Solução:** FilaMonitor BES — Triagem e Fila Inteligente de Monitoria e Dúvidas por Disciplina
* **Usuário principal:** Estudantes de BES (consultam disponibilidade/reforço, pesquisam FAQ e abrem dúvidas) e Monitores (atualizam disponibilidade, divulgam horários de reforço remoto e atendem a fila priorizada).
* **Resultado principal:** O estudante descobre imediatamente se há monitor ativo, visualiza o próximo reforço remoto, obtém resposta instantânea caso a dúvida já exista no FAQ ou entra em uma fila ordenada por prioridade nos momentos de alta demanda; o monitor atende em ordem justa e transforma respostas em conhecimento reutilizável.
* **Fluxo de ponta a ponta:**
  1. **Entrada:** Aluno consulta status do monitor e horário de reforço remoto, seleciona disciplina/tópico, informa urgência e digita a dúvida.
  2. **Processamento (Triagem + Priorização):** O sistema busca correspondências na base de FAQ do tópico; se o aluno confirmar que a dúvida é nova, cria o chamado e ordena a fila via padrão *Strategy* (urgência + ordem de chegada).
  3. **Resultado e Retroalimentação:** Monitor visualiza a fila ordenada, conclui o atendimento com a solução e, ao marcar a opção de FAQ, o padrão *Observer* publica automaticamente a dúvida e resposta na base pesquisável.
* **Critérios de pronto:**
  * Aplicação inicia localmente com comando único (`npm start`) e carrega dados fictícios seguros.
  * Fluxo completo (consultar disponibilidade -> triagem Auto-FAQ -> entrar na fila priorizada -> atender e publicar no FAQ) funciona sem erros.
  * Alternância de estratégia de priorização demonstrável na interface e validada por testes automatizados (`npm test`).
  * `README.md` permite execução reproduzível em ambiente limpo.
* **Fora do escopo:** Integração real com API do WhatsApp, autenticação institucional com portal da UCSal, chat em tempo real via WebSocket, videoconferência embutida e hospedagem em nuvem.
* **Maior risco:** Escopo excessivo para o prazo de implementação ou dependência de serviços externos durante a demonstração presencial. Mitigação: arquitetura local autocontida com persistência em arquivo JSON (`demo/dados-demo.json`).
* **Teste principal:** Execução automatizada via `node:test` validando a ordenação da fila (Strategy), o encapsulamento de estados do chamado e a publicação automática no FAQ (Observer), somada ao teste guiado de ponta a ponta na interface web.
* **Limitações conhecidas:** Persistência local em arquivo JSON único (sem suporte a alta concorrência multiusuário), troca de perfil (Aluno/Monitor) simulada via seletor na interface sem autenticação institucional e atualização de tela sob ação do usuário.
