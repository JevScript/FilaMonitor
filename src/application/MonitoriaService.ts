import crypto from 'node:crypto';
import { Chamado, ChamadoDTO } from '../domain/entities/Chamado';
import { ItemFaq, ItemFaqDTO } from '../domain/entities/ItemFaq';
import {
  MuralMonitoria,
  MuralMonitoriaDTO,
  ReforcoRemoto,
} from '../domain/entities/MuralMonitoria';
import { NivelUrgencia, StatusChamado, StatusMonitor } from '../domain/enums';
import { AutoFaqObserver } from '../domain/observers/AutoFaqObserver';
import { ChamadoObserver } from '../domain/observers/ChamadoObserver';
import { EstrategiaPriorizacao } from '../domain/strategies/EstrategiaPriorizacao';
import { FifoSimplesStrategy } from '../domain/strategies/FifoSimplesStrategy';
import { PrioridadeUrgenciaEOrdemStrategy } from '../domain/strategies/PrioridadeUrgenciaEOrdemStrategy';
import { IMonitoriaRepository } from '../infrastructure/IMonitoriaRepository';

/**
 * Erro de aplicação lançado quando um recurso solicitado não existe no repositório.
 */
export class RecursoNaoEncontradoError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'RecursoNaoEncontradoError';
  }
}

/**
 * Dados necessários para solicitar a abertura de um chamado pelo aluno.
 */
export interface AbrirChamadoInput {
  nomeAluno: string;
  disciplina: string;
  topico: string;
  urgencia: NivelUrgencia;
  descricao: string;
  forcarAbertura?: boolean;
}

/**
 * Resultado discriminado da tentativa de abertura de chamado.
 * Permite que a interface intercepte o fluxo quando o Auto-FAQ encontra solução prévia.
 */
export type ResultadoAberturaChamado =
  | {
      tipo: 'SUGESTAO_FAQ';
      sugestoes: ItemFaqDTO[];
    }
  | {
      tipo: 'CHAMADO_CRIADO';
      chamado: ChamadoDTO;
      posicao: number;
    };

/**
 * Item da fila exibido na interface já enriquecido com sua posição calculada
 * dinamicamente pela estratégia de priorização ativa.
 */
export interface ChamadoNaFilaDTO extends ChamadoDTO {
  posicao: number;
}

/**
 * Visão consolidada do painel retornada para o frontend em uma única chamada.
 */
export interface PainelMonitoriaDTO {
  mural: MuralMonitoriaDTO;
  estrategiaAtiva: {
    codigo: string;
    nome: string;
    descricao: string;
  };
  estrategiasDisponiveis: Array<{
    codigo: string;
    nome: string;
    descricao: string;
  }>;
  filaAguardando: ChamadoNaFilaDTO[];
  emAtendimento: ChamadoDTO[];
  resolvidosRecentes: ChamadoDTO[];
  faq: ItemFaqDTO[];
  metricas: {
    totalAguardando: number;
    totalEmAtendimento: number;
    totalResolvidos: number;
    totalResolvidosNaTriagem: number;
    totalItensFaq: number;
  };
}

/**
 * Serviço de Aplicação principal do sistema FilaMonitor BES.
 *
 * Responsabilidade:
 * - Orquestrar os casos de uso do sistema (mural, triagem Auto-FAQ, fila com Strategy,
 *   ciclo de atendimento do monitor e disparo de Observers na conclusão).
 * - Depender exclusivamente da abstração `IMonitoriaRepository` (Inversão de Dependência).
 */
export class MonitoriaService {
  private readonly estrategias: Map<string, EstrategiaPriorizacao> = new Map();
  private readonly observers: ChamadoObserver[] = [];

  constructor(
    private readonly repository: IMonitoriaRepository,
    estrategiasIniciais?: EstrategiaPriorizacao[],
    observersIniciais?: ChamadoObserver[],
  ) {
    const estrategias = estrategiasIniciais ?? [
      new PrioridadeUrgenciaEOrdemStrategy(),
      new FifoSimplesStrategy(),
    ];

    for (const estrategia of estrategias) {
      this.estrategias.set(estrategia.codigo, estrategia);
    }

    const observers = observersIniciais ?? [new AutoFaqObserver(this.repository)];
    for (const observer of observers) {
      this.observers.push(observer);
    }
  }

  /**
   * Registra dinamicamente um novo Observer para eventos de conclusão de chamado.
   */
  public registrarObserver(observer: ChamadoObserver): void {
    this.observers.push(observer);
  }

  /**
   * Retorna a estratégia de priorização atualmente configurada, garantindo fallback
   * seguro caso o arquivo JSON possua algum código desconhecido.
   */
  public obterEstrategiaAtiva(): EstrategiaPriorizacao {
    const codigoSalvo = this.repository.obterCodigoEstrategiaAtiva();
    const estrategia = this.estrategias.get(codigoSalvo);

    if (estrategia) {
      return estrategia;
    }

    const primeiraDisponivel = this.estrategias.values().next().value;
    if (!primeiraDisponivel) {
      throw new Error('Nenhuma estratégia de priorização registrada.');
    }

    return primeiraDisponivel;
  }

