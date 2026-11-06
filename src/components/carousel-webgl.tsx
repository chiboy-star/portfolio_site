"use client";

import * as React from "react";
import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture } from "ogl";
import { Project } from "@/lib/types";

interface CarouselWebGLProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export function CarouselWebGL({
  projects,
  onSelectProject,
  activeIndex,
  setActiveIndex,
}: CarouselWebGLProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Continuous motion state
  const targetRef = React.useRef(0);
  const posRef = React.useRef(0);
  const velocityRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);
  const dragStartXRef = React.useRef(0);
  const lastDragTimeRef = React.useRef(0);
  const lastDragXRef = React.useRef(0);
  const settleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = React.useRef<number | null>(null);
  const isVisibleRef = React.useRef(true);
  const overlayContainerRef = React.useRef<HTMLDivElement | null>(null);
  const activeIndexRef = React.useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  // Update target when activeIndex changes externally
  React.useEffect(() => {
    targetRef.current = activeIndex;
  }, [activeIndex]);

  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || projects.length === 0) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch (e) {
      console.warn("[Carousel WebGL] WebGL initialization failed:", e);
      return;
    }

    const gl = renderer.gl;
    const scene = new Transform();
    const camera = new Camera(gl, { fov: 35 });
    camera.position.z = 5;

    let cardWidth = 0;
    let cardHeight = 0;
    let cardSpacing = 0;

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.perspective({ aspect: width / height });

      // In camera space:
      const vFov = (camera.fov * Math.PI) / 180;
      const visibleHeight = 2 * Math.tan(vFov / 2) * camera.position.z;

      // Card height ~55vh in camera units, 4:3 aspect
      cardHeight = visibleHeight * 0.58;
      cardWidth = cardHeight * (4 / 3);
      cardSpacing = cardWidth * 1.14;
    };
    resize();

    // Shaders
    const vertexShader = `
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform float uBend;
      uniform float uRadius;
      uniform float uVelocity;
      varying vec2 vUv;
      varying float vDist;

      void main() {
        vUv = uv;
        vec4 pos = modelViewMatrix * vec4(position, 1.0);

        float x = pos.x;
        // Concave cylinder curve: bend backward with x^2
        float curvedZ = -pow(abs(x / uRadius), 2.0) * uBend;
        pos.z += curvedZ;

        // Slight velocity stretch
        pos.y += (x / uRadius) * uVelocity * 0.08;

        vDist = abs(x / uRadius);
        gl_Position = projectionMatrix * pos;
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform sampler2D tMap;
      uniform float uOpacity;
      uniform float uRadiusCard;
      uniform vec2 uResolution;
      varying vec2 vUv;
      varying float vDist;

      float roundedBoxSDF(vec2 p, vec2 b, float r) {
        vec2 d = abs(p) - b + vec2(r);
        return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
      }

      void main() {
        vec2 p = (vUv - 0.5) * uResolution;
        float d = roundedBoxSDF(p, uResolution * 0.5, uRadiusCard);
        float alpha = 1.0 - smoothstep(-0.01, 0.01, d);
        if (alpha < 0.01) discard;

        vec4 texColor = texture2D(tMap, vUv);

        // Dim & desaturate toward edges
        float dim = 1.0 - min(0.6, vDist * 0.4);
        float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 finalColor = mix(vec3(gray), texColor.rgb, max(0.45, 1.0 - vDist * 0.4)) * dim;

        gl_FragColor = vec4(finalColor, texColor.a * alpha * uOpacity);
      }
    `;

    // Plane geometry with 24 horizontal segments for smooth curvature
    const geometry = new Plane(gl, {
      width: 1,
      height: 1,
      widthSegments: 24,
      heightSegments: 1,
    });

    // Create a mesh for each project
    const meshes: Mesh[] = [];

    projects.forEach((project) => {
      // Create texture with clean intentional placeholder if URL is absent
      const texture = new Texture(gl, { generateMipmaps: false });
      const srcUrl = project.thumbnail?.url || "";

      // Fallback placeholder canvas: initials in Geist, flat --surface, hairline border
      const pCanvas = document.createElement("canvas");
      pCanvas.width = 640;
      pCanvas.height = 480;
      const pCtx = pCanvas.getContext("2d");
      if (pCtx) {
        const isDark = document.documentElement.classList.contains("dark");
        pCtx.fillStyle = isDark ? "#18181B" : "#F4F4F0";
        pCtx.fillRect(0, 0, 640, 480);
        pCtx.strokeStyle = isDark ? "#2E2E33" : "#DCDCD6";
        pCtx.lineWidth = 4;
        pCtx.strokeRect(4, 4, 632, 472);
        pCtx.fillStyle = isDark ? "#8D8D94" : "#5E5E66";
        pCtx.font = "bold 64px Geist, -apple-system, sans-serif";
        pCtx.textAlign = "center";
        pCtx.textBaseline = "middle";
        const initials = project.title
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 3)
          .toUpperCase();
        pCtx.fillText(initials, 320, 240);
        texture.image = pCanvas;
      }

      if (srcUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        if (srcUrl.startsWith("http")) {
          img.src = `/api/thumb?url=${encodeURIComponent(srcUrl)}`;
        } else {
          img.src = srcUrl;
        }

        img.onload = () => {
          texture.image = img;
        };
      }

      const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          tMap: { value: texture },
          uBend: { value: 0.95 },
          uRadius: { value: 3.5 },
          uVelocity: { value: 0 },
          uOpacity: { value: 1.0 },
          uRadiusCard: { value: 0.05 },
          uResolution: { value: [4 / 3, 1] },
        },
        transparent: true,
        cullFace: false,
      });

      const mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);
      meshes.push(mesh);
    });

    let lastTime = performance.now();

    const loop = (time: number) => {
      if (!isVisibleRef.current) {
        animFrameRef.current = null;
        return;
      }

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Frame-rate independent continuous easing: pos += (target - pos) * (1 - exp(-dt * 8))
      const diff = targetRef.current - posRef.current;
      const easeFactor = 1 - Math.exp(-dt * 8);
      posRef.current += diff * easeFactor;
      velocityRef.current = diff * easeFactor;

      const currentPos = posRef.current;
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;

      const overlayContainer = overlayContainerRef.current;
      const cardDomEls = overlayContainer
        ? Array.from(overlayContainer.querySelectorAll<HTMLElement>("[data-card-index]"))
        : [];

      meshes.forEach((mesh, index) => {
        const offset = index - currentPos;
        mesh.position.x = offset * cardSpacing;
        mesh.scale.set(cardWidth, cardHeight, 1);

        // Update uniforms
        mesh.program.uniforms.uVelocity.value = Math.max(-2, Math.min(2, velocityRef.current * 10));

        // Direct DOM update for accessibility targets (zero React per-frame rerenders)
        const el = cardDomEls[index];
        if (el) {
          const screenX = (containerW / 2) + (offset * cardSpacing * (containerH / 5) * 0.95);
          const screenY = containerH / 2;
          const dist = Math.abs(offset);
          const opacity = Math.max(0.1, 1 - dist * 0.35);
          const isCenter = dist < 0.5;

          el.style.transform = `translate3d(calc(${screenX}px - 50%), calc(${screenY}px - 50%), 0)`;
          el.style.opacity = `${opacity}`;
          el.style.pointerEvents = isCenter ? "auto" : "none";

          const numEl = el.querySelector<HTMLElement>("[data-card-number]");
          if (numEl) {
            numEl.className = isCenter ? "text-[var(--accent)] font-semibold" : "";
          }
        }
      });

      renderer.render({ scene, camera });

      // Check if settled
      const isSettled =
        Math.abs(diff) < 0.001 &&
        Math.abs(velocityRef.current) < 0.001 &&
        !isDraggingRef.current;

      if (!isSettled) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        animFrameRef.current = null;
        const rounded = Math.round(currentPos);
        const clamped = Math.max(0, Math.min(projects.length - 1, rounded));
        if (clamped !== activeIndexRef.current) {
          setActiveIndex(clamped);
        }
      }
    };

    const startLoop = () => {
      if (!animFrameRef.current) {
        lastTime = performance.now();
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    // Trigger loop on drag/wheel
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      dragStartXRef.current = e.clientX;
      lastDragXRef.current = e.clientX;
      lastDragTimeRef.current = performance.now();
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      startLoop();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - lastDragXRef.current;
      lastDragXRef.current = e.clientX;
      lastDragTimeRef.current = performance.now();

      // Card unit delta
      const unitDelta = -deltaX / (container.clientWidth * 0.35);
      targetRef.current = Math.max(-0.4, Math.min(projects.length - 0.6, targetRef.current + unitDelta));
      startLoop();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      // Fling inertia
      const dragDuration = performance.now() - lastDragTimeRef.current;
      if (dragDuration < 100) {
        const flingVel = -(e.clientX - dragStartXRef.current) / 800;
        targetRef.current = Math.max(-0.4, Math.min(projects.length - 0.6, targetRef.current + flingVel));
      }

      // Settle toward nearest integer card after 120ms
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(() => {
        targetRef.current = Math.max(0, Math.min(projects.length - 1, Math.round(targetRef.current)));
        startLoop();
      }, 120);

      startLoop();
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < 5 && Math.abs(e.deltaY) < 5) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const unitDelta = delta * 0.002;
      targetRef.current = Math.max(-0.4, Math.min(projects.length - 0.6, targetRef.current + unitDelta));

      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(() => {
        targetRef.current = Math.max(0, Math.min(projects.length - 1, Math.round(targetRef.current)));
        startLoop();
      }, 120);

      startLoop();
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        startLoop();
      } else if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    });
    observer.observe(container);

    const onWindowResize = () => {
      resize();
      startLoop();
    };
    window.addEventListener("resize", onWindowResize);

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    container.addEventListener("wheel", onWheel, { passive: false });

    startLoop();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onWindowResize);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("wheel", onWheel);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    };
  }, [projects, setActiveIndex]);

  return (
    <div
      ref={containerRef}
      className="relative h-[68vh] min-h-[460px] max-h-[640px] w-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

      {/* Faint Perspective Grid Floor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 left-0 right-0 h-28 opacity-15 [mask-image:linear-gradient(to_bottom,transparent,black)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          transform: "perspective(300px) rotateX(60deg)",
          transformOrigin: "bottom center",
        }}
      />

      {/* DOM Accessibility Overlays & Captions */}
      <div ref={overlayContainerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
        {projects.map((project, index) => {
          return (
            <div
              key={project.id}
              data-card-index={index}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "min(70vw, 480px)",
                height: "min(55vh, 360px)",
                willChange: "transform, opacity",
              }}
              className="flex flex-col justify-between"
            >
              {/* Clickable / Focusable hit target over the plane */}
              <button
                onClick={() => onSelectProject(project)}
                aria-label={`View ${project.title}`}
                className="w-full flex-1 rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
              />

              {/* Flat DOM Caption underneath card */}
              <div className="w-full text-center mt-2 pointer-events-none">
                <p className="caption-mono text-xs font-mono tracking-widest text-[var(--muted)]">
                  <span data-card-number={index}>0{index + 1}</span>{" "}
                  {" // "} <span className="text-[var(--fg)]">{project.title}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
