/* motion-kit/typefx/springs.js — closed-form spring/physics core (CRAFT_KNOWLEDGE/12 §1, verified).
   Everything evaluates at arbitrary t (no integration, no state) — the HyperFrames contract.
   Exposed on window.Springs (plain script) AND as ESM-ish globals for module use via window. */
(function () {
  /* exact damped-harmonic closed forms (ryanjuckett.com-verified), all regimes, position+velocity */
  function springFns({ target = 1, x0 = -1, v0 = 0, omega = 12, zeta = 0.8 }) {
    if (zeta < 1) {
      const a = omega * Math.sqrt(1 - zeta * zeta), c1 = x0, c2 = (v0 + zeta * omega * x0) / a;
      return {
        pos: t => t <= 0 ? target + x0 : target + Math.exp(-zeta * omega * t) * (c1 * Math.cos(a * t) + c2 * Math.sin(a * t)),
        vel: t => { if (t <= 0) return v0; const E = Math.exp(-zeta * omega * t);
          return -E * ((c1 * zeta * omega - c2 * a) * Math.cos(a * t) + (c1 * a + c2 * zeta * omega) * Math.sin(a * t)); },
      };
    } else if (zeta === 1) {
      return {
        pos: t => t <= 0 ? target + x0 : target + ((v0 + omega * x0) * t + x0) * Math.exp(-omega * t),
        vel: t => t <= 0 ? v0 : (v0 - (v0 + x0 * omega) * omega * t) * Math.exp(-omega * t),
      };
    }
    const z1 = -zeta * omega - omega * Math.sqrt(zeta * zeta - 1);
    const z2 = -zeta * omega + omega * Math.sqrt(zeta * zeta - 1);
    const c1 = (v0 - x0 * z2) / (z1 - z2), c2 = x0 - c1;
    return {
      pos: t => t <= 0 ? target + x0 : target + c1 * Math.exp(z1 * t) + c2 * Math.exp(z2 * t),
      vel: t => t <= 0 ? v0 : c1 * z1 * Math.exp(z1 * t) + c2 * z2 * Math.exp(z2 * t),
    };
  }

  /* Apple duration+bounce parametrization (CORRECTED WWDC23 math — kvin.me / thread 739811).
     duration = perceptual period (NOT settling time); bounce ∈ (−1, 1]; mass 1. */
  function fromDurationBounce(dur, bounce) {
    const stiffness = Math.pow(2 * Math.PI / dur, 2);
    const damping = bounce >= 0 ? (1 - bounce) * 4 * Math.PI / dur
                                : 4 * Math.PI / (dur * (1 + bounce));
    return { omega: Math.sqrt(stiffness), zeta: damping / (2 * Math.sqrt(stiffness)) };
  }

  /* spring01(t, dur, bounce) — normalized 0→1 spring, the everyday workhorse */
  function spring01(dur = 0.5, bounce = 0.25) {
    const { omega, zeta } = fromDurationBounce(dur, bounce);
    const f = springFns({ target: 1, x0: -1, v0: 0, omega, zeta });
    return f.pos;
  }

  /* the session-proven "Apple snappy" (≈4% overshoot, 0.30s settle) */
  const SPG = u => u <= 0 ? 0 : 1 - Math.exp(-12.5 * u) * (Math.cos(12.2 * u) + (12.5 / 12.2) * Math.sin(12.2 * u));

  /* Rosetta: react-spring/RN/UIKit params → (omega, zeta). Mine numbers, never integrators. */
  const toPhysics = ({ tension, friction, mass = 1 }) =>
    ({ omega: Math.sqrt(tension / mass), zeta: friction / (2 * Math.sqrt(tension * mass)) });
  const PRESETS = {   /* react-spring verified presets */
    default:  toPhysics({ tension: 170, friction: 26 }),
    gentle:   toPhysics({ tension: 120, friction: 14 }),
    wobbly:   toPhysics({ tension: 180, friction: 12 }),
    stiff:    toPhysics({ tension: 210, friction: 20 }),
    slow:     toPhysics({ tension: 280, friction: 60 }),
    molasses: toPhysics({ tension: 280, friction: 120 }),
  };

  /* C¹ retargeting chain: segments = [{t0, target, dur, bounce, from?}] sorted by t0.
     Each segment inherits the previous segment's ANALYTIC position+velocity — one organism. */
  function chain(segments) {
    const built = [];
    let x = (segments[0].from ?? 0), v = 0;
    segments.forEach((s, idx) => {
      const { omega, zeta } = fromDurationBounce(s.dur, s.bounce ?? 0.2);
      const f = springFns({ target: s.target, x0: x - s.target, v0: v, omega, zeta });
      built.push({ t0: s.t0, f });
      const nxt = segments[idx + 1];
      if (nxt) { x = f.pos(nxt.t0 - s.t0); v = f.vel(nxt.t0 - s.t0); }
    });
    return t => {
      let seg = built[0];
      for (let i = built.length - 1; i >= 0; i--) if (t >= built[i].t0) { seg = built[i]; break; }
      return seg.f.pos(Math.max(0, t - seg.t0));
    };
  }

  /* WWDC18 momentum projection: where does a flick land? (decelerationRate ~0.998 normal/0.99 fast) */
  const project = (velocity, rate = 0.998) => (velocity / 1000) * rate / (1 - rate);

  /* deterministic stagger helpers */
  const hash01 = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const stagger = {
    fromCenter: (i, n, each = 0.04) => Math.abs(i - (n - 1) / 2) * each,
    fromEdges:  (i, n, each = 0.04) => ((n - 1) / 2 - Math.abs(i - (n - 1) / 2)) * each,
    seeded:     (i, n, amount = 0.3, seed = 1) => hash01(i * 7.13 + seed * 91.7) * amount,
    byDistance: (x, y, cx, cy, perUnit = 0.002) => Math.hypot(x - cx, y - cy) * perUnit,
  };

  window.Springs = { springFns, fromDurationBounce, spring01, SPG, PRESETS, toPhysics, chain, project, stagger, hash01 };
})();
