/**
 * Script principal do frontend do FilaMonitor BES.
 * Comunica-se com a API REST do Express sem dependências externas ou build step.
 */

const estado = {
  visaoAtual: 'ALUNO',
  painel: null,
  duvidaPendenteTriagem: null,
};

const elementos = {
  btnVisaoAluno: document.getElementById('btn-visao-aluno'),
  btnVisaoMonitor: document.getElementById('btn-visao-monitor'),
  secaoAluno: document.getElementById('secao-aluno'),
  secaoMonitor: document.getElementById('secao-monitor'),
  seletorEstrategia: document.getElementById('seletor-estrategia'),
  badgeEstrategiaAtiva: document.getElementById('badge-estrategia-ativa'),
  textoEstrategiaDescricao: document.getElementById('texto-estrategia-descricao'),
  metricaAguardando: document.getElementById('metrica-aguardando'),
  metricaEmAtendimento: document.getElementById('metrica-em-atendimento'),
  metricaTriagem: document.getElementById('metrica-triagem'),
  metricaFaq: document.getElementById('metrica-faq'),

  // Mural
  badgeStatusMonitor: document.getElementById('badge-status-monitor'),
  muralMensagemAviso: document.getElementById('mural-mensagem-aviso'),
  muralAtualizadoEm: document.getElementById('mural-atualizado-em'),
  reforcoDisciplina: document.getElementById('reforco-disciplina'),
  reforcoDatahora: document.getElementById('reforco-datahora'),
  reforcoTopico: document.getElementById('reforco-topico'),
  reforcoLink: document.getElementById('reforco-link'),

  // Forms do Monitor no Mural
  formStatusMonitor: document.getElementById('form-status-monitor'),
  inputStatusMonitor: document.getElementById('input-status-monitor'),
  inputMensagemAviso: document.getElementById('input-mensagem-aviso'),
  formReforcoRemoto: document.getElementById('form-reforco-remoto'),
  inputReforcoDisciplina: document.getElementById('input-reforco-disciplina'),
  inputReforcoDatahora: document.getElementById('input-reforco-datahora'),
  inputReforcoTopico: document.getElementById('input-reforco-topico'),
  inputReforcoLink: document.getElementById('input-reforco-link'),

  // Aluno: formulário e triagem
  formDuvida: document.getElementById('form-duvida'),
  inputNomeAluno: document.getElementById('input-nome-aluno'),
  inputDisciplina: document.getElementById('input-disciplina'),
  inputTopico: document.getElementById('input-topico'),
  inputUrgencia: document.getElementById('input-urgencia'),
  inputDescricao: document.getElementById('input-descricao'),
  cardTriagemFaq: document.getElementById('card-triagem-faq'),
  listaSugestoesFaq: document.getElementById('lista-sugestoes-faq'),
  btnTriagemResolveu: document.getElementById('btn-triagem-resolveu'),
  btnTriagemEntrarFila: document.getElementById('btn-triagem-entrar-fila'),

  // Listagens Aluno
  blocoEmAtendimentoAluno: document.getElementById('bloco-em-atendimento-aluno'),
  listaFilaAluno: document.getElementById('lista-fila-aluno'),
  inputBuscaFaq: document.getElementById('input-busca-faq'),
  listaFaqAluno: document.getElementById('lista-faq-aluno'),

  // Listagens Monitor
  listaEmAtendimentoMonitor: document.getElementById('lista-em-atendimento-monitor'),
  listaFilaMonitor: document.getElementById('lista-fila-monitor'),
  listaResolvidosMonitor: document.getElementById('lista-resolvidos-monitor'),
  listaFaqMonitor: document.getElementById('lista-faq-monitor'),

  toastContainer: document.getElementById('toast-container'),
};

function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatarHora(isoString) {
  if (!isoString) return '--';
  const data = new Date(isoString);
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function mostrarToast(mensagem, tipo = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensagem;
  elementos.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4200);
}

async function requisitarJson(url, opcoes = {}) {
  const resposta = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.erro || 'Erro ao comunicar com o servidor.');
  }
  return dados;
}

function alternarVisao(novaVisao) {
  estado.visaoAtual = novaVisao;
  const ehMonitor = novaVisao === 'MONITOR';

  elementos.btnVisaoAluno.classList.toggle('active', !ehMonitor);
  elementos.btnVisaoMonitor.classList.toggle('active', ehMonitor);
  elementos.secaoAluno.classList.toggle('hidden', ehMonitor);
  elementos.secaoMonitor.classList.toggle('hidden', !ehMonitor);

  document.querySelectorAll('.monitor-only').forEach((el) => {
    el.classList.toggle('hidden', !ehMonitor);
  });
}

