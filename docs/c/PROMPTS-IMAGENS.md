# Pacote de prompts — Kit Definitivo do Email Marketing

Cinco conceitos modulares; o quinto inclui duas composições, para criativos 4:5 e 9:16. Não são uma imagem única da landing.

## Execução e referências

- Direção extraída das skills raiz, prompt e GPT Image 2 do Higgsfield fornecido pelo usuário: MCSLA para cenas; Format A estruturado para layouts.
- O gerador nativo disponível não expõe um identificador de modelo nem campos de resolução, aspect ratio, seed, negative_prompt ou custo. Não foi alegado uso de GPT Images 2.5.
- Os blocos JSON abaixo são **briefings editoriais**, não um schema de API. Proporções são destinos de layout pedidos pelo usuário; só selecionar uma opção no gerador depois de verificar que a interface realmente a oferece.
- A ferramenta recebeu referência real por arquivo. Uma imagem de hero foi gerada e selecionada; os demais conceitos são prompts entregues, não imagens fingidamente produzidas.
- Arquivos relativos à raiz do repositório. Não enviar material adicional, credenciais ou páginas com dados pessoais ao gerador.
- Se uma interface não conseguir manter fielmente a referência de texto/tela, não preencher com uma interface inventada. Usar o elemento real em uma composição editorial posterior ou rejeitar a imagem.

### Registro do hero selecionado

Resultado nativo observado: PNG de 1811 × 868. Derivados publicados no projeto: `c/assets/hero.webp` (1100 × 527) e `hero-small.webp` (600 × 288). Essas dimensões foram medidas no arquivo, não inventadas como capacidades do modelo.

Referência visual: `assets/hero-mockup.jpg`. Só identidade, paleta e tipologia de produto; os números, selos e resultados antigos foram explicitamente excluídos da direção.

A arte selecionada é ilustrativa. Tem pasta, páginas e laptop, além de objetos de cenário e linhas gráficas na tela. Esses elementos não são arquivos extras, software incluso ou screenshot real de uma plataforma. Aviso visível na página e prova textual separada. O prompt 1 abaixo é a versão editorial consolidada para reproduzir/refinar a direção; não é apresentado como log literal da chamada anterior.

## 1. Hero — Kit aberto, sequência e laptop

**Destino:** figura do hero; composição horizontal sem headline incorporada.
**Referências:** `assets/hero-mockup.jpg` somente para identidade; `docs/c/qa/sample-original.png` para a amostra de texto, quando a tela for legível.
**Alt:** “Representação do Kit digital: pasta azul, modelo de boas-vindas e notebook com um email aberto.”

**Prompt MCSLA:**

> M — Use o gerador de imagem realmente disponível; o identificador não foi exposto nesta execução.
> C — Natureza-morta editorial, câmera fixa em três quartos, altura da mesa, composição horizontal.
> S — Uma pasta azul aberta do Kit, uma página de sequência em primeiro plano e um laptop. Use a referência apenas para identidade. Na pasta, somente “Kit Definitivo do Email Marketing”; na página, somente “Boas-vindas”. Na tela, preserve a amostra real fornecida, sem inventar software.
> L — Papel branco, azul profundo e luz de janela lateral esquerda refletida suavemente na mesa clara; sombras de contato naturais. Produto nítido, sharp focus throughout, deep depth of field.
> A — O Kit está aberto para consulta, com a página próxima ao laptop.
> Restrições — Sem números, métricas, depoimentos, selos, logos, badges, produtos extras, objetos de cenário ou headline. Sem texto ilegível, erros ortográficos, interface inventada, linhas fingindo conteúdo real, estética stock photo ou livro genérico. Não reproduzir claims da referência.

**Copy fora da imagem, em HTML:** headline e descrição atuais do hero, CTA, preço, garantia e aviso “Representação visual. Você recebe arquivos digitais.”

## 2. Close — pessoa adaptando a mensagem

**Destino:** alternativa futura à figura da demonstração, nunca prova de cliente ou depoimento.
**Referências:** `c/assets/hero.webp` para continuidade do Kit; `docs/c/qa/sample-original.png` para a amostra real, sem dados pessoais.
**Alt:** “Cena ilustrativa de uma pessoa consultando o Kit enquanto adapta uma mensagem no notebook.”

**Prompt MCSLA:**

> M — Use o gerador de imagem disponível, sem pressupor um modelo ou controle não confirmado.
> C — Close editorial por cima do ombro, câmera estática; enquadre laptop, mãos e uma página do Kit, sem rosto reconhecível.
> S — Uma pessoa adulta com roupa cotidiana lisa, diante do notebook. Uma mão pousa naturalmente junto ao teclado; a outra aponta a página. A tela reproduz apenas a amostra de texto real fornecida, sem acrescentar barra de ferramentas ou plataforma. O trecho legível pode ser “Não vi seu pedido finalizado.”
> L — Luz de janela à direita, papel branco, azul do Kit, pele natural; subject in sharp focus, background falling into soft bokeh.
> A — A pessoa compara a amostra com sua mensagem, em um único instante de edição.
> Restrições — Anatomically correct, all limbs visible and naturally positioned. Sem dedos extras, mãos deformadas, pose publicitária, marcas, clientes identificáveis, notificações, métricas, produtos extras, tela impossível, texto ilegível ou interface inventada. Não insinuar resultado, autoria da pessoa ou endosso.

