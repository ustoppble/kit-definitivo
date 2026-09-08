# Entrega — variante C do Kit

Execução de `prompt.md` em 8 de setembro de 2026. Registro principal: **K51E-7**, missão “Kit Email Marketing — variante C para Instagram frio”. Validação final cabe ao humano.

## 1. Caminho da página

Arquivo: [c/index.html](../../c/index.html). Rota da variante: `/c/`, sob o prefixo público já utilizado pelo funil. A implementação não substitui a home, A ou B.

Os recursos usam caminhos absolutos sob o prefixo do funil porque a reescrita atual do Worker trata recursos relativos de forma diferente em subpastas. Não abrir por `file://` como teste de produção: usar a suíte isolada ou a infraestrutura de preview já adotada pelo projeto.

## 2–8. Estratégia escolhida

| Decisão | Escolha |
|---|---|
| Avatar primário | Produtor de cursos, eventos ou mentorias que já captura contatos ou tem compradores, mas não tem uma próxima mensagem definida. |
| Refinamento do candidato | Gestor/agência não é o centro da copy: a licença atual é de uso no próprio negócio, não foi comprovada permissão de distribuição para clientes. |
| Consciência | Consciente do problema: reconhece a lista parada e a dificuldade de escrever; chega frio, sem conhecer o Kit. |
| Dor dominante | Captar o contato e interromper a conversa por não saber o que enviar depois. |
| Desejo dominante | Ter um próximo email e um próximo passo claros, sem começar cada texto do zero. |
| Mecanismo único | Selecionar uma sequência pelo momento do contato, adaptar ao contexto real e enviar na própria ferramenta. |
| Big idea | “Você já pagou pelo lead. Agora veja o que enviar depois.” |
| Ângulo dominante | A — Base parada. A clareza do “próximo email” explica o mecanismo, sem criar um segundo hero. |
| Natureza da escolha | Hipótese editorial fundamentada nas fontes; não é um vencedor estatístico de campanha. |
| Oferta | Produto digital de R$ 17 à vista: 7 sequências, 2 bônus, acesso após confirmação e garantia de 7 dias. |

### As 12 etapas, na ordem solicitada

1. **Avatar extraction:** documentos concentrados em eventos, cursos e mentorias; visitante já possui ou está formando uma base consentida.
2. **Offer extraction:** PDF de acesso, modelos em Google Docs e dois bônus. Nada de serviço, software ou consultoria presumidos.
3. **Awareness mapping:** reconhecer o problema já vivido; explicar o produto em linguagem concreta, sem aula extensa sobre funis.
4. **Dominant desire:** saber a próxima mensagem e sair da página em branco.
5. **Mechanism building:** situação → sequência → adaptação → uso na ferramenta do comprador.
6. **Angle multiplication:** três rotas completas abaixo; uma escolhida para a página.
7. **Scroll-stopping creative:** Kit aberto desde a primeira dobra, identidade azul e mensagem coerente com o anúncio.
8. **Conversion path:** Instagram → landing C → mesmo checkout. Sem captura intermediária.
9. **Objection crushing:** amostra, adequação do negócio, lista, automação, acesso, licença, opcionais e garantia no FAQ.
10. **Generic-language removal:** retirados “método secreto”, resultados grandiosos e universalizações; mantidos verbos de ação e exemplos de uso.
11. **Claim audit:** fonte e decisão para cada quantidade, valor, bônus, prova ou benefício no ledger.
12. **Final consistency audit:** CTA/preço/cupom/eventos, copy dos blocos, limites da oferta e preservação dos arquivos antigos conferidos na suíte e revisão.

As skills de advertising e Higgsfield não existiam dentro deste repositório. Seus arquivos relevantes foram lidos na origem fornecida; os checklists foram aplicados sem instalar um framework ou adicionar dependências ao site. Brainstorming e planejamento orientaram o recorte; os registros de execução são os cards, não um TODO paralelo. O usuário já autorizou decisões reversíveis, portanto não foi introduzida uma rodada de aprovação intermediária.

## Três ângulos completos

### A — Base parada · escolhido

