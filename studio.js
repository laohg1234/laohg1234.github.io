const joinDialog = document.querySelector("#joinDialog");
const wechatDialog = document.querySelector("#wechatDialog");
const joinButtons = document.querySelectorAll("#joinBtn, #joinBtnBottom");
const wechatButton = document.querySelector("#wechatBtn");

function openDialog(dialog) {
    if (!dialog) return;

    if (typeof dialog.showModal === "function") {
        dialog.showModal();
    } else {
        dialog.setAttribute("open", "");
    }
}

function closeDialog(dialog) {
    if (!dialog) return;

    if (typeof dialog.close === "function") {
        dialog.close();
    } else {
        dialog.removeAttribute("open");
    }
}

joinButtons.forEach((button) => {
    button.addEventListener("click", () => openDialog(joinDialog));
});

wechatButton?.addEventListener("click", () => {
    closeDialog(joinDialog);
    openDialog(wechatDialog);
});

document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
        closeDialog(document.querySelector(`#${button.dataset.close}`));
    });
});

[joinDialog, wechatDialog].forEach((dialog) => {
    dialog?.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog(dialog);
    });
});