function renderizarMural(mural) {
  const mapaClassesStatus = {
    ONLINE: 'status-online',
    PLANTAO_REMOTO: 'status-plantao',
    AUSENTE: 'status-ausente',
  };

  elementos.badgeStatusMonitor.textContent = mural.statusMonitor;
  elementos.badgeStatusMonitor.className = `status-pill ${
    mapaClassesStatus[mural.statusMonitor] || 'status-ausente'
  }`;
  elementos.muralMensagemAviso.textContent = mural.mensagemAviso;
  elementos.muralAtualizadoEm.textContent = `Atualizado às ${formatarHora(mural.atualizadoEm)}`;

  elementos.reforcoDisciplina.textContent = mural.reforcoRemoto.disciplina;
  elementos.reforcoDatahora.textContent = mural.reforcoRemoto.dataHora;
  elementos.reforcoTopico.textContent = mural.reforcoRemoto.topico;
  elementos.reforcoLink.textContent = mural.reforcoRemoto.linkSala;
  elementos.reforcoLink.href = mural.reforcoRemoto.linkSala;

  // Preenche os campos de edição do monitor apenas se não estiverem em foco no momento
  if (document.activeElement !== elementos.inputMensagemAviso) {
    elementos.inputStatusMonitor.value = mural.statusMonitor;
    elementos.inputMensagemAviso.value = mural.mensagemAviso;
  }
  if (document.activeElement !== elementos.inputReforcoDisciplina) {
    elementos.inputReforcoDisciplina.value = mural.reforcoRemoto.disciplina;
    elementos.inputReforcoDatahora.value = mural.reforcoRemoto.dataHora;
    elementos.inputReforcoTopico.value = mural.reforcoRemoto.topico;
    elementos.inputReforcoLink.value = mural.reforcoRemoto.linkSala;
  }
}

function renderizarEstrategiaEMetricas(painel) {
  elementos.seletorEstrategia.innerHTML = painel.estrategiasDisponiveis
    .map(
      (est) =>
        `<option value="${escaparHtml(est.codigo)}">${escaparHtml(est.nome)}</option>`,
    )
    .join('');
  elementos.seletorEstrategia.value = painel.estrategiaAtiva.codigo;

  elementos.badgeEstrategiaAtiva.textContent = painel.estrategiaAtiva.codigo;
  elementos.textoEstrategiaDescricao.textContent = painel.estrategiaAtiva.descricao;

  elementos.metricaAguardando.textContent = painel.metricas.totalAguardando;
  elementos.metricaEmAtendimento.textContent = painel.metricas.totalEmAtendimento;
  elementos.metricaTriagem.textContent = painel.metricas.totalResolvidosNaTriagem;
  elementos.metricaFaq.textContent = painel.metricas.totalItensFaq;
}

function criarBadgeUrgencia(urgencia) {
  if (urgencia === 'BLOQUEADO_ENTREGA') {
    return '<span class="pill pill-urgent">BLOQUEADO_ENTREGA</span>';
  }
  return '<span class="pill pill-normal">NORMAL</span>';
}

function renderizarFilaAluno(painel) {
  if (painel.emAtendimento.length > 0) {
    elementos.blocoEmAtendimentoAluno.innerHTML = painel.emAtendimento
      .map(
        (chamado) => `
        <div class="queue-item is-active">
          <div class="item-top">
            <div>
              <span class="pill pill-progress">EM ATENDIMENTO</span>
              <strong>${escaparHtml(chamado.nomeAluno)}</strong>
            </div>
            ${criarBadgeUrgencia(chamado.urgencia)}
          </div>
          <div class="item-meta">
            ${escaparHtml(chamado.disciplina)} &bull; ${escaparHtml(chamado.topico)} &bull; Iniciado às ${formatarHora(chamado.iniciadoEm)}
          </div>
          <p class="item-desc">${escaparHtml(chamado.descricao)}</p>
        </div>
      `,
      )
      .join('');
  } else {
    elementos.blocoEmAtendimentoAluno.innerHTML = '';
  }

  if (painel.filaAguardando.length === 0) {
    elementos.listaFilaAluno.innerHTML =
      '<div class="empty-state">Nenhum aluno aguardando na fila no momento.</div>';
    return;
  }

  elementos.listaFilaAluno.innerHTML = painel.filaAguardando
    .map(
      (chamado) => `
      <div class="queue-item ${chamado.urgencia === 'BLOQUEADO_ENTREGA' ? 'is-urgent' : ''}">
        <div class="item-top">
          <div>
            <span class="position-badge">#${chamado.posicao}</span>
            <strong>${escaparHtml(chamado.nomeAluno)}</strong>
          </div>
          ${criarBadgeUrgencia(chamado.urgencia)}
        </div>
        <div class="item-meta">
          ${escaparHtml(chamado.disciplina)} &bull; ${escaparHtml(chamado.topico)} &bull; Entrada às ${formatarHora(chamado.criadoEm)}
        </div>
        <p class="item-desc">${escaparHtml(chamado.descricao)}</p>
      </div>
    `,
    )
    .join('');
}

