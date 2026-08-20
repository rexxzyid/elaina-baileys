const escapeHtml = text => text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

export const slugify = text => text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const inline = text => {
    const codes = []
    let out = text.replace(/`([^`]+)`/g, (_, code) => {
        codes.push(`<code>${escapeHtml(code)}</code>`)
        return "\u0001" + (codes.length - 1) + "\u0001"
    })

    out = escapeHtml(out)
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${href}">${label}</a>`)
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    out = out.replace(/\u0001(\d+)\u0001/g, (_, index) => codes[Number(index)])
    return out
}

const ALERTS = {
    NOTE: 'note',
    TIP: 'tip',
    IMPORTANT: 'important',
    WARNING: 'warning',
    CAUTION: 'caution'
}

const renderTable = rows => {
    const cells = row => row.replace(/^\||\|$/g, '').split('|').map(cell => cell.trim())
    const head = cells(rows[0])
    const body = rows.slice(2).map(cells)
    const headHtml = `<thead><tr>${head.map(cell => `<th>${inline(cell)}</th>`).join('')}</tr></thead>`
    const bodyHtml = `<tbody>${body.map(row => `<tr>${row.map(cell => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`
    return `<div class="table-scroll"><table>${headHtml}${bodyHtml}</table></div>`
}

export const render = source => {
    const lines = source.replaceAll('\r\n', '\n').split('\n')
    const html = []
    const headings = []
    let at = 0

    const flushList = (ordered, items) => {
        const tag = ordered ? 'ol' : 'ul'
        html.push(`<${tag}>${items.map(item => `<li>${inline(item)}</li>`).join('')}</${tag}>`)
    }

    while (at < lines.length) {
        const line = lines[at]

        if (!line.trim()) {
            at++
            continue
        }

        if (line.startsWith('```')) {
            const language = line.slice(3).trim()
            const buffer = []
            at++
            while (at < lines.length && !lines[at].startsWith('```')) buffer.push(lines[at++])
            at++
            const label = language ? `<span class="code-lang">${escapeHtml(language)}</span>` : ''
            html.push(`<div class="code-block">${label}<button class="copy" type="button" data-copy>copy</button><pre><code>${escapeHtml(buffer.join('\n'))}</code></pre></div>`)
            continue
        }

        const heading = line.match(/^(#{1,4})\s+(.*)$/)
        if (heading) {
            const level = heading[1].length
            const text = heading[2].trim()
            const id = slugify(text)
            if (level <= 3) headings.push({ level, text, id })
            html.push(`<h${level} id="${id}">${inline(text)}<a class="anchor" href="#${id}" aria-label="link">#</a></h${level}>`)
            at++
            continue
        }

        if (/^---+$/.test(line.trim())) {
            html.push('<hr>')
            at++
            continue
        }

        if (line.startsWith('>')) {
            const buffer = []
            let kind = null
            while (at < lines.length && lines[at].startsWith('>')) {
                const content = lines[at].replace(/^>\s?/, '')
                const alert = content.match(/^\[!([A-Z]+)\]$/)
                if (alert && ALERTS[alert[1]]) kind = ALERTS[alert[1]]
                else buffer.push(content)
                at++
            }
            const body = buffer.filter(entry => entry.trim()).map(entry => `<p>${inline(entry)}</p>`).join('')
            html.push(kind ? `<div class="alert alert-${kind}"><span class="alert-label">${kind}</span>${body}</div>` : `<blockquote>${body}</blockquote>`)
            continue
        }

        if (line.trim().startsWith('|') && lines[at + 1]?.includes('---')) {
            const buffer = []
            while (at < lines.length && lines[at].trim().startsWith('|')) buffer.push(lines[at++].trim())
            html.push(renderTable(buffer))
            continue
        }

        const bullet = line.match(/^\s*[-*]\s+(.*)$/)
        if (bullet) {
            const items = []
            while (at < lines.length) {
                const entry = lines[at].match(/^\s*[-*]\s+(.*)$/)
                if (!entry) break
                items.push(entry[1])
                at++
            }
            flushList(false, items)
            continue
        }

        const numbered = line.match(/^\s*\d+\.\s+(.*)$/)
        if (numbered) {
            const items = []
            while (at < lines.length) {
                const entry = lines[at].match(/^\s*\d+\.\s+(.*)$/)
                if (!entry) break
                items.push(entry[1])
                at++
            }
            flushList(true, items)
            continue
        }

        const paragraph = []
        while (at < lines.length && lines[at].trim() && !/^(#{1,4}\s|```|>|\||\s*[-*]\s|\s*\d+\.\s|---+$)/.test(lines[at])) {
            paragraph.push(lines[at++])
        }
        if (paragraph.length) html.push(`<p>${inline(paragraph.join(' '))}</p>`)
        else at++
    }

    return { html: html.join('\n'), headings }
}
