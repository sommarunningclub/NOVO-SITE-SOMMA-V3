"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { C } from "../data";

/**
 * Trilha 3D dos 21 dias.
 *
 * Os dias sobem numa hélice: os concluídos acendem em vermelho Michelob, os
 * pendentes ficam apagados, e a câmera acompanha o dia atual. A cena é
 * puramente decorativa e reflete o estado do simulador ao lado.
 *
 * Cuidados: pausa quando sai da tela, respeita prefers-reduced-motion e
 * descarta geometrias e materiais ao desmontar.
 */
export function JourneyScene({ day, total = 21 }: { day: number; total?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const dayRef = useRef(day);
  dayRef.current = day;

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // sem WebGL: o simulador continua funcionando sem a cena
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060b1c, 0.055);

    const camera = new THREE.PerspectiveCamera(38, el.clientWidth / el.clientHeight, 0.1, 100);

    const root = new THREE.Group();
    scene.add(root);

    // ── trilha helicoidal dos 21 dias ──────────────────────────────────────
    const R = 2.85;
    const RISE = 0.29;
    const pos = (i: number) => {
      const a = (i / total) * Math.PI * 3.2;
      return new THREE.Vector3(Math.cos(a) * R, i * RISE - (total * RISE) / 2, Math.sin(a) * R);
    };

    const nodeGeo = new THREE.IcosahedronGeometry(0.17, 1);
    const ringGeo = new THREE.TorusGeometry(0.3, 0.012, 8, 32);
    const doneMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.red) });
    const todoMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#2A3566") });
    const goldMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.gold) });

    const nodes: THREE.Mesh[] = [];
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < total; i++) {
      const p = pos(i);
      const m = new THREE.Mesh(nodeGeo, todoMat);
      m.position.copy(p);
      root.add(m);
      nodes.push(m);

      // marcos: 7, 14 e 21 ganham anel
      if (i === 6 || i === 13 || i === total - 1) {
        const r = new THREE.Mesh(ringGeo, goldMat);
        r.position.copy(p);
        r.lookAt(0, p.y, 0);
        root.add(r);
        rings.push(r);
      }
    }

    // ── fio ligando os dias ────────────────────────────────────────────────
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: total }, (_, i) => pos(i)));
    const tubeGeo = new THREE.TubeGeometry(curve, 220, 0.012, 6, false);
    const tubeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#25306B") });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    root.add(tube);

    // fio de progresso, desenhado por cima até o dia atual
    const progGeo = new THREE.TubeGeometry(curve, 220, 0.02, 6, false);
    const progMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.red) });
    const prog = new THREE.Mesh(progGeo, progMat);
    prog.geometry.setDrawRange(0, 0);
    root.add(prog);

    // ── partículas de fundo ────────────────────────────────────────────────
    const N = 220;
    const pts = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pts[i * 3] = (Math.random() - 0.5) * 22;
      pts[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pts[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0x8fa0d8, size: 0.035, transparent: true, opacity: 0.5 });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // ── loop ───────────────────────────────────────────────────────────────
    let raf = 0;
    let visible = true;
    let t = 0;
    let camY = 0;
    let spin = 0;

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 });
    io.observe(el);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;

      t += reduced ? 0 : 0.006;
      const d = dayRef.current;

      // acende os dias concluídos
      for (let i = 0; i < total; i++) {
        const on = i < d;
        nodes[i].material = on ? doneMat : todoMat;
        const target = on ? 1.25 : 0.85;
        nodes[i].scale.lerp(new THREE.Vector3(target, target, target), 0.08);
      }
      prog.geometry.setDrawRange(0, Math.floor((d / total) * progGeo.index!.count));

      // dia atual pulsa em dourado, para o olho achar onde a jornada está
      if (d > 0 && d <= total) {
        const atual = nodes[d - 1];
        atual.material = goldMat;
        const s = 1.5 + Math.sin(t * 6) * 0.18;
        atual.scale.set(s, s, s);
      }

      // A câmera acompanha o dia atual só parcialmente: olhando direto para
      // ele, o resto da trilha saía do quadro.
      const targetY = pos(Math.max(0, d - 1)).y * 0.32;
      camY += (targetY - camY) * 0.05;
      spin += reduced ? 0 : 0.0016;
      camera.position.set(Math.cos(spin) * 8.6, camY + 1.1, Math.sin(spin) * 8.6);
      camera.lookAt(0, camY * 0.5, 0);

      root.rotation.y = Math.sin(t * 0.4) * 0.05;
      dust.rotation.y = t * 0.06;

      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      if (!el.clientWidth || !el.clientHeight) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      [nodeGeo, ringGeo, tubeGeo, progGeo, dustGeo].forEach((g) => g.dispose());
      [doneMat, todoMat, goldMat, tubeMat, progMat, dustMat].forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [total]);

  return <div ref={host} className="absolute inset-0" aria-hidden />;
}
