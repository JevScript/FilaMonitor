import crypto from 'node:crypto';
import { IMonitoriaRepository } from '../../infrastructure/IMonitoriaRepository';
import { Chamado } from '../entities/Chamado';
import { ItemFaq } from '../entities/ItemFaq';
import { StatusChamado } from '../enums';
import { ChamadoObserver } from './ChamadoObserver';

/**
 * Observer concreto responsável pela retroalimentação automática da Base de FAQ.
 *
 * Regra de negócio:
 * - Sempre que um chamado é concluído (`RESOLVIDO`) com a opção `publicarNoFaq` marcada
 *   pelo monitor, a dúvida e sua solução são transformadas automaticamente em um `ItemFaq`
 *   indexado por tópico e palavras-chave.
 * - Dessa forma, os próximos alunos com dúvidas semelhantes passam a ser atendidos já na
 *   triagem preventiva, reduzindo a reincidência na fila sem esforço extra do monitor.
 */
export class AutoFaqObserver implements ChamadoObserver {
  constructor(private readonly repository: IMonitoriaRepository) {}

  /**
   * Captura a conclusão do chamado e, caso elegível, persiste o novo ItemFaq.
   *
   * @param chamado Chamado concluído pelo monitor.
   */
  public aoConcluirChamado(chamado: Chamado): void {
    // Só publica se o chamado estiver efetivamente resolvido e o monitor autorizou a publicação.
    if (chamado.status !== StatusChamado.RESOLVIDO || !chamado.publicarNoFaq) {
      return;
    }

    if (!chamado.respostaMonitor) {
      return;
    }

    // Guarda de idempotência: evita duplicar item de FAQ caso o evento seja disparado
    // mais de uma vez para o mesmo chamado.
    const jaExiste = this.repository
      .listarItensFaq()
      .some((item) => item.origemChamadoId === chamado.id);

    if (jaExiste) {
      return;
    }

    const palavrasChave = ItemFaq.extrairPalavrasChave(
      `${chamado.topico} ${chamado.disciplina} ${chamado.descricao} ${chamado.respostaMonitor}`,
    );

    const novoItemFaq = new ItemFaq({
      id: `faq-${crypto.randomUUID().slice(0, 8)}`,
      disciplina: chamado.disciplina,
      topico: chamado.topico,
      pergunta: chamado.descricao,
      resposta: chamado.respostaMonitor,
      palavrasChave,
      criadoEm: new Date(),
      origemChamadoId: chamado.id,
    });

    this.repository.salvarItemFaq(novoItemFaq);
  }
}
