-- =====================================================================
-- 1) Tabelas do painel
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create type public.tipo_post as enum ('imagem', 'carrossel', 'video');

create type public.status_post as enum (
  'rascunho', 'agendado', 'enviando', 'concluido', 'concluido_com_erros'
);

create type public.rede_social as enum (
  'instagram', 'facebook', 'linkedin', 'youtube', 'google_business', 'reddit', 'tiktok'
);

create type public.status_destino as enum (
  'pendente', 'enviando', 'publicado', 'erro', 'manual'
);

-- Atualiza a coluna atualizado_em em qualquer UPDATE.
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Configuração: o único e-mail que pode usar o painel.
-- Preenchida automaticamente no primeiro login (a partir de EMAIL_PERMITIDO).
-- ---------------------------------------------------------------------
create table public.config_painel (
  id boolean primary key default true check (id),
  email_dona text not null
);

-- ---------------------------------------------------------------------
-- Configuração de conteúdo (uma linha só): o JSON com rodapés por rede,
-- textos fixos, variáveis e checagem de termos. Editável em Ajustes.
-- ---------------------------------------------------------------------
create table public.config_conteudo (
  id boolean primary key default true check (id),
  dados jsonb not null,
  atualizado_em timestamptz not null default now()
);

create trigger config_conteudo_atualizado_em
  before update on public.config_conteudo
  for each row execute function public.tocar_atualizado_em();

insert into public.config_conteudo (id, dados) values (true, $cfg${
  "versao": "2026-10-15",
  "variaveis": {
    "palavra_chave": "O problema nas palavras do público. Ex.: Conta banida no Free Fire",
    "fonte_legal": "Lei com artigo e, se houver, decisão. Ex.: CDC, art. 6º, III; STJ, REsp 2.123.587",
    "link_artigo": "URL completa do artigo do site",
    "hashtag_tema": "Problema em hashtag, sem acento e sem espaço. Ex.: contabanida",
    "hashtag_jogo": "Jogo ou plataforma; se não houver, usar 'games'. Ex.: freefire",
    "capitulos": "Só YouTube longo. Capítulos com minutagem; se vazio, remover o bloco 'Capítulos:'"
  },
  "fixos": {
    "identidade_longa": "Amanda Modus é advogada (OAB/PR 119.898) e atua na defesa de jogadores contra empresas de games: banimento de contas, contas hackeadas, compras e itens virtuais, e contratos de eSports.",
    "identidade_curta": "Amanda Modus · Advogada · OAB/PR 119.898",
    "aviso": "Conteúdo informativo. Não substitui a análise individual de um advogado."
  },
  "redes": {
    "instagram": {
      "limite_caracteres": 2200,
      "max_hashtags": 5,
      "rodape": "—\n📌 {palavra_chave}: o guia completo, com a lei e as decisões, está no link da bio.\nBase legal: {fonte_legal}\n\n💾 Salve para consultar depois e envie para quem joga com você.\n\nAmanda Modus · Advogada · OAB/PR 119.898\nDefesa de jogadores contra empresas de games · Atendimento em todo o Brasil\nmodusadvocacia.com.br\n\nConteúdo informativo. Não substitui a análise individual de um advogado.\n\n#{hashtag_tema} #{hashtag_jogo} #direitogamer #direitodigital #amandamodus",
      "texto_alternativo": "{descricao_imagem}. Post de Amanda Modus, advogada, sobre {palavra_chave}."
    },
    "tiktok": {
      "limite_caracteres": 4000,
      "max_hashtags": 4,
      "rodape": "{palavra_chave}: guia completo, com a lei e as decisões, em modusadvocacia.com.br (link no perfil).\nBase legal: {fonte_legal}\nSalve e mande para quem joga com você.\nAmanda Modus · Advogada · OAB/PR 119.898 · Conteúdo informativo\n#{hashtag_tema} #{hashtag_jogo} #direitogamer #amandamodus"
    },
    "youtube_longo": {
      "limite_caracteres": 5000,
      "max_hashtags": 3,
      "rodape": "📄 Guia completo, com a lei e as decisões citadas: {link_artigo}\n\nBase legal citada no vídeo:\n{fonte_legal}\n\nCapítulos:\n{capitulos}\n\nSobre a autora\nAmanda Modus é advogada (OAB/PR 119.898) e atua na defesa de jogadores contra empresas de games: banimento de contas, contas hackeadas, compras e itens virtuais, e contratos de eSports. Atendimento em todo o Brasil.\nSite: https://modusadvocacia.com.br\nInstagram: https://www.instagram.com/modus.advogada\nLinkedIn: https://www.linkedin.com/in/amandamodus/\n\nInscreva-se para receber os próximos vídeos.\nConteúdo informativo. Não substitui a análise individual de um advogado.\n\n#{hashtag_tema} #{hashtag_jogo} #direitogamer"
    },
    "youtube_shorts": {
      "limite_caracteres": 5000,
      "max_hashtags": 3,
      "rodape": "Guia completo: {link_artigo}\nBase legal: {fonte_legal}\nAmanda Modus · Advogada · OAB/PR 119.898 · Conteúdo informativo\n#{hashtag_tema} #{hashtag_jogo} #direitogamer"
    },
    "linkedin": {
      "limite_caracteres": 3000,
      "max_hashtags": 3,
      "rodape": "—\nO guia completo, com a lei e as decisões citadas, está aqui: {link_artigo}\nBase legal: {fonte_legal}\n\nAmanda Modus é advogada (OAB/PR 119.898) e atua na defesa de jogadores contra empresas de games: banimento de contas, contas hackeadas, compras e itens virtuais, e contratos de eSports.\n\nConteúdo informativo. Não substitui a análise individual de um advogado.\n\n#DireitoDigital #DireitoDoConsumidor #{hashtag_tema}",
      "variante_link_no_comentario": {
        "trocar_linha": "O guia completo, com a lei e as decisões citadas, está aqui: {link_artigo}",
        "por": "Link do guia completo no primeiro comentário.",
        "comentario": "{link_artigo}"
      }
    },
    "google_perfil_empresa": {
      "limite_caracteres": 1500,
      "max_hashtags": 0,
      "tipo_post": "Novidade",
      "botao": {
        "tipo": "Saiba mais",
        "url": "{link_artigo}"
      },
      "rodape": "{palavra_chave}: o guia completo, com a lei e as decisões citadas, está no site.\nBase legal: {fonte_legal}\nAmanda Modus, advogada (OAB/PR 119.898). Atendimento em todo o Brasil.\nConteúdo informativo. Não substitui a análise individual de um advogado.",
      "proibido_no_texto": [
        "telefone",
        "URL",
        "hashtags"
      ]
    }
  },
  "checagem_termos": {
    "acao_recomendada": "avisar",
    "termos": [
      {
        "padroes": [
          "especialista",
          "especializada",
          "especializado"
        ],
        "motivo": "Especialidade sem título certificado (Prov. 205, art. 3º, III)"
      },
      {
        "padroes": [
          "melhor advogad",
          "a melhor",
          "nº 1",
          "referência"
        ],
        "motivo": "Autoengrandecimento (art. 3º, IV)"
      },
      {
        "padroes": [
          "grátis",
          "gratuita",
          "gratuito",
          "sem custo"
        ],
        "motivo": "Menção a gratuidade (art. 3º, I)"
      },
      {
        "padroes": [
          "R$",
          "honorários",
          "desconto",
          "parcel"
        ],
        "motivo": "Menção a valores (art. 3º, I)"
      },
      {
        "padroes": [
          "ganhei",
          "ganhamos",
          "revertemos",
          "recuperamos",
          "taxa de sucesso",
          "% dos casos"
        ],
        "motivo": "Resultado próprio (art. 4º, §2º, e art. 6º)"
      },
      {
        "padroes": [
          "garantido",
          "garantia",
          "com certeza você"
        ],
        "motivo": "Promessa de resultado (art. 6º)"
      },
      {
        "padroes": [
          "conte seu caso",
          "me chame",
          "entre com ação",
          "processe"
        ],
        "motivo": "Captação ou estímulo ao litígio (art. 2º, VIII)"
      }
    ]
  }
}$cfg$::jsonb);

