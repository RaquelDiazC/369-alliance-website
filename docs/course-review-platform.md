# Course Review Platform (`/review`)

Ferramenta privada para revisão do material de cursos antes da publicação.
A administradora sobe os cursos em PDF; colegas convidados leem folha por
folha e deixam comentários que só eles e a administradora enxergam.

- **URL:** `https://<seu-dominio>/review` (não aparece em nenhum menu do site)
- **Backend:** projeto Supabase `369-course-review` (`iknjmeatyxzrwtejbwvm`,
  região Sydney, plano gratuito — $0/mês)
- **Frontend:** `client/src/pages/review/` + `client/src/lib/review/` +
  `client/src/components/review/`
- **Backend versionado:** `supabase/migrations/…course_review_platform.sql`
  (já aplicado) e `supabase/functions/review-admin/index.ts` (já publicado)

## Primeiro acesso da administradora

1. Abra `/review` → "Primeiro acesso da administradora".
2. Informe `raqueldiaz@raqueldiaz.com.br` e crie uma senha (mín. 8 caracteres).
3. Isso só funciona **uma vez** e **só** para o email registrado na tabela
   `review_admins`. Depois, é login normal. A senha pode ser trocada pelo
   ícone de chave no topo.

## Fluxo da administradora

- **Cursos** — criar pastas de curso, renomear (clique no nome), reordenar
  (setas), apagar (com confirmação; apaga PDFs e comentários do curso).
- **Arquivos** — dentro de um curso: subir vários PDFs de uma vez, renomear,
  mudar a ordem, apagar ou **Substituir** (troca o PDF e mantém todos os
  comentários do arquivo).
- **Revisores** — adicionar por email: o sistema cria a conta e gera um
  **código de acesso** (é ele que a pessoa usa como senha). Marque quais
  cursos aquele email pode ver. Dá para editar o acesso, gerar novo código e
  remover a pessoa — **remover nunca apaga os comentários já feitos**.
- **Comentários** — na aba "Comentários" do curso (ou no visualizador), cada
  comentário aparece como `Nome 22.08 at 2:14pm - texto`. Clique no
  comentário → aparece uma linha de resposta → envie o feedback. A pessoa vê
  um alerta com a mensagem na próxima vez que entrar.

## Fluxo do revisor

- Entra com email + código de acesso recebido da administradora.
- Vê apenas os cursos liberados para o email dele.
- Visualizador: slides à esquerda (navegação por folha, setas do teclado),
  comentários da folha atual à direita. Cada comentário fica preso à folha.
- Um revisor **nunca** vê comentários de outros revisores (garantido por
  Row Level Security no banco, não só na interface).
- Ao entrar, um alerta lista as respostas não lidas da administradora, com
  link direto para a folha comentada.

## Proteção do conteúdo

O PDF nunca chega ao navegador como link: os bytes são baixados
autenticados e renderizados em canvas (sem camada de texto). Para
revisores, a plataforma também:

- bloqueia seleção/cópia de texto, clique direito, arrastar imagem;
- bloqueia Ctrl/Cmd+P, S, C, X, U e atalhos de DevTools;
- impressão sai em branco (CSS `@media print` + blackout no `beforeprint`);
- tecla PrintScreen → tela preta com **"Não autorizado screenshot"** e o
  clipboard é sobrescrito;
- quando a janela perde o foco (ferramentas de recorte tipo Win+Shift+S
  roubam o foco), o conteúdo fica preto até a janela voltar;
- cada folha tem marca d'água com o email do revisor e a data.

**Limitação honesta:** nenhuma página web consegue impedir 100% uma captura
feita pelo sistema operacional (ex.: Cmd+Shift+3 no macOS, foto da tela com
o celular). As barreiras acima param os caminhos comuns; a marca d'água
existe para que qualquer imagem vazada identifique a origem.

## Segurança / operação

- Todas as regras de visibilidade são **Row Level Security** no Postgres —
  valem para qualquer cliente, não só para o app.
- O bucket `course-review-pdfs` é privado (PDF ≤ 50 MB, só `application/pdf`).
- Ações privilegiadas (criar/remover contas, códigos) rodam na edge function
  `review-admin` com service role; ela mesma valida que quem chama é a
  administradora.
- Os códigos de acesso ficam visíveis para a administradora na aba
  Revisores (para poder recompartilhar). São senhas de baixo risco,
  restritas a este sistema; troque com "Novo código" quando quiser.
- Para adicionar outra administradora: `insert into review_admins (email)
  values ('email@dominio')` no SQL editor do Supabase.
- As chaves no código (`client/src/lib/review/supabase.ts`) são as chaves
  *publicáveis* do projeto — podem ir ao navegador por design; o que protege
  os dados é o RLS. Podem ser sobrescritas com
  `VITE_REVIEW_SUPABASE_URL` / `VITE_REVIEW_SUPABASE_ANON_KEY`.
