# 🧠 QR-AI-Chat

### An AI chat interface, compressed until it fits entirely inside a single QR code.

**Scan it. You're not opening a link — the whole interface was inside that square.**

<p align="center">
  <img src="./assets/banner.png" alt="Scan to chat" width="280"/>
</p>

<p align="center"><i>👆 scan this right now with your phone camera</i></p>

<p align="center">
  <img src="#" alt="Demo Animation" width="100%"/>
</p>

---

## What is this?

Most "AI QR codes" are just a sticker with a link on it — scan it, get redirected to a normal hosted webpage. **This isn't that.** The entire chat interface — HTML, CSS, JavaScript, the AI's personal context — is minified, gzip-compressed, base64-encoded, and packed directly into the URL that the QR code holds. When you scan it, your browser decompresses and runs that interface *live*, on the spot, from the ~2.7KB of data sitting in the code itself.

Then it talks to a real AI — not a canned FAQ bot — that answers questions about the person it represents.

## ⚡ Features

- **The interface fits inside 2.7KB** — under the hard ~2,953 byte ceiling of a Version 40 QR code at the lowest error-correction level
- **No app, no install** — scan and it just renders, in any modern mobile browser
- **Real AI answers**, not scripted responses — powered by a secured, rate-limited serverless proxy
- **Zero framework, zero dependency** — pure vanilla HTML/CSS/JS, because every byte has to earn its place
- **Retro CRT terminal UI** — scanlines, phosphor glow, blinking cursor
- **Fork it and make your own in minutes** — swap in your own data, deploy your own version

## 🧩 One honest clarification

The interface lives inside the QR code. The AI model itself does not — that's not a limitation of this project, it's physics (models are gigabytes, QR codes are kilobytes). Every time you send a message, it makes one network call to a real AI backend, the same way ChatGPT, Claude, or any other AI product works. What's actually novel here is that the *whole interface* — not just a link to it — is what's compressed into the code. Wanted to say this outright rather than let anyone assume otherwise.

## 📸 Troubleshooting / Scanning Issues

Since this is a massive **Version 39/40 QR Code** (the literal highest density standard that exists), some native default phone cameras or older devices might struggle to lock onto it.

If your camera can't seem to decode it:
1. Try a dedicated third-party scanning app (like Google Lens).
2. Or, screenshot/save the QR code and upload it directly to a site like [scanqr.org](https://scanqr.org/) to extract the link.

## 🛠 How it works

```
   QR code
     │  holds a URL like:  https://yoursite.com/#<compressed-payload>
     ▼
 Loader page  ──(reads URL hash, base64-decodes, gunzips via
     │           the browser's native DecompressionStream API)
     ▼
 Chat widget  ──(fully rendered, running entirely client-side)
     │
     ▼
 Secure proxy ──(Cloudflare Worker: holds the API key server-side,
     │           rate-limits per visitor, builds the system prompt)
     ▼
   AI reply
```

The payload lives in the URL's **hash fragment** (`#...`), which browsers never send to a server — so the loader page can be a completely static file, and the compressed data costs nothing server-side.

## 📦 The compression pipeline

| Stage | Tool | What it does |
|---|---|---|
| Minify | `terser` + `html-minifier-terser` | Strips whitespace, comments, shortens identifiers |
| Compress | Node `zlib`, gzip level 9 | The real size reduction — highly repetitive markup/code compresses hard |
| Encode | base64 | Makes binary data safe to embed in a URL (costs ~33% overhead — the price of admission) |

Final result: a URL short enough to survive being turned into a scannable QR code at Error Correction Level **L** (max data capacity), Version 40 (max size) — **2,953 bytes**, hard ceiling.

## 🔐 Security

A QR code is public — anyone can scan it and read every line of the decompressed source. So:

- The AI API key is never in the widget or the QR payload — it's a Cloudflare Worker secret, server-side only
- Strict CORS lockdown to a single origin
- Per-IP and global rate limiting via Cloudflare KV
- Full input validation before any API call
- Zero conversation logging — only rate-limit counters

## 🚀 Make your own version

This is built to be forked, not just looked at:

1. Clone this repo
2. Edit the `IDENTITY` object in `widget/index.html` — your name, tagline, skills, projects
3. Deploy your own Cloudflare Worker in `worker/` (bring your own AI API key)
4. Point `widget/build.js` at your deployed Worker URL and your hosting domain
5. Run `node widget/build.js` — get your compressed payload + final URL, with a pass/fail report against the QR byte budget
6. Deploy the loader (`deploy/index.html`) anywhere static — Vercel, GitHub Pages, wherever
7. Generate your QR code from the final URL

If you build your own version, extend this, or find a way to shrink the payload further — open a PR. Contributions and forks are very welcome.

## ⭐ If you like this

Star the repo — it genuinely helps this reach more people, and more visibility means more contributors pushing the compression budget further.

## 📜 License

MIT — do whatever you want with this.
