"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Locale } from "@/lib/locales";
import {
  calculateBlocksReadingTime,
  evaluateTranslationCompleteness,
} from "@/lib/cms/sanitize";
import {
  AdminCmsState,
  CmsArticleContent,
  CmsArticleRecord,
  CmsContactSettingsDocument,
  CmsFaqDocument,
  CmsMediaAsset,
  CmsRole,
  CmsSpecialtyContent,
  CmsSpecialtyRecord,
  DoctorProfileDocument,
  HomepageDocument,
  HomepageSectionId,
} from "@/lib/cms/types";
import { FocalPointEditor } from "./FocalPointEditor";
import { RichTextBlocksEditor } from "./RichTextBlocksEditor";

type AdminSectionKey =
  | "overview"
  | "homepage"
  | "doctor"
  | "specialties"
  | "articles"
  | "faq"
  | "media"
  | "contact"
  | "revisions";

const SECTION_LABELS: Record<
  AdminSectionKey,
  { title: string; subtitle: string }
> = {
  overview: {
    title: "نظرة عامة",
    subtitle:
      "ملخص حالة المحتوى المنشور والمسودات قيد المراجعة وآخر التعديلات التحريرية.",
  },
  homepage: {
    title: "الصفحة الرئيسية",
    subtitle:
      "إدارة الواجهة الافتتاحية، الصورة البانورامية ونقطة تركيزها، وترتيب وإظهار أقسام الصفحة الرئيسية.",
  },
  doctor: {
    title: "الملف المهني للدكتورة",
    subtitle:
      "إدارة الصورة الرسمية للدكتورة ملاك السيف، السيرة المهنية، المؤهلات العلمية، ومنهجية الاستشارة.",
  },
  specialties: {
    title: "مجالات التخصص",
    subtitle:
      "إدارة مجالات الممارسة الطبية، ترتيب عرضها، حالة نشرها، والروابط التحويلية التلقائية.",
  },
  articles: {
    title: "المقالات التوعوية",
    subtitle:
      "كتابة وتحرير المقالات التوعوية باللغتين العربية والإنجليزية مع حساب وقت القراءة وإعدادات البحث.",
  },
  faq: {
    title: "الأسئلة الشائعة",
    subtitle:
      "إدارة الأسئلة المتكررة وإجاباتها وترتيب ظهورها وإمكانية إظهارها أو إخفائها.",
  },
  media: {
    title: "مكتبة الوسائط",
    subtitle:
      "رفع الصور المعتمدة، ضبط النصوص البديلة ونقاط التركيز البصري، وحماية الصور المرتبطة بالمحتوى المنشور.",
  },
  contact: {
    title: "بيانات التواصل وإعدادات الموقع",
    subtitle:
      "إدارة أرقام التنسيق وواتساب وإنستجرام والعنوان الاختياري وأوقات العمل وإعدادات محركات البحث العامة.",
  },
  revisions: {
    title: "سجل الإصدارات",
    subtitle:
      "استعراض السجل الكامل لحفظ المسودات وعمليات النشر واستعادة أي إصدار سابق كمسودة جديدة.",
  },
};

const HOMEPAGE_SECTION_NAMES: Record<HomepageSectionId, string> = {
  specialties: "معرض مجالات التخصص",
  doctor: "الملف المهني للدكتورة",
  steps: "خطوات مسار الاستشارة",
  journal: "المقالات والتثقيف الطبي",
  faq: "الأسئلة الشائعة",
  booking: "قسم الحجز والتواصل الختامي",
};

const ACTION_LABELS: Record<string, string> = {
  seed: "استيراد أولي معتمد",
  save_draft: "حفظ مسودة",
  publish: "نشر على الموقع العام",
  unpublish: "إلغاء نشر وتحويل لمسودة",
  restore_to_draft: "استعادة إصدار كمسودة",
};