-- ---------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  titulo_interno text not null default '',
  legenda_base text not null default '',
  tipo public.tipo_post not null default 'imagem',
  media_paths text[] not null default '{}',
  -- Variáveis do post: palavra_chave, fonte_legal, link_artigo,
  -- hashtag_tema, hashtag_jogo, capitulos, descricao_imagem.
  variaveis jsonb not null default '{}',
  agendado_para timestamptz,
  status public.status_post not null default 'rascunho',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint posts_agendado_tem_data check (status = 'rascunho' or agendado_para is not null)
);

create index posts_status_agendado_idx on public.posts (status, agendado_para);
create index posts_agendado_para_idx on public.posts (agendado_para);

create trigger posts_atualizado_em
  before update on public.posts
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------------
-- Destinos (uma linha por rede escolhida no post)
-- ---------------------------------------------------------------------
create table public.post_destinos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  rede public.rede_social not null,
  -- Sobrescreve a legenda_base só nesta rede (null = usa a legenda base).
  legenda_personalizada text,
  -- Rodapé editado à mão só neste post (null = gerado pelo modelo da rede).
  rodape_personalizado text,
  -- Texto final (legenda + rodapé). É o que vai para o Make e o que é
  -- copiado no TikTok. Calculado pelo painel ao salvar.
  legenda_final text not null default '',
  texto_alternativo text,
  -- LinkedIn: texto do primeiro comentário (quando o link vai no comentário).
  comentario text,
  linkedin_link_no_comentario boolean not null default false,
  youtube_formato text not null default 'longo'
    constraint destinos_youtube_formato check (youtube_formato in ('longo', 'shorts')),
  youtube_titulo text,
  reddit_subreddit text,
  reddit_titulo text,
  status public.status_destino not null default 'pendente',
  url_publicada text,
  mensagem_erro text,
  enviado_em timestamptz,
  publicado_em timestamptz,
  atualizado_em timestamptz not null default now(),
  unique (post_id, rede)
);

create index post_destinos_post_idx on public.post_destinos (post_id);
create index post_destinos_rede_status_idx on public.post_destinos (rede, status);

create trigger post_destinos_atualizado_em
  before update on public.post_destinos
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------------
-- Registro dos retornos recebidos do Make (ajuda a testar a integração)
-- ---------------------------------------------------------------------
create table public.retornos_make (
  id bigint generated always as identity primary key,
  recebido_em timestamptz not null default now(),
  destino_id text,
  corpo jsonb not null,
  resultado text not null
);

create index retornos_make_recebido_idx on public.retornos_make (recebido_em desc);
