(() => {
    "use strict";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let statusTimer;
    let statusElement;
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
        if (!reducedMotion.matches && !document.activeElement?.matches(":focus-visible")) {
            dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: "ease-out" });
        }
    }
    function closeDialog(dialog) { dialog?.close(); }
    document.querySelectorAll("dialog").forEach((dialog) => {
        dialog.addEventListener("close", () => {
            if (!document.querySelector("dialog[open]")) document.documentElement.style.overflow = "";
            dialog.getAnimations().forEach((animation) => animation.cancel());
        });
    });
    document.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-copy]");
        if (!button) return;
        const text = button.dataset.copy;
        try {
            await navigator.clipboard.writeText(text);
            announce(`已复制：${text}`);
        } catch { announce(`QQ 号：${text}，可长按或选中复制`); }
    });
    window.FlavorUI = { openDialog, closeDialog, announce };
})();