**Copy fora da imagem:** “Escolha a situação. Adapte a oferta. Revise antes de enviar.” Na landing, texto em HTML. Acrescentar “Cena ilustrativa”, sem atribuir a pessoa a um comprador.

## 3. Flat lay — sete famílias

**Destino:** alternativa visual modular da seção “7 sequências”; a lista e suas descrições continuam em HTML.
**Referência:** `assets/hero-mockup.jpg` só para azul e materiais. Não importar as capas com multiplicadores.
**Alt:** “Sete cartões editoriais, um para cada família de sequência do Kit.”

**Prompt Format A:**

```json
{
  "tipo": "flat lay editorial de produto digital",
  "objetivo": "representar as sete famílias sem inventar quantidade de mensagens",
  "referencias": [
    {
      "arquivo": "assets/hero-mockup.jpg",
      "preservar": "paleta azul e branco, sensação de papel",
      "ignorar": "contagens, selos, percentuais, métricas e provas"
    }
  ],
  "layout": {
    "camera": "vista superior perpendicular, sem perspectiva que esconda rótulos",
    "fundo": "mesa clara neutra",
    "estrutura": "exatamente sete cartões: quatro na fileira superior e três centralizados abaixo",
    "separacao": "espaço regular e suficiente entre os cartões",
    "conteudo_extra": "nenhum"
  },
  "elementos": [
    {"tipo": "cartao", "texto_exato": "Carrinho abandonado"},
    {"tipo": "cartao", "texto_exato": "Boas-vindas"},
    {"tipo": "cartao", "texto_exato": "Leads aquecidos"},
    {"tipo": "cartao", "texto_exato": "High ticket"},
    {"tipo": "cartao", "texto_exato": "Lançamento"},
    {"tipo": "cartao", "texto_exato": "Leads gratuitos"},
    {"tipo": "cartao", "texto_exato": "Upsell"}
  ],
  "estilo": {
    "cores": "azul profundo, branco, cinza neutro",
    "tipografia": "rótulos curtos, legíveis, com acentos corretos",
    "luz": "luz de janela suave à esquerda com sombras físicas delicadas",
    "foco": "sharp focus throughout, deep depth of field"
  },
  "restricoes": [
    "Exatamente sete cartões; não duplicar, omitir ou acrescentar famílias.",
    "Não usar números de emails, métricas, promessas ou resultados.",
    "Não acrescentar ícones de plataformas, logos, selos, presentes ou outros produtos.",
    "Não desenhar parágrafos ilegíveis nem substituir rótulos por texto inventado.",
    "Não reproduzir capas antigas com claims.",
    "Não mostrar interface, mãos ou objetos decorativos.",
    "Evitar estética de banco de imagens e mockup genérico."
  ]
}
```

## 4. Dois bônus — capas reais

**Destino:** bloco dos bônus, se futuramente desejado; a versão atual usa cada capa original separadamente.
**Referências:** `assets/bonus-1-lista-do-zero.png` e `assets/bonus-2-maestria.png`.
**Alt:** “Capas dos dois bônus: Como criar uma lista do zero e Maestria na lista.”

**Prompt Format A:**

```json
{
  "tipo": "composicao editorial de duas capas existentes",
  "objetivo": "mostrar somente os dois bonus confirmados",
  "referencias": [
    {"arquivo": "assets/bonus-1-lista-do-zero.png", "uso": "preservar integralmente a arte da primeira capa"},
    {"arquivo": "assets/bonus-2-maestria.png", "uso": "preservar integralmente a arte da segunda capa"}
  ],
  "layout": {
    "fundo": "branco quente",
    "estrutura": "duas capas lado a lado, mesma importancia visual, leve perspectiva e base alinhada",
    "contagem": "exatamente dois objetos de produto",
    "margens": "respiro para legendas externas, sem texto gerado adicional"
  },
  "estilo": {
    "paleta": "manter laranja, branco e tipografia das referencias",
    "luz": "luz de estudio difusa vinda de cima e à esquerda",
    "sombras": "contato suave na base, sem reflexos que cubram o texto",
    "foco": "ambas as capas nítidas e legíveis"
  },
  "conteudo": {
    "titulos_para_legendas_externas": ["Como criar uma lista do zero", "Maestria na lista"],
    "texto_embutido_novo": "nenhum",
    "natureza": "representacao de conteudo digital, nao envio de livros fisicos"
  },
  "restricoes": [
    "Não redesenhar, corrigir por adivinhação ou completar o conteúdo das capas.",
    "Não inventar terceiro bônus, consultoria, software, automações ou materiais extras.",
    "Não inserir valores, descontos, inbox garantida, taxas de abertura ou faturamento.",
    "Não gerar logos, pessoas, badges, telas, mãos ou ícones de plataformas.",
    "Não distorcer letras, ocultar títulos ou produzir texto ilegível.",
    "Se não conseguir preservar a referência, não substituir por um mockup genérico."
  ]
}
```

