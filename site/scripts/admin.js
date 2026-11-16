const passwordContainer = document.querySelector("#password-container");
const passwordBox = document.querySelector("#password-box");
const passwordForm = document.querySelector("#password-form");
const passwordInput = document.querySelector("#password-input");
const passwordError = document.querySelector("#password-error");
const submitButton = document.querySelector("#submit-button");
const togglePassword = document.querySelector("#toggle-password");
const content = document.querySelector("#content");

let failedAttempts = 0;
let nextAttemptAt = 0;

function decodeBase64(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveAdminKey(password, payload) {
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            hash: "SHA-256",
            salt: decodeBase64(payload.salt),
            iterations: payload.iterations
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );
}

async function decryptDashboard(password) {
    const payload = window.FAlphaAdminPayload;
    if (!payload || payload.version !== 1) throw new Error("INVALID_PAYLOAD");

    const key = await deriveAdminKey(password, payload);
    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: decodeBase64(payload.iv),
            tagLength: 128
        },
        key,
        decodeBase64(payload.ciphertext)
    );

    return new TextDecoder().decode(decrypted);
}

function showDashboard(markup) {
    content.innerHTML = markup;
    passwordContainer.hidden = true;
    content.hidden = false;
    content.focus();
}

function showError(message) {
    passwordError.textContent = message;
    passwordBox.classList.remove("shake");
    requestAnimationFrame(() => passwordBox.classList.add("shake"));
}

function setSubmitting(submitting) {
    submitButton.disabled = submitting;
    submitButton.firstChild.textContent = submitting ? "正在验证 " : "验证并进入 ";
}

function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    passwordError.textContent = "";

    if (!passwordInput.value) {
        showError("请输入管理密码。");
        passwordInput.focus();
        return;
    }

    const remainingDelay = nextAttemptAt - Date.now();
    if (remainingDelay > 0) {
        showError(`尝试过于频繁，请在 ${Math.ceil(remainingDelay / 1000)} 秒后重试。`);
        return;
    }

    setSubmitting(true);

    try {
        const markup = await decryptDashboard(passwordInput.value);
        failedAttempts = 0;
        nextAttemptAt = 0;
        passwordInput.value = "";
        showDashboard(markup);
    } catch (error) {
        failedAttempts += 1;
        const delay = Math.min(5000, 400 * (2 ** Math.min(failedAttempts - 1, 4)));
        nextAttemptAt = Date.now() + delay;
        await wait(delay);
        showError("密码错误，无法解密管理内容。");
        passwordInput.select();
    } finally {
        setSubmitting(false);
    }
});

togglePassword.addEventListener("click", () => {
    const shouldShow = passwordInput.type === "password";
    passwordInput.type = shouldShow ? "text" : "password";
    togglePassword.textContent = shouldShow ? "隐藏" : "显示";
    togglePassword.setAttribute("aria-label", shouldShow ? "隐藏密码" : "显示密码");
    passwordInput.focus();
});
