/**
 * Lista enxuta de palavras funcionais (stopwords) em português que não agregam
 * valor semântico na busca por semelhança técnica na base de FAQ.
 */
const STOPWORDS_PT = new Set([
  'para', 'como', 'com', 'sem', 'por', 'que', 'nao', 'uma', 'uns', 'umas',
  'dos', 'das', 'nos', 'nas', 'pelo', 'pela', 'meu', 'minha', 'seu', 'sua',
  'isso', 'isto', 'esse', 'essa', 'esta', 'este', 'aqui', 'quando', 'onde',
  'qual', 'quais', 'mais', 'menos', 'muito', 'sobre', 'entre', 'apos', 'antes',
  'ainda', 'preciso', 'ajuda', 'duvida', 'problema', 'codigo', 'fazer', 'esta',
  'estou', 'tenho', 'pode', 'porque', 'favor', 'alguem', 'sabe', 'usar',
]);

/**
 * Propriedades necessárias para instanciar um ItemFaq.
 */
export interface ItemFaqProps {
  id: string;
  disciplina: string;
  topico: string;
  pergunta: string;
  resposta: string;
  palavrasChave?: string[];
  criadoEm?: Date | string;
  origemChamadoId?: string | null;
}

/**
 * Formato serializável de um ItemFaq para persistência em JSON e resposta HTTP.
 */
export interface ItemFaqDTO {
  id: string;
  disciplina: string;
  topico: string;
  pergunta: string;
  resposta: string;
  palavrasChave: string[];
  criadoEm: string;
  origemChamadoId: string | null;
}

/**
 * Entidade de domínio que representa uma dúvida já resolvida e indexada na Base de FAQ.
 *
 * Responsabilidade:
 * - Encapsular pergunta, resposta, tópico e palavras-chave.
 * - Fornecer algoritmo determinístico de normalização e cálculo de relevância para
 *   a triagem preventiva (Auto-FAQ) antes de abrir um chamado na fila.
 */
export class ItemFaq {
  private readonly _id: string;
  private readonly _disciplina: string;
  private readonly _topico: string;
  private readonly _pergunta: string;
  private readonly _resposta: string;
  private readonly _palavrasChave: string[];
  private readonly _criadoEm: Date;
  private readonly _origemChamadoId: string | null;

  /**
   * Constrói um item da base de FAQ validando os campos essenciais e gerando
   * palavras-chave automaticamente caso não tenham sido fornecidas.
   */
  constructor(props: ItemFaqProps) {
    const disciplina = props.disciplina.trim();
    const topico = props.topico.trim();
    const pergunta = props.pergunta.trim();
    const resposta = props.resposta.trim();

    if (!props.id || !props.id.trim()) {
      throw new Error('O identificador do item de FAQ é obrigatório.');
    }
    if (!disciplina || !topico || !pergunta || !resposta) {
      throw new Error('Disciplina, tópico, pergunta e resposta são obrigatórios no FAQ.');
    }

    this._id = props.id.trim();
    this._disciplina = disciplina;
    this._topico = topico;
    this._pergunta = pergunta;
    this._resposta = resposta;
    this._criadoEm = props.criadoEm ? new Date(props.criadoEm) : new Date();
    this._origemChamadoId = props.origemChamadoId ?? null;

    // Caso palavras-chave explícitas não sejam informadas, extrai automaticamente
    // termos relevantes da pergunta e do tópico para garantir indexação imediata.
    const chavesInformadas = (props.palavrasChave ?? [])
      .map((palavra) => ItemFaq.normalizarTexto(palavra))
      .filter((palavra) => palavra.length >= 3);

    const chavesExtraidas = ItemFaq.extrairPalavrasChave(`${topico} ${pergunta}`);
    this._palavrasChave = Array.from(new Set([...chavesInformadas, ...chavesExtraidas]));
  }

  get id(): string {
    return this._id;
  }

  get disciplina(): string {
    return this._disciplina;
  }

  get topico(): string {
    return this._topico;
  }

  get pergunta(): string {
    return this._pergunta;
  }

  get resposta(): string {
    return this._resposta;
  }

  get palavrasChave(): string[] {
    return [...this._palavrasChave];
  }

  get criadoEm(): Date {
    return new Date(this._criadoEm.getTime());
  }

  get origemChamadoId(): string | null {
    return this._origemChamadoId;
  }