  /**
   * Alterna em tempo real a estratégia de ordenação da fila (Padrão Strategy).
   *
   * @param codigo Código identificador da estratégia desejada.
   * @throws Error Quando o código não corresponde a nenhuma estratégia registrada.
   */
  public alternarEstrategia(codigo: string): EstrategiaPriorizacao {
    const estrategia = this.estrategias.get(codigo);
    if (!estrategia) {
      throw new Error(`Estratégia de priorização "${codigo}" não encontrada.`);
    }

    this.repository.salvarCodigoEstrategiaAtiva(estrategia.codigo);
    return estrategia;
  }

  /**
   * Monta o estado completo do painel para renderização nas visões Aluno e Monitor.
   *
   * Passo a passo:
   * 1. Carrega todos os chamados e separa por status (`AGUARDANDO`, `EM_ATENDIMENTO`, `RESOLVIDO`).
   * 2. Aplica a `EstrategiaPriorizacao` ativa sobre os chamados `AGUARDANDO` e calcula a
   *    posição visível (`1..N`) de cada aluno.
   * 3. Ordena os resolvidos recentes do mais novo para o mais antigo.
   * 4. Consolida métricas operacionais (incluindo desvios bem-sucedidos pelo Auto-FAQ).
   */
  public obterPainelCompleto(): PainelMonitoriaDTO {
    const mural = this.repository.obterMural();
    const estrategiaAtiva = this.obterEstrategiaAtiva();
    const todosChamados = this.repository.listarChamados();

    const aguardando = todosChamados.filter(
      (chamado) => chamado.status === StatusChamado.AGUARDANDO,
    );
    const filaOrdenada = estrategiaAtiva.ordenar(aguardando).map((chamado, indice) => ({
      ...chamado.toJSON(),
      posicao: indice + 1,
    }));

    const emAtendimento = todosChamados
      .filter((chamado) => chamado.status === StatusChamado.EM_ATENDIMENTO)
      .sort((a, b) => {
        const inicioA = a.iniciadoEm ? a.iniciadoEm.getTime() : 0;
        const inicioB = b.iniciadoEm ? b.iniciadoEm.getTime() : 0;
        return inicioA - inicioB;
      })
      .map((chamado) => chamado.toJSON());

    const resolvidos = todosChamados
      .filter((chamado) => chamado.status === StatusChamado.RESOLVIDO)
      .sort((a, b) => {
        const fimA = a.resolvidoEm ? a.resolvidoEm.getTime() : 0;
        const fimB = b.resolvidoEm ? b.resolvidoEm.getTime() : 0;
        return fimB - fimA;
      });

    const itensFaq = this.repository
      .listarItensFaq()
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());