**Legendas externas em HTML:** nomes dos bônus e descrições verificadas da landing. Não inventar formato “ebook” para aulas: a capa é uma representação editorial.

## 5. Instagram — mesmo ângulo em 4:5 e 9:16

**Destino:** novos criativos estáticos de aquisição; não foram publicados anúncios.
**Referência:** `c/assets/hero.webp`.
**Alt 4:5:** “Kit digital aberto em composição vertical curta, com área livre para a mensagem sobre o próximo email.”
**Alt 9:16:** “Kit digital aberto em composição vertical alta, com áreas livres para a mensagem e o convite de acesso.”

Os formatos abaixo são os destinos editoriais solicitados. Não são parâmetros enviados à ferramenta. Reservas de espaço são escolhas de layout, não uma alegação de safe zones oficiais da plataforma.

### 5A. Composição editorial 4:5

```json
{
  "tipo": "asset modular para criativo estatico",
  "destino_editorial": "4:5",
  "angulo": "Base parada",
  "referencia": {
    "arquivo": "c/assets/hero.webp",
    "preservar": "identidade azul, pasta, pagina e laptop",
    "natureza": "mockup ilustrativo de produto digital"
  },
  "layout": {
    "faixa_superior": "area clara vazia para headline externa; aproximadamente um terco da composicao",
    "centro": "Kit aberto e laptop como foco, sem cortar titulo da pasta",
    "faixa_inferior": "respiro vazio para CTA externo",
    "camera": "mesma vista em tres quartos da referencia",
    "fundo": "branco com sombra natural suave"
  },
  "texto_embutido": "Somente os rotulos curtos existentes no produto de referencia; nenhum novo texto promocional.",
  "copy_externa_editavel": {
    "headline": "Você já pagou pelo lead.",
    "apoio": "Veja o que enviar depois.",
    "cta": "Conheça o Kit"
  },
  "restricoes": [
    "Não renderizar a copy externa no bitmap.",
    "Não acrescentar preço, quantidade de emails, escassez, faturamento, conversão ou resultado.",
    "Não inventar selos, logos de Instagram, clientes, notificações ou interfaces.",
    "Não acrescentar livros, brindes ou produtos.",
    "Sem texto ilegível, erros de acentuação, mãos ou estética stock photo.",
    "Não apresentar o mockup como foto de material físico incluído."
  ]
}
```

### 5B. Composição editorial 9:16

```json
{
  "tipo": "asset modular para criativo estatico vertical alto",
  "destino_editorial": "9:16",
  "angulo": "Base parada",
  "referencia": {
    "arquivo": "c/assets/hero.webp",
    "preservar": "mesmos produto, paleta e materiais do criativo 4:5",
    "natureza": "mockup ilustrativo de produto digital"
  },
  "layout": {
    "topo": "espaco negativo limpo para headline externa em duas ou tres linhas",
    "miolo": "produto centralizado e grande; pasta, pagina e laptop inteiros",
    "base": "espaco negativo limpo para CTA externo",
    "bordas": "margens generosas para nao encostar elementos em sobreposicoes do aplicativo",
    "camera": "tres quartos, sem lente grande-angular deformando o laptop",
    "luz": "janela lateral esquerda, superficie clara, sombras fisicas suaves"
  },
  "texto_embutido": "Somente os rotulos curtos da referencia; sem novo texto promocional.",
  "copy_externa_editavel": {
    "headline": "Você já pagou pelo lead.",
    "apoio": "Agora veja o que enviar depois.",
    "cta": "Conheça o Kit"
  },
  "restricoes": [
    "Não renderizar a copy externa no bitmap.",
    "Não esticar ou apenas cortar o 4:5; recompor preservando os objetos inteiros.",
    "Não acrescentar preço, contagem de emails, urgência, métricas ou promessas.",
    "Não inventar logos, plataformas, clientes, telas ou produtos extras.",
    "Não gerar mãos, pessoas, texto ilegível, erros ortográficos ou mockup genérico.",
    "Não preencher espaços negativos com decoração, ícones ou selos."
  ]
}
```

**Montagem de anúncio:** manter headline/apoio/CTA editáveis na peça de composição e validar legibilidade nos dois destinos. Se reutilizado na landing, todo texto promocional fica em HTML/CSS. O clique deve continuar a conversa do hero, não introduzir outro ângulo ou benefício.
