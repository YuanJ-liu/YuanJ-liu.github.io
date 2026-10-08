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

    const icons = {
      words: [
        ["path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" }],
        ["path", { d: "m15 5 4 4" }]
      ],
      updated: [
        ["circle", { cx: "12", cy: "12", r: "9" }],
        ["path", { d: "M12 7v5l3 2" }]
      ]
    }

    const createIcon = elements => {
      const namespace = "http://www.w3.org/2000/svg"
      const icon = document.createElementNS(namespace, "svg")
      icon.classList.add("page-stats__icon")
      icon.setAttribute("viewBox", "0 0 24 24")
      icon.setAttribute("fill", "none")
      icon.setAttribute("stroke", "currentColor")
      icon.setAttribute("stroke-width", "2")
      icon.setAttribute("stroke-linecap", "round")
      icon.setAttribute("stroke-linejoin", "round")
      icon.setAttribute("aria-hidden", "true")

      for (const [tag, attributes] of elements) {
        const element = document.createElementNS(namespace, tag)
        for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
        icon.append(element)
      }

      return icon
    }

    const items = [
      { icon: icons.words, text: `约 ${totalUnits.toLocaleString("zh-CN")} 字` }
    ]

    if (formattedTimestamp) items.push({ icon: icons.updated, text: `更新于 ${formattedTimestamp}` })

    for (const item of items) {
      const span = document.createElement("span")
      span.append(createIcon(item.icon), document.createTextNode(item.text))
      stats.append(span)
    }

    heading.insertAdjacentElement("afterend", stats)
  }

  function renderIndexMetadata() {
    document.querySelectorAll(".simple-index").forEach(list => {
      list.querySelectorAll(":scope > li").forEach((item, index) => {
        const link = item.querySelector(":scope > a")
        if (!link || item.querySelector(":scope > .simple-index__meta")) return

        const difficulty = Math.min(5, Math.max(1, Number(item.dataset.difficulty) || Math.min(5, index + 2)))
        const status = item.dataset.status === "complete" || item.dataset.status === "wip"
          ? item.dataset.status
          : index % 3 === 0 ? "complete" : "wip"
        const statusText = status === "complete" ? "完善" : "施工"
        const metadata = document.createElement("span")
        metadata.className = "simple-index__meta"

        const difficultyLabel = document.createElement("span")
        difficultyLabel.className = "simple-index__difficulty"
        difficultyLabel.textContent = `参考难度 ${"★".repeat(difficulty)}${"☆".repeat(5 - difficulty)}`

        const targetPath = new URL(link.href, location.href).pathname
        const targetRoute = targetPath.endsWith("/") ? targetPath : `${targetPath}/`
        const units = window.__PAGE_UNITS__?.[targetRoute]
        const unitsLabel = document.createElement("span")
        unitsLabel.className = "simple-index__units"
        unitsLabel.textContent = Number.isFinite(units)
          ? `约 ${units.toLocaleString("zh-CN")} 字`
          : "约 — 字"
        metadata.setAttribute(
          "aria-label",
          `参考难度 ${difficulty} 星，${unitsLabel.textContent}，状态 ${statusText}`
        )

        const statusLabel = document.createElement("span")
        statusLabel.className = `simple-index__status simple-index__status--${status}`
        statusLabel.textContent = statusText

        metadata.append(difficultyLabel, unitsLabel, statusLabel)
        item.append(metadata)
      })
    })
  }

  function giscusTheme() {
    return document.body.dataset.mdColorScheme === "slate" ? "dark" : "light"
  }

  function syncGiscusTheme() {
    const frame = document.querySelector("iframe.giscus-frame")
    frame?.contentWindow?.postMessage({
      giscus: { setConfig: { theme: giscusTheme() } }
    }, "https://giscus.app")
  }

  function renderComments() {
    const content = document.querySelector(".md-content__inner")
    const sidebar = document.querySelector(".md-sidebar--secondary")
    const existing = document.querySelector(".page-comments")
    const isChapter = content && sidebar && !sidebar.hasAttribute("hidden")

    if (!isChapter) {
      existing?.remove()
      return
    }
    if (existing) return

    const section = document.createElement("section")
    section.className = "page-comments"
    section.setAttribute("aria-labelledby", "page-comments-title")

    const heading = document.createElement("h2")
    heading.id = "page-comments-title"
    heading.textContent = "讨论"

    const description = document.createElement("p")
    description.className = "page-comments__description"
    description.textContent = "发现错误或有补充建议，可以使用 GitHub 账号在这里留言！"

    const host = document.createElement("div")
    host.className = "giscus"

    const script = document.createElement("script")
    script.src = "https://giscus.app/client.js"
    script.async = true
    script.crossOrigin = "anonymous"
    script.dataset.repo = "YuanJ-liu/YuanJ-liu.github.io"
    script.dataset.repoId = "R_kgDOU_XYTQ"
    script.dataset.category = "General"
    script.dataset.categoryId = "DIC_kwDOU_XYTc4DHUlP"
    script.dataset.mapping = "pathname"
    script.dataset.strict = "1"
    script.dataset.reactionsEnabled = "1"
    script.dataset.emitMetadata = "0"
    script.dataset.inputPosition = "top"
    script.dataset.theme = giscusTheme()
    script.dataset.lang = "zh-CN"
    script.dataset.loading = "lazy"

    host.append(script)
    section.append(heading, description, host)
    content.append(section)
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
    renderIndexMetadata()
    renderComments()
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

    const sidebarSelector = ".md-sidebar--primary"
    const desktopHover = matchMedia("(min-width: 76.25em) and (hover: hover)")
    const close = () => document.body.classList.remove("sidebar-peek")
    const open = () => document.body.classList.add("sidebar-peek")

    document.addEventListener("pointermove", event => {
      if (!desktopHover.matches || document.body.classList.contains("is-home-page")) {
        close()
        return
      }
      const sidebar = document.querySelector(sidebarSelector)
      if (!sidebar) return
      const bounds = sidebar.getBoundingClientRect()
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right &&
        event.clientY >= 0 && event.clientY <= window.innerHeight
      if (inside) open()
      else close()
    }, { passive: true })

    document.addEventListener("focusin", event => {
      if (desktopHover.matches && event.target.closest?.(sidebarSelector)) open()
    })

    document.addEventListener("focusout", event => {
      if (!event.relatedTarget?.closest?.(sidebarSelector)) close()
    })

    window.addEventListener("resize", close, { passive: true })
    desktopHover.addEventListener("change", close)
  }

  function enableDesktopTocReveal() {
    if (document.documentElement.dataset.tocRevealReady) return
    document.documentElement.dataset.tocRevealReady = "true"

    const desktopHover = matchMedia("(min-width: 76.25em) and (hover: hover)")
    const close = () => document.body.classList.remove("toc-peek")

    document.addEventListener("pointermove", event => {
      if (!desktopHover.matches) {
        close()
        return
      }
      const sidebar = document.querySelector(".md-sidebar--secondary")
      if (!sidebar || sidebar.hasAttribute("hidden")) return
      const bounds = sidebar.getBoundingClientRect()
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right &&
        event.clientY >= 0 && event.clientY <= window.innerHeight
      document.body.classList.toggle("toc-peek", inside)
    }, { passive: true })

    window.addEventListener("resize", close, { passive: true })
    desktopHover.addEventListener("change", close)
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

  function enableGiscusThemeSync() {
    if (document.documentElement.dataset.giscusThemeReady) return
    document.documentElement.dataset.giscusThemeReady = "true"

    new MutationObserver(syncGiscusTheme).observe(document.body, {
      attributes: true,
      attributeFilter: ["data-md-color-scheme"]
    })
  }

  enableThemeTransition()
  enableHomeStatsPopover()
  enableHeaderAutoHide()
  enableDesktopSidebarReveal()
  enableDesktopTocReveal()
  enableGiscusThemeSync()

  if (typeof document$ !== "undefined") {
    document$.subscribe(renderPageEnhancements)
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderPageEnhancements)
  } else {
    renderPageEnhancements()
  }
})()
