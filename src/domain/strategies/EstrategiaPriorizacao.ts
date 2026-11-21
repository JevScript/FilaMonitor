import { Chamado } from '../entities/Chamado';

/**
 * Interface do Padrão GoF Strategy para ordenação dinâmica da fila de chamados.
 *
 * Princípio SOLID aplicado:
 * - Open/Closed Principle (OCP): novas políticas de priorização (ex.: por tempo máximo
 *   de espera ou por disciplina específica) podem ser adicionadas criando novas classes
 *   que implementam esta interface, sem alterar o MonitoriaService.
 * - Liskov Substitution Principle (LSP): todas as estratégias são intercambiáveis
 *   em tempo de execução pelo consumidor.
 */
export interface EstrategiaPriorizacao {
  /** Identificador único da estratégia para seleção via API/UI. */
  readonly codigo: string;

  /** Nome amigável exibido no seletor da interface. */
  readonly nome: string;

  /** Resumo explicativo da regra de ordenação aplicada. */
  readonly descricao: string;

  /**
   * Retorna uma nova lista ordenada de chamados sem mutar o array original.
   *
   * @param chamados Lista de chamados aguardando atendimento.
   * @returns Novo array ordenado de acordo com a política da estratégia.
   */
  ordenar(chamados: Chamado[]): Chamado[];
}