  /**
   * Normaliza um texto removendo acentos, convertendo para minúsculas e eliminando
   * pontuação para permitir comparações consistentes independentemente da grafia do aluno.
   */
  public static normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extrai termos técnicos relevantes a partir de um texto livre.
   *
   * Passo a passo:
   * 1. Normaliza o texto removendo acentuação e símbolos.
   * 2. Divide em tokens e descarta palavras muito curtas (< 3 caracteres) ou stopwords.
   * 3. Retorna lista única de palavras-chave normalizadas.
   */
  public static extrairPalavrasChave(texto: string): string[] {
    const normalizado = ItemFaq.normalizarTexto(texto);
    if (!normalizado) {
      return [];
    }

    const tokens = normalizado
      .split(' ')
      .filter((token) => token.length >= 3 && !STOPWORDS_PT.has(token));

    return Array.from(new Set(tokens));
  }

  /**
   * Calcula a pontuação de relevância deste item de FAQ para uma dúvida informada na triagem.
   *
   * Regra de negócio da Triagem Preventiva (Auto-FAQ):
   * - O item só é considerado candidato se pertencer ao MESMO tópico da dúvida (comparação
   *   normalizada, tolerando acentos e maiúsculas/minúsculas). Isso evita falsos positivos
   *   entre assuntos distintos (ex.: "classe" em SOLID vs Collections).
   * - Além do tópico compatível, exige-se ao menos 1 palavra-chave semelhante presente nas
   *   palavras-chave indexadas, na pergunta ou na resposta do item.
   *
   * @param topicoBusca Tópico selecionado/informado pelo aluno.
   * @param descricaoDuvida Texto livre descrevendo o problema.
   * @returns Pontuação >= 1 quando há correspondência relevante; 0 quando não há match.
   */
  public calcularRelevanciaTriagem(topicoBusca: string, descricaoDuvida: string): number {
    const topicoItemNormalizado = ItemFaq.normalizarTexto(this._topico);
    const topicoBuscaNormalizado = ItemFaq.normalizarTexto(topicoBusca);

    // Garante aderência estrita ao tópico antes de comparar palavras-chave.
    if (!topicoBuscaNormalizado || topicoItemNormalizado !== topicoBuscaNormalizado) {
      return 0;
    }

    const termosDuvida = ItemFaq.extrairPalavrasChave(descricaoDuvida);
    if (termosDuvida.length === 0) {
      return 0;
    }

    const textoIndexadoItem = ItemFaq.normalizarTexto(`${this._pergunta} ${this._resposta}`);
    let pontuacao = 0;

    for (const termo of termosDuvida) {
      // Peso maior quando o termo coincide exatamente com uma palavra-chave cadastrada.
      const bateNaChave = this._palavrasChave.some(
        (chave) => chave === termo || chave.includes(termo) || termo.includes(chave),
      );
      if (bateNaChave) {
        pontuacao += 2;
        continue;
      }

      // Peso secundário se o termo aparecer no texto completo da pergunta/resposta.
      if (textoIndexadoItem.includes(termo)) {
        pontuacao += 1;
      }
    }

    return pontuacao;
  }

  /**
   * Verifica se o item corresponde a uma busca livre na aba de consulta da Base de FAQ.
   */
  public correspondeABusca(termo?: string, topico?: string): boolean {
    if (topico && topico.trim()) {
      const topicoItem = ItemFaq.normalizarTexto(this._topico);
      const topicoFiltro = ItemFaq.normalizarTexto(topico);
      if (topicoItem !== topicoFiltro) {
        return false;
      }
    }

    if (!termo || !termo.trim()) {
      return true;
    }

    const termoNormalizado = ItemFaq.normalizarTexto(termo);
    const conteudoCompleto = ItemFaq.normalizarTexto(
      `${this._disciplina} ${this._topico} ${this._pergunta} ${this._resposta} ${this._palavrasChave.join(' ')}`,
    );

    return conteudoCompleto.includes(termoNormalizado);
  }

  public toJSON(): ItemFaqDTO {
    return {
      id: this._id,
      disciplina: this._disciplina,
      topico: this._topico,
      pergunta: this._pergunta,
      resposta: this._resposta,
      palavrasChave: [...this._palavrasChave],
      criadoEm: this._criadoEm.toISOString(),
      origemChamadoId: this._origemChamadoId,
    };
  }

  public static fromJSON(dto: ItemFaqDTO): ItemFaq {
    return new ItemFaq(dto);
  }
}
