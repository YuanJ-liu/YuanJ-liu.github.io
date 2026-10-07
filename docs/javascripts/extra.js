(() => {
  const tocStorageKey = "yuanj-toc-collapsed"

  function renderTocToggle() {
    const sidebar = document.querySelector(".md-sidebar--secondary")
    let button = document.querySelector(".toc-toggle")

    if (!sidebar || sidebar.hasAttribute("hidden")) {
      document.body.classList.remove("has-secondary-toc")
      button?.remove()
      return
    }

    document.body.classList.add("has-secondary-toc")

    if (matchMedia("(min-width: 76.25em) and (hover: hover)").matches) {
      document.body.classList.remove("toc-collapsed")
      button?.remove()
      return
    }

    if (!button) {
      button = document.createElement("button")
      button.className = "toc-toggle"
      button.type = "button"
      document.body.append(button)
    }

    const collapsed = localStorage.getItem(tocStorageKey) === "true"
    document.body.classList.toggle("toc-collapsed", collapsed)

    const syncLabel = () => {
      const isCollapsed = document.body.classList.contains("toc-collapsed")
      button.textContent = isCollapsed ? "‹" : "›"
      button.title = isCollapsed ? "展开右侧目录" : "收起右侧目录"
      button.setAttribute("aria-label", button.title)
      button.setAttribute("aria-expanded", String(!isCollapsed))
    }

    button.onclick = () => {
      const next = !document.body.classList.contains("toc-collapsed")
      document.body.classList.toggle("toc-collapsed", next)
      localStorage.setItem(tocStorageKey, String(next))
      syncLabel()
    }

    syncLabel()
  }

  function renderPageStats() {
    const content = document.querySelector(".md-content__inner")
    const sidebar = document.querySelector(".md-sidebar--secondary")
    const heading = content?.querySelector(":scope > h1")

    if (!content || !heading || !sidebar || sidebar.hasAttribute("hidden")) return
    if (content.querySelector(":scope > .page-stats")) return

    const copy = content.cloneNode(true)
    copy.querySelectorAll("h1, .page-stats, script, style, pre, .mermaid").forEach(node => node.remove())

    const text = copy.textContent.replace(/\s+/g, " ").trim()
    const hanCharacters = text.match(/\p{Script=Han}/gu)?.length ?? 0
    const latinWords = text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0
    const totalUnits = hanCharacters + latinWords
    const codeBlocks = content.querySelectorAll("pre").length
    const figures = content.querySelectorAll(".mermaid, img, .pipeline-snapshot").length
    const readingMinutes = Math.max(
      2,
      Math.ceil(hanCharacters / 120 + latinWords / 80 + codeBlocks * 2 + figures * 1.5)
    )

    const pagePath = location.pathname.endsWith("/") ? location.pathname : `${location.pathname}/`
    const sourceTimestamp = window.__PAGE_UPDATED__?.[pagePath]
    const timestamp = new Date(sourceTimestamp || document.lastModified)
    const hasTimestamp = !Number.isNaN(timestamp.getTime())
    const formattedTimestamp = hasTimestamp
      ? new Intl.DateTimeFormat("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).format(timestamp)
      : null

    const stats = document.createElement("div")
    stats.className = "page-stats"
    stats.setAttribute("aria-label", "章节阅读信息")

    const items = [
      { icon: "📝", text: `约 ${totalUnits.toLocaleString("zh-CN")} 字` },
      { icon: "⌛", text: `预计 ${readingMinutes} 分钟` }
    ]

    if (formattedTimestamp) items.push({ icon: "◷", text: `更新于 ${formattedTimestamp}` })

    for (const item of items) {
      const span = document.createElement("span")
      const icon = document.createElement("span")
      icon.className = "page-stats__icon"
      icon.setAttribute("aria-hidden", "true")
      icon.textContent = item.icon
      span.append(icon, document.createTextNode(item.text))
      stats.append(span)
    }

    heading.insertAdjacentElement("afterend", stats)
  }

  function renderHomeMetadata() {
    const homeCover = document.querySelector(".home-cover")
    document.body.classList.toggle("is-home-page", Boolean(homeCover))
    if (!homeCover) return
  }

  function restrictFooterNavigation() {
    const footer = document.querySelector(".md-footer")
    if (!footer) return

    const parts = location.pathname.split("/").filter(Boolean)
    const courseRoot = parts.length >= 2 ? `/${parts.slice(0, 2).join("/")}/` : null

    footer.querySelectorAll(".md-footer__link").forEach(link => {
      const target = new URL(link.href, location.href)
      const sameCourse = courseRoot && target.pathname.startsWith(courseRoot)
      link.toggleAttribute("hidden", !sameCourse)
    })

  }

  function renderSiteStatistics() {
    const totalWords = document.querySelector("[data-site-words]")
    if (!totalWords) return

    const stats = window.__SITE_STATS__
    if (!stats) return

    const pageCount = document.querySelector("[data-site-pages]")
    const runningDays = document.querySelector("[data-site-days]")
    const updatedAt = document.querySelector("[data-site-updated]")
    const started = new Date(stats.startedAt)
    const updated = new Date(stats.updatedAt)
    const days = Math.max(1, Math.floor((Date.now() - started.getTime()) / 86400000) + 1)

    totalWords.textContent = stats.totalUnits.toLocaleString("zh-CN")
    pageCount.textContent = stats.pageCount.toLocaleString("zh-CN")
    runningDays.textContent = days.toLocaleString("zh-CN")
    updatedAt.textContent = Number.isNaN(updated.getTime())
      ? "—"
      : new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(updated)
  }

  function renderUpdateTimeline() {
    const timeline = document.querySelector("[data-update-timeline]")
    if (!timeline) return

    const entries = Object.entries(window.__PAGE_UPDATED__ ?? {})
      .filter(([route]) => !["/", "/updates/", "/statistics/"].includes(route))
      .map(([route, value]) => ({
        route,
        title: window.__PAGE_TITLES__?.[route] ?? route,
        date: new Date(value)
      }))
      .filter(entry => !Number.isNaN(entry.date.getTime()))
      .sort((left, right) => right.date - left.date)
      .slice(0, 30)

    timeline.replaceChildren()
    const groups = new Map()
    for (const entry of entries) {
      const date = entry.date.toISOString().slice(0, 10)
      if (!groups.has(date)) groups.set(date, [])
      groups.get(date).push(entry)
    }

    for (const [date, pages] of groups) {
      const group = document.createElement("section")
      group.className = "update-group"

      const heading = document.createElement("h2")
      heading.textContent = date
      group.append(heading)

      const list = document.createElement("ul")
      for (const page of pages) {
        const item = document.createElement("li")
        const link = document.createElement("a")
        link.href = page.route
        link.textContent = page.title
        item.append(link)
        list.append(item)
      }
      group.append(list)
      timeline.append(group)
    }
  }

  function renderPageEnhancements() {
    renderTocToggle()
    renderPageStats()
    renderHomeMetadata()
    renderSiteStatistics()
    restrictFooterNavigation()
    renderUpdateTimeline()
  }

  function enableThemeTransition() {
    if (document.documentElement.dataset.themeTransitionReady) return
    document.documentElement.dataset.themeTransitionReady = "true"

    document.addEventListener("click", event => {
      const label = event.target.closest("[data-md-component='palette'] label[for]")
      if (!label) return

      const input = document.getElementById(label.htmlFor)
      if (!input) return

      event.preventDefault()
      const x = `${event.clientX}px`
      const y = `${event.clientY}px`
      document.documentElement.style.setProperty("--theme-transition-x", x)
      document.documentElement.style.setProperty("--theme-transition-y", y)

      if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.startViewTransition(() => input.click())
      } else {
        document.documentElement.classList.add("theme-transition-fallback")
        input.click()
        window.setTimeout(() => {
          document.documentElement.classList.remove("theme-transition-fallback")
        }, 700)
      }
    }, true)
  }

  function enableHeaderAutoHide() {
    if (document.documentElement.dataset.headerAutoHideReady) return
    document.documentElement.dataset.headerAutoHideReady = "true"

    let ticking = false

    const sync = () => {
      const isHome = document.body.classList.contains("is-home-page")
      const currentScroll = window.scrollY
      document.body.classList.toggle("header-hidden", !isHome && currentScroll > 96)
      ticking = false
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(sync)
        ticking = true
      }
    }, { passive: true })

    window.addEventListener("resize", () => {
      document.body.classList.remove("header-hidden")
    }, { passive: true })
  }

  function enableDesktopSidebarReveal() {
    if (document.documentElement.dataset.sidebarRevealReady) return
    document.documentElement.dataset.sidebarRevealReady = "true"
    if (!matchMedia("(min-width: 76.25em) and (hover: hover)").matches) return

    const sidebarSelector = ".md-sidebar--primary"
    const close = () => document.body.classList.remove("sidebar-peek")
    const open = () => document.body.classList.add("sidebar-peek")

    document.addEventListener("pointermove", event => {
      if (document.body.classList.contains("is-home-page")) return
      const sidebar = document.querySelector(sidebarSelector)
      if (!sidebar) return
      const bounds = sidebar.getBoundingClientRect()
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right &&
        event.clientY >= 0 && event.clientY <= window.innerHeight
      if (inside) open()
      else close()
    }, { passive: true })

    document.addEventListener("focusin", event => {
      if (event.target.closest?.(sidebarSelector)) open()
    })

    document.addEventListener("focusout", event => {
      if (!event.relatedTarget?.closest?.(sidebarSelector)) close()
    })

    window.addEventListener("resize", close, { passive: true })
  }

  function enableDesktopTocReveal() {
    if (document.documentElement.dataset.tocRevealReady) return
    document.documentElement.dataset.tocRevealReady = "true"
    if (!matchMedia("(min-width: 76.25em) and (hover: hover)").matches) return

    document.addEventListener("pointermove", event => {
      const sidebar = document.querySelector(".md-sidebar--secondary")
      if (!sidebar || sidebar.hasAttribute("hidden")) return
      const bounds = sidebar.getBoundingClientRect()
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right &&
        event.clientY >= 0 && event.clientY <= window.innerHeight
      document.body.classList.toggle("toc-peek", inside)
    }, { passive: true })

    window.addEventListener("resize", () => {
      document.body.classList.remove("toc-peek")
    }, { passive: true })
  }

  function enableHomeStatsPopover() {
    if (document.documentElement.dataset.homeStatsReady) return
    document.documentElement.dataset.homeStatsReady = "true"

    const close = () => {
      const button = document.querySelector("[data-home-stats-toggle]")
      const popover = document.querySelector("[data-home-stats-popover]")
      if (!button || !popover) return
      popover.hidden = true
      button.setAttribute("aria-expanded", "false")
    }

    document.addEventListener("click", event => {
      const button = event.target.closest("[data-home-stats-toggle]")
      const popover = document.querySelector("[data-home-stats-popover]")

      if (button && popover) {
        const willOpen = popover.hidden
        popover.hidden = !willOpen
        button.setAttribute("aria-expanded", String(willOpen))
        return
      }

      if (!event.target.closest("[data-home-stats-popover]")) close()
    })

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") close()
    })
  }

  enableThemeTransition()
  enableHomeStatsPopover()
  enableHeaderAutoHide()
  enableDesktopSidebarReveal()
  enableDesktopTocReveal()

  if (typeof document$ !== "undefined") {
    document$.subscribe(renderPageEnhancements)
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderPageEnhancements)
  } else {
    renderPageEnhancements()
  }
})()
