# RNH Engenharia — Gestão de presenças e diárias

Aplicação React estática para GitHub Pages. Login com e-mail/senha no Supabase. As informações são compartilhadas apenas entre usuários autorizados em `rnh_members`.

## Recursos preservados
- Manhã/tarde/falta; um turno = meia diária para diaristas.
- Carteira assinada: presença e espelho sem cálculo financeiro.
- Diária individual, valores históricos nas presenças, descontos e fechamento mensal.
- Calendário mensal alinhado por dia da semana, espelho imprimível e controles para celular.
- Proteção contra salvar sobre uma alteração feita em outro aparelho.

## Configuração pendente
1. Executar `supabase/schema.sql` em um projeto Supabase.
2. Criar os usuários de Martina e Luiz em Authentication > Users. Cada pessoa define sua própria senha; nenhuma senha entra neste repositório.
3. Adicionar os UUIDs dos usuários à tabela `rnh_members`.
4. Preencher `public/config.json` com a URL do projeto e a chave **publicável** (nunca secret/service_role). Repetir em `docs/config.json` se não reconstruir o projeto.
5. GitHub Settings > Pages: Deploy from a branch, main, /docs.
6. Custom domain: `rnh.mamadesign.com.br`. No DNS, CNAME `rnh` para `mama-design.github.io`. Ativar HTTPS quando disponível.
7. Em Supabase Auth URL Configuration: Site URL `https://rnh.mamadesign.com.br` e redirect permitido para esse endereço.
8. Manter cadastros públicos desativados; apenas usuários autorizados acessam os dados.

## Migração de dados
A publicação anterior continua independente e ativa. Não cadastrar dados reais no novo banco antes de importar o backup antigo. A nova interface oferece importação de backup JSON quando a base está vazia. O backup contém dados pessoais e financeiros: não enviar ao GitHub nem armazenar neste repositório.

## Desenvolvimento
`npm install`, `npm run dev`, `npm run build`. A pasta `docs/` contém a compilação para Pages. Para atualizar: compilar e substituir o conteúdo de `docs/` pelo de `dist/`, preservando `.nojekyll` e `CNAME`.

Não há dados de funcionários, senhas ou chaves administrativas neste código. O código é público; dados e autorização ficam no Supabase, protegidos por RLS e verificações nos RPCs.
