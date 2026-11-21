/**
 * Enumerações de domínio do sistema FilaMonitor BES.
 *
 * Centraliza os estados válidos de chamados, níveis de urgência e disponibilidade
 * do monitor para garantir tipagem forte e evitar strings mágicas na camada de domínio.
 */

/**
 * Ciclo de vida de um chamado na fila de monitoria.
 * Regra de negócio: as transições permitidas são estritamente sequenciais:
 * AGUARDANDO -> EM_ATENDIMENTO -> RESOLVIDO.
 */
export enum StatusChamado {
  AGUARDANDO = 'AGUARDANDO',
  EM_ATENDIMENTO = 'EM_ATENDIMENTO',
  RESOLVIDO = 'RESOLVIDO',
}

/**
 * Nível de urgência informado pelo aluno na abertura da dúvida.
 * Regra de negócio: BLOQUEADO_ENTREGA indica que o aluno está travado em entrega
 * iminente/avaliação, podendo receber prioridade conforme a estratégia ativa.
 */
export enum NivelUrgencia {
  NORMAL = 'NORMAL',
  BLOQUEADO_ENTREGA = 'BLOQUEADO_ENTREGA',
}

/**
 * Estado atual de disponibilidade exibido no Mural de Monitoria.
 */
export enum StatusMonitor {
  ONLINE = 'ONLINE',
  AUSENTE = 'AUSENTE',
  PLANTAO_REMOTO = 'PLANTAO_REMOTO',
}
