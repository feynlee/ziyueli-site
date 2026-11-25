// Build script for the static site. No dependencies. Run: node build.mjs
// Reads: site.config.json, data/apps.json, src/index.template.html
// Writes: index.html, apps/<id>/index.html, sitemap.xml, robots.txt, llms.txt, 404.html, CNAME
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/apps.json'), 'utf8'));

const URL_BASE = (process.env.SITE_URL || cfg.url).replace(/\/$/, '');
const EMAIL = process.env.CONTACT_EMAIL || cfg.email;
const LINKEDIN = cfg.linkedin || '';
const GA4 = process.env.GA4_ID || cfg.ga4 || '';
const BOOKING = cfg.booking || '#contact';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const write = (rel, text) => {
  const f = path.join(root, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text);
};

const pages = data.pages;
const appIds = data.apps.filter((a) => a.id && !a.id.startsWith('http')).map((a) => a.id);

// ---------- shared pieces ----------
const sameAs = ['https://github.com/feynlee', LINKEDIN].filter(Boolean);
// Analytics loads only after a visitor accepts (see assets/consent.js). Without a GA4 ID there is no tracking and no banner.
const consentTag = (rel) => (GA4 ? `<script defer src="${rel}assets/consent.js"></script>` : '');
const cookieLink = GA4 ? '<a href="#" data-cookie-settings>Cookie settings</a>' : '';

