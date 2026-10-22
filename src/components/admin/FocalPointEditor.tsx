"use client";

import React, { useRef } from "react";
import { FocalPoint } from "@/lib/cms/types";

interface FocalPointEditorProps {
  imageUrl: string;
  imageAlt?: string;
  focalPoint: FocalPoint;
  onChangeFocalPoint: (fp: FocalPoint) => void;
  onChangeImageUrl?: (url: string) => void;
  onOpenMediaPicker?: () => void;
  label?: string;
}

export function FocalPointEditor({
  imageUrl,
  imageAlt = "معاينة الصورة",
  focalPoint,
  onChangeFocalPoint,
  onChangeImageUrl,
  onOpenMediaPicker,
  label = "الصورة ونقطة التركيز البصري (Focal Point)",
}: FocalPointEditorProps) {
  const boxRef = useRef<HTMLDivElement | null>(null);

  const handleBoxClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    onChangeFocalPoint({
      x: Math.min(100, Math.max(0, Math.round(rawX))),
      y: Math.min(100, Math.max(0, Math.round(rawY))),
    });
  };

  return (
    <div className="cms-field cms-field--full">
      <div className="cms-label">
        <span>{label}</span>
        <span className="cms-hint">
          انقري على الصورة لتحديد مركز التركيز البصري ({focalPoint.x}% ×{" "}
          {focalPoint.y}%)
        </span>
      </div>

      <div className="cms-focal-picker-grid">
        <div
          ref={boxRef}
          className="cms-focal-preview-box"
          onClick={handleBoxClick}
          title="انقري لتغيير نقطة التركيز البصري"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              className="cms-focal-preview-img"
              style={{
                objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
              }}
            />
          ) : (
            <div
              style={{
                padding: "2rem 1rem",
                textAlign: "center",
                fontSize: "0.84rem",
                color: "var(--cms-ink-muted)",
              }}
            >
              لم يتم اختيار صورة
            </div>
          )}
          <span
            className="cms-focal-pin"
            style={{
              left: `${focalPoint.x}%`,
              top: `${focalPoint.y}%`,
            }}
            aria-hidden="true"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {onChangeImageUrl && (
            <div className="cms-field">
              <label className="cms-label">
                <span>مسار الصورة المختارة</span>
                {onOpenMediaPicker && (
                  <button
                    type="button"
                    className="cms-btn cms-btn--sm cms-btn--primary"
                    onClick={onOpenMediaPicker}
                  >
                    اختيار من مكتبة الوسائط
                  </button>
                )}
              </label>
              <input
                type="text"
                dir="ltr"
                className="cms-input"
                value={imageUrl}
                onChange={(e) => onChangeImageUrl(e.target.value)}
              />
            </div>
          )}

          <div className="cms-form-grid">
            <div className="cms-field">
              <label className="cms-label">
                <span>التركيز الأفقي (X: {focalPoint.x}%)</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={focalPoint.x}
                onChange={(e) =>
                  onChangeFocalPoint({
                    x: Number(e.target.value),
                    y: focalPoint.y,
                  })
                }
              />
            </div>

            <div className="cms-field">
              <label className="cms-label">
                <span>التركيز الرأسي (Y: {focalPoint.y}%)</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={focalPoint.y}
                onChange={(e) =>
                  onChangeFocalPoint({
                    x: focalPoint.x,
                    y: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
