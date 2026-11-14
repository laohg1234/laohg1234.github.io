(() => {
    "use strict";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let keyboardInput = false;
    let statusTimer;
    let statusElement;
    document.addEventListener("pointerdown", () => { keyboardInput = false; }, { passive: true });
    document.addEventListener("keydown", () => { keyboardInput = true; });

    const symbols = {
        search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
        game: '<path d="M7 7h10c3 0 5 11 2 11-2 0-3-3-5-3h-4c-2 0-3 3-5 3-3 0-1-11 2-11Z"/><path d="M7 10v4m-2-2h4m6-1h.01M18 13h.01"/>',
        studio: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9m-5-12 10 6"/>',
        code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16"/>',
        heart: '<path d="M12 20 4 12C-2 5 7 0 12 7c5-7 14-2 8 5l-8 8Z"/>',
        audio: '<path d="M4 9v6m4-10v14m4-16v18m4-15v12m4-9v6"/>',
        folder: '<path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10H3V6Z"/><path d="M3 10h18"/>',
        video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3V9ZM8 2l3 3m5-3-3 3"/>',
        spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
        home: '<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3V10Z"/>',
        arrow: '<path d="M5 19 19 5M5 5h14v14"/>',
        qq: '<path d="M7 9c0-8 10-8 10 0l2 7-3-1-1 4H9l-1-4-3 1 2-7Z"/><path d="M10 8h.01M14 8h.01M10 12h4"/>',
    };
    const sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sprite.setAttribute("aria-hidden", "true");
    sprite.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    sprite.innerHTML = Object.entries(symbols).map(([name, markup]) => `<symbol id="icon-${name}" viewBox="0 0 24 24">${markup}</symbol>`).join("");
    document.body.prepend(sprite);
    const icon = name => `<svg class="ui-icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
    document.querySelectorAll("[data-icon]").forEach(element => { element.innerHTML = icon(element.dataset.icon); });

    function announce(message) {
        if (!statusElement) {
            statusElement = document.createElement("div");
            statusElement.className = "copy-status";
            statusElement.setAttribute("role", "status");
            document.body.append(statusElement);
        }
        clearTimeout(statusTimer);
        statusElement.hidden = false;
        statusElement.textContent = message;
        statusTimer = setTimeout(() => { statusElement.hidden = true; }, 2600);
    }
    function openDialog(dialog) {
        if (!dialog || dialog.open) return;
        dialog.showModal();
        document.documentElement.style.overflow = "hidden";
        if (!reducedMotion.matches && !keyboardInput) {
            dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 170, easing: "cubic-bezier(.22,1,.36,1)" });
        }
    }
    function closeDialog(dialog) { dialog?.close(); }
    function wireDialog(dialog) {
        dialog.addEventListener("close", () => {
            if (!document.querySelector("dialog[open]")) document.documentElement.style.overflow = "";
            dialog.getAnimations().forEach(animation => animation.cancel());
        });
    }
    document.querySelectorAll("dialog").forEach(wireDialog);
    document.addEventListener("click", async event => {
        const button = event.target.closest("[data-copy]");
        if (!button) return;
        const value = button.dataset.copy;
        try { await navigator.clipboard.writeText(value); announce(`已复制：${value}`); }
        catch { announce(`QQ 号：${value}，可选中号码复制`); }
    });
    window.FlavorUI = { openDialog, closeDialog, announce };

    const nav = document.querySelector(".nav-inner");
    if (nav) {
        const destinations = [
            ["home", "个人主页", "黄瓜 LaHG 的一小片互联网", "./"],
            ["studio", "黄瓜味工作室", "游戏、音乐、影像与 FlavorSERV", "./studio"],
            ["code", "软件与工具", "软件、实验和下载", "./app"],
            ["game", "游戏乐园", "经典小游戏与 FlavorWebGames 新游戏中心", "./game"],
            ["audio", "FLAudioViz", "音频可视化制作工具", "./flaudioviz/"],
            ["heart", "赞助中心", "给创作一点继续生长的力量", "./sponsor"],
        ];
        const launch = document.createElement("button");
        launch.className = "quick-launch";
        launch.type = "button";
        launch.setAttribute("aria-label", "打开快捷导航，快捷键 Ctrl 或 Command 加 K");
        launch.innerHTML = '<span aria-hidden="true">⌘ K</span>';
        nav.append(launch);
        const dialog = document.createElement("dialog");
        dialog.className = "modal quick-dialog";
        dialog.setAttribute("aria-labelledby", "quick-title");
        dialog.innerHTML = `<div class="modal-card"><button class="modal-close" type="button" aria-label="关闭快捷导航">×</button><p class="modal-kicker">A SHORTCUT TO SOMEWHERE</p><h2 id="quick-title">想去哪里？</h2><label class="quick-search">${icon("search")}<input type="search" placeholder="搜索页面或工具" aria-label="搜索快捷导航" autocomplete="off"></label><div class="quick-list">${destinations.map(([name,title,description,url])=>`<a href="${url}">${icon(name)}<span>${title}<small>${description}</small></span><span aria-hidden="true">↗</span></a>`).join("")}</div><p class="quick-empty" hidden>这里还没有这个入口，换个词试试。</p><p class="quick-help">↑ ↓ 选择 · Enter 前往 · Esc 关闭</p></div>`;
        document.body.append(dialog);
        wireDialog(dialog);
        const search = dialog.querySelector("input");
        const links = [...dialog.querySelectorAll(".quick-list a")];
        launch.addEventListener("click", () => { openDialog(dialog); search.focus(); });
        dialog.querySelector(".modal-close").addEventListener("click", () => closeDialog(dialog));
        dialog.addEventListener("click", event => {
            if (event.target !== dialog) return;
            const box = dialog.getBoundingClientRect();
            if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog(dialog);
        });
        search.addEventListener("input", () => {
            const query = search.value.trim().toLocaleLowerCase();
            links.forEach(link => { link.hidden = !link.textContent.toLocaleLowerCase().includes(query); });
            dialog.querySelector(".quick-empty").hidden = links.some(link => !link.hidden);
        });
        dialog.addEventListener("keydown", event => {
            const visible = links.filter(link => !link.hidden);
            if (!visible.length) return;
            const index = visible.indexOf(document.activeElement);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const direction = event.key === "ArrowDown" ? 1 : -1;
                const next = index < 0 ? (direction > 0 ? 0 : visible.length - 1) : (index + direction + visible.length) % visible.length;
                visible[next].focus();
            } else if (event.key === "Enter" && document.activeElement === search) { event.preventDefault(); visible[0].click(); }
        });
        document.addEventListener("keydown", event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
                event.preventDefault();
                if (dialog.open) closeDialog(dialog);
                else { openDialog(dialog); search.focus(); }
            }
        });
    }

    const footer = document.querySelector("footer .footer-inner");
    if (footer) {
        const signature = document.createElement("div");
        signature.className = "shell footer-signature";
        signature.innerHTML = '<div class="footer-wordmark">Flavor<span>Studio.</span></div><div><p>好点子，还在生长。</p><a href="./studio">和我们一起，把想法做出来 ↗</a></div>';
        footer.before(signature);
    }
    const topButton = document.createElement("button");
    topButton.className = "back-top";
    topButton.type = "button";
    topButton.hidden = true;
    topButton.setAttribute("aria-label", "返回顶部");
    topButton.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17"/></svg><span aria-hidden="true">↑</span>';
    document.body.append(topButton);
    topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion.matches || keyboardInput ? "instant" : "smooth" }));

    // Only run a frame after scroll/resize. There is no permanent render loop.
    const scenes = [...document.querySelectorAll("[data-scroll-scene]")];
    const previous = new WeakMap();
    let scheduled = false;
    const clamp = value => Math.min(1, Math.max(0, value));
    function renderScroll() {
        scheduled = false;
        const viewport = window.innerHeight;
        const offset = window.innerWidth <= 620 ? 120 : 90;
        const measurements = scenes.map(scene => ({ scene, box: scene.getBoundingClientRect() }));
        const total = document.documentElement.scrollHeight - viewport;
        topButton.hidden = window.scrollY < 440;
        topButton.style.setProperty("--page-progress", String(total > 0 ? clamp(window.scrollY / total) : 0));
        for (const { scene, box } of measurements) {
            const progress = clamp((offset - box.top) / Math.max(1, box.height - viewport));
            if (Math.abs(progress - (previous.get(scene) ?? -1)) < .0005) continue;
            previous.set(scene, progress);
            scene.style.setProperty("--scene-progress", progress.toFixed(4));
            scene.dispatchEvent(new CustomEvent("flavor:scene", { detail: { progress } }));
        }
    }
    function queueScroll() { if (!scheduled) { scheduled = true; requestAnimationFrame(renderScroll); } }
    window.addEventListener("scroll", queueScroll, { passive: true });
    window.addEventListener("resize", queueScroll, { passive: true });
    window.addEventListener("load", queueScroll, { once: true });
    if ("ResizeObserver" in window && document.querySelector("main")) new ResizeObserver(queueScroll).observe(document.querySelector("main"));
    queueScroll();

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(({ target, isIntersecting }) => {
                if (!isIntersecting) return;
                observer.unobserve(target);
                if (!reducedMotion.matches && !keyboardInput) target.animate([{ opacity: .3, transform: "translateY(18px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 450, easing: "cubic-bezier(.22,1,.36,1)" });
            });
        }, { threshold: .12 });
        document.querySelectorAll("[data-reveal]").forEach(element => observer.observe(element));
    }
})();