    return {
      mural: mural.toJSON(),
      estrategiaAtiva: {
        codigo: estrategiaAtiva.codigo,
        nome: estrategiaAtiva.nome,
        descricao: estrategiaAtiva.descricao,
      },
      estrategiasDisponiveis: Array.from(this.estrategias.values()).map((estrategia) => ({
        codigo: estrategia.codigo,
        nome: estrategia.nome,
        descricao: estrategia.descricao,
      })),
      filaAguardando: filaOrdenada,
      emAtendimento,
      resolvidosRecentes: resolvidos.slice(0, 8).map((chamado) => chamado.toJSON()),
      faq: itensFaq.map((item) => item.toJSON()),
      metricas: {
        totalAguardando: filaOrdenada.length,
        totalEmAtendimento: emAtendimento.length,
        totalResolvidos: resolvidos.length,
        totalResolvidosNaTriagem: this.repository.obterTotalResolvidosNaTriagem(),
        totalItensFaq: itensFaq.length,
      },
    };
  }

  /**
   * Atualiza o status de disponibilidade e a mensagem rápida do monitor no mural.
   */
  public atualizarStatusMonitor(status: StatusMonitor, mensagemAviso: string): MuralMonitoria {
    const mural = this.repository.obterMural();
    mural.atualizarStatus(status, mensagemAviso);
    this.repository.salvarMural(mural);
    return mural;
  }

  /**
   * Atualiza as informações do próximo encontro de reforço remoto no mural.
   */
  public atualizarReforcoRemoto(dados: ReforcoRemoto): MuralMonitoria {
    const mural = this.repository.obterMural();
    mural.atualizarReforcoRemoto(dados);
    this.repository.salvarMural(mural);
    return mural;
  }

  /**
   * Executa a triagem preventiva (Auto-FAQ) buscando dúvidas já resolvidas do mesmo
   * tópico que compartilhem palavras-chave semelhantes com a dúvida do aluno.
   *
   * Regra de negócio:
   * - Retorna os itens ordenados da maior pontuação de relevância para a menor,
   *   limitados aos 3 candidatos mais aderentes para não sobrecarregar o aluno.
   */
  public verificarTriagemAutoFaq(topico: string, descricao: string): ItemFaq[] {
    const topicoLimpo = topico.trim();
    const descricaoLimpa = descricao.trim();

    if (!topicoLimpo || !descricaoLimpa) {
      return [];
    }

    const candidatos = this.repository
      .listarItensFaq()
      .map((item) => ({
        item,
        relevancia: item.calcularRelevanciaTriagem(topicoLimpo, descricaoLimpa),
      }))
      .filter((entrada) => entrada.relevancia > 0)
      .sort((a, b) => {
        if (b.relevancia !== a.relevancia) {
          return b.relevancia - a.relevancia;
        }
        return b.item.criadoEm.getTime() - a.item.criadoEm.getTime();
      });

    return candidatos.slice(0, 3).map((entrada) => entrada.item);
  }

  /**
   * Contabiliza quando o aluno confirma que o Auto-FAQ resolveu sua dúvida e desiste
   * de entrar na fila de atendimento humano.
   */
  public registrarDesvioTriagem(): number {
    return this.repository.incrementarResolvidosNaTriagem();
  }

  /**
   * Processa a abertura de um chamado na fila.
   *
   * Passo a passo e regra de negócio:
   * 1. Valida e instancia o `Chamado` antes mesmo de decidir sobre a fila, garantindo que
   *    entradas inválidas sejam rejeitadas imediatamente.
   * 2. Se `forcarAbertura` não estiver marcado (`false`), executa primeiro a triagem
   *    Auto-FAQ. Caso encontre sugestões relevantes, retorna `SUGESTAO_FAQ` sem enfileirar.
   * 3. Caso não haja sugestões ou o aluno confirme que ainda precisa do monitor
   *    (`forcarAbertura = true`), persiste o chamado com status `AGUARDANDO` e calcula
   *    sua posição imediata na fila conforme a estratégia ativa.
   */
  public abrirChamado(input: AbrirChamadoInput): ResultadoAberturaChamado {
    const novoChamado = new Chamado({
      id: `ch-${crypto.randomUUID().slice(0, 8)}`,
      nomeAluno: input.nomeAluno,
      disciplina: input.disciplina,
      topico: input.topico,
      urgencia: input.urgencia,
      descricao: input.descricao,
      status: StatusChamado.AGUARDANDO,
      criadoEm: new Date(),
    });

    if (!input.forcarAbertura) {
      const sugestoes = this.verificarTriagemAutoFaq(input.topico, input.descricao);
      if (sugestoes.length > 0) {
        return {
          tipo: 'SUGESTAO_FAQ',
          sugestoes: sugestoes.map((item) => item.toJSON()),
        };
      }
    }

    this.repository.salvarChamado(novoChamado);

    const estrategiaAtiva = this.obterEstrategiaAtiva();
    const aguardando = this.repository
      .listarChamados()
      .filter((chamado) => chamado.status === StatusChamado.AGUARDANDO);
    const filaOrdenada = estrategiaAtiva.ordenar(aguardando);
    const posicao = filaOrdenada.findIndex((item) => item.id === novoChamado.id) + 1;

    return {
      tipo: 'CHAMADO_CRIADO',
      chamado: novoChamado.toJSON(),
      posicao: posicao > 0 ? posicao : 1,
    };
  }

  /**
   * Move um chamado de `AGUARDANDO` para `EM_ATENDIMENTO`.
   */
  public iniciarAtendimento(chamadoId: string): Chamado {
    const chamado = this.repository.buscarChamadoPorId(chamadoId);
    if (!chamado) {
      throw new RecursoNaoEncontradoError(`Chamado "${chamadoId}" não encontrado.`);
    }

    chamado.iniciarAtendimento();
    this.repository.salvarChamado(chamado);
    return chamado;
  }

  /**
   * Conclui o atendimento de um chamado (`EM_ATENDIMENTO` -> `RESOLVIDO`), persiste a
   * resposta e notifica todos os Observers registrados (como o `AutoFaqObserver`).
   */
  public concluirAtendimento(
    chamadoId: string,
    respostaMonitor: string,
    publicarNoFaq: boolean,
  ): Chamado {
    const chamado = this.repository.buscarChamadoPorId(chamadoId);
    if (!chamado) {
      throw new RecursoNaoEncontradoError(`Chamado "${chamadoId}" não encontrado.`);
    }

    chamado.concluirAtendimento(respostaMonitor, publicarNoFaq);
    this.repository.salvarChamado(chamado);

    // Notifica os observadores somente após a persistência bem-sucedida da transição.
    for (const observer of this.observers) {
      observer.aoConcluirChamado(chamado);
    }

    return chamado;
  }

  /**
   * Pesquisa itens na base de FAQ por termo livre e/ou tópico específico.
   */
  public buscarFaq(termo?: string, topico?: string): ItemFaq[] {
    return this.repository
      .listarItensFaq()
      .filter((item) => item.correspondeABusca(termo, topico))
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  }
}
