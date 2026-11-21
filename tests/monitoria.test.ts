import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { MonitoriaService } from '../src/application/MonitoriaService';
import { Chamado } from '../src/domain/entities/Chamado';
import { ItemFaq } from '../src/domain/entities/ItemFaq';
import { NivelUrgencia, StatusChamado, StatusMonitor } from '../src/domain/enums';
import { FifoSimplesStrategy } from '../src/domain/strategies/FifoSimplesStrategy';
import { PrioridadeUrgenciaEOrdemStrategy } from '../src/domain/strategies/PrioridadeUrgenciaEOrdemStrategy';
import { JsonMonitoriaRepository } from '../src/infrastructure/JsonMonitoriaRepository';

describe('FilaMonitor BES — Domínio, Strategy, Triagem Auto-FAQ e Observer', () => {
  let diretorioTemp: string;
  let caminhoJsonTemp: string;
  let repository: JsonMonitoriaRepository;
  let service: MonitoriaService;

  beforeEach(() => {
    diretorioTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'filamonitor-test-'));
    caminhoJsonTemp = path.join(diretorioTemp, 'dados-teste.json');
    repository = new JsonMonitoriaRepository(caminhoJsonTemp);
    service = new MonitoriaService(repository);
  });

  afterEach(() => {
    fs.rmSync(diretorioTemp, { recursive: true, force: true });
  });

  describe('Entidade Chamado — Encapsulamento e Transição de Estados', () => {
    it('deve transicionar corretamente de AGUARDANDO -> EM_ATENDIMENTO -> RESOLVIDO', () => {
      const chamado = new Chamado({
        id: 'ch-1',
        nomeAluno: 'Ana Paula',
        disciplina: 'POO Avançada',
        topico: 'SOLID',
        urgencia: NivelUrgencia.NORMAL,
        descricao: 'Dúvida sobre SRP em controllers.',
      });

      assert.equal(chamado.status, StatusChamado.AGUARDANDO);

      chamado.iniciarAtendimento();
      assert.equal(chamado.status, StatusChamado.EM_ATENDIMENTO);
      assert.ok(chamado.iniciadoEm instanceof Date);

      chamado.concluirAtendimento('Separe a regra de negócio no Service.', true);
      assert.equal(chamado.status, StatusChamado.RESOLVIDO);
      assert.equal(chamado.publicarNoFaq, true);
      assert.ok(chamado.resolvidoEm instanceof Date);
    });

    it('deve bloquear transições inválidas e respostas vazias', () => {
      const chamado = new Chamado({
        id: 'ch-2',
        nomeAluno: 'Bruno Lima',
        disciplina: 'Estrutura de Dados',
        topico: 'Collections',
        urgencia: NivelUrgencia.BLOQUEADO_ENTREGA,
        descricao: 'Erro ao ordenar lista.',
      });

      assert.throws(() => {
        chamado.concluirAtendimento('Resposta prematura', false);
      }, /Não é possível concluir atendimento/);

      chamado.iniciarAtendimento();

      assert.throws(() => {
        chamado.iniciarAtendimento();
      }, /Não é possível iniciar atendimento/);

      assert.throws(() => {
        chamado.concluirAtendimento('   ', true);
      }, /Informe a resposta do monitor/);
    });
  });

  describe('Padrão Strategy — PrioridadeUrgenciaEOrdemStrategy vs FifoSimplesStrategy', () => {
    it('deve priorizar BLOQUEADO_ENTREGA e desempatar por chegada na PrioridadeUrgenciaEOrdemStrategy', () => {
      const normalAntigo = new Chamado({
        id: 'ch-a',
        nomeAluno: 'Aluno A',
        disciplina: 'POO Avançada',
        topico: 'SOLID',
        urgencia: NivelUrgencia.NORMAL,
        descricao: 'Dúvida normal antiga',
        criadoEm: new Date('2026-11-20T10:00:00Z'),
      });
      const bloqueadoRecente = new Chamado({
        id: 'ch-b',
        nomeAluno: 'Aluno B',
        disciplina: 'POO Avançada',
        topico: 'Padrões GoF',
        urgencia: NivelUrgencia.BLOQUEADO_ENTREGA,
        descricao: 'Bloqueado na entrega depois',
        criadoEm: new Date('2026-11-20T10:15:00Z'),
      });
      const bloqueadoMaisAntigo = new Chamado({
        id: 'ch-c',
        nomeAluno: 'Aluno C',
        disciplina: 'POO Avançada',
        topico: 'Padrões GoF',
        urgencia: NivelUrgencia.BLOQUEADO_ENTREGA,
        descricao: 'Bloqueado na entrega antes',
        criadoEm: new Date('2026-11-20T10:05:00Z'),
      });

      const strategyUrgencia = new PrioridadeUrgenciaEOrdemStrategy();
      const ordenadoUrgencia = strategyUrgencia.ordenar([
        normalAntigo,
        bloqueadoRecente,
        bloqueadoMaisAntigo,
      ]);

      assert.deepEqual(
        ordenadoUrgencia.map((c) => c.id),
        ['ch-c', 'ch-b', 'ch-a'],
      );

      const strategyFifo = new FifoSimplesStrategy();
      const ordenadoFifo = strategyFifo.ordenar([
        normalAntigo,
        bloqueadoRecente,
        bloqueadoMaisAntigo,
      ]);

      assert.deepEqual(
        ordenadoFifo.map((c) => c.id),
        ['ch-a', 'ch-c', 'ch-b'],
      );
    });

    it('deve alternar a estratégia em tempo real no MonitoriaService e reordenar a fila', () => {
      repository.salvarChamado(
        new Chamado({
          id: 'ch-normal',
          nomeAluno: 'Carlos',
          disciplina: 'POO Avançada',
          topico: 'SOLID',
          urgencia: NivelUrgencia.NORMAL,
          descricao: 'Chegou primeiro com urgência normal',
          criadoEm: new Date('2026-11-20T12:00:00Z'),
        }),
      );
      repository.salvarChamado(
        new Chamado({
          id: 'ch-urgente',
          nomeAluno: 'Daniela',
          disciplina: 'POO Avançada',
          topico: 'Padrões GoF',
          urgencia: NivelUrgencia.BLOQUEADO_ENTREGA,
          descricao: 'Chegou depois mas está bloqueada na entrega',
          criadoEm: new Date('2026-11-20T12:10:00Z'),
        }),
      );

      let painel = service.obterPainelCompleto();
      assert.equal(painel.estrategiaAtiva.codigo, 'PRIORIDADE_URGENCIA');
      assert.deepEqual(
        painel.filaAguardando.map((c) => ({ id: c.id, posicao: c.posicao })),
        [
          { id: 'ch-urgente', posicao: 1 },
          { id: 'ch-normal', posicao: 2 },
        ],
      );

      service.alternarEstrategia('FIFO_SIMPLES');
      painel = service.obterPainelCompleto();
      assert.equal(painel.estrategiaAtiva.codigo, 'FIFO_SIMPLES');
      assert.deepEqual(
        painel.filaAguardando.map((c) => ({ id: c.id, posicao: c.posicao })),
        [
          { id: 'ch-normal', posicao: 1 },
          { id: 'ch-urgente', posicao: 2 },
        ],
      );
    });
  });

  describe('Triagem Preventiva (Auto-FAQ) e Fluxo de Abertura', () => {
    beforeEach(() => {
      repository.salvarItemFaq(
        new ItemFaq({
          id: 'faq-seed-1',
          disciplina: 'POO Avançada',
          topico: 'SOLID',
          pergunta: 'Como evitar muitos if/else para trocar algoritmos no Service?',
          resposta: 'Aplique o Open/Closed Principle usando uma interface Strategy.',
          palavrasChave: ['solid', 'ocp', 'strategy', 'algoritmos', 'else'],
        }),
      );
    });

    it('deve sugerir item do FAQ quando tópico e palavras-chave coincidirem antes de abrir chamado', () => {
      const resultado = service.abrirChamado({
        nomeAluno: 'Eduardo',
        disciplina: 'POO Avançada',
        topico: 'solid', // testa tolerância a caixa/acentos
        urgencia: NivelUrgencia.NORMAL,
        descricao: 'Meu Service tem vários if/else para escolher algoritmos de cálculo.',
        forcarAbertura: false,
      });

      assert.equal(resultado.tipo, 'SUGESTAO_FAQ');
      if (resultado.tipo === 'SUGESTAO_FAQ') {
        assert.equal(resultado.sugestoes.length, 1);
        assert.equal(resultado.sugestoes[0].id, 'faq-seed-1');
      }
      assert.equal(repository.listarChamados().length, 0);
    });

    it('deve criar o chamado na fila quando o aluno insistir (forcarAbertura = true)', () => {
      const resultado = service.abrirChamado({
        nomeAluno: 'Eduardo',
        disciplina: 'POO Avançada',
        topico: 'SOLID',
        urgencia: NivelUrgencia.BLOQUEADO_ENTREGA,
        descricao: 'Ainda preciso de ajuda no algoritmo com Strategy.',
        forcarAbertura: true,
      });

      assert.equal(resultado.tipo, 'CHAMADO_CRIADO');
      if (resultado.tipo === 'CHAMADO_CRIADO') {
        assert.equal(resultado.posicao, 1);
        assert.equal(resultado.chamado.status, StatusChamado.AGUARDANDO);
      }
      assert.equal(repository.listarChamados().length, 1);
    });

    it('não deve sugerir FAQ de tópico diferente mesmo com palavras em comum', () => {
      const sugestoes = service.verificarTriagemAutoFaq(
        'Threads',
        'Meu algoritmo de ordenação está com erro.',
      );
      assert.equal(sugestoes.length, 0);
    });
  });

  describe('Padrão Observer — AutoFaqObserver e Persistência JSON', () => {
    it('deve publicar automaticamente novo ItemFaq ao concluir chamado com publicarNoFaq=true', () => {
      const abertura = service.abrirChamado({
        nomeAluno: 'Fernanda',
        disciplina: 'Estrutura de Dados',
        topico: 'Collections',
        urgencia: NivelUrgencia.NORMAL,
        descricao: 'Como evitar ConcurrentModificationException ao remover itens de uma lista?',
        forcarAbertura: true,
      });

      assert.equal(abertura.tipo, 'CHAMADO_CRIADO');
      if (abertura.tipo !== 'CHAMADO_CRIADO') return;

      service.iniciarAtendimento(abertura.chamado.id);
      service.concluirAtendimento(
        abertura.chamado.id,
        'Use Iterator.remove() ou removeIf() em vez de remover dentro do for-each.',
        true,
      );

      // Recarrega via nova instância de repositório para confirmar persistência em disco
      const repoRecarregado = new JsonMonitoriaRepository(caminhoJsonTemp);
      const itensFaq = repoRecarregado.listarItensFaq();
      assert.equal(itensFaq.length, 1);
      assert.equal(itensFaq[0].origemChamadoId, abertura.chamado.id);
      assert.equal(itensFaq[0].topico, 'Collections');

      // Confirma que uma nova dúvida semelhante já aciona o Auto-FAQ recém-criado
      const novoService = new MonitoriaService(repoRecarregado);
      const sugestoes = novoService.verificarTriagemAutoFaq(
        'Collections',
        'Estou tomando ConcurrentModificationException ao remover da lista.',
      );
      assert.equal(sugestoes.length, 1);
    });

    it('não deve publicar ItemFaq quando publicarNoFaq=false', () => {
      const abertura = service.abrirChamado({
        nomeAluno: 'Gabriel',
        disciplina: 'POO Avançada',
        topico: 'Threads',
        urgencia: NivelUrgencia.NORMAL,
        descricao: 'Minha dúvida é pontual no meu computador.',
        forcarAbertura: true,
      });

      if (abertura.tipo !== 'CHAMADO_CRIADO') return;

      service.iniciarAtendimento(abertura.chamado.id);
      service.concluirAtendimento(abertura.chamado.id, 'Resolvido no laboratório.', false);

      assert.equal(repository.listarItensFaq().length, 0);
    });
  });

  describe('Mural de Disponibilidade e Reforço Remoto', () => {
    it('deve atualizar status do monitor e dados de reforço remoto persistindo no JSON', () => {
      service.atualizarStatusMonitor(
        StatusMonitor.PLANTAO_REMOTO,
        'Atendendo via link da sala remota até 21h.',
      );
      service.atualizarReforcoRemoto({
        disciplina: 'Estrutura de Dados',
        dataHora: 'Sexta, 18:30',
        topico: 'Árvores Binárias e Balanceamento',
        linkSala: 'https://meet.ucsal.br/arvores-bes',
      });

      const painel = new MonitoriaService(new JsonMonitoriaRepository(caminhoJsonTemp)).obterPainelCompleto();
      assert.equal(painel.mural.statusMonitor, StatusMonitor.PLANTAO_REMOTO);
      assert.equal(painel.mural.reforcoRemoto.topico, 'Árvores Binárias e Balanceamento');
    });
  });
});
