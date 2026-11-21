import express, { Express, NextFunction, Request, Response } from 'express';
import path from 'node:path';
import { MonitoriaService, RecursoNaoEncontradoError } from './application/MonitoriaService';
import { NivelUrgencia, StatusMonitor } from './domain/enums';
import { JsonMonitoriaRepository } from './infrastructure/JsonMonitoriaRepository';

/**
 * Cria e configura a instância do servidor Express com rotas da API REST e
 * arquivos estáticos do frontend puro (`src/public`).
 *
 * Decisão técnica:
 * - Manter backend e frontend servidos no mesmo processo Express na porta 3000
 *   elimina problemas de CORS, build steps no cliente e complexidade operacional.
 */
export function criarApp(serviceCustomizado?: MonitoriaService): Express {
  const app = express();
  const repository = new JsonMonitoriaRepository();
  const service = serviceCustomizado ?? new MonitoriaService(repository);

  app.use(express.json());

  // Serve o frontend HTML5/CSS3/JS puro diretamente da pasta src/public.
  const pastaPublic = path.join(process.cwd(), 'src', 'public');
  app.use(express.static(pastaPublic));

  /**
   * Retorna todo o estado consolidado do painel (mural, estratégia ativa, fila ordenada,
   * chamados em atendimento, histórico recente, FAQ e métricas).
   */
  app.get('/api/painel', (_req: Request, res: Response) => {
    res.json(service.obterPainelCompleto());
  });

  /**
   * Atualiza status e mensagem rápida do monitor no mural.
   */
  app.put('/api/mural/status', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { statusMonitor, mensagemAviso } = req.body as {
        statusMonitor: StatusMonitor;
        mensagemAviso: string;
      };
      const mural = service.atualizarStatusMonitor(statusMonitor, mensagemAviso ?? '');
      res.json(mural.toJSON());
    } catch (erro) {
      next(erro);
    }
  });

  /**
   * Atualiza o card da próxima aula de reforço remoto no mural.
   */
  app.put('/api/mural/reforco', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { disciplina, dataHora, topico, linkSala } = req.body as {
        disciplina: string;
        dataHora: string;
        topico: string;
        linkSala: string;
      };
      const mural = service.atualizarReforcoRemoto({
        disciplina: disciplina ?? '',
        dataHora: dataHora ?? '',
        topico: topico ?? '',
        linkSala: linkSala ?? '',
      });
      res.json(mural.toJSON());
    } catch (erro) {
      next(erro);
    }
  });

  /**
   * Alterna em tempo real a estratégia de ordenação da fila (Padrão Strategy).
   */
  app.put('/api/estrategia', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { codigo } = req.body as { codigo: string };
      if (!codigo) {
        res.status(400).json({ erro: 'Informe o código da estratégia desejada.' });
        return;
      }
      const estrategia = service.alternarEstrategia(codigo);
      res.json({
        estrategiaAtiva: {
          codigo: estrategia.codigo,
          nome: estrategia.nome,
          descricao: estrategia.descricao,
        },
        painel: service.obterPainelCompleto(),
      });
    } catch (erro) {
      next(erro);
    }
  });

  /**
   * Executa a triagem preventiva (Auto-FAQ) para um tópico e descrição informados.
   */
  app.post('/api/triagem', (req: Request, res: Response) => {
    const { topico, descricao } = req.body as { topico?: string; descricao?: string };
    const sugestoes = service
      .verificarTriagemAutoFaq(topico ?? '', descricao ?? '')
      .map((item) => item.toJSON());

    res.json({
      encontrouSugestoes: sugestoes.length > 0,
      sugestoes,
    });
  });

  /**
   * Registra que o aluno resolveu a dúvida pela sugestão de Auto-FAQ sem entrar na fila.
   */
  app.post('/api/triagem/resolvido', (_req: Request, res: Response) => {
    const totalResolvidosNaTriagem = service.registrarDesvioTriagem();
    res.json({ totalResolvidosNaTriagem });
  });

  /**
   * Abre um chamado na fila (ou retorna sugestões de FAQ caso `forcarAbertura` seja falso
   * e existam respostas semelhantes na base).
   */
  app.post('/api/chamados', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nomeAluno, disciplina, topico, urgencia, descricao, forcarAbertura } =
        req.body as {
          nomeAluno?: string;
          disciplina?: string;
          topico?: string;
          urgencia?: NivelUrgencia;
          descricao?: string;
          forcarAbertura?: boolean;
        };

      const resultado = service.abrirChamado({
        nomeAluno: nomeAluno ?? '',
        disciplina: disciplina ?? '',
        topico: topico ?? '',
        urgencia: urgencia ?? NivelUrgencia.NORMAL,
        descricao: descricao ?? '',
        forcarAbertura: Boolean(forcarAbertura),
      });

      if (resultado.tipo === 'SUGESTAO_FAQ') {
        res.status(200).json(resultado);
        return;
      }

      res.status(201).json(resultado);
    } catch (erro) {
      next(erro);
    }
  });

  /**
   * Inicia o atendimento de um chamado aguardando na fila (`AGUARDANDO` -> `EM_ATENDIMENTO`).
   */
  app.patch('/api/chamados/:id/iniciar', (req: Request, res: Response, next: NextFunction) => {
    try {
      const chamado = service.iniciarAtendimento(String(req.params.id));
      res.json(chamado.toJSON());
    } catch (erro) {
      next(erro);
    }
  });

  /**
   * Conclui o atendimento (`EM_ATENDIMENTO` -> `RESOLVIDO`) e dispara o AutoFaqObserver
   * quando o checkbox de publicação na base de FAQ estiver marcado.
   */
  app.patch('/api/chamados/:id/concluir', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { respostaMonitor, publicarNoFaq } = req.body as {
        respostaMonitor?: string;
        publicarNoFaq?: boolean;
      };
      const chamado = service.concluirAtendimento(
        String(req.params.id),
        respostaMonitor ?? '',
        Boolean(publicarNoFaq),
      );
      res.json(chamado.toJSON());
    } catch (erro) {
      next(erro);
    }
  });

  /**
   * Consulta itens da Base de FAQ com filtros opcionais por termo e tópico.
   */
  app.get('/api/faq', (req: Request, res: Response) => {
    const termo = typeof req.query.termo === 'string' ? req.query.termo : undefined;
    const topico = typeof req.query.topico === 'string' ? req.query.topico : undefined;
    const itens = service.buscarFaq(termo, topico).map((item) => item.toJSON());
    res.json({ itens });
  });

  // Middleware global de tratamento de erros para padronizar respostas JSON da API.
  app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (erro instanceof RecursoNaoEncontradoError) {
      res.status(404).json({ erro: erro.message });
      return;
    }

    if (erro instanceof Error) {
      res.status(400).json({ erro: erro.message });
      return;
    }

    res.status(500).json({ erro: 'Erro interno inesperado no servidor.' });
  });

  return app;
}

if (require.main === module) {
  const porta = Number(process.env.PORT) || 3000;
  const app = criarApp();
  app.listen(porta, () => {
    console.log(`FilaMonitor BES em execução em http://localhost:${porta}`);
  });
}
