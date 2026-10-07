// Static site generator for idealhouse.nl (NL + EN) — run: node build.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const NL = require('./data');
const EN = require('./data-en');
const PHOTOS = require('./photos');
const META = require('./img-meta.json');

const { BIZ, CITIES, DISTRICTS } = NL;
const OUT = path.resolve(__dirname, '../site');
const TODAY = new Date().toISOString().slice(0, 10);
const P = Object.fromEntries(PHOTOS.map((p) => [p.slug, p]));

/* ---------- language state ---------- */
let LANG = 'nl';
const tx = (nl, en) => (LANG === 'nl' ? nl : en);
const DATA = {
  nl: { SERVICES: NL.SERVICES, GENERAL_FAQS: NL.GENERAL_FAQS, STEPS: NL.STEPS, WHY: NL.WHY, CATS: NL.CATS },
  en: { SERVICES: NL.SERVICES.map((s, i) => ({ ...s, ...EN.SERVICES[i], nlSlug: s.slug })), GENERAL_FAQS: EN.GENERAL_FAQS, STEPS: EN.STEPS, WHY: EN.WHY, CATS: EN.CATS },
};
const D = () => DATA[LANG];
const ROUTES = {
  home: { nl: '/', en: '/en' },
  services: { nl: '/diensten', en: '/en/services' },
  projects: { nl: '/projecten', en: '/en/projects' },
  process: { nl: '/werkwijze', en: '/en/how-we-work' },
  about: { nl: '/over-ons', en: '/en/about' },
  contact: { nl: '/contact', en: '/en/contact' },
  quote: { nl: '/offerte', en: '/en/quote' },
  faq: { nl: '/veelgestelde-vragen', en: '/en/faq' },
};
const R = (k, l = LANG) => ROUTES[k][l];
const svcUrl = (i, l = LANG) => (l === 'nl' ? '/diensten/' + DATA.nl.SERVICES[i].slug : '/en/services/' + DATA.en.SERVICES[i].slug);
const pt = (slug) => (LANG === 'en' ? P[slug].en : { title: P[slug].title, alt: P[slug].alt });
const waLink = (topic) => BIZ.wa + '?text=' + encodeURIComponent(tx(
  `Hallo Ideal House, ik heb een vraag over ${topic || 'een verbouwing'}.`,
  `Hello Ideal House, I have a question about ${topic || 'a renovation'}.`));
const HOURS = () => tx(BIZ.hours, [['Monday – Friday', '08:00 – 18:00'], ['Saturday', '09:00 – 16:00'], ['Sunday', 'Closed']]);
const HOURS_SHORT = () => tx('Ma–vr 08:00–18:00 · za 09:00–16:00', 'Mon–Fri 08:00–18:00 · Sat 09:00–16:00');
const CITY = (c) => (LANG === 'en' && c === 'Den Haag' ? 'The Hague' : c);

