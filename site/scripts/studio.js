(() => {
    const joinDialog = document.querySelector("#joinDialog");
    const wechatDialog = document.querySelector("#wechatDialog");
    let returnToJoin = false;
    function openDialog(dialog) {
        if (!dialog || dialog.open) return;
        if (window.FlavorUI?.openDialog) window.FlavorUI.openDialog(dialog);
        else dialog.showModal();
    }
    function closeDialog(dialog) {
        if (!dialog?.open) return;
        if (window.FlavorUI?.closeDialog) window.FlavorUI.closeDialog(dialog);
        else dialog.close();
    }
    document.querySelectorAll("#joinBtn, #joinBtnBottom, #communityBtn").forEach((button) => button.addEventListener("click", () => openDialog(joinDialog)));
    document.querySelector("#wechatBtn")?.addEventListener("click", () => {
        returnToJoin = true;
        closeDialog(joinDialog);
        openDialog(wechatDialog);
    });
    document.querySelector("#serviceWechatBtn")?.addEventListener("click", () => {
        returnToJoin = false;
        openDialog(wechatDialog);
    });
    document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => closeDialog(document.getElementById(button.dataset.close))));
    [joinDialog, wechatDialog].forEach((dialog) => dialog?.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    }));
    wechatDialog?.addEventListener("close", () => {
        if (!returnToJoin) return;
        returnToJoin = false;
        openDialog(joinDialog);
    });
})();
