import fs from 'node:fs';
import path from 'node:path';
import { Chamado, ChamadoDTO } from '../domain/entities/Chamado';
import { ItemFaq, ItemFaqDTO } from '../domain/entities/ItemFaq';
import { MuralMonitoria, MuralMonitoriaDTO } from '../domain/entities/MuralMonitoria';
import { StatusMonitor } from '../domain/enums';
import { IMonitoriaRepository } from './IMonitoriaRepository';

/**
 * Estrutura completa persistida no arquivo JSON local (`demo/dados-demo.json`).
 */
export interface DadosMonitoriaJson {
  estrategiaAtiva: string;
  totalResolvidosNaTriagem: number;
  mural: MuralMonitoriaDTO;
  chamados: ChamadoDTO[];
  faq: ItemFaqDTO[];
}

/**
 * Implementação concreta do repositório usando arquivo JSON local.
 *
 * Decisão técnica:
 * - Atende ao escopo do MVP sem depender de banco de dados externo (MySQL/Postgres/Mongo),
 *   mantendo persistência real entre reinicializações do servidor Express.
 * - Recebe o caminho do arquivo por injeção no construtor para facilitar testes isolados
 *   com arquivos temporários sem poluir `demo/dados-demo.json`.
 */
export class JsonMonitoriaRepository implements IMonitoriaRepository {
  private readonly caminhoArquivo: string;

  constructor(caminhoArquivo?: string) {
    this.caminhoArquivo =
      caminhoArquivo ?? path.join(process.cwd(), 'demo', 'dados-demo.json');
    this.garantirArquivoInicial();
  }

  public obterMural(): MuralMonitoria {
    const dados = this.lerDados();
    return MuralMonitoria.fromJSON(dados.mural);
  }

  public salvarMural(mural: MuralMonitoria): void {
    const dados = this.lerDados();
    dados.mural = mural.toJSON();
    this.gravarDados(dados);
  }

  public listarChamados(): Chamado[] {
    const dados = this.lerDados();
    return dados.chamados.map((dto) => Chamado.fromJSON(dto));
  }

  public buscarChamadoPorId(id: string): Chamado | undefined {
    return this.listarChamados().find((chamado) => chamado.id === id);
  }

  public salvarChamado(chamado: Chamado): void {
    const dados = this.lerDados();
    const dto = chamado.toJSON();
    const indice = dados.chamados.findIndex((item) => item.id === dto.id);

    if (indice >= 0) {
      dados.chamados[indice] = dto;
    } else {
      dados.chamados.push(dto);
    }

    this.gravarDados(dados);
  }

  public listarItensFaq(): ItemFaq[] {
    const dados = this.lerDados();
    return dados.faq.map((dto) => ItemFaq.fromJSON(dto));
  }

  public salvarItemFaq(item: ItemFaq): void {
    const dados = this.lerDados();
    const dto = item.toJSON();
    const indice = dados.faq.findIndex((existente) => existente.id === dto.id);

    if (indice >= 0) {
      dados.faq[indice] = dto;
    } else {
      dados.faq.unshift(dto);
    }

    this.gravarDados(dados);
  }

  public obterCodigoEstrategiaAtiva(): string {
    return this.lerDados().estrategiaAtiva;
  }

  public salvarCodigoEstrategiaAtiva(codigo: string): void {
    const dados = this.lerDados();
    dados.estrategiaAtiva = codigo;
    this.gravarDados(dados);
  }

  public obterTotalResolvidosNaTriagem(): number {
    return this.lerDados().totalResolvidosNaTriagem ?? 0;
  }

  public incrementarResolvidosNaTriagem(): number {
    const dados = this.lerDados();
    dados.totalResolvidosNaTriagem = (dados.totalResolvidosNaTriagem ?? 0) + 1;
    this.gravarDados(dados);
    return dados.totalResolvidosNaTriagem;
  }

  /**
   * Garante que o diretório e o arquivo JSON existam antes da primeira leitura.
   * Caso o arquivo ainda não exista (ex.: execução de testes em diretório temporário),
   * cria uma estrutura inicial válida e vazia de chamados.
   */
  private garantirArquivoInicial(): void {
    const diretorio = path.dirname(this.caminhoArquivo);
    if (!fs.existsSync(diretorio)) {
      fs.mkdirSync(diretorio, { recursive: true });
    }

    if (!fs.existsSync(this.caminhoArquivo)) {
      const estadoInicial: DadosMonitoriaJson = {
        estrategiaAtiva: 'PRIORIDADE_URGENCIA',
        totalResolvidosNaTriagem: 0,
        mural: {
          statusMonitor: StatusMonitor.ONLINE,
          mensagemAviso: 'Monitor disponível no Laboratório 04 para dúvidas práticas.',
          reforcoRemoto: {
            disciplina: 'POO Avançada',
            dataHora: 'Hoje, 19:00',
            topico: 'Padrões GoF (Strategy e Observer)',
            linkSala: 'https://meet.ucsal.br/sala-monitoria-bes',
          },
          atualizadoEm: new Date().toISOString(),
        },
        chamados: [],
        faq: [],
      };
      this.gravarDados(estadoInicial);
    }
  }

  private lerDados(): DadosMonitoriaJson {
    const conteudo = fs.readFileSync(this.caminhoArquivo, 'utf-8');
    return JSON.parse(conteudo) as DadosMonitoriaJson;
  }

  private gravarDados(dados: DadosMonitoriaJson): void {
    fs.writeFileSync(this.caminhoArquivo, JSON.stringify(dados, null, 2), 'utf-8');
  }
}
