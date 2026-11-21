import { NivelUrgencia, StatusChamado } from '../enums';

/**
 * Estrutura de dados usada para criar ou reconstituir uma instância de Chamado.
 */
export interface ChamadoProps {
  id: string;
  nomeAluno: string;
  disciplina: string;
  topico: string;
  urgencia: NivelUrgencia;
  descricao: string;
  status?: StatusChamado;
  criadoEm?: Date | string;
  iniciadoEm?: Date | string | null;
  resolvidoEm?: Date | string | null;
  respostaMonitor?: string | null;
  publicarNoFaq?: boolean;
}

/**
 * Formato serializável do chamado para persistência em JSON e retorno na API.
 */
export interface ChamadoDTO {
  id: string;
  nomeAluno: string;
  disciplina: string;
  topico: string;
  urgencia: NivelUrgencia;
  descricao: string;
  status: StatusChamado;
  criadoEm: string;
  iniciadoEm: string | null;
  resolvidoEm: string | null;
  respostaMonitor: string | null;
  publicarNoFaq: boolean;
}

/**
 * Entidade de domínio que representa uma solicitação de atendimento na fila de monitoria.
 *
 * Responsabilidade:
 * - Proteger a integridade dos dados do chamado por meio de encapsulamento.
 * - Garantir que as transições de estado do ciclo de atendimento respeitem as regras
 *   de negócio (máquina de estados finita: AGUARDANDO -> EM_ATENDIMENTO -> RESOLVIDO).
 */
export class Chamado {
  private readonly _id: string;
  private readonly _nomeAluno: string;
  private readonly _disciplina: string;
  private readonly _topico: string;
  private readonly _urgencia: NivelUrgencia;
  private readonly _descricao: string;
  private _status: StatusChamado;
  private readonly _criadoEm: Date;
  private _iniciadoEm: Date | null;
  private _resolvidoEm: Date | null;
  private _respostaMonitor: string | null;
  private _publicarNoFaq: boolean;

  /**
   * Constrói um novo Chamado validando os campos obrigatórios e normalizando datas.
   *
   * @param props Dados iniciais ou persistidos do chamado.
   * @throws Error Quando algum campo textual obrigatório está vazio ou o nível de urgência é inválido.
   */
  constructor(props: ChamadoProps) {
    // Regra de negócio: nenhum chamado entra na fila sem identificação mínima e contexto da dúvida,
    // evitando atendimentos genéricos que atrasam o fluxo do monitor.
    const nomeAluno = props.nomeAluno.trim();
    const disciplina = props.disciplina.trim();
    const topico = props.topico.trim();
    const descricao = props.descricao.trim();

    if (!props.id || !props.id.trim()) {
      throw new Error('O identificador do chamado é obrigatório.');
    }
    if (!nomeAluno) {
      throw new Error('O nome do aluno é obrigatório.');
    }
    if (!disciplina) {
      throw new Error('A disciplina é obrigatória.');
    }
    if (!topico) {
      throw new Error('O tópico da dúvida é obrigatório.');
    }
    if (!descricao) {
      throw new Error('A descrição da dúvida é obrigatória.');
    }
    if (!Object.values(NivelUrgencia).includes(props.urgencia)) {
      throw new Error('Nível de urgência inválido.');
    }

    this._id = props.id.trim();
    this._nomeAluno = nomeAluno;
    this._disciplina = disciplina;
    this._topico = topico;
    this._urgencia = props.urgencia;
    this._descricao = descricao;
    this._status = props.status ?? StatusChamado.AGUARDANDO;
    this._criadoEm = props.criadoEm ? new Date(props.criadoEm) : new Date();
    this._iniciadoEm = props.iniciadoEm ? new Date(props.iniciadoEm) : null;
    this._resolvidoEm = props.resolvidoEm ? new Date(props.resolvidoEm) : null;
    this._respostaMonitor = props.respostaMonitor ? props.respostaMonitor.trim() : null;
    this._publicarNoFaq = Boolean(props.publicarNoFaq);
  }