- **Hook do anúncio:** “Você já pagou pelo lead. E o próximo email?”
- **Promessa operacional:** um ponto de partida para continuar a conversa depois do cadastro ou da compra.
- **Headline:** “Você já pagou pelo lead. Agora veja o que enviar depois.”
- **Primeira dobra:** público explícito; dor de lista parada; 7 sequências para adaptar; visual do Kit; CTA de R$ 17; garantia confirmada.
- **Seção que mostra o mecanismo:** trecho real de carrinho + adaptação ilustrativa, seguido de sete situações e três passos.
- **CTA:** “Quero o Kit por R$ 17”.
- **Objeção principal:** “É só um monte de texto genérico?” A amostra responde mostrando a estrutura, e os limites de adaptação ficam claros.
- **Visual recomendado:** Kit aberto e laptop, com identidade do produto; não um gráfico de dinheiro perdido.

### B — Vendas perdidas · hipótese de teste

- **Hook do anúncio:** “A pessoa começou a compra e parou. Qual mensagem você envia depois?”
- **Promessa operacional:** referências para retomar o contato, esclarecer dúvidas e indicar como concluir; sem prometer recuperar receita.
- **Headline correspondente:** “O checkout ficou pelo caminho. A conversa não precisa terminar ali.”
- **Primeira dobra:** situação de carrinho abandonado, amostra curta de follow-up, produto completo de 7 famílias, preço/garantia idênticos.
- **Seção que mostra o mecanismo:** demonstração da mensagem 2 de carrinho, com convite à resposta e adaptação para uma oferta concreta.
- **CTA:** “Quero os modelos de follow-up”.
- **Objeção principal:** “Vai parecer insistência?” Mostrar uma pergunta útil e orientar adequação ao contexto e à permissão de contato.
- **Visual recomendado:** amostra textual real ao lado do Kit; nada de carrinho fictício com faturamento, contador de compras ou percentual de recuperação.

### C — Próximo email · hipótese de teste

- **Hook do anúncio:** “Abriu o editor e travou no primeiro parágrafo?”
- **Promessa operacional:** não iniciar todos os textos do zero; escolher uma referência pela situação.
- **Headline correspondente:** “Você não precisa começar o próximo email do zero.”
- **Primeira dobra:** modelo aberto, mecanismo escolher/adaptar/enviar, 7 sequências e os mesmos preço, garantia e CTA direto.
- **Seção que mostra o mecanismo:** alternância “Trecho do Kit / Exemplo de adaptação”, com as trocas de contexto destacadas.
- **CTA:** “Quero adaptar os modelos”.
- **Objeção principal:** “O texto vai soar como outra pessoa?” Explicar revisão de tom, produto, links e condições, sem prometer autoria automática.
- **Visual recomendado:** close de edição, com tela baseada em amostra fornecida, sem inventar interface de plataforma.

## 9. Arquitetura implementada

| Bloco | Função |
|---|---|
| Hero + produto acima da dobra | Identificar público, problema, entrega, preço e próximo passo. |
| Problema | Mostrar que a conversa pode parar depois da captação. |
| Demonstração interativa | Trecho real verificável; adaptação claramente ilustrativa. Não é editor funcional nem campanha instalada. |
| Sete famílias | Ajudar a escolher pela situação; não por contagens divergentes. |
| Três passos | Escolher, adaptar, revisar/enviar na ferramenta existente. |
| Dois bônus | Construção de lista e cuidado da base, sem promessas técnicas garantidas. |
| Autoria contextual | Foto real e contexto dos documentos; não um depoimento ou prova de faturamento. |
| FAQ | Responder às dúvidas específicas, inclusive lista, automação e licença. |
| Oferta + garantia | Recapitular os entregáveis e a condição confirmada. |
| CTA final | Retomar a pergunta sobre a próxima conversa. |
| CTA móvel condicional | Aparecer depois do hero e desaparecer junto à oferta/CTA final; não adicionar outra oferta. |
| Rodapé mínimo | Termos e privacidade existentes. Sem navegação institucional. |

## 10–12. Ledger, claims usados e omitidos

[CLAIM-LEDGER.md](CLAIM-LEDGER.md) contém a matriz fato → fonte → copy permitida → risco → decisão, o inventário e a tabela de contagens.

**Usados:** sete famílias (PDF + sete Docs); dois bônus (PDF p.11 + vídeos correspondentes); PDF/Google Docs (produto real); preço à vista e garantia (checkout atual); benefício de adaptação (estrutura dos documentos); autoria e foto reais (produto/repositório).

**Omitidos:** 51/52 mensagens; multiplicadores/percentuais; resultados financeiros; prova sem contexto; urgência; escassez; dois assuntos por mensagem; licença para clientes; consultoria não confirmada; extras do checkout como se fossem parte do Kit. Motivos e fontes estão no ledger.

