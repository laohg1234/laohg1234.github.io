(() => {
    const dialog = document.querySelector("#wechatSponsorDialog");
    const open = () => {
        if (dialog.open) return;
        if (window.FlavorUI?.openDialog) window.FlavorUI.openDialog(dialog);
        else dialog.showModal();
    };
    const close = () => {
        if (!dialog.open) return;
        if (window.FlavorUI?.closeDialog) window.FlavorUI.closeDialog(dialog);
        else dialog.close();
    };
    document.querySelector("#showWechatQr")?.addEventListener("click", open);
    document.querySelector("#closeWechatQr")?.addEventListener("click", close);
    dialog?.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    });
})();