function renderizarFaq(itens, container) {
  if (!itens || itens.length === 0) {
    container.innerHTML =
      '<div class="empty-state">Nenhum item encontrado na base de FAQ.</div>';
    return;
  }

  container.innerHTML = itens
    .map(
      (item) => `
      <div class="faq-item">
        <div class="item-top">
          <strong>${escaparHtml(item.topico)}</strong>
          <span class="muted-meta">${escaparHtml(item.disciplina)}</span>
        </div>
        <p class="item-desc"><strong>Dúvida:</strong> ${escaparHtml(item.pergunta)}</p>
        <p class="item-desc" style="margin-top: 6px;"><strong>Solução:</strong> ${escaparHtml(item.resposta)}</p>
      </div>
    `,
    )
    .join('');
}

function renderizarVisaoMonitor(painel) {
  // Em atendimento
  if (painel.emAtendimento.length === 0) {
    elementos.listaEmAtendimentoMonitor.innerHTML =
      '<div class="empty-state">Nenhum chamado em atendimento agora. Clique em "Iniciar Atendimento" na fila abaixo.</div>';
  } else {
    elementos.listaEmAtendimentoMonitor.innerHTML = painel.emAtendimento
      .map(
        (chamado) => `
        <div class="queue-item is-active">
          <div class="item-top">
            <div>
              <span class="pill pill-progress">EM_ATENDIMENTO</span>
              <strong>${escaparHtml(chamado.nomeAluno)}</strong>
            </div>
            ${criarBadgeUrgencia(chamado.urgencia)}
          </div>
          <div class="item-meta">
            ${escaparHtml(chamado.disciplina)} &bull; ${escaparHtml(chamado.topico)} &bull; Iniciado às ${formatarHora(chamado.iniciadoEm)}
          </div>
          <p class="item-desc">${escaparHtml(chamado.descricao)}</p>

          <form class="item-actions form-concluir-chamado" data-chamado-id="${escaparHtml(chamado.id)}">
            <textarea
              name="respostaMonitor"
              rows="2"
              placeholder="Escreva a orientação técnica dada ao aluno..."
              required
            ></textarea>
            <label class="checkbox-row">
              <input type="checkbox" name="publicarNoFaq" checked />
              Publicar solução na Base de FAQ (dispara AutoFaqObserver)
            </label>
            <button type="submit" class="btn btn-success">Concluir Atendimento</button>
          </form>
        </div>
      `,
      )
      .join('');
  }

  // Fila aguardando
  if (painel.filaAguardando.length === 0) {
    elementos.listaFilaMonitor.innerHTML =
      '<div class="empty-state">Fila limpa! Nenhum chamado aguardando atendimento.</div>';
  } else {
    elementos.listaFilaMonitor.innerHTML = painel.filaAguardando
      .map(
        (chamado) => `
        <div class="queue-item ${chamado.urgencia === 'BLOQUEADO_ENTREGA' ? 'is-urgent' : ''}">
          <div class="item-top">
            <div>
              <span class="position-badge">#${chamado.posicao}</span>
              <strong>${escaparHtml(chamado.nomeAluno)}</strong>
            </div>
            ${criarBadgeUrgencia(chamado.urgencia)}
          </div>
          <div class="item-meta">
            ${escaparHtml(chamado.disciplina)} &bull; ${escaparHtml(chamado.topico)} &bull; Entrada às ${formatarHora(chamado.criadoEm)}
          </div>
          <p class="item-desc">${escaparHtml(chamado.descricao)}</p>
          <div class="item-actions">
            <button
              type="button"
              class="btn btn-primary btn-iniciar-atendimento"
              data-chamado-id="${escaparHtml(chamado.id)}"
            >
              Iniciar Atendimento
            </button>
          </div>
        </div>
      `,
      )
      .join('');
  }

  // Resolvidos recentes
  if (painel.resolvidosRecentes.length === 0) {
    elementos.listaResolvidosMonitor.innerHTML =
      '<div class="empty-state">Ainda não há atendimentos concluídos.</div>';
  } else {
    elementos.listaResolvidosMonitor.innerHTML = painel.resolvidosRecentes
      .map(
        (chamado) => `
        <div class="resolved-item">
          <div class="item-top">
            <strong>${escaparHtml(chamado.nomeAluno)}</strong>
            <span class="pill ${chamado.publicarNoFaq ? 'status-online' : 'pill-normal'}">
              ${chamado.publicarNoFaq ? 'Publicado no FAQ' : 'Apenas histórico'}
            </span>
          </div>
          <div class="item-meta">
            ${escaparHtml(chamado.disciplina)} &bull; ${escaparHtml(chamado.topico)} &bull; Concluído às ${formatarHora(chamado.resolvidoEm)}
          </div>
          <p class="item-desc"><strong>Dúvida:</strong> ${escaparHtml(chamado.descricao)}</p>
          <p class="item-desc" style="margin-top: 4px;"><strong>Resposta:</strong> ${escaparHtml(chamado.respostaMonitor)}</p>
        </div>
      `,
      )
      .join('');
  }

  renderizarFaq(painel.faq, elementos.listaFaqMonitor);
}

