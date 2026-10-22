"use client";

import React from "react";
import { Locale } from "@/lib/locales";
import {
  calculateBlocksReadingTime,
  sanitizeRichTextInline,
} from "@/lib/cms/sanitize";
import { RichTextBlock, RichTextBlockType } from "@/lib/cms/types";

interface RichTextBlocksEditorProps {
  locale: Locale;
  blocks: RichTextBlock[];
  onChange: (nextBlocks: RichTextBlock[]) => void;
  onPickBlockImage: (blockIndex: number) => void;
}

const BLOCK_TYPE_LABELS: Record<RichTextBlockType, string> = {
  heading: "عنوان قسم",
  paragraph: "فقرة نصية",
  "bullet-list": "قائمة نقطية",
  "ordered-list": "قائمة مرقمة",
  image: "صورة توضيحية",
  callout: "ملاحظة إرشادية بارزة",
};

export function RichTextBlocksEditor({
  locale,
  blocks,
  onChange,
  onPickBlockImage,
}: RichTextBlocksEditorProps) {
  const readingStats = calculateBlocksReadingTime(blocks);
  const inputDir = locale === "ar" ? "rtl" : "ltr";

  const updateBlock = (idx: number, patch: Partial<RichTextBlock>) => {
    const next = blocks.map((b, i) => (i === idx ? { ...b, ...patch } : b));
    onChange(next);
  };

  const moveBlock = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [removed] = next.splice(idx, 1);
    next.splice(target, 0, removed);
    onChange(next);
  };

  const removeBlock = (idx: number) => {
    onChange(blocks.filter((_, i) => i !== idx));
  };

  const addBlock = (type: RichTextBlockType) => {
    const newId = `section-${Date.now()}-${blocks.length + 1}`;
    let newBlock: RichTextBlock;
    if (type === "heading") {
      newBlock = {
        id: newId,
        type: "heading",
        headingLevel: 2,
        text: locale === "ar" ? "عنوان قسم جديد" : "New Section Heading",
      };
    } else if (type === "bullet-list" || type === "ordered-list") {
      newBlock = {
        id: newId,
        type,
        items: [locale === "ar" ? "نقطة توضيحية أولى" : "First list item"],
      };
    } else if (type === "image") {
      newBlock = {
        id: newId,
        type: "image",
        imageUrl: "/images/generated/article-consultation-prep.jpg",
        imageAlt: locale === "ar" ? "صورة توضيحية" : "Editorial illustration",
        imageCaption: "",
      };
    } else if (type === "callout") {
      newBlock = {
        id: newId,
        type: "callout",
        text:
          locale === "ar"
            ? "ملاحظة إرشادية مهمة للمراجِعة."
            : "Important guidance note for the visitor.",
      };
    } else {
      newBlock = {
        id: newId,
        type: "paragraph",
        text:
          locale === "ar"
            ? "اكتبي نص الفقرة هنا..."
            : "Write paragraph text here...",
      };
    }
    onChange([...blocks, newBlock]);
  };

  const appendInlineFormat = (
    idx: number,
    format: "bold" | "italic" | "link"
  ) => {
    const current = blocks[idx]?.text || "";
    if (format === "bold") {
      updateBlock(idx, {
        text: `${current} <strong>${
          locale === "ar" ? "نص مهم" : "bold text"
        }</strong>`.trim(),
      });
    } else if (format === "italic") {
      updateBlock(idx, {
        text: `${current} <em>${
          locale === "ar" ? "نص مميز" : "emphasized text"
        }</em>`.trim(),
      });
    } else if (format === "link") {
      updateBlock(idx, {
        text: `${current} <a href="/${locale}/contact">${
          locale === "ar" ? "طلب تنسيق استشارة" : "Coordinate a consultation"
        }</a>`.trim(),
      });
    }
  };

  return (
    <div className="cms-field cms-field--full">
      <div className="cms-card-header">
        <div>
          <h4 className="cms-card-title">
            محتوى المقال المنسق ({locale === "ar" ? "العربية" : "English"})
          </h4>
          <p className="cms-card-desc">
            أضيفي العناوين والفقرات والقوائم والروابط والصور بترتيب واضح وآمن.
          </p>
        </div>

        <div className="cms-badge cms-badge--published">
          <span>الوقت المقدر للقراءة تلقائيًا:</span>
          <strong>
            {locale === "ar" ? readingStats.labelAr : readingStats.labelEn}
          </strong>
        </div>
      </div>

      <div className="cms-blocks-stack">
        {blocks.map((block, idx) => (
          <div key={`${block.id}-${idx}`} className="cms-block-item">
            <div className="cms-block-toolbar">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="cms-badge cms-badge--draft">
                  {idx + 1} · {BLOCK_TYPE_LABELS[block.type]}
                </span>

                {block.type === "heading" && (
                  <select
                    className="cms-select"
                    style={{ width: "auto", minHeight: "32px", padding: "0.2rem 0.5rem" }}
                    value={block.headingLevel || 2}
                    onChange={(e) =>
                      updateBlock(idx, {
                        headingLevel: Number(e.target.value) === 3 ? 3 : 2,
                      })
                    }
                  >
                    <option value={2}>عنوان رئيسي (H2)</option>
                    <option value={3}>عنوان فرعي (H3)</option>
                  </select>
                )}
              </div>

              <div className="cms-section-controls">
                <button
                  type="button"
                  className="cms-btn cms-btn--sm"
                  disabled={idx === 0}
                  onClick={() => moveBlock(idx, -1)}
                  title="تحريك لأعلى"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="cms-btn cms-btn--sm"
                  disabled={idx === blocks.length - 1}
                  onClick={() => moveBlock(idx, 1)}
                  title="تحريك لأسفل"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="cms-btn cms-btn--sm cms-btn--danger"
                  onClick={() => removeBlock(idx)}
                >
                  حذف الكتلة
                </button>
              </div>
            </div>

            {block.type === "heading" && (
              <div className="cms-form-grid">
                <div className="cms-field">
                  <label className="cms-label">نص العنوان</label>
                  <input
                    type="text"
                    dir={inputDir}
                    className="cms-input"
                    value={block.text || ""}
                    onChange={(e) =>
                      updateBlock(idx, { text: e.target.value })
                    }
                  />
                </div>
                <div className="cms-field">
                  <label className="cms-label">
                    <span>معرّف القسم في فهرس المقال (Anchor ID)</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    className="cms-input"
                    value={block.id}
                    onChange={(e) => updateBlock(idx, { id: e.target.value })}
                  />
                </div>
              </div>
            )}

            {(block.type === "paragraph" || block.type === "callout") && (
              <>
                <div className="cms-inline-format-bar">
                  <button
                    type="button"
                    className="cms-btn cms-btn--sm"
                    onClick={() => appendInlineFormat(idx, "bold")}
                  >
                    + نص عريض (Bold)
                  </button>
                  <button
                    type="button"
                    className="cms-btn cms-btn--sm"
                    onClick={() => appendInlineFormat(idx, "italic")}
                  >
                    + نص مائل (Italic)
                  </button>
                  <button
                    type="button"
                    className="cms-btn cms-btn--sm"
                    onClick={() => appendInlineFormat(idx, "link")}
                  >
                    + إدراج رابط مضمن
                  </button>
                </div>

                <textarea
                  dir={inputDir}
                  className="cms-textarea"
                  rows={3}
                  value={block.text || ""}
                  onChange={(e) => updateBlock(idx, { text: e.target.value })}
                />

                {block.type === "paragraph" && (
                  <div className="cms-form-grid">
                    <div className="cms-field">
                      <label className="cms-label">
                        <span>رابط إضافي مرفق بالفقرة (اختياري)</span>
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="/ar/contact أو https://..."
                        className="cms-input"
                        value={block.linkHref || ""}
                        onChange={(e) =>
                          updateBlock(idx, { linkHref: e.target.value })
                        }
                      />
                    </div>
                    <div className="cms-field">
                      <label className="cms-label">
                        <span>نص زر الرابط (اختياري)</span>
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={block.linkLabel || ""}
                        onChange={(e) =>
                          updateBlock(idx, { linkLabel: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {block.text && (
                  <div
                    style={{
                      fontSize: "0.84rem",
                      padding: "0.5rem 0.75rem",
                      background: "#ffffff",
                      border: "1px dashed var(--cms-border)",
                    }}
                    dir={inputDir}
                  >
                    <span
                      style={{
                        color: "var(--cms-ink-muted)",
                        display: "block",
                        marginBottom: "0.2rem",
                      }}
                    >
                      معاينة النص بعد التنسيق الآمن:
                    </span>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: sanitizeRichTextInline(block.text),
                      }}
                    />
                  </div>
                )}
              </>
            )}

            {(block.type === "bullet-list" || block.type === "ordered-list") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {(block.items || []).map((item, itemIdx) => (
                  <div
                    key={`${block.id}-item-${itemIdx}`}
                    style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "var(--cms-red)",
                        minWidth: "1.6rem",
                      }}
                    >
                      {block.type === "ordered-list" ? `${itemIdx + 1}.` : "•"}
                    </span>
                    <input
                      type="text"
                      dir={inputDir}
                      className="cms-input"
                      value={item}
                      onChange={(e) => {
                        const nextItems = [...(block.items || [])];
                        nextItems[itemIdx] = e.target.value;
                        updateBlock(idx, { items: nextItems });
                      }}
                    />
                    <button
                      type="button"
                      className="cms-btn cms-btn--sm cms-btn--danger"
                      onClick={() => {
                        const nextItems = (block.items || []).filter(
                          (_, i) => i !== itemIdx
                        );
                        updateBlock(idx, { items: nextItems });
                      }}
                    >
                      حذف
                    </button>
                  </div>
                ))}
                <div>
                  <button
                    type="button"
                    className="cms-btn cms-btn--sm"
                    onClick={() =>
                      updateBlock(idx, {
                        items: [
                          ...(block.items || []),
                          locale === "ar" ? "عنصر جديد" : "New item",
                        ],
                      })
                    }
                  >
                    + إضافة عنصر للقائمة
                  </button>
                </div>
              </div>
            )}

            {block.type === "image" && (
              <div className="cms-form-grid">
                <div className="cms-field cms-field--full">
                  <label className="cms-label">
                    <span>مسار الصورة</span>
                    <button
                      type="button"
                      className="cms-btn cms-btn--sm cms-btn--primary"
                      onClick={() => onPickBlockImage(idx)}
                    >
                      اختيار من مكتبة الوسائط
                    </button>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    className="cms-input"
                    value={block.imageUrl || ""}
                    onChange={(e) =>
                      updateBlock(idx, { imageUrl: e.target.value })
                    }
                  />
                </div>
                <div className="cms-field">
                  <label className="cms-label">النص البديل للصورة (Alt)</label>
                  <input
                    type="text"
                    dir={inputDir}
                    className="cms-input"
                    value={block.imageAlt || ""}
                    onChange={(e) =>
                      updateBlock(idx, { imageAlt: e.target.value })
                    }
                  />
                </div>
                <div className="cms-field">
                  <label className="cms-label">التعليق التوضيحي أسفل الصورة</label>
                  <input
                    type="text"
                    dir={inputDir}
                    className="cms-input"
                    value={block.imageCaption || ""}
                    onChange={(e) =>
                      updateBlock(idx, { imageCaption: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Block Bar */}
      <div className="cms-add-block-bar">
        <strong style={{ fontSize: "0.86rem", marginInlineEnd: "0.4rem" }}>
          إضافة عنصر للمقال:
        </strong>
        <button
          type="button"
          className="cms-btn cms-btn--sm"
          onClick={() => addBlock("heading")}
        >
          + عنوان قسم (H2/H3)
        </button>
        <button
          type="button"
          className="cms-btn cms-btn--sm"
          onClick={() => addBlock("paragraph")}
        >
          + فقرة نصية
        </button>
        <button
          type="button"
          className="cms-btn cms-btn--sm"
          onClick={() => addBlock("bullet-list")}
        >
          + قائمة نقطية
        </button>
        <button
          type="button"
          className="cms-btn cms-btn--sm"
          onClick={() => addBlock("ordered-list")}
        >
          + قائمة مرقمة
        </button>
        <button
          type="button"
          className="cms-btn cms-btn--sm"
          onClick={() => addBlock("image")}
        >
          + صورة من المكتبة
        </button>
        <button
          type="button"
          className="cms-btn cms-btn--sm"
          onClick={() => addBlock("callout")}
        >
          + ملاحظة بارزة
        </button>
      </div>
    </div>
  );
}
