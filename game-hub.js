(() => {
    "use strict";
    const originalElements = [...document.querySelectorAll("[data-game-genre]")];
    const originals = originalElements.map(element => ({
        element,
        title: element.querySelector("h2").textContent,
        description: element.querySelector(".entry-description").textContent,
        category: element.dataset.hubCategory,
        href: element.matches("a") ? element.getAttribute("href") : element.querySelector("a").getAttribute("href"),
        original: true
    }));
    const search = document.querySelector("#gameSearch");
    const categories = [...document.querySelectorAll("[data-library-filter]")];
    const genres = [...document.querySelectorAll("[data-genre]")];
    const originalSection = document.querySelector("#originalCollection");
    const librarySection = document.querySelector("#gameLibrary");
    const grid = document.querySelector("#libraryGrid");
    const status = document.querySelector("#libraryStatus");
    const statusText = document.querySelector("#libraryStatusText");
    const retry = document.querySelector("#retryLibrary");
    const pagination = document.querySelector("#libraryPagination");
    const more = document.querySelector("#loadMoreGames");
    const random = document.querySelector("#randomGame");
    const resultCount = document.querySelector("#hubResultCount");
    const empty = document.querySelector("#hubEmpty");
    const pageSize = 24;
    let games = [], matchedLibrary = [], matchedOriginals = originals;
    let activeCategory = "all", activeGenre = "all", limit = pageSize;
    let loading = false, loaded = false, loadFailed = false;
    const normalize = value => String(value || "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
    const categoryMatches = game => activeCategory === "all" || (activeCategory === "original" ? game.original : game.category === activeCategory);

    function makeCard(game) {
        const link = document.createElement("a");
        link.className = "library-game" + (game.deluxe ? " library-game--deluxe" : "");
        link.href = game.href;
        link.dataset.libraryGame = game.id;
        const cover = document.createElement("div");
        cover.className = "library-cover";
        const image = document.createElement("img");
        image.src = `./play/assets/covers/${encodeURIComponent(game.id)}.webp`;
        image.alt = `${game.title} 游戏实机画面`;
        image.width = 640;
        image.height = 360;
        image.loading = "lazy";
        image.decoding = "async";
        image.addEventListener("error", () => {
            image.hidden = true;
            cover.classList.add("library-cover--fallback");
            cover.setAttribute("data-cover-title", game.title);
        }, { once: true });
        cover.append(image);
        if (game.deluxe) {
            const badge = document.createElement("span");
            badge.className = "library-deluxe";
            badge.textContent = "精选";
            cover.append(badge);
        }
        const play = document.createElement("span");
        play.className = "library-play";
        play.textContent = "↗";
        play.setAttribute("aria-hidden", "true");
        cover.append(play);
        const copy = document.createElement("div");
        copy.className = "library-copy";
        const metadata = document.createElement("p");
        metadata.className = "library-meta";
        const category = document.createElement("span");
        category.textContent = game.category;
        const duration = document.createElement("span");
        duration.textContent = game.duration || "随时开玩";
        metadata.append(category, duration);
        const title = document.createElement("h3");
        title.textContent = game.title;
        const description = document.createElement("p");
        description.className = "library-description";
        description.textContent = game.description;
        const footer = document.createElement("span");
        footer.className = "library-card-footer";
        const genre = document.createElement("span");
        genre.textContent = game.genre || "网页小游戏";
        const action = document.createElement("span");
        action.textContent = "开始游戏 ↗";
        footer.append(genre, action);
        copy.append(metadata, title, description, footer);
        link.append(cover, copy);
        return link;
    }

    function renderCards(append = false) {
        const start = append ? grid.childElementCount : 0;
        if (!append) grid.replaceChildren();
        const fragment = document.createDocumentFragment();
        matchedLibrary.slice(start, limit).forEach(game => fragment.append(makeCard(game)));
        grid.append(fragment);
        const shown = Math.min(limit, matchedLibrary.length);
        pagination.hidden = !matchedLibrary.length;
        document.querySelector("#libraryPageCount").textContent = `已展示 ${shown} / ${matchedLibrary.length} 款游戏`;
        more.hidden = shown >= matchedLibrary.length;
        more.firstChild.textContent = `再看 ${Math.min(pageSize, matchedLibrary.length - shown)} 款 `;
    }

    function update() {
        const query = normalize(search.value);
        const matches = game => categoryMatches(game) && (!query || game.searchText.includes(query));
        matchedOriginals = originals.filter(game => matches(game) && (activeGenre === "all" || game.element.dataset.gameGenre === activeGenre));
        originals.forEach(game => { game.element.hidden = !matchedOriginals.includes(game); });
        document.querySelector("#gameCount").textContent = String(matchedOriginals.length).padStart(2, "0");
        originalSection.hidden = !matchedOriginals.length;
        matchedLibrary = activeCategory === "original" ? [] : games.filter(matches);
        const hasLibraryResults = matchedLibrary.length > 0;
        librarySection.hidden = activeCategory === "original" || (loaded && !hasLibraryResults);
        empty.hidden = matchedOriginals.length > 0 || hasLibraryResults || loading || (!loaded && activeCategory !== "original");
        const total = matchedOriginals.length + matchedLibrary.length;
        resultCount.textContent = loading ? `正在加载，已有 ${matchedOriginals.length} 款经典可玩` : loadFailed && activeCategory !== "original" ? `找到 ${total} 款经典 · 新游戏目录暂未加载` : `找到 ${total} 款游戏`;
        random.disabled = total === 0;
        random.setAttribute("aria-label", `从当前 ${total} 款游戏中随机选择一款`);
        renderCards();
    }

    originals.forEach(game => { game.searchText = normalize([game.title, game.description, game.category, game.element.dataset.gameGenre].join(" ")); });
    categories.forEach(button => button.addEventListener("click", () => {
        activeCategory = button.dataset.libraryFilter;
        activeGenre = "all";
        categories.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
        genres.forEach(item => item.setAttribute("aria-pressed", String(item.dataset.genre === "all")));
        limit = pageSize;
        update();
    }));
    genres.forEach(button => button.addEventListener("click", () => {
        activeGenre = button.dataset.genre;
        genres.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
        update();
    }));
    search.addEventListener("input", () => { limit = pageSize; update(); });
    document.addEventListener("keydown", event => {
        if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest("input, textarea, [contenteditable]")) {
            event.preventDefault();
            search.focus();
        }
    });
    more.addEventListener("click", () => {
        const oldCount = grid.childElementCount;
        limit += pageSize;
        renderCards(true);
        grid.children[oldCount]?.focus({ preventScroll: true });
    });
    random.addEventListener("click", () => {
        const choices = [...matchedOriginals, ...matchedLibrary];
        if (!choices.length) return;
        const value = new Uint32Array(1);
        crypto.getRandomValues(value);
        location.href = choices[value[0] % choices.length].href;
    });
    document.querySelector("#resetGames").addEventListener("click", () => {
        search.value = "";
        activeCategory = "all";
        activeGenre = "all";
        limit = pageSize;
        categories.forEach(item => item.setAttribute("aria-pressed", String(item.dataset.libraryFilter === "all")));
        genres.forEach(item => item.setAttribute("aria-pressed", String(item.dataset.genre === "all")));
        update();
        search.focus({ preventScroll: true });
    });

    async function loadLibrary() {
        if (loading) return;
        loading = true;
        loadFailed = false;
        status.hidden = false;
        retry.hidden = true;
        status.classList.remove("library-status--error");
        statusText.textContent = "正在加载游戏目录…";
        update();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch("./play/games.json", { signal: controller.signal });
            if (!response.ok) throw new Error("目录暂不可用");
            const manifest = await response.json();
            if (!Array.isArray(manifest) || !manifest.length) throw new Error("目录格式错误");
            const seen = new Set();
            games = manifest.filter(game => {
                if (!game || !/^[a-zA-Z0-9_-]+$/.test(game.id) || !game.title || seen.has(game.id)) return false;
                seen.add(game.id);
                return true;
            }).map((game, index) => ({ ...game, index, deluxe: game.id.startsWith("deluxe-"), href: `./play/#game=${encodeURIComponent(game.id)}`, searchText: normalize([game.title, game.en, game.genre, game.category, game.description, game.controls].join(" ")) }));
            if (!games.length) throw new Error("目录中没有游戏");
            games.sort((a, b) => Number(b.deluxe) - Number(a.deluxe) || a.index - b.index);
            loaded = true;
            status.hidden = true;
            document.querySelector(".arcade-status b").textContent = String(games.length + originals.length);
            document.querySelector('[data-library-filter="all"] span').textContent = String(games.length + originals.length);
            const headingNote = librarySection.querySelector(".hub-section-heading > p");
            headingNote.textContent = `${games.length} 款新游戏，从一场小冒险开始。`;
        } catch {
            loadFailed = true;
            document.querySelector(".arcade-status b").textContent = String(originals.length);
            status.classList.add("library-status--error");
            statusText.textContent = "新游戏目录暂时没能加载。原有六款游戏仍可进入，请稍后重试。";
            retry.hidden = false;
        } finally {
            clearTimeout(timeout);
            loading = false;
            update();
        }
    }
    retry.addEventListener("click", loadLibrary);
    loadLibrary();
})();