function aplicarFiltroFaqAluno() {
  if (!estado.painel) return;
  const termo = elementos.inputBuscaFaq.value.trim().toLowerCase();
  const itens = !termo
    ? estado.painel.faq
    : estado.painel.faq.filter((item) => {
        const texto = `${item.disciplina} ${item.topico} ${item.pergunta} ${item.resposta} ${(item.palavrasChave || []).join(' ')}`.toLowerCase();
        return texto.includes(termo);
      });

  renderizarFaq(itens, elementos.listaFaqAluno);
}

async function carregarPainel() {
  try {
    const painel = await requisitarJson('/api/painel');
    estado.painel = painel;
    renderizarMural(painel.mural);
    renderizarEstrategiaEMetricas(painel);
    renderizarFilaAluno(painel);
    renderizarVisaoMonitor(painel);
    aplicarFiltroFaqAluno();
  } catch (erro) {
    mostrarToast(erro.message, 'error');
  }
}

function exibirSugestoesTriagem(sugestoes) {
  elementos.listaSugestoesFaq.innerHTML = sugestoes
    .map(
      (item) => `
      <div class="triage-item">
        <p><strong>Tópico:</strong> ${escaparHtml(item.topico)} (${escaparHtml(item.disciplina)})</p>
        <p><strong>Dúvida anterior:</strong> ${escaparHtml(item.pergunta)}</p>
        <p><strong>Solução recomendada:</strong> ${escaparHtml(item.resposta)}</p>
      </div>
    `,
    )
    .join('');

  elementos.cardTriagemFaq.classList.remove('hidden');
}

function ocultarTriagem() {
  estado.duvidaPendenteTriagem = null;
  elementos.cardTriagemFaq.classList.add('hidden');
  elementos.listaSugestoesFaq.innerHTML = '';
}

// Eventos de navegação e Strategy
elementos.btnVisaoAluno.addEventListener('click', () => alternarVisao('ALUNO'));
elementos.btnVisaoMonitor.addEventListener('click', () => alternarVisao('MONITOR'));

elementos.seletorEstrategia.addEventListener('change', async (event) => {
  try {
    const codigo = event.target.value;
    const resposta = await requisitarJson('/api/estrategia', {
      method: 'PUT',
      body: JSON.stringify({ codigo }),
    });
    estado.painel = resposta.painel;
    renderizarEstrategiaEMetricas(resposta.painel);
    renderizarFilaAluno(resposta.painel);
    renderizarVisaoMonitor(resposta.painel);
    mostrarToast(`Estratégia alterada para: ${resposta.estrategiaAtiva.nome}`);
  } catch (erro) {
    mostrarToast(erro.message, 'error');
  }
});

