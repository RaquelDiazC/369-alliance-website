# Course Review Platform (`/review`)

Ferramenta privada para revisão do material de cursos antes da publicação.
A administradora sobe os cursos em PDF (slides) e MP4 (vídeo-aulas); colegas
convidados revisam folha por folha — ou minuto a minuto, nos vídeos — e
deixam comentários que só eles e a administradora enxergam.

- **URL:** `https://<seu-dominio>/review` (não aparece em nenhum menu do site)
- **Backend:** projeto Supabase `369-course-review` (`iknjmeatyxzrwtejbwvm`,
  região Sydney, plano gratuito — $0/mês)
- **Frontend:** `client/src/pages/review/` + `client/src/lib/review/` +
  `client/src/components/review/`
- **Backend versionado:** `supabase/migrations/…course_review_platform.sql`
  (já aplicado) e `supabase/functions/review-admin/index.ts` (já publicado)
- **Idioma:** toda a interface é em **inglês** (os revisores são anglófonos);
  esta documentação continua em português para a administradora

## Primeiro acesso da administradora

1. Abra `/review` → "Admin first-time setup".
2. Informe `raqueldiaz@raqueldiaz.com.br` e crie uma senha (mín. 8 caracteres).
3. Isso só funciona **uma vez** e **só** para o email registrado na tabela
   `review_admins`. Depois, é login normal. A senha pode ser trocada pelo
   ícone de chave no topo.

## Fluxo da administradora

- **Courses** — cada curso é uma **pasta**: clicar na pasta abre o conteúdo
  (os PDFs ficam dentro). Renomear é o ícone de lápis; reordenar, as setas;
  apagar pede confirmação (apaga PDFs e comentários do curso). O ícone de
  balão ao lado das setas **fica verde com a contagem** assim que as lessons
  daquela pasta recebem comentários — clicando nele abre direto a aba
  Comments.
- **Arquivos** — dentro de um curso: subir vários arquivos de uma vez
  (**PDF** para slides, **MP4** para as vídeo-aulas), renomear, mudar a
  ordem, apagar ou **Substituir** (troca o arquivo — sempre pelo mesmo tipo —
  e mantém todos os comentários). Vídeos mostram a duração no lugar da
  contagem de páginas. **Limite: 50 MB por arquivo** (teto do plano gratuito
  do Supabase) — para aulas mais longas, exporte o MP4 comprimido em 720p.
- **Reviewers** — adicionar por email: o sistema cria a conta e gera um
  **código de acesso** (é ele que a pessoa usa como senha). Abaixo do botão
  de adicionar fica a lista com cada pessoa e **checkboxes por pasta de
  curso (tick/untick)** — marcar/desmarcar aplica o acesso na hora, sem
  apagar nada. "New code" gera outro código; a lixeira remove a pessoa —
  **remover nunca apaga os comentários já feitos**.
- **Comentários** — na aba "Comentários" do curso (ou no visualizador), cada
  comentário aparece como `Nome 22.08 at 2:14pm - texto`. Clique no
  comentário → aparece uma linha de resposta → envie o feedback. A pessoa vê
  um alerta com a mensagem na próxima vez que entrar. Comentários de vídeo
  trazem o **tempo** (`3:25`) no lugar da página; "Open video" abre o player
  já naquele momento (assim como "Open page" abre a folha exata do PDF).

## Fluxo do revisor

- Entra com email + código de acesso recebido da administradora.
- Vê apenas os cursos liberados para o email dele.
- Visualizador (PDF): slides à esquerda (navegação por folha, setas do
  teclado), comentários da folha atual à direita. Cada comentário fica preso
  à folha.
- Visualizador (vídeo): player à esquerda, comentários do vídeo à direita,
  um abaixo do outro, ordenados pelo tempo. Ao **clicar na caixa de
  comentário** (com o vídeo rodando ou pausado), o **tempo daquele momento é
  capturado automaticamente** e aparece num selo (`at 3:25`); o vídeo pausa
  para a pessoa digitar e ela dá play para continuar. Clicar no selo de um
  comentário leva o vídeo de volta àquele momento.
- Um revisor **nunca** vê comentários de outros revisores (garantido por
  Row Level Security no banco, não só na interface).
- **Trava de 1 computador:** o primeiro computador em que a pessoa entrar
  fica registrado; ao abrir em outro, o sistema mostra "Access locked to
  another computer". A admin desbloqueia em Reviewers → "Unlock computer"
  (o próximo computador usado vira o registrado). A trava é por navegador —
  limpar os dados do navegador ou usar outro navegador na mesma máquina
  também exige desbloqueio. IP puro não é usado como trava (muda com
  frequência e é compartilhado na mesma rede); o último IP visto aparece na
  lista de Reviewers como informação.
- Ao entrar, um alerta lista as respostas não lidas da administradora, com
  link direto para a folha comentada.

## Proteção do conteúdo

Nem o PDF nem o vídeo chegam ao navegador como link: os bytes são baixados
autenticados — o PDF vira canvas (sem camada de texto) e o MP4 toca a partir
da memória (URL de objeto local, sem endereço público). No player de vídeo o
revisor não tem botão de download, tela cheia nem picture-in-picture (a tela
cheia escaparia da marca d'água). Para revisores, a plataforma também:

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
- O bucket `course-review-pdfs` é privado (≤ 50 MB por arquivo; aceita
  `application/pdf` e `video/mp4`). O plano gratuito dá **1 GB de
  armazenamento total** e ~5 GB de tráfego/mês — com muitas vídeo-aulas,
  acompanhe o uso no painel do Supabase (upgrade Pro se precisar de mais).
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
