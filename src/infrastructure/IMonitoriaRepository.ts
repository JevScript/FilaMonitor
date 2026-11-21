import { Chamado } from '../domain/entities/Chamado';
import { ItemFaq } from '../domain/entities/ItemFaq';
import { MuralMonitoria } from '../domain/entities/MuralMonitoria';

/**
 * Contrato de persistência da aplicação (Padrão Repository + Dependency Inversion Principle).
 *
 * Decisão técnica:
 * - A camada de domínio e de aplicação dependem exclusivamente desta abstração,
 *   desacoplando a regra de negócio da forma de armazenamento (arquivo JSON hoje,
 *   podendo ser substituído por SQLite/PostgreSQL no futuro sem alterar serviços).
 */
export interface IMonitoriaRepository {
  obterMural(): MuralMonitoria;
  salvarMural(mural: MuralMonitoria): void;

  listarChamados(): Chamado[];
  buscarChamadoPorId(id: string): Chamado | undefined;
  salvarChamado(chamado: Chamado): void;

  listarItensFaq(): ItemFaq[];
  salvarItemFaq(item: ItemFaq): void;

  obterCodigoEstrategiaAtiva(): string;
  salvarCodigoEstrategiaAtiva(codigo: string): void;

  obterTotalResolvidosNaTriagem(): number;
  incrementarResolvidosNaTriagem(): number;
}
