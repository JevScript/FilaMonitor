import { StatusMonitor } from '../enums';

/**
 * Dados do próximo encontro de aula de reforço remoto divulgado no mural.
 */
export interface ReforcoRemoto {
  disciplina: string;
  dataHora: string;
  topico: string;
  linkSala: string;
}

/**
 * Estrutura para criação ou reconstituição do MuralMonitoria.
 */
export interface MuralMonitoriaProps {
  statusMonitor: StatusMonitor;
  mensagemAviso: string;
  reforcoRemoto: ReforcoRemoto;
  atualizadoEm?: Date | string;
}

/**
 * Formato serializável do mural para persistência e comunicação com o frontend.
 */
export interface MuralMonitoriaDTO {
  statusMonitor: StatusMonitor;
  mensagemAviso: string;
  reforcoRemoto: ReforcoRemoto;
  atualizadoEm: string;
}

/**
 * Entidade de domínio que centraliza a disponibilidade atual do monitor e o aviso
 * da próxima aula de reforço remoto exibidos no topo da aplicação.
 */
export class MuralMonitoria {
  private _statusMonitor: StatusMonitor;
  private _mensagemAviso: string;
  private _reforcoRemoto: ReforcoRemoto;
  private _atualizadoEm: Date;

  constructor(props: MuralMonitoriaProps) {
    if (!Object.values(StatusMonitor).includes(props.statusMonitor)) {
      throw new Error('Status do monitor inválido.');
    }

    this._statusMonitor = props.statusMonitor;
    this._mensagemAviso = props.mensagemAviso.trim();
    this._reforcoRemoto = {
      disciplina: props.reforcoRemoto.disciplina.trim(),
      dataHora: props.reforcoRemoto.dataHora.trim(),
      topico: props.reforcoRemoto.topico.trim(),
      linkSala: props.reforcoRemoto.linkSala.trim(),
    };
    this._atualizadoEm = props.atualizadoEm ? new Date(props.atualizadoEm) : new Date();
  }

  get statusMonitor(): StatusMonitor {
    return this._statusMonitor;
  }

  get mensagemAviso(): string {
    return this._mensagemAviso;
  }

  get reforcoRemoto(): ReforcoRemoto {
    return { ...this._reforcoRemoto };
  }

  get atualizadoEm(): Date {
    return new Date(this._atualizadoEm.getTime());
  }

  /**
   * Atualiza a disponibilidade do monitor e a mensagem rápida exibida aos alunos.
   *
   * Regra de negócio: o monitor precisa manter visibilidade clara se está no laboratório
   * (ONLINE), em plantão online (PLANTAO_REMOTO) ou indisponível (AUSENTE) para reduzir
   * deslocamentos e expectativas frustradas dos alunos.
   */
  public atualizarStatus(statusMonitor: StatusMonitor, mensagemAviso: string): void {
    if (!Object.values(StatusMonitor).includes(statusMonitor)) {
      throw new Error('Status do monitor inválido.');
    }
    const mensagemLimpa = mensagemAviso.trim();
    if (!mensagemLimpa) {
      throw new Error('Informe uma mensagem rápida de aviso para o mural.');
    }

    this._statusMonitor = statusMonitor;
    this._mensagemAviso = mensagemLimpa;
    this._atualizadoEm = new Date();
  }

  /**
   * Atualiza os dados do próximo horário de reforço remoto exibido no card do mural.
   */
  public atualizarReforcoRemoto(dados: ReforcoRemoto): void {
    const disciplina = dados.disciplina.trim();
    const dataHora = dados.dataHora.trim();
    const topico = dados.topico.trim();
    const linkSala = dados.linkSala.trim();

    if (!disciplina || !dataHora || !topico || !linkSala) {
      throw new Error('Todos os campos do reforço remoto (disciplina, data/hora, tópico e link) são obrigatórios.');
    }

    this._reforcoRemoto = { disciplina, dataHora, topico, linkSala };
    this._atualizadoEm = new Date();
  }

  public toJSON(): MuralMonitoriaDTO {
    return {
      statusMonitor: this._statusMonitor,
      mensagemAviso: this._mensagemAviso,
      reforcoRemoto: { ...this._reforcoRemoto },
      atualizadoEm: this._atualizadoEm.toISOString(),
    };
  }

  public static fromJSON(dto: MuralMonitoriaDTO): MuralMonitoria {
    return new MuralMonitoria(dto);
  }
}
