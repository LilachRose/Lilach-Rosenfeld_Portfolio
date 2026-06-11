(function () {
  const data = window.portfolioData;
  const sectionRoot = document.getElementById("sections");
  const modal = document.getElementById("media-modal");
  const modalStage = modal.querySelector(".modal-stage");
  const modalClose = modal.querySelector(".modal-close");
  const nav = document.getElementById("site-nav");
  const menuToggle = document.querySelector(".menu-toggle");
  let galleryItems = [];
  let activeGalleryIndex = 0;

  document.title = data.settings.siteTitle;

  nav.innerHTML = data.settings.nav.map((label) => {
    const section = data.sections.find((item) => item.label === label);
    if (!section) return "";
    if (section.type === "contentHub") {
      return `
        <div class="nav-group">
          <a href="#${section.id}">${escapeHtml(label)}</a>
          <div class="nav-submenu">
            ${marketingBlocks(section).map((block) => `<a href="#${block.id}">${escapeHtml(block.title)}</a>`).join("")}
          </div>
        </div>
      `;
    }
    return `<a href="#${section.id}">${escapeHtml(label)}</a>`;
  }).join("");

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    document.body.classList.toggle("nav-open", !isOpen);
  });

  nav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link) {
      activatePanelFromHash(link.getAttribute("href"));
      menuToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    }
  });

  document.querySelector(".hero").innerHTML = `
    <div class="hero-copy reveal">
      <p class="section-label">${escapeHtml(data.hero.subtitle)}</p>
      <h1>${lineBreakTitle(data.hero.title)}</h1>
      ${data.hero.tagline ? `<p class="hero-tagline">${escapeHtml(data.hero.tagline)}</p>` : ""}
      <div class="hero-actions">
        <a class="button" href="#projects">View Work</a>
        <a class="button secondary" href="#contact">Contact</a>
      </div>
    </div>
    <figure class="hero-media reveal">
      <img src="${attr(data.hero.image)}" alt="${attr(data.hero.imageAlt)}">
    </figure>
  `;

  const orderedSections = data.settings.nav
    .map((label) => data.sections.find((section) => section.label === label))
    .filter(Boolean);

  sectionRoot.innerHTML = orderedSections.map(renderSection).join("");
  galleryItems = collectGalleryItems();

  setupHubTabs();
  syncAllHubPanels();
  setupMediaActions();
  setupReveal();
  activatePanelFromHash(window.location.hash);
  window.addEventListener("hashchange", () => activatePanelFromHash(window.location.hash));
  window.addEventListener("resize", syncAllHubPanels);

  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
    if (!modal.hidden && modal.querySelector(".modal-card.image") && event.key === "ArrowRight") {
      openImageModal(activeGalleryIndex + 1);
    }
    if (!modal.hidden && modal.querySelector(".modal-card.image") && event.key === "ArrowLeft") {
      openImageModal(activeGalleryIndex - 1);
    }
  });

  function renderSection(section) {
    if (section.type === "contentHub") return renderContentHub(section);
    if (section.type === "contact") return renderContact(section);

    const dark = section.type === "brandBlocks";
    return `
      <section id="${attr(section.id)}" class="section ${dark ? "dark" : ""}">
        <div class="section-inner">
          ${renderHeading(section)}
          ${renderBody(section)}
        </div>
      </section>
    `;
  }

  function renderHeading(section, fallbackIntro = "") {
    return `
      <div class="section-heading reveal">
        <div>
          <p class="section-label">${escapeHtml(section.label)}</p>
          <h2>${escapeHtml(section.title)}</h2>
        </div>
      </div>
    `;
  }

  function renderBody(section) {
    const renderers = {
      logos: renderLogos,
      events: renderEvents,
      brandBlocks: renderBrands,
      skills: renderSkills
    };
    return (renderers[section.type] || (() => ""))(section);
  }

  function renderLogos(section) {
    return `
      <div class="logo-grid reveal">
        ${section.logos.map((item) => `
          <a class="logo-card portfolio-link" href="${attr(item.link)}" ${mediaAttrs(item)} data-title="${attr(item.alt)}">
            <img src="${attr(item.image)}" alt="${attr(item.alt)}">
          </a>
        `).join("")}
      </div>
    `;
  }

  function renderContentHub(section) {
    const blocks = marketingBlocks(section);
    return `
      <section id="${attr(section.id)}" class="section dark">
        <div class="section-inner">
          ${renderHeading(section, "Selected work across case studies, articles, social media, and integrated marketing.")}
          <div class="hub-shell reveal">
            <div class="hub-tabs" role="tablist" aria-label="Marketing in Action">
              ${blocks.map((block, index) => `
                <button class="hub-tab ${index === 0 ? "active" : ""}" type="button" role="tab" aria-selected="${index === 0}" aria-controls="panel-${attr(block.id)}" data-panel="${attr(block.id)}">
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <strong>${escapeHtml(block.title)}</strong>
                </button>
              `).join("")}
            </div>
            <div class="hub-panels">
              ${blocks.map((block, index) => `
                <article id="${attr(block.id)}" class="hub-panel ${index === 0 ? "active" : ""}" role="tabpanel" data-panel="${attr(block.id)}">
                  ${renderBlock(block)}
                </article>
              `).join("")}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderBlock(block) {
    const renderers = {
      feature: renderFeature,
      cards: renderCards,
      showcase: renderShowcase,
      integrated: renderIntegrated,
      copy: renderCopyPanel
    };
    return (renderers[block.type] || (() => ""))(block);
  }

  function renderFeature(block) {
    return `
      <div class="feature-card feature-card-link portfolio-link" role="link" tabindex="0" data-href="${attr(block.link)}" ${mediaAttrs(block)} data-title="${attr(block.cta || block.title)}">
        <div class="feature-copy">
          <h3>${escapeHtml(block.title)}</h3>
          <a class="button portfolio-link" href="${attr(block.link)}" ${mediaAttrs(block)} data-title="${attr(block.cta || block.title)}">${escapeHtml(block.cta || "Open")}</a>
        </div>
        <figure class="feature-media">
          <img src="${attr(block.image)}" alt="${attr(block.imageAlt || block.title)}">
        </figure>
      </div>
    `;
  }

  function renderCards(block) {
    return `
      <div class="cards-grid">
        ${block.items.map((item) => `
          <a class="content-card portfolio-link" href="${attr(item.link)}" ${mediaAttrs(item)} data-embed-url="${attr(item.embedUrl || item.link)}" data-title="${attr(item.title)}">
            <figure><img src="${attr(item.image)}" alt="${attr(item.brand || item.title)}"></figure>
            <div class="card-body">
              <span class="meta">${escapeHtml(item.brand || block.label)}</span>
              <h3>${escapeHtml(item.title)}</h3>
            </div>
          </a>
        `).join("")}
      </div>
    `;
  }

  function renderShowcase(block) {
    return `
      <div class="showcase-grid">
        ${block.items.map((item) => `
          ${item.link ? `<a class="showcase-card portfolio-link" href="${attr(item.link)}" ${mediaAttrs(item)} data-title="${attr(item.title)}">` : `<button class="showcase-card image-trigger" type="button" data-image="${attr(item.image)}" data-title="${attr(item.title)}">`}
            <figure><img src="${attr(item.image)}" alt="${attr(item.title)}"></figure>
            <h3>${escapeHtml(item.title)}</h3>
          ${item.link ? "</a>" : "</button>"}
        `).join("")}
      </div>
    `;
  }

  function renderIntegrated(block) {
    return `
      <div class="integrated-groups">
        ${block.groups.map((group) => `
          <div id="${attr(group.id)}" class="integrated-group">
            ${group.title ? `<h3>${escapeHtml(group.title)}</h3>` : ""}
            <div class="copy-grid">
              ${group.items.map((item) => renderCopyItem(item)).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderCopyPanel(block) {
    const group = block.group;
    return `
      <div class="integrated-groups">
        <div id="${attr(group.id)}" class="integrated-group">
          <h3>${escapeHtml(group.title || block.title)}</h3>
          <div class="copy-grid">
            ${group.items.map((item) => renderCopyItem(item)).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function renderCopyItem(item) {
    if (item.storyTitle) {
      return `<div class="copy-card story-break"><h3>${escapeHtml(item.storyTitle)}</h3></div>${renderCopyCard(item)}`;
    }
    return renderCopyCard(item);
  }

  function renderCopyCard(item) {
    const noTitle = !item.title;
    const body = `
      <figure><img src="${attr(item.image)}" alt="${attr(item.title || item.storyTitle || "Portfolio sample")}"></figure>
      ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ""}
    `;
    if (item.link) {
      return `<a class="copy-card portfolio-link ${noTitle ? "no-title" : ""}" href="${attr(item.link)}" data-embed-url="${attr(item.embedUrl || item.link)}" data-title="${attr(item.title || "Open link")}">${body}</a>`;
    }
    return `<button class="copy-card image-trigger ${noTitle ? "no-title" : ""}" type="button" data-image="${attr(item.image)}" data-title="${attr(item.title || item.storyTitle || "Portfolio sample")}">${body}</button>`;
  }

  function renderEvents(section) {
    return `
      <div class="event-grid reveal">
        ${section.items.map((item) => `
          <a class="event-card portfolio-link" href="${attr(item.link)}" ${mediaAttrs(item)} data-title="${attr(item.title)}">
            <figure><img src="${attr(item.image)}" alt="${attr(item.title)}"></figure>
            <h3>${textWithBreaks(item.title)}</h3>
          </a>
        `).join("")}
      </div>
    `;
  }

  function renderBrands(section) {
    return `
      <div class="brand-grid reveal">
        ${section.items.map((item) => `
          <a class="brand-card portfolio-link" href="${attr(item.link)}" ${mediaAttrs(item)} data-embed-url="${attr(item.embedUrl || item.link)}" data-title="${attr(item.title)}">
            <figure><img src="${attr(item.image)}" alt="${attr(item.title)}"></figure>
            <h3>${escapeHtml(item.title)}</h3>
          </a>
        `).join("")}
      </div>
    `;
  }

  function renderSkills(section) {
    return `
      <div class="skills-grid reveal">
        ${section.skills.map((skill) => `
          <article class="skill-card">
            <h3>${escapeHtml(skill.title)}</h3>
            <ul class="skill-list">
              ${skill.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderContact(section) {
    const emailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(section.email)}`;
    const phoneHref = `tel:${section.phone.replace(/[^\d+]/g, "")}`;
    return `
      <section id="${attr(section.id)}" class="section">
        <div class="section-inner">
          <div class="contact-panel reveal">
            <div class="contact-copy">
              <p class="section-label">${escapeHtml(section.label)}</p>
              <h2>${escapeHtml(section.title)}</h2>
              <div class="contact-links">
                <a class="button email-button" href="${attr(emailHref)}" target="_blank" rel="noopener" aria-label="Email Lilach at ${attr(section.email)}">${escapeHtml(section.email)}</a>
                <span class="button secondary contact-phone">${escapeHtml(section.phone)}</span>
              </div>
            </div>
            <figure class="contact-media">
              <img src="${attr(section.image)}" alt="${attr(section.imageAlt)}">
            </figure>
          </div>
        </div>
      </section>
    `;
  }

  function setupHubTabs() {
    document.querySelectorAll(".hub-shell").forEach((shell) => {
      const tabs = Array.from(shell.querySelectorAll(".hub-tab"));
      const panels = Array.from(shell.querySelectorAll(".hub-panel"));
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const id = tab.dataset.panel;
          tabs.forEach((item) => {
            const active = item === tab;
            item.classList.toggle("active", active);
            item.setAttribute("aria-selected", String(active));
          });
          panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === id));
          syncHubPanels(shell);
        });
      });
    });
  }

  function activatePanelFromHash(hash) {
    if (!hash || hash.charAt(0) !== "#") return;
    const id = hash.slice(1);
    const panel = document.querySelector(`.hub-panel[data-panel="${cssEscape(id)}"]`);
    if (!panel) return;
    const shell = panel.closest(".hub-shell");
    const tab = shell.querySelector(`.hub-tab[data-panel="${cssEscape(id)}"]`);
    const tabs = Array.from(shell.querySelectorAll(".hub-tab"));
    const panels = Array.from(shell.querySelectorAll(".hub-panel"));
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    panels.forEach((item) => item.classList.toggle("active", item === panel));
    syncHubPanels(shell);
    window.setTimeout(() => {
      panel.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 60);
  }

  function isMobileLayout() {
    return window.matchMedia("(max-width: 640px)").matches;
  }

  function syncAllHubPanels() {
    document.querySelectorAll(".hub-shell").forEach(syncHubPanels);
  }

  function syncHubPanels(shell) {
    if (!shell) return;
    const tabs = Array.from(shell.querySelectorAll(".hub-tab"));
    const panels = Array.from(shell.querySelectorAll(".hub-panel"));
    const panelBank = shell.querySelector(".hub-panels");
    const activeTab = tabs.find((tab) => tab.classList.contains("active")) || tabs[0];
    if (!activeTab || !panelBank) return;
    const activeId = activeTab.dataset.panel;

    if (isMobileLayout()) {
      panels.forEach((panel) => {
        const isActive = panel.dataset.panel === activeId;
        panel.classList.toggle("active", isActive);
        if (isActive) {
          activeTab.insertAdjacentElement("afterend", panel);
        } else {
          panelBank.appendChild(panel);
        }
      });
      return;
    }

    panels.forEach((panel) => {
      panelBank.appendChild(panel);
      panel.classList.toggle("active", panel.dataset.panel === activeId);
    });
  }

  function setupMediaActions() {
      document.querySelectorAll(".portfolio-link").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (link.classList.contains("feature-card-link") && event.target.closest(".button")) return;
        const href = link.getAttribute("href") || link.dataset.href;
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
        if (link.dataset.externalOnly === "true") return;
        event.preventDefault();
        const title = link.dataset.title || "Portfolio preview";
        const embed = link.dataset.videoEmbed || link.dataset.embedUrl || href;
        if (link.dataset.videoEmbed) {
          const separator = embed.includes("?") ? "&" : "?";
          openModal(`
            <div class="modal-card video">
              <div class="modal-bar"><strong>${escapeHtml(title)}</strong><a href="${attr(href)}" target="_blank" rel="noopener">Open source</a></div>
              <iframe src="${attr(embed)}${separator}autoplay=1&rel=0" title="${attr(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
          `);
          return;
        }
        openModal(`
          <div class="modal-card page">
            <div class="modal-bar"><strong>${escapeHtml(title)}</strong><a href="${attr(href)}" target="_blank" rel="noopener">Open in new tab</a></div>
            <iframe src="${attr(embed)}" title="${attr(title)}"></iframe>
          </div>
        `);
      });
      if (link.classList.contains("feature-card-link")) {
        link.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            link.click();
          }
        });
      }
    });
    document.querySelectorAll(".image-trigger").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const index = galleryItems.findIndex((item) => item.image === trigger.dataset.image);
        openImageModal(index >= 0 ? index : 0);
      });
    });
  }

  function marketingBlocks(section) {
    return section.blocks.flatMap((block) => {
      if (block.type !== "integrated") return [block];
      const integratedGroup = block.groups[0];
      const copyGroup = block.groups[1];
      return [
        { ...block, groups: integratedGroup ? [integratedGroup] : [], title: "Integrated Marketing" },
        { id: copyGroup?.id || "social-media", type: "copy", label: "Copy", title: "Copy", group: copyGroup }
      ].filter((item) => item.type !== "copy" || item.group);
    });
  }

  function collectGalleryItems() {
    return Array.from(document.querySelectorAll(".image-trigger")).map((trigger) => ({
      image: trigger.dataset.image,
      title: trigger.dataset.title || "Portfolio sample"
    }));
  }

  function openImageModal(index) {
    if (!galleryItems.length) return;
    activeGalleryIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[activeGalleryIndex];
    const scrollReadable = /wiz/i.test(item.title || item.image);
    openModal(`
      <div class="modal-card image ${scrollReadable ? "scroll-readable" : ""}">
        <button class="gallery-arrow gallery-prev" type="button" aria-label="Previous image">‹</button>
        <img src="${attr(item.image)}" alt="${attr(item.title)}">
        <button class="gallery-arrow gallery-next" type="button" aria-label="Next image">›</button>
      </div>
    `);
    modal.querySelector(".gallery-prev").addEventListener("click", () => openImageModal(activeGalleryIndex - 1));
    modal.querySelector(".gallery-next").addEventListener("click", () => openImageModal(activeGalleryIndex + 1));
    const imageCard = modal.querySelector(".modal-card.image");
    const swipeSurface = modal.querySelector(".modal-stage");
    let touchStartX = 0;
    let touchStartY = 0;
    swipeSurface.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });
    swipeSurface.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absY > 80 && absY > absX && deltaY > 0) {
        closeModal();
        return;
      }
      if (absX > 60 && absX > absY) {
        openImageModal(deltaX < 0 ? activeGalleryIndex + 1 : activeGalleryIndex - 1);
      }
    }, { passive: true });
  }

  function setupReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("in-view"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    items.forEach((item) => observer.observe(item));
  }

  function setupActiveNav() {
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 });
    sections.forEach((section) => observer.observe(section));
  }

  function openModal(markup) {
    modalStage.innerHTML = markup;
    modalStage.classList.toggle("is-scrollable", markup.includes("scroll-readable"));
    modal.hidden = false;
    document.body.classList.add("lightbox-open");
    modalClose.focus();
  }

  function closeModal() {
    modal.hidden = true;
    modalStage.innerHTML = "";
    modalStage.classList.remove("is-scrollable");
    document.body.classList.remove("lightbox-open");
  }

  function mediaAttrs(item) {
    return [
      item.videoEmbed ? `data-video-embed="${attr(item.videoEmbed)}"` : "",
      item.embedUrl ? `data-embed-url="${attr(item.embedUrl)}"` : "",
      item.openAsPage ? `data-open-as-page="true"` : "",
      item.externalOnly ? `data-external-only="true" target="_blank" rel="noopener"` : ""
    ].filter(Boolean).join(" ");
  }

  function sectionSubtitle(section) {
    const subtitles = {
      Projects: "Selected brand and campaign touchpoints from the existing portfolio.",
      Events: "Live moments, launches, conferences, and cultural experiences.",
      "E-Commerce": "Brand and commerce work presented with a sharper product lens.",
      "Areas of Expertise": "A structured view of strategic, creative, analytical, and operational strengths."
    };
    return subtitles[section.label] || "";
  }

  function lineBreakTitle(text) {
    return escapeHtml(text).replace(/\s+/g, "<br>");
  }

  function textWithBreaks(text) {
    return escapeHtml(text).replace(/\n/g, "<br>");
  }

  function attr(value) {
    return escapeHtml(String(value || ""));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cssEscape(value) {
    if (window.CSS && window.CSS.escape) return window.CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }
})();