  get id(): string {
    return this._id;
  }

  get nomeAluno(): string {
    return this._nomeAluno;
  }

  get disciplina(): string {
    return this._disciplina;
  }

  get topico(): string {
    return this._topico;
  }

  get urgencia(): NivelUrgencia {
    return this._urgencia;
  }

  get descricao(): string {
    return this._descricao;
  }

  get status(): StatusChamado {
    return this._status;
  }

  get criadoEm(): Date {
    return new Date(this._criadoEm.getTime());
  }

  get iniciadoEm(): Date | null {
    return this._iniciadoEm ? new Date(this._iniciadoEm.getTime()) : null;
  }

  get resolvidoEm(): Date | null {
    return this._resolvidoEm ? new Date(this._resolvidoEm.getTime()) : null;
  }

  get respostaMonitor(): string | null {
    return this._respostaMonitor;
  }

  get publicarNoFaq(): boolean {
    return this._publicarNoFaq;
  }

  /**
   * Inicia o atendimento de um chamado que está aguardando na fila.
   *
   * Regra de negócio: apenas chamados com status AGUARDANDO podem ser iniciados,
   * impedindo que um chamado já em atendimento ou resolvido seja reaberto acidentalmente.
   *
   * @throws Error Se o chamado não estiver com status AGUARDANDO.
   */
  public iniciarAtendimento(): void {
    if (this._status !== StatusChamado.AGUARDANDO) {
      throw new Error(
        `Não é possível iniciar atendimento: o chamado "${this._id}" está com status ${this._status}.`,
      );
    }

    this._status = StatusChamado.EM_ATENDIMENTO;
    this._iniciadoEm = new Date();
  }

  /**
   * Conclui o atendimento registrando a solução fornecida pelo monitor.
   *
   * Regra de negócio:
   * - Apenas chamados EM_ATENDIMENTO podem ser concluídos (garante rastreabilidade do início ao fim).
   * - A resposta do monitor não pode ser vazia para manter histórico útil e alimentar a base de FAQ.
   *
   * @param respostaMonitor Explicação técnica dada ao aluno.
   * @param publicarNoFaq Indica se a solução deve disparar a publicação automática na base de FAQ.
   * @throws Error Se o chamado não estiver EM_ATENDIMENTO ou se a resposta estiver vazia.
   */
  public concluirAtendimento(respostaMonitor: string, publicarNoFaq: boolean): void {
    if (this._status !== StatusChamado.EM_ATENDIMENTO) {
      throw new Error(
        `Não é possível concluir atendimento: o chamado "${this._id}" está com status ${this._status}.`,
      );
    }

    const respostaLimpa = respostaMonitor.trim();
    if (!respostaLimpa) {
      throw new Error('Informe a resposta do monitor antes de concluir o atendimento.');
    }

    this._respostaMonitor = respostaLimpa;
    this._publicarNoFaq = Boolean(publicarNoFaq);
    this._status = StatusChamado.RESOLVIDO;
    this._resolvidoEm = new Date();
  }

  /**
   * Serializa a entidade para persistência em arquivo JSON ou resposta HTTP.
   */
  public toJSON(): ChamadoDTO {
    return {
      id: this._id,
      nomeAluno: this._nomeAluno,
      disciplina: this._disciplina,
      topico: this._topico,
      urgencia: this._urgencia,
      descricao: this._descricao,
      status: this._status,
      criadoEm: this._criadoEm.toISOString(),
      iniciadoEm: this._iniciadoEm ? this._iniciadoEm.toISOString() : null,
      resolvidoEm: this._resolvidoEm ? this._resolvidoEm.toISOString() : null,
      respostaMonitor: this._respostaMonitor,
      publicarNoFaq: this._publicarNoFaq,
    };
  }

  /**
   * Reconstitui uma instância de Chamado a partir de um DTO persistido.
   */
  public static fromJSON(dto: ChamadoDTO): Chamado {
    return new Chamado(dto);
  }
}
