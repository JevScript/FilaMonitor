import { Chamado } from '../entities/Chamado';
import { EstrategiaPriorizacao } from './EstrategiaPriorizacao';

/**
 * Estratégia concreta de ordenação estrita por ordem de chegada (FIFO - First In, First Out).
 *
 * Regra de negócio:
 * - Trata todos os chamados de forma igualitária pelo horário de entrada na fila,
 *   ignorando o nível de urgência declarado (útil em períodos fora de entrega).
 */
export class FifoSimplesStrategy implements EstrategiaPriorizacao {
  public readonly codigo = 'FIFO_SIMPLES';
  public readonly nome = 'Ordem Estrita de Chegada (FIFO)';
  public readonly descricao =
    'Atende estritamente quem chegou primeiro na fila, sem distinção de urgência.';

  /**
   * Ordena uma cópia dos chamados estritamente pelo horário de criação crescente.
   */
  public ordenar(chamados: Chamado[]): Chamado[] {
    return [...chamados].sort((a, b) => {
      const diferencaTempo = a.criadoEm.getTime() - b.criadoEm.getTime();
      if (diferencaTempo !== 0) {
        return diferencaTempo;
      }

      return a.id.localeCompare(b.id);
    });
  }
}
