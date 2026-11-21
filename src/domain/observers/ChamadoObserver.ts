import { Chamado } from '../entities/Chamado';

/**
 * Interface do Padrão GoF Observer para reagir à conclusão de chamados de monitoria.
 *
 * Permite desacoplar o fluxo principal de atendimento dos efeitos colaterais desejados
 * após a resolução de uma dúvida (como publicação na base de FAQ, métricas ou alertas).
 */
export interface ChamadoObserver {
  /**
   * Executado automaticamente quando um chamado transita para o estado RESOLVIDO.
   *
   * @param chamado Entidade do chamado recém-concluído pelo monitor.
   */
  aoConcluirChamado(chamado: Chamado): void;
}