const person = {
  '@type': 'Person',
  '@id': `${URL_BASE}/#person`,
  name: 'Ziyue Li',
  jobTitle: 'AI and data consultant, machine learning engineer and app developer',
  description: 'Independent AI and data consultant in Tampa, Florida. Ten years of applied machine learning and data engineering, Ph.D. in physics. Builds machine learning models, data pipelines, AI agents, internal tools and iPhone apps.',
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'North Carolina State University' },
    { '@type': 'CollegeOrUniversity', name: 'University of Science and Technology Beijing' },
  ],
  knowsLanguage: ['English', 'Mandarin Chinese'],
  url: `${URL_BASE}/`,
  address: { '@type': 'PostalAddress', addressLocality: 'Tampa', addressRegion: 'FL', addressCountry: 'US' },
  knowsAbout: ['Machine learning', 'Data engineering', 'Data pipelines', 'AI agents', 'Large language models', 'PyTorch', 'Snowflake', 'AWS', 'Airflow', 'dbt', 'Terraform', 'PySpark', 'Retool', 'Swift and SwiftUI', 'iOS app development'],
  sameAs,
};
if (EMAIL) person.email = EMAIL;

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    person,
    {
      '@type': 'ProfessionalService',
      '@id': `${URL_BASE}/#service`,
      name: 'Ziyue Li, AI and data consulting',
      url: `${URL_BASE}/`,
      founder: { '@id': `${URL_BASE}/#person` },
      areaServed: [{ '@type': 'City', name: 'Tampa' }, { '@type': 'Place', name: 'Worldwide (remote)' }],
      address: { '@type': 'PostalAddress', addressLocality: 'Tampa', addressRegion: 'FL', addressCountry: 'US' },
      availableLanguage: ['English', 'Mandarin Chinese'],
      sameAs,
      description: 'Independent AI and data consulting in Tampa, Florida and remotely anywhere in the world: machine learning, data pipelines, AI agents, internal tools, and technology and AI help for small businesses.',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Services',
        itemListElement: [
          ['AI, data pipelines and machine learning', 'Predictive models, LLM and AI agent projects, ELT and change-data-capture pipelines, analysis and dashboards.'],
          ['Technology and AI for your business', 'Payments, ordering, booking, a website, and AI that saves staff time.'],
          ['Apps and internal tools', 'Customer iPhone apps and enterprise internal tools with automation, ML models and AI.'],
        ].map(([n, d]) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: n, description: d } })),
      },
    },
  ],
};
const jsonLdTag = (obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;

// ---------- home page ----------
let home = fs.readFileSync(path.join(root, 'src/index.template.html'), 'utf8');
const appLinks = appIds.map((id) => `<a href="apps/${id}/">${esc(pages[id].name)}</a>`).join('');
const linkedinLink = LINKEDIN ? `<a href="${esc(LINKEDIN)}" rel="me">LinkedIn</a>` : '';
home = home
  .replaceAll('{{URL}}', URL_BASE)
  .replaceAll('{{EMAIL}}', EMAIL)
  .replaceAll('{{BOOKING}}', BOOKING)
  .replace('{{JSONLD}}', (cfg.gsc ? `<meta name="google-site-verification" content="${esc(cfg.gsc)}">\n` : '') + jsonLdTag(homeJsonLd) + (GA4 ? '\n' + consentTag('') : ''))
  .replaceAll('{{COOKIELINK}}', cookieLink)
  .replace('{{APPLINKS}}', appLinks)
  .replace(/<a href="#" data-todo="linkedin-url">LinkedIn<\/a>/, linkedinLink)
  .replace(/<a href="#" data-todo="linkedin-url" style="color:var\(--text\)">Connect on LinkedIn<\/a>/, LINKEDIN ? `<a href="${esc(LINKEDIN)}" rel="me" style="color:var(--text)">Connect on LinkedIn</a>` : '');
write('index.html', home);

// ---------- app pages ----------
const appPage = (id) => {
  const P = pages[id];
  const url = `${URL_BASE}/apps/${id}/`;
  const title = `${P.name} for iPhone | Ziyue Li`;
  const desc = (data.apps.find((a) => a.id === id)?.summary || P.desc).slice(0, 158);
  const stacked = id === 'longtextpic';
  const shots = P.shots
    .map(([src, cls, alt]) => `<img class="${cls}" src="../../${src}" alt="${esc(alt)}" loading="lazy" decoding="async">`)
    .join('');
  const steps = P.steps.length
    ? `<div class="av-steps">${P.steps.map(([a, b]) => `<div><h2>${esc(a)}</h2><p>${esc(b)}</p></div>`).join('')}</div>`
    : '';
  const links = P.links.map(([a, u]) => `<a href="${u}" rel="noopener">${esc(a)}</a>`).join('');
  const store = P.store ? `<a class="av-btn" href="${P.store}" rel="noopener">Open on the App Store</a>` : '';
  const app = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: P.name,
    operatingSystem: 'iOS',
    applicationCategory: 'UtilitiesApplication',
    description: P.desc,
    url,
    author: { '@id': `${URL_BASE}/#person` },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
  if (P.store) app.downloadUrl = P.store;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${URL_BASE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../../assets/fonts.css">
<link rel="stylesheet" href="../../assets/app.css">
<script>try{var s=localStorage.getItem('zl-style');if(s==='daylight'||s==='midnight')document.documentElement.dataset.style=s}catch(e){}</script>
${jsonLdTag(app)}
${consentTag('../../')}
</head>
<body>
<main class="av">
<a class="back" href="../../#apps">&larr; Back to all apps</a>
<div class="av-hero${stacked ? ' stacked' : ''}"><div>
<p class="av-eyebrow">${esc(P.eyebrow)}</p>
<h1>${esc(P.h)}<br><span>${esc(P.h2)}</span></h1>
<p class="av-desc">${esc(P.desc)}</p>
<div class="av-cta"><p class="av-status">${esc(P.status)}</p>${store}</div>
${P.store && P.qr ? `<a class="av-qr" href="${P.store}" rel="noopener" aria-label="Open ${esc(P.name)} on the App Store"><img src="../../${P.qr}" alt="QR code for ${esc(P.name)} on the App Store" width="112" height="112" loading="lazy"><span>Scan with your iPhone to open the App Store page.</span></a>` : ''}
<div class="av-links"><span>Support: <a href="mailto:${esc(P.email)}">${esc(P.email)}</a></span>${links}</div>
</div><div class="av-shots">${shots}</div></div>
${steps}
</main>
<footer class="site-foot"><a href="../../">Ziyue Li, Tampa, Florida</a><a href="https://github.com/feynlee">GitHub</a>${appIds.map((o) => `<a href="../${o}/">${esc(pages[o].name)}</a>`).join('')}<a href="../../privacy/">Privacy</a>${cookieLink}</footer>
</body>
</html>
`;
};
for (const id of appIds) write(`apps/${id}/index.html`, appPage(id));

// ---------- 404 ----------
write(
  '404.html',
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found | Ziyue Li</title><meta name="robots" content="noindex">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0E1326;color:#E8EBF4;font-family:system-ui,sans-serif;text-align:center;padding:20px}a{color:#FFC46B}</style>
</head><body><main><h1>Page not found</h1><p><a href="/">Go to the home page</a></p></main></body></html>
`
);

// ---------- sitemap, robots, llms.txt, CNAME ----------
const today = new Date().toISOString().slice(0, 10);
const urls = ['/', ...appIds.map((id) => `/apps/${id}/`), '/privacy/', '/resume/'];
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${URL_BASE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${URL_BASE}/sitemap.xml\n`);

const appLine = (a) => {
  const P = a.id && pages[a.id];
  const link = P ? `${URL_BASE}/apps/${a.id}/` : a.id; // Latent Upscale links to GitHub
  return `- [${a.name}](${link}): ${a.summary}`;
};
write(
  'llms.txt',
  `# Ziyue Li

> Ziyue Li is an independent AI and data consultant in Tampa, Florida, working in person in the Tampa area and remotely with clients anywhere in the world. Services: machine learning models, data pipelines, AI agents, internal tools and dashboards, and iPhone apps. Ph.D. in physics, ten years of applied machine learning and data engineering, all the way from data to a working app.

Best fit: any business that needs help with AI, data or software, and teams that need a contract data scientist, machine learning engineer or data engineer for a defined project. My recent work was at a real estate company, and I am open to any industry. Short projects and longer contracts. The first step is a free 30-minute call.${EMAIL ? ` Contact: ${EMAIL}` : ''}

## What I can do for you

- [AI, data pipelines and machine learning](${URL_BASE}/#ai): Predictive models, LLM and AI agent projects (for example Snowflake Cortex agents that let business users ask data questions), ELT and change-data-capture pipelines, analysis and dashboards.
- [Technology and AI for your business](${URL_BASE}/#biz): Payments, ordering, booking, a website, and AI that saves staff time. I explain the options in plain words and set up the one that fits.
- [Apps and internal tools](${URL_BASE}/#apps): Customer-facing iPhone apps and enterprise internal tools that use automation, ML models and AI, such as Retool apps and self-serve data platforms.

## Tools and skills

- ML and AI: Python, PyTorch, fastai, LLMs, Snowflake Cortex agents
- Data: SQL, PySpark, Snowflake, dbt, Airflow, CDC/ELT
- Cloud: AWS (EMR, Lambda, ECS, Glue, Athena), Docker, Terraform
- Apps: Retool, Swift, SwiftUI, HTML, CSS, JavaScript

## Selected results

- Agent termination prediction models: +50% accuracy.
- Rebuilt a core model in PyTorch: +10% accuracy. Restructured its AWS pipeline: -20% cost and time.
- Built pipelines handling 350 GB a month as the only data scientist at a startup.
- Built an in-house data app platform on AWS meant to replace Retool and commercial BI tools.

## Questions people ask

- Who hires Ziyue Li? Businesses that want to save time with AI, and data teams that need contract help on models, pipelines or AI agents.
- Where does Ziyue Li work? From Tampa, Florida, remotely with clients anywhere in the world, and in person in the Tampa area. English and Mandarin.
- Which industries? Recent work was at a real estate company. Open to any industry and any business that needs help.
- How do projects start? With a free 30-minute call, then a short written plan for a defined project or a longer contract.

## Apps I built

${data.apps.map(appLine).join('\n')}

## Contact

- [Book a free 30-minute call](${cfg.booking || URL_BASE + '/#contact'})
- [GitHub](https://github.com/feynlee)
${LINKEDIN ? `- [LinkedIn](${LINKEDIN})\n` : ''}
## Optional

- [Resume](${URL_BASE}/resume/): Experience, skills and projects. PDF: ${URL_BASE}/Ziyue-Li-resume.pdf
- [Work history](${URL_BASE}/#why)
- [Privacy](${URL_BASE}/privacy/)
`
);
if (cfg.domain) write('CNAME', cfg.domain + '\n');

// ---------- consent script (only with a GA4 ID) ----------
if (GA4) {
  write(
    'assets/consent.js',
    `/* Loads Google Analytics only after the visitor accepts. The choice is kept in this browser (localStorage). */
(function () {
  var ID = ${JSON.stringify(GA4)}, KEY = 'zl-consent';
  var me = document.currentScript, root = me ? me.src.replace(/assets\\/consent\\.js.*$/, '') : '/';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function load() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = 1;
    window['ga-disable-' + ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
    document.head.appendChild(s);
  }
  function wipe() {
    window['ga-disable-' + ID] = true;
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n === '_ga' || n.indexOf('_ga_') === 0) {
        var host = location.hostname.split('.');
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        for (var i = 0; i < host.length - 1; i++) document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.' + host.slice(i).join('.');
      }
    });
  }
  function close(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }
  function show() {
    if (document.getElementById('zl-consent')) return;
    var box = document.createElement('div');
    box.id = 'zl-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookie choice');
    box.style.cssText = 'position:fixed;z-index:90;left:max(16px,env(safe-area-inset-left,0px));right:max(16px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));max-width:460px;padding:16px 18px;border-radius:14px;background:var(--bg2,#151B33);color:var(--text,#E8EBF4);border:1px solid var(--line,#2A3354);font:.92rem/1.5 var(--body,system-ui,sans-serif);box-shadow:0 12px 40px -12px rgba(0,0,0,.5)';
    box.innerHTML = '<p style="margin:0 0 12px">This site uses cookies to measure traffic and improve the site. No ads. <a href="' + root + 'privacy/" style="color:inherit">Learn more</a></p><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" data-a="yes" style="cursor:pointer;font:inherit;font-weight:600;padding:9px 18px;border-radius:999px;border:1px solid var(--text,#E8EBF4);background:var(--text,#E8EBF4);color:var(--bg,#0E1326)">Accept</button><button type="button" data-a="no" style="cursor:pointer;font:inherit;font-weight:600;padding:9px 18px;border-radius:999px;border:1px solid var(--text,#E8EBF4);background:transparent;color:var(--text,#E8EBF4)">Decline</button></div>';
    box.addEventListener('click', function (e) {
      var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a');
      if (!a) return;
      if (a === 'yes') { set('granted'); load(); } else { set('denied'); wipe(); }
      close(box);
    });
    document.body.appendChild(box);
  }
  function start() {
    var v = get();
    if (v === 'granted') load(); else if (v !== 'denied') show();
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('[data-cookie-settings]');
      if (!t) return;
      e.preventDefault();
      show();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
`
  );
}

// ---------- privacy page ----------
const contactMail = EMAIL ? `<a href="mailto:${esc(EMAIL)}">${esc(EMAIL)}</a>` : 'the email address on the home page';
const analyticsSection = GA4
  ? `<h2>Analytics (only if you accept)</h2>
<p>I use Google Analytics 4 to see which pages are visited, roughly where visitors are (country and city), and which device and browser they use. It sets cookies named <code>_ga</code> and <code>_ga_</code> followed by an ID. These cookies are set only after you press Accept in the cookie box. If you press Decline, or ignore the box, nothing is loaded and no cookie is set.</p>
<p>Google signals and ad personalization are switched off. Google Analytics 4 does not store full IP addresses. Event data is kept for 2 months. The legal basis is your consent, and you can change your choice at any time with "Cookie settings" in the footer.</p>`
  : `<h2>Analytics</h2><p>This site does not use analytics or tracking cookies.</p>`;
const privacyPage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Privacy | Ziyue Li</title>
<meta name="description" content="What data this site collects, why, who handles it, and how to ask me to change or delete it.">
<link rel="canonical" href="${URL_BASE}/privacy/">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../assets/fonts.css">
<link rel="stylesheet" href="../assets/app.css">
<script>try{var s=localStorage.getItem('zl-style');if(s==='daylight'||s==='midnight')document.documentElement.dataset.style=s}catch(e){}</script>
${consentTag('../')}
</head>
<body>
<main class="av prose">
<a class="back" href="../">&larr; Back to home</a>
<h1>Privacy</h1>
<p class="lead">This site is run by Ziyue Li in Tampa, Florida, USA. It collects as little as it can. Nothing is sold, and nothing is used for advertising. Last updated ${today}.</p>

<h2>Who is responsible</h2>
<p>Ziyue Li, Tampa, Florida, USA. For any request about your data, write to ${contactMail}.</p>

<h2>Visiting this site</h2>
<p>The site is hosted by GitHub Pages. To send you the page, GitHub receives your IP address and browser details, as any web host does. I do not receive these logs. GitHub's own privacy statement applies to them. The fonts are hosted on this site, and there are no ads or third-party trackers.</p>

${analyticsSection}

<h2>Booking a call</h2>
<p>The "Book a 30-minute call" button opens a Google Calendar booking page. You enter your first name, last name and email address. Google processes this data to run the booking page, and I receive it as a calendar event with a Google Meet link. I use it only to arrange the call, hold it and follow up on it. I keep it for as long as needed for the call and for any work that follows, and then delete it. You can ask me to delete it sooner. The legal basis is taking steps at your request before an agreement, and my interest in answering enquiries.</p>

<h2>Email</h2>
<p>If you email me, I read your message and reply. I keep the emails as long as they are needed for the conversation or the work, and then delete them.</p>

<h2>Who receives data</h2>
<p>Google (Calendar and Meet${GA4 ? ', and Analytics if you accept' : ''}) and GitHub (hosting). I do not sell data or share it for advertising. These companies may process data in the United States. They provide their own legal safeguards for transfers from the EU and UK.</p>

<h2>Your rights</h2>
<p>You can ask me for a copy of your data, to correct it, to delete it, to limit or object to how I use it, or to move it. Where I rely on your consent, you can withdraw it at any time. Write to ${contactMail}. I will answer within 30 days. If you are in the EU or UK, you can also complain to your data protection authority. If you live in California, you have similar rights, and I do not sell or share personal information.</p>

<h2>Children</h2>
<p>This site is for businesses and adults. It is not meant for children under 16.</p>

<h2>Apps</h2>
<p>My iPhone apps have their own privacy policies. They are linked from each app page.</p>

<h2>Changes</h2>
<p>If I change this page, I will update the date above.</p>
</main>
<footer class="site-foot"><a href="../">Ziyue Li, Tampa, Florida</a><a href="https://github.com/feynlee">GitHub</a>${LINKEDIN ? `<a href="${esc(LINKEDIN)}" rel="me">LinkedIn</a>` : ''}${cookieLink}</footer>
</body>
</html>
`;
write('privacy/index.html', privacyPage);

// ---------- resume page ----------
const resumeJobs = [
  { when: 'Nov 2026 to now', role: 'Independent Consultant', org: 'Tampa, FL', body: ['Contract machine learning, data engineering and AI agent projects.'] },
  { when: '2020 to 2026', role: 'Data Scientist', org: 'RE/MAX', groups: [
    ['Self-serve data and AI', ['Built an in-house data app platform on AWS with flexible notebooks and dashboards, designed to replace Retool and commercial BI tools and their subscription costs.', 'Built Snowflake Cortex AI agents that let business users ask data questions and get answers themselves.']],
    ["Apps that automate other departments' work", ["Retool apps that automated most manual steps in other departments' workflows.", 'An AI-assisted survey analysis app that turns raw survey responses into insights automatically.', 'A concession tracking app that lets Finance track and automate concession work.']],
    ['Machine learning', ['Built agent termination prediction models: +50% accuracy.', 'Rebuilt the core listing model in PyTorch: +10% accuracy. Restructured its AWS pipeline: -20% cost and time.']],
    ['Data engineering', ['ELT and change-data-capture pipelines into Snowflake, orchestrated with Airflow on AWS; a model experimentation framework; a migration of data and services across AWS accounts.']],
  ] },
  { when: '2016 to 2020', role: 'Data Scientist', org: 'First.io, a startup', body: ['Only data scientist. Built the core predictive model in PySpark and pipelines handling 350 GB a month.'] },
  { when: '2008 to 2015', role: 'Research and Teaching Assistant', org: 'North Carolina State University', body: ['Particle physics research with numerical code; 4 papers.'] },
];
const resumeStats = [['+50%', 'accuracy, agent termination model'], ['+10%', 'accuracy, PyTorch rebuild of core model'], ['-20%', 'cost and time, its AWS pipeline'], ['350 GB', 'a month in pipelines I built, First.io'], ['AI agents', 'internal data platform, Snowflake Cortex']];
const resumeSkills = [['ML and AI', 'Python, PyTorch, fastai, LLMs, Snowflake Cortex agents'], ['Data', 'SQL, PySpark, Snowflake, dbt, Airflow, CDC/ELT'], ['Cloud', 'AWS (EMR, Lambda, ECS, Glue, Athena), Docker, Terraform'], ['Apps', 'Retool, Swift, SwiftUI, HTML/CSS/JS']];
const resumeProjects = [['PassPhoto', 'iOS app on the App Store'], ['BillSplit', 'iOS app for splitting bills'], ['Latent Upscale', 'Stable Diffusion plugin'], ['pikaQ', 'One query, SQL for many dialects']];
const resumeEdu = [['Ph.D., Physics', 'NC State, 2015'], ['Data Science Fellow', 'The Data Incubator, 2016'], ['B.S., Applied Physics', 'USTB, 2008']];
const li = (a) => a.map((t) => `<li>${esc(t)}</li>`).join('');
const resumeJobsHtml = resumeJobs.map((j) => `<article class="rs-job"><div class="rs-when">${esc(j.when)}</div><div><h3>${esc(j.role)}</h3><p class="rs-org">${esc(j.org)}</p>${j.body ? `<ul>${li(j.body)}</ul>` : j.groups.map(([h, b]) => `<h4>${esc(h)}</h4><ul>${li(b)}</ul>`).join('')}</div></article>`).join('\n');
const resumePage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Resume | Ziyue Li</title>
<meta name="description" content="Ziyue Li: data scientist and machine learning engineer. Ten years in industry, Ph.D. in physics. Models, data pipelines and AI agents on AWS and Snowflake.">
<link rel="canonical" href="${URL_BASE}/resume/">
${jsonLdTag({ '@context': 'https://schema.org', '@type': 'ProfilePage', url: `${URL_BASE}/resume/`, mainEntity: person })}
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../assets/fonts.css">
<link rel="stylesheet" href="../assets/app.css">
<script>try{var s=localStorage.getItem('zl-style');if(s==='daylight'||s==='midnight')document.documentElement.dataset.style=s}catch(e){}</script>
${consentTag('../')}
</head>
<body>
<main class="av rs">
<a class="back" href="../">&larr; Back to home</a>
<header class="rs-head">
<h1>Ziyue Li</h1>
<p class="rs-title">Data Scientist and Machine Learning Engineer</p>
<p class="rs-sub">I build machine learning models, data pipelines and internal apps on AWS and Snowflake. Ten years in industry; Ph.D. in physics.</p>
<p class="av-links"><span>Tampa, FL</span>${EMAIL ? `<a href="mailto:${esc(EMAIL)}">${esc(EMAIL)}</a>` : ''}${LINKEDIN ? `<a href="${esc(LINKEDIN)}" rel="me">LinkedIn</a>` : ''}<a href="https://github.com/feynlee">GitHub</a></p>
<p><a class="av-btn" href="../Ziyue-Li-resume.pdf">Download PDF</a></p>
</header>
<section class="rs-stats" aria-label="Highlights">${resumeStats.map(([n, t]) => `<div><b>${esc(n)}</b><span>${esc(t)}</span></div>`).join('')}</section>
<div class="rs-cols">
<section><h2>Experience</h2>
${resumeJobsHtml}
</section>
<aside>
<h2>Skills</h2>${resumeSkills.map(([h, t]) => `<p class="rs-k"><b>${esc(h)}</b>${esc(t)}</p>`).join('')}
<h2>Projects</h2>${resumeProjects.map(([h, t]) => `<p class="rs-k"><b>${esc(h)}</b>${esc(t)}</p>`).join('')}
<h2>Education</h2>${resumeEdu.map(([h, t]) => `<p class="rs-k"><b>${esc(h)}</b>${esc(t)}</p>`).join('')}
<h2>Languages</h2><p class="rs-k">English, Mandarin (native)</p>
</aside>
</div>
</main>
<footer class="site-foot"><a href="../">Ziyue Li, Tampa, Florida</a><a href="../privacy/">Privacy</a>${cookieLink}</footer>
</body>
</html>
`;
write('resume/index.html', resumePage);

console.log(`Built ${urls.length} pages for ${URL_BASE}${EMAIL ? '' : ' (no contact email set)'}`);