## 13. Arquivos criados

- `c/index.html` — conteúdo e estrutura semântica.
- `c/style.css` — layout mobile/desktop, foco, ampliação de texto e CTA fixo.
- `c/app.js` — contrato existente de compra/eventos, demonstração e visibilidade do CTA móvel.
- `c/assets/hero.webp`, `hero-small.webp` — hero ilustrativo otimizado.
- `c/assets/bonus-lista.webp`, `bonus-maestria.webp`, `autor.webp` — derivados de assets reais, originais preservados.
- `tests/variant-c.mjs` — navegador isolado, verificações e geração das evidências.
- `docs/c/ENTREGA.md`, `CLAIM-LEDGER.md`, `PROMPTS-IMAGENS.md` — decisões, fontes e prompts.
- `docs/c/qa/` — resultados por teste e capturas mobile/desktop/amostras.

Nenhuma dependência de runtime adicionada. Não foram editados `index.html`, `a/`, `b/`, os documentos legais, o Worker ou assets originais. Alterações locais preexistentes, inclusive arquivos operacionais e o próprio `prompt.md`, não foram incorporadas ao commit da variante.

## 14. Prompts completos

[PROMPTS-IMAGENS.md](PROMPTS-IMAGENS.md): hero, pessoa adaptando, flat lay de sete famílias, dois bônus e Instagram nos dois formatos solicitados. Informa referências, alt, localização, MCSLA/Format A, restrições e a diferença entre briefing editorial e parâmetros reais de ferramenta.

## 15–16. Testes e resultados

**96 verificações passaram** na execução final. Resultado detalhado e datado: [qa/results.json](qa/results.json). Evidências: [hero mobile](qa/hero-390.png), [hero desktop](qa/hero-1440.png), [página mobile](qa/page-390.png), [página desktop](qa/page-1440.png), [trecho original](qa/sample-original.png) e [adaptação](qa/sample-adapted.png).

A suíte verifica comportamento no Chromium, com **todas as requisições interceptadas**. Não dispara pixels reais, cria leads ou compra o produto.

```sh
node tests/variant-c.mjs
```

Requer Playwright e Chromium já disponíveis no ambiente de QA. Se o módulo não está no projeto, `K51E_PLAYWRIGHT` pode indicar o caminho absoluto do módulo instalado. A execução desta entrega reutilizou a instalação disponível; não adicionou pacote ao site.

O snapshot inicial `qa/baseline-sha256.json` contém hashes de 41 arquivos rastreados, excluindo o banco operacional local; a checagem compara bytes, não apenas a aparência da home. Esse snapshot é usado por padrão. `K51E_BASELINE` permite indicar outro snapshot deliberadamente, sem alterar a evidência original.

| Área | Verificação |
|---|---|
| Layout | 320, 390, 768 e 1440 px; sem overflow; headline única; hero e CTA na primeira dobra em 390/1440. |
| Navegação | CTA por clique e teclado; destino/cupom idênticos a B; todos os links legais e âncora resolvidos. |
| Mensuração | Loader/noscript GTM idênticos; ViewContent único; InitiateCheckout correto por clique, variante C, método direto, valor 17 e BRL. |
| Não conversão | Abrir a página ou alternar a amostra não emite início de checkout; nenhum formulário ou lead. |
| Interação | Alternância reversível da demonstração; FAQ; CTA móvel após hero. |
| Acessibilidade | Alt em todas as imagens; foco de teclado; texto a 200% sem overflow; contraste calculado dos textos visíveis. |
| Imagens | Carregamento/decodificação do hero e lazy assets; dimensões explícitas; fontes locais sem erro. |
| Claims | Varredura de contagens/claims bloqueados e leitura editorial de todos os textos. |
| Sem JavaScript | Links de compra continuam com destino real no HTML. |
| Integridade | Hashes preexistentes idênticos, diff sem erro de whitespace, status revisto e staging restrito à entrega. |

**Ciclo de falhas:** primeiro teste falhou porque a página ainda não existia; implementação posterior o fez passar. A revisão visual encontrou seletor aplicado a spans internos dos benefícios (K51E-7.3): regressão reproduzida antes do ajuste e verde depois. A extensão do teste de links encontrou nomes de arquivos legais incorretos (K51E-7.5): destino corrigido, sem alterar os documentos legais. O teste de foco foi ajustado para usar Tab/Shift+Tab reais, porque foco programático após clique não aciona a modalidade de teclado do navegador.