export function AdminDashboardClient({
  initialState,
}: {
  initialState: AdminCmsState;
}) {
  const router = useRouter();
  const [cmsState, setCmsState] = useState<AdminCmsState>(initialState);
  const [activeSection, setActiveSection] =
    useState<AdminSectionKey>("overview");
  const [activeLang, setActiveLang] = useState<Locale>("ar");

  // Local editable drafts
  const [homepageDraft, setHomepageDraft] = useState<HomepageDocument>(
    initialState.documents.homepage.draft
  );
  const [doctorDraft, setDoctorDraft] = useState<DoctorProfileDocument>(
    initialState.documents.doctorProfile.draft
  );
  const [faqDraft, setFaqDraft] = useState<CmsFaqDocument>(
    initialState.documents.faq.draft
  );
  const [contactDraft, setContactDraft] = useState<CmsContactSettingsDocument>(
    initialState.documents.contactSettings.draft
  );

  // Selected specialty & article for editing
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>(
    initialState.specialties[0]?.id || "plastic-surgery"
  );
  const [specialtyDraft, setSpecialtyDraft] =
    useState<CmsSpecialtyContent>(() => {
      const first = initialState.specialties[0];
      return (
        first?.draft || {
          slug: "new-specialty",
          numberLabel: "04",
          title: { ar: "", en: "" },
          introduction: { ar: "", en: "" },
          fullContent: { ar: "", en: "" },
          assessmentNote: { ar: "", en: "" },
          visualCaption: { ar: "", en: "" },
          coverImage: "/images/generated/specialty-plastic-surgery.jpg",
          imageAlt: { ar: "", en: "" },
          focalPoint: { x: 50, y: 50 },
          ctaLabel: { ar: "طلب استشارة", en: "Request consultation" },
          whatsappMessage: { ar: "", en: "" },
        }
      );
    });
  const [specialtyOrder, setSpecialtyOrder] = useState<number>(
    initialState.specialties[0]?.displayOrder || 1
  );

  const [selectedArticleId, setSelectedArticleId] = useState<string>(
    initialState.articles[0]?.id || "article-preparing-for-consultation"
  );
  const [articleDraft, setArticleDraft] = useState<CmsArticleContent>(() => {
    const first = initialState.articles[0];
    return (
      first?.draft || {
        slug: "new-article",
        category: "consultation-prep",
        coverImage: "/images/generated/article-consultation-prep.jpg",
        coverFocalPoint: { x: 50, y: 50 },
        socialImage: "/images/generated/article-consultation-prep.jpg",
        publishedAt: null,
        updatedAt: null,
        locales: {
          ar: {
            title: "",
            excerpt: "",
            coverAlt: "",
            authorName: "د. ملاك السيف",
            reviewedBy: "",
            seoTitle: "",
            seoDescription: "",
            blocks: [],
          },
          en: {
            title: "",
            excerpt: "",
            coverAlt: "",
            authorName: "Dr. Malak Alsaif",
            reviewedBy: "",
            seoTitle: "",
            seoDescription: "",
            blocks: [],
          },
        },
      }
    );
  });

  // Media upload & inspector state
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(
    initialState.mediaAssets[0]?.id || null
  );
  const [uploadAltAr, setUploadAltAr] = useState("");
  const [uploadAltEn, setUploadAltEn] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Media picker modal callback
  const [mediaPickerCallback, setMediaPickerCallback] = useState<
    ((asset: CmsMediaAsset) => void) | null
  >(null);

  // Confirmation modal for destructive / important actions
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // User provisioning form (Owner only)
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<CmsRole>("editor");

  // Unsaved changes & status feedback
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  const isOwner = cmsState.currentUser.role === "owner";

  // Protect unsaved changes on browser close/reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const refreshCmsState = async () => {
    const res = await fetch("/api/cms/state", { cache: "no-store" });
    if (res.ok) {
      const next = (await res.json()) as AdminCmsState;
      setCmsState(next);
      setHomepageDraft(next.documents.homepage.draft);
      setDoctorDraft(next.documents.doctorProfile.draft);
      setFaqDraft(next.documents.faq.draft);
      setContactDraft(next.documents.contactSettings.draft);

      const matchedSpec = next.specialties.find(
        (s) => s.id === selectedSpecialtyId
      );
      if (matchedSpec) {
        setSpecialtyDraft(matchedSpec.draft);
        setSpecialtyOrder(matchedSpec.displayOrder);
      }
      const matchedArt = next.articles.find((a) => a.id === selectedArticleId);
      if (matchedArt) {
        setArticleDraft(matchedArt.draft);
      }
      setIsDirty(false);
    }
  };

  const handleSelectSection = (target: AdminSectionKey) => {
    if (target === activeSection) return;
    if (isDirty) {
      setConfirmModal({
        title: "تعديلات غير محفوظة",
        message:
          "لديكِ تعديلات غير محفوظة في هذا القسم. هل ترغبين في الانتقال وتجاهل التعديلات غير المحفوظة؟",
        confirmLabel: "الانتقال وتجاهل التغييرات",
        danger: true,
        onConfirm: () => {
          setIsDirty(false);
          setActiveSection(target);
          setStatusBanner(null);
        },
      });
      return;
    }
    setActiveSection(target);
    setStatusBanner(null);
  };

  const handleSelectSpecialty = (spec: CmsSpecialtyRecord) => {
    setSelectedSpecialtyId(spec.id);
    setSpecialtyDraft(JSON.parse(JSON.stringify(spec.draft)));
    setSpecialtyOrder(spec.displayOrder);
    setIsDirty(false);
  };

  const handleCreateNewSpecialty = () => {
    const nextOrder = cmsState.specialties.length + 1;
    const newId = `specialty-${Date.now()}`;
    setSelectedSpecialtyId(newId);
    setSpecialtyOrder(nextOrder);
    setSpecialtyDraft({
      slug: `specialty-${nextOrder}`,
      numberLabel: String(nextOrder).padStart(2, "0"),
      title: { ar: "مجال تخصص جديد", en: "" },
      introduction: { ar: "مقدمة تعريفية موجزة حول هذا المجال.", en: "" },
      fullContent: {
        ar: "وصف تفصيلي للمجال وخيارات التقييم السريري الفردي.",
        en: "",
      },
      assessmentNote: {
        ar: "تُحدَّد الخيارات الملائمة بعد الفحص والتقييم السريري المباشر.",
        en: "",
      },
      visualCaption: { ar: "", en: "" },
      coverImage: "/images/generated/specialty-plastic-surgery.jpg",
      imageAlt: { ar: "صورة تعبيرية للمجال", en: "" },
      focalPoint: { x: 50, y: 50 },
      ctaLabel: { ar: "طلب استشارة", en: "Request consultation" },
      whatsappMessage: {
        ar: "مرحبًا، أرغب في الاستفسار عن تنسيق موعد استشارة مع د. ملاك السيف.",
        en: "",
      },
    });
    setIsDirty(true);
  };

  const handleSelectArticle = (art: CmsArticleRecord) => {
    setSelectedArticleId(art.id);
    setArticleDraft(JSON.parse(JSON.stringify(art.draft)));
    setIsDirty(false);
  };

  const handleCreateNewArticle = () => {
    const newId = `article-${Date.now()}`;
    const slug = `guide-${Date.now().toString().slice(-5)}`;
    setSelectedArticleId(newId);
    setArticleDraft({
      slug,
      category: "consultation-prep",
      coverImage: "/images/generated/article-consultation-prep.jpg",
      coverFocalPoint: { x: 50, y: 50 },
      socialImage: "/images/generated/article-consultation-prep.jpg",
      publishedAt: null,
      updatedAt: new Date().toISOString().slice(0, 10),
      locales: {
        ar: {
          title: "عنوان المقال التوعوي الجديد",
          excerpt: "ملخص تعريفي موجز يوضح موضوع المقال وفائدته للمراجِعة.",
          coverAlt: "صورة غلاف المقال التوعوي",
          authorName: "د. ملاك السيف",
          reviewedBy: "",
          seoTitle: "",
          seoDescription: "",
          blocks: [
            {
              id: "intro-section",
              type: "heading",
              headingLevel: 2,
              text: "مقدمة تمهيدية",
            },
            {
              id: "intro-paragraph",
              type: "paragraph",
              text: "اكتبي محتوى المقال التوعوي هنا بلغة واضحة ومتزنة.",
            },
          ],
        },
        en: {
          title: "",
          excerpt: "",
          coverAlt: "",
          authorName: "Dr. Malak Alsaif",
          reviewedBy: "",
          seoTitle: "",
          seoDescription: "",
          blocks: [],
        },
      },
    });
    setIsDirty(true);
  };

  const handleOpenDraftPreview = async (targetPath = "/ar") => {
    try {
      const res = await fetch("/api/cms/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: true, targetPath }),
      });
      if (res.ok) {
        const sep = targetPath.includes("?") ? "&" : "?";
        window.open(`${targetPath}${sep}preview=draft`, "_blank");
      }
    } catch {
      setStatusBanner({
        type: "error",
        text: "تعذر تفعيل وضع معاينة المسودة.",
      });
    }
  };

  const handleLogout = async () => {
    await fetch("/api/cms/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  // ============================================================================
  // Save & Publish Handlers
  // ============================================================================

  const saveDocument = async (
    key: "homepage" | "doctorProfile" | "faq" | "contactSettings",
    draftData: unknown
  ) => {
    setSaving(true);
    setStatusBanner(null);
    try {
      const res = await fetch(`/api/cms/documents/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: draftData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: "error",
          text: data.error || "تعذر حفظ المسودة.",
        });
        setSaving(false);
        return;
      }
      await refreshCmsState();
      setStatusBanner({
        type: "success",
        text: data.message || "تم حفظ المسودة بنجاح دون تغيير الموقع العام.",
      });
    } catch {
      setStatusBanner({
        type: "error",
        text: "حدث خطأ في الاتصال أثناء حفظ المسودة.",
      });
    } finally {
      setSaving(false);
    }
  };

  const publishDocumentNow = async (
    key: "homepage" | "doctorProfile" | "faq" | "contactSettings",
    draftData: unknown
  ) => {
    setSaving(true);
    setStatusBanner(null);
    try {
      const res = await fetch(`/api/cms/documents/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: draftData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: "error",
          text: data.error || "تعذر نشر التحديثات.",
        });
        setSaving(false);
        return;
      }
      await refreshCmsState();
      setStatusBanner({
        type: "success",
        text: data.message || "تم النشر على الموقع العام بنجاح.",
      });
    } catch {
      setStatusBanner({
        type: "error",
        text: "حدث خطأ في الاتصال أثناء النشر.",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSpecialty = async () => {
    setSaving(true);
    setStatusBanner(null);
    try {
      const res = await fetch(`/api/cms/specialties/${selectedSpecialtyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: specialtyDraft,
          displayOrder: specialtyOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: "error",
          text: data.error || "تعذر حفظ مسودة التخصص.",
        });
        setSaving(false);
        return;
      }
      await refreshCmsState();
      setStatusBanner({
        type: "success",
        text: data.message || "تم حفظ مسودة التخصص بنجاح.",
      });
    } catch {
      setStatusBanner({
        type: "error",
        text: "تعذر الاتصال بالخادم.",
      });
    } finally {
      setSaving(false);
    }
  };

  const publishOrUnpublishSpecialty = async (
    action: "publish" | "unpublish"
  ) => {
    setSaving(true);
    setStatusBanner(null);
    try {
      const res = await fetch(`/api/cms/specialties/${selectedSpecialtyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          draft: specialtyDraft,
          displayOrder: specialtyOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: "error",
          text: data.error || "تعذر تنفيذ العملية.",
        });
        setSaving(false);
        return;
      }
      await refreshCmsState();
      setStatusBanner({
        type: "success",
        text: data.message,
      });
    } catch {
      setStatusBanner({
        type: "error",
        text: "تعذر الاتصال بالخادم.",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveArticle = async () => {
    setSaving(true);
    setStatusBanner(null);
    try {
      const res = await fetch(`/api/cms/articles/${selectedArticleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: articleDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: "error",
          text: data.error || "تعذر حفظ مسودة المقال.",
        });
        setSaving(false);
        return;
      }
      await refreshCmsState();
      setStatusBanner({
        type: "success",
        text: data.message || "تم حفظ مسودة المقال بنجاح.",
      });
    } catch {
      setStatusBanner({
        type: "error",
        text: "تعذر الاتصال بالخادم.",
      });
    } finally {
      setSaving(false);
    }
  };

  const publishOrUnpublishArticle = async (action: "publish" | "unpublish") => {
    setSaving(true);
    setStatusBanner(null);
    try {
      const res = await fetch(`/api/cms/articles/${selectedArticleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          draft: articleDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: "error",
          text: data.error || "تعذر تنفيذ العملية.",
        });
        setSaving(false);
        return;
      }
      await refreshCmsState();
      setStatusBanner({
        type: "success",
        text: data.message,
      });
    } catch {
      setStatusBanner({
        type: "error",
        text: "تعذر الاتصال بالخادم.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreRevision = async (revisionId: string) => {
    setSaving(true);
    setStatusBanner(null);
    try {
      const res = await fetch(`/api/cms/revisions/${revisionId}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: "error",
          text: data.error || "تعذر استعادة الإصدار.",
        });
        setSaving(false);
        return;
      }
      await refreshCmsState();
      setStatusBanner({
        type: "success",
        text:
          data.message ||
          "تمت استعادة الإصدار المحدد كمسودة جديدة بنجاح مع الحفاظ على سجل الإصدارات.",
      });
    } catch {
      setStatusBanner({
        type: "error",
        text: "تعذر الاتصال بالخادم.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // Media Upload, Update & Delete Handlers
  // ============================================================================

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    setStatusBanner(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altAr", uploadAltAr || file.name);
      formData.append("altEn", uploadAltEn);
      formData.append("focalX", "50");
      formData.append("focalY", "50");

      const res = await fetch("/api/cms/media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: "error",
          text: data.error || "فشل رفع الصورة.",
        });
        setUploadingMedia(false);
        return;
      }

      setUploadAltAr("");
      setUploadAltEn("");
      await refreshCmsState();
      if (data.asset?.id) {
        setSelectedMediaId(data.asset.id);
      }
      setStatusBanner({
        type: "success",
        text: data.message || "تم رفع الصورة بنجاح إلى مكتبة الوسائط.",
      });
    } catch {
      setStatusBanner({
        type: "error",
        text: "تعذر رفع الملف.",
      });
    } finally {
      setUploadingMedia(false);
      e.target.value = "";
    }
  };

  const handleUpdateMediaMeta = async (asset: CmsMediaAsset) => {
    setSaving(true);
    setStatusBanner(null);
    try {
      const res = await fetch(`/api/cms/media/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          altText: asset.altText,
          focalPoint: asset.focalPoint,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: "error",
          text: data.error || "تعذر تحديث بيانات الصورة.",
        });
        setSaving(false);
        return;
      }
      await refreshCmsState();
      setStatusBanner({
        type: "success",
        text: data.message || "تم تحديث بيانات الصورة.",
      });
    } catch {
      setStatusBanner({
        type: "error",
        text: "تعذر الاتصال بالخادم.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReplaceMediaBinary = async (
    assetId: string,
    file: File
  ) => {
    setSaving(true);
    setStatusBanner(null);
    try {
      const arrayBuf = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuf).toString("base64");
      const res = await fetch(`/api/cms/media/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replaceBase64: base64,
          replaceFilename: file.name,
          replaceMimeType: file.type || "image/jpeg",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: "error",
          text: data.error || "تعذر استبدال ملف الصورة.",
        });
        setSaving(false);
        return;
      }
      await refreshCmsState();
      setStatusBanner({
        type: "success",
        text: "تم استبدال الصورة بملف جديد بأمان دون الكتابة التدميرية على الملف الأصلي.",
      });
    } catch {
      setStatusBanner({
        type: "error",
        text: "تعذر استبدال الصورة.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedia = async (assetId: string) => {
    setSaving(true);
    setStatusBanner(null);
    try {
      const res = await fetch(`/api/cms/media/${assetId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner({
          type: "error",
          text: data.error || "تعذر حذف الصورة.",
        });
        setSaving(false);
        return;
      }
      await refreshCmsState();
      setSelectedMediaId(null);
      setStatusBanner({
        type: "success",
        text: data.message || "تم حذف الصورة.",
      });
    } catch {
      setStatusBanner({
        type: "error",
        text: "تعذر الاتصال بالخادم.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // Translation Completeness Calculators
  // ============================================================================

  const homepageCompleteness = useMemo(() => {
    return evaluateTranslationCompleteness([
      { label: "عنوان الواجهة الرئيسية", value: homepageDraft.hero.title },
      { label: "وصف الواجهة الرئيسية", value: homepageDraft.hero.description },
      { label: "الوسم العلوي", value: homepageDraft.hero.eyebrow },
      { label: "المسمى التخصصي", value: homepageDraft.hero.subtitle },
      { label: "النص البديل للصورة", value: homepageDraft.hero.imageAlt },
      { label: "نص زر الاستشارة", value: homepageDraft.hero.primaryCtaLabel },
      ...homepageDraft.sections.map((s) => ({
        label: `عنوان قسم (${HOMEPAGE_SECTION_NAMES[s.id]})`,
        value: s.title,
      })),
    ]);
  }, [homepageDraft]);

  const doctorCompleteness = useMemo(() => {
    return evaluateTranslationCompleteness([
      { label: "الاسم الكامل", value: doctorDraft.fullName },
      { label: "المسمى التخصصي", value: doctorDraft.specialtyTitle },
      { label: "النبذة المختصرة", value: doctorDraft.shortBio },
      { label: "عنوان السيرة المهنية", value: doctorDraft.biographyHeading },
      { label: "النص البديل للصورة", value: doctorDraft.portraitAlt },
      { label: "عنوان المؤهلات", value: doctorDraft.credentialsHeading },
      { label: "عنوان منهجية الاستشارة", value: doctorDraft.approachTitle },
    ]);
  }, [doctorDraft]);

  const specialtyCompleteness = useMemo(() => {
    return evaluateTranslationCompleteness([
      { label: "عنوان التخصص", value: specialtyDraft.title },
      { label: "المقدمة المختصرة", value: specialtyDraft.introduction },
      { label: "الشرح التفصيلي", value: specialtyDraft.fullContent },
      { label: "ملاحظة التقييم", value: specialtyDraft.assessmentNote },
      { label: "النص البديل للصورة", value: specialtyDraft.imageAlt },
      { label: "نص زر الاستشارة", value: specialtyDraft.ctaLabel },
    ]);
  }, [specialtyDraft]);

  const articleCompleteness = useMemo(() => {
    return evaluateTranslationCompleteness([
      {
        label: "عنوان المقال",
        value: {
          ar: articleDraft.locales.ar.title,
          en: articleDraft.locales.en.title,
        },
      },
      {
        label: "ملخص المقال",
        value: {
          ar: articleDraft.locales.ar.excerpt,
          en: articleDraft.locales.en.excerpt,
        },
      },
      {
        label: "النص البديل للغلاف",
        value: {
          ar: articleDraft.locales.ar.coverAlt,
          en: articleDraft.locales.en.coverAlt,
        },
      },
      {
        label: "محتوى المقال",
        value: {
          ar: articleDraft.locales.ar.blocks.length > 0 ? "مكتمل" : "",
          en: articleDraft.locales.en.blocks.length > 0 ? "Complete" : "",
        },
      },
    ]);
  }, [articleDraft]);

  const faqCompleteness = useMemo(() => {
    return evaluateTranslationCompleteness([
      { label: "عنوان قسم الأسئلة", value: faqDraft.title },
      { label: "مقدمة الأسئلة", value: faqDraft.intro },
      ...faqDraft.items.map((item, idx) => ({
        label: `السؤال ${idx + 1}`,
        value: item.question,
      })),
      ...faqDraft.items.map((item, idx) => ({
        label: `الإجابة ${idx + 1}`,
        value: item.answer,
      })),
    ]);
  }, [faqDraft]);

  const contactCompleteness = useMemo(() => {
    return evaluateTranslationCompleteness([
      { label: "اسم الموقع", value: contactDraft.siteName },
      { label: "المسمى التخصصي", value: contactDraft.siteSubtitle },
      {
        label: "رسالة واتساب الافتراضية",
        value: contactDraft.defaultWhatsappMessage,
      },
      { label: "عنوان قسم الحجز", value: contactDraft.bookingCta.title },
      {
        label: "عنوان البحث الافتراضي (SEO)",
        value: contactDraft.globalSeo.defaultTitle,
      },
    ]);
  }, [contactDraft]);

  const renderLanguageBar = (
    completeness: ReturnType<typeof evaluateTranslationCompleteness>
  ) => (
    <div className="cms-lang-bar">
      <div className="cms-lang-tabs" role="tablist" aria-label="لغة التحرير">
        <button
          type="button"
          role="tab"
          aria-selected={activeLang === "ar"}
          className={`cms-lang-tab ${
            activeLang === "ar" ? "is-active" : ""
          }`.trim()}
          onClick={() => setActiveLang("ar")}
        >
          <span>تحرير المحتوى العربي (RTL)</span>
          <span>{completeness.arPercent}%</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeLang === "en"}
          className={`cms-lang-tab ${
            activeLang === "en" ? "is-active" : ""
          }`.trim()}
          onClick={() => setActiveLang("en")}
        >
          <span>تحرير النسخة الإنجليزية (English)</span>
          <span>{completeness.enPercent}%</span>
        </button>
      </div>

      <div className="cms-completeness-group">
        <span
          className={`cms-completeness-pill ${
            completeness.isArComplete ? "is-complete" : "is-incomplete"
          }`}
        >
          العربية: {completeness.arPercent}%
          {!completeness.isArComplete &&
            ` (ناقص: ${completeness.missingArFields.slice(0, 2).join("، ")})`}
        </span>
        <span
          className={`cms-completeness-pill ${
            completeness.isEnComplete ? "is-complete" : "is-incomplete"
          }`}
        >
          الإنجليزية: {completeness.enPercent}%
          {!completeness.isEnComplete &&
            ` (ناقص: ${completeness.missingEnFields.slice(0, 2).join("، ")})`}
        </span>
      </div>
    </div>
  );

  const inputDir = activeLang === "ar" ? "rtl" : "ltr";

  // Count metrics for Overview
  const publishedArticlesCount = cmsState.articles.filter(
    (a) => a.status === "published"
  ).length;
  const draftArticlesCount = cmsState.articles.filter(
    (a) => a.status === "draft"
  ).length;
  const publishedSpecsCount = cmsState.specialties.filter(
    (s) => s.status === "published"
  ).length;
  const visibleFaqsCount = cmsState.documents.faq.published.items.filter(
    (i) => i.visible
  ).length;

  const selectedSpecialtyRecord = cmsState.specialties.find(
    (s) => s.id === selectedSpecialtyId
  );
  const selectedArticleRecord = cmsState.articles.find(
    (a) => a.id === selectedArticleId
  );
  const selectedMediaRecord = cmsState.mediaAssets.find(
    (m) => m.id === selectedMediaId
  );

  return (
    <div className="cms-admin-shell" dir="rtl" lang="ar">
      <div className="cms-admin-layout">
        {/* Right-Hand RTL Sidebar Navigation */}
        <aside className="cms-sidebar" aria-label="قائمة أقسام لوحة التحكم">
          <div>
            <div className="cms-sidebar-header">
              <span className="cms-sidebar-brand">د. ملاك السيف</span>
              <span className="cms-sidebar-caption">
                نظام إدارة المحتوى التحريري
              </span>

              <div className="cms-sidebar-user-badge">
                <span className="cms-role-pill">
                  {isOwner ? "صلاحية المالك (Owner)" : "صلاحية محرر (Editor)"}
                </span>
                <span>{cmsState.currentUser.displayName}</span>
                <span style={{ opacity: 0.78 }} dir="ltr">
                  {cmsState.currentUser.email}
                </span>
              </div>
            </div>

            <nav className="cms-sidebar-nav" aria-label="أقسام الإدارة">
              <button
                type="button"
                className={`cms-nav-btn ${
                  activeSection === "overview" ? "is-active" : ""
                }`}
                onClick={() => handleSelectSection("overview")}
              >
                <span>نظرة عامة</span>
              </button>

              <button
                type="button"
                className={`cms-nav-btn ${
                  activeSection === "homepage" ? "is-active" : ""
                }`}
                onClick={() => handleSelectSection("homepage")}
              >
                <span>الصفحة الرئيسية</span>
                {cmsState.documents.homepage.hasUnpublishedChanges && (
                  <span className="cms-nav-count">مسودة</span>
                )}
              </button>

              <button
                type="button"
                className={`cms-nav-btn ${
                  activeSection === "doctor" ? "is-active" : ""
                }`}
                onClick={() => handleSelectSection("doctor")}
              >
                <span>الملف المهني للدكتورة</span>
                {cmsState.documents.doctorProfile.hasUnpublishedChanges && (
                  <span className="cms-nav-count">مسودة</span>
                )}
              </button>

              <button
                type="button"
                className={`cms-nav-btn ${
                  activeSection === "specialties" ? "is-active" : ""
                }`}
                onClick={() => handleSelectSection("specialties")}
              >
                <span>مجالات التخصص</span>
                <span className="cms-nav-count">
                  {cmsState.specialties.length}
                </span>
              </button>

              <button
                type="button"
                className={`cms-nav-btn ${
                  activeSection === "articles" ? "is-active" : ""
                }`}
                onClick={() => handleSelectSection("articles")}
              >
                <span>المقالات التوعوية</span>
                <span className="cms-nav-count">
                  {cmsState.articles.length}
                </span>
              </button>

              <button
                type="button"
                className={`cms-nav-btn ${
                  activeSection === "faq" ? "is-active" : ""
                }`}
                onClick={() => handleSelectSection("faq")}
              >
                <span>الأسئلة الشائعة</span>
                <span className="cms-nav-count">
                  {cmsState.documents.faq.draft.items.length}
                </span>
              </button>

              <button
                type="button"
                className={`cms-nav-btn ${
                  activeSection === "media" ? "is-active" : ""
                }`}
                onClick={() => handleSelectSection("media")}
              >
                <span>مكتبة الوسائط</span>
                <span className="cms-nav-count">
                  {cmsState.mediaAssets.length}
                </span>
              </button>

              <button
                type="button"
                className={`cms-nav-btn ${
                  activeSection === "contact" ? "is-active" : ""
                }`}
                onClick={() => handleSelectSection("contact")}
              >
                <span>بيانات التواصل والإعدادات</span>
              </button>

              <button
                type="button"
                className={`cms-nav-btn ${
                  activeSection === "revisions" ? "is-active" : ""
                }`}
                onClick={() => handleSelectSection("revisions")}
              >
                <span>سجل الإصدارات</span>
                <span className="cms-nav-count">
                  {cmsState.revisions.length}
                </span>
              </button>
            </nav>
          </div>

          <div className="cms-sidebar-footer">
            <button
              type="button"
              className="cms-sidebar-link"
              onClick={() => handleOpenDraftPreview("/ar")}
            >
              <span>معاينة المسودات في الموقع</span>
              <span aria-hidden="true">↖</span>
            </button>

            <Link href="/ar" target="_blank" className="cms-sidebar-link">
              <span>فتح الموقع العام المنشور</span>
              <span aria-hidden="true">↖</span>
            </Link>

            <button
              type="button"
              className="cms-sidebar-link"
              onClick={handleLogout}
            >
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="cms-workspace">
          {/* Sticky Top Bar */}
          <header className="cms-topbar">
            <div className="cms-topbar-title-group">
              <h1 className="cms-topbar-title">
                {SECTION_LABELS[activeSection].title}
              </h1>
              <p className="cms-topbar-subtitle">
                {SECTION_LABELS[activeSection].subtitle}
              </p>
            </div>

            <div className="cms-topbar-actions">
              {isDirty ? (
                <span className="cms-dirty-indicator" role="status">
                  ● توجد تعديلات غير محفوظة
                </span>
              ) : (
                <span className="cms-saved-indicator" role="status">
                  ✓ جميع التغييرات محفوظة
                </span>
              )}

              <button
                type="button"
                className="cms-btn cms-btn--sm"
                onClick={() => handleOpenDraftPreview("/ar")}
              >
                معاينة المسودة (العربية) ↖
              </button>
              <button
                type="button"
                className="cms-btn cms-btn--sm"
                onClick={() => handleOpenDraftPreview("/en")}
              >
                معاينة المسودة (English) ↖
              </button>
            </div>
          </header>

          <div className="cms-content-body">
            {/* Cloud Read-Only Notice if Supabase env vars are not yet configured on Vercel */}
            {cmsState.persistenceNotice && (
              <div className="cms-alert cms-alert--warning" role="status">
                <span>{cmsState.persistenceNotice}</span>
              </div>
            )}

            {/* Status / Validation Feedback Banner */}
            {statusBanner && (
              <div
                className={`cms-alert cms-alert--${statusBanner.type}`}
                role="alert"
              >
                <span>{statusBanner.text}</span>
                <button
                  type="button"
                  className="cms-btn cms-btn--sm"
                  onClick={() => setStatusBanner(null)}
                >
                  إغلاق
                </button>
              </div>
            )}

            {/* ==============================================================
                SECTION 1: OVERVIEW (نظرة عامة)
                ============================================================== */}
            {activeSection === "overview" && (
              <>
                <div className="cms-stats-grid">
                  <div className="cms-stat-card">
                    <span className="cms-stat-label">المقالات المنشورة</span>
                    <span className="cms-stat-value">
                      {publishedArticlesCount}
                    </span>
                    <span className="cms-stat-meta">
                      ومسودات قيد المراجعة: {draftArticlesCount}
                    </span>
                  </div>

                  <div className="cms-stat-card">
                    <span className="cms-stat-label">مجالات التخصص المنشورة</span>
                    <span className="cms-stat-value">
                      {publishedSpecsCount}
                    </span>
                    <span className="cms-stat-meta">
                      إجمالي المسارات المسجلة: {cmsState.specialties.length}
                    </span>
                  </div>

                  <div className="cms-stat-card">
                    <span className="cms-stat-label">الأسئلة الشائعة الظاهرة</span>
                    <span className="cms-stat-value">{visibleFaqsCount}</span>
                    <span className="cms-stat-meta">
                      إجمالي الأسئلة في القائمة:{" "}
                      {cmsState.documents.faq.draft.items.length}
                    </span>
                  </div>

                  <div className="cms-stat-card">
                    <span className="cms-stat-label">ملفات مكتبة الوسائط</span>
                    <span className="cms-stat-value">
                      {cmsState.mediaAssets.length}
                    </span>
                    <span className="cms-stat-meta">
                      صور معتمدة ومفحوصة الأبعاد
                    </span>
                  </div>
                </div>

                {/* Drafts & Pending Changes Needing Attention */}
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h2 className="cms-card-title">
                        مسودات وتعديلات بانتظار المراجعة أو النشر
                      </h2>
                      <p className="cms-card-desc">
                        المحتوى المحفوظ كمسودة لا يظهر للزوار على الموقع العام إلا بعد اعتماده ونشره من قِبل المالكة.
                      </p>
                    </div>
                  </div>

                  <div className="cms-table-wrap">
                    <table className="cms-table">
                      <thead>
                        <tr>
                          <th>العنصر</th>
                          <th>القسم</th>
                          <th>الحالة الحالية</th>
                          <th>الإجراء السريع</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cmsState.articles
                          .filter(
                            (a) =>
                              a.status === "draft" ||
                              JSON.stringify(a.draft) !==
                                JSON.stringify(a.published)
                          )
                          .map((art) => (
                            <tr key={art.id}>
                              <td>
                                <strong>{art.draft.locales.ar.title}</strong>
                              </td>
                              <td>المقالات التوعوية</td>
                              <td>
                                <span className="cms-badge cms-badge--draft">
                                  {art.status === "draft"
                                    ? "مسودة غير منشورة"
                                    : "تعديلات مسودة على مقال منشور"}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "0.45rem" }}>
                                  <button
                                    type="button"
                                    className="cms-btn cms-btn--sm cms-btn--primary"
                                    onClick={() => {
                                      handleSelectArticle(art);
                                      setActiveSection("articles");
                                    }}
                                  >
                                    فتح المحرر
                                  </button>
                                  <button
                                    type="button"
                                    className="cms-btn cms-btn--sm"
                                    onClick={() =>
                                      handleOpenDraftPreview(
                                        `/ar/articles/${art.draft.slug}`
                                      )
                                    }
                                  >
                                    معاينة المسودة ↖
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

                        {cmsState.documents.homepage.hasUnpublishedChanges && (
                          <tr>
                            <td>
                              <strong>الصفحة الرئيسية</strong>
                            </td>
                            <td>صفحات الموقع</td>
                            <td>
                              <span className="cms-badge cms-badge--draft">
                                مسودة تحتوي على تعديلات غير منشورة
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="cms-btn cms-btn--sm cms-btn--primary"
                                onClick={() => setActiveSection("homepage")}
                              >
                                مراجعة ونشر
                              </button>
                            </td>
                          </tr>
                        )}

                        {cmsState.documents.doctorProfile
                          .hasUnpublishedChanges && (
                          <tr>
                            <td>
                              <strong>الملف المهني للدكتورة</strong>
                            </td>
                            <td>صفحات الموقع</td>
                            <td>
                              <span className="cms-badge cms-badge--draft">
                                مسودة تحتوي على تعديلات غير منشورة
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="cms-btn cms-btn--sm cms-btn--primary"
                                onClick={() => setActiveSection("doctor")}
                              >
                                مراجعة ونشر
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Revisions Activity */}
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h2 className="cms-card-title">آخر النشاطات التحريرية</h2>
                      <p className="cms-card-desc">
                        أحدث عمليات الحفظ والنشر المسجلة في النظام.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cms-btn cms-btn--sm"
                      onClick={() => handleSelectSection("revisions")}
                    >
                      عرض السجل الكامل ←
                    </button>
                  </div>

                  <div className="cms-table-wrap">
                    <table className="cms-table">
                      <thead>
                        <tr>
                          <th>العنصر</th>
                          <th>العملية</th>
                          <th>الملخص</th>
                          <th>المستخدم</th>
                          <th>التوقيت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cmsState.revisions.slice(0, 6).map((rev) => (
                          <tr key={rev.id}>
                            <td>
                              <strong>{rev.entityTitle}</strong>
                            </td>
                            <td>
                              <span
                                className={`cms-badge ${
                                  rev.action === "publish"
                                    ? "cms-badge--published"
                                    : "cms-badge--draft"
                                }`}
                              >
                                {ACTION_LABELS[rev.action] || rev.action}
                              </span>
                            </td>
                            <td>{rev.summary}</td>
                            <td dir="ltr">{rev.actorEmail}</td>
                            <td dir="ltr">
                              {rev.createdAt.slice(0, 16).replace("T", " ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ==============================================================
                SECTION 2: HOMEPAGE (الصفحة الرئيسية)
                ============================================================== */}
            {activeSection === "homepage" && (
              <>
                {renderLanguageBar(homepageCompleteness)}

                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h2 className="cms-card-title">
                        الواجهة الافتتاحية الحمراء (Hero Section)
                      </h2>
                      <p className="cms-card-desc">
                        تعديل العنوان الرئيسي، الوصف الداعم، الصورة البانورامية ونقطة تركيزها، وأزرار الإجراء.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        disabled={saving}
                        className="cms-btn cms-btn--primary"
                        onClick={() =>
                          saveDocument("homepage", homepageDraft)
                        }
                      >
                        حفظ المسودة
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          disabled={saving}
                          className="cms-btn cms-btn--publish"
                          onClick={() =>
                            publishDocumentNow("homepage", homepageDraft)
                          }
                        >
                          نشر الصفحة الرئيسية
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="cms-form-grid">
                    <div className="cms-field">
                      <label className="cms-label">
                        <span>
                          العنوان الرئيسي ({activeLang === "ar" ? "العربية" : "English"})
                        </span>
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={homepageDraft.hero.title[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setHomepageDraft({
                            ...homepageDraft,
                            hero: {
                              ...homepageDraft.hero,
                              title: {
                                ...homepageDraft.hero.title,
                                [activeLang]: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        <span>
                          المسمى التخصصي أعلى العنوان ({activeLang === "ar" ? "العربية" : "English"})
                        </span>
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={homepageDraft.hero.subtitle[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setHomepageDraft({
                            ...homepageDraft,
                            hero: {
                              ...homepageDraft.hero,
                              subtitle: {
                                ...homepageDraft.hero.subtitle,
                                [activeLang]: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        <span>
                          الجملة الداعمة أسفل العنوان ({activeLang === "ar" ? "العربية" : "English"})
                        </span>
                      </label>
                      <textarea
                        dir={inputDir}
                        className="cms-textarea"
                        rows={2}
                        value={homepageDraft.hero.description[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setHomepageDraft({
                            ...homepageDraft,
                            hero: {
                              ...homepageDraft.hero,
                              description: {
                                ...homepageDraft.hero.description,
                                [activeLang]: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        <span>
                          نص زر الاستشارة الرئيسي ({activeLang === "ar" ? "العربية" : "English"})
                        </span>
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={homepageDraft.hero.primaryCtaLabel[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setHomepageDraft({
                            ...homepageDraft,
                            hero: {
                              ...homepageDraft.hero,
                              primaryCtaLabel: {
                                ...homepageDraft.hero.primaryCtaLabel,
                                [activeLang]: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        <span>وجهة زر الاستشارة الرئيسي</span>
                      </label>
                      <select
                        className="cms-select"
                        value={homepageDraft.hero.primaryCtaDestination}
                        onChange={(e) => {
                          setIsDirty(true);
                          setHomepageDraft({
                            ...homepageDraft,
                            hero: {
                              ...homepageDraft.hero,
                              primaryCtaDestination: e.target.value,
                            },
                          });
                        }}
                      >
                        <option value="#consultation-dialog">
                          فتح نافذة طلب الاستشارة عبر واتساب (الافتراضي المعتمد)
                        </option>
                        <option value="/contact">صفحة تواصل معنا (/contact)</option>
                        <option value="/specialties">
                          صفحة مجالات التخصص (/specialties)
                        </option>
                        <option value="/about">صفحة عن الدكتورة (/about)</option>
                      </select>
                    </div>

                    <FocalPointEditor
                      label="الصورة البانورامية الافتتاحية ونقطة التركيز البصري"
                      imageUrl={homepageDraft.hero.image}
                      imageAlt={homepageDraft.hero.imageAlt[activeLang]}
                      focalPoint={homepageDraft.hero.focalPoint}
                      onChangeImageUrl={(url) => {
                        setIsDirty(true);
                        setHomepageDraft({
                          ...homepageDraft,
                          hero: { ...homepageDraft.hero, image: url },
                        });
                      }}
                      onChangeFocalPoint={(fp) => {
                        setIsDirty(true);
                        setHomepageDraft({
                          ...homepageDraft,
                          hero: { ...homepageDraft.hero, focalPoint: fp },
                        });
                      }}
                      onOpenMediaPicker={() =>
                        setMediaPickerCallback(() => (asset: CmsMediaAsset) => {
                          setIsDirty(true);
                          setHomepageDraft({
                            ...homepageDraft,
                            hero: {
                              ...homepageDraft.hero,
                              image: asset.publicUrl,
                              imageAlt: {
                                ar:
                                  asset.altText.ar ||
                                  homepageDraft.hero.imageAlt.ar,
                                en:
                                  asset.altText.en ||
                                  homepageDraft.hero.imageAlt.en,
                              },
                            },
                          });
                        })
                      }
                    />

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        <span>
                          النص البديل للصورة البانورامية ({activeLang === "ar" ? "العربية" : "English"})
                        </span>
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={homepageDraft.hero.imageAlt[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setHomepageDraft({
                            ...homepageDraft,
                            hero: {
                              ...homepageDraft.hero,
                              imageAlt: {
                                ...homepageDraft.hero.imageAlt,
                                [activeLang]: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Homepage Sections Order, Visibility & Headings */}
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h2 className="cms-card-title">
                        أقسام الصفحة الرئيسية (الترتيب، الإظهار، والعناوين)
                      </h2>
                      <p className="cms-card-desc">
                        يمكنكِ إظهار أو إخفاء أي قسم، أو إعادة ترتيب الأقسام، وتعديل عناوينها ونصوصها الداعمة ضمن النظام البصري المعتمد.
                      </p>
                    </div>
                  </div>

                  <div className="cms-section-list">
                    {homepageDraft.sections.map((sec, idx) => (
                      <div key={sec.id} className="cms-section-row">
                        <div className="cms-section-row-top">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                            }}
                          >
                            <span className="cms-badge cms-badge--published">
                              ترتيب {idx + 1}
                            </span>
                            <strong>{HOMEPAGE_SECTION_NAMES[sec.id]}</strong>
                          </div>

                          <div className="cms-section-controls">
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                fontSize: "0.86rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                marginInlineEnd: "0.5rem",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={sec.visible}
                                onChange={(e) => {
                                  setIsDirty(true);
                                  const next = homepageDraft.sections.map(
                                    (s, i) =>
                                      i === idx
                                        ? { ...s, visible: e.target.checked }
                                        : s
                                  );
                                  setHomepageDraft({
                                    ...homepageDraft,
                                    sections: next,
                                  });
                                }}
                              />
                              <span>
                                {sec.visible ? "ظاهر في الرئيسية" : "مخفي"}
                              </span>
                            </label>

                            <button
                              type="button"
                              className="cms-btn cms-btn--sm"
                              disabled={idx === 0}
                              onClick={() => {
                                setIsDirty(true);
                                const next = [...homepageDraft.sections];
                                const [moved] = next.splice(idx, 1);
                                next.splice(idx - 1, 0, moved);
                                setHomepageDraft({
                                  ...homepageDraft,
                                  sections: next.map((item, i) => ({
                                    ...item,
                                    order: i + 1,
                                  })),
                                });
                              }}
                            >
                              ↑ لأعلى
                            </button>
                            <button
                              type="button"
                              className="cms-btn cms-btn--sm"
                              disabled={
                                idx === homepageDraft.sections.length - 1
                              }
                              onClick={() => {
                                setIsDirty(true);
                                const next = [...homepageDraft.sections];
                                const [moved] = next.splice(idx, 1);
                                next.splice(idx + 1, 0, moved);
                                setHomepageDraft({
                                  ...homepageDraft,
                                  sections: next.map((item, i) => ({
                                    ...item,
                                    order: i + 1,
                                  })),
                                });
                              }}
                            >
                              ↓ لأسفل
                            </button>
                          </div>
                        </div>

                        <div className="cms-form-grid">
                          <div className="cms-field">
                            <label className="cms-label">
                              <span>
                                الوسم الفرعي ({activeLang === "ar" ? "العربية" : "English"})
                              </span>
                            </label>
                            <input
                              type="text"
                              dir={inputDir}
                              className="cms-input"
                              value={sec.eyebrow[activeLang]}
                              onChange={(e) => {
                                setIsDirty(true);
                                const next = homepageDraft.sections.map(
                                  (s, i) =>
                                    i === idx
                                      ? {
                                          ...s,
                                          eyebrow: {
                                            ...s.eyebrow,
                                            [activeLang]: e.target.value,
                                          },
                                        }
                                      : s
                                );
                                setHomepageDraft({
                                  ...homepageDraft,
                                  sections: next,
                                });
                              }}
                            />
                          </div>

                          <div className="cms-field">
                            <label className="cms-label">
                              <span>
                                عنوان القسم ({activeLang === "ar" ? "العربية" : "English"})
                              </span>
                            </label>
                            <input
                              type="text"
                              dir={inputDir}
                              className="cms-input"
                              value={sec.title[activeLang]}
                              onChange={(e) => {
                                setIsDirty(true);
                                const next = homepageDraft.sections.map(
                                  (s, i) =>
                                    i === idx
                                      ? {
                                          ...s,
                                          title: {
                                            ...s.title,
                                            [activeLang]: e.target.value,
                                          },
                                        }
                                      : s
                                );
                                setHomepageDraft({
                                  ...homepageDraft,
                                  sections: next,
                                });
                              }}
                            />
                          </div>

                          <div className="cms-field cms-field--full">
                            <label className="cms-label">
                              <span>
                                النص التوضيحي الداعم للقسم ({activeLang === "ar" ? "العربية" : "English"})
                              </span>
                            </label>
                            <textarea
                              dir={inputDir}
                              className="cms-textarea"
                              rows={2}
                              value={sec.supportingText[activeLang]}
                              onChange={(e) => {
                                setIsDirty(true);
                                const next = homepageDraft.sections.map(
                                  (s, i) =>
                                    i === idx
                                      ? {
                                          ...s,
                                          supportingText: {
                                            ...s.supportingText,
                                            [activeLang]: e.target.value,
                                          },
                                        }
                                      : s
                                );
                                setHomepageDraft({
                                  ...homepageDraft,
                                  sections: next,
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ==============================================================
                SECTION 3: DOCTOR PROFILE (الملف المهني للدكتورة)
                ============================================================== */}
            {activeSection === "doctor" && (
              <>
                {renderLanguageBar(doctorCompleteness)}

                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h2 className="cms-card-title">
                        البيانات التعريفية والصورة الرسمية للدكتورة
                      </h2>
                      <p className="cms-card-desc">
                        تُستخدم هذه البيانات في قسم التعريف بالصفحة الرئيسية وفي صفحة «عن الدكتورة».
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        disabled={saving}
                        className="cms-btn cms-btn--primary"
                        onClick={() =>
                          saveDocument("doctorProfile", doctorDraft)
                        }
                      >
                        حفظ المسودة
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          disabled={saving}
                          className="cms-btn cms-btn--publish"
                          onClick={() =>
                            publishDocumentNow("doctorProfile", doctorDraft)
                          }
                        >
                          نشر الملف المهني
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="cms-form-grid">
                    <div className="cms-field">
                      <label className="cms-label">
                        الاسم المهني ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={doctorDraft.fullName[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setDoctorDraft({
                            ...doctorDraft,
                            fullName: {
                              ...doctorDraft.fullName,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        التخصص الدقيق ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={doctorDraft.specialtyTitle[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setDoctorDraft({
                            ...doctorDraft,
                            specialtyTitle: {
                              ...doctorDraft.specialtyTitle,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        النبذة التعريفية المختصرة ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <textarea
                        dir={inputDir}
                        className="cms-textarea"
                        rows={3}
                        value={doctorDraft.shortBio[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setDoctorDraft({
                            ...doctorDraft,
                            shortBio: {
                              ...doctorDraft.shortBio,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <FocalPointEditor
                      label="الصورة الرسمية للدكتورة ونقطة التركيز البصري"
                      imageUrl={doctorDraft.portraitImage}
                      imageAlt={doctorDraft.portraitAlt[activeLang]}
                      focalPoint={doctorDraft.portraitFocalPoint}
                      onChangeImageUrl={(url) => {
                        setIsDirty(true);
                        setDoctorDraft({
                          ...doctorDraft,
                          portraitImage: url,
                        });
                      }}
                      onChangeFocalPoint={(fp) => {
                        setIsDirty(true);
                        setDoctorDraft({
                          ...doctorDraft,
                          portraitFocalPoint: fp,
                        });
                      }}
                      onOpenMediaPicker={() =>
                        setMediaPickerCallback(() => (asset: CmsMediaAsset) => {
                          setIsDirty(true);
                          setDoctorDraft({
                            ...doctorDraft,
                            portraitImage: asset.publicUrl,
                          });
                        })
                      }
                    />

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        عنوان قسم السيرة المهنية ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={doctorDraft.biographyHeading[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setDoctorDraft({
                            ...doctorDraft,
                            biographyHeading: {
                              ...doctorDraft.biographyHeading,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field cms-field--full">
                      <div className="cms-label">
                        <span>
                          فقرات السيرة المهنية ({activeLang === "ar" ? "العربية" : "English"})
                        </span>
                        <button
                          type="button"
                          className="cms-btn cms-btn--sm"
                          onClick={() => {
                            setIsDirty(true);
                            setDoctorDraft({
                              ...doctorDraft,
                              biographyParagraphs: {
                                ...doctorDraft.biographyParagraphs,
                                [activeLang]: [
                                  ...doctorDraft.biographyParagraphs[activeLang],
                                  activeLang === "ar"
                                    ? "فقرة سيرة مهنية إضافية..."
                                    : "Additional biography paragraph...",
                                ],
                              },
                            });
                          }}
                        >
                          + إضافة فقرة
                        </button>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.6rem",
                        }}
                      >
                        {doctorDraft.biographyParagraphs[activeLang].map(
                          (para, pIdx) => (
                            <div
                              key={pIdx}
                              style={{
                                display: "flex",
                                gap: "0.5rem",
                                alignItems: "flex-start",
                              }}
                            >
                              <textarea
                                dir={inputDir}
                                className="cms-textarea"
                                rows={2}
                                value={para}
                                onChange={(e) => {
                                  setIsDirty(true);
                                  const nextList = [
                                    ...doctorDraft.biographyParagraphs[
                                      activeLang
                                    ],
                                  ];
                                  nextList[pIdx] = e.target.value;
                                  setDoctorDraft({
                                    ...doctorDraft,
                                    biographyParagraphs: {
                                      ...doctorDraft.biographyParagraphs,
                                      [activeLang]: nextList,
                                    },
                                  });
                                }}
                              />
                              <button
                                type="button"
                                className="cms-btn cms-btn--sm cms-btn--danger"
                                onClick={() => {
                                  setIsDirty(true);
                                  const nextList =
                                    doctorDraft.biographyParagraphs[
                                      activeLang
                                    ].filter((_, i) => i !== pIdx);
                                  setDoctorDraft({
                                    ...doctorDraft,
                                    biographyParagraphs: {
                                      ...doctorDraft.biographyParagraphs,
                                      [activeLang]: nextList,
                                    },
                                  });
                                }}
                              >
                                حذف
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verified Qualifications Card */}
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h2 className="cms-card-title">
                        المؤهلات العلمية والعضويات المهنية الموثقة
                      </h2>
                      <p className="cms-card-desc">
                        تُعرض في الصفحة الرئيسية وفي صفحة «عن الدكتورة».
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cms-btn cms-btn--sm"
                      onClick={() => {
                        setIsDirty(true);
                        setDoctorDraft({
                          ...doctorDraft,
                          credentials: [
                            ...doctorDraft.credentials,
                            {
                              id: `cred-${Date.now()}`,
                              label: {
                                ar: "مؤهل أو عضوية جديدة",
                                en: "New Qualification",
                              },
                              text: { ar: "", en: "" },
                            },
                          ],
                        });
                      }}
                    >
                      + إضافة مؤهل علمي
                    </button>
                  </div>

                  <div className="cms-section-list">
                    {doctorDraft.credentials.map((cred, cIdx) => (
                      <div key={cred.id} className="cms-section-row">
                        <div className="cms-section-row-top">
                          <strong>المؤهل 0{cIdx + 1}</strong>
                          <button
                            type="button"
                            className="cms-btn cms-btn--sm cms-btn--danger"
                            onClick={() => {
                              setIsDirty(true);
                              setDoctorDraft({
                                ...doctorDraft,
                                credentials: doctorDraft.credentials.filter(
                                  (_, i) => i !== cIdx
                                ),
                              });
                            }}
                          >
                            حذف المؤهل
                          </button>
                        </div>
                        <div className="cms-form-grid">
                          <div className="cms-field">
                            <label className="cms-label">
                              عنوان المؤهل ({activeLang === "ar" ? "العربية" : "English"})
                            </label>
                            <input
                              type="text"
                              dir={inputDir}
                              className="cms-input"
                              value={cred.label[activeLang]}
                              onChange={(e) => {
                                setIsDirty(true);
                                const next = doctorDraft.credentials.map(
                                  (item, i) =>
                                    i === cIdx
                                      ? {
                                          ...item,
                                          label: {
                                            ...item.label,
                                            [activeLang]: e.target.value,
                                          },
                                        }
                                      : item
                                );
                                setDoctorDraft({
                                  ...doctorDraft,
                                  credentials: next,
                                });
                              }}
                            />
                          </div>
                          <div className="cms-field">
                            <label className="cms-label">
                              تفاصيل المؤهل والجهة المانحة ({activeLang === "ar" ? "العربية" : "English"})
                            </label>
                            <input
                              type="text"
                              dir={inputDir}
                              className="cms-input"
                              value={cred.text[activeLang]}
                              onChange={(e) => {
                                setIsDirty(true);
                                const next = doctorDraft.credentials.map(
                                  (item, i) =>
                                    i === cIdx
                                      ? {
                                          ...item,
                                          text: {
                                            ...item.text,
                                            [activeLang]: e.target.value,
                                          },
                                        }
                                      : item
                                );
                                setDoctorDraft({
                                  ...doctorDraft,
                                  credentials: next,
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ==============================================================
                SECTION 4: SPECIALTIES (مجالات التخصص)
                ============================================================== */}
            {activeSection === "specialties" && (
              <>
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h2 className="cms-card-title">قائمة مجالات التخصص</h2>
                      <p className="cms-card-desc">
                        اختاري تخصصًا لتحريره أو أضيفي تخصصًا جديدًا. عند تغيير معرّف رابط (Slug) لتخصص منشور يتم إنشاء تحويل تلقائي (Redirect) للحفاظ على الروابط السابقة.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cms-btn cms-btn--sm cms-btn--primary"
                      onClick={handleCreateNewSpecialty}
                    >
                      + إضافة مجال تخصص جديد
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.6rem",
                    }}
                  >
                    {cmsState.specialties.map((spec) => (
                      <button
                        key={spec.id}
                        type="button"
                        className={`cms-btn ${
                          spec.id === selectedSpecialtyId
                            ? "cms-btn--primary"
                            : ""
                        }`}
                        onClick={() => handleSelectSpecialty(spec)}
                      >
                        <span>
                          {spec.displayOrder}. {spec.draft.title.ar}
                        </span>
                        <span
                          className={`cms-badge ${
                            spec.status === "published"
                              ? "cms-badge--published"
                              : "cms-badge--draft"
                          }`}
                        >
                          {spec.status === "published" ? "منشور" : "مسودة"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {renderLanguageBar(specialtyCompleteness)}

                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h3 className="cms-card-title">
                        تحرير التخصص: {specialtyDraft.title.ar || "تخصص جديد"}
                      </h3>
                      <p className="cms-card-desc">
                        الحالة الحالية:{" "}
                        <strong>
                          {selectedSpecialtyRecord?.status === "published"
                            ? "منشور على الموقع العام"
                            : "مسودة غير منشورة"}
                        </strong>
                      </p>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      <button
                        type="button"
                        disabled={saving}
                        className="cms-btn cms-btn--primary"
                        onClick={saveSpecialty}
                      >
                        حفظ مسودة التخصص
                      </button>

                      <button
                        type="button"
                        className="cms-btn"
                        onClick={() =>
                          handleOpenDraftPreview(
                            `/${activeLang}/specialties/${specialtyDraft.slug}`
                          )
                        }
                      >
                        معاينة المسودة ↖
                      </button>

                      {isOwner && (
                        <button
                          type="button"
                          disabled={saving}
                          className="cms-btn cms-btn--publish"
                          onClick={() =>
                            publishOrUnpublishSpecialty("publish")
                          }
                        >
                          نشر التخصص
                        </button>
                      )}

                      {isOwner &&
                        selectedSpecialtyRecord?.status === "published" && (
                          <button
                            type="button"
                            disabled={saving}
                            className="cms-btn cms-btn--danger"
                            onClick={() =>
                              setConfirmModal({
                                title: "تأكيد إلغاء نشر التخصص",
                                message:
                                  "هل أنتِ متأكدة من إلغاء نشر هذا التخصص وإخفائه من الموقع العام مع الاحتفاظ به كمسودة؟",
                                confirmLabel: "نعم، إلغاء النشر",
                                danger: true,
                                onConfirm: () =>
                                  publishOrUnpublishSpecialty("unpublish"),
                              })
                            }
                          >
                            إلغاء النشر
                          </button>
                        )}
                    </div>
                  </div>

                  <div className="cms-form-grid">
                    <div className="cms-field">
                      <label className="cms-label">
                        عنوان التخصص ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={specialtyDraft.title[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setSpecialtyDraft({
                            ...specialtyDraft,
                            title: {
                              ...specialtyDraft.title,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        <span>معرّف الرابط (URL Slug)</span>
                        <span className="cms-hint">
                          تغيير الرابط المنشور ينشئ تحويلًا تلقائيًا
                        </span>
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        className="cms-input"
                        value={specialtyDraft.slug}
                        onChange={(e) => {
                          setIsDirty(true);
                          setSpecialtyDraft({
                            ...specialtyDraft,
                            slug: e.target.value,
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">ترتيب العرض (Display Order)</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        className="cms-input"
                        value={specialtyOrder}
                        onChange={(e) => {
                          setIsDirty(true);
                          setSpecialtyOrder(Number(e.target.value) || 1);
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">الرقم التحريري الظاهر (مثل 01)</label>
                      <input
                        type="text"
                        dir="ltr"
                        className="cms-input"
                        value={specialtyDraft.numberLabel}
                        onChange={(e) => {
                          setIsDirty(true);
                          setSpecialtyDraft({
                            ...specialtyDraft,
                            numberLabel: e.target.value,
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        المقدمة المختصرة ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <textarea
                        dir={inputDir}
                        className="cms-textarea"
                        rows={2}
                        value={specialtyDraft.introduction[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setSpecialtyDraft({
                            ...specialtyDraft,
                            introduction: {
                              ...specialtyDraft.introduction,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        المحتوى التفصيلي للمجال ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <textarea
                        dir={inputDir}
                        className="cms-textarea"
                        rows={4}
                        value={specialtyDraft.fullContent[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setSpecialtyDraft({
                            ...specialtyDraft,
                            fullContent: {
                              ...specialtyDraft.fullContent,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        ملاحظة التقييم السريري الفردي ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={specialtyDraft.assessmentNote[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setSpecialtyDraft({
                            ...specialtyDraft,
                            assessmentNote: {
                              ...specialtyDraft.assessmentNote,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <FocalPointEditor
                      label="صورة غلاف التخصص ونقطة التركيز البصري"
                      imageUrl={specialtyDraft.coverImage}
                      imageAlt={specialtyDraft.imageAlt[activeLang]}
                      focalPoint={specialtyDraft.focalPoint}
                      onChangeImageUrl={(url) => {
                        setIsDirty(true);
                        setSpecialtyDraft({
                          ...specialtyDraft,
                          coverImage: url,
                        });
                      }}
                      onChangeFocalPoint={(fp) => {
                        setIsDirty(true);
                        setSpecialtyDraft({
                          ...specialtyDraft,
                          focalPoint: fp,
                        });
                      }}
                      onOpenMediaPicker={() =>
                        setMediaPickerCallback(() => (asset: CmsMediaAsset) => {
                          setIsDirty(true);
                          setSpecialtyDraft({
                            ...specialtyDraft,
                            coverImage: asset.publicUrl,
                            imageAlt: {
                              ar:
                                asset.altText.ar ||
                                specialtyDraft.imageAlt.ar,
                              en:
                                asset.altText.en ||
                                specialtyDraft.imageAlt.en,
                            },
                          });
                        })
                      }
                    />

                    <div className="cms-field">
                      <label className="cms-label">
                        النص البديل للصورة ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={specialtyDraft.imageAlt[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setSpecialtyDraft({
                            ...specialtyDraft,
                            imageAlt: {
                              ...specialtyDraft.imageAlt,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        التعليق البصري أسفل الصورة ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={specialtyDraft.visualCaption[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setSpecialtyDraft({
                            ...specialtyDraft,
                            visualCaption: {
                              ...specialtyDraft.visualCaption,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ==============================================================
                SECTION 5: ARTICLES (المقالات التوعوية)
                ============================================================== */}
            {activeSection === "articles" && (
              <>
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h2 className="cms-card-title">مكتبة المقالات التوعوية</h2>
                      <p className="cms-card-desc">
                        المقالات المنشورة فقط تظهر للزوار. المسودات غير المعتمدة طبيًا تبقى خاصة للمعاينة التحريرية فقط.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cms-btn cms-btn--sm cms-btn--primary"
                      onClick={handleCreateNewArticle}
                    >
                      + إنشاء مقال توعوي جديد
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.6rem",
                    }}
                  >
                    {cmsState.articles.map((art) => {
                      const rt = calculateBlocksReadingTime(
                        art.draft.locales.ar.blocks
                      );
                      return (
                        <button
                          key={art.id}
                          type="button"
                          className={`cms-btn ${
                            art.id === selectedArticleId
                              ? "cms-btn--primary"
                              : ""
                          }`}
                          onClick={() => handleSelectArticle(art)}
                        >
                          <span>{art.draft.locales.ar.title}</span>
                          <span
                            className={`cms-badge ${
                              art.status === "published"
                                ? "cms-badge--published"
                                : "cms-badge--draft"
                            }`}
                          >
                            {art.status === "published" ? "منشور" : "مسودة"} ·{" "}
                            {rt.labelAr}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {renderLanguageBar(articleCompleteness)}

                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h3 className="cms-card-title">
                        تحرير المقال:{" "}
                        {articleDraft.locales[activeLang].title ||
                          articleDraft.locales.ar.title}
                      </h3>
                      <p className="cms-card-desc">
                        الحالة:{" "}
                        <strong>
                          {selectedArticleRecord?.status === "published"
                            ? "منشور للزوار"
                            : "مسودة خاصة بانتظار الاعتماد"}
                        </strong>
                      </p>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      <button
                        type="button"
                        disabled={saving}
                        className="cms-btn cms-btn--primary"
                        onClick={saveArticle}
                      >
                        حفظ مسودة المقال
                      </button>

                      <button
                        type="button"
                        className="cms-btn"
                        onClick={() =>
                          handleOpenDraftPreview(
                            `/${activeLang}/articles/${articleDraft.slug}`
                          )
                        }
                      >
                        معاينة المقال كمسودة ↖
                      </button>

                      {isOwner && (
                        <button
                          type="button"
                          disabled={saving}
                          className="cms-btn cms-btn--publish"
                          onClick={() => publishOrUnpublishArticle("publish")}
                        >
                          نشر المقال
                        </button>
                      )}

                      {isOwner &&
                        selectedArticleRecord?.status === "published" && (
                          <button
                            type="button"
                            disabled={saving}
                            className="cms-btn cms-btn--danger"
                            onClick={() =>
                              setConfirmModal({
                                title: "تأكيد إلغاء نشر المقال",
                                message:
                                  "هل ترغبين في إلغاء نشر هذا المقال من الموقع العام وتحويله إلى مسودة؟",
                                confirmLabel: "نعم، إلغاء النشر",
                                danger: true,
                                onConfirm: () =>
                                  publishOrUnpublishArticle("unpublish"),
                              })
                            }
                          >
                            إلغاء النشر
                          </button>
                        )}
                    </div>
                  </div>

                  <div className="cms-form-grid">
                    <div className="cms-field">
                      <label className="cms-label">
                        عنوان المقال ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={articleDraft.locales[activeLang].title}
                        onChange={(e) => {
                          setIsDirty(true);
                          setArticleDraft({
                            ...articleDraft,
                            locales: {
                              ...articleDraft.locales,
                              [activeLang]: {
                                ...articleDraft.locales[activeLang],
                                title: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        <span>معرّف الرابط (Slug)</span>
                        <span className="cms-hint">
                          تغيير الرابط المنشور ينشئ تحويلًا تلقائيًا
                        </span>
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        className="cms-input"
                        value={articleDraft.slug}
                        onChange={(e) => {
                          setIsDirty(true);
                          setArticleDraft({
                            ...articleDraft,
                            slug: e.target.value,
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">تصنيف المقال</label>
                      <select
                        className="cms-select"
                        value={articleDraft.category}
                        onChange={(e) => {
                          setIsDirty(true);
                          setArticleDraft({
                            ...articleDraft,
                            category: e.target.value,
                          });
                        }}
                      >
                        <option value="consultation-prep">
                          الاستعداد للاستشارة (Consultation Preparation)
                        </option>
                        <option value="patient-education">
                          التوعية العامة (General Guidance)
                        </option>
                      </select>
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">تاريخ النشر / التحديث</label>
                      <input
                        type="date"
                        dir="ltr"
                        className="cms-input"
                        value={articleDraft.publishedAt || ""}
                        onChange={(e) => {
                          setIsDirty(true);
                          setArticleDraft({
                            ...articleDraft,
                            publishedAt: e.target.value || null,
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        الملخص التعريفي للمقال ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <textarea
                        dir={inputDir}
                        className="cms-textarea"
                        rows={2}
                        value={articleDraft.locales[activeLang].excerpt}
                        onChange={(e) => {
                          setIsDirty(true);
                          setArticleDraft({
                            ...articleDraft,
                            locales: {
                              ...articleDraft.locales,
                              [activeLang]: {
                                ...articleDraft.locales[activeLang],
                                excerpt: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        جهة الإعداد / الكاتب ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={articleDraft.locales[activeLang].authorName}
                        onChange={(e) => {
                          setIsDirty(true);
                          setArticleDraft({
                            ...articleDraft,
                            locales: {
                              ...articleDraft.locales,
                              [activeLang]: {
                                ...articleDraft.locales[activeLang],
                                authorName: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        المراجع الطبي المعتمد — اختياري ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        placeholder={
                          activeLang === "ar"
                            ? "مثال: د. ملاك السيف"
                            : "e.g., Dr. Malak Alsaif"
                        }
                        value={articleDraft.locales[activeLang].reviewedBy}
                        onChange={(e) => {
                          setIsDirty(true);
                          setArticleDraft({
                            ...articleDraft,
                            locales: {
                              ...articleDraft.locales,
                              [activeLang]: {
                                ...articleDraft.locales[activeLang],
                                reviewedBy: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>

                    <FocalPointEditor
                      label="صورة غلاف المقال ونقطة التركيز البصري"
                      imageUrl={articleDraft.coverImage}
                      imageAlt={articleDraft.locales[activeLang].coverAlt}
                      focalPoint={articleDraft.coverFocalPoint}
                      onChangeImageUrl={(url) => {
                        setIsDirty(true);
                        setArticleDraft({
                          ...articleDraft,
                          coverImage: url,
                        });
                      }}
                      onChangeFocalPoint={(fp) => {
                        setIsDirty(true);
                        setArticleDraft({
                          ...articleDraft,
                          coverFocalPoint: fp,
                        });
                      }}
                      onOpenMediaPicker={() =>
                        setMediaPickerCallback(() => (asset: CmsMediaAsset) => {
                          setIsDirty(true);
                          setArticleDraft({
                            ...articleDraft,
                            coverImage: asset.publicUrl,
                            socialImage: asset.publicUrl,
                          });
                        })
                      }
                    />

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        النص البديل لصورة الغلاف ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={articleDraft.locales[activeLang].coverAlt}
                        onChange={(e) => {
                          setIsDirty(true);
                          setArticleDraft({
                            ...articleDraft,
                            locales: {
                              ...articleDraft.locales,
                              [activeLang]: {
                                ...articleDraft.locales[activeLang],
                                coverAlt: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>

                    {/* Structured Rich-Text Editor */}
                    <RichTextBlocksEditor
                      locale={activeLang}
                      blocks={articleDraft.locales[activeLang].blocks}
                      onChange={(nextBlocks) => {
                        setIsDirty(true);
                        setArticleDraft({
                          ...articleDraft,
                          locales: {
                            ...articleDraft.locales,
                            [activeLang]: {
                              ...articleDraft.locales[activeLang],
                              blocks: nextBlocks,
                            },
                          },
                        });
                      }}
                      onPickBlockImage={(blockIdx) => {
                        setMediaPickerCallback(() => (asset: CmsMediaAsset) => {
                          setIsDirty(true);
                          const currentBlocks = [
                            ...articleDraft.locales[activeLang].blocks,
                          ];
                          if (currentBlocks[blockIdx]) {
                            currentBlocks[blockIdx] = {
                              ...currentBlocks[blockIdx],
                              imageUrl: asset.publicUrl,
                              imageAlt:
                                asset.altText[activeLang] ||
                                currentBlocks[blockIdx].imageAlt ||
                                "",
                            };
                            setArticleDraft({
                              ...articleDraft,
                              locales: {
                                ...articleDraft.locales,
                                [activeLang]: {
                                  ...articleDraft.locales[activeLang],
                                  blocks: currentBlocks,
                                },
                              },
                            });
                          }
                        });
                      }}
                    />

                    {/* Article SEO Fields */}
                    <div className="cms-field">
                      <label className="cms-label">
                        عنوان محركات البحث SEO ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={articleDraft.locales[activeLang].seoTitle}
                        onChange={(e) => {
                          setIsDirty(true);
                          setArticleDraft({
                            ...articleDraft,
                            locales: {
                              ...articleDraft.locales,
                              [activeLang]: {
                                ...articleDraft.locales[activeLang],
                                seoTitle: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        صورة المشاركة الاجتماعية (Social Image URL)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        className="cms-input"
                        value={articleDraft.socialImage}
                        onChange={(e) => {
                          setIsDirty(true);
                          setArticleDraft({
                            ...articleDraft,
                            socialImage: e.target.value,
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        وصف محركات البحث SEO ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <textarea
                        dir={inputDir}
                        className="cms-textarea"
                        rows={2}
                        value={articleDraft.locales[activeLang].seoDescription}
                        onChange={(e) => {
                          setIsDirty(true);
                          setArticleDraft({
                            ...articleDraft,
                            locales: {
                              ...articleDraft.locales,
                              [activeLang]: {
                                ...articleDraft.locales[activeLang],
                                seoDescription: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ==============================================================
                SECTION 6: FAQ (الأسئلة الشائعة)
                ============================================================== */}
            {activeSection === "faq" && (
              <>
                {renderLanguageBar(faqCompleteness)}

                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h2 className="cms-card-title">
                        إدارة الأسئلة الشائعة وترتيبها
                      </h2>
                      <p className="cms-card-desc">
                        تعديل الأسئلة والإجابات وترتيبها وإظهارها أو إخفائها في الصفحة الرئيسية وصفحة التواصل.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className="cms-btn"
                        onClick={() => {
                          setIsDirty(true);
                          const nextOrder = faqDraft.items.length + 1;
                          setFaqDraft({
                            ...faqDraft,
                            items: [
                              ...faqDraft.items,
                              {
                                id: `faq-${Date.now()}`,
                                order: nextOrder,
                                visible: true,
                                question: { ar: "سؤال شائع جديد؟", en: "" },
                                answer: { ar: "إجابة السؤال هنا...", en: "" },
                              },
                            ],
                          });
                        }}
                      >
                        + إضافة سؤال جديد
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        className="cms-btn cms-btn--primary"
                        onClick={() => saveDocument("faq", faqDraft)}
                      >
                        حفظ المسودة
                      </button>

                      {isOwner && (
                        <button
                          type="button"
                          disabled={saving}
                          className="cms-btn cms-btn--publish"
                          onClick={() => publishDocumentNow("faq", faqDraft)}
                        >
                          نشر الأسئلة الشائعة
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="cms-section-list">
                    {faqDraft.items.map((item, idx) => (
                      <div key={item.id} className="cms-section-row">
                        <div className="cms-section-row-top">
                          <strong>السؤال 0{idx + 1}</strong>

                          <div className="cms-section-controls">
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={item.visible}
                                onChange={(e) => {
                                  setIsDirty(true);
                                  const next = faqDraft.items.map((it, i) =>
                                    i === idx
                                      ? { ...it, visible: e.target.checked }
                                      : it
                                  );
                                  setFaqDraft({ ...faqDraft, items: next });
                                }}
                              />
                              <span>{item.visible ? "ظاهر" : "مخفي"}</span>
                            </label>

                            <button
                              type="button"
                              className="cms-btn cms-btn--sm"
                              disabled={idx === 0}
                              onClick={() => {
                                setIsDirty(true);
                                const next = [...faqDraft.items];
                                const [moved] = next.splice(idx, 1);
                                next.splice(idx - 1, 0, moved);
                                setFaqDraft({
                                  ...faqDraft,
                                  items: next.map((it, i) => ({
                                    ...it,
                                    order: i + 1,
                                  })),
                                });
                              }}
                            >
                              ↑
                            </button>

                            <button
                              type="button"
                              className="cms-btn cms-btn--sm"
                              disabled={idx === faqDraft.items.length - 1}
                              onClick={() => {
                                setIsDirty(true);
                                const next = [...faqDraft.items];
                                const [moved] = next.splice(idx, 1);
                                next.splice(idx + 1, 0, moved);
                                setFaqDraft({
                                  ...faqDraft,
                                  items: next.map((it, i) => ({
                                    ...it,
                                    order: i + 1,
                                  })),
                                });
                              }}
                            >
                              ↓
                            </button>

                            <button
                              type="button"
                              className="cms-btn cms-btn--sm cms-btn--danger"
                              onClick={() =>
                                setConfirmModal({
                                  title: "حذف السؤال الشائع",
                                  message:
                                    "هل أنتِ متأكدة من حذف هذا السؤال من المسودة الحالية؟",
                                  confirmLabel: "نعم، حذف السؤال",
                                  danger: true,
                                  onConfirm: () => {
                                    setIsDirty(true);
                                    setFaqDraft({
                                      ...faqDraft,
                                      items: faqDraft.items
                                        .filter((_, i) => i !== idx)
                                        .map((it, i) => ({
                                          ...it,
                                          order: i + 1,
                                        })),
                                    });
                                  },
                                })
                              }
                            >
                              حذف
                            </button>
                          </div>
                        </div>

                        <div className="cms-form-grid">
                          <div className="cms-field cms-field--full">
                            <label className="cms-label">
                              نص السؤال ({activeLang === "ar" ? "العربية" : "English"})
                            </label>
                            <input
                              type="text"
                              dir={inputDir}
                              className="cms-input"
                              value={item.question[activeLang]}
                              onChange={(e) => {
                                setIsDirty(true);
                                const next = faqDraft.items.map((it, i) =>
                                  i === idx
                                    ? {
                                        ...it,
                                        question: {
                                          ...it.question,
                                          [activeLang]: e.target.value,
                                        },
                                      }
                                    : it
                                );
                                setFaqDraft({ ...faqDraft, items: next });
                              }}
                            />
                          </div>

                          <div className="cms-field cms-field--full">
                            <label className="cms-label">
                              نص الإجابة ({activeLang === "ar" ? "العربية" : "English"})
                            </label>
                            <textarea
                              dir={inputDir}
                              className="cms-textarea"
                              rows={2}
                              value={item.answer[activeLang]}
                              onChange={(e) => {
                                setIsDirty(true);
                                const next = faqDraft.items.map((it, i) =>
                                  i === idx
                                    ? {
                                        ...it,
                                        answer: {
                                          ...it.answer,
                                          [activeLang]: e.target.value,
                                        },
                                      }
                                    : it
                                );
                                setFaqDraft({ ...faqDraft, items: next });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ==============================================================
                SECTION 7: MEDIA LIBRARY (مكتبة الوسائط)
                ============================================================== */}
            {activeSection === "media" && (
              <>
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h2 className="cms-card-title">رفع صورة جديدة</h2>
                      <p className="cms-card-desc">
                        الصيغ المسموحة: JPG و PNG و WebP (بحد أقصى 5 ميجابايت). يُمنع رفع ملفات SVG أو الملفات التنفيذية. تُحفظ الصور الجديدة في مساحة خاصة حتى يُنشر المحتوى المرتبط بها.
                      </p>
                    </div>
                  </div>

                  <div className="cms-form-grid">
                    <div className="cms-field">
                      <label className="cms-label">
                        النص البديل بالعربية (Alt Text)
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        className="cms-input"
                        placeholder="وصف موجز للصورة..."
                        value={uploadAltAr}
                        onChange={(e) => setUploadAltAr(e.target.value)}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        النص البديل بالإنجليزية (English Alt Text)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        className="cms-input"
                        placeholder="Concise description of the image..."
                        value={uploadAltEn}
                        onChange={(e) => setUploadAltEn(e.target.value)}
                      />
                    </div>

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        <span>اختيار ملف الصورة للرفع</span>
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingMedia}
                        onChange={handleUploadFile}
                        className="cms-input"
                      />
                      {uploadingMedia && (
                        <span className="cms-hint">
                          جاري فحص أبعاد الصورة ورفعها...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selected Media Inspector */}
                {selectedMediaRecord && (
                  <div className="cms-card">
                    <div className="cms-card-header">
                      <div>
                        <h3 className="cms-card-title">
                          خصائص الصورة المحددة: {selectedMediaRecord.originalName}
                        </h3>
                        <p className="cms-card-desc">
                          الأبعاد الفعلية:{" "}
                          <strong dir="ltr">
                            {selectedMediaRecord.width} ×{" "}
                            {selectedMediaRecord.height} px
                          </strong>{" "}
                          · الحجم:{" "}
                          <strong dir="ltr">
                            {Math.round(selectedMediaRecord.sizeBytes / 1024)}{" "}
                            KB
                          </strong>{" "}
                          · الحالة:{" "}
                          <span
                            className={`cms-badge ${
                              selectedMediaRecord.isPublic
                                ? "cms-badge--published"
                                : "cms-badge--draft"
                            }`}
                          >
                            {selectedMediaRecord.isPublic
                              ? "عامة (مرتبطة بمحتوى منشور)"
                              : "خاصة بالمسودات"}
                          </span>
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          disabled={saving}
                          className="cms-btn cms-btn--primary"
                          onClick={() =>
                            handleUpdateMediaMeta(selectedMediaRecord)
                          }
                        >
                          حفظ بيانات الصورة
                        </button>

                        {isOwner && (
                          <button
                            type="button"
                            disabled={saving}
                            className="cms-btn cms-btn--danger"
                            onClick={() =>
                              setConfirmModal({
                                title: "تأكيد حذف الصورة",
                                message:
                                  "سيتم التحقق أولًا من عدم ارتباط الصورة بأي محتوى منشور قبل الحذف. هل ترغبين في المتابعة؟",
                                confirmLabel: "نعم، حذف الصورة",
                                danger: true,
                                onConfirm: () =>
                                  handleDeleteMedia(selectedMediaRecord.id),
                              })
                            }
                          >
                            حذف الصورة
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="cms-form-grid">
                      <div className="cms-field">
                        <label className="cms-label">
                          النص البديل (العربية)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          className="cms-input"
                          value={selectedMediaRecord.altText.ar}
                          onChange={(e) => {
                            const nextAssets = cmsState.mediaAssets.map((m) =>
                              m.id === selectedMediaRecord.id
                                ? {
                                    ...m,
                                    altText: {
                                      ...m.altText,
                                      ar: e.target.value,
                                    },
                                  }
                                : m
                            );
                            setCmsState({
                              ...cmsState,
                              mediaAssets: nextAssets,
                            });
                          }}
                        />
                      </div>

                      <div className="cms-field">
                        <label className="cms-label">
                          النص البديل (English)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          className="cms-input"
                          value={selectedMediaRecord.altText.en}
                          onChange={(e) => {
                            const nextAssets = cmsState.mediaAssets.map((m) =>
                              m.id === selectedMediaRecord.id
                                ? {
                                    ...m,
                                    altText: {
                                      ...m.altText,
                                      en: e.target.value,
                                    },
                                  }
                                : m
                            );
                            setCmsState({
                              ...cmsState,
                              mediaAssets: nextAssets,
                            });
                          }}
                        />
                      </div>

                      <FocalPointEditor
                        label="معاينة الصورة ونقطة التركيز البصري"
                        imageUrl={selectedMediaRecord.publicUrl}
                        imageAlt={selectedMediaRecord.altText.ar}
                        focalPoint={selectedMediaRecord.focalPoint}
                        onChangeFocalPoint={(fp) => {
                          const nextAssets = cmsState.mediaAssets.map((m) =>
                            m.id === selectedMediaRecord.id
                              ? { ...m, focalPoint: fp }
                              : m
                          );
                          setCmsState({
                            ...cmsState,
                            mediaAssets: nextAssets,
                          });
                        }}
                      />

                      <div className="cms-field cms-field--full">
                        <label className="cms-label">
                          <span>استبدال ملف الصورة بنسخة محدثة (دون الكتابة التدميرية على الأصل)</span>
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="cms-input"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleReplaceMediaBinary(
                                selectedMediaRecord.id,
                                f
                              );
                              e.target.value = "";
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Media Grid */}
                <div className="cms-card">
                  <div className="cms-card-header">
                    <h3 className="cms-card-title">
                      جميع الصور في المكتبة ({cmsState.mediaAssets.length})
                    </h3>
                  </div>

                  <div className="cms-media-grid">
                    {cmsState.mediaAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className={`cms-media-card ${
                          asset.id === selectedMediaId ? "is-selected" : ""
                        }`}
                      >
                        <div className="cms-media-thumb-wrap">
                          <img
                            src={asset.publicUrl}
                            alt={asset.altText.ar || asset.originalName}
                            className="cms-media-thumb"
                            style={{
                              objectPosition: `${asset.focalPoint.x}% ${asset.focalPoint.y}%`,
                            }}
                          />
                        </div>
                        <div className="cms-media-body">
                          <strong>{asset.originalName}</strong>
                          <span style={{ color: "var(--cms-ink-muted)" }} dir="ltr">
                            {asset.width} × {asset.height} px ·{" "}
                            {Math.round(asset.sizeBytes / 1024)} KB
                          </span>
                          <span
                            className={`cms-badge ${
                              asset.isPublic
                                ? "cms-badge--published"
                                : "cms-badge--draft"
                            }`}
                          >
                            {asset.isPublic ? "عام" : "خاص بالمسودات"}
                          </span>
                          <button
                            type="button"
                            className="cms-btn cms-btn--sm"
                            onClick={() => setSelectedMediaId(asset.id)}
                          >
                            تحرير الخصائص ونقطة التركيز
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ==============================================================
                SECTION 8: CONTACT & SITE SETTINGS (بيانات التواصل وإعدادات الموقع)
                ============================================================== */}
            {activeSection === "contact" && (
              <>
                {renderLanguageBar(contactCompleteness)}

                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h2 className="cms-card-title">
                        قنوات التنسيق الرسمية وبيانات الموقع
                      </h2>
                      <p className="cms-card-desc">
                        الحقول الاختيارية (العنوان، أوقات العمل، رابط الخريطة) لا تظهر في الموقع العام إلا عند إدخالها هنا.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        disabled={saving}
                        className="cms-btn cms-btn--primary"
                        onClick={() =>
                          saveDocument("contactSettings", contactDraft)
                        }
                      >
                        حفظ المسودة
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          disabled={saving}
                          className="cms-btn cms-btn--publish"
                          onClick={() =>
                            publishDocumentNow("contactSettings", contactDraft)
                          }
                        >
                          نشر إعدادات التواصل
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="cms-form-grid">
                    <div className="cms-field">
                      <label className="cms-label">
                        اسم الموقع ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={contactDraft.siteName[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            siteName: {
                              ...contactDraft.siteName,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        المسمى التخصصي ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={contactDraft.siteSubtitle[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            siteSubtitle: {
                              ...contactDraft.siteSubtitle,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">رقم هاتف التنسيق</label>
                      <input
                        type="text"
                        dir="ltr"
                        className="cms-input"
                        value={contactDraft.phone}
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            phone: e.target.value,
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        رقم واتساب للتنسيق (أرقام فقط مع مفتاح الدولة)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        className="cms-input"
                        value={contactDraft.whatsappDigits}
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            whatsappDigits: e.target.value,
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">رابط حساب إنستجرام الرسمي</label>
                      <input
                        type="url"
                        dir="ltr"
                        className="cms-input"
                        value={contactDraft.instagramUrl}
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            instagramUrl: e.target.value,
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">معرّف إنستجرام الظاهر</label>
                      <input
                        type="text"
                        dir="ltr"
                        className="cms-input"
                        value={contactDraft.instagramHandle}
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            instagramHandle: e.target.value,
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        الرسالة التلقائية المبدئية عند فتح واتساب ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={contactDraft.defaultWhatsappMessage[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            defaultWhatsappMessage: {
                              ...contactDraft.defaultWhatsappMessage,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    {/* Optional Address, Working Hours & Map Link */}
                    <div className="cms-field">
                      <label className="cms-label">
                        <span>
                          العنوان — اختياري ({activeLang === "ar" ? "العربية" : "English"})
                        </span>
                        <span className="cms-hint">
                          يظهر في الموقع فقط عند تعبئته
                        </span>
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        placeholder={
                          activeLang === "ar"
                            ? "اتركيه فارغًا لإخفائه من الموقع العام"
                            : "Leave blank to hide on public site"
                        }
                        value={contactDraft.address[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            address: {
                              ...contactDraft.address,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        <span>
                          أوقات العمل والتنسيق — اختياري ({activeLang === "ar" ? "العربية" : "English"})
                        </span>
                        <span className="cms-hint">
                          تظهر في الموقع فقط عند تعبئتها
                        </span>
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        placeholder={
                          activeLang === "ar"
                            ? "اتركيه فارغًا لإخفائه من الموقع العام"
                            : "Leave blank to hide on public site"
                        }
                        value={contactDraft.workingHours[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            workingHours: {
                              ...contactDraft.workingHours,
                              [activeLang]: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        <span>رابط الخريطة (Google Maps URL — اختياري)</span>
                        <span className="cms-hint">
                          يظهر فقط عند إدخال رابط صحيح
                        </span>
                      </label>
                      <input
                        type="url"
                        dir="ltr"
                        className="cms-input"
                        placeholder="https://maps.google.com/..."
                        value={contactDraft.mapUrl}
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            mapUrl: e.target.value,
                          });
                        }}
                      />
                    </div>

                    {/* Global Default SEO */}
                    <div className="cms-field">
                      <label className="cms-label">
                        العنوان الافتراضي لمحركات البحث SEO ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <input
                        type="text"
                        dir={inputDir}
                        className="cms-input"
                        value={contactDraft.globalSeo.defaultTitle[activeLang]}
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            globalSeo: {
                              ...contactDraft.globalSeo,
                              defaultTitle: {
                                ...contactDraft.globalSeo.defaultTitle,
                                [activeLang]: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field">
                      <label className="cms-label">
                        صورة المشاركة الافتراضية (Default Social Image)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        className="cms-input"
                        value={contactDraft.globalSeo.socialImage}
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            globalSeo: {
                              ...contactDraft.globalSeo,
                              socialImage: e.target.value,
                            },
                          });
                        }}
                      />
                    </div>

                    <div className="cms-field cms-field--full">
                      <label className="cms-label">
                        الوصف الافتراضي لمحركات البحث SEO ({activeLang === "ar" ? "العربية" : "English"})
                      </label>
                      <textarea
                        dir={inputDir}
                        className="cms-textarea"
                        rows={2}
                        value={
                          contactDraft.globalSeo.defaultDescription[activeLang]
                        }
                        onChange={(e) => {
                          setIsDirty(true);
                          setContactDraft({
                            ...contactDraft,
                            globalSeo: {
                              ...contactDraft.globalSeo,
                              defaultDescription: {
                                ...contactDraft.globalSeo.defaultDescription,
                                [activeLang]: e.target.value,
                              },
                            },
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ==============================================================
                SECTION 9: REVISION HISTORY & USER MANAGEMENT (سجل الإصدارات)
                ============================================================== */}
            {activeSection === "revisions" && (
              <>
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div>
                      <h2 className="cms-card-title">
                        سجل الإصدارات والاستعادة الآمنة
                      </h2>
                      <p className="cms-card-desc">
                        تُستعاد أي نسخة سابقة كمسودة جديدة قابلة للمراجعة قبل النشر، مع الحفاظ التام على جميع السجلات السابقة.
                      </p>
                    </div>
                  </div>

                  <div className="cms-table-wrap">
                    <table className="cms-table">
                      <thead>
                        <tr>
                          <th>العنصر</th>
                          <th>نوع العملية</th>
                          <th>الوصف</th>
                          <th>المستخدم</th>
                          <th>التاريخ والوقت</th>
                          <th>الاستعادة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cmsState.revisions.map((rev) => (
                          <tr key={rev.id}>
                            <td>
                              <strong>{rev.entityTitle}</strong>
                            </td>
                            <td>
                              <span
                                className={`cms-badge ${
                                  rev.action === "publish"
                                    ? "cms-badge--published"
                                    : "cms-badge--draft"
                                }`}
                              >
                                {ACTION_LABELS[rev.action] || rev.action}
                              </span>
                            </td>
                            <td>{rev.summary}</td>
                            <td dir="ltr">{rev.actorEmail}</td>
                            <td dir="ltr">
                              {rev.createdAt.slice(0, 16).replace("T", " ")}
                            </td>
                            <td>
                              {isOwner ? (
                                <button
                                  type="button"
                                  disabled={saving}
                                  className="cms-btn cms-btn--sm"
                                  onClick={() =>
                                    setConfirmModal({
                                      title: "استعادة الإصدار كمسودة",
                                      message: `هل ترغبين في استعادة إصدار «${rev.entityTitle}» المؤرخ في ${rev.createdAt
                                        .slice(0, 16)
                                        .replace(
                                          "T",
                                          " "
                                        )} كمسودة جديدة دون تغيير الموقع العام المنشور؟`,
                                      confirmLabel: "نعم، استعادة كمسودة",
                                      onConfirm: () =>
                                        handleRestoreRevision(rev.id),
                                    })
                                  }
                                >
                                  استعادة كمسودة
                                </button>
                              ) : (
                                <span className="cms-hint">للمالك فقط</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Automatic Slug Redirects Ledger */}
                {cmsState.redirects.length > 0 && (
                  <div className="cms-card">
                    <div className="cms-card-header">
                      <div>
                        <h3 className="cms-card-title">
                          التحويلات التلقائية للروابط (Automatic URL Redirects)
                        </h3>
                        <p className="cms-card-desc">
                          الروابط القديمة التي تم تعديل معرّفاتها وتحوّل الزوار تلقائيًا إلى الرابط الجديد.
                        </p>
                      </div>
                    </div>
                    <div className="cms-table-wrap">
                      <table className="cms-table">
                        <thead>
                          <tr>
                            <th>النوع</th>
                            <th>الرابط القديم</th>
                            <th>الرابط الجديد</th>
                            <th>تاريخ الإنشاء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cmsState.redirects.map((r) => (
                            <tr key={r.id}>
                              <td>
                                {r.entityType === "article"
                                  ? "مقال توعوي"
                                  : "مجال تخصص"}
                              </td>
                              <td dir="ltr">{r.fromSlug}</td>
                              <td dir="ltr">{r.toSlug}</td>
                              <td dir="ltr">{r.createdAt.slice(0, 10)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Owner-Only User & Role Management */}
                {isOwner && (
                  <div className="cms-card">
                    <div className="cms-card-header">
                      <div>
                        <h3 className="cms-card-title">
                          إدارة المستخدمين المصرح لهم (للمالك فقط)
                        </h3>
                        <p className="cms-card-desc">
                          إضافة أو تحديث حسابات المالك (Owner) والمحررين (Editor). لا يُسمح بالتسجيل العام.
                        </p>
                      </div>
                    </div>

                    <div className="cms-table-wrap">
                      <table className="cms-table">
                        <thead>
                          <tr>
                            <th>الاسم</th>
                            <th>البريد الإلكتروني</th>
                            <th>الدور والصلاحية</th>
                            <th>الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cmsState.users.map((u) => (
                            <tr key={u.id}>
                              <td>
                                <strong>{u.displayName}</strong>
                              </td>
                              <td dir="ltr">{u.email}</td>
                              <td>
                                <span
                                  className={`cms-badge ${
                                    u.role === "owner"
                                      ? "cms-badge--published"
                                      : "cms-badge--draft"
                                  }`}
                                >
                                  {u.role === "owner"
                                    ? "مالك (نشر كامل وإدارة)"
                                    : "محرر (إعداد مسودات ومعاينة)"}
                                </span>
                              </td>
                              <td>{u.isActive ? "مفعّل" : "موقوف"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="cms-form-grid" style={{ marginTop: "0.75rem" }}>
                      <div className="cms-field">
                        <label className="cms-label">البريد الإلكتروني</label>
                        <input
                          type="email"
                          dir="ltr"
                          className="cms-input"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                        />
                      </div>
                      <div className="cms-field">
                        <label className="cms-label">الاسم الظاهر</label>
                        <input
                          type="text"
                          className="cms-input"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                        />
                      </div>
                      <div className="cms-field">
                        <label className="cms-label">
                          كلمة المرور (8 خانات على الأقل)
                        </label>
                        <input
                          type="password"
                          dir="ltr"
                          className="cms-input"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                        />
                      </div>
                      <div className="cms-field">
                        <label className="cms-label">الدور الوظيفي</label>
                        <select
                          className="cms-select"
                          value={newUserRole}
                          onChange={(e) =>
                            setNewUserRole(
                              e.target.value === "owner" ? "owner" : "editor"
                            )
                          }
                        >
                          <option value="editor">
                            محرر (Editor — إعداد المسودات والمعاينة فقط)
                          </option>
                          <option value="owner">
                            مالك (Owner — صلاحية النشر الكاملة وإدارة المستخدمين)
                          </option>
                        </select>
                      </div>
                      <div className="cms-field cms-field--full">
                        <button
                          type="button"
                          disabled={saving}
                          className="cms-btn cms-btn--primary"
                          onClick={async () => {
                            setSaving(true);
                            setStatusBanner(null);
                            try {
                              const res = await fetch("/api/cms/users", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  email: newUserEmail,
                                  displayName: newUserName,
                                  password: newUserPassword,
                                  role: newUserRole,
                                }),
                              });
                              const data = await res.json();
                              if (!res.ok) {
                                setStatusBanner({
                                  type: "error",
                                  text: data.error || "تعذر حفظ المستخدم.",
                                });
                                setSaving(false);
                                return;
                              }
                              setNewUserEmail("");
                              setNewUserName("");
                              setNewUserPassword("");
                              await refreshCmsState();
                              setStatusBanner({
                                type: "success",
                                text: data.message,
                              });
                            } catch {
                              setStatusBanner({
                                type: "error",
                                text: "تعذر الاتصال بالخادم.",
                              });
                            } finally {
                              setSaving(false);
                            }
                          }}
                        >
                          حفظ المستخدم والصلاحية
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      {mediaPickerCallback && (
        <div
          className="cms-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="اختيار صورة من مكتبة الوسائط"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMediaPickerCallback(null);
            }
          }}
        >
          <div className="cms-modal">
            <div className="cms-card-header">
              <h3 className="cms-card-title">اختيار صورة من مكتبة الوسائط</h3>
              <button
                type="button"
                className="cms-btn cms-btn--sm"
                onClick={() => setMediaPickerCallback(null)}
              >
                إغلاق
              </button>
            </div>

            <div className="cms-media-grid">
              {cmsState.mediaAssets.map((asset) => (
                <div key={asset.id} className="cms-media-card">
                  <div className="cms-media-thumb-wrap">
                    <img
                      src={asset.publicUrl}
                      alt={asset.altText.ar || asset.originalName}
                      className="cms-media-thumb"
                    />
                  </div>
                  <div className="cms-media-body">
                    <strong>{asset.originalName}</strong>
                    <span dir="ltr">
                      {asset.width} × {asset.height} px
                    </span>
                    <button
                      type="button"
                      className="cms-btn cms-btn--sm cms-btn--primary"
                      onClick={() => {
                        mediaPickerCallback(asset);
                        setMediaPickerCallback(null);
                      }}
                    >
                      اختيار هذه الصورة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Destructive / Important Actions */}
      {confirmModal && (
        <div
          className="cms-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={confirmModal.title}
        >
          <div className="cms-modal cms-modal--narrow">
            <h3 className="cms-card-title">{confirmModal.title}</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--cms-ink-secondary)" }}>
              {confirmModal.message}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.6rem",
                marginTop: "0.5rem",
              }}
            >
              <button
                type="button"
                className="cms-btn"
                onClick={() => setConfirmModal(null)}
              >
                تراجع
              </button>
              <button
                type="button"
                className={`cms-btn ${
                  confirmModal.danger ? "cms-btn--danger" : "cms-btn--primary"
                }`}
                onClick={async () => {
                  const fn = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await fn();
                }}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
