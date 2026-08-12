# Copy — página de vendas, variante B

Versão curta para teste A/B contra a `index.html`. Estrutura aprovada:
compacta e completa, ~1/3 do tamanho, 4 a 5 rolagens no celular.

**O eixo muda.** A versão A abre com o mecanismo ("copiar, colar e enviar") e
usa a prova como apoio. A B inverte: abre com a prova e o mecanismo vem em
seguida. É a única forma de o teste responder alguma coisa — uma A mais curta
só diria que a página estava longa.

**Onde ficam os botões.** O formulário sobe para dentro do hero — coluna direita
no desktop, logo abaixo da subheadline no celular. Os outros quatro botões da
página (seção do produto, oferta, fechamento e a barra fixa do celular) vão
**direto para o checkout**, sem passar por cadastro. Só o card do topo pede
nome, e-mail e telefone.

No `dataLayer`, todo `InitiateCheckout` carrega `metodo: 'direto'` ou
`metodo: 'formulario'`. É o que responde, dentro do próprio teste, se pedir os
dados antes do checkout paga o custo de pedi-los.

---

## 1. Barra de urgência

> **O preço volta para R$197 quando este contador zerar**
> `[ 00 : 14 : 32 ]`

Na A a faixa diz "ENCERRA HOJE ÀS 23H59" a 3 centímetros de um contador de 15
minutos. As duas coisas não podem ser verdade ao mesmo tempo, e o lead lê as
duas de uma vez. Uma afirmação só, coerente com o relógio que está do lado.

Some também o "GANHE 91,37% DE DESCONTO". Precisão decimal em desconto é a
coisa mais fácil de reconhecer como truque.

---

## 2. Hero

**H1**
> Os e-mails que já venderam R$10.970.889 agora são seus.

**Subheadline**
> 51 e-mails prontos, em 7 sequências completas. Você copia, troca o que está
> marcado em azul e envia hoje mesmo.

**Linha de posicionamento** (abaixo do mockup)
> Não é curso. Não é IA. São os e-mails que já rodaram — com o assunto, o
> corpo e a ordem de envio já definidos.

Essa linha resolve em 15 palavras o que a A gasta seis parágrafos resolvendo
("esqueça o e-mail genérico que a IA cospe", "gastar milhares num curso pra
aprender sozinho"). E nomeia as duas alternativas que o leitor realmente tem
na cabeça naquele momento.

**CTA**
> QUERO OS 51 E-MAILS POR R$17 →

**Abaixo do botão**
> ~~R$197~~ R$17 · Acesso imediato · 7 dias de garantia

---

## 3. O que você recebe

**H2**
> O que chega na sua mão por R$17

**Linha de abertura**
> Sete sequências completas. Cada uma resolve um momento específico do funil —
> e vem inteira, na ordem certa de envio.

**A lista** (da maior para a menor: o volume aparece primeiro)

| Sequência | | O que ela faz |
|---|---|---|
| **Carrinho Abandonado** | 18 e-mails | Recupera quem chegou no checkout e não pagou. |
| **Leads Aquecidos** | 14 e-mails | Prepara a base antes do lançamento sem cansar a lista. |
| **Lançamento** | 6 e-mails | Leva o inscrito até a aula e faz ele aparecer. |
| **Boas-vindas** | 6 e-mails | Aproveita a maior taxa de abertura que você vai ter na vida: a de quem acabou de comprar. |
| **UpSell 2X** | 3 e-mails | Faz o cliente comprar de novo sem você pagar anúncio outra vez. |
| **High Ticket** | 3 e-mails | Os três e-mails que vendem mentoria por e-mail. |
| **Leads Gratuitos** | 2 e-mails | Transforma cliente satisfeito em indicação. |

**Linha de formato**
> Vem em Google Docs e PDF. Cada e-mail com duas opções de assunto — mais de
> 100 combinações possíveis.

**Bônus**
> **E mais 2 bônus, R$198, inclusos hoje**
>
> **Como construir uma lista do zero** — masterclass com 7 formas de captar
> lead. *(R$99)*
>
> **Maestria da lista** — como fazer seu e-mail chegar na caixa de entrada, e
> não em Promoções. *(R$99)*

Os bônus perdem a seção própria e os dois cards com imagem. Viram quatro linhas
dentro da seção que o leitor já está lendo — no lugar onde o valor está sendo
somado, que é onde bônus serve para alguma coisa.

---

## 4. Como funciona

**H2**
> Três passos. Nenhum deles é escrever.

1. **Baixa o arquivo.** Google Docs ou PDF, liberado no minuto do pagamento.
2. **Escolhe a sequência** do momento que você está vivendo agora.
3. **Troca o que está em azul** pelo nome do seu produto e envia.

---

## 5. A oferta

**H2**
> ~~R$197~~ &nbsp; **R$17**

Sem parágrafo de justificativa do preço. A faixa vermelha do topo já diz que ele
sobe para R$197 quando o contador zerar; explicar o motivo aqui é a terceira vez
que a página fala do mesmo assunto, e abre uma discussão que o preço não precisa.

**Garantia**
> **7 dias.** Baixa tudo, usa de verdade, e se não servir você me avisa e eu
> devolvo. Sem pergunta e sem formulário.

**CTA**
> QUERO OS 51 E-MAILS POR R$17 →

A A tem duas seções inteiras de garantia, uma delas explicando por que a
garantia é generosa. Isso levanta uma dúvida que o leitor não tinha. Numa
compra de R$17 a garantia é um selo, não um argumento.

---

## 6. Perguntas frequentes

Quatro. Só as que travam uma compra de R$17.

**Quando eu recebo?**
> Na hora. Pagamento confirmado, acesso liberado no seu e-mail.

**Meus e-mails não vão ficar iguais aos de todo mundo?**
> Não. Cada e-mail vem com as alterações sugeridas em azul, mostrando o que
> trocar para o texto ficar com a sua cara. E são duas opções de assunto por
> e-mail.

**Serve se eu ainda não tenho lista?**
> Serve — e o bônus nº 1 é exatamente sobre isso: sete formas de captar seus
> primeiros leads.

**E se não for para mim?**
> Você tem 7 dias para pedir o dinheiro de volta. Sem pergunta.

Saem: "o que é exatamente o kit" (a página inteira responde), "por que é apenas
R$17" (já está na seção da oferta), "direitos de revenda" (é rodapé legal, não
dúvida de compra) e "como obtenho ajuda" (rodapé).

