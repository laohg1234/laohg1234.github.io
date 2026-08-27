(() => {
  "use strict";

  const W = 1920;
  const H = 1080;
  const CONFIG_KEY = "signal-room-config-v2";
  const META_KEY = "signal-room-meta-v1";
  const LANG_KEY = "signal-room-language-v1";
  const THEME_KEY = "signal-room-theme-v1";
  const ACTIONS_KEY = "signal-room-actions-v1";
  const RECOVERY_KEY = "flaviz-recovery-v1";
  const AUDIO_MAX_BYTES = 600 * 1024 * 1024;
  const MAX_EXPORT_VIDEO_MBPS = 120;
  const MAX_EXPORT_FRAME_BUDGET = 1_000_000;
  const EXPORT_METADATA = Object.freeze({
    description: "Generated with FLAudioViz",
    comment: "Generated with FLAudioViz; Software by FlavorStudio"
  });
  const FLAV_FILE_TYPES = Object.freeze({
    actions: Object.freeze({ description: "FLAudioViz动作文件", extension: ".flavactions", mime: "application/x-flaudioviz-actions" }),
    settings: Object.freeze({ description: "FLAudioViz配置文件", extension: ".flavsettings", mime: "application/x-flaudioviz-settings" })
  });
  const SPECTRUM_STYLES = Object.freeze(["bars", "line", "dots"]);

  // Keep the two built-in themes explicit so the initial canvas, CSS tokens,
  // and theme toggle all agree on the same colors.
  const LEGACY_LIGHT_PALETTE = Object.freeze({ background: "#e8efed", ink: "#142a2d", accent: "#0d9f93", secondary: "#d9574c" });
  const LEGACY_DARK_PALETTE = Object.freeze({ background: "#0f1318", ink: "#f1f4ee", accent: "#63e6d5", secondary: "#ff7c67" });
  const LIGHT_PALETTE = Object.freeze({ background: "#e8efed", ink: "#142a2d", accent: "#4d79ff", secondary: "#d9574c" });
  const DARK_PALETTE = Object.freeze({ background: "#0f1318", ink: "#f1f4ee", accent: "#4d79ff", secondary: "#ff7c67" });

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const safeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const hex = (value) => String(value || "#000000").replace(/[^#0-9a-f]/gi, "").slice(0, 7) || "#000000";

  // Keep copy in one place so the canvas and the controls switch together.
  const COPY = {
    en: {
      "nav.home": "FLAudioViz home", "nav.more": "More", "nav.visualizer": "Visualizer", "nav.customize": "Customize", "nav.export": "Export", "nav.language": "Language", "nav.theme": "Toggle theme", "nav.customizeAria": "Open customization",
      "intro.back": "Back to tools", "intro.kicker": "# AUDIO TOOLS", "intro.title": "Audio Visualizer", "intro.subtitle": "Local audio playback, analysis, customization, and export.",
      "stage.aria": "Audio visualizer preview", "stage.drop": "Drop an audio file to start previewing", "stage.play": "Play", "stage.pause": "Pause", "stage.back": "Back 10 seconds", "stage.forward": "Forward 10 seconds", "stage.mute": "Mute", "stage.unmute": "Unmute", "stage.position": "Song position",
      "source.heading": "Source", "source.waiting": "Waiting", "source.localOnly": "Local only", "source.audio": "Add or drop audio", "source.audioHelp": "MP3, WAV, OGG, FLAC, M4A if your browser can decode it", "source.cover": "Add cover", "source.coverHelp": "PNG, JPG, or WebP", "source.preset": "Import settings", "source.presetHelp": ".flavsettings configuration file", "source.none": "No source loaded", "source.decoding": "Decoding...", "source.decoded": "Decoded", "source.decodeFailed": "Decode failed", "source.previousKept": "Previous file kept", "source.localAudio": "LOCAL AUDIO", "source.ready": "READY",
      "meta.heading": "Identity", "meta.title": "Song title", "meta.artist": "Artist / composer", "meta.album": "Album", "meta.genre": "Genre", "meta.bpm": "BPM", "meta.track": "Track", "meta.rolling": "Rolling title", "meta.estimate": "Estimate BPM", "meta.estimateReady": "Estimated tempo: {bpm} BPM.",
      "output.heading": "Export", "output.local": "Local export", "output.launchHelp": "Export a PNG frame or a complete MP4 video.", "output.open": "Open export window", "output.dialogTitle": "Export settings", "output.close": "Close export window", "output.status": "Export status", "output.progress": "Export progress", "output.ready": "Ready", "output.readyDetail": "Choose an export option when you are ready.", "output.choosing": "Choose save location", "output.choosingDetail": "Your browser will open Save As.", "output.preparing": "Preparing PNG", "output.preparingDetail": "Rendering the current frame locally.", "output.canvas": "Canvas size", "output.fps": "Frame rate", "output.width": "Width", "output.height": "Height", "output.png": "Export PNG", "output.mp4": "Export MP4", "output.mp4Stop": "Stop MP4 export", "output.mp4Exporting": "Rendering MP4", "output.renderingDetail": "Encoding video and audio locally.", "output.eta": "About {seconds}s remaining.", "output.note": "Exports are rendered locally. Supported browsers open a Save As dialog.", "output.saved": "PNG saved", "output.saving": "Saving file", "output.savingDetail": "Finalizing the local file.", "output.savingMp4": "Saving MP4", "output.savingMp4Detail": "Writing the encoded video to your selected file.", "output.complete": "Export complete", "output.completeDetail": "The file was saved successfully.", "output.cancelled": "Export cancelled", "output.cancelledDetail": "No file was changed.", "output.error": "Export failed", "output.errorDetail": "The file could not be exported.", "output.unsupportedDetail": "This browser does not support MP4 export.", "output.frameBudgetDetail": "For this track, use {fps} FPS or lower to stay within the browser export limit.", "output.durationBudgetDetail": "This track is too long for full-length MP4 export in the browser.", "output.notStarted": "Not started", "output.inProgress": "In progress", "output.custom": "Custom", "output.size720": "1280 × 720", "output.size1080": "1920 × 1080", "output.sizeSquare": "1080 × 1080",
      "custom.heading": "Customize visualization", "custom.help": "Turn display layers and audio metrics on or off as needed.", "custom.reset": "Reset", "custom.save": "Save preset", "custom.import": "Import", "custom.layers": "Layers & metrics", "custom.visible": "Visible meters", "custom.colors": "Color system", "custom.shuffle": "Shuffle palette", "custom.resetColors": "Reset colors", "custom.motion": "Motion & density", "custom.layout": "Layout", "custom.bar": "Bar width", "custom.energy": "Spectrum energy", "custom.wave": "Waveform height", "custom.motionAmount": "Motion", "custom.frequency": "Frequency scale", "custom.fft": "FFT size", "custom.spectrumStyle": "Spectrum style", "custom.log": "Logarithmic", "custom.linear": "Linear", "custom.line": "Line", "custom.bars": "Bars", "custom.dots": "Dots", "custom.split": "Split", "custom.stack": "Stack", "custom.minimal": "Minimal", "custom.showLabels": "Show labels", "custom.reduced": "Reduce motion", "custom.cover": "Cover art", "custom.coverOrbit": "Cover orbit", "custom.bpm": "BPM display & beat rail", "custom.sourceLabel": "File source label", "custom.sourceMeta": "Right-side source", "custom.durationMeta": "Right-side duration", "custom.timelineLabels": "Timeline times", "custom.spectrum": "Spectrum", "custom.waveform": "Waveform", "custom.grid": "Grid", "custom.particles": "Particles", "custom.progress": "Progress", "custom.peak": "Peak", "custom.rms": "RMS", "custom.loudness": "Loudness estimate", "custom.dynamic": "Dynamic range estimate", "custom.loudnessHint": "RMS loudness estimate in dBFS", "custom.dynamicHint": "Short-window RMS spread estimate, not LUFS LRA", "custom.crest": "Crest factor", "custom.duration": "Duration", "custom.background": "Background", "custom.ink": "Ink", "custom.accent": "Accent", "custom.secondary": "Secondary",
      "output.audioRequiredDetail": "Add an audio file before exporting video.",
      "details.heading": "Audio information", "details.none": "No audio decoded", "details.sample": "Sample rate", "details.channels": "Channels", "details.bitDepth": "Bit depth", "details.fileSize": "File size", "details.headroom": "Peak headroom", "details.decode": "Decode state", "details.idle": "Idle", "details.ready": "Ready", "details.analyzed": "{duration}s analyzed",
      "actions.heading": "Action List", "actions.copy": "Copy time", "actions.import": "Import actions", "actions.save": "Save list", "actions.add": "Add action", "actions.help": "Timestamped notes for beats, scene changes, captions, or anything you want to remember while shaping a visual.", "actions.placeholder": "00:00.000  bpm 175.90\n00:12.500  beat accent=#69E5D0\n00:24.000  note text=second movement", "actions.none": "No active actions yet. Saved locally in this browser.", "actions.ready": "{count} action{plural} ready. Saved locally in this browser.",
      "recovery.title": "Recover previous session?", "recovery.body": "A local FLAudioViz snapshot was found.", "recovery.audio": "Audio and cover files are not stored in the snapshot; choose them again after restoring.", "recovery.restore": "Restore", "recovery.dismiss": "Start fresh", "recovery.unknown": "Untitled project",
      "footer.local": "LOCAL-FIRST TOOL", "footer.home": "Home", "footer.copy": "©FlavorStudio", "version.query": "Check", "version.help": "Click to check version", "version.loading": "...", "version.loadingHelp": "Checking", "version.current": "Current version", "version.retry": "Retry", "version.error": "Check failed", "version.aria": "Check FLAudioViz version",
      "canvas.from": "FROM", "canvas.file": "LOCAL FILE", "canvas.localAudio": "LOCAL AUDIO", "canvas.ready": "READY", "canvas.by": "BY", "canvas.album": "ALBUM", "canvas.track": "TRACK", "canvas.source": "SOURCE", "canvas.duration": "DURATION", "canvas.beatPhase": "BEAT PHASE", "canvas.waitingBpm": "WAITING FOR BPM", "canvas.frequency": "20   200       1K       5K       10K       20K", "canvas.frequencyLinear": "0       5K       10K       15K       20K", "canvas.cover": "AUDIO", "canvas.local": "LOCAL",
      "toast.audioFirst": "Add an audio file first.", "toast.playError": "Audio playback could not start in this browser.", "toast.audioDecoded": "Audio decoded. Preview, scrub, or customize the layers.", "toast.coverApplied": "Cover art applied.", "toast.coverError": "That image could not be opened.", "toast.audioError": "Your browser could not decode this file. WAV or MP3 usually works best.", "toast.decodeTooLarge": "This file decodes to more than 1.25 GB of PCM. Try a shorter file.", "toast.fileTooLarge": "This file is larger than 600 MB.", "toast.presetSaved": "FLAudioViz preset saved. Audio and cover files stay on your device.", "toast.presetImported": "Preset imported.", "toast.presetInvalid": "That preset file is not valid.", "toast.projectInvalid": "That project preset is not valid.", "toast.settingsExtension": "Only .flavsettings configuration files are supported.", "toast.actionsImported": "FLAudioViz action file imported.", "toast.actionsInvalid": "That action file could not be opened.", "toast.actionsExtension": "Only .flavactions action files are supported.", "toast.palette": "Palette shuffled.", "toast.colorsReset": "Colors reset for the current theme.", "toast.reset": "Visualizer reset to the default preset.", "toast.png": "Exported {width} × {height} PNG.", "toast.pngFailed": "PNG export failed.", "toast.mp4Unsupported": "MP4 export needs WebCodecs. Try a current Edge or Chrome.", "toast.mp4Exporting": "Rendering MP4 locally...", "toast.mp4Saved": "MP4 saved.", "toast.mp4Failed": "MP4 export failed.", "toast.mp4Cancelled": "MP4 export cancelled.", "toast.frameBudget": "Use {fps} FPS or lower for this track.", "toast.durationBudget": "This track is too long for full-length MP4 export in the browser.", "toast.saveFailed": "Could not save the file.", "toast.saveCancelled": "Save cancelled.", "toast.copy": "Current time copied.", "toast.copyFailed": "Could not copy the current time.", "toast.actionsSaved": "Action list saved.", "toast.bpmMissing": "Choose an audio file first.", "toast.estimate": "Estimated tempo: {bpm} BPM.", "toast.recoveryFound": "A previous FLAudioViz session is available.", "toast.recoveryRestored": "Previous FLAudioViz settings restored.", "toast.languageZh": "已切换到中文界面。", "toast.languageEn": "English labels restored."
    },
    zh: {
      "nav.home": "FLAudioViz 首页", "nav.more": "更多", "nav.visualizer": "可视化", "nav.customize": "自定义", "nav.export": "导出", "nav.language": "语言", "nav.theme": "切换主题", "nav.customizeAria": "打开自定义面板",
      "intro.back": "返回工具页", "intro.kicker": "# 音频工具", "intro.title": "音频可视化", "intro.subtitle": "在浏览器本地播放、分析、自定义并导出音频可视化。",
      "stage.aria": "音频可视化预览", "stage.drop": "拖入音频文件开始预览", "stage.play": "播放", "stage.pause": "暂停", "stage.back": "后退 10 秒", "stage.forward": "前进 10 秒", "stage.mute": "静音", "stage.unmute": "取消静音", "stage.position": "歌曲位置",
      "source.heading": "音频源", "source.waiting": "等待中", "source.localOnly": "仅本地", "source.audio": "添加或拖入音频", "source.audioHelp": "MP3、WAV、OGG、FLAC、M4A（取决于浏览器解码能力）", "source.cover": "添加封面", "source.coverHelp": "PNG、JPG 或 WebP", "source.preset": "导入配置文件", "source.presetHelp": ".flavsettings 配置文件", "source.none": "尚未加载音频", "source.decoding": "解码中...", "source.decoded": "已解码", "source.decodeFailed": "解码失败", "source.previousKept": "已保留上一个文件", "source.localAudio": "本地音频", "source.ready": "就绪",
      "meta.heading": "曲目信息", "meta.title": "歌曲标题", "meta.artist": "艺术家 / 作曲者", "meta.album": "专辑", "meta.genre": "流派", "meta.bpm": "BPM", "meta.track": "曲目编号", "meta.rolling": "滚动标题", "meta.estimate": "估算 BPM", "meta.estimateReady": "估算速度：{bpm} BPM。",
      "output.heading": "导出", "output.local": "本地导出", "output.launchHelp": "导出 PNG 画面或完整 MP4 视频。", "output.open": "打开导出窗口", "output.dialogTitle": "导出设置", "output.close": "关闭导出窗口", "output.status": "导出状态", "output.progress": "导出进度", "output.ready": "就绪", "output.readyDetail": "准备好后选择导出方式。", "output.choosing": "选择保存位置", "output.choosingDetail": "浏览器将打开“另存为”窗口。", "output.preparing": "正在准备 PNG", "output.preparingDetail": "正在本地渲染当前画面。", "output.canvas": "画布尺寸", "output.fps": "帧率", "output.width": "宽度", "output.height": "高度", "output.png": "导出 PNG", "output.mp4": "导出 MP4", "output.mp4Stop": "停止 MP4 导出", "output.mp4Exporting": "正在渲染 MP4", "output.renderingDetail": "正在本地编码视频和音频。", "output.eta": "预计还需约 {seconds} 秒。", "output.note": "所有导出都在浏览器本地完成；支持的浏览器会打开另存为窗口。", "output.saved": "PNG 已保存", "output.saving": "正在保存文件", "output.savingDetail": "正在完成本地文件。", "output.savingMp4": "正在保存 MP4", "output.savingMp4Detail": "正在将编码完成的视频写入所选文件。", "output.complete": "导出完成", "output.completeDetail": "文件已成功保存。", "output.cancelled": "已取消导出", "output.cancelledDetail": "没有修改任何文件。", "output.error": "导出失败", "output.errorDetail": "无法完成该文件的导出。", "output.unsupportedDetail": "当前浏览器不支持 MP4 导出。", "output.frameBudgetDetail": "这首音频请使用 {fps} FPS 或更低帧率，以符合浏览器导出限制。", "output.durationBudgetDetail": "这首音频过长，浏览器无法导出完整 MP4。", "output.notStarted": "尚未开始", "output.inProgress": "进行中", "output.custom": "自定义", "output.size720": "1280 × 720", "output.size1080": "1920 × 1080", "output.sizeSquare": "1080 × 1080",
      "custom.heading": "自定义可视化", "custom.help": "按需开启或关闭显示图层和音频指标。", "custom.reset": "重置", "custom.save": "保存预设", "custom.import": "导入", "custom.layers": "图层与指标", "custom.visible": "显示的指标", "custom.colors": "颜色系统", "custom.shuffle": "随机配色", "custom.resetColors": "重置颜色", "custom.motion": "动画与密度", "custom.layout": "布局", "custom.bar": "柱宽", "custom.energy": "频谱能量", "custom.wave": "波形高度", "custom.motionAmount": "动画强度", "custom.frequency": "频率刻度", "custom.fft": "FFT 大小", "custom.spectrumStyle": "频谱样式", "custom.log": "对数", "custom.linear": "线性", "custom.line": "折线", "custom.bars": "柱状", "custom.dots": "点阵", "custom.split": "分栏", "custom.stack": "堆叠", "custom.minimal": "极简", "custom.showLabels": "显示标签", "custom.reduced": "减少动效", "custom.cover": "封面", "custom.coverOrbit": "封面轨道", "custom.bpm": "BPM 显示与节拍条", "custom.sourceLabel": "文件来源标签", "custom.sourceMeta": "右侧音频源", "custom.durationMeta": "右侧时长", "custom.timelineLabels": "进度时间", "custom.spectrum": "频谱", "custom.waveform": "波形", "custom.grid": "网格", "custom.particles": "粒子", "custom.progress": "进度", "custom.peak": "峰值", "custom.rms": "RMS", "custom.loudness": "响度估算", "custom.dynamic": "动态范围估算", "custom.loudnessHint": "RMS 响度估算（dBFS）", "custom.dynamicHint": "短窗口 RMS 波动估算，不等同于 LUFS LRA", "custom.crest": "峰均比", "custom.duration": "时长", "custom.background": "背景", "custom.ink": "文字", "custom.accent": "主色", "custom.secondary": "辅色",
      "output.audioRequiredDetail": "请先添加音频文件，再导出视频。",
      "details.heading": "音频信息", "details.none": "尚未解码音频", "details.sample": "采样率", "details.channels": "声道", "details.bitDepth": "位深", "details.fileSize": "文件大小", "details.headroom": "峰值余量", "details.decode": "解码状态", "details.idle": "空闲", "details.ready": "就绪", "details.analyzed": "已分析 {duration} 秒",
      "actions.heading": "动作列表", "actions.copy": "复制时间", "actions.import": "导入动作", "actions.save": "保存列表", "actions.add": "添加动作", "actions.help": "用时间戳记录节拍、场景切换、字幕，或任何你在制作视觉效果时想留下的标记。", "actions.placeholder": "00:00.000  bpm 175.90\n00:12.500  beat accent=#69E5D0\n00:24.000  note text=第二段", "actions.none": "还没有动作，内容会保存在此浏览器中。", "actions.ready": "已准备 {count} 个动作，内容保存在此浏览器中。",
      "recovery.title": "恢复上次会话？", "recovery.body": "发现了一份保存在浏览器本地的 FLAudioViz 快照。", "recovery.audio": "快照不会保存音频和封面文件，恢复后请重新选择它们。", "recovery.restore": "恢复", "recovery.dismiss": "重新开始", "recovery.unknown": "未命名项目",
      "footer.local": "本地优先工具", "footer.home": "首页", "footer.copy": "©FlavorStudio", "version.query": "查询", "version.help": "点击查询版本", "version.loading": "...", "version.loadingHelp": "正在查询", "version.current": "当前版本", "version.retry": "重试", "version.error": "查询失败", "version.aria": "查询 FLAudioViz 版本",
      "canvas.from": "来源", "canvas.file": "本地文件", "canvas.localAudio": "本地音频", "canvas.ready": "就绪", "canvas.by": "作者", "canvas.album": "专辑", "canvas.track": "曲目", "canvas.source": "音频源", "canvas.duration": "时长", "canvas.beatPhase": "节拍相位", "canvas.waitingBpm": "等待 BPM", "canvas.frequency": "20   200       1K       5K       10K       20K", "canvas.frequencyLinear": "0       5K       10K       15K       20K", "canvas.cover": "音频", "canvas.local": "本地",
      "toast.audioFirst": "请先添加音频文件。", "toast.playError": "当前浏览器无法启动音频播放。", "toast.audioDecoded": "音频已解码，可以预览、拖动进度或自定义图层了。", "toast.coverApplied": "封面已应用。", "toast.coverError": "这张图片无法打开。", "toast.audioError": "浏览器无法解码这个文件，WAV 或 MP3 通常最稳。", "toast.decodeTooLarge": "解码后的 PCM 超过 1.25 GB，请换一段更短的音频。", "toast.fileTooLarge": "文件超过 600 MB。", "toast.presetSaved": "FLAudioViz 预设已保存，音频和封面仍只留在你的设备上。", "toast.presetImported": "预设已导入。", "toast.presetInvalid": "这个预设文件格式不正确。", "toast.projectInvalid": "这个项目预设格式不正确。", "toast.settingsExtension": "仅支持 .flavsettings 配置文件。", "toast.actionsImported": "FLAudioViz 动作文件已导入。", "toast.actionsInvalid": "这个动作文件无法读取。", "toast.actionsExtension": "仅支持 .flavactions 动作文件。", "toast.palette": "配色已随机切换。", "toast.colorsReset": "当前主题颜色已恢复默认。", "toast.reset": "已恢复默认可视化预设。", "toast.png": "已导出 {width} × {height} PNG。", "toast.pngFailed": "PNG 导出失败。", "toast.mp4Unsupported": "当前浏览器不支持 MP4 所需的 WebCodecs，请使用新版 Edge 或 Chrome。", "toast.mp4Exporting": "正在浏览器本地渲染 MP4...", "toast.mp4Saved": "MP4 已保存。", "toast.mp4Failed": "MP4 导出失败。", "toast.mp4Cancelled": "MP4 导出已取消。", "toast.frameBudget": "这首音频请使用 {fps} FPS 或更低帧率。", "toast.durationBudget": "这首音频过长，浏览器无法导出完整 MP4。", "toast.saveFailed": "文件保存失败。", "toast.saveCancelled": "已取消保存。", "toast.copy": "当前时间已复制。", "toast.copyFailed": "无法复制当前时间。", "toast.actionsSaved": "动作列表已保存。", "toast.bpmMissing": "请先选择音频文件。", "toast.estimate": "估算速度：{bpm} BPM。", "toast.recoveryFound": "发现上次 FLAudioViz 会话的配置。", "toast.recoveryRestored": "已恢复上次 FLAudioViz 配置。", "toast.languageZh": "已切换到中文界面。", "toast.languageEn": "English labels restored."
    }
  };

  const GUIDE_COPY = {
    en: {
      "guide.open": "Open user guide", "guide.close": "Close user guide", "guide.title": "User guide", "guide.intro": "Read this guide before using FLAudioViz for the first time.", "guide.contents": "Guide contents",
      "guide.nav.start": "Quick start", "guide.nav.playback": "Preview and playback", "guide.nav.layers": "Layers and meters", "guide.nav.visual": "Visual tuning", "guide.nav.layout": "Layout and reduced motion", "guide.nav.actions": "Action list", "guide.nav.export": "Save and export", "guide.nav.local": "Recovery and version",
      "guide.tip": "Good to know", "guide.shortcut": "Shortcuts", "guide.important": "Important", "guide.figure.open": "View full size", "guide.figure.viewerTitle": "Image preview", "guide.figure.close": "Close image preview",
      "guide.start.title": "Import a song", "guide.start.intro": "Choose a local audio file. It stays in this browser and is not uploaded.",
      "guide.start.audioTitle": "Add audio", "guide.start.audioBody": "Choose or drop an MP3, WAV, OGG, FLAC, or M4A file. Browser support decides which formats can be decoded; WAV and MP3 are the safest choices.",
      "guide.start.coverTitle": "Add a cover", "guide.start.coverBody": "Choose PNG, JPG, or WebP. Supported audio tags may also fill the cover, title, artist, album, genre, and track number automatically.",
      "guide.start.identityTitle": "Check song information", "guide.start.identityBody": "Edit the title, artist, album, genre, BPM, or track number. The title, artist, album, and track number appear in the preview and exports. Estimate BPM gives the whole song one BPM value; it does not make a changing BPM timeline.",
      "guide.start.infoTitle": "Check audio details", "guide.start.infoBody": "After the file loads, this panel shows the sample rate, channels, available bit depth, file size, peak headroom, and decode state. These values are read-only.",
      "guide.start.note": "A .flavsettings file restores a saved setup, but it does not include the audio or cover. Choose those files again after importing.",
      "guide.playback.title": "Preview and playback", "guide.playback.intro": "PNG and MP4 exports use the scene shown in the large preview. Use the controls below it to listen or jump to different parts of the song while you adjust the design.",
      "guide.playback.transportTitle": "Back, play, and forward", "guide.playback.transportBody": "Jump back or forward by 10 seconds, or start and pause playback. The time readout shows the current position and total duration.",
      "guide.playback.scrubTitle": "Song position", "guide.playback.scrubBody": "Drag the long slider to seek. If the song was playing, it pauses while you drag and resumes when you release it.",
      "guide.playback.muteTitle": "Mute", "guide.playback.muteBody": "Mute only affects what you hear during preview. It does not remove audio from an exported MP4. The mute button is hidden on very narrow screens to preserve space.",
      "guide.playback.rollingTitle": "Rolling title", "guide.playback.rollingBody": "Long titles scroll only when they do not fit. Reduce motion keeps the title still.",
      "guide.playback.caption": "The loaded preview shows the title, artist, album, and track number; use the controls below it to play or seek.", "guide.playback.shortcuts": "When you are not typing in a field, Space plays or pauses; Left and Right move by 5 seconds.",
      "guide.layers.title": "Layers and meters", "guide.layers.intro": "Every switch in Layers and meters changes a visible part of the exported visual. Turn off anything you do not need.",
      "guide.layers.coverTitle": "Cover and cover track", "guide.layers.coverBody": "Cover hides the artwork. Cover track controls the two thin animated lines beside it independently.",
      "guide.layers.bpmTitle": "BPM display and beat rail", "guide.layers.bpmBody": "Shows the current BPM and the small left-right beat indicator. It uses the BPM field unless the action list supplies timed BPM changes.",
      "guide.layers.graphTitle": "Spectrum and waveform", "guide.layers.graphBody": "Spectrum shows the current frequency energy. Waveform shows the song's overall shape and current short-window energy.",
      "guide.layers.atmosphereTitle": "Grid and particles", "guide.layers.atmosphereBody": "These are background guides and small drifting points. They can be removed without affecting audio analysis.",
      "guide.layers.progressTitle": "Progress and timeline times", "guide.layers.progressBody": "Progress is the thin line inside the exported picture. Timeline times controls its start and end labels; the webpage playback slider remains separate.",
      "guide.layers.sourceTitle": "Source labels and right-side details", "guide.layers.sourceBody": "File source label, right-side source, and right-side duration can each be hidden.",
      "guide.layers.metersTitle": "Bottom meters", "guide.layers.peakTitle": "Peak", "guide.layers.peakBody": "The highest detected level.",
      "guide.layers.rmsTitle": "RMS and loudness estimate", "guide.layers.rmsBody": "Both use average signal energy, so their values may be close. Neither is a LUFS measurement.",
      "guide.layers.dynamicTitle": "Dynamic range estimate", "guide.layers.dynamicBody": "Short-window RMS variation. It is a visual estimate, not LUFS LRA.",
      "guide.layers.crestTitle": "Crest factor", "guide.layers.crestBody": "The difference between peak and average level.", "guide.layers.durationTitle": "Duration", "guide.layers.durationBody": "The full decoded song length.",
      "guide.visual.title": "Visual tuning", "guide.visual.caption": "Changes here appear in the preview right away; there is no extra Apply step.",
      "guide.visual.colorsTitle": "Colors", "guide.visual.colorsBody": "Adjust the background, text, primary, and secondary colors separately. Shuffle palette tries another combination. Reset colors restores only the current theme, and light and dark themes keep separate colors.",
      "guide.visual.barTitle": "Bar width and spectrum energy", "guide.visual.barBody": "Bar width changes the number and spacing of spectrum bars. Spectrum energy changes how strongly the graph responds.",
      "guide.visual.waveTitle": "Waveform height", "guide.visual.waveBody": "Makes the waveform taller or shorter without changing the music file.",
      "guide.visual.motionTitle": "Motion", "guide.visual.motionBody": "This mainly controls how fast and how far the particles and cover track move. Set it to 0 to stop those decorative movements.",
      "guide.visual.scaleTitle": "Frequency scale", "guide.visual.scaleBody": "Logarithmic gives more room to bass and mids, similar to how we hear. Linear spreads frequencies evenly.",
      "guide.visual.fftTitle": "FFT size", "guide.visual.fftBody": "Higher values separate nearby frequencies more clearly but react a little less quickly. The default is 16384 and works well for most songs.",
      "guide.visual.styleTitle": "Spectrum style", "guide.visual.styleBody": "Choose bars, line, or dots. Bars are the default.",
      "guide.layout.title": "Layout and reduced motion", "guide.layout.splitTitle": "Split", "guide.layout.splitBody": "The default layout puts the cover on the left and the title and graphs on the right. It works well for landscape video.",
      "guide.layout.stackTitle": "Stack", "guide.layout.stackBody": "The cover sits higher, with the other information arranged below it. Choose this when you want the cover to stand out.",
      "guide.layout.minimalTitle": "Minimal", "guide.layout.minimalBody": "Uses a smaller, tighter arrangement. It does not automatically hide the cover, but the cover track is omitted in this layout.",
      "guide.layout.labelsTitle": "Show labels", "guide.layout.labelsBody": "Hides descriptive labels, frequency markings, meter names, and canvas timeline times for a cleaner picture.",
      "guide.layout.reduceTitle": "Reduce motion", "guide.layout.reduceBody": "This stops title scrolling, particle drift, and moving cover-track highlights. The spectrum and waveform still react to the music.",
      "guide.layout.note": "Turn on Reduce motion if moving visuals feel uncomfortable, you want a steadier result, or preview feels choppy on your device.",
      "guide.actions.title": "Action list", "guide.actions.intro": "Use the action list as notes tied to points in the song. A bpm or tempo line changes the BPM display and beat movement from that time onward; other text is only saved as a note.", "guide.actions.caption": "The list is plain text, and you can edit any line directly.",
      "guide.actions.timeTitle": "Time stamp", "guide.actions.timeBody": "Use MM:SS.sss, HH:MM:SS.sss, or a number of seconds. Empty lines and lines beginning with # are ignored.",
      "guide.actions.bpmTitle": "bpm / tempo", "guide.actions.bpmBody": "These are the only action types that currently change the visual. Enter a positive BPM after the command.",
      "guide.actions.noteTitle": "beat / note and other text", "guide.actions.noteBody": "Saved as notes only. They do not yet change colors, captions, or scenes.",
      "guide.actions.copyTitle": "Copy time", "guide.actions.copyBody": "Copies the current playback position so you can paste an exact time stamp.",
      "guide.actions.addTitle": "Add action", "guide.actions.addBody": "Inserts a note with the current playback time wherever your text cursor is.",
      "guide.actions.filesTitle": "Import and save", "guide.actions.filesBody": "Only .flavactions files can be imported. Save list opens Save As and creates a .flavactions file.",
      "guide.actions.note": "The list is saved in this browser as you type. Saving a .flavactions file is still recommended before clearing browser data or moving to another device.",
      "guide.export.title": "Save and export", "guide.export.caption": "While exporting, this window shows the progress and estimated time remaining.",
      "guide.export.settingsTitle": "Save preset / Import", "guide.export.settingsBody": "A .flavsettings file stores the visual setup, song information, export choices, and action list. It does not contain audio or cover files. Importing may replace the current setup.",
      "guide.export.resetTitle": "Reset", "guide.export.resetBody": "Restores visual and color defaults only. It does not erase song information, the action list, or export settings.",
      "guide.export.pngTitle": "Export PNG", "guide.export.pngBody": "Saves the picture at the current playback position using the selected canvas size.",
      "guide.export.mp4Title": "Export MP4", "guide.export.mp4Body": "Exports the full-song visual and audio as an MP4. A current version of Edge or Chrome is recommended, and you can stop the render at any time.",
      "guide.export.sizeTitle": "Canvas size and frame rate", "guide.export.sizeBody": "Choose 720p, 1080p, square, or custom dimensions. Frame rate accepts your own positive whole number; higher values take longer and the page will warn you if the job is too large for the browser.",
      "guide.export.saveTitle": "Where files go", "guide.export.saveBody": "Supported browsers let you choose a location with Save As. Otherwise, the file uses your browser's usual download behavior.",
      "guide.export.markTitle": "FLAudioViz attribution", "guide.export.markBody": "MP4 places Made with FLAudioViz in the lower-right corner.",
      "guide.local.title": "Recovery and version", "guide.local.cacheTitle": "Automatic local saving", "guide.local.cacheBody": "Song information, visual settings, export options, and actions are saved automatically in this browser. Audio and cover files are not included, so choose them again after restoring.",
      "guide.local.recoveryTitle": "Recovery prompt", "guide.local.recoveryBody": "When saved work is found after reopening, choose Restore to bring it back or Start fresh to clear it. After restoring, choose the audio and cover again.",
      "guide.local.topbarTitle": "Top-bar controls", "guide.local.topbarBody": "More jumps to the main areas. EN / 中 changes language. The sun button changes theme, the help button opens this guide, and the sliders button jumps to customization.",
      "guide.local.versionTitle": "Version check", "guide.local.versionBody": "The version button in the footer reads the FLAudioViz version included with this site; it does not check online for updates. If the version cannot be read, the button changes to Retry.",
      "guide.local.homeTitle": "Home", "guide.local.homeBody": "Home opens 黄瓜LaHG's personal website.",
      "guide.finish.title": "Check before export", "guide.finish.body": "Preview a few points in the song, check that the visible items and design look right, then save the setup before starting the MP4 export.", "guide.finish.close": "Close guide"
    },
    zh: {
      "guide.open": "打开使用教程", "guide.close": "关闭使用教程", "guide.title": "使用教程", "guide.intro": "初次使用请先查看教程。", "guide.contents": "教程目录",
      "guide.nav.start": "快速开始", "guide.nav.playback": "预览与播放", "guide.nav.layers": "图层与指标", "guide.nav.visual": "画面调节", "guide.nav.layout": "布局与减少动效", "guide.nav.actions": "动作列表", "guide.nav.export": "保存与导出", "guide.nav.local": "恢复与版本",
      "guide.tip": "提示", "guide.shortcut": "快捷操作", "guide.important": "请注意", "guide.figure.open": "查看大图", "guide.figure.viewerTitle": "大图预览", "guide.figure.close": "关闭大图",
      "guide.start.title": "导入歌曲", "guide.start.intro": "选择本地音频文件。文件只在当前浏览器中处理，不会上传。",
      "guide.start.audioTitle": "添加音频", "guide.start.audioBody": "选择或拖入 MP3、WAV、OGG、FLAC、M4A 文件。能否解码取决于浏览器，WAV 和 MP3 通常最稳。",
      "guide.start.coverTitle": "添加封面", "guide.start.coverBody": "支持 PNG、JPG、WebP。部分音频的内嵌封面和标签还能自动填写标题、作者、专辑、流派与曲目编号。",
      "guide.start.identityTitle": "检查曲目信息", "guide.start.identityBody": "可以修改歌曲标题、艺术家、专辑、流派、BPM 和曲目编号。标题、艺术家、专辑与曲目编号会显示在预览和导出画面中；“估算 BPM”只会给整首歌一个 BPM，不会生成随时间变化的 BPM 列表。",
      "guide.start.infoTitle": "查看音频详情", "guide.start.infoBody": "歌曲加载完成后，这里会显示采样率、声道、能读取到的位深、文件大小、峰值余量和解码状态；这些信息不能手动修改。",
      "guide.start.note": ".flavsettings 可以恢复保存过的设置，但不会包含音频和封面。导入后仍需重新选择这两个文件。",
      "guide.playback.title": "预览与播放", "guide.playback.intro": "导出的 PNG 和 MP4 会使用上方预览中的画面。调节时，可以用画面下方的控件试听，或跳到歌曲的不同位置。",
      "guide.playback.transportTitle": "后退、播放与前进", "guide.playback.transportBody": "可后退或前进 10 秒，也可播放和暂停。右侧时间会同时显示当前位置与总时长。",
      "guide.playback.scrubTitle": "歌曲位置", "guide.playback.scrubBody": "拖动长进度条即可跳转。若拖动前正在播放，拖动时会暂停，松手后继续播放。",
      "guide.playback.muteTitle": "静音", "guide.playback.muteBody": "静音只影响预览时听到的声音，不会让导出的 MP4 失去音轨。屏幕很窄时，静音按钮会暂时隐藏来腾出空间。",
      "guide.playback.rollingTitle": "滚动标题", "guide.playback.rollingBody": "只有标题放不下时才会滚动；开启“减少动效”后，标题会保持静止。",
      "guide.playback.caption": "加载音频后的预览会显示标题、作者、专辑与曲目编号，下方可以播放或跳转。", "guide.playback.shortcuts": "没有在输入框中打字时，空格可播放或暂停；左右方向键每次移动 5 秒。",
      "guide.layers.title": "图层与指标", "guide.layers.intro": "“图层与指标”里的每个开关都对应导出画面中的一项内容。不需要的部分可以直接关闭。",
      "guide.layers.coverTitle": "封面与封面轨道", "guide.layers.coverBody": "“封面”控制图片本身；“封面轨道”可单独关闭图片两侧的细线动画。",
      "guide.layers.bpmTitle": "BPM 显示与节拍条", "guide.layers.bpmBody": "显示当前 BPM 和旁边左右移动的小节拍指示。默认使用曲目信息中的 BPM，动作列表可让它按时间变化。",
      "guide.layers.graphTitle": "频谱与波形", "guide.layers.graphBody": "频谱显示当前各频率的能量；波形显示整首歌曲的大致形状和当前短时能量。",
      "guide.layers.atmosphereTitle": "网格与粒子", "guide.layers.atmosphereBody": "它们只是背景辅助线和漂移的小点，关闭后不会影响音频分析。",
      "guide.layers.progressTitle": "进度与进度时间", "guide.layers.progressBody": "“进度”是导出画面里的细进度线；“进度时间”控制起止时间文字。网页下方的播放滑杆是另一套控件。",
      "guide.layers.sourceTitle": "来源标签与右侧信息", "guide.layers.sourceBody": "文件来源标签、右侧音频源、右侧时长都可以分别关闭。",
      "guide.layers.metersTitle": "底部音频指标", "guide.layers.peakTitle": "峰值", "guide.layers.peakBody": "检测到的最高电平。",
      "guide.layers.rmsTitle": "RMS 与响度估算", "guide.layers.rmsBody": "两者都基于平均信号能量，所以数值可能接近；它们都不是 LUFS 测量。",
      "guide.layers.dynamicTitle": "动态范围估算", "guide.layers.dynamicBody": "短时间窗口内 RMS 的波动范围，只是视觉估算，不等同于 LUFS LRA。",
      "guide.layers.crestTitle": "峰均比", "guide.layers.crestBody": "峰值电平与平均电平之间的差。", "guide.layers.durationTitle": "时长", "guide.layers.durationBody": "浏览器解码得到的整首歌曲长度。",
      "guide.visual.title": "画面调节", "guide.visual.caption": "这里的设置改完会马上显示在预览里，不用另外确认。",
      "guide.visual.colorsTitle": "画面配色", "guide.visual.colorsBody": "背景、文字、主色和辅色都可以分别调整。“随机配色”会换一组组合；“重置颜色”只恢复当前主题，浅色和深色主题各自保留配色。",
      "guide.visual.barTitle": "柱宽与频谱能量", "guide.visual.barBody": "柱宽会改变频谱柱的数量和间距；频谱能量决定图形对音乐反应得有多强。",
      "guide.visual.waveTitle": "波形高度", "guide.visual.waveBody": "只会让波形变高或变矮，不会改动音乐文件。",
      "guide.visual.motionTitle": "动画强度", "guide.visual.motionBody": "主要控制粒子和封面轨道动得多快、移动多远。调到 0 后，这些装饰动效会停下来。",
      "guide.visual.scaleTitle": "频率刻度", "guide.visual.scaleBody": "对数刻度会给低频与中频更多空间，更接近听觉习惯；线性刻度会均匀铺开频率。",
      "guide.visual.fftTitle": "FFT 大小", "guide.visual.fftBody": "数值越高，邻近频率分得越清楚，但反应会稍慢。默认 16384，适合大多数歌曲。",
      "guide.visual.styleTitle": "频谱样式", "guide.visual.styleBody": "可选择柱状、折线或点阵，默认使用柱状。",
      "guide.layout.title": "布局与减少动效", "guide.layout.splitTitle": "分栏", "guide.layout.splitBody": "默认布局，左边是封面，右边是标题和图表，适合横屏视频。",
      "guide.layout.stackTitle": "堆叠", "guide.layout.stackBody": "封面放在上方，其余信息排在下面。想突出封面时可以选这个布局。",
      "guide.layout.minimalTitle": "极简", "guide.layout.minimalBody": "使用更紧凑的排版。它不会自动隐藏封面，但此布局不会显示封面轨道。",
      "guide.layout.labelsTitle": "显示标签", "guide.layout.labelsBody": "关闭后会隐藏说明文字、频率刻度、指标名称和画布内的进度时间，让画面更简洁。",
      "guide.layout.reduceTitle": "减少动效", "guide.layout.reduceBody": "开启后，标题不会滚动，粒子和封面轨道也不会持续移动；频谱和波形仍会跟着音乐变化。",
      "guide.layout.note": "如果动态画面看久了不舒服、想让画面少动一些，或设备预览不够流畅，可以开启“减少动效”。",
      "guide.actions.title": "动作列表", "guide.actions.intro": "可以把动作列表当成一张按时间排列的备忘单。写入 bpm 或 tempo 后，BPM 显示和节拍动画会从对应时间开始变化；其他内容只会作为备注保存。", "guide.actions.caption": "列表就是普通文本，每一行都可以直接修改。",
      "guide.actions.timeTitle": "时间戳", "guide.actions.timeBody": "可使用 MM:SS.sss、HH:MM:SS.sss，或直接填写秒数。空行和以 # 开头的注释会被忽略。",
      "guide.actions.bpmTitle": "bpm / tempo", "guide.actions.bpmBody": "目前只有这两种动作会改变画面。命令后填写一个大于 0 的 BPM。",
      "guide.actions.noteTitle": "beat / note 与其他文字", "guide.actions.noteBody": "它们只作为备注保存，目前不会改变颜色、字幕或场景。",
      "guide.actions.copyTitle": "复制时间", "guide.actions.copyBody": "复制当前播放位置，方便粘贴一个准确的时间戳。",
      "guide.actions.addTitle": "添加动作", "guide.actions.addBody": "会在光标位置插入一条带当前播放时间的备注。",
      "guide.actions.filesTitle": "导入与保存", "guide.actions.filesBody": "只能导入 .flavactions 文件。保存时会打开“另存为”，文件后缀为 .flavactions。",
      "guide.actions.note": "输入内容会实时保存在当前浏览器中。在清理浏览器数据或换设备前，仍建议另存一份 .flavactions 文件。",
      "guide.export.title": "保存与导出", "guide.export.caption": "导出时，可以在这个窗口查看进度和预计剩余时间。",
      "guide.export.settingsTitle": "保存预设 / 导入", "guide.export.settingsBody": ".flavsettings 会保存画面设置、曲目信息、导出参数和动作列表，但不包含音频与封面。导入时可能覆盖当前内容。",
      "guide.export.resetTitle": "重置", "guide.export.resetBody": "只恢复可视化与颜色默认值，不会清空曲目信息、动作列表或导出设置。",
      "guide.export.pngTitle": "导出 PNG", "guide.export.pngBody": "按照所选画布尺寸，保存当前播放位置对应的静态画面。",
      "guide.export.mp4Title": "导出 MP4", "guide.export.mp4Body": "会将整首歌的画面和声音导出为 MP4。建议使用新版 Edge 或 Chrome；渲染过程中也可以随时停止。",
      "guide.export.sizeTitle": "画布尺寸与帧率", "guide.export.sizeBody": "可选 720p、1080p、正方形或自定义尺寸。帧率可以填写任意正整数；数值越高耗时越长，任务超出浏览器能力时页面会直接提示。",
      "guide.export.saveTitle": "文件保存位置", "guide.export.saveBody": "如果浏览器支持，会弹出“另存为”让你选择位置；不支持时，就按浏览器平常的下载方式保存。",
      "guide.export.markTitle": "FLAudioViz 标识", "guide.export.markBody": "MP4 右下角会显示 Made with FLAudioViz。",
      "guide.local.title": "恢复与版本", "guide.local.cacheTitle": "自动本地保存", "guide.local.cacheBody": "曲目信息、画面设置、导出参数和动作会自动保存在这个浏览器里。音频和封面不会保存，恢复后需要重新选择。",
      "guide.local.recoveryTitle": "恢复提示", "guide.local.recoveryBody": "重新打开后发现已保存内容时，可以选择“恢复”或“重新开始”。恢复后仍要重新选择音频与封面。",
      "guide.local.topbarTitle": "顶栏按钮", "guide.local.topbarBody": "“更多”可跳到主要区域，EN / 中切换语言，太阳按钮切换主题，问号按钮打开本教程，滑杆按钮跳到自定义设置。",
      "guide.local.versionTitle": "版本查询", "guide.local.versionBody": "页脚的版本按钮会读取网站当前使用的 FLAudioViz 版本号，不会联网检查更新。读取失败时，按钮会显示“重试”。",
      "guide.local.homeTitle": "首页", "guide.local.homeBody": "点“首页”会打开黄瓜LaHG的个人网站。",
      "guide.finish.title": "导出前检查", "guide.finish.body": "先试听几个片段，确认显示项和画面效果都没问题，再保存一次配置并开始 MP4 导出。", "guide.finish.close": "关闭教程"
    }
  };

  const KEY_ALIASES = {
    "a11y.home": "nav.home", "nav.moreLinks": "nav.more", "settings.language": "nav.language", "settings.themeToggle": "nav.theme", "settings.customize": "nav.customizeAria",
    "stage.preview": "stage.aria", "stage.empty": "stage.drop", "player.back10": "stage.back", "player.forward10": "stage.forward", "player.mute": "stage.mute", "player.play": "stage.play", "player.position": "stage.position", "player.toggle": "stage.play",
    "source.status.waiting": "source.waiting", "source.audio.title": "source.audio", "source.audio.help": "source.audioHelp", "source.cover.title": "source.cover", "source.cover.help": "source.coverHelp", "source.preset.title": "source.preset", "source.preset.help": "source.presetHelp", "source.empty": "source.none",
    "metadata.heading": "meta.heading", "metadata.status": "source.localOnly", "metadata.title": "meta.title", "metadata.artist": "meta.artist", "metadata.album": "meta.album", "metadata.genre": "meta.genre", "metadata.bpm": "meta.bpm", "metadata.track": "meta.track", "metadata.rolling": "meta.rolling", "metadata.estimateBpm": "meta.estimate", "metadata.bpmPlaceholder": "meta.bpm", "metadata.trackPlaceholder": "meta.track",
    "export.status.ready": "output.ready", "export.heading": "output.heading", "export.canvasSize": "output.canvas", "export.frameRate": "output.fps", "export.width": "output.width", "export.height": "output.height", "export.png": "output.png", "export.note": "output.note", "export.sizeCustom": "output.custom", "export.size720": "output.size720", "export.size1080": "output.size1080", "export.sizeSquare": "output.sizeSquare",
    "customize.heading": "custom.heading", "customize.description": "custom.help", "customize.reset": "custom.reset", "customize.save": "custom.save", "customize.import": "custom.import", "customize.layers.title": "custom.layers", "customize.meters.title": "custom.visible", "customize.colors.title": "custom.colors", "customize.colors.shuffle": "custom.shuffle", "customize.motion.title": "custom.motion", "customize.layout.title": "custom.layout", "customize.motion.barWidth": "custom.bar", "customize.motion.spectrumEnergy": "custom.energy", "customize.motion.waveHeight": "custom.wave", "customize.motion.motion": "custom.motionAmount", "customize.motion.frequencyScale": "custom.frequency", "customize.motion.fftSize": "custom.fft", "customize.motion.spectrumStyle": "custom.spectrumStyle", "customize.motion.logarithmic": "custom.log", "customize.motion.linear": "custom.linear", "customize.motion.styleBars": "custom.bars", "customize.motion.styleLine": "custom.line", "customize.layout.mode": "custom.layout", "customize.layout.split": "custom.split", "customize.layout.stack": "custom.stack", "customize.layout.minimal": "custom.minimal", "customize.layout.showLabels": "custom.showLabels", "customize.layout.reducedMotion": "custom.reduced",
    "customize.colors.background": "custom.background", "customize.colors.ink": "custom.ink", "customize.colors.accent": "custom.accent", "customize.colors.secondary": "custom.secondary", "customize.layer.cover": "custom.cover", "customize.layer.coverOrbit": "custom.coverOrbit", "customize.layer.bpm": "custom.bpm", "customize.layer.sourceLabel": "custom.sourceLabel", "customize.layer.sourceMeta": "custom.sourceMeta", "customize.layer.durationMeta": "custom.durationMeta", "customize.layer.timelineLabels": "custom.timelineLabels", "customize.layer.spectrum": "custom.spectrum", "customize.layer.waveform": "custom.waveform", "customize.layer.grid": "custom.grid", "customize.layer.particles": "custom.particles", "customize.layer.progress": "custom.progress", "customize.metric.peak": "custom.peak", "customize.metric.rms": "custom.rms", "customize.metric.loudness": "custom.loudness", "customize.metric.dynamicRange": "custom.dynamic", "customize.metric.crest": "custom.crest", "customize.metric.duration": "custom.duration", "customize.metric.loudnessHint": "custom.loudness", "customize.metric.dynamicRangeHint": "custom.dynamic",
    "details.heading": "details.heading", "details.status.empty": "details.none", "details.sampleRate": "details.sample", "details.channels": "details.channels", "details.bitDepth": "details.bitDepth", "details.fileSize": "details.fileSize", "details.headroom": "details.headroom", "details.decodeState": "details.decode", "details.idle": "details.idle",
    "actions.copyTime": "actions.copy", "actions.saveList": "actions.save", "actions.status.empty": "actions.none", "footer.localTool": "footer.local", "footer.mark": "footer.copy"
  };

  function languageFromStorage() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "en" || saved === "zh") return saved;
    } catch { /* private mode */ }
    return "zh";
  }

  function storedTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === "light" || saved === "dark" ? saved : null;
    } catch { return null; }
  }

  function themeFromStorage() {
    // A first visit should feel like a normal light workspace. An explicit
    // dark preference remains sticky across reloads.
    return storedTheme() || "light";
  }

  function paletteForTheme(theme) {
    return { ...(theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE) };
  }

  function paletteEquals(left, right) {
    return ["background", "ink", "accent", "secondary"].every((key) => String(left?.[key] || "").toLowerCase() === right[key]);
  }

  function t(key, fallback = key, values = {}) {
    const table = COPY[state?.language || "zh"] || COPY.zh;
    const guideTable = GUIDE_COPY[state?.language || "zh"] || GUIDE_COPY.zh;
    const resolvedKey = KEY_ALIASES[key] || key;
    let value = table[resolvedKey] ?? guideTable[resolvedKey] ?? COPY.en[resolvedKey] ?? GUIDE_COPY.en[resolvedKey] ?? fallback;
    for (const [name, replacement] of Object.entries(values)) value = value.replaceAll(`{${name}}`, String(replacement));
    return value;
  }

  function motionIsReduced() {
    return Boolean(state?.config?.reducedMotion || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  }

  const defaultConfig = {
    layers: {
      cover: true,
      coverOrbit: true,
      bpm: true,
      spectrum: true,
      waveform: true,
      grid: true,
      particles: true,
      progress: true,
      sourceLabel: true,
      sourceMeta: true,
      durationMeta: true,
      timelineLabels: true
    },
    metrics: { peak: true, rms: true, loudness: true, dynamicRange: true, crest: true, duration: true },
    colors: paletteForTheme("light"),
    barWidth: 6,
    spectrumGain: 74,
    waveHeight: 68,
    motion: 100,
    frequencyScale: "log",
    // A larger FFT keeps the high-frequency end useful while still leaving
    // the bar count independent of analyser resolution.
    fftSize: 16384,
    spectrumStyle: "bars",
    layout: "split",
    showLabels: true,
    reducedMotion: false
  };

  function cloneConfig(config) {
    return JSON.parse(JSON.stringify(config));
  }

  function freshConfig(theme = themeFromStorage()) {
    const config = cloneConfig(defaultConfig);
    config.colors = paletteForTheme(theme);
    return config;
  }

  function mergeStoredConfig(saved, savedTheme = storedTheme()) {
    const config = freshConfig(savedTheme || "light");
    if (!saved || typeof saved !== "object") return config;
    for (const key of ["layers", "metrics", "colors"]) Object.assign(config[key], saved[key] || {});
    delete config.layers.scanBeam;
    for (const key of ["barWidth", "spectrumGain", "waveHeight", "motion", "frequencyScale", "fftSize", "spectrumStyle", "layout", "showLabels", "reducedMotion"]) {
      if (saved[key] !== undefined) config[key] = saved[key];
    }
    // Older builds silently persisted the dark defaults before a theme key
    // existed. Migrate that exact legacy palette while preserving custom colors.
    if (paletteEquals(config.colors, LEGACY_LIGHT_PALETTE)) config.colors = paletteForTheme("light");
    if (paletteEquals(config.colors, LEGACY_DARK_PALETTE)) config.colors = paletteForTheme(savedTheme === "dark" ? "dark" : "light");
    if (!savedTheme && paletteEquals(config.colors, DARK_PALETTE)) config.colors = paletteForTheme("light");
    if (savedTheme === "light" && paletteEquals(config.colors, DARK_PALETTE)) config.colors = paletteForTheme("light");
    if (savedTheme === "dark" && paletteEquals(config.colors, LIGHT_PALETTE)) config.colors = paletteForTheme("dark");
    if (!SPECTRUM_STYLES.includes(config.spectrumStyle)) config.spectrumStyle = defaultConfig.spectrumStyle;
    return config;
  }

  function loadConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null");
      return mergeStoredConfig(saved, storedTheme());
    } catch {
      return freshConfig(themeFromStorage());
    }
  }

  function readLegacySessionSnapshot(theme) {
    try {
      const storedConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null");
      const metadata = JSON.parse(localStorage.getItem(META_KEY) || "null");
      const actions = localStorage.getItem(ACTIONS_KEY);
      const hasConfig = storedConfig && typeof storedConfig === "object" && Object.keys(storedConfig).length > 0;
      const hasMetadata = metadata && typeof metadata === "object" && Object.keys(metadata).length > 0;
      const hasActions = typeof actions === "string" && actions.trim().length > 0;
      if (!hasConfig && !hasMetadata && !hasActions) return null;
      return {
        format: "flaviz-recovery",
        version: 1,
        savedAt: new Date().toISOString(),
        config: hasConfig ? storedConfig : freshConfig(theme),
        metadata: hasMetadata ? metadata : {},
        actions: hasActions ? actions : "",
        audioName: "",
        coverName: ""
      };
    } catch {
      return null;
    }
  }

  function recoverySnapshotAtLaunch(theme) {
    const stored = readRecoverySnapshot();
    if (stored) return stored;
    const legacy = readLegacySessionSnapshot(theme);
    if (!legacy) return null;
    try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(legacy)); } catch { /* private mode */ }
    return legacy;
  }

  const initialTheme = themeFromStorage();
  const launchRecoverySnapshot = recoverySnapshotAtLaunch(initialTheme);
  const initialConfig = launchRecoverySnapshot ? freshConfig(initialTheme) : loadConfig();
  const initialThemePalettes = {
    light: paletteForTheme("light"),
    dark: paletteForTheme("dark")
  };
  initialThemePalettes[initialTheme] = cloneConfig(initialConfig.colors);

  const state = {
    config: initialConfig,
    audioFile: null,
    coverFile: null,
    coverImage: null,
    // Distinguish an embedded cover from one explicitly supplied by the user.
    // A new audio file may replace the former, but must preserve the latter.
    coverSource: "",
    audioBuffer: null,
    audioContext: null,
    analyser: null,
    gainNode: null,
    sourceNode: null,
    graphConnected: false,
    playing: false,
    pausedAt: 0,
    startedAt: 0,
    muted: false,
    volume: 1,
    raf: 0,
    lastFrame: 0,
    analysis: null,
    bpmTimeline: [],
    bpmDelayMs: 0,
    actionErrors: [],
    freqData: null,
    hasAnalyserSample: false,
    toastTimer: 0,
    exporting: false,
    mp4Exporting: false,
    mp4AbortController: null,
    mp4ModulePromise: null,
    language: languageFromStorage(),
    theme: initialTheme,
    themePalettes: initialThemePalettes,
    energy: 0,
    lowEnergy: 0,
    wallClock: 0,
    titleScroll: 0,
    coverFrameCanvas: null,
    coverFrameContext: null,
    coverFrameRaf: 0,
    recoveryTimer: 0,
    recoveryPromptShown: false,
    pendingRecovery: launchRecoverySnapshot,
    initializing: true,
    applyingRecovery: false,
    exportUi: {
      phase: "idle",
      labelKey: "output.ready",
      labelFallback: "Ready",
      detailKey: "output.readyDetail",
      detailFallback: "Choose an export option when you are ready.",
      ratio: 0,
      secondsLeft: null,
      format: "",
      busy: false
    },
    exportDialogOpener: null,
    tutorialDialogOpener: null,
    tutorialImageOpener: null,
    versionQuery: { phase: "idle", value: "" },
    completionAudioContext: null
  };
  let audioLoadGeneration = 0;

  const refs = {
    canvas: $("#visualizerCanvas"),
    stageNote: $("#stageEmptyNote"),
    audioInput: $("#audioInput"),
    coverInput: $("#coverInput"),
    presetInput: $("#presetInput"),
    songfileInput: $("#songfileInput"),
    actionsInput: $("#actionsInput"),
    audioDrop: $("#audioDrop"),
    coverDrop: $("#coverDrop"),
    songfileDrop: $("#songfileDrop"),
    sourceStatus: $("#sourceStatus"),
    fileStrip: $("#fileStrip"),
    title: $("#titleInput"),
    artist: $("#artistInput"),
    album: $("#albumInput"),
    genre: $("#genreInput"),
    bpm: $("#bpmInput"),
    track: $("#trackInput"),
    rolling: $("#rollingToggle"),
    scrub: $("#scrub"),
    play: $("#playButton"),
    playLabel: $("#playLabel"),
    back: $("#backButton"),
    forward: $("#forwardButton"),
    time: $("#timeReadout"),
    mute: $("#muteButton"),
    analysisStatus: $("#analysisStatus"),
    decode: $("#decodeValue"),
    sampleRate: $("#sampleRateValue"),
    channels: $("#channelsValue"),
    bitDepth: $("#bitDepthValue"),
    fileSize: $("#fileSizeValue"),
    headroom: $("#headroomValue"),
    exportSize: $("#exportSize"),
    customSizeFields: $("#customSizeFields"),
    customWidth: $("#customWidth"),
    customHeight: $("#customHeight"),
    exportFps: $("#exportFps"),
    exportDialog: $("#exportDialog"),
    openExportDialog: $("#openExportDialog"),
    closeExportDialog: $("#closeExportDialog"),
    exportState: $("#exportState"),
    exportStatus: $("#exportStatus"),
    exportStatusDetail: $("#exportStatusDetail"),
    exportProgress: $("#exportProgress"),
    exportProgressFill: $("#exportProgressFill"),
    exportProgressText: $("#exportProgressText"),
    exportNote: $("#exportNote"),
    toast: $("#toast"),
    actionsEditor: $("#actionsEditor"),
    actionsStatus: $("#actionsStatus"),
    recoveryDialog: $("#recoveryDialog"),
    recoveryRestore: $("#recoveryRestore"),
    recoveryDismiss: $("#recoveryDismiss"),
    recoveryName: $("#recoveryName"),
    recoveryAudioNote: $("#recoveryAudioNote"),
    tutorialButton: $("#tutorialButton"),
    tutorialDialog: $("#tutorialDialog"),
    tutorialTitle: $("#tutorialDialogTitle"),
    tutorialContent: $("#tutorialContent"),
    tutorialSectionSelect: $("#tutorialSectionSelect"),
    closeTutorialDialog: $("#closeTutorialDialog"),
    finishTutorial: $("#finishTutorial"),
    tutorialImageViewer: $("#tutorialImageViewer"),
    tutorialImageStage: $("#tutorialImageStage"),
    tutorialImagePreview: $("#tutorialImagePreview"),
    tutorialImageCaption: $("#tutorialImageCaption"),
    closeTutorialImageViewer: $("#closeTutorialImageViewer"),
    versionButton: $("#versionButton"),
    versionValue: $("#versionValue"),
    versionLabel: $("#versionLabel")
  };

  const originalTextNodes = new WeakMap();
  const LEGACY_TEXT_KEYS = {
    "MORE": "nav.more", "Visualizer": "nav.visualizer", "Customize": "nav.customize", "Export": "nav.export",
    "Audio Visualizer": "intro.title", "Drop an audio file to start previewing": "stage.drop", "Play": "stage.play", "Pause": "stage.pause", "Source": "source.heading", "Waiting": "source.waiting", "Add or drop audio": "source.audio", "Add cover": "source.cover", "Import settings": "source.preset", "No source loaded": "source.none",
    "Identity": "meta.heading", "Song title": "meta.title", "Artist / composer": "meta.artist", "Album": "meta.album", "Genre": "meta.genre", "Track": "meta.track", "Rolling title": "meta.rolling", "Estimate BPM": "meta.estimate",
    "Export": "output.heading", "Ready": "output.ready", "Canvas size": "output.canvas", "Frame rate": "output.fps", "Width": "output.width", "Height": "output.height", "Export PNG": "output.png", "Export MP4": "output.mp4",
    "Customize visualization": "custom.heading", "Turn display layers and audio metrics on or off as needed.": "custom.help", "Reset": "custom.reset", "Save preset": "custom.save", "Import": "custom.import", "Layers & metrics": "custom.layers", "Visible meters": "custom.visible", "Color system": "custom.colors", "Shuffle palette": "custom.shuffle", "Motion & density": "custom.motion", "Layout": "custom.layout", "Bar width": "custom.bar", "Spectrum energy": "custom.energy", "Waveform height": "custom.wave", "Motion": "custom.motionAmount", "Frequency scale": "custom.frequency", "Show labels": "custom.showLabels", "Reduce motion": "custom.reduced", "Cover orbit": "custom.coverOrbit", "BPM display & beat rail": "custom.bpm", "BPM 显示与节拍条": "custom.bpm", "Spectrum": "custom.spectrum", "Waveform": "custom.waveform", "Grid": "custom.grid", "Particles": "custom.particles", "Progress": "custom.progress", "Peak": "custom.peak", "RMS": "custom.rms", "Loudness estimate": "custom.loudness", "Dynamic range estimate": "custom.dynamic", "Crest factor": "custom.crest", "Duration": "custom.duration", "Background": "custom.background", "Ink": "custom.ink", "Accent": "custom.accent", "Secondary": "custom.secondary",
    "Audio information": "details.heading", "No audio decoded": "details.none", "Sample rate": "details.sample", "Channels": "details.channels", "Bit depth": "details.bitDepth", "File size": "details.fileSize", "Peak headroom": "details.headroom", "Decode state": "details.decode", "Idle": "details.idle",
    "Action List": "actions.heading", "Copy time": "actions.copy", "Save list": "actions.save", "Add action": "actions.add", "Timestamped notes for beats, scene changes, captions, or anything you want to remember while shaping a visual.": "actions.help", "No active actions yet. Saved locally in this browser.": "actions.none", "LOCAL-FIRST TOOL": "footer.local"
  };

  function applyLanguage() {
    const lang = state.language === "en" ? "en" : "zh";
    state.language = lang;
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.i18nLang = lang;
    document.title = lang === "zh" ? "FLAudioViz｜音频可视化" : "FLAudioViz | Audio Visualizer";
    $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n, node.textContent); });
    $$('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder, node.placeholder); });
    $$('[data-i18n-title]').forEach((node) => { node.title = t(node.dataset.i18nTitle, node.title); });
    $$('[data-i18n-aria], [data-i18n-aria-label]').forEach((node) => {
      const key = node.dataset.i18nAria || node.dataset.i18nAriaLabel;
      node.setAttribute("aria-label", t(key, node.getAttribute("aria-label") || ""));
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName) || parent.closest("[data-i18n]") || parent.closest("[data-i18n-placeholder]")) continue;
      if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
      const original = originalTextNodes.get(node).trim();
      const key = LEGACY_TEXT_KEYS[original];
      if (key) {
        const leading = node.nodeValue.match(/^\s*/)?.[0] || "";
        const trailing = node.nodeValue.match(/\s*$/)?.[0] || "";
        node.nodeValue = `${leading}${t(key, original)}${trailing}`;
      }
    }
    $$(".language-button").forEach((button) => {
      const active = button.dataset.lang === lang;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const editableDefaults = [
      [refs.title, ["Untitled track", "Untitled signal"], ["未命名曲目", "未命名信号"]],
      [refs.artist, ["Unknown artist", "Unknown source"], ["未知艺术家", "未知来源"]],
      [refs.genre, ["Ambient"], ["氛围"]]
    ];
    editableDefaults.forEach(([input, english, chinese]) => {
      if (!input) return;
      if (lang === "zh" && (english.includes(input.value) || input.value === "")) input.value = chinese[0];
      if (lang === "en" && chinese.includes(input.value)) input.value = english[0];
    });
    refs.play?.querySelector(".play-glyph") && setPlayButton(state.playing);
    if (refs.mute) {
      const muteKey = state.muted ? "stage.unmute" : "stage.mute";
      refs.mute.setAttribute("aria-label", t(muteKey, state.muted ? "Unmute" : "Mute"));
      refs.mute.title = t(muteKey, state.muted ? "Unmute" : "Mute");
    }
    if (refs.actionsEditor) refs.actionsEditor.placeholder = t("actions.placeholder", refs.actionsEditor.placeholder);
    if (refs.sourceStatus) {
      const statusKind = refs.sourceStatus.dataset.kind || "";
      refs.sourceStatus.textContent = statusKind === "ok"
        ? t("source.decoded", "Decoded")
        : statusKind === "error"
          ? (state.audioBuffer ? t("source.previousKept", "Previous file kept") : t("source.decodeFailed", "Decode failed"))
          : (state.audioBuffer ? t("source.decoded", "Decoded") : t("source.waiting", "Waiting"));
    }
    renderExportStatus?.();
    const mp4Label = $("#mp4Label");
    if (mp4Label) {
      const savingMp4 = state.mp4Exporting && state.exportUi.phase === "saving" && state.exportUi.format === "mp4";
      const key = state.mp4Exporting ? (savingMp4 ? "output.savingMp4" : "output.mp4Stop") : "output.mp4";
      mp4Label.textContent = t(key, savingMp4 ? "Saving MP4" : state.mp4Exporting ? "Stop MP4 export" : "Export MP4");
    }
    if (refs.exportNote) refs.exportNote.textContent = t("output.note", refs.exportNote.textContent);
    renderVersionQuery?.();
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* private mode */ }
    updateFileStrip?.();
    updateDetails?.();
    updateActionsStatus?.();
    renderOnce?.();
  }

  const canvasContext = refs.canvas.getContext("2d");
  const particles = Array.from({ length: 46 }, (_, index) => ({
    x: ((index * 173) % 1910) + 5,
    y: ((index * 97) % 1010) + 20,
    r: 1 + ((index * 7) % 4) / 2,
    phase: (index * 1.73) % (Math.PI * 2),
    speed: .12 + ((index * 13) % 9) / 90
  }));

  function songStem() {
    const raw = String(refs.title?.value || "").trim()
      || String(state.audioFile?.name || "").replace(/\.[^.]+$/, "")
      || "audio";
    // Keep CJK and other readable characters, while removing path separators
    // and Windows-reserved filename characters.
    const safe = raw
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 120)
      .replace(/^-+|-+$/g, "");
    return safe || "audio";
  }

  function recoveryPayload() {
    const payload = presetPayload();
    return {
      ...payload,
      format: "flaviz-recovery",
      version: 1,
      audioName: state.audioFile?.name || "",
      coverName: state.coverFile?.name || ""
    };
  }

  function scheduleRecoverySnapshot() {
    if (state.initializing || state.applyingRecovery) return;
    clearTimeout(state.recoveryTimer);
    state.recoveryTimer = setTimeout(() => {
      try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(recoveryPayload())); }
      catch { /* private mode or storage quota; normal autosave still works */ }
    }, 240);
  }

  function readRecoverySnapshot() {
    try {
      const raw = localStorage.getItem(RECOVERY_KEY);
      if (!raw) return null;
      const snapshot = JSON.parse(raw);
      const valid = snapshot
        && typeof snapshot === "object"
        && snapshot.format === "flaviz-recovery"
        && snapshot.version === 1
        && typeof snapshot.savedAt === "string"
        && snapshot.config
        && typeof snapshot.config === "object";
      if (!valid) {
        localStorage.removeItem(RECOVERY_KEY);
        return null;
      }
      return snapshot;
    } catch {
      try { localStorage.removeItem(RECOVERY_KEY); } catch { /* private mode */ }
      return null;
    }
  }

  function clearRecoverySnapshot() {
    clearTimeout(state.recoveryTimer);
    try { localStorage.removeItem(RECOVERY_KEY); } catch { /* private mode */ }
  }

  function clearSessionPersistence() {
    clearRecoverySnapshot();
    for (const key of [CONFIG_KEY, META_KEY, ACTIONS_KEY]) {
      try { localStorage.removeItem(key); } catch { /* private mode */ }
    }
  }

  function resolveRecovery(restore) {
    const snapshot = state.pendingRecovery || readRecoverySnapshot();
    if (!snapshot) {
      refs.recoveryDialog?.close?.();
      return;
    }
    if (!restore) {
      state.pendingRecovery = null;
      clearSessionPersistence();
      refs.recoveryDialog?.close?.();
      return;
    }
    try {
      state.applyingRecovery = true;
      applyPreset(snapshot, { silent: true });
      // Keep the snapshot as an autosave, not a one-use token. A later page
      // load must ask again even when the user closes immediately after restore.
      try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(snapshot)); } catch { /* private mode */ }
      state.pendingRecovery = null;
      state.applyingRecovery = false;
      refs.recoveryDialog?.close?.();
      showToast(t("toast.recoveryRestored", "Previous FLAudioViz settings restored."));
    } catch (error) {
      state.applyingRecovery = false;
      console.error(error);
      showToast(t("toast.presetInvalid", "That preset file is not valid."));
    }
  }

  function offerRecovery() {
    if (state.recoveryPromptShown) return;
    const snapshot = state.pendingRecovery || readRecoverySnapshot();
    if (!snapshot) return;
    state.pendingRecovery = snapshot;
    state.recoveryPromptShown = true;
    const name = snapshot.audioName || snapshot.metadata?.title || t("recovery.unknown", "Untitled project");
    if (refs.recoveryName) refs.recoveryName.textContent = name;
    if (refs.recoveryAudioNote) refs.recoveryAudioNote.textContent = t("recovery.audio", "Audio and cover files are not stored in the snapshot; choose them again after restoring.");
    if (refs.recoveryDialog?.showModal) {
      try {
        if (!refs.recoveryDialog.open) refs.recoveryDialog.showModal();
        return;
      } catch { /* fall back to confirm below */ }
    }
    const restore = window.confirm(`${t("recovery.body", "A local FLAudioViz snapshot was found.")}\n${name}\n${t("recovery.audio", "Audio and cover files are not stored in the snapshot; choose them again after restoring.")}`);
    resolveRecovery(restore);
  }

  function saveConfig() {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(state.config)); } catch { /* private mode */ }
    scheduleRecoverySnapshot();
  }

  function saveMetadata() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify({
        title: refs.title.value, artist: refs.artist.value, album: refs.album.value,
        genre: refs.genre.value, bpm: refs.bpm.value, track: refs.track.value, rolling: refs.rolling.checked
      }));
    } catch { /* private mode */ }
    scheduleRecoverySnapshot();
  }

  function showToast(message, duration = 2600) {
    refs.toast.textContent = message;
    refs.toast.classList.add("is-visible");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => refs.toast.classList.remove("is-visible"), duration);
  }

  function formatTime(seconds) {
    const value = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(value / 60);
    const secs = Math.floor(value % 60);
    const hours = Math.floor(minutes / 60);
    const minuteText = hours ? String(minutes % 60).padStart(2, "0") : String(minutes);
    return `${hours ? `${hours}:` : ""}${minuteText}:${String(secs).padStart(2, "0")}`;
  }

  function formatActionTime(seconds) {
    const totalMilliseconds = Math.max(0, Math.round((Number(seconds) || 0) * 1000));
    const hours = Math.floor(totalMilliseconds / 3_600_000);
    const minutes = Math.floor(totalMilliseconds / 60_000) % 60;
    const secs = Math.floor(totalMilliseconds / 1000) % 60;
    const milliseconds = totalMilliseconds % 1000;
    const minuteText = String(minutes).padStart(2, "0");
    return `${hours ? `${hours}:` : ""}${minuteText}:${String(secs).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
  }

  function parseActionTimestamp(value) {
    const raw = String(value || "").trim();
    if (!raw) return NaN;
    if (/^\d+(?:\.\d+)?$/.test(raw)) return Number(raw);
    const parts = raw.split(":");
    if (parts.length < 2 || parts.length > 3) return NaN;
    const seconds = Number(parts.pop());
    const minutes = Number(parts.pop());
    const hours = parts.length ? Number(parts.pop()) : 0;
    if (![seconds, minutes, hours].every(Number.isFinite) || seconds < 0 || seconds >= 60 || minutes < 0 || minutes >= 60 || hours < 0) return NaN;
    return hours * 3600 + minutes * 60 + seconds;
  }

  // The original tool uses `timestamp bpm value`. Keep the parser deliberately
  // small here so regular notes remain valid text while BPM lines drive the
  // visual tempo rail.
  function parseBpmActions(text) {
    const points = [];
    const errors = [];
    String(text || "").split(/\r?\n/).forEach((lineText, index) => {
      const raw = lineText.trim();
      if (!raw || raw.startsWith("#")) return;
      const tokens = raw.split(/\s+/);
      if (!/^(bpm|tempo)$/i.test(tokens[1] || "")) return;
      const time = parseActionTimestamp(tokens[0]);
      const keyed = tokens.slice(2).find((token) => /^(bpm|value)=/i.test(token));
      const value = keyed ? keyed.slice(keyed.indexOf("=") + 1) : tokens[2];
      const bpm = Number(value);
      if (!Number.isFinite(time) || time < 0) errors.push({ line: index + 1, message: `Invalid BPM timestamp "${tokens[0]}".` });
      else if (!Number.isFinite(bpm) || bpm <= 0) errors.push({ line: index + 1, message: "BPM action needs a positive number." });
      else points.push({ time, bpm: clamp(bpm, 1, 999), line: index + 1 });
    });
    points.sort((a, b) => a.time - b.time || a.line - b.line);
    return { points, errors };
  }

  function baseBpm() {
    const value = Number(refs.bpm?.value);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function tempoStateAt(time) {
    const points = Array.isArray(state.bpmTimeline) ? state.bpmTimeline : [];
    let bpm = baseBpm();
    let start = 0;
    let beat = 0;
    const target = Math.max(0, Number(time) || 0) + (Number(state.bpmDelayMs) || 0) / 1000;
    for (const point of points) {
      if (!point || !Number.isFinite(point.time) || point.time > target) break;
      if (bpm > 0) beat += ((point.time - start) * bpm) / 60;
      bpm = Number(point.bpm) > 0 ? Number(point.bpm) : bpm;
      start = Math.max(start, point.time);
    }
    if (bpm > 0) beat += ((target - start) * bpm) / 60;
    return { bpm, beat };
  }

  function bpmAtTime(time) {
    return tempoStateAt(time).bpm;
  }

  function bpmMotionPosition(time) {
    const tempo = tempoStateAt(time);
    if (!tempo.bpm) return .5;
    const phase = ((tempo.beat % 2) + 2) % 2;
    return phase <= 1 ? phase : 2 - phase;
  }

  function bpmPopAtTime(time) {
    const effectiveTime = Math.max(0, Number(time) || 0) + (Number(state.bpmDelayMs) || 0) / 1000;
    let age = Infinity;
    for (const point of state.bpmTimeline || []) {
      if (point.time <= effectiveTime) age = Math.min(age, effectiveTime - point.time);
    }
    if (age > .72) return 0;
    return Math.sin((age / .72) * Math.PI) * (1 - age / .72);
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "--";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
    return `${value >= 100 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
  }

  function db(value) {
    if (!Number.isFinite(value) || value <= 1e-8) return null;
    return 20 * Math.log10(value);
  }

  function dbText(value) {
    return Number.isFinite(value) ? `${value.toFixed(1)} dB` : "--";
  }

  function hexRgb(value) {
    const clean = hex(value).slice(1).padEnd(6, "0");
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }

  function rgba(value, alpha = 1) {
    const c = hexRgb(value);
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${clamp(alpha, 0, 1)})`;
  }

  function mixHex(a, b, amount) {
    const ca = hexRgb(a); const cb = hexRgb(b); const t = clamp(amount, 0, 1);
    const channel = (x, y) => Math.round(lerp(x, y, t)).toString(16).padStart(2, "0");
    return `#${channel(ca.r, cb.r)}${channel(ca.g, cb.g)}${channel(ca.b, cb.b)}`;
  }

  function quantile(values, q) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * clamp(q, 0, 1);
    const base = Math.floor(pos); const rest = pos - base;
    return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
  }

  function parseWavBitDepth(buffer) {
    try {
      const view = new DataView(buffer);
      const ascii = (offset) => String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
      if (buffer.byteLength < 12 || ascii(0) !== "RIFF" || ascii(8) !== "WAVE") return null;
      let offset = 12;
      while (offset + 8 <= buffer.byteLength) {
        const id = ascii(offset);
        const size = view.getUint32(offset + 4, true);
        if (id === "fmt " && offset + 24 <= buffer.byteLength) return view.getUint16(offset + 22, true);
        offset += 8 + size + (size % 2);
      }
    } catch { /* metadata is optional */ }
    return null;
  }

  // Audio tags are deliberately parsed without a third-party dependency. The
  // visualizer already has the complete file buffer in memory, and keeping the
  // small readers here means tags and embedded artwork work offline as well.
  function textDecoder(label, fallback = "utf-8") {
    try { return new TextDecoder(label); } catch { return new TextDecoder(fallback); }
  }

  const utf8Decoder = () => textDecoder("utf-8");

  function decodeTagText(bytes, encoding = 3) {
    if (!bytes?.length) return "";
    let value = "";
    try {
      if (encoding === 1) {
        const hasLeBom = bytes[0] === 0xff && bytes[1] === 0xfe;
        const hasBeBom = bytes[0] === 0xfe && bytes[1] === 0xff;
        if (hasBeBom) {
          const swapped = new Uint8Array(bytes.length - 2);
          for (let i = 2; i + 1 < bytes.length; i += 2) {
            swapped[i - 2] = bytes[i + 1];
            swapped[i - 1] = bytes[i];
          }
          value = textDecoder("utf-16le").decode(swapped);
        } else {
          value = textDecoder("utf-16le").decode(hasLeBom ? bytes.subarray(2) : bytes);
        }
      } else if (encoding === 2) {
        const swapped = new Uint8Array(bytes.length - (bytes.length % 2));
        for (let i = 0; i + 1 < swapped.length; i += 2) {
          swapped[i] = bytes[i + 1];
          swapped[i + 1] = bytes[i];
        }
        value = textDecoder("utf-16le").decode(swapped);
      } else if (encoding === 0) {
        value = textDecoder("iso-8859-1").decode(bytes);
      } else {
        value = utf8Decoder().decode(bytes);
      }
    } catch {
      value = String.fromCharCode(...bytes);
    }
    return value.replace(/\u0000/g, "").trim();
  }

  function readAscii(bytes, start, length) {
    let value = "";
    for (let i = 0; i < length && start + i < bytes.length; i += 1) {
      const code = bytes[start + i];
      value += code >= 32 && code < 127 ? String.fromCharCode(code) : "";
    }
    return value;
  }

  function bytesEqual(bytes, start, values) {
    if (start < 0 || start + values.length > bytes.length) return false;
    for (let i = 0; i < values.length; i += 1) if (bytes[start + i] !== values[i]) return false;
    return true;
  }

  function synchsafe(bytes, start) {
    return ((bytes[start] & 0x7f) << 21) | ((bytes[start + 1] & 0x7f) << 14) | ((bytes[start + 2] & 0x7f) << 7) | (bytes[start + 3] & 0x7f);
  }

  function trimTagValue(value) {
    return String(value || "").replace(/\u0000/g, "").replace(/^\s+|\s+$/g, "");
  }

  function normalizeGenre(value) {
    const clean = trimTagValue(value);
    // ID3 commonly stores a numeric genre as "(17)Rock". Keep the useful
    // human-readable part while leaving unknown numeric-only values intact.
    return clean.replace(/^\(\d+\)/, "").trim() || clean;
  }

  function normalizeTrack(value) {
    const match = String(value || "").match(/\d+/);
    return match ? match[0] : trimTagValue(value);
  }

  function normalizeBpm(value) {
    const match = String(value || "").match(/\d+(?:\.\d+)?/);
    if (!match) return "";
    const number = Number(match[0]);
    return Number.isFinite(number) && number > 0 && number <= 999 ? String(number).replace(/\.0+$/, "") : "";
  }

  function metadataResult() {
    return { title: "", artist: "", album: "", genre: "", bpm: "", track: "", bitDepth: null, cover: null };
  }

  function id3ImageMime(bytes, fallback = "image/jpeg") {
    const value = trimTagValue(fallback).toLowerCase();
    if (value.startsWith("image/")) return value;
    if (bytesEqual(bytes, 0, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
    if (bytesEqual(bytes, 0, [0xff, 0xd8, 0xff])) return "image/jpeg";
    if (bytesEqual(bytes, 0, [0x52, 0x49, 0x46, 0x46]) && bytesEqual(bytes, 8, [0x57, 0x45, 0x42, 0x50])) return "image/webp";
    return "image/jpeg";
  }

  function parseId3Metadata(buffer) {
    const bytes = new Uint8Array(buffer);
    if (!bytesEqual(bytes, 0, [0x49, 0x44, 0x33]) || bytes.length < 10) return null;
    const result = metadataResult();
    const major = bytes[3];
    if (major < 2 || major > 4) return result;
    const flags = bytes[5];
    const declaredSize = synchsafe(bytes, 6);
    const tagEnd = Math.min(bytes.length, 10 + declaredSize);
    let offset = 10;
    if (flags & 0x40) {
      // Extended headers differ slightly between v2.3 and v2.4.
      const extSize = major === 3 && offset + 4 <= tagEnd
        ? new DataView(buffer).getUint32(offset, false) + 4
        : (offset + 4 <= tagEnd ? synchsafe(bytes, offset) : 0);
      if (extSize > 0 && offset + extSize <= tagEnd) offset += extSize;
    }
    const setText = (id, value) => {
      const text = trimTagValue(value);
      if (!text) return;
      if (id === "TIT2" || id === "TT2") result.title ||= text;
      else if (id === "TPE1" || id === "TP1") result.artist ||= text;
      else if (id === "TALB" || id === "TAL") result.album ||= text;
      else if (id === "TCON" || id === "TCO") result.genre ||= normalizeGenre(text);
      else if (id === "TBPM" || id === "TBP") result.bpm ||= normalizeBpm(text);
      else if (id === "TRCK" || id === "TRK") result.track ||= normalizeTrack(text);
    };
    while (offset + (major === 2 ? 6 : 10) <= tagEnd) {
      const idLength = major === 2 ? 3 : 4;
      const id = readAscii(bytes, offset, idLength);
      if (!id || /^\0+$/.test(id)) break;
      const size = major === 2
        ? ((bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5])
        : (major === 4 ? synchsafe(bytes, offset + 4) : ((bytes[offset + 4] << 24) >>> 0) + (bytes[offset + 5] << 16) + (bytes[offset + 6] << 8) + bytes[offset + 7]);
      const headerSize = major === 2 ? 6 : 10;
      if (!size || offset + headerSize + size > tagEnd) break;
      const payloadStart = offset + headerSize;
      const payload = bytes.subarray(payloadStart, payloadStart + size);
      if (id[0] === "T" && payload.length > 1) {
        setText(id, decodeTagText(payload.subarray(1), payload[0]));
      } else if (id === "APIC" && payload.length > 4) {
        const encoding = payload[0];
        let cursor = 1;
        const mimeStart = cursor;
        while (cursor < payload.length && payload[cursor] !== 0) cursor += 1;
        const mime = decodeTagText(payload.subarray(mimeStart, cursor), 0);
        cursor += 1;
        if (cursor < payload.length) cursor += 1; // picture type
        const terminatorWidth = encoding === 1 || encoding === 2 ? 2 : 1;
        while (cursor + terminatorWidth - 1 < payload.length) {
          const done = terminatorWidth === 1
            ? payload[cursor] === 0
            : payload[cursor] === 0 && payload[cursor + 1] === 0;
          if (done) { cursor += terminatorWidth; break; }
          cursor += terminatorWidth;
        }
        const image = payload.subarray(cursor);
        if (image.length && !result.cover) result.cover = { bytes: image.slice(), mime: id3ImageMime(image, mime), extension: "jpg" };
      } else if (id === "PIC" && payload.length > 6) {
        // ID3v2.2 uses a three-byte image format instead of a MIME string.
        const format = readAscii(payload, 1, 3).toLowerCase();
        let cursor = 4;
        if (cursor < payload.length) cursor += 1;
        while (cursor < payload.length && payload[cursor] !== 0) cursor += 1;
        cursor += 1;
        const image = payload.subarray(cursor);
        if (image.length && !result.cover) result.cover = { bytes: image.slice(), mime: id3ImageMime(image, format === "png" ? "image/png" : "image/jpeg"), extension: format === "png" ? "png" : "jpg" };
      }
      offset += headerSize + size;
    }
    return result;
  }

  function parseFlacMetadata(buffer) {
    const bytes = new Uint8Array(buffer);
    if (!bytesEqual(bytes, 0, [0x66, 0x4c, 0x61, 0x43]) || bytes.length < 8) return null;
    const result = metadataResult();
    let offset = 4;
    while (offset + 4 <= bytes.length) {
      const header = bytes[offset];
      const type = header & 0x7f;
      const length = (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
      const start = offset + 4;
      const end = Math.min(bytes.length, start + length);
      if (end < start) break;
      if (type === 0 && length >= 18) {
        // STREAMINFO stores sample rate/channels/bit depth in a packed word.
        const packed = (bytes[start + 10] << 24) | (bytes[start + 11] << 16) | (bytes[start + 12] << 8) | bytes[start + 13];
        result.bitDepth = ((packed >>> 4) & 0x1f) + 1;
      } else if (type === 4 && length >= 8) {
        let cursor = start;
        const readLe32 = () => {
          if (cursor + 4 > end) return null;
          const value = (bytes[cursor] | (bytes[cursor + 1] << 8) | (bytes[cursor + 2] << 16) | (bytes[cursor + 3] << 24)) >>> 0;
          cursor += 4;
          return value;
        };
        const vendorLength = readLe32();
        if (vendorLength === null || cursor + vendorLength > end) break;
        cursor += vendorLength;
        const count = readLe32();
        if (count === null) break;
        for (let i = 0; i < count && cursor + 4 <= end; i += 1) {
          const itemLength = readLe32();
          if (itemLength === null || cursor + itemLength > end) break;
          const item = decodeTagText(bytes.subarray(cursor, cursor + itemLength), 3);
          cursor += itemLength;
          const split = item.indexOf("=");
          if (split < 1) continue;
          const key = item.slice(0, split).toLowerCase();
          const value = item.slice(split + 1);
          if (key === "title" || key === "tracktitle") result.title ||= trimTagValue(value);
          else if (key === "artist" || key === "albumartist") result.artist ||= trimTagValue(value);
          else if (key === "album") result.album ||= trimTagValue(value);
          else if (key === "genre") result.genre ||= normalizeGenre(value);
          else if (key === "bpm" || key === "tempo") result.bpm ||= normalizeBpm(value);
          else if (key === "tracknumber" || key === "track") result.track ||= normalizeTrack(value);
        }
      } else if (type === 6 && length >= 32) {
        let cursor = start;
        const readBe32 = () => {
          if (cursor + 4 > end) return null;
          const value = ((bytes[cursor] << 24) >>> 0) | (bytes[cursor + 1] << 16) | (bytes[cursor + 2] << 8) | bytes[cursor + 3];
          cursor += 4;
          return value >>> 0;
        };
        const pictureType = readBe32();
        const mimeLength = readBe32();
        if (pictureType === null || mimeLength === null || cursor + mimeLength > end) { offset = end; continue; }
        const mime = decodeTagText(bytes.subarray(cursor, cursor + mimeLength), 0);
        cursor += mimeLength;
        const descLength = readBe32();
        if (descLength === null || cursor + descLength > end) { offset = end; continue; }
        cursor += descLength;
        // width, height, color depth and indexed-color count
        if (cursor + 16 > end) { offset = end; continue; }
        cursor += 16;
        const dataLength = readBe32();
        if (dataLength !== null && dataLength > 0 && cursor + dataLength <= end && !result.cover) {
          const image = bytes.subarray(cursor, cursor + dataLength);
          result.cover = { bytes: image.slice(), mime: id3ImageMime(image, mime), extension: mime.includes("png") ? "png" : "jpg" };
        }
      }
      offset = end;
      if (header & 0x80) break;
    }
    return result;
  }

  function mp4AtomName(bytes, start) {
    return String.fromCharCode(bytes[start], bytes[start + 1], bytes[start + 2], bytes[start + 3]);
  }

  function mp4NameIs(bytes, start, name) {
    const values = [...name].map((character) => character.charCodeAt(0));
    return bytesEqual(bytes, start, values);
  }

  function parseMp4Metadata(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 12 || !["ftyp", "moov", "free", "mdat"].some((name) => mp4NameIs(bytes, 4, name))) return null;
    const result = metadataResult();
    const view = new DataView(buffer);
    const readU32 = (offset) => offset + 4 <= bytes.length ? view.getUint32(offset, false) : 0;
    const isType = (offset, name) => mp4NameIs(bytes, offset, name);
    const itemNames = {
      title: [0xa9, 0x6e, 0x61, 0x6d],
      artist: [0xa9, 0x41, 0x52, 0x54],
      album: [0xa9, 0x61, 0x6c, 0x62],
      genre: [0xa9, 0x67, 0x65, 0x6e]
    };
    const itemMatches = (offset, values) => bytesEqual(bytes, offset, values);
    const readDataAtoms = (start, end, itemType) => {
      let cursor = start;
      while (cursor + 8 <= end) {
        let size = readU32(cursor);
        const atomStart = cursor;
        const typeStart = cursor + 4;
        let header = 8;
        if (size === 1 && cursor + 16 <= end) { size = Number(view.getBigUint64(cursor + 8, false)); header = 16; }
        if (!size || size < header || atomStart + size > end) break;
        if (isType(typeStart, "data") && atomStart + header + 8 <= end) {
          const payloadStart = atomStart + header + 8;
          const payloadEnd = atomStart + size;
          const payload = bytes.subarray(payloadStart, payloadEnd);
          if (itemType === "bpm" && payload.length >= 2) result.bpm ||= normalizeBpm(String(view.getUint16(payloadStart, false)));
          else if (itemType === "track" && payload.length >= 4) result.track ||= normalizeTrack(String(view.getUint16(payloadStart + 2, false)));
          else if (itemType === "cover" && payload.length) {
            const image = payload.slice();
            result.cover ||= { bytes: image, mime: (view.getUint32(atomStart + header + 4, false) === 14 || bytesEqual(image, 0, [0x89, 0x50, 0x4e, 0x47])) ? "image/png" : "image/jpeg", extension: "jpg" };
          } else if (itemType && payload.length) {
            const value = decodeTagText(payload, 3);
            if (itemType === "title") result.title ||= trimTagValue(value);
            else if (itemType === "artist") result.artist ||= trimTagValue(value);
            else if (itemType === "album") result.album ||= trimTagValue(value);
            else if (itemType === "genre") result.genre ||= normalizeGenre(value);
          }
        }
        cursor += size;
      }
    };
    const walk = (start, end, parent = "") => {
      let cursor = start;
      while (cursor + 8 <= end) {
        const atomStart = cursor;
        let size = readU32(cursor);
        const typeStart = cursor + 4;
        let header = 8;
        if (size === 1 && cursor + 16 <= end) { size = Number(view.getBigUint64(cursor + 8, false)); header = 16; }
        if (!size || size < header || atomStart + size > end) break;
        const atomEnd = atomStart + size;
        const type = mp4AtomName(bytes, typeStart);
        if (type === "meta") {
          // Full-box version/flags occupy four bytes before child atoms.
          walk(atomStart + header + 4, atomEnd, type);
        } else if (type === "ilst") {
          let itemCursor = atomStart + header;
          while (itemCursor + 8 <= atomEnd) {
            let itemSize = readU32(itemCursor);
            const itemTypeStart = itemCursor + 4;
            let itemHeader = 8;
            if (itemSize === 1 && itemCursor + 16 <= atomEnd) { itemSize = Number(view.getBigUint64(itemCursor + 8, false)); itemHeader = 16; }
            if (!itemSize || itemSize < itemHeader || itemCursor + itemSize > atomEnd) break;
            let itemType = "";
            if (itemMatches(itemTypeStart, itemNames.title)) itemType = "title";
            else if (itemMatches(itemTypeStart, itemNames.artist)) itemType = "artist";
            else if (itemMatches(itemTypeStart, itemNames.album)) itemType = "album";
            else if (itemMatches(itemTypeStart, itemNames.genre)) itemType = "genre";
            else if (isType(itemTypeStart, "trkn")) itemType = "track";
            else if (isType(itemTypeStart, "tmpo")) itemType = "bpm";
            else if (isType(itemTypeStart, "covr")) itemType = "cover";
            readDataAtoms(itemCursor + itemHeader, itemCursor + itemSize, itemType);
            itemCursor += itemSize;
          }
        } else if (["moov", "udta", "ilst"].includes(type)) {
          walk(atomStart + header, atomEnd, type);
        }
        cursor = atomEnd;
      }
    };
    walk(0, bytes.length);
    return result;
  }

  function parseWavMetadata(buffer) {
    const bytes = new Uint8Array(buffer);
    if (!bytesEqual(bytes, 0, [0x52, 0x49, 0x46, 0x46]) || !bytesEqual(bytes, 8, [0x57, 0x41, 0x56, 0x45])) return null;
    const result = metadataResult();
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const id = readAscii(bytes, offset, 4);
      const size = new DataView(buffer).getUint32(offset + 4, true);
      const start = offset + 8;
      const end = Math.min(bytes.length, start + size);
      if (id === "LIST" && start + 4 <= end && readAscii(bytes, start, 4) === "INFO") {
        let cursor = start + 4;
        while (cursor + 8 <= end) {
          const key = readAscii(bytes, cursor, 4);
          const valueSize = new DataView(buffer).getUint32(cursor + 4, true);
          const valueEnd = Math.min(end, cursor + 8 + valueSize);
          // RIFF INFO strings are conventionally ANSI, but modern encoders
          // (including ffmpeg) write UTF-8. UTF-8 first preserves CJK tags;
          // ASCII/legacy files still decode identically.
          const value = decodeTagText(bytes.subarray(cursor + 8, valueEnd), 3);
          if (key === "INAM") result.title ||= value;
          else if (key === "IART") result.artist ||= value;
          else if (key === "IPRD") result.album ||= value;
          else if (key === "IGNR") result.genre ||= normalizeGenre(value);
          else if (key === "ITRK" || key === "IPRT") result.track ||= normalizeTrack(value);
          else if (key === "IBPM") result.bpm ||= normalizeBpm(value);
          cursor += 8 + valueSize + (valueSize % 2);
        }
      }
      offset = end + (size % 2);
    }
    result.bitDepth = parseWavBitDepth(buffer);
    return result;
  }

  function parseAudioMetadata(buffer, fileName = "") {
    const bytes = new Uint8Array(buffer);
    let result = null;
    if (bytesEqual(bytes, 0, [0x49, 0x44, 0x33])) result = parseId3Metadata(buffer);
    else if (bytesEqual(bytes, 0, [0x66, 0x4c, 0x61, 0x43])) result = parseFlacMetadata(buffer);
    else if (bytesEqual(bytes, 0, [0x52, 0x49, 0x46, 0x46]) && bytesEqual(bytes, 8, [0x57, 0x41, 0x56, 0x45])) result = parseWavMetadata(buffer);
    else if (/\.(?:m4a|m4b|mp4|aac)$/i.test(fileName) || bytes.length >= 12 && mp4NameIs(bytes, 4, "ftyp")) result = parseMp4Metadata(buffer);
    return result || metadataResult();
  }

  function coverFileFromMetadata(cover, audioFile) {
    if (!cover?.bytes?.length) return null;
    const extension = cover.extension || (cover.mime?.includes("png") ? "png" : "jpg");
    const stem = String(audioFile?.name || "audio").replace(/\.[^.]+$/, "") || "audio";
    try { return new File([cover.bytes], `${stem}-cover.${extension}`, { type: cover.mime || "image/jpeg" }); }
    catch { return new Blob([cover.bytes], { type: cover.mime || "image/jpeg" }); }
  }

  function shouldAutofill(ref, defaults = []) {
    const value = String(ref?.value || "").trim();
    return !value || defaults.includes(value);
  }

  function applyParsedMetadata(metadata) {
    if (!metadata) return;
    const pairs = [
      [refs.title, metadata.title, ["Untitled track", "Untitled signal", "未命名曲目", "未命名信号"]],
      [refs.artist, metadata.artist, ["Unknown artist", "Unknown source", "未知艺术家", "未知来源"]],
      [refs.album, metadata.album, []],
      [refs.genre, metadata.genre, ["Ambient", "氛围"]],
      [refs.bpm, metadata.bpm, []],
      [refs.track, metadata.track, []]
    ];
    for (const [ref, value, defaults] of pairs) if (ref && value && shouldAutofill(ref, defaults)) ref.value = value;
    if (Number.isFinite(metadata.bitDepth)) state.analysis && (state.analysis.bitDepth = metadata.bitDepth);
    saveMetadata();
  }

  function analyzeBuffer(audioBuffer) {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const channelData = Array.from({ length: channels }, (_, i) => audioBuffer.getChannelData(i));
    const stride = Math.max(1, Math.ceil(length / 2200000));
    const peakStride = length <= 20000000 ? 1 : stride;
    let peak = 0;
    let energy = 0;
    let count = 0;
    for (let i = 0; i < length; i += peakStride) {
      let sampleEnergy = 0;
      for (const channel of channelData) {
        const sample = channel[i] || 0;
        const absolute = Math.abs(sample);
        if (absolute > peak) peak = absolute;
        sampleEnergy += sample * sample;
      }
      if (i % stride === 0 || peakStride === stride) {
        energy += sampleEnergy / channels;
        count += 1;
      }
    }
    const rms = count ? Math.sqrt(energy / count) : 0;
    const binCount = 960;
    const min = new Float32Array(binCount);
    const max = new Float32Array(binCount);
    const rmsBins = new Float32Array(binCount);
    const rmsValues = [];
    for (let bin = 0; bin < binCount; bin += 1) {
      const start = Math.floor(bin * length / binCount);
      const end = Math.max(start + 1, Math.floor((bin + 1) * length / binCount));
      const step = Math.max(1, Math.floor((end - start) / 480));
      let lo = 1; let hi = -1; let square = 0; let seen = 0;
      for (let i = start; i < end; i += step) {
        let mixed = 0;
        for (const channel of channelData) mixed += channel[i] || 0;
        mixed /= channels;
        lo = Math.min(lo, mixed); hi = Math.max(hi, mixed); square += mixed * mixed; seen += 1;
      }
      const binRms = seen ? Math.sqrt(square / seen) : 0;
      min[bin] = lo === 1 ? 0 : lo; max[bin] = hi === -1 ? 0 : hi; rmsBins[bin] = binRms; rmsValues.push(binRms);
    }
    const loudness = db(rms);
    const q95 = quantile(rmsValues, .95);
    const q10 = quantile(rmsValues, .1);
    const dynamicRange = q95 > 1e-8 && q10 > 1e-8 ? db(q95) - db(q10) : null;
    const peakDb = db(peak);
    const rmsDb = loudness;
    return {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels,
      peak,
      peakDb,
      rms,
      rmsDb,
      loudness,
      dynamicRange: Number.isFinite(dynamicRange) ? dynamicRange : null,
      crest: Number.isFinite(peakDb) && Number.isFinite(rmsDb) ? peakDb - rmsDb : null,
      waveform: { min, max, rms: rmsBins },
      rmsProfile: rmsValues,
      bitDepth: null
    };
  }

  function currentTime() {
    if (!state.playing || !state.audioContext) return state.pausedAt || 0;
    return clamp(state.audioContext.currentTime - state.startedAt, 0, state.analysis?.duration || 0);
  }

  function setStatus(text, kind = "") {
    refs.sourceStatus.textContent = text;
    refs.sourceStatus.dataset.kind = kind;
  }

  function setPlayButton(playing) {
    refs.playLabel.textContent = playing ? t("stage.pause", "Pause") : t("stage.play", "Play");
    refs.play.querySelector(".play-glyph").textContent = playing ? "Ⅱ" : "▶";
    refs.play.setAttribute("aria-label", playing ? t("stage.pause", "Pause") : t("stage.play", "Play"));
  }

  function updateDetails() {
    const a = state.analysis;
    refs.analysisStatus.textContent = a ? t("details.analyzed", "{duration}s analyzed", { duration: a.duration.toFixed(2) }) : t("details.none", "No audio decoded");
    refs.decode.textContent = a ? t("details.ready", "Ready") : t("details.idle", "Idle");
    refs.sampleRate.textContent = a ? `${(a.sampleRate / 1000).toFixed(1)} kHz` : "--";
    refs.channels.textContent = a ? String(a.channels) : "--";
    refs.bitDepth.textContent = a?.bitDepth ? `${a.bitDepth} bit` : "--";
    refs.fileSize.textContent = state.audioFile ? formatBytes(state.audioFile.size) : "--";
    refs.headroom.textContent = a && Number.isFinite(a.peakDb) ? `${Math.max(0, -a.peakDb).toFixed(1)} dB` : "--";
  }

  function updateFileStrip() {
    if (!state.audioFile) {
      refs.fileStrip.textContent = t("source.none", "No source loaded");
      return;
    }
    const cover = state.coverFile ? ` + ${t("source.cover", "cover")}` : "";
    refs.fileStrip.textContent = `${state.audioFile.name}${cover} · ${formatBytes(state.audioFile.size)}`;
  }

  function updateTimeUI() {
    const duration = state.analysis?.duration || 0;
    const time = currentTime();
    refs.scrub.value = duration ? String(time / duration) : "0";
    refs.time.textContent = `${formatTime(time)} / ${formatTime(duration)}`;
    refs.time.hidden = !state.config.layers.timelineLabels;
  }

  function stopSource() {
    if (!state.sourceNode) return;
    state.sourceNode.onended = null;
    try { state.sourceNode.stop(); } catch { /* already stopped */ }
    try { state.sourceNode.disconnect(); } catch { /* noop */ }
    state.sourceNode = null;
  }

  function configureAnalyser() {
    if (!state.analyser) return;
    const allowed = [256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
    const requested = Number(state.config.fftSize);
    const fftSize = allowed.includes(requested) ? requested : 16384;
    state.analyser.fftSize = fftSize;
    // Keep the original instrument feel: responsive bars with a small amount
    // of temporal smoothing, rather than synthesizing idle motion.
    state.analyser.smoothingTimeConstant = .8;
    state.freqData = new Uint8Array(state.analyser.frequencyBinCount);
    state.hasAnalyserSample = false;
  }

  function updateAudioEnergy() {
    if ((!state.playing && !state.exporting) || !state.freqData?.length) {
      state.energy = lerp(state.energy || 0, 0, .18);
      state.lowEnergy = lerp(state.lowEnergy || 0, 0, .2);
      return;
    }
    let total = 0;
    let low = 0;
    const length = state.freqData.length;
    const lowEnd = Math.max(1, Math.floor(length * .08));
    for (let i = 0; i < length; i += 1) total += state.freqData[i] / 255;
    for (let i = 0; i < lowEnd; i += 1) low += state.freqData[i] / 255;
    const average = total / length;
    const lowAverage = low / lowEnd;
    state.energy = lerp(state.energy || 0, clamp(average * 1.7, 0, 1), .22);
    state.lowEnergy = lerp(state.lowEnergy || 0, clamp(lowAverage * 2.2, 0, 1), .24);
  }

  function setupAudioGraph() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) throw new Error("Web Audio API is not supported");
    if (!state.audioContext || state.audioContext.state === "closed") {
      state.audioContext = new AudioContextCtor();
      state.gainNode = null; state.analyser = null; state.graphConnected = false;
    }
    if (!state.gainNode) state.gainNode = state.audioContext.createGain();
    if (!state.analyser) {
      state.analyser = state.audioContext.createAnalyser();
      configureAnalyser();
    }
    state.gainNode.gain.value = state.muted ? 0 : state.volume;
    if (!state.graphConnected) {
      state.analyser.connect(state.gainNode);
      state.gainNode.connect(state.audioContext.destination);
      state.graphConnected = true;
    }
  }

  async function play() {
    if (!state.audioBuffer) {
      showToast(t("toast.audioFirst"));
      return;
    }
    try {
      setupAudioGraph();
      if (state.audioContext.state === "suspended") {
        let timeout = 0;
        await Promise.race([
          state.audioContext.resume(),
          new Promise((resolve) => { timeout = setTimeout(resolve, 1400); })
        ]);
        if (timeout) clearTimeout(timeout);
        if (state.audioContext.state === "suspended") throw new Error("Audio context is still suspended");
      }
    } catch {
      showToast(t("toast.playError"));
      return;
    }
    stopSource();
    const source = state.audioContext.createBufferSource();
    source.buffer = state.audioBuffer;
    source.connect(state.analyser);
    state.sourceNode = source;
    const start = clamp(state.pausedAt, 0, Math.max(0, state.analysis.duration - .01));
    state.startedAt = state.audioContext.currentTime - start;
    state.playing = true;
    setPlayButton(true);
    source.onended = () => {
      if (!state.playing) return;
      state.playing = false;
      state.pausedAt = 0;
      updateAudioEnergy();
      setPlayButton(false);
      renderOnce();
    };
    source.start(0, start);
    startLoop();
  }

  function pause() {
    if (!state.playing) return;
    state.pausedAt = currentTime();
    state.playing = false;
    stopSource();
    updateAudioEnergy();
    setPlayButton(false);
    renderOnce();
  }

  function seek(seconds) {
    const duration = state.analysis?.duration || 0;
    state.pausedAt = clamp(seconds, 0, duration);
    if (state.playing) {
      state.playing = false;
      stopSource();
      state.freqData?.fill(0);
      void play();
    } else renderOnce();
  }

  function togglePlay() { if (state.playing) pause(); else void play(); }

  function drawLine(ctx, x1, y1, x2, y2, color, width = 1, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  function drawGrid(ctx, color, x, y, width, height, cols = 12, rows = 6, alpha = .18) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = alpha;
    for (let i = 1; i < cols; i += 1) {
      const px = x + width * i / cols;
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + height); ctx.stroke();
    }
    for (let i = 1; i < rows; i += 1) {
      const py = y + height * i / rows;
      ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + width, py); ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles(ctx, colors, time) {
    const motion = motionIsReduced() ? 0 : state.config.motion / 100;
    ctx.save();
    for (const particle of particles) {
      const drift = Math.sin(time * particle.speed * motion + particle.phase) * 10;
      ctx.globalAlpha = .18 + ((particle.r % 2) * .12);
      ctx.fillStyle = particle.r > 2 ? colors.accent : colors.ink;
      ctx.fillRect(particle.x + drift, particle.y, particle.r, particle.r);
    }
    ctx.restore();
  }

  function drawCoverFrame(ctx, colors, centerX, centerY, halfSize, playbackTime = 0, options = {}) {
    const staticOnly = Boolean(options.staticOnly);
    const reduced = motionIsReduced();
    const motion = reduced ? 0 : Number(state.config.motion || 100) / 100;
    if (staticOnly) return;

    const radiusX = halfSize + 2;
    const radiusY = halfSize * .82;
    const tempo = tempoStateAt(playbackTime);
    const basePhase = tempo.bpm > 0 ? tempo.beat / 16 : playbackTime / 7;
    const phase = motion > 0 ? basePhase * motion : .5;
    const wrapped = ((phase % 2) + 2) % 2;
    const travel = reduced || motion <= 0 ? .5 : (wrapped <= 1 ? wrapped : 2 - wrapped);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.lineCap = "round";
    [-1, 1].forEach((side) => {
      const startAngle = side < 0 ? Math.PI * .62 : -Math.PI * .38;
      const endAngle = side < 0 ? Math.PI * 1.38 : Math.PI * .38;
      const arcLength = endAngle - startAngle;
      const traceFraction = .105;
      const traceStart = startAngle + arcLength * (1 - traceFraction) * (side < 0 ? 1 - travel : travel);
      const traceEnd = traceStart + arcLength * traceFraction;
      const traceColor = side < 0 ? colors.accent : colors.secondary;

      ctx.beginPath();
      ctx.ellipse(0, 0, radiusX, radiusY, 0, startAngle, endAngle);
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1;
      ctx.globalAlpha = .28;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, radiusX, radiusY, 0, traceStart, traceEnd);
      ctx.strokeStyle = traceColor;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = .92;
      ctx.stroke();
    });
    ctx.restore();
  }

  function trackDisplay() {
    const value = String(refs.track?.value || "").trim();
    return /^\d+$/.test(value) ? value.padStart(2, "0") : value;
  }

  function ellipsizeCanvasText(ctx, text, maxWidth) {
    const value = String(text || "");
    if (!value || ctx.measureText(value).width <= maxWidth) return value;
    const characters = Array.from(value);
    const suffix = "…";
    let low = 0;
    let high = characters.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      const candidate = `${characters.slice(0, middle).join("")}${suffix}`;
      if (ctx.measureText(candidate).width <= maxWidth) low = middle;
      else high = middle - 1;
    }
    return `${characters.slice(0, low).join("")}${suffix}`;
  }

  function drawCover(ctx, colors, centerX, centerY, size, time) {
    const x = centerX - size / 2; const y = centerY - size / 2;
    ctx.save();
    ctx.fillStyle = rgba(colors.ink, .1);
    ctx.fillRect(x, y, size, size);
    if (state.coverImage) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, size, size); ctx.clip();
      const image = state.coverImage;
      const iw = image.width || size; const ih = image.height || size;
      const scale = Math.max(size / iw, size / ih);
      const dw = iw * scale; const dh = ih * scale;
      ctx.globalAlpha = 1;
      ctx.drawImage(image, centerX - dw / 2, centerY - dh / 2, dw, dh);
      ctx.restore();
    } else {
      const step = Math.max(12, size / 13);
      ctx.strokeStyle = rgba(colors.ink, .11);
      ctx.lineWidth = 1;
      for (let i = 0; i <= size; i += step) {
        drawLine(ctx, x + i, y, x + i, y + size, colors.ink, 1, .11);
        drawLine(ctx, x, y + i, x + size, y + i, colors.ink, 1, .11);
      }
      ctx.fillStyle = rgba(colors.secondary, .11);
      ctx.fillRect(x + size * .13, y + size * .49, size * .74, 2);
      ctx.fillStyle = colors.ink;
      ctx.font = '500 19px "Segoe UI", sans-serif';
      ctx.fillText(t("canvas.cover", "AUDIO"), x + size * .13, y + size * .54);
      ctx.font = '11px "Segoe UI", sans-serif';
      const track = trackDisplay();
      const local = t("canvas.local", "LOCAL");
      ctx.fillText(track ? `${local} / ${track}` : local, x + size * .13, y + size * .62);
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = rgba(colors.ink, .32);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + .5, y + .5, size - 1, size - 1);
    ctx.restore();
  }

  function sampleWave(index, time) {
    const profile = state.analysis?.waveform;
    if (!profile) return { min: 0, max: 0, rms: 0 };
    const i = clamp(Math.floor(index), 0, profile.rms.length - 1);
    return { min: profile.min[i], max: profile.max[i], rms: profile.rms[i] };
  }

  function spectrumValue(index, count, time) {
    // Before playback (and while paused) the analyser buffer is either empty
    // or frozen. Keep that state honest: an idle visualizer must not invent
    // energy just to look busy.
    if (!state.audioBuffer || !state.hasAnalyserSample || !state.freqData?.length || (!state.analyser && !state.exporting)) return 0;
    const n = state.freqData.length;
    const pct = index / Math.max(1, count - 1);
    const sampleRate = state.analysis?.sampleRate || 44100;
    const nyquist = Math.max(20, sampleRate / 2);
    const displayMaxHz = Math.min(20000, nyquist);
    const hz = state.config.frequencyScale === "linear"
      ? pct * displayMaxHz
      : 20 * Math.pow(displayMaxHz / 20, pct);
    const sourceIndex = clamp(Math.floor((hz / nyquist) * n), 0, n - 1);
    const raw = state.freqData[sourceIndex] / 255;
    return clamp(raw * (Number(state.config.spectrumGain) || 74) / 74, 0, 1);
  }

  function drawSpectrum(ctx, colors, x, y, width, height, time) {
    const barWidth = Math.max(2, Number(state.config.barWidth) || 6);
    const style = SPECTRUM_STYLES.includes(state.config.spectrumStyle) ? state.config.spectrumStyle : defaultConfig.spectrumStyle;
    const count = style === "line"
      ? clamp(Math.round(width / Math.max(8, barWidth * 1.45)), 72, 144)
      : Math.max(1, Math.floor(width / Math.max(1, barWidth + 1)));
    const values = Array.from({ length: count }, (_, index) => spectrumValue(index, count, time));
    ctx.save();
    ctx.fillStyle = colors.ink;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = Math.max(1, barWidth * .55);
    ctx.globalAlpha = .88;
    if (style === "line") {
      const weights = [1, 2, 1];
      const lineValues = values.map((_, index) => {
        let weightedValue = 0;
        let weightTotal = 0;
        weights.forEach((weight, offset) => {
          const sampleIndex = index + offset - 1;
          if (sampleIndex < 0 || sampleIndex >= values.length) return;
          weightedValue += values[sampleIndex] * weight;
          weightTotal += weight;
        });
        const frequencyPosition = index / Math.max(1, values.length - 1);
        const tilt = lerp(.72, 1.35, frequencyPosition);
        return Math.pow(clamp((weightedValue / Math.max(1, weightTotal)) * tilt, 0, 1), .92);
      });
      const baseline = y + height * .9;
      ctx.beginPath();
      lineValues.forEach((value, i) => {
        const px = x + (i / Math.max(1, count - 1)) * width;
        const py = baseline - value * height * .72;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = clamp(barWidth * .24, 1.25, 2.25);
      ctx.lineJoin = "miter";
      ctx.lineCap = "butt";
      ctx.globalAlpha = .9;
      ctx.stroke();
    } else if (style === "dots") {
      ctx.fillStyle = colors.secondary;
      for (let i = 0; i < count; i += 1) {
        const value = values[i];
        if (value <= .01) continue;
        const px = x + (i / Math.max(1, count - 1)) * width;
        const py = y + height - value * height * .95;
        ctx.globalAlpha = .36 + value * .6;
        ctx.beginPath(); ctx.arc(px, py, Math.max(1.5, barWidth * .48), 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.fillStyle = colors.ink;
      // Bars are a stable visual channel: energy changes their height, never
      // their opacity. This keeps the spectrum readable on every frame.
      ctx.globalAlpha = 1;
      for (let i = 0; i < count; i += 1) {
        const value = values[i];
        const barHeight = value * height * .95;
        if (barHeight < 1) continue;
        const px = x + (i / count) * width;
        const py = y + height - barHeight;
        ctx.fillRect(px, py, barWidth, barHeight);
      }
    }
    ctx.restore();
  }

  function drawWaveform(ctx, colors, x, y, width, height, time) {
    const bins = 240;
    const baseline = y + height;
    const scale = Number(state.config.waveHeight) / 68;
    const points = [];
    for (let i = 0; i <= bins; i += 1) {
      const wave = sampleWave(i * 960 / bins, time);
      const value = Math.max(.01, (Math.abs(wave.max) + Math.abs(wave.min)) * .5) * scale;
      points.push({
        x: x + width * i / bins,
        y: baseline - Math.min(height * .94, value * height * .98)
      });
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, baseline);
    for (const point of points) ctx.lineTo(point.x, point.y);
    ctx.lineTo(x + width, baseline);
    ctx.closePath();
    ctx.fillStyle = rgba(colors.accent, .18);
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      if (i === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
    }
    ctx.strokeStyle = rgba(colors.accent, .46);
    ctx.lineWidth = 1.25;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
  }

  function metricValue(key, time) {
    const analysis = state.analysis;
    if (!analysis) return null;
    const profile = analysis.rmsProfile || [];
    const index = profile.length ? clamp(Math.floor((time / Math.max(.001, analysis.duration)) * profile.length), 0, profile.length - 1) : 0;
    if (key === "peak") return analysis.peakDb;
    if (key === "rms" || key === "loudness") return db(profile[index] || 0);
    if (key === "dynamicRange") {
      const radius = Math.max(4, Math.floor(profile.length * .035));
      const window = [];
      for (let i = Math.max(0, index - radius); i <= Math.min(profile.length - 1, index + radius); i += 1) if (profile[i] > 1e-8) window.push(profile[i]);
      if (window.length < 2) return analysis.dynamicRange;
      return db(quantile(window, .95)) - db(quantile(window, .1));
    }
    if (key === "crest") return Number.isFinite(analysis.peakDb) && Number.isFinite(metricValue("rms", time)) ? analysis.peakDb - metricValue("rms", time) : analysis.crest;
    return analysis.duration;
  }

  function metricLabel(key) {
    const labels = { peak: "custom.peak", rms: "custom.rms", loudness: "custom.loudness", dynamicRange: "custom.dynamic", crest: "custom.crest", duration: "custom.duration" };
    return t(labels[key] || key, key);
  }

  function metricText(key, value) {
    if (!Number.isFinite(value)) return "--";
    if (key === "duration") return formatTime(value);
    return `${value.toFixed(1)} dB`;
  }

  function drawMetrics(ctx, colors, x, y, width, height, time) {
    const keys = Object.keys(state.config.metrics).filter((key) => state.config.metrics[key]);
    if (!keys.length) return;
    const gap = 14;
    const cardWidth = (width - gap * (keys.length - 1)) / keys.length;
    keys.forEach((key, index) => {
      const px = x + index * (cardWidth + gap);
      const value = metricValue(key, time);
      ctx.save();
      ctx.strokeStyle = rgba(colors.ink, .22);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + cardWidth, y); ctx.stroke();
      if (state.config.showLabels) {
        ctx.fillStyle = colors.accent;
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillText(metricLabel(key), px, y + 24);
      }
      ctx.fillStyle = colors.ink;
      ctx.font = '500 21px "Segoe UI", sans-serif';
      ctx.fillText(metricText(key, value), px, y + (state.config.showLabels ? 55 : 34));
      ctx.restore();
    });
  }

  function drawBpmMotion(ctx, colors, x, y, width, height, time) {
    const position = bpmMotionPosition(time);
    ctx.save();
    ctx.strokeStyle = rgba(colors.ink, .28);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = rgba(colors.accent, .06);
    ctx.fillRect(x, y, width, height);
    for (let index = 0; index <= 8; index += 1) {
      const px = x + (width * index) / 8;
      ctx.strokeStyle = rgba(colors.ink, index % 4 === 0 ? .22 : .1);
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + height); ctx.stroke();
    }
    const markerX = x + 8 + (width - 16) * position;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(markerX, y - 3);
    ctx.lineTo(markerX, y + height + 3);
    ctx.stroke();
    ctx.restore();
  }

  function drawBpmPanel(ctx, colors, geometry, time) {
    if (!state.config.layers.bpm) return;
    const { layout, contentX, contentY, contentW, graphY } = geometry;
    // Keep the phase caption clear of the graph separator below it. The old
    // baseline landed exactly on that line, which made the BPM row look broken.
    const stacked = layout === "stack";
    const bpmX = stacked ? contentX + contentW * .48 : contentX;
    const rowY = stacked ? contentY + 91 : graphY - 92;
    const valueY = rowY + (stacked ? 28 : 42);
    const motionY = rowY + (stacked ? 6 : 12);
    const captionY = rowY + (stacked ? 43 : 53);
    const value = bpmAtTime(time);
    const bpmText = value > 0 ? value.toFixed(2) : "--";
    const pop = bpmPopAtTime(time);
    const motionX = bpmX + 170;
    const motionW = Math.min(150, Math.max(110, contentW * .15));
    ctx.save();
    ctx.textAlign = "left";
    if (state.config.showLabels) {
      ctx.fillStyle = rgba(colors.ink, .64);
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText("BPM", bpmX, rowY);
    }
    // Match the duration readout's typeface so the two numeric systems belong
    // to the same visual family.
    ctx.font = '500 30px "Segoe UI", sans-serif';
    ctx.fillStyle = value > 0 ? colors.ink : rgba(colors.ink, .4);
    if (pop > 0 && value > 0) {
      ctx.save();
      ctx.translate(bpmX, valueY);
      ctx.scale(1 + pop * .16, 1 + pop * .16);
      ctx.fillStyle = rgba(colors.accent, .42 * pop);
      ctx.fillText(bpmText, 0, 0, 138);
      ctx.fillStyle = colors.ink;
      ctx.fillText(bpmText, 0, 0, 138);
      ctx.restore();
    } else {
      ctx.fillText(bpmText, bpmX, valueY, 138);
    }
    drawBpmMotion(ctx, colors, motionX, motionY, motionW, 22, time);
    ctx.fillStyle = rgba(colors.ink, .42);
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText(value > 0 ? t("canvas.beatPhase", "BEAT PHASE") : t("canvas.waitingBpm", "WAITING FOR BPM"), motionX, captionY);
    ctx.restore();
  }

  function progressGeometry(geometry) {
    const margin = geometry.layout === "minimal" ? 110 : 96;
    return { x: margin, width: W - margin * 2 };
  }

  function drawProgressRail(ctx, colors, geometry, time) {
    const duration = state.analysis?.duration || 0;
    const { x, width } = progressGeometry(geometry);
    const progress = duration ? clamp(time / duration, 0, 1) : 0;
    const y = geometry.layout === "minimal"
      ? H - 170
      : geometry.layout === "stack"
        ? H - 122
        : H - 150;
    ctx.save();
    ctx.fillStyle = rgba(colors.ink, .28);
    ctx.fillRect(x, y - 1, width, 2);
    ctx.fillStyle = colors.accent;
    ctx.fillRect(x, y - 2, width * progress, 4);

    const playheadX = x + width * progress;
    ctx.fillStyle = colors.accent;
    // A compact dot preserves the current position without reintroducing the
    // tall duration tick that used to clutter the rail.
    ctx.beginPath(); ctx.arc(playheadX, y, 5, 0, Math.PI * 2); ctx.fill();
    if (state.config.showLabels && state.config.layers.timelineLabels) {
      ctx.fillStyle = colors.ink;
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = "left"; ctx.fillText(formatTime(time), x, y - 22);
      ctx.textAlign = "right"; ctx.fillText(formatTime(duration), x + width, y - 22);
    }
    ctx.restore();
    return y;
  }

  function stageGeometry() {
    const layout = state.config.layout;
    let coverX = 430; let coverY = 500; let coverSize = 410;
    let contentX = 820; let contentY = 150; let contentW = 980;
    if (layout === "stack") { coverX = 960; coverY = 300; coverSize = 270; contentX = 210; contentY = 510; contentW = 1500; }
    if (layout === "minimal") { coverX = 305; coverY = 465; coverSize = 270; contentX = 650; contentY = 210; contentW = 1110; }
    return { layout, coverX, coverY, coverSize, contentX, contentY, contentW };
  }

  function ensureCoverFrameOverlay() {
    if (state.coverFrameCanvas && state.coverFrameContext) return;
    const host = refs.canvas?.parentElement;
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.className = "visualizer-cover-frame-overlay";
    canvas.dataset.coverFrameOverlay = "true";
    canvas.width = W;
    canvas.height = H;
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "1"
    });
    host.appendChild(canvas);
    state.coverFrameCanvas = canvas;
    state.coverFrameContext = canvas.getContext("2d");
  }

  function drawCoverFrameOverlay() {
    const ctx = state.coverFrameContext;
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const geometry = stageGeometry();
    if (state.exporting || !state.config.layers.cover || !state.config.layers.coverOrbit || geometry.layout === "minimal" || motionIsReduced()) return;
    drawCoverFrame(
      ctx,
      state.config.colors,
      geometry.coverX,
      geometry.coverY,
      geometry.coverSize / 2 + 28,
      currentTime(),
      { dynamicOnly: true }
    );
    // Keep the animated frame behind the cover image in the live preview.
    ctx.clearRect(
      geometry.coverX - geometry.coverSize / 2,
      geometry.coverY - geometry.coverSize / 2,
      geometry.coverSize,
      geometry.coverSize
    );
  }

  function startCoverFrameLoop() {
    if (state.coverFrameRaf) return;
    const frame = () => {
      state.coverFrameRaf = requestAnimationFrame(frame);
      if (document.hidden) return;
      drawCoverFrameOverlay();
    };
    state.coverFrameRaf = requestAnimationFrame(frame);
  }

  function drawScrollingTitle(ctx, text, x, baseline, maxWidth, time, colors, enabled = true) {
    const value = String(text || "");
    const widthLimit = Math.max(120, Number(maxWidth) || 120);
    const baseSize = 58;
    const minSize = 42;
    let size = baseSize;
    ctx.save();
    ctx.font = `500 ${size}px "Segoe UI", sans-serif`;
    while (size > minSize && ctx.measureText(value).width > widthLimit) {
      size -= 2;
      ctx.font = `500 ${size}px "Segoe UI", sans-serif`;
    }
    const textWidth = ctx.measureText(value).width;
    if (!enabled || motionIsReduced() || textWidth <= widthLimit) {
      ctx.fillStyle = colors.ink;
      ctx.fillText(value, x, baseline);
      ctx.restore();
      return;
    }

    const overflow = textWidth - widthLimit;
    const hold = 3;
    const speed = 80;
    const endHold = .7;
    const wipe = .45;
    const scrollDuration = overflow / speed;
    const cycle = hold + scrollDuration + endHold + wipe * 2;
    const phase = ((Number(time) || 0) % cycle + cycle) % cycle;
    const scrollEnd = hold + scrollDuration;
    const endHoldEnd = scrollEnd + endHold;
    const wipeOutEnd = endHoldEnd + wipe;
    const revealing = phase > wipeOutEnd;
    const offset = phase <= hold
      ? 0
      : revealing
        ? 0
        : Math.min(overflow, (phase - hold) * speed);

    const titleTop = baseline - size * .92;
    const titleHeight = size * 1.2;
    ctx.beginPath();
    ctx.rect(x, titleTop, widthLimit, titleHeight);
    ctx.clip();
    ctx.fillStyle = colors.ink;
    ctx.fillText(value, x - offset, baseline);
    if (phase > endHoldEnd) {
      const wipePhase = revealing
        ? (phase - wipeOutEnd) / wipe
        : (phase - endHoldEnd) / wipe;
      const progress = clamp(wipePhase, 0, 1);
      const edgeX = x + widthLimit * progress;
      const soft = Math.min(72, widthLimit * .24);
      ctx.fillStyle = rgba(colors.background, .98);
      if (revealing) {
        ctx.fillRect(edgeX, titleTop, x + widthLimit - edgeX, titleHeight);
        if (edgeX > x) {
          const gradient = ctx.createLinearGradient(edgeX - soft, 0, edgeX, 0);
          gradient.addColorStop(0, rgba(colors.background, 0));
          gradient.addColorStop(1, rgba(colors.background, .98));
          ctx.fillStyle = gradient;
          ctx.fillRect(Math.max(x, edgeX - soft), titleTop, soft, titleHeight);
        }
      } else {
        ctx.fillRect(x, titleTop, edgeX - x, titleHeight);
        if (edgeX < x + widthLimit) {
          const gradient = ctx.createLinearGradient(edgeX, 0, edgeX + soft, 0);
          gradient.addColorStop(0, rgba(colors.background, .98));
          gradient.addColorStop(1, rgba(colors.background, 0));
          ctx.fillStyle = gradient;
          ctx.fillRect(edgeX, titleTop, soft, titleHeight);
        }
      }
    }
    ctx.restore();
  }

  function drawStage(ctx, time, exportMode = false) {
    const colors = state.config.colors;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, W, H);

    if (state.config.layers.grid) {
      drawGrid(ctx, colors.ink, 80, 74, 1760, 900, 20, 10, .09);
    }
    if (state.config.layers.particles) drawParticles(ctx, colors, time);

    const { layout, coverX, coverY, coverSize, contentX, contentY, contentW } = stageGeometry();

    if (state.config.layers.cover && layout !== "minimal") {
      const inlineCoverFrame = exportMode || !state.coverFrameContext || motionIsReduced();
      if (state.config.layers.coverOrbit) drawCoverFrame(ctx, colors, coverX, coverY, coverSize / 2 + 28, time, {
        staticOnly: !inlineCoverFrame
      });
      drawCover(ctx, colors, coverX, coverY, coverSize, time);
    } else if (state.config.layers.cover && layout === "minimal") {
      drawCover(ctx, colors, coverX, coverY, coverSize, time);
    }

    if (state.config.layers.sourceLabel) {
      ctx.fillStyle = colors.accent;
      ctx.fillRect(contentX, contentY - 17, 9, 9);
      ctx.fillStyle = colors.ink;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText(`${t("canvas.from", "FROM")}: ${state.audioFile ? t("canvas.file", "LOCAL FILE") : "--"}`, contentX + 23, contentY - 8);
    }
    const title = refs.title.value.trim() || (state.language === "zh" ? "未命名曲目" : "Untitled track");
    drawScrollingTitle(ctx, title, contentX, contentY + 55, Math.max(160, contentW - 210), time, colors, refs.rolling.checked);
    const metaX = contentX + contentW - 190;
    const infoRight = metaX - 30;
    const album = refs.album.value.trim();
    const track = trackDisplay();
    const albumX = contentX + clamp(contentW * .32, 280, 360);
    const trackX = infoRight - 70;
    const albumRight = layout === "stack" ? contentX + contentW * .48 - 28 : (track ? trackX : infoRight);
    const artistMaxWidth = album
      ? albumX - contentX - 32
      : track
        ? trackX - contentX - 32
        : infoRight - contentX - 24;
    const albumMaxWidth = albumRight - albumX - 24;
    ctx.fillStyle = colors.ink;
    ctx.globalAlpha = .7;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(t("canvas.by", "BY"), contentX, contentY + 91);
    if (album) ctx.fillText(t("canvas.album", "ALBUM"), albumX, contentY + 91);
    if (track) ctx.fillText(t("canvas.track", "TRACK"), trackX, contentY + 91);
    ctx.globalAlpha = 1;
    ctx.font = '500 22px "Segoe UI", sans-serif';
    const artist = refs.artist.value.trim() || (state.language === "zh" ? "未知艺术家" : "Unknown artist");
    ctx.fillText(ellipsizeCanvasText(ctx, artist, artistMaxWidth), contentX, contentY + 119);
    if (album) ctx.fillText(ellipsizeCanvasText(ctx, album, albumMaxWidth), albumX, contentY + 119);
    if (track) ctx.fillText(track, trackX, contentY + 119);

    ctx.textAlign = "right";
    ctx.fillStyle = colors.ink;
    ctx.globalAlpha = .62;
    ctx.font = '10px "Segoe UI", sans-serif';
    if (state.config.layers.sourceMeta) {
      ctx.fillText(t("canvas.source", "SOURCE"), metaX + 180, contentY + 60);
      ctx.globalAlpha = 1;
      ctx.fillText(state.audioFile ? t("canvas.localAudio", "LOCAL AUDIO") : t("canvas.ready", "READY"), metaX + 180, contentY + 79);
    }
    if (state.config.layers.durationMeta) {
      ctx.globalAlpha = 1;
      ctx.fillText(t("canvas.duration", "DURATION"), metaX + 180, contentY + 124);
      ctx.font = '500 17px "Segoe UI", sans-serif';
      ctx.fillText(formatTime(state.analysis?.duration || 0), metaX + 180, contentY + 147);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";

    const graphY = layout === "stack" ? 690 : contentY + 230;
    const graphH = layout === "minimal" ? 230 : layout === "stack" ? 140 : 218;
    drawBpmPanel(ctx, colors, { layout, contentX, contentY, contentW, graphY }, time);
    drawLine(ctx, contentX, graphY - 22, contentX + contentW, graphY - 22, colors.ink, 1, .26);
    if (state.config.layers.spectrum) {
      drawGrid(ctx, colors.ink, contentX, graphY, contentW, graphH, 12, 4, .14);
      drawSpectrum(ctx, colors, contentX, graphY, contentW, graphH, time);
      ctx.fillStyle = colors.ink; ctx.globalAlpha = .55; ctx.font = '10px "Segoe UI", sans-serif';
      if (state.config.showLabels) ctx.fillText(state.config.frequencyScale === "log" ? t("canvas.frequency", "20   200       1K       5K       10K       20K") : t("canvas.frequencyLinear", "0       5K       10K       15K       20K"), contentX, graphY + graphH + 18);
      ctx.globalAlpha = 1;
    }
    const waveY = graphY + graphH + (layout === "stack" ? 42 : 54);
    const waveHeight = layout === "stack" ? 48 : 80;
    if (state.config.layers.waveform) {
      drawLine(ctx, contentX, waveY - 15, contentX + contentW, waveY - 15, colors.ink, 1, .18);
      drawWaveform(ctx, colors, contentX, waveY, contentW, waveHeight, time);
    }
    const progressY = state.config.layers.progress
      ? drawProgressRail(ctx, colors, { layout, contentX, contentY, contentW, graphY }, time)
      : null;
    const metricsY = layout === "stack"
      ? H - 88
      : Math.min(H - 104, progressY == null ? waveY + 120 : progressY + 60);
    drawMetrics(ctx, colors, contentX, metricsY, contentW, 72, time);
    ctx.restore();
  }

  function drawVideoWatermark(ctx) {
    const width = ctx.canvas.width || W;
    const height = ctx.canvas.height || H;
    const scale = Math.min(width / W, height / H);
    const fontSize = Math.max(1, Math.round(22 * scale));
    const margin = Math.max(10, Math.round(24 * scale));
    const text = "Made with FLAudioViz";

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = `500 ${fontSize}px "Segoe UI", sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = state.config.colors.ink;
    ctx.globalAlpha = .56;
    ctx.fillText(text, width - margin, height - margin, width - margin * 2);
    ctx.restore();
  }

  function drawExportStage(ctx, canvas, time, includeWatermark = false) {
    const width = canvas.width;
    const height = canvas.height;
    const scale = Math.min(width / W, height / H);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = state.config.colors.background;
    ctx.fillRect(0, 0, width, height);
    ctx.translate((width - W * scale) / 2, (height - H * scale) / 2);
    ctx.scale(scale, scale);
    drawStage(ctx, time, true);
    ctx.restore();
    if (includeWatermark) drawVideoWatermark(ctx);
  }

  function renderOnce() {
    if (state.analyser && state.freqData && state.playing) {
      state.analyser.getByteFrequencyData(state.freqData);
      state.hasAnalyserSample = true;
    }
    updateAudioEnergy();
    drawStage(canvasContext, currentTime());
    drawCoverFrameOverlay();
    updateTimeUI();
  }

  function startLoop() {
    if (state.raf) return;
    const frame = (now) => {
      state.raf = 0;
      if (!state.playing) { renderOnce(); return; }
      state.lastFrame = now;
      if (state.analyser && state.freqData) {
        state.analyser.getByteFrequencyData(state.freqData);
        state.hasAnalyserSample = true;
      }
      updateAudioEnergy();
      const time = currentTime();
      drawStage(canvasContext, time);
      updateTimeUI();
      state.raf = requestAnimationFrame(frame);
    };
    state.raf = requestAnimationFrame(frame);
  }

  function decodeAudio(context, arrayBuffer) {
    return new Promise((resolve, reject) => {
      const fail = (error) => reject(error instanceof Error ? error : new Error("decodeAudioData failed"));
      try {
        const result = context.decodeAudioData(arrayBuffer, resolve, fail);
        if (result && typeof result.then === "function") result.then(resolve, fail);
      } catch (error) { fail(error); }
    });
  }

  async function handleAudioFile(file) {
    if (!file) return;
    const loadId = ++audioLoadGeneration;
    if (file.size > AUDIO_MAX_BYTES) {
      showToast(t("toast.fileTooLarge"));
      return;
    }
    pause();
    // An embedded cover belongs to the previous track. A user-selected cover
    // is intentionally kept until they replace it explicitly.
    if (state.coverSource === "embedded") {
      state.coverImage?.close?.();
      state.coverImage = null;
      state.coverFile = null;
      state.coverSource = "";
    }
    setStatus(t("source.decoding", "Decoding..."));
    refs.decode.textContent = t("source.decoding", "Decoding...");
    refs.stageNote.classList.remove("is-hidden");
    try {
      const data = await file.arrayBuffer();
      setupAudioGraph();
      const metadata = parseAudioMetadata(data, file.name);
      const bitDepth = metadata.bitDepth || parseWavBitDepth(data);
      const buffer = await decodeAudio(state.audioContext, data);
      if (loadId !== audioLoadGeneration) return;
      const decodedBytes = buffer.length * buffer.numberOfChannels * 4;
      if (decodedBytes > 1250000000) throw new Error("decoded audio is too large for a safe preview");
      state.audioFile = file;
      state.audioBuffer = buffer;
      state.analysis = analyzeBuffer(buffer);
      state.analysis.bitDepth = bitDepth;
      applyParsedMetadata(metadata);
      if (!state.coverFile && metadata.cover) {
        const embeddedCover = coverFileFromMetadata(metadata.cover, file);
        if (embeddedCover) {
          try {
            const image = await loadImage(embeddedCover);
            if (loadId !== audioLoadGeneration) {
              image?.close?.();
              return;
            }
            state.coverImage?.close?.();
            state.coverImage = image;
            state.coverFile = embeddedCover;
            state.coverSource = "embedded";
          } catch { /* artwork is optional; keep decoding successful */ }
        }
      }
      state.pausedAt = 0;
      state.freqData = new Uint8Array(state.analyser.frequencyBinCount);
      state.hasAnalyserSample = false;
      state.energy = 0;
      state.lowEnergy = 0;
      if (!refs.title.value.trim() || ["Untitled track", "Untitled signal", "未命名曲目", "未命名信号"].includes(refs.title.value)) refs.title.value = file.name.replace(/\.[^.]+$/, "");
      updateFileStrip();
      updateDetails();
      updateTimeUI();
      refs.stageNote.classList.add("is-hidden");
      setStatus(t("source.decoded", "Decoded"), "ok");
      showToast(t("toast.audioDecoded"));
      renderOnce();
    } catch (error) {
      if (loadId !== audioLoadGeneration) return;
      const hadPrevious = Boolean(state.audioBuffer);
      if (!hadPrevious) { state.audioBuffer = null; state.analysis = null; state.audioFile = null; }
      refs.decode.textContent = t("source.decodeFailed", "Decode failed");
      setStatus(hadPrevious ? t("source.previousKept", "Previous file kept") : t("source.decodeFailed", "Decode failed"), "error");
      if (hadPrevious) refs.stageNote.classList.add("is-hidden");
      updateDetails();
      showToast(error?.message?.includes("too large") ? t("toast.decodeTooLarge") : t("toast.audioError"), 4200);
      renderOnce();
    }
  }

  function loadImage(file) {
    if (!file) return Promise.resolve(null);
    if ("createImageBitmap" in window) return createImageBitmap(file);
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
      image.src = url;
    });
  }

  async function handleCoverFile(file, options = {}) {
    if (!file) return;
    try {
      const oldImage = state.coverImage;
      state.coverImage = await loadImage(file);
      oldImage?.close?.();
      state.coverFile = file;
      state.coverSource = options.source || "user";
      updateFileStrip();
      if (options.notify !== false) showToast(t("toast.coverApplied"));
      renderOnce();
    } catch { showToast(t("toast.coverError")); }
  }

  function fileHasExtension(file, extension) {
    return Boolean(file?.name) && String(file.name).toLowerCase().endsWith(extension);
  }

  async function openTypedFile(input, fileType) {
    if (typeof window.showOpenFilePicker === "function") {
      try {
        const handles = await window.showOpenFilePicker({
          multiple: false,
          excludeAcceptAllOption: true,
          types: [{ description: fileType.description, accept: { [fileType.mime]: [fileType.extension] } }]
        });
        return await handles?.[0]?.getFile?.() || null;
      } catch (error) {
        if (error?.name === "AbortError") return null;
        console.warn("Typed file picker unavailable; using the input fallback.", error);
      }
    }
    input.click();
    return null;
  }

  function bindDropZone(zone, input, handler, fileType = null) {
    zone.addEventListener("click", () => {
      if (!fileType) { input.click(); return; }
      void openTypedFile(input, fileType).then((file) => file && handler(file));
    });
    ["dragenter", "dragover"].forEach((eventName) => zone.addEventListener(eventName, (event) => {
      event.preventDefault(); zone.classList.add("is-dragging");
    }));
    ["dragleave", "drop"].forEach((eventName) => zone.addEventListener(eventName, (event) => {
      event.preventDefault(); zone.classList.remove("is-dragging");
    }));
    zone.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (file) void handler(file);
    });
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) void handler(file);
      input.value = "";
    });
  }

  function updateColorUI() {
    for (const input of $$('[data-color]')) {
      const key = input.dataset.color;
      input.value = hex(state.config.colors[key]);
      const output = document.querySelector(`#${key}Hex`);
      if (output) output.textContent = hex(state.config.colors[key]).toUpperCase();
    }
    document.documentElement.style.setProperty("--bg", state.config.colors.background);
    document.documentElement.style.setProperty("--ink", state.config.colors.ink);
    document.documentElement.style.setProperty("--accent", state.config.colors.accent);
    document.documentElement.style.setProperty("--secondary", state.config.colors.secondary);
    const lightMode = document.documentElement.dataset.theme === "light";
    document.documentElement.style.setProperty("--paper", mixHex(state.config.colors.background, state.config.colors.ink, lightMode ? .035 : .08));
    document.documentElement.style.setProperty("--paper-deep", mixHex(state.config.colors.background, state.config.colors.ink, lightMode ? .10 : .16));
    document.documentElement.style.setProperty("--line", rgba(state.config.colors.ink, lightMode ? .28 : .34));
    document.documentElement.style.setProperty("--line-soft", rgba(state.config.colors.ink, lightMode ? .13 : .14));
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = state.config.colors.background;
  }

  function updateConfigUI() {
    for (const input of $$('[data-layer]')) input.checked = Boolean(state.config.layers[input.dataset.layer]);
    for (const input of $$('[data-metric]')) input.checked = Boolean(state.config.metrics[input.dataset.metric]);
    for (const input of $$('[data-color]')) input.value = hex(state.config.colors[input.dataset.color]);
    for (const input of $$('[data-setting]')) {
      const key = input.dataset.setting;
      if (state.config[key] !== undefined) input.value = state.config[key];
    }
    $$('[data-output]').forEach((output) => {
      const key = output.dataset.output;
      const value = safeNumber(state.config[key]);
      output.textContent = key === "barWidth" ? `${value} px` : `${value}%`;
    });
    $("#showLabels").checked = state.config.showLabels;
    $("#reducedMotion").checked = state.config.reducedMotion;
    $$('[data-layout]').forEach((button) => {
      const active = button.dataset.layout === state.config.layout;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateColorUI();
  }

  function bindConfigControls() {
    $$('[data-layer]').forEach((input) => input.addEventListener("change", () => {
      state.config.layers[input.dataset.layer] = input.checked;
      saveConfig(); renderOnce();
    }));
    $$('[data-metric]').forEach((input) => input.addEventListener("change", () => {
      state.config.metrics[input.dataset.metric] = input.checked;
      saveConfig(); renderOnce();
    }));
    $$('[data-color]').forEach((input) => input.addEventListener("input", () => {
      state.config.colors[input.dataset.color] = hex(input.value);
      updateColorUI(); saveConfig(); renderOnce();
    }));
    $$('[data-setting]').forEach((input) => input.addEventListener("input", () => {
      const key = input.dataset.setting;
      state.config[key] = input.type === "range" ? Number(input.value) : (key === "fftSize" ? Number(input.value) : input.value);
      if (key === "fftSize") configureAnalyser();
      const output = document.querySelector(`[data-output="${key}"]`);
      if (output) output.textContent = key === "barWidth" ? `${input.value} px` : `${input.value}%`;
      saveConfig(); renderOnce();
    }));
    $("#showLabels").addEventListener("change", (event) => { state.config.showLabels = event.target.checked; saveConfig(); renderOnce(); });
    $("#reducedMotion").addEventListener("change", (event) => { state.config.reducedMotion = event.target.checked; saveConfig(); renderOnce(); });
    $$('[data-layout]').forEach((button) => button.addEventListener("click", () => {
      state.config.layout = button.dataset.layout;
      $$('[data-layout]').forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      saveConfig(); renderOnce();
    }));
    $("#resetConfig").addEventListener("click", () => {
      state.config = cloneConfig(defaultConfig);
      state.config.colors = paletteForTheme(state.theme);
      state.themePalettes[state.theme] = cloneConfig(state.config.colors);
      configureAnalyser();
      updateConfigUI(); saveConfig(); renderOnce(); showToast(t("toast.reset"));
    });
    $("#resetColors").addEventListener("click", () => {
      state.config.colors = paletteForTheme(state.theme);
      state.themePalettes[state.theme] = cloneConfig(state.config.colors);
      updateColorUI(); saveConfig(); renderOnce(); showToast(t("toast.colorsReset"));
    });
    $("#randomizeColors").addEventListener("click", () => {
      const palettes = [
        ["#0f1318", "#f1f4ee", "#63e6d5", "#ff7c67"],
        ["#10151d", "#e8f1ff", "#8bb8ff", "#ff9f68"],
        ["#111719", "#e8f7ef", "#b2e56e", "#f07d9b"],
        ["#1a1420", "#f7eafa", "#d69aff", "#6de2dc"],
        ["#e8efed", "#142a2d", "#0d9f93", "#d9574c"]
      ];
      const palette = palettes[Math.floor(Math.random() * palettes.length)];
      ["background", "ink", "accent", "secondary"].forEach((key, index) => { state.config.colors[key] = palette[index]; });
      updateColorUI(); saveConfig(); renderOnce(); showToast(t("toast.palette"));
    });
  }

  const EXPORT_PHASE_COPY = Object.freeze({
    idle: Object.freeze({ labelKey: "output.ready", labelFallback: "Ready", detailKey: "output.readyDetail", detailFallback: "Choose an export option when you are ready.", ratio: 0, busy: false }),
    choosing: Object.freeze({ labelKey: "output.choosing", labelFallback: "Choose save location", detailKey: "output.choosingDetail", detailFallback: "Your browser will open Save As.", ratio: null, busy: true }),
    preparing: Object.freeze({ labelKey: "output.preparing", labelFallback: "Preparing PNG", detailKey: "output.preparingDetail", detailFallback: "Rendering the current frame locally.", ratio: null, busy: true }),
    rendering: Object.freeze({ labelKey: "output.mp4Exporting", labelFallback: "Rendering MP4", detailKey: "output.renderingDetail", detailFallback: "Encoding video and audio locally.", ratio: 0, busy: true }),
    saving: Object.freeze({ labelKey: "output.saving", labelFallback: "Saving file", detailKey: "output.savingDetail", detailFallback: "Finalizing the local file.", ratio: null, busy: true }),
    complete: Object.freeze({ labelKey: "output.complete", labelFallback: "Export complete", detailKey: "output.completeDetail", detailFallback: "The file was saved successfully.", ratio: 1, busy: false }),
    cancelled: Object.freeze({ labelKey: "output.cancelled", labelFallback: "Export cancelled", detailKey: "output.cancelledDetail", detailFallback: "No file was changed.", ratio: 0, busy: false }),
    error: Object.freeze({ labelKey: "output.error", labelFallback: "Export failed", detailKey: "output.errorDetail", detailFallback: "The file could not be exported.", ratio: 0, busy: false })
  });

  function renderExportStatus() {
    if (!refs.exportStatus || !refs.exportProgress) return;
    const ui = state.exportUi;
    const hasRatio = Number.isFinite(ui.ratio);
    const ratio = hasRatio ? clamp(Number(ui.ratio), 0, 1) : null;
    const percent = ratio == null ? null : Math.round(ratio * 100);
    const hasEta = ui.phase === "rendering" && Number.isFinite(ui.secondsLeft) && ui.secondsLeft > .5;

    refs.exportState.dataset.phase = ui.phase;
    refs.exportState.setAttribute("aria-busy", String(ui.busy));
    refs.exportStatus.textContent = t(ui.labelKey, ui.labelFallback);
    refs.exportStatusDetail.textContent = hasEta
      ? t("output.eta", "About {seconds}s remaining.", { seconds: Math.ceil(ui.secondsLeft) })
      : t(ui.detailKey, ui.detailFallback, ui.detailValues || {});

    refs.exportProgress.classList.toggle("is-indeterminate", ui.busy && ratio == null);
    if (ratio == null) {
      refs.exportProgress.removeAttribute("aria-valuenow");
      refs.exportProgressFill.style.transform = "";
      refs.exportProgressText.textContent = t("output.inProgress", "In progress");
    } else {
      refs.exportProgress.setAttribute("aria-valuenow", String(percent));
      refs.exportProgressFill.style.transform = `scaleX(${ratio})`;
      refs.exportProgressText.textContent = ui.phase === "idle" ? t("output.notStarted", "Not started") : `${percent}%`;
    }

    refs.closeExportDialog.disabled = ui.busy;
    refs.openExportDialog.setAttribute("aria-busy", String(ui.busy));
    const pngButton = $("#exportPng");
    const mp4Button = $("#exportMp4");
    if (pngButton) pngButton.disabled = ui.busy;
    if (mp4Button) mp4Button.disabled = ui.busy && !(ui.phase === "rendering" && ui.format === "mp4" && state.mp4Exporting);
  }

  function setExportStatus(phase, options = {}) {
    const defaults = EXPORT_PHASE_COPY[phase] || EXPORT_PHASE_COPY.idle;
    state.exportUi = { phase, format: "", secondsLeft: null, ...defaults, ...options };
    renderExportStatus();
  }

  function setExportProgress(ratio, secondsLeft = null) {
    state.exportUi.ratio = clamp(safeNumber(ratio, 0), 0, 1);
    state.exportUi.secondsLeft = Number.isFinite(secondsLeft) ? secondsLeft : null;
    renderExportStatus();
  }

  function prepareExportCompletionAudio() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    try {
      if (!state.completionAudioContext || state.completionAudioContext.state === "closed") {
        state.completionAudioContext = new AudioContextCtor();
      }
      if (state.completionAudioContext.state === "suspended") {
        void Promise.resolve(state.completionAudioContext.resume()).catch(() => {});
      }
      return state.completionAudioContext;
    } catch {
      return null;
    }
  }

  async function playExportCompletionSound(context) {
    if (!context || context.state === "closed") return;
    try {
      if (context.state === "suspended") {
        let timer = 0;
        await Promise.race([
          Promise.resolve(context.resume()).catch(() => {}),
          new Promise((resolve) => { timer = setTimeout(resolve, 250); })
        ]);
        if (timer) clearTimeout(timer);
      }
      if (context.state !== "running") return;

      const startAt = context.currentTime + .02;
      const filter = context.createBiquadFilter();
      const master = context.createGain();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3200, startAt);
      filter.Q.setValueAtTime(.5, startAt);
      master.gain.setValueAtTime(.9, startAt);
      filter.connect(master);
      master.connect(context.destination);

      const notes = [
        { frequency: 523.25, delay: 0, duration: .42, peak: .14 },
        { frequency: 783.99, delay: .12, duration: .52, peak: .11 }
      ];
      let remaining = notes.length;
      notes.forEach((note) => {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const noteStart = startAt + note.delay;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(note.frequency, noteStart);
        envelope.gain.setValueAtTime(.0001, noteStart);
        envelope.gain.exponentialRampToValueAtTime(note.peak, noteStart + .012);
        envelope.gain.exponentialRampToValueAtTime(.0001, noteStart + note.duration);
        oscillator.connect(envelope);
        envelope.connect(filter);
        oscillator.onended = () => {
          oscillator.disconnect();
          envelope.disconnect();
          remaining -= 1;
          if (!remaining) { filter.disconnect(); master.disconnect(); }
        };
        oscillator.start(noteStart);
        oscillator.stop(noteStart + note.duration + .02);
      });
      window.dispatchEvent(new CustomEvent("flaviz:export-complete-sound"));
    } catch {
      // Export success must never be downgraded by an unavailable UI sound.
    }
  }

  function armExportCompletionSound() {
    const context = prepareExportCompletionAudio();
    let armed = true;
    return () => {
      if (!armed) return;
      armed = false;
      void playExportCompletionSound(context);
    };
  }

  function showExportDialog() {
    if (!refs.exportDialog || document.querySelector("dialog[open]:not(#exportDialog)")) return;
    prepareExportCompletionAudio();
    state.exportDialogOpener = document.activeElement instanceof HTMLElement ? document.activeElement : refs.openExportDialog;
    if (!refs.exportDialog.open) {
      refs.exportDialog.showModal();
      document.documentElement.classList.add("export-dialog-open");
    }
    requestAnimationFrame(() => {
      const activeStop = state.mp4Exporting ? $("#exportMp4") : null;
      (activeStop || refs.exportSize || refs.closeExportDialog)?.focus();
    });
  }

  function closeExportDialog() {
    if (!refs.exportDialog?.open || state.exportUi.busy) return;
    refs.exportDialog.close();
  }

  function getExportSize() {
    if (refs.exportSize.value === "custom") {
      return {
        width: clamp(Math.round(safeNumber(refs.customWidth.value, 1920)), 320, 3840),
        height: clamp(Math.round(safeNumber(refs.customHeight.value, 1080)), 180, 2160)
      };
    }
    const [width, height] = refs.exportSize.value.split("x").map(Number);
    return { width: width || 1920, height: height || 1080 };
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename; link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Keep the native picker in the click-gesture window. Long-running exports
  // (especially MP4) must acquire their writable target before encoding starts.
  async function openSaveTarget(filename, mime, description, extension, strictType = false) {
    if (typeof window.showSaveFilePicker === "function") {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description, accept: { [mime]: [extension] } }],
          excludeAcceptAllOption: strictType
        });
        const writable = await handle.createWritable();
        let closed = false;
        return {
          picker: true,
          stream: typeof WritableStream !== "undefined" && writable instanceof WritableStream ? writable : null,
          markClosed() { closed = true; },
          async write(blob) {
            await writable.write(blob);
            await writable.close();
            closed = true;
          },
          async abort() {
            if (closed) return;
            try { await writable.abort?.(); }
            catch { try { await writable.close?.(); } catch { /* noop */ } }
            closed = true;
          }
        };
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        // A partially implemented picker should not make small exports unusable.
      }
    }
    return {
      picker: false,
      stream: null,
      markClosed() {},
      write(blob) { downloadBlob(blob, filename); },
      abort() {}
    };
  }

  async function writeSaveTarget(target, blob) {
    if (!target) return;
    await target.write(blob);
  }

  function reportSaveError(error, fallbackKey = "toast.saveFailed") {
    if (error?.name === "AbortError") showToast(t("toast.saveCancelled"));
    else {
      console.error(error);
      showToast(t(fallbackKey));
    }
  }

  function canvasToBlob(canvas, type) {
    return new Promise((resolve) => canvas.toBlob(resolve, type));
  }

  async function exportPng() {
    const completeSound = armExportCompletionSound();
    const size = getExportSize();
    const output = document.createElement("canvas");
    output.width = size.width; output.height = size.height;
    const ctx = output.getContext("2d");
    drawExportStage(ctx, output, currentTime());
    const stem = songStem();
    let target;
    setExportStatus("choosing", { format: "png" });
    try {
      target = await openSaveTarget(`${stem}.png`, "image/png", "PNG image", ".png");
      setExportStatus("preparing", { format: "png" });
      const blob = await canvasToBlob(output, "image/png");
      if (!blob) throw new Error("PNG export returned no data");
      await writeSaveTarget(target, blob);
      completeSound();
      setExportStatus("complete", { format: "png" });
      showToast(t("toast.png", "Exported {width} × {height} PNG.", size));
    } catch (error) {
      await target?.abort?.();
      if (error?.name === "AbortError") {
        setExportStatus("cancelled", { format: "png" });
        reportSaveError(error);
      }
      else {
        console.error(error);
        setExportStatus("error", { format: "png" });
        showToast(t("toast.pngFailed"));
      }
    }
  }

  function loadMp4Exporter() {
    if (!state.mp4ModulePromise) state.mp4ModulePromise = import("./mp4-export.js");
    return state.mp4ModulePromise;
  }

  function mp4ExportSettings() {
    const size = getExportSize();
    const fps = Math.max(1, Math.round(safeNumber(refs.exportFps.value, 30)));
    const pixelScale = (size.width * size.height) / (1280 * 720);
    const fpsScale = fps / 24;
    const videoMbps = clamp(Math.round(4.6 * pixelScale * fpsScale * 10) / 10, 1.2, MAX_EXPORT_VIDEO_MBPS);
    return { ...size, fps, videoBitsPerSecond: videoMbps * 1_000_000, audioKbps: 192 };
  }

  async function exportMp4() {
    const button = $("#exportMp4");
    const label = $("#mp4Label");
    if (state.mp4Exporting) {
      state.mp4AbortController?.abort();
      return;
    }
    if (!state.audioBuffer || !state.analysis) {
      setExportStatus("error", {
        format: "mp4",
        detailKey: "output.audioRequiredDetail",
        detailFallback: "Add an audio file before exporting video."
      });
      showToast(t("toast.audioFirst"));
      return;
    }
    const settings = mp4ExportSettings();
    const maxFps = Math.floor(MAX_EXPORT_FRAME_BUDGET / state.analysis.duration);
    if (maxFps < 1 || settings.fps > maxFps) {
      const tooLong = maxFps < 1;
      setExportStatus("error", {
        format: "mp4",
        detailKey: tooLong ? "output.durationBudgetDetail" : "output.frameBudgetDetail",
        detailValues: tooLong ? {} : { fps: maxFps },
        detailFallback: tooLong
          ? "This track is too long for full-length MP4 export in the browser."
          : `For this track, use ${maxFps} FPS or lower to stay within the browser export limit.`
      });
      showToast(tooLong
        ? t("toast.durationBudget")
        : t("toast.frameBudget", "Use {fps} FPS or lower for this track.", { fps: maxFps }));
      refs.exportFps.focus();
      refs.exportFps.select();
      return;
    }
    const completeSound = armExportCompletionSound();
    const stem = songStem();
    let saveTarget;
    setExportStatus("choosing", { format: "mp4" });
    try {
      saveTarget = await openSaveTarget(`${stem}.mp4`, "video/mp4", "MP4 video", ".mp4");
    } catch (error) {
      setExportStatus(error?.name === "AbortError" ? "cancelled" : "error", { format: "mp4" });
      reportSaveError(error);
      return;
    }
    let saveCompleted = false;
    state.mp4Exporting = true;
    state.exporting = true;
    state.mp4AbortController = new AbortController();
    const wasPlaying = state.playing;
    const playbackPosition = currentTime();
    const pausedPosition = state.pausedAt;
    const previousRenderState = {
      analyser: state.analyser,
      freqData: state.freqData,
      hasAnalyserSample: state.hasAnalyserSample,
      energy: state.energy,
      lowEnergy: state.lowEnergy
    };
    if (wasPlaying) pause();
    if (button) { button.setAttribute("aria-busy", "true"); button.classList.add("is-busy"); }
    if (label) label.textContent = t("output.mp4Stop", "Stop MP4 export");
    setExportStatus("rendering", { format: "mp4", ratio: 0 });
    try {
      const exporter = await loadMp4Exporter();
      if (!exporter.isWebCodecsExportSupported()) {
        setExportStatus("error", {
          format: "mp4",
          detailKey: "output.unsupportedDetail",
          detailFallback: "This browser does not support MP4 export."
        });
        showToast(t("toast.mp4Unsupported"));
        return;
      }
      const exportAnalyser = state.analyser || {};
      state.analyser = exportAnalyser;
      const result = await exporter.renderWithWebCodecs({
        width: settings.width,
        height: settings.height,
        fps: settings.fps,
        videoBitsPerSecond: settings.videoBitsPerSecond,
        audioKbps: settings.audioKbps,
        audioBuffer: state.audioBuffer,
        duration: state.analysis.duration,
        fftSize: Number(state.config.fftSize) || 16384,
        metadata: EXPORT_METADATA,
        writable: saveTarget.stream,
        signal: state.mp4AbortController.signal,
        drawFrame: (ctx, _canvas, time, freqData) => {
          state.freqData = freqData;
          state.hasAnalyserSample = true;
          updateAudioEnergy();
          drawExportStage(ctx, _canvas, time, true);
        },
        onProgress: (ratio, secondsLeft) => {
          setExportProgress(ratio, secondsLeft);
        }
      });
      if (!saveTarget.stream && !result?.blob) throw new Error("MP4 encoder returned no data");
      setExportStatus("saving", {
        format: "mp4",
        ratio: 1,
        labelKey: "output.savingMp4",
        labelFallback: "Saving MP4",
        detailKey: "output.savingMp4Detail",
        detailFallback: "Writing the encoded video to your selected file."
      });
      if (label) label.textContent = t("output.savingMp4", "Saving MP4");
      if (saveTarget.stream) saveTarget.markClosed();
      else await writeSaveTarget(saveTarget, result.blob);
      saveCompleted = true;
      completeSound();
      setExportStatus("complete", { format: "mp4" });
      showToast(t("toast.mp4Saved"));
    } catch (error) {
      if (error?.name === "AbortError") {
        setExportStatus("cancelled", { format: "mp4" });
        showToast(t("toast.mp4Cancelled"));
      }
      else if (error?.code === "export-frame-budget") {
        const fallbackMaxFps = Math.max(1, Math.floor(MAX_EXPORT_FRAME_BUDGET / state.analysis.duration));
        setExportStatus("error", {
          format: "mp4",
          detailKey: "output.frameBudgetDetail",
          detailValues: { fps: fallbackMaxFps },
          detailFallback: `For this track, use ${fallbackMaxFps} FPS or lower to stay within the browser export limit.`
        });
        showToast(t("toast.frameBudget", "Use {fps} FPS or lower for this track.", { fps: fallbackMaxFps }));
      }
      else {
        console.error(error);
        setExportStatus("error", { format: "mp4" });
        showToast(t("toast.mp4Failed"));
      }
    } finally {
      if (!saveCompleted) await saveTarget?.abort?.();
      state.exporting = false;
      state.mp4Exporting = false;
      state.mp4AbortController = null;
      state.analyser = previousRenderState.analyser;
      state.freqData = previousRenderState.freqData;
      state.hasAnalyserSample = previousRenderState.hasAnalyserSample;
      state.energy = previousRenderState.energy;
      state.lowEnergy = previousRenderState.lowEnergy;
      if (button) { button.removeAttribute("aria-busy"); button.classList.remove("is-busy"); }
      if (label) label.textContent = t("output.mp4", "Export MP4");
      renderExportStatus();
      state.pausedAt = wasPlaying ? playbackPosition : pausedPosition;
      renderOnce();
      if (wasPlaying && playbackPosition < (state.analysis?.duration || 0) - .05) void play();
    }
  }

  function presetPayload() {
    return {
      format: "flaudioviz-settings",
      version: 1,
      savedAt: new Date().toISOString(),
      config: state.config,
      metadata: {
        title: refs.title.value, artist: refs.artist.value, album: refs.album.value,
        genre: refs.genre.value, bpm: refs.bpm.value, track: refs.track.value,
        rolling: refs.rolling.checked
      },
      export: { size: refs.exportSize.value, fps: refs.exportFps.value, width: refs.customWidth.value, height: refs.customHeight.value },
      actions: refs.actionsEditor?.value || ""
    };
  }

  async function savePreset() {
    const stem = songStem();
    try {
      const type = FLAV_FILE_TYPES.settings;
      const blob = new Blob([JSON.stringify(presetPayload(), null, 2)], { type: type.mime });
      const target = await openSaveTarget(`${stem}${type.extension}`, type.mime, type.description, type.extension, true);
      await writeSaveTarget(target, blob);
      showToast(t("toast.presetSaved"));
    } catch (error) {
      reportSaveError(error);
    }
  }

  function applyPreset(payload, options = {}) {
    if (!payload || typeof payload !== "object") throw new Error("invalid preset");
    const config = payload.config || payload;
    const next = cloneConfig(defaultConfig);
    // A legacy or partial preset may omit colors. Use the active theme as the
    // fallback so importing it cannot create a light canvas inside dark UI.
    next.colors = paletteForTheme(state.theme);
    for (const key of ["layers", "metrics", "colors"]) Object.assign(next[key], config[key] || {});
    delete next.layers.scanBeam;
    for (const key of ["barWidth", "spectrumGain", "waveHeight", "motion", "frequencyScale", "fftSize", "spectrumStyle", "layout", "showLabels", "reducedMotion"]) if (config[key] !== undefined) next[key] = config[key];
    if (!SPECTRUM_STYLES.includes(next.spectrumStyle)) next.spectrumStyle = defaultConfig.spectrumStyle;
    state.config = next;
    state.themePalettes[state.theme] = cloneConfig(next.colors);
    const meta = payload.metadata || {};
    for (const [key, ref] of [["title", refs.title], ["artist", refs.artist], ["album", refs.album], ["genre", refs.genre], ["bpm", refs.bpm], ["track", refs.track]]) if (meta[key] !== undefined) ref.value = meta[key];
    if (meta.rolling !== undefined) refs.rolling.checked = Boolean(meta.rolling);
    if (payload.export) {
      if (payload.export.size) refs.exportSize.value = payload.export.size;
      if (payload.export.fps) refs.exportFps.value = payload.export.fps;
      if (payload.export.width) refs.customWidth.value = payload.export.width;
      if (payload.export.height) refs.customHeight.value = payload.export.height;
    }
    if (typeof payload.actions === "string" && refs.actionsEditor) {
      refs.actionsEditor.value = payload.actions;
      updateActionsStatus();
    }
    refs.customSizeFields.hidden = refs.exportSize.value !== "custom";
    configureAnalyser();
    updateConfigUI(); saveConfig(); saveMetadata(); renderOnce();
    if (!options.silent) showToast(t("toast.presetImported"));
  }

  async function importPresetFile(file, invalidKey = "toast.presetInvalid") {
    if (!fileHasExtension(file, FLAV_FILE_TYPES.settings.extension)) {
      showToast(t("toast.settingsExtension"));
      return false;
    }
    try {
      applyPreset(JSON.parse(await file.text()));
      return true;
    } catch {
      showToast(t(invalidKey));
      return false;
    }
  }

  async function importActionsFile(file) {
    if (!fileHasExtension(file, FLAV_FILE_TYPES.actions.extension)) {
      showToast(t("toast.actionsExtension"));
      return false;
    }
    try {
      refs.actionsEditor.value = await file.text();
      updateActionsStatus();
      showToast(t("toast.actionsImported"));
      return true;
    } catch {
      showToast(t("toast.actionsInvalid"));
      return false;
    }
  }

  function updateActionsStatus(options = {}) {
    if (!refs.actionsEditor) return;
    const parsed = parseBpmActions(refs.actionsEditor.value);
    state.bpmTimeline = parsed.points;
    state.actionErrors = parsed.errors;
    if (!refs.actionsStatus) return;
    const lines = refs.actionsEditor.value.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
    refs.actionsStatus.textContent = lines.length
      ? t("actions.ready", "{count} action{plural} ready. Saved locally in this browser.", { count: lines.length, plural: lines.length === 1 ? "" : "s" })
      : t("actions.none", "No active actions yet. Saved locally in this browser.");
    refs.actionsStatus.title = parsed.errors.length
      ? parsed.errors.map((error) => `Line ${error.line}: ${error.message}`).join("\n")
      : "";
    if (options.persist !== false) {
      try { localStorage.setItem(ACTIONS_KEY, refs.actionsEditor.value); } catch { /* noop */ }
      scheduleRecoverySnapshot();
    }
    renderOnce();
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(value); return; }
    const area = document.createElement("textarea");
    area.value = value; area.style.position = "fixed"; area.style.opacity = "0";
    document.body.appendChild(area); area.focus(); area.select(); document.execCommand("copy"); area.remove();
  }

  function bindActions() {
    if (!refs.actionsEditor) return;
    if (!state.pendingRecovery) {
      try { refs.actionsEditor.value = localStorage.getItem(ACTIONS_KEY) || ""; } catch { /* noop */ }
    }
    updateActionsStatus({ persist: false });
    refs.actionsEditor.addEventListener("input", updateActionsStatus);
    $("#copyTime").addEventListener("click", async () => {
      try { await copyText(formatActionTime(currentTime())); showToast(t("toast.copy")); } catch { showToast(t("toast.copyFailed")); }
    });
    $("#importActions").addEventListener("click", () => {
      void openTypedFile(refs.actionsInput, FLAV_FILE_TYPES.actions).then((file) => file && importActionsFile(file));
    });
    refs.actionsInput.addEventListener("change", () => {
      const file = refs.actionsInput.files?.[0];
      refs.actionsInput.value = "";
      if (file) void importActionsFile(file);
    });
    ["dragenter", "dragover"].forEach((eventName) => refs.actionsEditor.addEventListener(eventName, (event) => {
      event.preventDefault();
      refs.actionsEditor.classList.add("is-dragging");
    }));
    ["dragleave", "drop"].forEach((eventName) => refs.actionsEditor.addEventListener(eventName, (event) => {
      event.preventDefault();
      refs.actionsEditor.classList.remove("is-dragging");
    }));
    refs.actionsEditor.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (file) void importActionsFile(file);
    });
    $("#saveActions").addEventListener("click", async () => {
      const type = FLAV_FILE_TYPES.actions;
      const blob = new Blob([refs.actionsEditor.value], { type: type.mime });
      try {
        const target = await openSaveTarget(`${songStem()}${type.extension}`, type.mime, type.description, type.extension, true);
        await writeSaveTarget(target, blob);
        showToast(t("toast.actionsSaved"));
      } catch (error) {
        reportSaveError(error);
      }
    });
    $("#addAction").addEventListener("click", () => {
      const line = `${formatActionTime(currentTime())}  note text=New marker`;
      const start = refs.actionsEditor.selectionStart;
      const before = refs.actionsEditor.value.slice(0, start);
      const after = refs.actionsEditor.value.slice(start);
      refs.actionsEditor.value = `${before}${before && !before.endsWith("\n") ? "\n" : ""}${line}${after && !after.startsWith("\n") ? "\n" : ""}${after}`;
      updateActionsStatus(); refs.actionsEditor.focus();
    });
  }

  function bindExportControls() {
    const persistExport = () => {
      refs.customSizeFields.hidden = refs.exportSize.value !== "custom";
      scheduleRecoverySnapshot();
    };
    refs.openExportDialog.addEventListener("click", showExportDialog);
    refs.closeExportDialog.addEventListener("click", closeExportDialog);
    refs.exportDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeExportDialog();
    });
    refs.exportDialog.addEventListener("click", (event) => {
      if (event.target !== refs.exportDialog) return;
      const bounds = refs.exportDialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (outside) closeExportDialog();
    });
    refs.exportDialog.addEventListener("close", () => {
      document.documentElement.classList.remove("export-dialog-open");
      const opener = state.exportDialogOpener;
      state.exportDialogOpener = null;
      requestAnimationFrame(() => opener?.isConnected && opener.focus());
    });
    refs.exportSize.addEventListener("change", persistExport);
    [refs.exportFps, refs.customWidth, refs.customHeight].forEach((input) => input.addEventListener("input", persistExport));
    $("#exportPng").addEventListener("click", exportPng);
    $("#exportMp4").addEventListener("click", () => void exportMp4());
    $("#saveConfig").addEventListener("click", savePreset);
    $("#importConfig").addEventListener("click", () => {
      void openTypedFile(refs.presetInput, FLAV_FILE_TYPES.settings).then((file) => file && importPresetFile(file));
    });
    refs.presetInput.addEventListener("change", async () => {
      const file = refs.presetInput.files?.[0];
      refs.presetInput.value = "";
      if (!file) return;
      void importPresetFile(file);
    });
  }

  function estimateBpm() {
    const profile = state.analysis?.rmsProfile;
    if (!profile || profile.length < 8) return null;
    const duration = state.analysis.duration;
    let bestBpm = 120; let bestScore = -Infinity;
    for (let bpm = 60; bpm <= 190; bpm += 1) {
      const lag = Math.max(1, Math.round((60 / bpm) * profile.length / duration));
      let score = 0;
      for (let i = lag; i < profile.length; i += 1) score += profile[i] * profile[i - lag];
      if (score > bestScore) { bestScore = score; bestBpm = bpm; }
    }
    return bestBpm;
  }

  function bindPlayback() {
    refs.play.addEventListener("click", togglePlay);
    refs.back.addEventListener("click", () => seek(currentTime() - 10));
    refs.forward.addEventListener("click", () => seek(currentTime() + 10));
    $("#restartButton")?.addEventListener("click", () => seek(0));
    let resumeAfterScrub = false;
    refs.scrub.addEventListener("pointerdown", () => { resumeAfterScrub = state.playing; if (resumeAfterScrub) pause(); });
    refs.scrub.addEventListener("input", () => seek((Number(refs.scrub.value) || 0) * (state.analysis?.duration || 0)));
    refs.scrub.addEventListener("pointerup", () => { if (resumeAfterScrub) void play(); resumeAfterScrub = false; });
    refs.mute.addEventListener("click", () => {
      state.muted = !state.muted;
      if (state.gainNode) state.gainNode.gain.value = state.muted ? 0 : state.volume;
      const muteKey = state.muted ? "stage.unmute" : "stage.mute";
      refs.mute.setAttribute("aria-label", t(muteKey, state.muted ? "Unmute" : "Mute"));
      refs.mute.title = t(muteKey, state.muted ? "Unmute" : "Mute");
      refs.mute.textContent = state.muted ? "×" : "◖";
    });
    window.addEventListener("keydown", (event) => {
      const target = event.target;
      if (document.querySelector("dialog[open]") || target?.closest?.("dialog")) return;
      if (target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) return;
      if (event.code === "Space") { event.preventDefault(); togglePlay(); }
      if (event.key === "ArrowLeft") seek(currentTime() - 5);
      if (event.key === "ArrowRight") seek(currentTime() + 5);
    });
    $("#estimateBpm").addEventListener("click", () => {
      if (!state.analysis) { showToast(t("toast.bpmMissing")); return; }
      const bpm = estimateBpm();
      if (bpm) { refs.bpm.value = String(bpm); showToast(t("toast.estimate", "Estimated tempo: {bpm} BPM.", { bpm })); renderOnce(); }
    });
  }

  function bindMetadata() {
    let timer = 0;
    const persist = () => {
      clearTimeout(timer);
      timer = setTimeout(() => saveMetadata(), 180);
      renderOnce();
    };
    [refs.title, refs.artist, refs.album, refs.genre, refs.bpm, refs.track].forEach((input) => input.addEventListener("input", persist));
    refs.rolling.addEventListener("change", persist);
    if (!state.pendingRecovery) {
      try {
        const saved = JSON.parse(localStorage.getItem(META_KEY) || "null");
        if (saved) {
          for (const [key, ref] of [["title", refs.title], ["artist", refs.artist], ["album", refs.album], ["genre", refs.genre], ["bpm", refs.bpm], ["track", refs.track]]) if (saved[key] !== undefined && saved[key] !== "") ref.value = saved[key];
          if (saved.rolling !== undefined) refs.rolling.checked = Boolean(saved.rolling);
        }
      } catch { /* noop */ }
    }
  }

  function renderVersionQuery() {
    if (!refs.versionButton || !refs.versionValue || !refs.versionLabel) return;
    const query = state.versionQuery || { phase: "idle", value: "" };
    const copy = {
      idle: [t("version.query", "Check"), t("version.help", "Click to check version")],
      loading: [t("version.loading", "..."), t("version.loadingHelp", "Checking")],
      current: [query.value, t("version.current", "Current version")],
      error: [t("version.retry", "Retry"), t("version.error", "Check failed, click to retry")]
    }[query.phase] || [t("version.query", "Check"), t("version.help", "Click to check version")];
    refs.versionValue.textContent = copy[0];
    refs.versionLabel.textContent = copy[1];
    refs.versionButton.disabled = query.phase === "loading";
    refs.versionButton.setAttribute("aria-busy", String(query.phase === "loading"));
    refs.versionButton.setAttribute("aria-label", t("version.aria", "Check FLAudioViz version"));
  }

  async function queryVersion() {
    if (!refs.versionButton || state.versionQuery.phase === "loading") return;
    state.versionQuery = { phase: "loading", value: "" };
    renderVersionQuery();
    try {
      const response = await fetch(`./FLAZVersion.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Version request failed with ${response.status}`);
      const payload = await response.json();
      const version = String(payload?.version || "").trim();
      if (!version || version.length > 48 || /[\u0000-\u001f]/.test(version)) throw new Error("Invalid version response");
      state.versionQuery = { phase: "current", value: version };
    } catch (error) {
      console.warn("FLAudioViz version check failed", error);
      state.versionQuery = { phase: "error", value: "" };
    }
    renderVersionQuery();
  }

  function bindVersionQuery() {
    refs.versionButton?.addEventListener("click", () => void queryVersion());
  }

  function setTutorialSection(sectionId) {
    if (!sectionId) return;
    $$('[data-tutorial-link]').forEach((link) => {
      const active = link.dataset.tutorialLink === sectionId;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (refs.tutorialSectionSelect?.value !== sectionId) refs.tutorialSectionSelect.value = sectionId;
  }

  function scrollTutorialTo(sectionId, behavior = "smooth") {
    const section = document.getElementById(sectionId);
    if (!section || !refs.tutorialContent) return;
    const contentBounds = refs.tutorialContent.getBoundingClientRect();
    const sectionBounds = section.getBoundingClientRect();
    refs.tutorialContent.scrollTo({
      top: refs.tutorialContent.scrollTop + sectionBounds.top - contentBounds.top,
      behavior: motionIsReduced() ? "auto" : behavior
    });
    setTutorialSection(sectionId);
  }

  function tutorialImageViewerIsOpen() {
    return Boolean(refs.tutorialImageViewer && !refs.tutorialImageViewer.hidden);
  }

  function setTutorialBackgroundInert(inert) {
    if (!refs.tutorialDialog) return;
    for (const element of [
      $(".tutorial-dialog__header", refs.tutorialDialog),
      $(".tutorial-section-picker", refs.tutorialDialog),
      $(".tutorial-dialog__body", refs.tutorialDialog)
    ]) {
      if (element) element.inert = inert;
    }
  }

  function showTutorialImageViewer(button) {
    if (!refs.tutorialImageViewer || !refs.tutorialImagePreview || tutorialImageViewerIsOpen()) return;
    const image = button.querySelector(`img[data-guide-image="${state.language}"]`) || button.querySelector("img");
    const source = image?.currentSrc || image?.src;
    if (!source) return;
    const caption = button.closest("figure")?.querySelector("figcaption > span:first-child")?.textContent?.trim() || t("guide.figure.viewerTitle");
    state.tutorialImageOpener = button;
    refs.tutorialImagePreview.src = source;
    if (refs.tutorialImageCaption) refs.tutorialImageCaption.textContent = caption;
    refs.tutorialImageViewer.hidden = false;
    refs.tutorialImageViewer.setAttribute("aria-hidden", "false");
    setTutorialBackgroundInert(true);
    requestAnimationFrame(() => {
      refs.tutorialImageViewer?.classList.add("is-open");
      refs.closeTutorialImageViewer?.focus();
    });
  }

  function closeTutorialImageViewer({ restoreFocus = true } = {}) {
    if (!tutorialImageViewerIsOpen()) return false;
    const opener = state.tutorialImageOpener;
    state.tutorialImageOpener = null;
    refs.tutorialImageViewer.classList.remove("is-open");
    refs.tutorialImageViewer.hidden = true;
    refs.tutorialImageViewer.setAttribute("aria-hidden", "true");
    refs.tutorialImagePreview?.removeAttribute("src");
    if (refs.tutorialImageCaption) refs.tutorialImageCaption.textContent = "";
    setTutorialBackgroundInert(false);
    if (restoreFocus) requestAnimationFrame(() => opener?.isConnected && opener.focus());
    return true;
  }

  function showTutorialDialog() {
    if (!refs.tutorialDialog || document.querySelector("dialog[open]")) return;
    state.tutorialDialogOpener = document.activeElement instanceof HTMLElement ? document.activeElement : refs.tutorialButton;
    refs.tutorialDialog.classList.toggle("is-reduced-motion", motionIsReduced());
    refs.tutorialDialog.showModal();
    document.documentElement.classList.add("tutorial-dialog-open");
    if (refs.tutorialContent) refs.tutorialContent.scrollTop = 0;
    setTutorialSection("tutorial-start");
    requestAnimationFrame(() => refs.tutorialTitle?.focus());
  }

  function closeTutorialDialog() {
    if (!refs.tutorialDialog?.open) return;
    if (closeTutorialImageViewer()) return;
    refs.tutorialDialog.close();
  }

  function bindTutorialControls() {
    if (!refs.tutorialDialog || !refs.tutorialButton) return;
    refs.tutorialButton.addEventListener("click", showTutorialDialog);
    refs.closeTutorialDialog?.addEventListener("click", closeTutorialDialog);
    refs.finishTutorial?.addEventListener("click", closeTutorialDialog);
    refs.closeTutorialImageViewer?.addEventListener("click", () => closeTutorialImageViewer());
    refs.tutorialImageViewer?.addEventListener("click", (event) => {
      if (event.target === refs.tutorialImageViewer || event.target === refs.tutorialImageStage) closeTutorialImageViewer();
    });
    refs.tutorialDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      if (closeTutorialImageViewer()) return;
      closeTutorialDialog();
    });
    refs.tutorialDialog.addEventListener("click", (event) => {
      if (event.target !== refs.tutorialDialog) return;
      const bounds = refs.tutorialDialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (outside) {
        if (!closeTutorialImageViewer()) closeTutorialDialog();
      }
    });
    refs.tutorialDialog.addEventListener("close", () => {
      closeTutorialImageViewer({ restoreFocus: false });
      document.documentElement.classList.remove("tutorial-dialog-open");
      const opener = state.tutorialDialogOpener;
      state.tutorialDialogOpener = null;
      requestAnimationFrame(() => opener?.isConnected && opener.focus());
    });
    $$('[data-tutorial-link]').forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      scrollTutorialTo(link.dataset.tutorialLink);
    }));
    refs.tutorialSectionSelect?.addEventListener("change", () => scrollTutorialTo(refs.tutorialSectionSelect.value));
    $$('[data-guide-open]').forEach((button) => button.addEventListener("click", () => showTutorialImageViewer(button)));

    let scrollFrame = 0;
    refs.tutorialContent?.addEventListener("scroll", () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const marker = refs.tutorialContent.getBoundingClientRect().top + 40;
        let active = "tutorial-start";
        $$('[data-tutorial-section]').forEach((section) => {
          if (section.getBoundingClientRect().top <= marker) active = section.id;
        });
        setTutorialSection(active);
      });
    }, { passive: true });
  }

  function bindTopbar() {
    const moreButton = $("#moreButton");
    const menu = $("#moreMenu");
    moreButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = moreButton.getAttribute("aria-expanded") === "true";
      moreButton.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });
    document.addEventListener("click", (event) => {
      if (!menu.contains(event.target) && event.target !== moreButton) { moreButton.setAttribute("aria-expanded", "false"); menu.hidden = true; }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { moreButton.setAttribute("aria-expanded", "false"); menu.hidden = true; }
    });
    $("#customizeButton").addEventListener("click", () => document.querySelector("#customize").scrollIntoView({ behavior: state.config.reducedMotion ? "auto" : "smooth", block: "start" }));
    $("#themeButton").addEventListener("click", () => {
      const currentTheme = state.theme === "dark" ? "dark" : "light";
      const nextTheme = currentTheme === "light" ? "dark" : "light";
      // Keep a custom palette per theme so switching modes does not erase the
      // colors the user tuned in the other mode.
      state.themePalettes[currentTheme] = cloneConfig(state.config.colors);
      state.theme = nextTheme;
      state.config.colors = cloneConfig(state.themePalettes[nextTheme] || paletteForTheme(nextTheme));
      document.documentElement.dataset.theme = nextTheme;
      try { localStorage.setItem(THEME_KEY, state.theme); } catch { /* private mode */ }
      updateColorUI(); saveConfig(); renderOnce();
    });
    $$(".language-button").forEach((button) => button.addEventListener("click", () => {
      state.language = button.dataset.lang;
      applyLanguage();
      showToast(state.language === "zh" ? t("toast.languageZh") : t("toast.languageEn"));
    }));
  }

  function bindRecoveryControls() {
    if (!refs.recoveryDialog) return;
    refs.recoveryRestore?.addEventListener("click", () => resolveRecovery(true));
    refs.recoveryDismiss?.addEventListener("click", () => resolveRecovery(false));
    refs.recoveryDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      resolveRecovery(false);
    });
  }

  function applyInitialSettingsDisclosure() {
    if (!window.matchMedia?.("(max-width: 760px)")?.matches) return;
    $$(".settings-group").forEach((group, index) => {
      if (index > 0) group.open = false;
    });
  }

  function init() {
    document.documentElement.dataset.theme = state.theme;
    applyInitialSettingsDisclosure();
    bindDropZone(refs.audioDrop, refs.audioInput, handleAudioFile);
    bindDropZone(refs.coverDrop, refs.coverInput, handleCoverFile);
    bindDropZone(refs.songfileDrop, refs.songfileInput, (file) => importPresetFile(file, "toast.projectInvalid"), FLAV_FILE_TYPES.settings);
    bindConfigControls();
    bindExportControls();
    bindActions();
    bindPlayback();
    bindMetadata();
    bindTopbar();
    bindTutorialControls();
    bindVersionQuery();
    bindRecoveryControls();
    updateConfigUI();
    updateFileStrip();
    updateDetails();
    updateTimeUI();
    setPlayButton(false);
    ensureCoverFrameOverlay();
    startCoverFrameLoop();
    applyLanguage();
    renderOnce();
    state.initializing = false;
    // Open before the first paint so cached project data never appears to
    // restore itself while the user is still deciding.
    offerRecovery();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