A verificação em ambiente isolado não é teste de conversão em produção. Não foram atribuídos Lighthouse score, taxa de conversão, LCP de rede móvel real ou resultados comerciais que não foram medidos.

**Revisão independente (K51E-7.4):** nenhum achado Critical ou Important. Um detalhe de exposição do preço à árvore de acessibilidade foi confirmado (a árvore inicial mostrava apenas um parágrafo sem texto) e tratado em K51E-7.6. O outro achado, deduplicação por pathname literal e ausência de rótulo C no Worker, foi documentado sem alterar tracking compartilhado. O parecer técnico não substitui validação humana.

**Peso medido:** hero mobile de 18.050 bytes; desktop de 39.770 bytes. HTML + CSS + JavaScript + hero mobile somam aproximadamente 56,6 KB antes de compressão, sem incluir favicon, GTM externo ou imagens abaixo da dobra. Fontes são do sistema; os bônus e a foto usam lazy loading. O menor contraste de texto observado foi 5,87:1.

## 17. Riscos

1. **Catálogo inconsistente:** Docs, PDF, páginas e checkout divergem nas quantidades. A landing evita o número, mas o comprador ainda pode encontrá-lo no checkout/produto.
2. **Condição temporal:** R$ 17 depende do cupom existente; preço e garantia precisam ser reconfirmados antes de investir em tráfego.
3. **Atribuição:** o comportamento de query strings/eventos foi preservado, não redesenhado. `/c` e `/c/` podem dividir a deduplicação first-party; o Worker não ganhou rótulo C. Usar `/c/` de forma consistente nas campanhas. Recepção no GTM/Meta e venda aprovada não foram testadas em produção.
4. **Mockup:** é representação ilustrativa, não screenshot real ou objeto físico incluso. A amostra HTML é a evidência do conteúdo.
5. **Material antigo:** datas, condições, links e resultados dentro dos modelos exigem revisão antes de uso. A página explica a necessidade de adaptação.
6. **Ferramentas externas:** Docs, checkout e plataforma de email não são controlados pela nova página.
7. **Eficácia não medida:** o trabalho constrói e verifica a variante; “alta conversão” é objetivo, não resultado já comprovado.

## 18. Pendências e limites de publicação

- Revisão humana da entrega e decisão de publicar no funil existente. Não alterar o container nem criar outra origem para contornar essa decisão.
- Conferir a versão publicada em navegador móvel real e no navegador interno do Instagram.
- Confirmar chegada de eventos no container existente e atribuição até compra aprovada, sem efetuar uma compra fictícia.
- Alinhar as contagens do produto/checkout em atividade separada, se o responsável quiser corrigir o catálogo.
- Demais quatro conceitos de imagem e duas composições de anúncio são prompts prontos, não assets gerados nem campanhas lançadas.
- A VSL local foi inventariada e inspecionada visualmente por quadros; não foi transcrita. Ela exibe outra oferta/preço e não foi incorporada. Os três vídeos exigidos como fontes foram lidos integralmente via transcrição.

A publicação pública não foi feita automaticamente. A orientação de hosting foi aplicada sem migrar a origem: criar outro site alteraria contexto de rota e mensuração, e o escopo exige preservar o funil. Não há promessa de que `/c/` já esteja disponível publicamente.

## 19. Próximos três testes A/B

| Teste | Controle / variação | Hipótese | Manter igual |
|---|---|---|---|
| 1. Ângulo | A “base parada” vs C “próximo email”, com anúncio e primeira dobra correspondentes | Uma dor de escrita mais imediata pode produzir melhor continuidade para certos públicos. | Produto, preço, garantia, imagens, restante da página e regras de distribuição. |
| 2. Visual inicial | Mockup atual vs amostra real em composição HTML no hero | Conteúdo verificável pode tornar mais clara a entrega para quem desconfia de mockups. | Headline, descrição, preço, CTA e oferta. |
| 3. Texto do CTA | “Quero o Kit por R$ 17” vs “Quero adaptar os modelos” | A intenção de uso pode reduzir hesitação, mantendo preço explícito ao lado. | Layout, destino, cupom, evento, copy e posição do preço. |

Medida principal: compras aprovadas por visita elegível. Diagnósticos: cliques no CTA por visita e compras por início de checkout. Não escolher vencedor só por CTR. Definir alocação, janela e critério de decisão antes de iniciar; nenhum experimento foi iniciado por esta execução.
