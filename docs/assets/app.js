(function () {
    const root = document.documentElement
    const stored = localStorage.getItem('elaina-docs-theme')
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    root.setAttribute('data-theme', stored || system)

    const toggle = document.querySelector('[data-theme-toggle]')
    if (toggle) {
        toggle.addEventListener('click', function () {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
            root.setAttribute('data-theme', next)
            localStorage.setItem('elaina-docs-theme', next)
        })
    }

    const menu = document.querySelector('[data-menu]')
    const sidebar = document.querySelector('[data-sidebar]')
    if (menu && sidebar) {
        menu.addEventListener('click', function () {
            sidebar.classList.toggle('open')
        })
    }

    document.querySelectorAll('[data-copy]').forEach(function (button) {
        button.addEventListener('click', function () {
            const code = button.parentElement.querySelector('code')
            if (!code) return
            navigator.clipboard.writeText(code.textContent).then(function () {
                const previous = button.textContent
                button.textContent = 'copied'
                setTimeout(function () { button.textContent = previous }, 1200)
            })
        })
    })

    const tocLinks = Array.from(document.querySelectorAll('.toc a'))
    if (tocLinks.length && 'IntersectionObserver' in window) {
        const map = new Map()
        tocLinks.forEach(function (link) {
            const target = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)))
            if (target) map.set(target, link)
        })
        let current = null
        const spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return
                const link = map.get(entry.target)
                if (!link) return
                if (current) current.classList.remove('active')
                link.classList.add('active')
                current = link
            })
        }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 })
        map.forEach(function (_link, target) { spy.observe(target) })
    }

    const search = document.getElementById('api-search')
    if (search) {
        const entries = Array.from(document.querySelectorAll('.api-entry'))
        const groups = Array.from(document.querySelectorAll('.api-list'))
        search.addEventListener('input', function () {
            const term = search.value.trim().toLowerCase()
            entries.forEach(function (entry) {
                entry.style.display = !term || entry.dataset.name.includes(term) ? '' : 'none'
            })
            groups.forEach(function (group) {
                const visible = group.querySelector('.api-entry:not([style*="none"])')
                const heading = group.previousElementSibling
                group.style.display = visible ? '' : 'none'
                if (heading && heading.tagName === 'H2') heading.style.display = visible ? '' : 'none'
            })
        })
    }
})()
