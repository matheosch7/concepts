/* Motion — reusable cinematic camera + transition helpers for GSAP / HyperFrames.
   The headline feature is cameraTrack(): the "one coherent motion" continuous
   camera track through a wide world (proven in claude-flow / THE FLOW). */
(function () {
  const G = window.gsap;
  if (!G) { console.warn("Motion: gsap not found"); return; }
  const el = t => typeof t === "string" ? document.querySelector(t) : t;

  const Motion = {
    /* ONE COHERENT MOTION.
       Build a wide #world (e.g. N*1920 px) laid out left->right, plus an optional
       parallax bg. Returns { go, cam, drift, apply }.
         go(toX, at, dur)  -> ease the camera to world-x toX, arriving for a dwell.
       Punchy push (power2.inOut) between stations; content should animate during the dwell.
       opts: { world, bg, parallax=0.42, bob=9, drift=14, duration }  */
    cameraTrack(tl, opts) {
      const world = el(opts.world), bg = opts.bg ? el(opts.bg) : null;
      const cam = { c: 0 }, drift = { d: 0 };
      const px = opts.parallax ?? 0.42, bobA = opts.bob ?? 9;
      const vertical = opts.axis === 'y';                  // 'y' = scroll down, default 'x' = track right
      const apply = () => {
        const m = cam.c + drift.d, bob = Math.sin(m / 620) * bobA;
        const wx = vertical ? bob : -m, wy = vertical ? -m : bob;
        world.style.transform = `translate3d(${wx}px, ${wy}px, 0)`;
        if (bg) {
          const bx = vertical ? bob * 0.5 : -m * px, by = vertical ? -m * px : bob * 0.5;
          bg.style.transform = `translate3d(${bx}px, ${by}px, 0)`;
        }
      };
      apply();
      // constant micro-drift on its own proxy so dwells never fully freeze (no tween conflict)
      if ((opts.drift ?? 14) !== 0)
        tl.to(drift, { d: opts.drift ?? 14, duration: opts.duration || 30, ease: "none", onUpdate: apply }, 0);
      const go = (toX, at, dur) =>
        tl.to(cam, { c: toX, duration: dur, ease: opts.ease || "power2.inOut", onUpdate: apply }, at);
      return { go, cam, drift, apply };
    },

    /* slow continuous push-in on an element (premium "always alive" feel) */
    pushIn(tl, target, o = {}) {
      tl.fromTo(el(target), { scale: o.from ?? 1.0 }, { scale: o.to ?? 1.08,
        duration: o.dur || 4.5, ease: o.ease || "sine.inOut" }, o.at ?? 0);
      return tl;
    },

    /* whip-pan a scene out (pair render-time motion blur for the smear) */
    whipOut(tl, target, o = {}) {
      tl.to(el(target), { xPercent: (o.dir ?? -1) * (o.dist ?? 74), filter: "blur(22px)", opacity: 0,
        duration: o.dur || 0.24, ease: "power3.in" }, o.at ?? 0);
      return tl;
    },
    whipIn(tl, target, o = {}) {
      tl.fromTo(el(target), { xPercent: (o.dir ?? 1) * (o.dist ?? 74), filter: "blur(22px)", opacity: 0 },
        { xPercent: 0, filter: "blur(0px)", opacity: 1, duration: o.dur || 0.3, ease: "power3.out" }, o.at ?? 0);
      return tl;
    },

    /* infinite-zoom / portal: dive INTO an element so it becomes the next scene */
    diveInto(tl, target, o = {}) {
      tl.to(el(target), { scale: o.scale ?? 9, opacity: 0, transformOrigin: o.origin || "50% 50%",
        duration: o.dur || 0.7, ease: o.ease || "power3.in" }, o.at ?? 0);
      return tl;
    },

    /* a flowing pipeline line + traveling packets across a wide world.
       Pass selectors for the dashed-gradient line (#flow) and an array of packet selectors.
       opts: { worldW, dur, packetStagger } */
    flowPipe(tl, flowSel, packets, o = {}) {
      const dur = o.dur || 30;
      tl.to(el(flowSel), { backgroundPositionX: (o.shift ?? -920) + "px", duration: dur, ease: "none" }, 0);
      (packets || []).forEach((p, i) => {
        const off = i * (o.packetStagger ?? 2.7);
        tl.fromTo(p, { x: -60, opacity: 0 }, { opacity: 1, duration: 0.4, ease: "none" }, off);
        tl.to(p, { x: o.worldW ?? 13320, duration: o.travel ?? 11, ease: "none", repeat: o.repeat ?? 2 }, off);
      });
      return tl;
    },

    /* rack-focus style: blur everything except the hero for a beat */
    rackFocus(tl, blurTargets, o = {}) {
      tl.to(blurTargets, { filter: "blur(6px)", opacity: 0.5, duration: o.dur || 0.4, ease: "sine.out" }, o.at ?? 0);
      return tl;
    }
  };

  window.Motion = Motion;
})();
