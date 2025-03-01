async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const correctHash = "a6c27cd6b1ef50a558141633810d86a34818e38492ecc101f21ef9021ef5a7f0";

async function checkPassword() {
    const password = document.getElementById("password-input").value;
    const hashedPassword = await hashPassword(password);

    if (hashedPassword === correctHash) {
        document.getElementById("password-container").style.display = "none";
        document.getElementById("content").style.display = "block";
    } else {
        alert("密码错误，请重试！");
    }
}