---

## 7. Fechamento

**H2**
> Segunda-feira você vai precisar enviar alguma coisa.

**Corpo**
> A diferença é se vai ser você encarando a tela em branco, ou um e-mail que já
> vendeu R$10.970.889 esperando você trocar o nome do produto.

**CTA final**
> QUERO OS 51 E-MAILS POR R$17 →

Sem a carta assinada, sem a bio do Laschuk, sem "desejo-lhe tudo de bom". A
prova de autoridade já está no H1 e ninguém compra um tripwire de R$17 depois
de ler uma biografia.

---

## O que sai da A, e por quê

| Sai | Motivo |
|---|---|
| "Apesar do que os pessimistas nos dizem", "A maioria dos Gurus do Marketing Online concorda", "meu ultrajante...", "Peça agora e lucre amanhã" | É swipe americano traduzido ao pé da letra. O leitor brasileiro reconhece o sotaque antes de reconhecer a oferta. |
| Os 7 cards de sequência com imagem | Viram sete linhas de tabela. Mesma informação, um décimo da rolagem. |
| Seção "Milhares de reais", seção "Vantagem injusta", seção "Garantia generosa" | As três repetem o mesmo argumento com outras palavras. |
| Bio do autor + assinatura + retrato | A prova que importa está no H1. |
| 5 dos 8 CTAs intermediários | Sobram 4 numa página que é 1/3 do tamanho — a mesma densidade. |
| Recapitulação final com a lista repetida | A lista aparece uma vez só, e ela é curta. |

---

## Decisões pendentes antes de publicar

**1. São 51 ou 52 e-mails?** As sete sequências somam 52 (18+14+6+6+3+3+2). A
página, o nome do produto e a URL dizem 51. A B repete o número da A, mas a
tabela de sequências torna a conta visível para qualquer leitor que some.

**2. Qual é o número da prova?** A A usa R$10.970.889 no hero e R$26 milhões no
meio; o brief de copy fala em R$20 milhões. A B usa R$10.970.889 duas vezes,
por ser o mais específico e o mais defensável. Se o certo for outro, é trocar
nos dois lugares.

**3. O H1 tem alternativas.** Se preferir abrir por dor em vez de por prova:

> *Sua lista está parada porque você não sabe o que enviar.*

> *Pare de escrever e-mail do zero. Já existe um que vendeu R$10.970.889.*