/* ---------- helpers ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hash = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 8);
const nn = (i) => String(i + 1).padStart(2, '0');

const ICONS = {
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  wa: '<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21z"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
  euro: '<path d="M4 10h11M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0z"/><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  zoom: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
  sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M17 5h4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/>',
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

function pickWidth(slug, target) {
  const ws = META[slug].widths;
  return ws.find((w) => w >= target) || ws[ws.length - 1];
}
function img(slug, { sizes = '100vw', eager = false, alt, w = 800 } = {}) {
  const m = META[slug];
  if (!m) throw new Error('Unknown photo ' + slug);
  const srcset = m.widths.map((x) => `/img/${slug}-${x}.webp ${x}w`).join(', ');
  return `<img src="/img/${slug}-${pickWidth(slug, w)}.webp" srcset="${srcset}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${esc(alt || pt(slug).alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}
const large = (slug) => `/img/${slug}-${META[slug].widths[META[slug].widths.length - 1]}.webp`;

function pcard(slug, group, { sizes = '(max-width:680px) 50vw, 33vw', d = 0, cat = false } = {}) {
  const p = P[slug];
  const c = D().CATS[p.cat];
  return `<a class="pcard reveal" data-d="${d}" href="${large(slug)}" data-lightbox="${group}" data-title="${esc(pt(slug).title)}" data-sub="${esc(c)}"${cat ? ` data-cat="${p.cat}"` : ''}>
  <span class="pcard__img">${img(slug, { sizes })}<span class="pcard__zoom">${icon('zoom')}</span></span>
  <span class="pcard__cap"><strong>${esc(pt(slug).title)}</strong><small>${esc(c)}</small></span>
</a>`;
}

const callBtn = (cls = 'btn btn--clay', label) => `<a class="${cls}" href="tel:${BIZ.tel}">${icon('phone')}<span>${label || BIZ.phone}</span></a>`;
const waBtn = (topic, cls = 'btn btn--wa', label) => `<a class="${cls}" href="${waLink(topic)}" target="_blank" rel="noopener">${icon('wa')}<span>${label || tx('WhatsApp ons', 'WhatsApp us')}</span></a>`;
const arrowLink = (href, label) => `<a class="arrow-link" href="${href}">${label}<i>${icon('arrow')}</i></a>`;

function head(label, h2, lead, { center = false, cls = 'd2' } = {}) {
  return `<div class="head${center ? ' head--center' : ''} reveal">
  ${label ? `<span class="label">${label}</span>` : ''}
  <h2 class="${cls}">${h2}</h2>
  ${lead ? `<p class="lead">${lead}</p>` : ''}
</div>`;
}

function faqList(faqs) {
  return `<div class="faq">${faqs.map(([q, a], i) => `
  <details${i === 0 ? ' open' : ''}>
    <summary>${esc(q)}<span class="pm" aria-hidden="true"></span></summary>
    <div class="faq__a"><p>${esc(a)}</p></div>
  </details>`).join('')}
</div>`;
}

function contactRows(topic, light = false) {
  return `<div class="crows${light ? ' crows--light' : ''}">
  <a class="crow" href="tel:${BIZ.tel}"><span class="ico">${icon('phone')}</span><span><small>${tx('Bel direct', 'Call us')}</small><strong>${BIZ.phone}</strong></span>${icon('arrow')}</a>
  <a class="crow" href="${waLink(topic)}" target="_blank" rel="noopener"><span class="ico">${icon('wa')}</span><span><small>${tx('WhatsApp · stuur foto\'s mee', 'WhatsApp · send photos')}</small><strong>${BIZ.phone}</strong></span>${icon('arrow')}</a>
  <a class="crow" href="mailto:${BIZ.email}"><span class="ico">${icon('mail')}</span><span><small>${tx('E-mail', 'Email')}</small><strong>${BIZ.email}</strong></span>${icon('arrow')}</a>
</div>`;
}

function bigCta(topic, title) {
  return `<section class="section" aria-labelledby="cta-title">
  <div class="container">
    <div class="bigcta reveal">
      <div class="bigcta__grid">
        <div>
          <span class="label">${tx('Gratis offerte', 'Free quote')}</span>
          <h2 id="cta-title" style="margin-top:20px">${title || tx('Laten we uw <em>ideale huis</em> bouwen.', 'Let\'s build your <em>ideal home.</em>')}</h2>
          <p class="lead">${tx('Vertel ons over uw plannen. We komen gratis langs voor een opname en u ontvangt een vrijblijvende offerte, meestal binnen twee werkdagen.', 'Tell us about your plans. We visit for a free survey and you receive a no-obligation quote, usually within two working days.')}</p>
        </div>
        ${contactRows(topic)}
      </div>
    </div>
  </div>
</section>`;
}

function crumbs(list) {
  return `<nav class="crumbs" aria-label="${tx('Kruimelpad', 'Breadcrumb')}"><ol>${list.map(([name, href], i) =>
    i === list.length - 1 ? `<li><span aria-current="page">${esc(name)}</span></li>` : `<li><a href="${href}">${esc(name)}</a></li>`).join('')}</ol></nav>`;
}

function pageHero({ crumbsList, label, h1, lead, media, topic, extra = '' }) {
  return `<section class="phero${media ? '' : ' phero--simple'}">
  <div class="container">
    ${crumbs(crumbsList)}
    <div class="phero__content">
      ${label ? `<span class="label">${label}</span>` : ''}
      <h1>${h1}</h1>
      ${lead ? `<p class="lead">${lead}</p>` : ''}
      ${extra}
      ${topic !== false ? `<div class="btn-row">${callBtn()}${waBtn(topic, 'btn btn--line')}</div>` : ''}
    </div>
    ${media ? `<div class="phero__media"><div class="arch">${img(media, { sizes: '(max-width:1024px) 100vw, 440px', eager: true, w: 800 })}</div></div>` : ''}
  </div>
</section>`;
}

function srow(i) {
  const s = D().SERVICES[i];
  return `<li class="srow reveal">
    <span class="srow__n">${nn(i)}</span>
    <h3><a href="${svcUrl(i)}">${esc(s.name)}</a></h3>
    <p>${esc(s.card)}</p>
    <span class="srow__img">${img(s.hero, { sizes: '150px', w: 480 })}</span>
    <span class="srow__go">${icon('arrow')}</span>
  </li>`;
}
const servicesList = (idx) => `<ol class="slist">${(idx || D().SERVICES.map((_, i) => i)).map(srow).join('')}</ol>`;

function infoCard() {
  return `<div class="info reveal" data-d="2">
  <div class="info-row"><span class="ico">${icon('pin')}</span><div><small>${tx('Vestiging', 'Office')}</small><a href="${BIZ.maps}" target="_blank" rel="noopener">${BIZ.street}<br>${BIZ.zip} ${BIZ.city}</a></div></div>
  <div class="info-row"><span class="ico">${icon('phone')}</span><div><small>${tx('Telefoon & WhatsApp', 'Phone & WhatsApp')}</small><a href="tel:${BIZ.tel}">${BIZ.phone}</a></div></div>
  <div class="info-row"><span class="ico">${icon('mail')}</span><div><small>${tx('E-mail', 'Email')}</small><a href="mailto:${BIZ.email}">${BIZ.email}</a></div></div>
  <div class="info-row"><span class="ico">${icon('clock')}</span><div><small>${tx('Bereikbaar', 'Opening hours')}</small><dl class="hours">${HOURS().map(([d, h]) => `<dt>${d}</dt><dd>${h}</dd>`).join('')}</dl></div></div>
  <a class="btn btn--line" href="${BIZ.maps}" target="_blank" rel="noopener">${icon('pin')}<span>${tx('Route plannen', 'Get directions')}</span></a>
</div>`;
}

function areaSection() {
  return `<section class="section bg-cream" id="${tx('werkgebied', 'area')}" aria-labelledby="area-title">
  <div class="container area">
    <div>
      ${head(tx('Werkgebied', 'Service area'), `<span id="area-title">${tx('Thuis in Rotterdam <em>en heel Zuid-Holland</em>', 'At home in Rotterdam <em>and all of South Holland</em>')}</span>`,
        tx(`Vanuit de Schiekade werken we in alle Rotterdamse wijken, van ${DISTRICTS.slice(0, 3).join(', ')} tot ${DISTRICTS[5]} en ${DISTRICTS[10]}, en in de gemeenten eromheen. Staat uw plaats er niet bij? Bel gerust.`,
          `From our base on the Schiekade we work in every Rotterdam district, from ${DISTRICTS.slice(0, 3).join(', ')} to ${DISTRICTS[5]} and ${DISTRICTS[10]}, and in the surrounding towns. Don't see your town? Just give us a call.`))}
      <ul class="cities reveal">${CITIES.map((c) => `<li>${CITY(c)}</li>`).join('')}</ul>
    </div>
    ${infoCard()}
  </div>
</section>`;
}

const timeline = (steps) => `<ol class="timeline">${steps.map(([, t, d], i) => `<li class="tl reveal"><span class="tl__n">${nn(i)}</span><div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}</ol>`;
const pillars = (list, style = '') => `<ul class="pillars"${style}>${list.map(([ic, t, d], i) => `<li class="pillar reveal" data-d="${i % 2}"><span class="ico">${icon(ic)}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ul>`;

/* ---------- structured data ---------- */
const ORG_ID = BIZ.url + '/#organisatie';
function orgLd() {
  return {
    '@type': ['HomeAndConstructionBusiness', 'GeneralContractor'],
    '@id': ORG_ID,
    name: BIZ.name,
    legalName: BIZ.name,
    description: tx('Ideal House verzorgt complete renovaties en verbouwingen in Rotterdam en omstreken. Badkamers, aanbouw, tegelwerk, schilderwerk, loodgieterswerk, elektra en dakwerk — alles door één aanspreekpunt.',
      'Ideal House carries out complete renovations in Rotterdam and the surrounding area. Bathrooms, extensions, tiling, painting, plumbing, electrical work and roofing — all through one point of contact.'),
    url: BIZ.url,
    logo: { '@type': 'ImageObject', url: BIZ.url + '/assets/logo-ideal-house.png', width: 800, height: 800 },
    image: [BIZ.url + '/img/og-ideal-house.jpg', BIZ.url + large('aanbouw-schuifpui-rotterdam'), BIZ.url + large('badkamer-inloopdouche-led-spiegel')],
    telephone: BIZ.tel,
    email: BIZ.email,
    founder: { '@type': 'Person', name: BIZ.owner },
    vatID: BIZ.btw,
    identifier: [
      { '@type': 'PropertyValue', name: 'KvK-nummer', value: BIZ.kvk },
      { '@type': 'PropertyValue', name: 'Btw-identificatienummer', value: BIZ.btw },
    ],
    address: { '@type': 'PostalAddress', streetAddress: BIZ.street, postalCode: BIZ.zip, addressLocality: BIZ.city, addressRegion: BIZ.region, addressCountry: 'NL' },
    geo: { '@type': 'GeoCoordinates', latitude: BIZ.lat, longitude: BIZ.lng },
    hasMap: BIZ.maps,
    areaServed: CITIES.map((c) => ({ '@type': 'City', name: c })),
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '16:00' },
    ],
    contactPoint: { '@type': 'ContactPoint', telephone: BIZ.tel, email: BIZ.email, contactType: 'customer service', areaServed: 'NL', availableLanguage: ['Dutch', 'English'] },
    priceRange: '€€',
    currenciesAccepted: 'EUR',
    knowsLanguage: ['nl', 'en'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: tx('Diensten', 'Services'),
      itemListElement: D().SERVICES.map((s, i) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: BIZ.url + svcUrl(i) } })),
    },
  };
}
const websiteLd = () => ({ '@type': 'WebSite', '@id': BIZ.url + '/#website', url: BIZ.url, name: BIZ.name, inLanguage: ['nl-NL', 'en'], publisher: { '@id': ORG_ID } });
const breadcrumbLd = (list) => ({
  '@type': 'BreadcrumbList',
  itemListElement: list.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: BIZ.url + (href === '/' ? '' : href) })),
});
const faqLd = (faqs) => ({ '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

/* ---------- layout ---------- */
let CSS_V = '', JS_V = '';

function langSwitch(alt) {
  const other = LANG === 'nl' ? 'en' : 'nl';
  const href = (alt && alt[other]) || R('home', other);
  return `<nav class="lang" aria-label="${tx('Taal', 'Language')}">${LANG === 'nl'
    ? `<span aria-current="true">NL</span><a href="${href}" hreflang="en" lang="en">EN</a>`
    : `<a href="${href}" hreflang="nl" lang="nl">NL</a><span aria-current="true">EN</span>`}</nav>`;
}

function header(active, alt) {
  const cur = (k) => (active === k ? ' aria-current="page"' : '');
  const S = D().SERVICES;
  return `<a class="skip" href="#main">${tx('Direct naar de inhoud', 'Skip to content')}</a>
<header class="header">
  <div class="container">
    <a class="brand" href="${R('home')}" aria-label="${tx('Ideal House, naar de homepage', 'Ideal House, go to homepage')}"><img src="/assets/logo.svg" width="173" height="40" alt="Ideal House"></a>
    <nav class="nav" aria-label="${tx('Hoofdmenu', 'Main menu')}">
      <ul class="nav__list">
        <li class="nav__item"><a class="nav__link${active === 'svc' ? ' is-active' : ''}" href="${R('services')}"${cur('services')}>${tx('Diensten', 'Services')} ${icon('chev')}</a>
          <div class="dropdown">
            ${S.map((s, i) => `<a href="${svcUrl(i)}"><b>${nn(i)}</b><span><strong>${esc(s.name)}</strong><small>${esc(s.card)}</small></span></a>`).join('')}
            <a class="dropdown__all" href="${R('services')}">${tx('Bekijk alle diensten', 'View all services')} ${icon('arrow')}</a>
          </div>
        </li>
        <li><a class="nav__link" href="${R('projects')}"${cur('projects')}>${tx('Projecten', 'Projects')}</a></li>
        <li><a class="nav__link" href="${R('process')}"${cur('process')}>${tx('Werkwijze', 'How we work')}</a></li>
        <li><a class="nav__link" href="${R('about')}"${cur('about')}>${tx('Over ons', 'About')}</a></li>
        <li><a class="nav__link" href="${R('contact')}"${cur('contact')}>Contact</a></li>
      </ul>
    </nav>
    <div class="header__end">
      ${langSwitch(alt)}
      ${callBtn('btn btn--clay btn--sm')}
      <a class="call-icon" href="tel:${BIZ.tel}" aria-label="${tx('Bel', 'Call')} Ideal House: ${BIZ.phone}">${icon('phone')}</a>
      <button class="burger" type="button" data-menu-open aria-controls="mnav" aria-expanded="false" aria-label="${tx('Menu openen', 'Open menu')}">${icon('menu')}</button>
    </div>
  </div>
</header>
<div class="mnav" id="mnav" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden="true">
  <div class="mnav__top">
    <img src="/assets/logo-wit.svg" width="139" height="32" alt="Ideal House">
    ${langSwitch(alt)}
    <button class="mnav__close" type="button" data-menu-close aria-label="${tx('Menu sluiten', 'Close menu')}">${icon('close')}</button>
  </div>
  <div class="mnav__body">
    <a class="mnav__link" href="${R('home')}"><b>01</b>Home</a>
    <details>
      <summary class="mnav__link"><b>02</b>${tx('Diensten', 'Services')}</summary>
      <div class="mnav__sub">${S.map((s, i) => `<a href="${svcUrl(i)}">${esc(s.name)}</a>`).join('')}<a href="${R('services')}">${tx('Alle diensten →', 'All services →')}</a></div>
    </details>
    <a class="mnav__link" href="${R('projects')}"><b>03</b>${tx('Projecten', 'Projects')}</a>
    <a class="mnav__link" href="${R('process')}"><b>04</b>${tx('Werkwijze', 'How we work')}</a>
    <a class="mnav__link" href="${R('about')}"><b>05</b>${tx('Over ons', 'About')}</a>
    <a class="mnav__link" href="${R('faq')}"><b>06</b>${tx('Vragen', 'FAQ')}</a>
    <a class="mnav__link" href="${R('contact')}"><b>07</b>Contact</a>
    <div class="mnav__foot">
      ${callBtn('btn btn--clay', tx('Bel ', 'Call ') + BIZ.phone)}
      ${waBtn('')}
      <p class="mnav__meta">${BIZ.street}, ${BIZ.zip} ${BIZ.city} · ${HOURS_SHORT()}</p>
    </div>
  </div>
</div>`;
}

function footer() {
  const S = D().SERVICES;
  const legal = [['privacyverklaring', 'Privacy'], ['cookiebeleid', 'Cookies'], ['algemene-voorwaarden', tx('Algemene voorwaarden', 'Terms & conditions')], ['disclaimer', 'Disclaimer'], ['toegankelijkheid', tx('Toegankelijkheid', 'Accessibility')]];
  return `<footer class="footer">
  <div class="container">
    <div class="footer__top">
      <div class="footer__brand">
        <img src="/assets/logo-wit.svg" width="182" height="42" alt="Ideal House" loading="lazy">
        <p>${tx('Renovatiebedrijf uit Rotterdam. Badkamers, aanbouw, tegelwerk, schilderwerk, loodgieterswerk, elektra en dakwerk: alles onder één dak, met één aanspreekpunt.',
          'Renovation company from Rotterdam. Bathrooms, extensions, tiling, painting, plumbing, electrical work and roofing: all under one roof, with one point of contact.')}</p>
        <div class="footer__btns">${waBtn('', 'btn btn--line-light btn--sm', 'WhatsApp')}<a class="btn btn--line-light btn--sm" href="${BIZ.maps}" target="_blank" rel="noopener">${icon('pin')}<span>Google Maps</span></a></div>
      </div>
      <div>
        <h2>${tx('Diensten', 'Services')}</h2>
        <ul>${S.map((s, i) => `<li><a href="${svcUrl(i)}">${esc(s.name)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h2>Ideal House</h2>
        <ul>
          <li><a href="${R('projects')}">${tx('Projecten', 'Projects')}</a></li>
          <li><a href="${R('process')}">${tx('Werkwijze', 'How we work')}</a></li>
          <li><a href="${R('about')}">${tx('Over ons', 'About us')}</a></li>
          <li><a href="${R('quote')}">${tx('Gratis offerte', 'Free quote')}</a></li>
          <li><a href="${R('faq')}">${tx('Veelgestelde vragen', 'FAQ')}</a></li>
          <li><a href="${R('contact')}">Contact</a></li>
        </ul>
      </div>
      <div>
        <h2>Contact</h2>
        <ul class="footer__contact">
          <li>${icon('phone')}<a href="tel:${BIZ.tel}">${BIZ.phone}</a></li>
          <li>${icon('mail')}<a href="mailto:${BIZ.email}">${BIZ.email}</a></li>
          <li>${icon('pin')}<a href="${BIZ.maps}" target="_blank" rel="noopener">${BIZ.street}<br>${BIZ.zip} ${BIZ.city}</a></li>
          <li>${icon('clock')}<span>${HOURS().slice(0, 2).map(([d, h]) => `${d}: ${h}`).join('<br>')}</span></li>
        </ul>
      </div>
    </div>
    <p class="footer__word" aria-hidden="true">Ideal House</p>
    <div class="footer__legal">
      <div class="footer__ids">
        <span>© ${new Date().getFullYear()} ${BIZ.name}</span>
        <span>KvK ${BIZ.kvk}</span>
        <span>${tx('Btw', 'VAT')} ${BIZ.btw}</span>
        <span>${tx('Eigenaar', 'Owner')}: ${BIZ.owner}</span>
      </div>
      <ul>${legal.map(([s, n]) => `<li><a href="/${s}"${LANG === 'en' ? ' hreflang="nl"' : ''}>${n}${LANG === 'en' ? ' (NL)' : ''}</a></li>`).join('')}</ul>
    </div>
  </div>
</footer>
<div class="actionbar" aria-label="${tx('Snel contact', 'Quick contact')}">
  ${callBtn('btn btn--clay', tx('Bellen', 'Call'))}
  ${waBtn('', 'btn btn--wa', 'WhatsApp')}
</div>
<div class="lb" id="lightbox" role="dialog" aria-modal="true" aria-label="${tx('Foto vergroot', 'Enlarged photo')}" aria-hidden="true">
  <span class="lb__count"></span>
  <button class="lb__btn lb__close" type="button" aria-label="${tx('Sluiten', 'Close')}">${icon('close')}</button>
  <button class="lb__btn lb__prev" type="button" aria-label="${tx('Vorige foto', 'Previous photo')}">${icon('left')}</button>
  <figure class="lb__fig"><img class="lb__img" alt=""><figcaption class="lb__cap"><strong></strong><span></span></figcaption></figure>
  <button class="lb__btn lb__next" type="button" aria-label="${tx('Volgende foto', 'Next photo')}">${icon('right')}</button>
</div>`;
}

const abs = (u) => BIZ.url + (u === '/' ? '/' : u);

function layout({ url, title, desc, body, active, alt, ld = [], preload, robots = 'index,follow,max-image-preview:large' }) {
  const canonical = abs(url);
  const graph = { '@context': 'https://schema.org', '@graph': [orgLd(), websiteLd(), {
    '@type': 'WebPage', '@id': canonical + '#webpage', url: canonical, name: title, description: desc,
    isPartOf: { '@id': BIZ.url + '/#website' }, about: { '@id': ORG_ID }, inLanguage: tx('nl-NL', 'en'),
    primaryImageOfPage: { '@type': 'ImageObject', url: BIZ.url + '/img/og-ideal-house.jpg' },
  }, ...ld] };
  const hreflang = alt ? `<link rel="alternate" hreflang="nl" href="${abs(alt.nl)}">\n${alt.en ? `<link rel="alternate" hreflang="en" href="${abs(alt.en)}">\n` : ''}<link rel="alternate" hreflang="x-default" href="${abs(alt.nl)}">\n` : '';
  const pre = preload ? `<link rel="preload" as="image" type="image/webp" href="/img/${preload.slug}-${pickWidth(preload.slug, 800)}.webp" imagesrcset="${META[preload.slug].widths.map((x) => `/img/${preload.slug}-${x}.webp ${x}w`).join(', ')}" imagesizes="${preload.sizes}" fetchpriority="high">\n` : '';
  return `<!doctype html>
<html lang="${tx('nl', 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
${hreflang}<meta name="robots" content="${robots}">
<meta name="theme-color" content="#16191c">
<meta name="geo.region" content="NL-ZH">
<meta name="geo.placename" content="Rotterdam">
<meta name="geo.position" content="${BIZ.lat};${BIZ.lng}">
<meta name="ICBM" content="${BIZ.lat}, ${BIZ.lng}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${tx('nl_NL', 'en_GB')}">
<meta property="og:locale:alternate" content="${tx('en_GB', 'nl_NL')}">
<meta property="og:site_name" content="${BIZ.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${BIZ.url}/img/og-ideal-house.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/fraunces.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin>
${pre}<link rel="stylesheet" href="/assets/style.css?v=${CSS_V}">
<script>(function(d){d.className+=' js';setTimeout(function(){if(!/ready/.test(d.className))d.className=d.className.replace(' js','')},3000)})(document.documentElement)</script>
<script type="application/ld+json">${JSON.stringify(graph)}</script>
</head>
<body>
${header(active, alt)}
<main id="main">
${body}
</main>
${footer()}
<script src="/assets/main.js?v=${JS_V}" defer></script>
</body>
</html>
`;
}

const pages = [];
function page(url, opts) {
  pages.push({ url, priority: opts.priority || '0.7', alt: opts.alt });
  const file = url === '/' ? 'index.html' : url.slice(1) + '.html';
  const out = path.join(OUT, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, layout({ url, ...opts }));
}
const altOf = (k) => ({ nl: R(k, 'nl'), en: R(k, 'en') });
const heroPre = (slug) => ({ slug, sizes: '(max-width:1024px) 100vw, 440px' });

/* ======================================================================
   HOME
   ====================================================================== */
function home() {
  const S = D().SERVICES;
  const featured = ['aanbouw-schuifpui-rotterdam', 'badkamer-wastafelmeubel-ovale-spiegel', 'serre-aanbouw-staal-glas', 'toilet-groene-staaftegels', 'woonkeuken-lichtstraat-uitbouw', 'dakkapel-antraciet', 'badkamer-dubbele-wastafel-nissen', 'aanbouw-houten-gevelbekleding'];
  const ring = tx('Gratis offerte · Binnen 2 werkdagen · ', 'Free quote · Within 2 working days · ');
  const marquee = [...S.map((s) => s.name), tx('Renovatie', 'Renovation'), tx('Verbouwing', 'Remodelling')];
  const body = `
<section class="hero" aria-labelledby="hero-title">
  <div class="hero__deco" aria-hidden="true"></div>
  <div class="container">
    <div class="hero__text">
      <span class="avail"><i aria-hidden="true"></i>${tx('Nu plek voor nieuwe projecten', 'Now taking on new projects')}</span>
      <h1 class="d1" id="hero-title">${tx('Renovatie &amp; verbouwing in Rotterdam, <em>van A tot Z geregeld.</em>', 'Renovation &amp; remodelling in Rotterdam, <em>handled from A to Z.</em>')}</h1>
      <p class="lead">${tx('Van een nieuwe badkamer tot een complete aanbouw. Ideal House neemt het hele traject uit handen: sloop, installatie, tegelwerk en afwerking. Eén aanspreekpunt, een vaste prijs vooraf en werk dat klopt.',
        'From a new bathroom to a complete extension. Ideal House takes the whole project off your hands: demolition, installation, tiling and finishing. One point of contact, a fixed price up front and work done right.')}</p>
      <div class="btn-row">
        ${callBtn('btn btn--clay', tx('Bel ', 'Call ') + BIZ.phone)}
        <a class="btn btn--line" href="${R('quote')}">${tx('Gratis offerte', 'Free quote')} ${icon('arrow')}</a>
      </div>
      <div class="hero__trust">
        <div><strong>10<small>+</small></strong><span>${tx('jaar ervaring', 'years of experience')}</span></div>
        <div><strong>150<small>+</small></strong><span>${tx('projecten opgeleverd', 'projects completed')}</span></div>
        <div><strong>7</strong><span>${tx('vakgebieden in huis', 'trades in-house')}</span></div>
      </div>
    </div>
    <div class="hero__media">
      <div class="arch hero__arch">${img('aanbouw-schuifpui-rotterdam', { sizes: '(max-width:1024px) 90vw, 520px', eager: true, w: 800 })}</div>
      <div class="hero__mini">${img('badkamer-wastafelmeubel-ovale-spiegel', { sizes: '220px', w: 480 })}</div>
      <div class="seal" aria-hidden="true">
        <svg class="ring" viewBox="0 0 120 120"><defs><path id="ringpath" d="M60,60 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0"/></defs><text><textPath href="#ringpath" textLength="312" lengthAdjust="spacing">${ring}</textPath></text></svg>
        <span class="seal__c">${icon('home')}</span>
      </div>
    </div>
  </div>
</section>

<div class="marquee" aria-hidden="true"><div class="marquee__track">${[...marquee, ...marquee].map((m) => `<span>${esc(m)}</span>`).join('')}</div></div>

<section class="section" id="${tx('diensten', 'services')}" aria-labelledby="svc-title">
  <div class="container">
    <div class="head-row">
      ${head(tx('Onze diensten', 'Our services'), `<span id="svc-title">${tx('Alles onder <em>één dak</em>', 'Everything under <em>one roof</em>')}</span>`, tx('Zeven vakgebieden, één team en één planning. Niemand wacht op een andere partij, en niemand wijst naar elkaar als er iets moet worden opgelost.', 'Seven trades, one team and one schedule. Nobody waits for another contractor, and nobody points fingers when something needs fixing.'))}
      <div class="reveal">${arrowLink(R('services'), tx('Alle diensten', 'All services'))}</div>
    </div>
    ${servicesList()}
  </div>
</section>

<section class="section bg-cream" aria-labelledby="why-title">
  <div class="container why">
    <div class="why__aside">
      ${head(tx('Waarom Ideal House', 'Why Ideal House'), `<span id="why-title">${tx('Kwaliteit waar u <em>op kunt bouwen</em>', 'Quality you can <em>build on</em>')}</span>`, tx('Een verbouwing is spannend. U laat vreemden in uw huis, er wordt gesloopt en het moet daarna beter zijn dan ervoor. Daarom houden wij het overzichtelijk.', 'A renovation is a big step. You let people into your home, things get demolished, and afterwards it has to be better than before. That is why we keep it simple.'))}
      <div class="why__img reveal">${img('woonkeuken-lichtstraat-uitbouw', { sizes: '(max-width:1024px) 100vw, 45vw' })}<div class="why__tag"><strong>100%</strong><span>${tx('eigen<br>vakmensen', 'our own<br>craftsmen')}</span></div></div>
    </div>
    ${pillars(D().WHY)}
  </div>
</section>

<section class="bg-clay section" style="padding-block:clamp(56px,7vw,96px)" aria-label="${tx('Ideal House in cijfers', 'Ideal House in numbers')}">
  <div class="container numbers">
    <div class="num reveal" data-count="10"><strong><b>10</b><small>+</small></strong><span>${tx('jaar ervaring in renovatie en afbouw', 'years of experience in renovation')}</span></div>
    <div class="num reveal" data-d="1" data-count="150"><strong><b>150</b><small>+</small></strong><span>${tx('projecten opgeleverd in de regio', 'projects completed in the region')}</span></div>
    <div class="num reveal" data-d="2" data-count="7"><strong><b>7</b></strong><span>${tx('vakgebieden in één team', 'trades in one team')}</span></div>
    <div class="num reveal" data-d="3"><strong>2<small>${tx('dagen', 'days')}</small></strong><span>${tx('tot uw offerte, meestal', 'to your quote, usually')}</span></div>
  </div>
</section>

<section class="section" aria-labelledby="proj-title">
  <div class="container">
    <div class="head-row">
      ${head(tx('Ons werk', 'Our work'), `<span id="proj-title">${tx('Recent <em>opgeleverd</em>', 'Recently <em>completed</em>')}</span>`, tx('Een greep uit onze projecten in Rotterdam en omgeving. Klik op een foto om hem groot te bekijken.', 'A selection of our projects in and around Rotterdam. Click a photo to view it full size.'))}
      <div class="car-nav reveal" data-car="home-car"><button type="button" data-dir="prev" aria-label="${tx('Vorige', 'Previous')}">${icon('left')}</button><button type="button" data-dir="next" aria-label="${tx('Volgende', 'Next')}">${icon('right')}</button></div>
    </div>
    <div class="carousel" id="home-car">
      ${featured.map((s, i) => pcard(s, 'home', { d: i % 4, sizes: '(max-width:680px) 78vw, 410px' })).join('\n')}
    </div>
    <div class="reveal" style="margin-top:36px">${arrowLink(R('projects'), tx('Alle projecten bekijken', 'View all projects'))}</div>
  </div>
</section>

<section class="section bg-ink" aria-labelledby="steps-title">
  <div class="container process">
    <div class="process__aside">
      ${head(tx('Werkwijze', 'How we work'), `<span id="steps-title">${tx('Van eerste telefoontje <em>tot oplevering</em>', 'From first call <em>to handover</em>')}</span>`, tx('Zes duidelijke stappen, zodat u altijd weet waar u aan toe bent.', 'Six clear steps, so you always know where you stand.'))}
      <div class="btn-row reveal">${callBtn('btn btn--clay')}<a class="btn btn--line-light" href="${R('process')}">${tx('Onze werkwijze', 'Our process')}</a></div>
    </div>
    ${timeline(D().STEPS)}
  </div>
</section>

${areaSection()}

<section class="section" aria-labelledby="faq-title">
  <div class="container faq-wrap">
    <div class="faq-aside">
      ${head(tx('Veelgestelde vragen', 'FAQ'), `<span id="faq-title">${tx('Goed om <em>vooraf te weten</em>', 'Good to <em>know up front</em>')}</span>`, tx('Staat uw vraag er niet bij? Bel of app ons gerust.', 'Question not listed? Feel free to call or WhatsApp us.'))}
      <div class="reveal">${arrowLink(R('faq'), tx('Alle vragen', 'All questions'))}</div>
    </div>
    ${faqList(D().GENERAL_FAQS)}
  </div>
</section>

${bigCta('')}
`;
  page(R('home'), {
    title: tx('Renovatiebedrijf Rotterdam | Badkamer & aanbouw | Ideal House', 'Renovation company Rotterdam | Bathrooms & extensions | Ideal House'),
    desc: tx('Renovatiebedrijf in Rotterdam voor badkamers, aanbouw, tegelwerk, schilderwerk, loodgieterswerk, elektra en dakwerk. Vaste prijs vooraf. Gratis offerte.',
      'English-speaking renovation company in Rotterdam: bathrooms, extensions, tiling, painting, plumbing, electrics and roofing. Fixed price up front. Free quote.'),
    body, active: 'home', alt: altOf('home'), preload: { slug: 'aanbouw-schuifpui-rotterdam', sizes: '(max-width:1024px) 90vw, 520px' }, priority: '1.0',
    ld: [faqLd(D().GENERAL_FAQS)],
  });
}

/* ======================================================================
   SERVICES INDEX
   ====================================================================== */
function servicesIndex() {
  const cr = [['Home', R('home')], [tx('Diensten', 'Services'), R('services')]];
  const body = `
${pageHero({ crumbsList: cr, label: tx('Onze diensten', 'Our services'), h1: tx('Alle vakgebieden <em>onder één dak</em>', 'Every trade <em>under one roof</em>'), lead: tx('Badkamer, aanbouw, tegelwerk, schilderwerk, loodgieterswerk, elektra en dakwerk. Ideal House voert alles zelf uit, met één planning en één aanspreekpunt.', 'Bathrooms, extensions, tiling, painting, plumbing, electrical work and roofing. Ideal House does it all in-house, on one schedule and with one point of contact.'), topic: tx('een verbouwing', 'a renovation'), media: 'aanbouw-glazen-pui-tuinzijde' })}
<section class="section"><div class="container">${servicesList()}</div></section>
<section class="section bg-cream" aria-labelledby="one-title">
  <div class="container why">
    <div class="why__aside">
      ${head(tx('Waarom één partij', 'Why one contractor'), `<span id="one-title">${tx('Geen gedoe met <em>vijf vakmensen</em>', 'No juggling <em>five contractors</em>')}</span>`, tx('Als de loodgieter moet wachten op de tegelzetter, of als niemand zich verantwoordelijk voelt, loopt een project vertraging op. Wij houden het tempo én de kwaliteit in eigen hand.', 'When the plumber waits for the tiler, or nobody feels responsible, a project stalls. We keep both the pace and the quality in our own hands.'))}
      <div class="why__img reveal">${img('uitbouw-baksteen-stalen-deuren', { sizes: '(max-width:1024px) 100vw, 45vw' })}</div>
    </div>
    ${pillars(D().WHY)}
  </div>
</section>
${bigCta(tx('een verbouwing', 'a renovation'))}`;
  page(R('services'), {
    title: tx('Diensten: badkamer, aanbouw, tegelwerk & meer | Ideal House', 'Services: bathrooms, extensions, tiling & more | Ideal House'),
    desc: tx('Alle diensten van Ideal House in Rotterdam: badkamerrenovatie, aanbouw en uitbouw, schilderwerk, tegel- en metselwerk, loodgieterswerk, elektra, keukenmontage en dakwerk.',
      'All Ideal House services in Rotterdam: bathroom renovation, extensions, painting, tiling and masonry, plumbing, electrical work, kitchen fitting and roofing.'),
    body, active: 'services', alt: altOf('services'), priority: '0.9', preload: heroPre('aanbouw-glazen-pui-tuinzijde'),
    ld: [breadcrumbLd(cr), { '@type': 'ItemList', itemListElement: D().SERVICES.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: BIZ.url + svcUrl(i), name: s.name })) }],
  });
}

/* ======================================================================
   SERVICE DETAIL
   ====================================================================== */
function storyBlock() {
  const items = tx([
    ['fundering-wapening-aanbouw', 'Fundering', 'Wapening, bekisting en een geïsoleerde vloer als stevige basis.'],
    ['ruwbouw-houten-dakbalken', 'Ruwbouw', 'Metselwerk, staal en dakbalken. Het casco krijgt vorm.'],
    ['uitbouw-kozijnen-geplaatst', 'Kozijnen & dak', 'Puien en dakramen erin, dak erop: de aanbouw staat waterdicht.'],
    ['aanbouw-schuifpui-rotterdam', 'Oplevering', 'Afbouw, elektra en afwerking. Klaar om in te leven.'],
  ], [
    ['fundering-wapening-aanbouw', 'Foundations', 'Reinforcement, formwork and an insulated floor as a solid base.'],
    ['ruwbouw-houten-dakbalken', 'Shell', 'Brickwork, steel and roof beams. The structure takes shape.'],
    ['uitbouw-kozijnen-geplaatst', 'Frames & roof', 'Doors and roof windows in, roof on: the extension is watertight.'],
    ['aanbouw-schuifpui-rotterdam', 'Handover', 'Fit-out, electrics and finishing. Ready to live in.'],
  ]);
  return `<ol class="story">${items.map(([s, t, d], i) => `<li class="reveal" data-d="${i}"><figure>${img(s, { sizes: '(max-width:680px) 50vw, 25vw', w: 480 })}<b>${nn(i)}</b></figure><div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}</ol>`;
}

function serviceDetail(s, i) {
  const S = D().SERVICES;
  const cr = [['Home', R('home')], [tx('Diensten', 'Services'), R('services')], [s.name, svcUrl(i)]];
  const related = [1, 2, 3].map((k) => (i + k) % S.length);
  const body = `
${pageHero({ crumbsList: cr, label: tx('Dienst ', 'Service ') + nn(i), h1: esc(s.h1), lead: esc(s.intro), topic: s.short, media: s.hero, extra: `<ul class="ticks">${tx(['Gratis opname', 'Vaste prijs vooraf', 'Eigen vakmensen'], ['Free survey', 'Fixed price up front', 'Our own craftsmen']).map((c) => `<li>${icon('check')}${c}</li>`).join('')}</ul>` })}
<section class="section">
  <div class="container detail">
    <div>
      <div class="block">
        ${head(tx('Wat wij doen', 'What we do'), tx('Dit valt <em>eronder</em>', 'What\'s <em>included</em>'), '')}
        <ol class="incl reveal">${s.includes.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      </div>
      <div class="block prose dropcap reveal">
        <h2>${tx('Goed om te weten', 'Good to know')}</h2>
        ${s.about.map((p) => `<p>${esc(p)}</p>`).join('')}
      </div>
      <div class="block">
        ${head(tx('Onze aanpak', 'Our approach'), tx('Zo pakken <em>we het aan</em>', 'How we <em>go about it</em>'), '')}
        <ol class="steps4">${s.steps.map(([t, d], k) => `<li class="step4 reveal" data-d="${k % 2}"><b>${nn(k)}</b><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ol>
      </div>
      ${s.story ? `<div class="block">${head(tx('Van fundering tot oplevering', 'From foundations to handover'), tx('Zo groeit <em>een aanbouw</em>', 'How an extension <em>takes shape</em>'), '')}${storyBlock()}</div>` : ''}
      <div class="block">
        ${head(tx('In de praktijk', 'In practice'), tx('Werk dat we <em>opleverden</em>', 'Work we have <em>delivered</em>'), '')}
        <div class="grid3">${s.gallery.slice(0, 6).map((g, k) => pcard(g, s.slug, { d: k % 3, sizes: '(max-width:680px) 50vw, 260px' })).join('')}</div>
        <div style="margin-top:30px">${arrowLink(R('projects'), tx('Alle projecten', 'All projects'))}</div>
      </div>
      <div class="block">
        ${head(tx('Vragen', 'Questions'), tx('Veelgestelde <em>vragen</em>', 'Frequently asked <em>questions</em>'), '')}
        ${faqList(s.faqs)}
      </div>
    </div>
    <aside class="sidebar" aria-label="${tx('Offerte en andere diensten', 'Quote and other services')}">
      <div class="side-cta">
        <span class="label">${tx('Gratis offerte', 'Free quote')}</span>
        <h2>${tx('Vraag vrijblijvend een prijs aan', 'Request a no-obligation price')}</h2>
        <p>${tx(`Bel of app ons over uw ${esc(s.short)}. We plannen een opname op locatie en sturen een gespecificeerde offerte.`, `Call or WhatsApp us about your ${esc(s.short)}. We schedule an on-site survey and send you an itemised quote.`)}</p>
        ${callBtn('btn btn--clay')}
        ${waBtn(s.short, 'btn btn--wa')}
        <a class="btn btn--line-light" href="mailto:${BIZ.email}?subject=${encodeURIComponent(tx('Offerte ', 'Quote ') + s.name)}">${icon('mail')}<span>${tx('E-mail ons', 'Email us')}</span></a>
        <p style="font-size:.85rem">${HOURS_SHORT()}</p>
      </div>
      <nav class="side-nav" aria-label="${tx('Alle diensten', 'All services')}">
        <h3>${tx('Alle diensten', 'All services')}</h3>
        <ul>${S.map((x, k) => `<li><a href="${svcUrl(k)}"${k === i ? ' aria-current="page"' : ''}>${esc(x.name)} ${icon('arrow')}</a></li>`).join('')}</ul>
      </nav>
    </aside>
  </div>
</section>
<section class="section bg-cream" aria-labelledby="rel-title">
  <div class="container">
    <div class="head-row">${head(tx('Andere diensten', 'Other services'), `<span id="rel-title">${tx('Ook handig bij <em>uw verbouwing</em>', 'Also useful for <em>your project</em>')}</span>`, '')}<div class="reveal">${arrowLink(R('services'), tx('Alle diensten', 'All services'))}</div></div>
    ${servicesList(related)}
  </div>
</section>
${bigCta(s.short, tx(`Uw ${esc(s.short)} <em>in goede handen?</em>`, `Your ${esc(s.short)} <em>in good hands?</em>`))}`;
  page(svcUrl(i), {
    title: s.title, desc: s.desc, body, active: 'svc', alt: { nl: svcUrl(i, 'nl'), en: svcUrl(i, 'en') }, priority: '0.9',
    preload: heroPre(s.hero),
    ld: [breadcrumbLd(cr), {
      '@type': 'Service', '@id': BIZ.url + svcUrl(i) + '#service', name: s.name, serviceType: s.name, description: s.intro,
      url: BIZ.url + svcUrl(i), image: BIZ.url + large(s.hero), provider: { '@id': ORG_ID },
      areaServed: CITIES.map((c) => ({ '@type': 'City', name: c })),
      hasOfferCatalog: { '@type': 'OfferCatalog', name: s.name, itemListElement: s.includes.map((x) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: x } })) },
    }, faqLd(s.faqs)],
  });
}

/* ======================================================================
   PROJECTS
   ====================================================================== */
function projects() {
  const cr = [['Home', R('home')], [tx('Projecten', 'Projects'), R('projects')]];
  const order = ['aanbouw', 'badkamer', 'dakwerk', 'afbouw', 'uitvoering'];
  const list = [...PHOTOS].sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat));
  const counts = Object.fromEntries(order.map((c) => [c, PHOTOS.filter((p) => p.cat === c).length]));
  const body = `
${pageHero({ crumbsList: cr, label: 'Portfolio', h1: tx('Projecten in Rotterdam <em>en omgeving</em>', 'Projects in Rotterdam <em>and beyond</em>'), lead: tx('Aanbouwen, badkamers, toiletten, dakkapellen en meer: van ruwbouw tot de laatste afwerking. Klik op een foto om hem groot te bekijken.', 'Extensions, bathrooms, toilets, dormers and more: from the shell to the final finish. Click a photo to view it full size.'), topic: tx('een project zoals op jullie website', 'a project like the ones on your website') })}
<section class="section">
  <div class="container">
    <div class="filters" role="group" aria-label="${tx('Filter projecten', 'Filter projects')}">
      <button class="filter" type="button" data-filter="alle" aria-pressed="true">${tx('Alle', 'All')}<span>${PHOTOS.length}</span></button>
      ${order.map((c) => `<button class="filter" type="button" data-filter="${c}" aria-pressed="false">${D().CATS[c]}<span>${counts[c]}</span></button>`).join('')}
    </div>
    <div class="masonry">${list.map((p, k) => pcard(p.slug, 'portfolio', { d: k % 3, cat: true, sizes: '(max-width:680px) 50vw, 33vw' })).join('\n')}</div>
  </div>
</section>
${bigCta(tx('een project', 'a project'), tx('Zelf zoiets <em>in gedachten?</em>', 'Planning something <em>similar?</em>'))}`;
  page(R('projects'), {
    title: tx('Projecten: aanbouw, badkamer & dakkapel | Ideal House', 'Projects: extensions, bathrooms & dormers | Ideal House'),
    desc: tx('Bekijk projecten van Ideal House: aanbouwen met schuifpui, badkamers met inloopdouche, toiletten, dakkapellen en meer. Gerealiseerd in Rotterdam en omgeving.',
      'See projects by Ideal House: extensions with sliding doors, bathrooms with walk-in showers, toilets, dormers and more. Completed in and around Rotterdam.'),
    body, active: 'projects', alt: altOf('projects'), priority: '0.8',
    ld: [breadcrumbLd(cr), { '@type': 'ImageGallery', name: tx('Projecten Ideal House', 'Ideal House projects'), image: list.map((p) => ({ '@type': 'ImageObject', contentUrl: BIZ.url + large(p.slug), name: pt(p.slug).title, description: pt(p.slug).alt })) }],
  });
}

/* ======================================================================
   PROCESS
   ====================================================================== */
function werkwijze() {
  const cr = [['Home', R('home')], [tx('Werkwijze', 'How we work'), R('process')]];
  const promises = tx(
    [['euro', 'Vaste aanneemsom', 'Een gespecificeerde offerte met een vaste prijs. Meerwerk alleen na overleg en schriftelijk vastgelegd.'],
     ['calendar', 'Concrete planning', 'Startdatum en doorlooptijd staan vooraf vast. Dreigt er vertraging, dan hoort u dat direct.'],
     ['sparkle', 'Elke dag opgeruimd', 'We dekken vloeren af, werken stofarm en laten de werkplek elke dag netjes achter.'],
     ['shield', 'Garantie op het werk', 'Op ons werk geeft Ideal House garantie. Termijn en voorwaarden staan in de offerte.']],
    [['euro', 'Fixed contract price', 'An itemised quote with a fixed price. Extra work only after discussion and confirmed in writing.'],
     ['calendar', 'Concrete planning', 'Start date and duration are agreed up front. If a delay looms, you hear about it straight away.'],
     ['sparkle', 'Tidy every day', 'We cover floors, work low-dust and leave the site neat at the end of every day.'],
     ['shield', 'Guarantee on our work', 'Ideal House guarantees its work. The term and conditions are stated in the quote.']]);
  const body = `
${pageHero({ crumbsList: cr, label: tx('Werkwijze', 'How we work'), h1: tx('Van eerste telefoontje <em>tot oplevering</em>', 'From first call <em>to handover</em>'), lead: tx('Een verbouwing hoeft niet ingewikkeld te zijn. We werken in zes duidelijke stappen, met vaste afspraken en één aanspreekpunt.', 'A renovation doesn\'t have to be complicated. We work in six clear steps, with firm agreements and one point of contact.'), topic: tx('jullie werkwijze', 'your process'), media: 'uitbouw-openslaande-tuindeuren' })}
<section class="section light">
  <div class="container process">
    <div class="process__aside">${head(tx('In zes stappen', 'In six steps'), tx('Zo verloopt <em>een project</em>', 'How a project <em>unfolds</em>'), '')}<div class="photo reveal" style="aspect-ratio:4/3">${img('strak-stucwerk-lichtstraat', { sizes: '(max-width:1024px) 100vw, 40vw' })}</div></div>
    ${timeline(D().STEPS)}
  </div>
</section>
<section class="section bg-cream">
  <div class="container">
    ${head(tx('Van fundering tot oplevering', 'From foundations to handover'), tx('Zo groeit <em>een aanbouw</em>', 'How an extension <em>takes shape</em>'), tx('Ook tijdens de bouw houden we u op de hoogte. Zo ziet een aanbouw er in de verschillende fases uit.', 'We keep you informed throughout construction. This is what an extension looks like at each stage.'))}
    ${storyBlock()}
  </div>
</section>
<section class="section">
  <div class="container">
    ${head(tx('Onze afspraken', 'Our promises'), tx('Waar u <em>op kunt rekenen</em>', 'What you can <em>count on</em>'), '', { center: true })}
    <ul class="pillars pillars--4">${promises.map(([ic, t, d], k) => `<li class="pillar reveal" data-d="${k}"><span class="ico">${icon(ic)}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ul>
  </div>
</section>
${bigCta(tx('een verbouwing', 'a renovation'))}`;
  page(R('process'), {
    title: tx('Werkwijze | Zo verloopt uw verbouwing | Ideal House', 'How we work | Your renovation step by step | Ideal House'),
    desc: tx('Zo werkt Ideal House: kennismaking, opname op locatie, offerte met vaste prijs, planning, uitvoering en oplevering. Eén aanspreekpunt van begin tot eind.',
      'How Ideal House works: introduction, on-site survey, fixed-price quote, planning, execution and handover. One point of contact from start to finish.'),
    body, active: 'process', alt: altOf('process'), preload: heroPre('uitbouw-openslaande-tuindeuren'),
    ld: [breadcrumbLd(cr), { '@type': 'HowTo', name: tx('Zo verloopt een verbouwing bij Ideal House', 'How a renovation with Ideal House works'), step: D().STEPS.map(([, t, d], k) => ({ '@type': 'HowToStep', position: k + 1, name: t, text: d })) }],
  });
}

/* ======================================================================
   ABOUT
   ====================================================================== */
function companyData() {
  return `<dl class="kv reveal">
  <dt>${tx('Handelsnaam', 'Trade name')}</dt><dd>${BIZ.name}</dd>
  <dt>${tx('Eigenaar', 'Owner')}</dt><dd>${BIZ.owner}</dd>
  <dt>${tx('Adres', 'Address')}</dt><dd>${BIZ.street}, ${BIZ.zip} ${BIZ.city}</dd>
  <dt>${tx('KvK-nummer', 'Chamber of Commerce (KvK)')}</dt><dd>${BIZ.kvk}</dd>
  <dt>${tx('Btw-identificatienummer', 'VAT number')}</dt><dd>${BIZ.btw}</dd>
  <dt>${tx('Telefoon', 'Phone')}</dt><dd><a href="tel:${BIZ.tel}">${BIZ.phone}</a></dd>
  <dt>${tx('E-mail', 'Email')}</dt><dd><a href="mailto:${BIZ.email}">${BIZ.email}</a></dd>
</dl>`;
}
function overOns() {
  const cr = [['Home', R('home')], [tx('Over ons', 'About'), R('about')]];
  const values = tx(
    [['Vakmanschap boven snelheid', 'Een voeg die niet strak is, gaat u jarenlang zien. Daarom nemen we de tijd voor de details die het verschil maken, ook als niemand meekijkt.'],
     ['Zeggen wat we doen', 'We beloven geen dingen die niet haalbaar zijn. Kan iets niet binnen uw budget of planning, dan zeggen we dat meteen en zoeken we een alternatief.'],
     ['Uw huis blijft uw huis', 'We werken bij mensen thuis. Dat betekent schoenen uit waar nodig, vloeren afdekken, opruimen en rekening houden met uw dagelijkse routine.']],
    [['Craftsmanship over speed', 'A joint that isn\'t straight is something you\'ll see for years. So we take time for the details that make the difference, even when nobody is watching.'],
     ['Saying what we do', 'We don\'t promise what isn\'t achievable. If something doesn\'t fit your budget or schedule, we say so straight away and look for an alternative.'],
     ['Your home stays your home', 'We work in people\'s homes. That means shoes off where needed, covering floors, tidying up and respecting your daily routine.']]);
  const body = `
${pageHero({ crumbsList: cr, label: tx('Over ons', 'About us'), h1: tx('Een vast team voor <em>uw hele verbouwing</em>', 'One dedicated team for <em>your entire renovation</em>'), lead: tx('Ideal House is een renovatiebedrijf uit Rotterdam. We werken voor particulieren, verhuurders en VvE\'s in de hele regio en voeren de meeste vakgebieden zelf uit.', 'Ideal House is a renovation company from Rotterdam. We work for homeowners, landlords and owners\' associations across the region, and carry out most trades ourselves.'), topic: tx('een verbouwing', 'a renovation'), media: 'serre-aanbouw-staal-glas' })}
<section class="section">
  <div class="container split">
    <div>
      ${head(tx('Wie wij zijn', 'Who we are'), tx('Van klus tot <em>compleet renovatiebedrijf</em>', 'From odd jobs to <em>full renovation company</em>'), '')}
      <div class="prose dropcap reveal">
        ${tx(`<p>Ideal House is opgericht door ${BIZ.owner} en werkt vanuit Rotterdam voor particuliere woningeigenaren, verhuurders en VvE's in Zuid-Holland. Wat begon met tegel- en installatiewerk groeide uit tot een bedrijf dat complete renovaties verzorgt.</p>
        <p>Die groei was een bewuste keuze. Te vaak vielen projecten stil omdat de loodgieter moest wachten op de tegelzetter, of voelde niemand zich verantwoordelijk als iets niet klopte. Door de vakgebieden zelf in huis te halen, houden we het tempo én de kwaliteit in eigen hand.</p>
        <p>Inmiddels voeren we badkamers, toiletten, aanbouwen, tegelwerk, schilderwerk, loodgieterswerk, elektra en dakwerk uit. Alles met één planning en één aanspreekpunt.</p>`,
        `<p>Ideal House was founded by ${BIZ.owner} and works from Rotterdam for homeowners, landlords and owners' associations in South Holland. What started with tiling and installation work grew into a company that handles complete renovations.</p>
        <p>That growth was a deliberate choice. Too often projects stalled because the plumber had to wait for the tiler, or nobody felt responsible when something wasn't right. By bringing the trades in-house, we keep both pace and quality in our own hands.</p>
        <p>Today we handle bathrooms, toilets, extensions, tiling, painting, plumbing, electrical work and roofing. All on one schedule, with one point of contact. And yes: we are happy to work in English.</p>`)}
      </div>
    </div>
    <div class="photo reveal" data-d="2">${img('badkamer-wastafelmeubel-ovale-spiegel', { sizes: '(max-width:1024px) 100vw, 50vw' })}</div>
  </div>
</section>
<section class="section bg-cream">
  <div class="container">
    ${head(tx('Waar wij voor staan', 'What we stand for'), tx('Drie dingen die we <em>serieus nemen</em>', 'Three things we take <em>seriously</em>'), '', { center: true })}
    <ol class="values">${values.map(([t, d], k) => `<li class="value reveal" data-d="${k}"><b>${nn(k)}</b><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
  </div>
</section>
<section class="section">
  <div class="container split split--top">
    <div>${head(tx('Bedrijfsgegevens', 'Company details'), tx('Formeel <em>geregeld</em>', 'Properly <em>registered</em>'), tx('Ideal House staat ingeschreven bij de Kamer van Koophandel. Hier vindt u onze officiële gegevens.', 'Ideal House is registered with the Dutch Chamber of Commerce (KvK). Here are our official details.'))}<div class="reveal">${arrowLink(R('contact'), tx('Naar contact', 'Go to contact'))}</div></div>
    ${companyData()}
  </div>
</section>
${bigCta(tx('een verbouwing', 'a renovation'))}`;
  page(R('about'), {
    title: tx('Over ons | Renovatiebedrijf uit Rotterdam | Ideal House', 'About us | Renovation company from Rotterdam | Ideal House'),
    desc: tx('Ideal House is een renovatiebedrijf uit Rotterdam, opgericht door O.I.U. Pulatkhonov. Eigen vakmensen voor badkamers, aanbouw, tegelwerk, elektra en meer. KvK 42060424.',
      'Ideal House is a renovation company from Rotterdam, founded by O.I.U. Pulatkhonov. In-house craftsmen for bathrooms, extensions, tiling, electrics and more. KvK 42060424.'),
    body, active: 'about', alt: altOf('about'), preload: heroPre('serre-aanbouw-staal-glas'),
    ld: [breadcrumbLd(cr), { '@type': 'AboutPage', url: BIZ.url + R('about'), mainEntity: { '@id': ORG_ID } }],
  });
}

/* ======================================================================
   CONTACT & QUOTE
   ====================================================================== */
function contact() {
  const cr = [['Home', R('home')], ['Contact', R('contact')]];
  const body = `
${pageHero({ crumbsList: cr, label: 'Contact', h1: tx('Laten we <em>kennismaken</em>', 'Let\'s <em>talk</em>'), lead: tx('Een vraag of een offerte nodig? Bel, app of mail ons. Geen formulieren, gewoon direct contact. We reageren meestal dezelfde werkdag.', 'A question or need a quote? Call, WhatsApp or email us. No forms, just direct contact. We usually reply the same working day.'), topic: false })}
<section class="section">
  <div class="container split split--top">
    <div>
      ${head(tx('Direct contact', 'Direct contact'), tx('Kies wat u <em>het prettigst vindt</em>', 'Choose what <em>suits you best</em>'), tx('Tip: stuur via WhatsApp meteen een paar foto\'s van de situatie mee, dan kunnen we sneller een inschatting maken.', 'Tip: send a few photos of the situation via WhatsApp, so we can give you an estimate faster.'))}
      <div class="reveal">${contactRows('', true)}</div>
    </div>
    <div style="display:grid;gap:18px">
      <div class="mapcard reveal"><span class="label">${tx('Vestiging', 'Office')}</span><strong>${BIZ.street}<br>${BIZ.zip} ${BIZ.city}</strong><a class="btn btn--clay btn--sm" href="${BIZ.maps}" target="_blank" rel="noopener">${icon('pin')}<span>${tx('Bekijk op Google Maps', 'View on Google Maps')}</span></a></div>
      <div class="note-card reveal" data-d="1"><h2 style="font-size:1.6rem">${tx('Bereikbaarheid', 'Opening hours')}</h2><dl class="hours">${HOURS().map(([d, h]) => `<dt>${d}</dt><dd>${h}</dd>`).join('')}</dl><p style="font-size:.93rem;color:var(--muted)">${tx('Werken we op dat moment op een project, dan bellen we u zo snel mogelijk terug.', 'If we\'re busy on a project, we\'ll call you back as soon as possible.')}</p></div>
    </div>
  </div>
</section>
<section class="section bg-cream">
  <div class="container split split--top">
    <div>${head(tx('Bedrijfsgegevens', 'Company details'), tx('Ideal House <em>in het kort</em>', 'Ideal House <em>at a glance</em>'), tx('Handig voor uw administratie of om ons te controleren bij de Kamer van Koophandel.', 'Useful for your records, or to look us up at the Chamber of Commerce.'))}</div>
    ${companyData()}
  </div>
</section>
${areaSection()}`;
  page(R('contact'), {
    title: tx('Contact | Bel, app of mail Ideal House Rotterdam', 'Contact | Call, WhatsApp or email Ideal House Rotterdam'),
    desc: tx('Contact met Ideal House: bel of app 06 34 71 49 09 of mail idealhousenl@gmail.com. Schiekade 10B, 3032 AJ Rotterdam. Ma–vr 08:00–18:00, za 09:00–16:00.',
      'Contact Ideal House: call or WhatsApp +31 6 34 71 49 09 or email idealhousenl@gmail.com. Schiekade 10B, 3032 AJ Rotterdam. Mon–Fri 08:00–18:00, Sat 09:00–16:00.'),
    body, active: 'contact', alt: altOf('contact'), priority: '0.8',
    ld: [breadcrumbLd(cr), { '@type': 'ContactPage', url: BIZ.url + R('contact'), mainEntity: { '@id': ORG_ID } }],
  });
}

function offerte() {
  const cr = [['Home', R('home')], [tx('Gratis offerte', 'Free quote'), R('quote')]];
  const GF = D().GENERAL_FAQS;
  const tips = tx(
    [['ruler', 'De ruimte en de globale afmetingen'], ['wrench', 'Wat u precies wilt laten doen'], ['calendar', 'Wanneer u het werk graag ingepland ziet'], ['camera', 'Een paar foto\'s van de huidige situatie'], ['pin', 'De plaats of het adres van de werklocatie']],
    [['ruler', 'The room and its rough dimensions'], ['wrench', 'What exactly you want done'], ['calendar', 'When you would like the work scheduled'], ['camera', 'A few photos of the current situation'], ['pin', 'The town or address of the property']]);
  const body = `
${pageHero({ crumbsList: cr, label: tx('Gratis offerte', 'Free quote'), h1: tx('Vraag vrijblijvend <em>een offerte aan</em>', 'Request a <em>free quote</em>'), lead: tx('Gratis en u zit nergens aan vast. Bel, app of mail ons over uw plannen. We komen langs voor een opname en u ontvangt een gespecificeerde offerte, meestal binnen twee werkdagen.', 'Free and without obligation. Call, WhatsApp or email us about your plans. We visit for a survey and you receive an itemised quote, usually within two working days.'), topic: false })}
<section class="section">
  <div class="container split split--top">
    <div>
      ${head(tx('Stap 1', 'Step 1'), tx('Neem <em>contact</em> op', 'Get in <em>touch</em>'), tx('Via WhatsApp kunt u meteen foto\'s meesturen.', 'Via WhatsApp you can send photos straight away.'))}
      <div class="reveal">${contactRows(tx('een offerte', 'a quote'), true)}</div>
    </div>
    <div class="note-card reveal" data-d="2">
      <h2 style="font-size:1.7rem">${tx('Handig om te vermelden', 'Useful to mention')}</h2>
      <ul class="checklist">${tips.map(([ic, t]) => `<li><span class="ico">${icon(ic)}</span><span>${t}</span></li>`).join('')}</ul>
    </div>
  </div>
</section>
<section class="section bg-ink">
  <div class="container process">
    <div class="process__aside">${head(tx('Hoe het verder gaat', 'What happens next'), tx('Van aanvraag <em>tot offerte</em>', 'From request <em>to quote</em>'), '')}</div>
    ${timeline(D().STEPS.slice(0, 3))}
  </div>
</section>
<section class="section">
  <div class="container faq-wrap">
    <div class="faq-aside">${head(tx('Vragen over de offerte', 'Questions about quotes'), tx('Goed om <em>te weten</em>', 'Good to <em>know</em>'), '')}</div>
    ${faqList([GF[0], GF[2], GF[3], GF[7]])}
  </div>
</section>`;
  page(R('quote'), {
    title: tx('Gratis offerte aanvragen | Ideal House Rotterdam', 'Request a free quote | Ideal House Rotterdam'),
    desc: tx('Vraag gratis en vrijblijvend een offerte aan bij Ideal House. Bel of app 06 34 71 49 09 of mail ons. Opname op locatie en een gespecificeerde offerte met vaste prijs.',
      'Request a free, no-obligation quote from Ideal House. Call or WhatsApp +31 6 34 71 49 09 or email us. On-site survey and an itemised fixed-price quote.'),
    body, active: 'quote', alt: altOf('quote'), priority: '0.9',
    ld: [breadcrumbLd(cr)],
  });
}

/* ======================================================================
   FAQ
   ====================================================================== */
function faqPage() {
  const cr = [['Home', R('home')], [tx('Veelgestelde vragen', 'FAQ'), R('faq')]];
  const S = D().SERVICES;
  const all = [...D().GENERAL_FAQS, ...S.flatMap((s) => s.faqs)];
  const body = `
${pageHero({ crumbsList: cr, label: tx('Veelgestelde vragen', 'FAQ'), h1: tx('Antwoorden op uw <em>vragen over verbouwen</em>', 'Answers to your <em>renovation questions</em>'), lead: tx('Over offertes, planning, vergunningen en garantie, en per vakgebied. Staat uw vraag er niet bij? Bel of app ons gerust.', 'About quotes, planning, permits and guarantees, and per trade. Question not listed? Feel free to call or WhatsApp us.'), topic: tx('een verbouwing', 'a renovation') })}
<section class="section">
  <div class="container detail">
    <div>
      <div class="faq-group"><h2>${tx('Algemeen', 'General')}</h2>${faqList(D().GENERAL_FAQS)}</div>
      ${S.map((s, i) => `<div class="faq-group" id="${s.slug}"><h2>${esc(s.name)}</h2>${faqList(s.faqs)}<div style="margin-top:22px">${arrowLink(svcUrl(i), tx('Meer over ', 'More about ') + esc(s.short))}</div></div>`).join('')}
    </div>
    <aside class="sidebar">
      <div class="side-cta">
        <span class="label">${tx('Persoonlijk advies', 'Personal advice')}</span>
        <h2>${tx('Liever direct antwoord?', 'Prefer a direct answer?')}</h2>
        <p>${tx('We denken graag telefonisch met u mee.', 'We are happy to talk it through on the phone.')}</p>
        ${callBtn('btn btn--clay')}
        ${waBtn('', 'btn btn--wa')}
      </div>
      <nav class="side-nav" aria-label="${tx('Onderwerpen', 'Topics')}">
        <h3>${tx('Onderwerpen', 'Topics')}</h3>
        <ul>${S.map((s) => `<li><a href="#${s.slug}">${esc(s.name)} ${icon('arrow')}</a></li>`).join('')}</ul>
      </nav>
    </aside>
  </div>
</section>
${bigCta('')}`;
  page(R('faq'), {
    title: tx('Veelgestelde vragen over verbouwen | Ideal House', 'Renovation FAQ | Ideal House Rotterdam'),
    desc: tx('Antwoorden op veelgestelde vragen over verbouwen met Ideal House: offerte, vaste prijs, planning, vergunning voor een aanbouw, garantie en vragen per vakgebied.',
      'Answers to frequently asked questions about renovating with Ideal House: quotes, fixed prices, planning, extension permits, guarantees and questions per trade.'),
    body, active: 'faq', alt: altOf('faq'),
    ld: [breadcrumbLd(cr), faqLd(all)],
  });
}

/* ======================================================================
   LEGAL (Dutch only — content taken over from the previous website)
   ====================================================================== */
function legal(slug, name, desc) {
  const raw = fs.readFileSync(path.join(__dirname, 'legacy', slug + '.html'), 'utf8');
  const lead = ((raw.match(/<\/h1><p[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '').replace(/<!--[\s\S]*?-->/g, '');
  const start = raw.indexOf('<section class="bg-white');
  let content = raw.slice(raw.indexOf('max-w-3xl', start));
  content = content.slice(content.indexOf('>') + 1);
  content = content.slice(0, content.lastIndexOf('</section>')).replace(/(<\/div>\s*){2}$/, '');
  content = content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<div class="rounded-2xl[^"]*"/g, '<div data-note')
    .replace(/\s(class|style)="[^"]*"/g, '')
    .replace(/<div data-note/g, '<div class="note"')
    .replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"');
  const cr = [['Home', '/'], [name, '/' + slug]];
  const body = `
${pageHero({ crumbsList: cr, label: 'Juridisch', h1: esc(name), lead, topic: false })}
<section class="section"><div class="container"><div class="prose">${content}</div></div></section>`;
  page('/' + slug, { title: `${name} | Ideal House`, desc, body, active: 'legal', priority: '0.3', alt: { nl: '/' + slug }, ld: [breadcrumbLd(cr)] });
}

function notFound() {
  const body = `<section class="notfound"><div class="container" style="display:grid;gap:22px;justify-items:center">
  <b>404</b>
  <h1 class="d2">Pagina niet gevonden <em>· Page not found</em></h1>
  <p class="lead">Deze pagina bestaat niet (meer). This page does not exist.</p>
  <div class="btn-row" style="justify-content:center"><a class="btn btn--clay" href="/">Naar de homepage</a><a class="btn btn--line" href="/en">English homepage</a></div>
</div></section>`;
  fs.writeFileSync(path.join(OUT, '404.html'), layout({ url: '/404', title: 'Pagina niet gevonden | Ideal House', desc: 'Deze pagina bestaat niet.', body, robots: 'noindex,follow', alt: { nl: '/', en: '/en' } }));
}

/* ======================================================================
   BUILD
   ====================================================================== */
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'src/style.css'), path.join(OUT, 'assets/style.css'));
fs.copyFileSync(path.join(__dirname, 'src/main.js'), path.join(OUT, 'assets/main.js'));
CSS_V = hash(path.join(OUT, 'assets/style.css'));
JS_V = hash(path.join(OUT, 'assets/main.js'));

for (const l of ['nl', 'en']) {
  LANG = l;
  home();
  servicesIndex();
  D().SERVICES.forEach(serviceDetail);
  projects();
  werkwijze();
  overOns();
  contact();
  offerte();
  faqPage();
}
LANG = 'nl';
legal('privacyverklaring', 'Privacyverklaring', 'Hoe Ideal House omgaat met uw persoonsgegevens volgens de AVG.');
legal('cookiebeleid', 'Cookiebeleid', 'Deze website plaatst geen tracking-, analyse- of advertentiecookies. Lees hoe wij omgaan met cookies.');
legal('algemene-voorwaarden', 'Algemene voorwaarden', 'De algemene voorwaarden van Ideal House voor offertes en werkzaamheden.');
legal('disclaimer', 'Disclaimer', 'Disclaimer voor het gebruik van de website van Ideal House.');
legal('toegankelijkheid', 'Toegankelijkheid', 'Hoe Ideal House werkt aan een toegankelijke website voor iedereen.');
notFound();

// sitemap.xml with hreflang alternates
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map((p) => `  <url>
    <loc>${abs(p.url)}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>${p.priority}</priority>${p.alt && p.alt.en ? `
    <xhtml:link rel="alternate" hreflang="nl" href="${abs(p.alt.nl)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${abs(p.alt.en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(p.alt.nl)}"/>` : ''}
  </url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${BIZ.url}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'site.webmanifest'), JSON.stringify({
  name: 'Ideal House – Renovatie & verbouwing Rotterdam', short_name: 'Ideal House', lang: 'nl', start_url: '/', display: 'standalone',
  background_color: '#fbf9f5', theme_color: '#16191c',
  icons: [{ src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 2));
fs.writeFileSync(path.join(OUT, 'llms.txt'), `# Ideal House

> Renovatiebedrijf in Rotterdam (Zuid-Holland, Nederland) / Renovation company in Rotterdam, the Netherlands. English-speaking. Bathrooms, extensions, painting, tiling and masonry, plumbing and underfloor heating, electrical work and kitchen fitting, roofing. One point of contact, fixed price up front, free quote.

- Address: ${BIZ.street}, ${BIZ.zip} ${BIZ.city}
- Phone/WhatsApp: ${BIZ.phone} (${BIZ.tel})
- Email: ${BIZ.email}
- KvK: ${BIZ.kvk} · VAT: ${BIZ.btw} · Owner: ${BIZ.owner}
- Service area: ${CITIES.join(', ')}

## Diensten (NL)
${DATA.nl.SERVICES.map((s, i) => `- [${s.name}](${BIZ.url}${svcUrl(i, 'nl')}): ${s.card}`).join('\n')}

## Services (EN)
${DATA.en.SERVICES.map((s, i) => `- [${s.name}](${BIZ.url}${svcUrl(i, 'en')}): ${s.card}`).join('\n')}
`);

console.log(`Built ${pages.length} pages + 404 → ${OUT}`);
