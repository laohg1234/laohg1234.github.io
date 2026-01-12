// 提前创建视频元素（隐藏在页面里，预加载）
const video = document.createElement('video');
video.src = 'cookies.mp4';
video.controls = false; // 吓人效果可以关掉控制条
video.autoplay = true;
video.muted = false; // 声音直接出来更有效果
video.preload = "auto"; // 让浏览器提前加载视频（更快）
video.style.position = 'fixed';
video.style.top = '0';
video.style.left = '0';
video.style.width = '100vw';
video.style.height = '100vh';
video.style.zIndex = '9999';
video.style.objectFit = 'cover';
video.style.display = 'none'; // 先隐藏
document.body.appendChild(video); // 提前加到页面里

// 点击按钮后直接显示+全屏+播放
function triggerScareVideo() {
    video.style.display = 'block';
    // 立即全屏
    if (video.requestFullscreen) {
        video.requestFullscreen().catch(err => console.error('全屏失败:', err));
    }
    // 强制播放（防止浏览器限制）
    video.play().catch(err => {
        // 万一浏览器拦截，再触发一次播放
        video.play();
    });
}

// 按钮绑定事件
document.getElementById('acceptBtn').addEventListener('click', triggerScareVideo);
document.getElementById('declineBtn').addEventListener('click', triggerScareVideo);