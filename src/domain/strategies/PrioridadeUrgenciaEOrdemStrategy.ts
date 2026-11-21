import { Chamado } from '../entities/Chamado';
import { NivelUrgencia } from '../enums';
import { EstrategiaPriorizacao } from './EstrategiaPriorizacao';

/**
 * Estratégia concreta que prioriza alunos bloqueados em entregas/avaliações
 * (`BLOQUEADO_ENTREGA`), utilizando a ordem de chegada como critério de desempate.
 *
 * Regra de negócio:
 * - Alunos com entrega travada precisam de desbloqueio rápido para não perderem prazos
 *   práticos no laboratório.
 * - Entre chamados do mesmo nível de urgência, mantém-se a justiça cronológica (FIFO).
 */
export class PrioridadeUrgenciaEOrdemStrategy implements EstrategiaPriorizacao {
  public readonly codigo = 'PRIORIDADE_URGENCIA';
  public readonly nome = 'Prioridade por Urgência + Ordem de Chegada';
  public readonly descricao =
    'Coloca chamados BLOQUEADO_ENTREGA no topo da fila e desempata por ordem de chegada.';

  /**
   * Ordena uma cópia dos chamados colocando BLOQUEADO_ENTREGA antes de NORMAL
   * e desempatando pelo timestamp `criadoEm` crescente.
   */
  public ordenar(chamados: Chamado[]): Chamado[] {
    return [...chamados].sort((a, b) => {
      const pesoA = a.urgencia === NivelUrgencia.BLOQUEADO_ENTREGA ? 0 : 1;
      const pesoB = b.urgencia === NivelUrgencia.BLOQUEADO_ENTREGA ? 0 : 1;

      if (pesoA !== pesoB) {
        return pesoA - pesoB;
      }

      const diferencaTempo = a.criadoEm.getTime() - b.criadoEm.getTime();
      if (diferencaTempo !== 0) {
        return diferencaTempo;
      }

      return a.id.localeCompare(b.id);
    });
  }
}
