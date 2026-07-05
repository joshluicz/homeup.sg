from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED, ZIP_STORED
import shutil

ROOT = Path(__file__).resolve().parents[1]
BUILD_DIR = ROOT / "tmp-roadshow-offline"
ASSET_DIR = BUILD_DIR / "assets"
ZIP_PATH = ROOT / "public" / "downloads" / "homeup-roadshow-offline.zip"

ASSETS = {
    ROOT / "public" / "videos" / "homeup-roadshow.mp4": ASSET_DIR / "homeup-roadshow.mp4",
    ROOT / "public" / "images" / "homeup-logo-wordmark.svg": ASSET_DIR / "homeup-logo-wordmark.svg",
    ROOT / "public" / "images" / "agent-dennis.png": ASSET_DIR / "agent-dennis.png",
    ROOT / "public" / "images" / "agent-tong-boon.png": ASSET_DIR / "agent-tong-boon.png",
    ROOT / "public" / "images" / "agent-edmund.png": ASSET_DIR / "agent-edmund.png",
    ROOT / "public" / "images" / "agent-olivia.png": ASSET_DIR / "agent-olivia.png",
    ROOT / "public" / "images" / "agent-kenji.png": ASSET_DIR / "agent-kenji.png",
    ROOT / "public" / "images" / "agent-isaac.png": ASSET_DIR / "agent-isaac.png",
}

HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HomeUP Roadshow Display</title>
  <style>
    :root { --green: #008f52; --green-strong: #00d47e; }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
    body {
      font-family: "Plus Jakarta Sans", "Inter", "Segoe UI", Arial, sans-serif;
      color: #111;
      background: linear-gradient(115deg, #e4faee 0%, #f8fff9 40%, #d8f7e7 100%);
    }
    .screen {
      position: relative;
      height: 100vh;
      display: grid;
      grid-template-columns: minmax(520px, 0.98fr) 1.02fr;
      align-items: center;
      gap: 32px;
      max-width: 1360px;
      margin: 0 auto;
      padding: 16px 32px;
    }
    .bg-left, .orb-a, .orb-b, .orb-c, .sheen { position: fixed; pointer-events: none; }
    .bg-left { inset: 0 auto 0 0; width: 56%; background: linear-gradient(110deg, rgba(0,143,82,.26), rgba(0,166,90,.12) 48%, transparent 82%); }
    .orb-a { left: -9rem; top: -9rem; width: 30rem; height: 30rem; border-radius: 999px; background: rgba(0,143,82,.35); filter: blur(70px); }
    .orb-b { right: 18%; bottom: -11rem; width: 34rem; height: 34rem; border-radius: 999px; background: rgba(0,166,90,.28); filter: blur(80px); }
    .orb-c { right: -8rem; top: 8%; width: 30rem; height: 30rem; border-radius: 999px; background: rgba(186,230,253,.55); filter: blur(80px); }
    .sheen { inset: 0; background: radial-gradient(circle at 18% 20%, rgba(255,255,255,.9), transparent 30%), radial-gradient(circle at 74% 52%, rgba(0,143,82,.14), transparent 34%); }
    .left { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 0; }
    .logo { width: min(300px, 44vw); margin: -40px 0 32px; filter: drop-shadow(0 10px 20px rgba(15,23,42,.08)); }
    h1 { margin: 0; max-width: 720px; font-size: clamp(42px, 4vw, 76px); line-height: .96; letter-spacing: -0.055em; font-weight: 900; }
    .nowrap { white-space: nowrap; }
    .red { color: #dc2626; }
    .green { color: var(--green); }
    .stats {
      margin-top: 32px;
      width: 460px;
      height: 108px;
      padding: 16px 20px;
      border-radius: 18px;
      color: #fff;
      background: #050807;
      border: 1px solid rgba(255,255,255,.10);
      box-shadow: 0 24px 70px rgba(3,7,18,.34), 0 0 0 1px rgba(0,166,90,.14);
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .total { width: 170px; text-align: left; }
    .number { width: 170px; font-size: 48px; line-height: 1; font-weight: 900; color: var(--green-strong); font-variant-numeric: tabular-nums; }
    .label { margin-top: 6px; font-size: 24px; line-height: 1; font-weight: 850; }
    .divider { width: 1px; height: 64px; background: rgba(255,255,255,.15); }
    .breakdown { width: 214px; display: flex; flex-direction: column; gap: 8px; }
    .row { display: flex; align-items: center; gap: 8px; }
    .small-number { width: 78px; text-align: left; font-size: 30px; line-height: 1; font-weight: 850; font-variant-numeric: tabular-nums; }
    .pill { padding: 4px 10px; border-radius: 999px; background: #00a65a; color: #fff; font-size: 12px; font-weight: 800; white-space: nowrap; }
    .bottom-group { margin-top: 64px; display: flex; flex-direction: column; align-items: center; }
    h2 { margin: 0; font-size: clamp(34px, 3.15vw, 55px); line-height: 1; letter-spacing: -0.055em; font-weight: 900; }
    .avatars { margin-top: 32px; display: flex; margin-left: 12px; }
    .avatar { position: relative; width: 56px; height: 56px; margin-left: -8px; border-radius: 999px; overflow: hidden; border: 3px solid #fff; background: #eee; box-shadow: 0 10px 28px rgba(15,23,42,.18); }
    .avatar img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
    .video-shell {
      position: relative;
      width: min(48vw, 428px);
      aspect-ratio: 9 / 16;
      max-height: calc(100vh - 32px);
      margin: 0 auto;
      border-radius: 32px;
      overflow: hidden;
      background: #000;
      border: 1px solid rgba(255,255,255,.8);
      box-shadow: 0 34px 100px rgba(0,105,58,.32);
      outline: 2px solid rgba(0,166,90,.25);
    }
    video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .play-overlay {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      border: 0;
      background: rgba(0,0,0,.38);
      color: white;
      font-size: 22px;
      font-weight: 800;
      cursor: pointer;
    }
    .play-overlay.visible { display: flex; }
  </style>
</head>
<body>
  <div class="bg-left"></div><div class="orb-a"></div><div class="orb-b"></div><div class="orb-c"></div><div class="sheen"></div>
  <main class="screen">
    <section class="left">
      <img class="logo" src="assets/homeup-logo-wordmark.svg" alt="HomeUP" />
      <h1><span class="nowrap">Most agents take <span class="red">2%</span>.</span><br />We charge a <span class="green">flat fee</span>.</h1>
      <div class="stats" aria-label="HomeUP transaction stats">
        <div class="total"><div id="total" class="number">0</div><div class="label">Transactions</div></div>
        <div class="divider"></div>
        <div class="breakdown">
          <div class="row"><div id="hdb" class="small-number">0</div><div class="pill">HDB</div></div>
          <div class="row"><div id="condo" class="small-number">0</div><div class="pill">Condo &amp; Landed</div></div>
        </div>
      </div>
      <div class="bottom-group">
        <h2>Sell Your Home for More.<br /><span class="green">Save on <span id="typewriter">Time.</span><span id="cursor">|</span></span></h2>
        <div class="avatars" aria-label="HomeUP agents">
          <div class="avatar"><img src="assets/agent-dennis.png" alt="Dennis" /></div>
          <div class="avatar"><img src="assets/agent-tong-boon.png" alt="Tong Boon" /></div>
          <div class="avatar"><img src="assets/agent-edmund.png" alt="Edmund" /></div>
          <div class="avatar"><img src="assets/agent-olivia.png" alt="Olivia" /></div>
          <div class="avatar"><img src="assets/agent-kenji.png" alt="Kenji" /></div>
          <div class="avatar"><img src="assets/agent-isaac.png" alt="Isaac" /></div>
        </div>
      </div>
    </section>
    <section class="video-shell">
      <video id="roadshowVideo" src="assets/homeup-roadshow.mp4" autoplay loop playsinline preload="auto"></video>
      <button id="playOverlay" class="play-overlay" type="button">Click once to play video with sound</button>
    </section>
  </main>
  <script>
    const fmt = new Intl.NumberFormat('en-SG');
    function animateNumber(el, end, duration) {
      const start = performance.now();
      function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = fmt.format(Math.round(end * t)) + (t === 1 ? '+' : '');
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    function startStatsLoop() {
      animateNumber(document.getElementById('total'), 1000, 2500);
      animateNumber(document.getElementById('hdb'), 860, 2500);
      animateNumber(document.getElementById('condo'), 260, 2500);
      setTimeout(startStatsLoop, 6000);
    }
    startStatsLoop();

    const words = ['Time.', 'Hassle.', 'Commissions.'];
    const target = document.getElementById('typewriter');
    let wordIndex = 0, charIndex = 0, deleting = false;
    function typeLoop() {
      const word = words[wordIndex];
      if (!deleting) {
        charIndex++;
        target.textContent = word.slice(0, charIndex);
        if (charIndex === word.length) { deleting = true; setTimeout(typeLoop, 1600); return; }
      } else {
        charIndex--;
        target.textContent = word.slice(0, charIndex);
        if (charIndex === 0) { deleting = false; wordIndex = (wordIndex + 1) % words.length; }
      }
      setTimeout(typeLoop, deleting ? 35 : 55);
    }
    typeLoop();

    const video = document.getElementById('roadshowVideo');
    const overlay = document.getElementById('playOverlay');
    function tryPlay() {
      const result = video.play();
      if (result && typeof result.catch === 'function') result.catch(() => overlay.classList.add('visible'));
    }
    overlay.addEventListener('click', () => { overlay.classList.remove('visible'); video.play(); });
    window.addEventListener('load', tryPlay);
  </script>
</body>
</html>
"""

README = """HomeUP Roadshow Offline Kit

What is inside:
- index.html: the roadshow display page (open this file)
- assets/homeup-roadshow.mp4: the local video file
- assets/*.png and *.svg: logo and agent images

Recommended setup on Windows:
1. Unzip this folder.
2. Double-click index.html.
3. Chrome or Edge should open the roadshow display.
4. Plug the laptop into the TV screen.
5. Press F11 for full screen.
6. If the video does not autoplay with sound, click the video once.

No internet is needed after this folder is downloaded.

Important:
- Open index.html directly. Do not use localhost or a local server.
- If you see a localhost 404 or directory listing, close that tab and open index.html from the unzipped folder instead.
- If Windows Smart App Control blocks a file, ignore any .bat scripts and open index.html only.
"""


def main() -> None:
    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    ZIP_PATH.parent.mkdir(parents=True, exist_ok=True)

    missing = [str(src) for src in ASSETS if not src.exists()]
    if missing:
        raise FileNotFoundError("Missing required assets:\n" + "\n".join(missing))

    for src, dst in ASSETS.items():
        shutil.copy2(src, dst)

    (BUILD_DIR / "index.html").write_text(HTML, encoding="utf-8")
    (BUILD_DIR / "README.txt").write_text(README, encoding="utf-8")

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with ZipFile(ZIP_PATH, "w") as z:
        for path in BUILD_DIR.rglob("*"):
            if path.is_file():
                compression = ZIP_STORED if path.suffix.lower() == ".mp4" else ZIP_DEFLATED
                z.write(path, path.relative_to(BUILD_DIR).as_posix(), compress_type=compression)

    print(f"Wrote {ZIP_PATH} ({ZIP_PATH.stat().st_size} bytes)")
    shutil.rmtree(BUILD_DIR)


if __name__ == "__main__":
    main()
