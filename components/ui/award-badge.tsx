"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";

interface QualitySealProps {
  eyebrow?: string;
  title: string;
  link?: string;
  place?: number;
}

const identityMatrix = "1, 0, 0, 0, " + "0, 1, 0, 0, " + "0, 0, 1, 0, " + "0, 0, 0, 1";

const maxRotate = 0.25;
const minRotate = -0.25;
const maxScale = 1;
const minScale = 0.97;

// Tons dourados do selo (premium).
const backgroundColor = ["#f3e3ac", "#f1cfa6", "#e9c98f"];

type Timer = ReturnType<typeof setTimeout>;

export const QualitySeal = ({ eyebrow = "SOMMA CLUB", title, link, place }: QualitySealProps) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const [firstOverlayPosition, setFirstOverlayPosition] = useState<number>(0);
  const [matrix, setMatrix] = useState<string>(identityMatrix);
  const [currentMatrix, setCurrentMatrix] = useState<string>(identityMatrix);
  const [disableInOutOverlayAnimation, setDisableInOutOverlayAnimation] = useState<boolean>(true);
  const [disableOverlayAnimation, setDisableOverlayAnimation] = useState<boolean>(false);
  const [isTimeoutFinished, setIsTimeoutFinished] = useState<boolean>(false);
  const enterTimeout = useRef<Timer | null>(null);
  const leaveTimeout1 = useRef<Timer | null>(null);
  const leaveTimeout2 = useRef<Timer | null>(null);
  const leaveTimeout3 = useRef<Timer | null>(null);

  const getDimensions = () => {
    const left = ref?.current?.getBoundingClientRect()?.left || 0;
    const right = ref?.current?.getBoundingClientRect()?.right || 0;
    const top = ref?.current?.getBoundingClientRect()?.top || 0;
    const bottom = ref?.current?.getBoundingClientRect()?.bottom || 0;
    return { left, right, top, bottom };
  };

  const getMatrix = (clientX: number, clientY: number) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    const scale = [
      maxScale - ((maxScale - minScale) * Math.abs(xCenter - clientX)) / (xCenter - left),
      maxScale - ((maxScale - minScale) * Math.abs(yCenter - clientY)) / (yCenter - top),
      maxScale -
        ((maxScale - minScale) * (Math.abs(xCenter - clientX) + Math.abs(yCenter - clientY))) /
          (xCenter - left + yCenter - top),
    ];

    const rotate = {
      x1: 0.25 * ((yCenter - clientY) / yCenter - (xCenter - clientX) / xCenter),
      x2: maxRotate - ((maxRotate - minRotate) * Math.abs(right - clientX)) / (right - left),
      x3: 0,
      y0: 0,
      y2: maxRotate - ((maxRotate - minRotate) * (top - clientY)) / (top - bottom),
      y3: 0,
      z0: -(maxRotate - ((maxRotate - minRotate) * Math.abs(right - clientX)) / (right - left)),
      z1: 0.2 - ((0.2 + 0.6) * (top - clientY)) / (top - bottom),
      z3: 0,
    };
    return (
      `${scale[0]}, ${rotate.y0}, ${rotate.z0}, 0, ` +
      `${rotate.x1}, ${scale[1]}, ${rotate.z1}, 0, ` +
      `${rotate.x2}, ${rotate.y2}, ${scale[2]}, 0, ` +
      `${rotate.x3}, ${rotate.y3}, ${rotate.z3}, 1`
    );
  };

  const getOppositeMatrix = (_matrix: string, clientY: number, onMouseEnter?: boolean) => {
    const { top, bottom } = getDimensions();
    const oppositeY = bottom - clientY + top;
    const weakening = onMouseEnter ? 0.7 : 4;
    const multiplier = onMouseEnter ? -1 : 1;

    return _matrix
      .split(", ")
      .map((item, index) => {
        if (index === 2 || index === 4 || index === 8) {
          return String((-parseFloat(item) * multiplier) / weakening);
        } else if (index === 0 || index === 5 || index === 10) {
          return "1";
        } else if (index === 6) {
          return String((multiplier * (maxRotate - ((maxRotate - minRotate) * (top - oppositeY)) / (top - bottom))) / weakening);
        } else if (index === 9) {
          return String((maxRotate - ((maxRotate - minRotate) * (top - oppositeY)) / (top - bottom)) / weakening);
        }
        return item;
      })
      .join(", ");
  };

  const onMouseEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    if (leaveTimeout1.current) clearTimeout(leaveTimeout1.current);
    if (leaveTimeout2.current) clearTimeout(leaveTimeout2.current);
    if (leaveTimeout3.current) clearTimeout(leaveTimeout3.current);
    setDisableOverlayAnimation(true);

    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    setDisableInOutOverlayAnimation(false);
    enterTimeout.current = setTimeout(() => setDisableInOutOverlayAnimation(true), 350);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFirstOverlayPosition((Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5);
      });
    });

    const m = getMatrix(e.clientX, e.clientY);
    const oppositeMatrix = getOppositeMatrix(m, e.clientY, true);

    setMatrix(oppositeMatrix);
    setIsTimeoutFinished(false);
    setTimeout(() => setIsTimeoutFinished(true), 200);
  };

  const onMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    setTimeout(() => setFirstOverlayPosition((Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5), 150);

    if (isTimeoutFinished) {
      setCurrentMatrix(getMatrix(e.clientX, e.clientY));
    }
  };

  const onMouseLeave = (e: MouseEvent<HTMLAnchorElement>) => {
    const oppositeMatrix = getOppositeMatrix(matrix, e.clientY);
    if (enterTimeout.current) clearTimeout(enterTimeout.current);

    setCurrentMatrix(oppositeMatrix);
    setTimeout(() => setCurrentMatrix(identityMatrix), 200);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDisableInOutOverlayAnimation(false);
        leaveTimeout1.current = setTimeout(() => setFirstOverlayPosition(-firstOverlayPosition / 4), 150);
        leaveTimeout2.current = setTimeout(() => setFirstOverlayPosition(0), 300);
        leaveTimeout3.current = setTimeout(() => {
          setDisableOverlayAnimation(false);
          setDisableInOutOverlayAnimation(true);
        }, 500);
      });
    });
  };

  useEffect(() => {
    if (isTimeoutFinished) setMatrix(currentMatrix);
  }, [currentMatrix, isTimeoutFinished]);

  const overlayAnimations = [...Array(10).keys()]
    .map(
      (e) => `
    @keyframes overlayAnimation${e + 1} {
      0% { transform: rotate(${e * 10}deg); }
      50% { transform: rotate(${(e + 1) * 10}deg); }
      100% { transform: rotate(${e * 10}deg); }
    }`
    )
    .join(" ");

  return (
    <a
      ref={ref}
      href={link ?? "#"}
      {...(link ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label={`${eyebrow} — ${title}`}
      className="block h-auto w-[200px] cursor-pointer sm:w-[260px]"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
    >
      <style>{overlayAnimations}</style>
      <div
        style={{
          transform: `perspective(700px) matrix3d(${matrix})`,
          transformOrigin: "center center",
          transition: "transform 200ms ease-out",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 54" className="h-auto w-full">
          <defs>
            <filter id="seal-blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
            <mask id="sealMask">
              <rect width="260" height="54" fill="white" rx="10" />
            </mask>
          </defs>
          <rect width="260" height="54" rx="10" fill={backgroundColor[(place || 1) - 1] || backgroundColor[0]} />
          <rect x="4" y="4" width="252" height="46" rx="8" fill="transparent" stroke="#c9b06a" strokeWidth="1" />
          <text fontFamily="Helvetica-Bold, Helvetica" fontSize="9" fontWeight="bold" fill="#7a5a1e" x="53" y="20">
            {eyebrow}
          </text>
          <text fontFamily="Helvetica-Bold, Helvetica" fontSize="15" fontWeight="bold" fill="#5a4416" x="52" y="40">
            {title}
          </text>
          {/* Medalha / estrela do selo */}
          <g transform="translate(11, 9)">
            <circle cx="17" cy="17" r="16" fill="#5a4416" />
            <polygon
              fill="#f3e3ac"
              points="17,5 20.5,13 29,13.5 22.5,19 24.8,27 17,22.5 9.2,27 11.5,19 5,13.5 13.5,13"
            />
          </g>
          <g style={{ mixBlendMode: "overlay" }} mask="url(#sealMask)">
            {[
              "hsl(358, 100%, 62%)",
              "hsl(30, 100%, 50%)",
              "hsl(60, 100%, 50%)",
              "hsl(96, 100%, 50%)",
              "hsl(233, 85%, 47%)",
              "hsl(271, 85%, 47%)",
              "hsl(300, 20%, 35%)",
              "transparent",
              "transparent",
              "white",
            ].map((fill, i) => (
              <g
                key={i}
                style={{
                  transform: `rotate(${firstOverlayPosition + i * 10}deg)`,
                  transformOrigin: "center center",
                  transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
                  animation: disableOverlayAnimation ? "none" : `overlayAnimation${i + 1} 5s infinite`,
                  willChange: "transform",
                }}
              >
                <polygon points="0,0 260,54 260,0 0,54" fill={fill} filter="url(#seal-blur)" opacity="0.5" />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </a>
  );
};