// Evento de envio de dúvida do aluno (passa pela triagem Auto-FAQ)
elementos.formDuvida.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    nomeAluno: elementos.inputNomeAluno.value.trim(),
    disciplina: elementos.inputDisciplina.value.trim(),
    topico: elementos.inputTopico.value.trim(),
    urgencia: elementos.inputUrgencia.value,
    descricao: elementos.inputDescricao.value.trim(),
    forcarAbertura: false,
  };

  try {
    const resultado = await requisitarJson('/api/chamados', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (resultado.tipo === 'SUGESTAO_FAQ') {
      estado.duvidaPendenteTriagem = payload;
      exibirSugestoesTriagem(resultado.sugestoes);
      mostrarToast('Encontramos solução prévia no Auto-FAQ! Confira antes de entrar na fila.');
      return;
    }

    ocultarTriagem();
    elementos.formDuvida.reset();
    await carregarPainel();
    mostrarToast(`Chamado aberto na posição #${resultado.posicao} da fila!`);
  } catch (erro) {
    mostrarToast(erro.message, 'error');
  }
});

// Botão: Sim, resolveu (não abrir chamado)
elementos.btnTriagemResolveu.addEventListener('click', async () => {
  try {
    await requisitarJson('/api/triagem/resolvido', { method: 'POST' });
    ocultarTriagem();
    elementos.formDuvida.reset();
    await carregarPainel();
    mostrarToast('Ótimo! Dúvida resolvida via Auto-FAQ sem ocupar a fila.');
  } catch (erro) {
    mostrarToast(erro.message, 'error');
  }
});

// Botão: Não, ainda preciso do monitor (entrar na fila)
elementos.btnTriagemEntrarFila.addEventListener('click', async () => {
  if (!estado.duvidaPendenteTriagem) return;

  try {
    const resultado = await requisitarJson('/api/chamados', {
      method: 'POST',
      body: JSON.stringify({
        ...estado.duvidaPendenteTriagem,
        forcarAbertura: true,
      }),
    });

    ocultarTriagem();
    elementos.formDuvida.reset();
    await carregarPainel();
    mostrarToast(`Chamado confirmado na posição #${resultado.posicao} da fila!`);
  } catch (erro) {
    mostrarToast(erro.message, 'error');
  }
});

// Filtro da base de FAQ
elementos.inputBuscaFaq.addEventListener('input', aplicarFiltroFaqAluno);

// Eventos do Monitor no Mural
elementos.formStatusMonitor.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await requisitarJson('/api/mural/status', {
      method: 'PUT',
      body: JSON.stringify({
        statusMonitor: elementos.inputStatusMonitor.value,
        mensagemAviso: elementos.inputMensagemAviso.value,
      }),
    });
    await carregarPainel();
    mostrarToast('Status de disponibilidade do monitor atualizado!');
  } catch (erro) {
    mostrarToast(erro.message, 'error');
  }
});

elementos.formReforcoRemoto.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await requisitarJson('/api/mural/reforco', {
      method: 'PUT',
      body: JSON.stringify({
        disciplina: elementos.inputReforcoDisciplina.value,
        dataHora: elementos.inputReforcoDatahora.value,
        topico: elementos.inputReforcoTopico.value,
        linkSala: elementos.inputReforcoLink.value,
      }),
    });
    await carregarPainel();
    mostrarToast('Horário de reforço remoto atualizado no mural!');
  } catch (erro) {
    mostrarToast(erro.message, 'error');
  }
});

// Delegação de eventos para Iniciar e Concluir Atendimento (Visão Monitor)
elementos.listaFilaMonitor.addEventListener('click', async (event) => {
  const botao = event.target.closest('.btn-iniciar-atendimento');
  if (!botao) return;

  const chamadoId = botao.dataset.chamadoId;
  try {
    await requisitarJson(`/api/chamados/${encodeURIComponent(chamadoId)}/iniciar`, {
      method: 'PATCH',
    });
    await carregarPainel();
    mostrarToast('Atendimento iniciado!');
  } catch (erro) {
    mostrarToast(erro.message, 'error');
  }
});

elementos.listaEmAtendimentoMonitor.addEventListener('submit', async (event) => {
  const form = event.target.closest('.form-concluir-chamado');
  if (!form) return;
  event.preventDefault();

  const chamadoId = form.dataset.chamadoId;
  const respostaMonitor = form.elements.respostaMonitor.value.trim();
  const publicarNoFaq = form.elements.publicarNoFaq.checked;

  try {
    await requisitarJson(`/api/chamados/${encodeURIComponent(chamadoId)}/concluir`, {
      method: 'PATCH',
      body: JSON.stringify({ respostaMonitor, publicarNoFaq }),
    });
    await carregarPainel();
    mostrarToast(
      publicarNoFaq
        ? 'Atendimento concluído e publicado automaticamente na Base de FAQ!'
        : 'Atendimento concluído!',
    );
  } catch (erro) {
    mostrarToast(erro.message, 'error');
  }
});

// Inicialização
alternarVisao('ALUNO');
carregarPainel();
