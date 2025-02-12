// script.js
// 弹出菜单功能
const joinBtn = document.getElementById("joinBtn");
const popupMenu = document.getElementById("popupMenu");
const closeBtn = document.getElementById("closeBtn");

// 点击“点击加入”按钮，显示菜单
joinBtn.addEventListener("click", function() {
    popupMenu.style.display = "flex";
});

// 点击关闭按钮，隐藏菜单
closeBtn.addEventListener("click", function() {
    popupMenu.style.display = "none";
});

// 点击菜单外部，隐藏菜单
window.addEventListener("click", function(event) {
    if (event.target === popupMenu) {
        popupMenu.style.display = "none";
    }
});

// 菜单按钮功能
const qqGroupBtn = document.getElementById("qqGroupBtn");
const qqBtn = document.getElementById("qqBtn");
const wechatBtn = document.getElementById("wechatBtn");
const wechatPopup = document.getElementById("wechatPopup");
const closeWechatBtn = document.getElementById("closeWechatBtn");

// QQ群按钮
qqGroupBtn.addEventListener("click", function() {
    window.open("https://qm.qq.com/q/exuEa0Kkqk"); // 替换为QQ群链接
});

// 瓜瓜的QQ按钮
qqBtn.addEventListener("click", function() {
    window.open("https://wpa.qq.com/msgrd?v=3&uin=2123084080&site=qqq&menu=yes"); // 替换为瓜瓜的QQ号
});

// 微信公众号按钮
wechatBtn.addEventListener("click", function() {
    wechatPopup.style.display = "flex"; // 显示微信公众号弹窗
});

// 关闭微信公众号弹窗
closeWechatBtn.addEventListener("click", function() {
    wechatPopup.style.display = "none";
});

// 点击微信公众号弹窗外部，关闭弹窗
window.addEventListener("click", function(event) {
    if (event.target === wechatPopup) {
        wechatPopup.style.display = "none";
    }
});