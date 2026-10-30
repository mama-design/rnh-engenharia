# RNH Engenharia — Gestão de presenças e diárias

Aplicação React estática para GitHub Pages. Login com e-mail/senha no Supabase. As informações são compartilhadas apenas entre usuários autorizados em `rnh_private.members`.

## Recursos preservados
- Manhã/tarde/falta; um turno = meia diária para diaristas.
- Carteira assinada: presença e espelho sem cálculo financeiro.
- Diária individual, valores históricos nas presenças, descontos e fechamento mensal.
- Calendário mensal alinhado por dia da semana, espelho imprimível e controles para celular.
- Proteção contra salvar sobre uma alteração feita em outro aparelho.

## Estado da implantação
- Banco configurado no projeto Supabase existente, com tabelas exclusivas no schema privado `rnh_private`.
- Frontend usa somente a chave publicável; credenciais administrativas não estão no código.
- Usuários autorizados são definidos em `rnh_private.members`; as funções públicas verificam essa lista.
- Estrutura SQL: `supabase/schema.sql`. Não executar para apagar/recriar o banco existente.
- GitHub Pages publica a pasta `/docs` na branch `main`.
- Domínio configurado no GitHub: `rnh.mamadesign.com.br`. DNS CNAME `rnh` deve apontar para `mama-design.github.io`.
- Acesso de Martina usa o usuário já existente no Supabase Auth.
- Acesso do Luiz depende de receber seu e-mail e autorizar sua conta.
- HTTPS deve ser ativado quando o GitHub concluir a validação do domínio.

## Migração de dados
Os cinco cadastros originais foram migrados em 30/10/2026. Não enviar dados pessoais ao repositório. A publicação anterior permanece independente até a conclusão do domínio. A nova interface oferece importação de backup JSON quando a base está vazia. O backup contém dados pessoais e financeiros: não enviar ao GitHub nem armazenar neste repositório.

## Desenvolvimento
`npm install`, `npm run dev`, `npm run build`. A pasta `docs/` contém a compilação para Pages. Para atualizar: compilar e substituir o conteúdo de `docs/` pelo de `dist/`, preservando `.nojekyll` e `CNAME`.

Não há dados de funcionários, senhas ou chaves administrativas neste código. O código é público; dados e autorização ficam no Supabase, protegidos por RLS e verificações nos RPCs.
