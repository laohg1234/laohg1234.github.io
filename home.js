(() => {
    "use strict";
    const greetings = ["泥嚎！", "Hello!", "안녕하세요!", "Bonjour!", "Hallo!", "Привет!", "こんにちは!", "مرحبا!", "Hej!", "呦吼吼吼吼吼", "Olá!", "Ciao!", "Γεια σου!", "สวัสดี!"];
    document.querySelector("#greeting").textContent = greetings[Math.floor(Math.random() * greetings.length)];
    const versionButton = document.querySelector("#versionButton");
    const versionValue = document.querySelector("#versionValue");
    const versionLabel = document.querySelector("#versionLabel");
    versionButton.addEventListener("click", async () => {
        versionButton.disabled = true;
        versionLabel.textContent = "正在查询";
        versionValue.textContent = "…";
        try {
            const response = await fetch(`./version.json?t=${Date.now()}`, { cache: "no-store" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const version = String(data.version || "").trim();
            if (!version) throw new Error("Missing version");
            versionLabel.textContent = "当前版本";
            versionValue.textContent = version;
        } catch {
            versionLabel.textContent = "查询失败，点击重试";
            versionValue.textContent = "重试";
        } finally { versionButton.disabled = false; }
    });
    const search = document.querySelector("#projectSearch");
    const filters = [...document.querySelectorAll("[data-project-filter]")];
    const projects = [...document.querySelectorAll(".directory-item")];
    const directoryIcons = ["game", "spark", "studio", "heart", "folder", "code", "audio", "video", "spark", "game"];
    projects.forEach((project, index) => {
        const badge = document.createElement("span");
        badge.className = "directory-icon";
        badge.setAttribute("aria-hidden", "true");
        badge.innerHTML = `<svg class="ui-icon"><use href="#icon-${directoryIcons[index]}"></use></svg>`;
        project.prepend(badge);
    });
    const count = document.querySelector("#projectCount");
    const empty = document.querySelector("#projectEmpty");
    let activeFilter = "all";
    function updateProjects() {
        const query = search.value.trim().toLocaleLowerCase();
        let visible = 0;
        for (const project of projects) {
            const categoryMatches = activeFilter === "all" || project.dataset.projectCategory === activeFilter;
            const textMatches = project.textContent.toLocaleLowerCase().includes(query);
            project.hidden = !(categoryMatches && textMatches);
            if (!project.hidden) visible++;
        }
        count.textContent = `${visible} 个入口`;
        empty.hidden = visible > 0;
    }
    filters.forEach((button) => button.addEventListener("click", () => {
        activeFilter = button.dataset.projectFilter;
        filters.forEach((filter) => filter.setAttribute("aria-pressed", String(filter === button)));
        updateProjects();
    }));
    search.addEventListener("input", updateProjects);
    const mapStory = document.querySelector("#wuzi");
    const phases = [...document.querySelectorAll("[data-map-phase]")];
    const nodes = [...document.querySelectorAll(".system-node")];
    mapStory.addEventListener("flavor:scene", (event) => {
        const active = Math.min(2, Math.floor(event.detail.progress * 3));
        phases.forEach((phase, index) => {
            if (index === active) phase.setAttribute("aria-current", "step");
            else phase.removeAttribute("aria-current");
        });
        nodes.forEach((node, index) => node.classList.toggle("is-current", index === active));
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest("input, textarea, [contenteditable]")) {
            event.preventDefault();
            search.focus({ preventScroll: false });
        }
    });
})();
