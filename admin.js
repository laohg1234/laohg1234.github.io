const correctHash = "a6c27cd6b1ef50a558141633810d86a34818e38492ecc101f21ef9021ef5a7f0";

const passwordContainer = document.querySelector("#password-container");
const passwordBox = document.querySelector("#password-box");
const passwordForm = document.querySelector("#password-form");
const passwordInput = document.querySelector("#password-input");
const passwordError = document.querySelector("#password-error");
const submitButton = document.querySelector("#submit-button");
const togglePassword = document.querySelector("#toggle-password");
const content = document.querySelector("#content");

async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

function showDashboard() {
    passwordContainer.hidden = true;
    content.hidden = false;
    content.focus();
}

function showError(message) {
    passwordError.textContent = message;
    passwordBox.classList.remove("shake");
    requestAnimationFrame(() => passwordBox.classList.add("shake"));
}

passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    passwordError.textContent = "";

    if (!passwordInput.value) {
        showError("请输入管理密码。");
        passwordInput.focus();
        return;
    }

    submitButton.disabled = true;
    submitButton.firstChild.textContent = "正在验证 ";

    try {
        const hashedPassword = await hashPassword(passwordInput.value);

        if (hashedPassword === correctHash) {
            passwordInput.value = "";
            showDashboard();
        } else {
            showError("密码错误，请重试。");
            passwordInput.select();
        }
    } catch (error) {
        showError("当前浏览器无法完成验证，请更换现代浏览器重试。");
    } finally {
        submitButton.disabled = false;
        submitButton.firstChild.textContent = "验证并进入 ";
    }
});

togglePassword.addEventListener("click", () => {
    const shouldShow = passwordInput.type === "password";
    passwordInput.type = shouldShow ? "text" : "password";
    togglePassword.textContent = shouldShow ? "隐藏" : "显示";
    togglePassword.setAttribute("aria-label", shouldShow ? "隐藏密码" : "显示密码");
    passwordInput.focus();
});
