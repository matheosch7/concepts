/* TypeFX — preset kinetic-typography library for GSAP / HyperFrames.
   Every preset signature: fn(tl, target, opts) -> tl  (places at opts.at, default 0).
   Requires gsap + (optionally) SplitText, ScrambleTextPlugin, CustomEase loaded first.
   Splitting.js is used as a fallback splitter when SplitText is absent. */
(function () {
  const G = window.gsap;
  if (!G) { console.warn("TypeFX: gsap not found"); return; }
  // register any premium plugins that are present
  ["SplitText","ScrambleTextPlugin","CustomEase","DrawSVGPlugin","MorphSVGPlugin","Physics2DPlugin","MotionPathPlugin","CustomBounce","CustomWiggle","Flip"]
    .forEach(n => { if (window[n]) try { G.registerPlugin(window[n]); } catch(e){} });

  // a couple of nice signature eases (premium feel)
  if (window.CustomEase) {
    try { CustomEase.create("smooth", "M0,0 C0.22,1 0.36,1 1,1"); } catch(e){}
    try { CustomEase.create("snap",   "M0,0 C0.34,1.56 0.28,1 1,1"); } catch(e){}
  }
  const EASE_OUT = window.CustomEase ? "smooth" : "power3.out";
  const EASE_POP = window.CustomEase ? "snap"   : "back.out(1.7)";

  const el = t => typeof t === "string" ? document.querySelector(t) : t;

  // split into chars/words/lines. Uses SplitText (with auto-mask) if available.
  function split(target, type, mask) {
    const node = el(target);
    if (window.SplitText) {
      return new SplitText(node, { type, mask: mask || false,
        linesClass: "tfx-line", wordsClass: "tfx-word", charsClass: "tfx-char" });
    }
    // fallback: wrap words/chars manually (no line detection)
    const txt = node.textContent; node.textContent = "";
    const out = { chars: [], words: [], lines: [] };
    txt.split(/(\s+)/).forEach(tok => {
      if (/^\s+$/.test(tok)) { node.appendChild(document.createTextNode(tok)); return; }
      const w = document.createElement("span"); w.className = "tfx-word"; w.style.display = "inline-block";
      [...tok].forEach(ch => {
        const c = document.createElement("span"); c.className = "tfx-char";
        c.style.display = "inline-block"; c.textContent = ch; w.appendChild(c); out.chars.push(c);
      });
      node.appendChild(w); out.words.push(w);
    });
    return out;
  }

  const TypeFX = {
    EASE_OUT, EASE_POP, split,

    /* characters rise out of a baseline mask, staggered — the premium default */
    charCascade(tl, target, o = {}) {
      const s = split(target, "chars", "chars");
      tl.from(s.chars, { yPercent: 120, opacity: 0, duration: o.dur || 0.5,
        ease: o.ease || EASE_OUT, stagger: o.stagger ?? 0.022 }, o.at ?? 0);
      return tl;
    },

    /* words pop in with scale + blur spring */
    wordPop(tl, target, o = {}) {
      const s = split(target, "words");
      tl.from(s.words, { scale: 0.4, opacity: 0, filter: "blur(8px)",
        transformOrigin: "50% 100%", duration: o.dur || 0.55,
        ease: o.ease || EASE_POP, stagger: o.stagger ?? 0.07 }, o.at ?? 0);
      return tl;
    },

    /* whole lines wipe up behind a mask (cleanest for headlines) */
    maskReveal(tl, target, o = {}) {
      const s = split(target, "lines", "lines");
      tl.from(s.lines, { yPercent: 110, duration: o.dur || 0.7,
        ease: o.ease || EASE_OUT, stagger: o.stagger ?? 0.12 }, o.at ?? 0);
      return tl;
    },

    /* lines slide in from the side behind a mask */
    lineSlide(tl, target, o = {}) {
      const s = split(target, "lines", "lines");
      tl.from(s.lines, { xPercent: (o.dir ?? -1) * 60, opacity: 0, duration: o.dur || 0.6,
        ease: o.ease || EASE_OUT, stagger: o.stagger ?? 0.1 }, o.at ?? 0);
      return tl;
    },

    /* variable-font weight morph: thin -> bold (needs a variable font, e.g. Roboto Flex) */
    weightMorph(tl, target, o = {}) {
      const node = el(target), p = { w: o.from ?? 100 };
      node.style.fontVariationSettings = `'wght' ${p.w}`;
      tl.to(p, { w: o.to ?? 800, duration: o.dur || 0.9, ease: o.ease || EASE_OUT,
        onUpdate: () => node.style.fontVariationSettings = `'wght' ${Math.round(p.w)}` }, o.at ?? 0);
      return tl;
    },

    /* scramble/decode into the final text (needs ScrambleTextPlugin) */
    scrambleIn(tl, target, o = {}) {
      const node = el(target), text = o.text || node.textContent;
      if (!window.ScrambleTextPlugin) { return TypeFX.charCascade(tl, target, o); }
      tl.from(node, { duration: o.dur || 1.0, ease: "none",
        scrambleText: { text, chars: o.chars || "upperAndLowerCase", speed: o.speed ?? 0.6, revealDelay: 0.15 } }, o.at ?? 0);
      return tl;
    },

    /* animated number count-up. opts: {to, from, prefix, suffix, dur, decimals, commas} */
    counter(tl, target, o = {}) {
      const node = el(target), p = { v: o.from ?? 0 }, d = o.decimals ?? 0;
      tl.to(p, { v: o.to ?? 100, duration: o.dur || 1.4, ease: o.ease || "power2.out",
        onUpdate: () => {
          let n = d ? p.v.toFixed(d) : Math.round(p.v);
          if (o.commas) n = Number(n).toLocaleString();
          node.textContent = (o.prefix || "") + n + (o.suffix || "");
        } }, o.at ?? 0);
      return tl;
    },

    /* draw an SVG underline/stroke under a heading (needs DrawSVGPlugin); pass the <path>/<line> selector */
    drawStroke(tl, target, o = {}) {
      if (!window.DrawSVGPlugin) { tl.from(el(target), { scaleX: 0, transformOrigin: "0 50%",
        duration: o.dur || 0.5, ease: EASE_OUT }, o.at ?? 0); return tl; }
      tl.fromTo(el(target), { drawSVG: "0%" }, { drawSVG: "100%",
        duration: o.dur || 0.6, ease: o.ease || EASE_OUT }, o.at ?? 0);
      return tl;
    },

    /* combo hero: cascade in + subtle settle — good for the one big title */
    hero(tl, target, o = {}) {
      const s = split(target, "chars", "chars");
      tl.from(s.chars, { yPercent: 130, opacity: 0, rotationX: -40, transformOrigin: "50% 100%",
        duration: o.dur || 0.6, ease: EASE_POP, stagger: o.stagger ?? 0.03 }, o.at ?? 0);
      tl.to(el(target), { letterSpacing: o.settle ?? "-0.01em", duration: 0.8, ease: "sine.out" }, (o.at ?? 0) + 0.2);
      return tl;
    }
  };

  window.TypeFX = TypeFX;
})();
