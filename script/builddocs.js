import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { root } from './protobundle.js'
import { render, slugify } from './markdown.js'

const docs = join(root, 'docs')
const out = process.argv[2] || join(root, 'site')
const meta = JSON.parse(readFileSync(join(docs, 'meta.json'), 'utf8'))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const escapeHtml = text => String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const signatureOf = member => member.kind === 'property'
    ? `${member.name}: ${member.type}`
    : `${member.name}(${member.params.map(param => `${param.rest ? '...' : ''}${param.name}${param.optional ? '?' : ''}`).join(', ')})`

const renderApi = (api, language) => {
    const strings = meta.strings[language]
    const sections = []
    sections.push(`<p class="api-meta">${strings.apiIntro
        .replace('{total}', api.total)
        .replace('{version}', escapeHtml(api.version))
        .replace('{date}', api.generated)}</p>`)

    sections.push('<div class="api-filter"><input type="search" id="api-search" placeholder="' + escapeHtml(strings.apiSearch) + '" autocomplete="off"></div>')

    for (const group of api.groups) {
        const id = slugify(group.id)
        sections.push(`<h2 id="${id}">${escapeHtml(group.label)}<a class="anchor" href="#${id}">#</a></h2>`)
        sections.push('<div class="api-list">')
        for (const member of group.members) {
            const params = member.kind === 'method' && member.params.length
                ? `<ul class="api-params">${member.params.map(param => `<li><code>${escapeHtml(param.name)}</code><span class="api-type">${escapeHtml(param.type)}</span>${param.optional ? `<span class="api-flag">${escapeHtml(strings.optional)}</span>` : ''}</li>`).join('')}</ul>`
                : ''
            const returns = member.kind === 'method'
                ? `<p class="api-returns"><span>${escapeHtml(strings.returns)}</span><code>${escapeHtml(member.returns)}</code></p>`
                : `<p class="api-returns"><span>${escapeHtml(strings.type)}</span><code>${escapeHtml(member.type)}</code></p>`
            sections.push(`<article class="api-entry" data-name="${escapeHtml(member.name.toLowerCase())}"><h3 id="${escapeHtml(member.name)}"><code>${escapeHtml(signatureOf(member))}</code><a class="anchor" href="#${escapeHtml(member.name)}">#</a></h3>${params}${returns}</article>`)
        }
        sections.push('</div>')
    }

    sections.push(`<h2 id="module-exports">${escapeHtml(strings.moduleExports)}<a class="anchor" href="#module-exports">#</a></h2>`)
    sections.push(`<p class="api-meta">${strings.exportsIntro.replace('{total}', api.utilityTotal)}</p>`)
    for (const entry of api.utilities) {
        sections.push(`<h3 id="exports-${slugify(entry.module)}">${escapeHtml(entry.module)}<a class="anchor" href="#exports-${slugify(entry.module)}">#</a></h3>`)
        sections.push(`<div class="pill-list">${entry.exports.map(name => `<code>${escapeHtml(name)}</code>`).join('')}</div>`)
    }

    return { html: sections.join('\n'), headings: api.groups.map(group => ({ level: 2, text: group.label, id: slugify(group.id) })) }
}

const layout = ({ language, page, body, headings, api }) => {
    const strings = meta.strings[language]
    const other = language === 'en' ? 'id' : 'en'
    const nav = meta.pages.map(entry => {
        const active = entry.id === page.id ? ' class="active"' : ''
        return `<a href="./${entry.id}.html"${active}>${escapeHtml(entry.title[language])}</a>`
    }).join('')

    const toc = headings.length
        ? `<nav class="toc"><span class="toc-title">${escapeHtml(strings.onThisPage)}</span>${headings
            .filter(heading => heading.level === 2)
            .map(heading => `<a href="#${heading.id}">${escapeHtml(heading.text)}</a>`).join('')}</nav>`
        : ''

    return `<!doctype html>
<html lang="${language}" data-page="${page.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(page.title[language])} — ${escapeHtml(meta.site.name)}</title>
<meta name="description" content="${escapeHtml(page.description[language])}">
<meta property="og:title" content="${escapeHtml(page.title[language])} — ${escapeHtml(meta.site.name)}">
<meta property="og:description" content="${escapeHtml(page.description[language])}">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%92%9C%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="../assets/style.css">
</head>
<body${api ? ' data-api="1"' : ''}>
<a class="skip" href="#content">${escapeHtml(strings.skip)}</a>
<header class="topbar">
  <button class="menu-toggle" type="button" aria-label="Menu" data-menu>☰</button>
  <a class="brand" href="./index.html"><span class="brand-mark">💜</span><span>${escapeHtml(meta.site.name)}</span></a>
  <span class="version">v${escapeHtml(pkg.version)}</span>
  <div class="topbar-actions">
    <a class="lang" href="../${other}/${page.id}.html">${other.toUpperCase()}</a>
    <button class="theme" type="button" data-theme-toggle aria-label="Theme">◐</button>
    <a class="ghlink" href="${escapeHtml(meta.site.repository)}" rel="noreferrer">GitHub</a>
  </div>
</header>
<div class="shell">
  <aside class="sidebar" data-sidebar>
    <nav>${nav}</nav>
    <div class="sidebar-foot">
      <a href="${escapeHtml(meta.site.npm)}" rel="noreferrer">npm</a>
      <a href="${escapeHtml(meta.site.repository)}/blob/main/EXPERIMENTAL.md" rel="noreferrer">EXPERIMENTAL.md</a>
    </div>
  </aside>
  <main id="content">
    ${toc}
    <article class="prose">${body}</article>
    <footer class="page-foot">
      <p>${strings.footer.replace('{repo}', `<a href="${escapeHtml(meta.site.repository)}" rel="noreferrer">GitHub</a>`)}</p>
    </footer>
  </main>
</div>
<script src="../assets/app.js"></script>
</body>
</html>
`
}

if (existsSync(out)) rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'assets'), { recursive: true })

const api = JSON.parse(readFileSync(join(root, 'site-api.json'), 'utf8'))

let written = 0
for (const language of meta.languages) {
    mkdirSync(join(out, language), { recursive: true })
    for (const page of meta.pages) {
        let body
        let headings
        if (page.generated === 'api') {
            const rendered = renderApi(api, language)
            body = rendered.html
            headings = rendered.headings
        }
        else {
            const source = join(docs, language, `${page.id}.md`)
            if (!existsSync(source)) throw new Error(`Missing docs page: ${language}/${page.id}.md`)
            const rendered = render(readFileSync(source, 'utf8'))
            body = rendered.html
            headings = rendered.headings
        }
        writeFileSync(join(out, language, `${page.id}.html`), layout({
            language,
            page,
            body,
            headings,
            api: page.generated === 'api'
        }))
        written++
    }
}

cpSync(join(docs, 'assets'), join(out, 'assets'), { recursive: true })
writeFileSync(join(out, 'api.json'), JSON.stringify(api))
writeFileSync(join(out, '.nojekyll'), '')
writeFileSync(join(out, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(meta.site.name)}</title>
<link rel="canonical" href="./en/index.html">
<meta http-equiv="refresh" content="0; url=./en/index.html">
<script>
const preferred = (navigator.language || 'en').toLowerCase().startsWith('id') ? 'id' : 'en'
location.replace('./' + preferred + '/index.html')
</script>
</head>
<body><p><a href="./en/index.html">English</a> · <a href="./id/index.html">Bahasa Indonesia</a></p></body>
</html>
`)

if (meta.site.domain) writeFileSync(join(out, 'CNAME'), meta.site.domain + '\n')

console.log(`Built ${written} pages into ${out}`)
