/* Variante C: mesmo contrato de checkout e mensuração da variante B. */
(function () {
  'use strict';

  const CONFIG = {
    checkoutUrl: "https://sun.eduzz.com/Z0B544N7WA?cupom=ULTIMACHANCE",
    variante: 'C'
  };

  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event, variante: CONFIG.variante }, data || {}));
  }

  track('ViewContent', { content_name: 'Kit Definitivo Email Marketing' });

  document.querySelectorAll('a[data-checkout]').forEach(function (link) {
    link.href = CONFIG.checkoutUrl;
    link.addEventListener('click', function () {
      track('InitiateCheckout', {
        cta: link.dataset.cta,
        metodo: 'direto',
        content_name: 'Kit Definitivo Email Marketing',
        value: 17,
        currency: 'BRL'
      });
    });
  });

  // A leitura da amostra é local: não gera lead, checkout ou evento novo.
  const toggle = document.querySelector('.demo-toggle');
  const original = document.getElementById('sample-original');
  const adapted = document.getElementById('sample-adapted');
  if (toggle && original && adapted) {
    toggle.hidden = false;
    toggle.addEventListener('click', function () {
      const showAdapted = adapted.hidden;
      original.hidden = showAdapted;
      adapted.hidden = !showAdapted;
      toggle.setAttribute('aria-pressed', String(showAdapted));
      toggle.textContent = showAdapted ? 'Ver trecho do Kit' : 'Ver adaptação';
    });
  }

  // Ajuda de navegação só após o CTA inicial sair de cena; nunca sobre a oferta.
  const sticky = document.querySelector('.sticky-cta');
  const heroCta = document.getElementById('hero-cta');
  const offer = document.querySelector('.offer-card');
  const finalCta = document.getElementById('final-cta');
  if (sticky && heroCta && offer && finalCta && 'IntersectionObserver' in window) {
    const visible = new Map([[heroCta, true], [offer, false], [finalCta, false]]);
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible.set(entry.target, entry.isIntersecting); });
      const passedHero = heroCta.getBoundingClientRect().bottom < 0;
      sticky.hidden = !passedHero || visible.get(heroCta) || visible.get(offer) || visible.get(finalCta);
    });
    [heroCta, offer, finalCta].forEach(function (element) { observer.observe(element); });
  }

  // Preservado da variante B: registro first-party existente, sem formulário.
  fetch('/kit-51-emails/api/visita', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pagina: location.pathname.replace('/kit-51-emails', '') || '/' }),
    keepalive: true
  }).catch(function () {});
})();
