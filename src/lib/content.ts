import siteConfigData from "../../content/site-config.json";
import siteCopyData from "../../content/site-copy.json";
import type { Locale } from "./locales";
import { formatReadingTime } from "./arabic-search";

export interface SiteConfig {
  name: Record<Locale, string>;
  subtitle: Record<Locale, string>;
  contact: {
    phone: string;
    whatsappDigits: string;
    instagram: string;
  };
  siteUrl: string | null;
  previewNoIndex: boolean;
  doctorPortrait: string | null;
  approvedLogo: string | null;
  approvedLogoReversed?: string | null;
  defaultSocialImage?: string | null;
  fontsStatus: string;
  collectsLeadForms: boolean;
}

export const siteConfig: SiteConfig = siteConfigData;
export const rawSiteCopy = siteCopyData;

export interface SpecialtyDetail {
  id: string;
  number: string;
  title: string;
  tabLabel: string;
  summary: string;
  detail: string;
  assessmentNote: string;
  visualCaption: string;
  image: string;
  imageAlt: string;
  whatsappEnquiryMessage: string;
  ctaLabel: string;
}

export interface JourneyStep {
  number: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  caption: string;
}

export interface PageMetadataCopy {
  title: string;
  description: string;
}

export interface DialogTopicOption {
  id: string;
  label: string;
  description: string;
  message: string;
}

export interface ExtendedLocaleCopy {
  nav: {
    home: string;
    about: string;
    specialties: string;
    articles: string;
    contact: string;
    privacy: string;
  };
  a11y: {
    skipToContent: string;
    mainNavLabel: string;
    footerNavLabel: string;
    breadcrumbLabel: string;
    openMenu: string;
    closeMenu: string;
    switchLanguageLabel: string;
    switchLanguageText: string;
    externalLinkNote: string;
  };
  header: {
    cta: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    body: string;
    primary: string;
    secondary: string;
    directWhatsappLabel: string;
    portraitAlt: string;
    portraitCaption: string;
    editorialNote: string;
    coordinationNote: string;
  };
  consultationDialog: {
    eyebrow: string;
    title: string;
    step1Title: string;
    step1Subtitle: string;
    step2Title: string;
    step2Subtitle: string;
    messageLabel: string;
    privacyReminder: string;
    nextButton: string;
    backButton: string;
    continueWhatsappButton: string;
    directWhatsappFallback: string;
    closeButtonLabel: string;
    stepIndicator: (current: number, total: number) => string;
    topics: DialogTopicOption[];
  };
  credentialsSection: {
    eyebrow: string;
    title: string;
    note: string;
    items: Array<{
      label: string;
      text: string;
    }>;
  };
  aboutPreview: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    instagramLabel: string;
    instagramNote: string;
  };
  specialtiesSection: {
    eyebrow: string;
    title: string;
    intro: string;
    tabsAriaLabel: string;
    viewAllCta: string;
    directWhatsappCta: string;
    visualAlt: string;
    items: SpecialtyDetail[];
  };
  journeySection: {
    eyebrow: string;
    title: string;
    subtitle: string;
    note: string;
    steps: JourneyStep[];
    cta: string;
  };
  articlesPreviewSection: {
    eyebrow: string;
    title: string;
    subtitle: string;
    emptyNote: string;
    hubLinkLabel: string;
    readArticleLabel: string;
  };
  faqSection: {
    eyebrow: string;
    title: string;
    intro: string;
    items: Array<{
      q: string;
      a: string;
    }>;
  };
  contactCta: {
    eyebrow: string;
    title: string;
    body: string;
    primaryWhatsapp: string;
    directWhatsappLinkLabel: string;
    secondaryCall: string;
    instagramLink: string;
    phoneLabel: string;
  };
  aboutPage: {
    meta: PageMetadataCopy;
    eyebrow: string;
    title: string;
    lead: string;
    portraitAlt: string;
    portraitCaption: string;
    biographyTitle: string;
    biographyParagraphs: string[];
    credentialsTitle: string;
    credentialsSubtitle: string;
    approachEyebrow: string;
    approachTitle: string;
    approachPillars: Array<{
      title: string;
      body: string;
    }>;
    editorialNotice: string;
  };
  specialtiesPage: {
    meta: PageMetadataCopy;
    eyebrow: string;
    title: string;
    lead: string;
    scopeNoteTitle: string;
    scopeNoteBody: string;
    consultationContextTitle: string;
    consultationContextPoints: string[];
  };
  articlesPage: {
    meta: PageMetadataCopy;
    eyebrow: string;
    title: string;
    lead: string;
    searchLabel: string;
    searchPlaceholder: string;
    categoryFilterLabel: string;
    resetButton: string;
    emptyPublishedTitle: string;
    emptyPublishedBody: string;
    emptySearchTitle: string;
    emptySearchBody: string;
    readingTimeLabel: (minutes: number) => string;
    readMoreLabel: string;
    tocTitle: string;
    relatedTitle: string;
    authorLabel: string;
    reviewedByLabel: string;
    publishedDateLabel: string;
    updatedDateLabel: string;
    draftBanner: string;
    backToArticles: string;
  };
  contactPage: {
    meta: PageMetadataCopy;
    eyebrow: string;
    title: string;
    lead: string;
    channelsTitle: string;
    whatsappCard: {
      label: string;
      title: string;
      description: string;
      action: string;
    };
    phoneCard: {
      label: string;
      title: string;
      description: string;
      action: string;
    };
    instagramCard: {
      label: string;
      title: string;
      description: string;
      action: string;
    };
    importantNoticeTitle: string;
    importantNotices: string[];
  };
  privacyPage: {
    meta: PageMetadataCopy;
    eyebrow: string;
    title: string;
    lead: string;
    sections: Array<{
      heading: string;
      body: string;
    }>;
  };
  footer: {
    navigationHeading: string;
    contactHeading: string;
    coordinationLabel: string;
    disclaimer: string;
    copyright: string;
  };
  notFound: {
    eyebrow: string;
    title: string;
    body: string;
    backHomeAr: string;
    backHomeEn: string;
  };
  homeMeta: PageMetadataCopy;
}

const extendedCopy: Record<Locale, ExtendedLocaleCopy> = {
  ar: {
    nav: {
      home: siteCopyData.ar.nav.home,
      about: siteCopyData.ar.nav.about,
      specialties: siteCopyData.ar.nav.specialties,
      articles: "المقالات",
      contact: siteCopyData.ar.nav.contact,
      privacy: siteCopyData.ar.privacy,
    },
    a11y: {
      skipToContent: "انتقل إلى المحتوى الرئيسي",
      mainNavLabel: "التنقل الرئيسي",
      footerNavLabel: "روابط التذييل",
      breadcrumbLabel: "مسار الصفحة",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      switchLanguageLabel: "Switch language to English",
      switchLanguageText: "English",
      externalLinkNote: "يفتح في نافذة جديدة",
    },
    header: {
      cta: siteCopyData.ar.hero.primary,
    },
    hero: {
      eyebrow: siteCopyData.ar.hero.eyebrow,
      title: "جمال يليق بكِ",
      subtitle: siteCopyData.ar.hero.subtitle,
      body: "تعرّفي على د. ملاك السيف ومجالات جراحة التجميل والترميم.",
      primary: siteCopyData.ar.hero.primary,
      secondary: "استكشفي مجالات التخصص",
      directWhatsappLabel: "محادثة واتساب مباشرة",
      portraitAlt: "د. ملاك السيف — جراحة التجميل والترميم",
      portraitCaption: "د. ملاك السيف · جراحة التجميل والترميم",
      editorialNote: "تقييم طبي فردي · خصوصية ووضوح",
      coordinationNote: "يُؤكَّد الموعد بعد التنسيق.",
    },
    consultationDialog: {
      eyebrow: "تنسيق موعد الاستشارة",
      title: "تواصلي لحجز استشارة",
      step1Title: "اختاري موضوع الاستفسار العام",
      step1Subtitle:
        "يساعد تحديد المسار العام على تجهيز رسالة استفسار مبدئية لرقم التنسيق، دون الحاجة لإدخال أي بيانات صحية أو شخصية.",
      step2Title: "مراجعة رسالة التنسيق",
      step2Subtitle:
        "يمكنكِ مراجعة نص الرسالة أو تعديله قبل فتح تطبيق واتساب لبدء المحادثة مع جهة التنسيق.",
      messageLabel: "نص الرسالة الجاهزة",
      privacyReminder:
        "يُؤكَّد الموعد بعد التنسيق. يُرجى عدم إرسال صور أو تفاصيل طبية خاصة في الرسالة الأولية.",
      nextButton: "التالي: مراجعة الرسالة",
      backButton: "العودة لاختيار الموضوع",
      continueWhatsappButton: "متابعة عبر واتساب",
      directWhatsappFallback: "فتح واتساب مباشرةً برسالة عامة",
      closeButtonLabel: "إغلاق نافذة طلب الاستشارة",
      stepIndicator: (current, total) => `الخطوة ${current} من ${total}`,
      topics: [
        {
          id: "general",
          label: "استفسار عام",
          description: "السؤال عن المواعيد المتاحة وآلية ترتيب الاستشارة.",
          message: siteCopyData.ar.whatsappMessage,
        },
        {
          id: "plastic-surgery",
          label: "جراحة التجميل",
          description: "استفسار عام حول حجز استشارة لتقييم الجوانب التجميلية.",
          message:
            "مرحبًا، أرغب في الاستفسار عن تنسيق موعد استشارة مع د. ملاك السيف (مجال جراحة التجميل).",
        },
        {
          id: "reconstructive-surgery",
          label: "جراحة الترميم",
          description: "استفسار عام حول حجز استشارة لتقييم حالات الترميم.",
          message:
            "مرحبًا، أرغب في الاستفسار عن تنسيق موعد استشارة مع د. ملاك السيف (مجال جراحة الترميم).",
        },
        {
          id: "burn-surgery",
          label: "جراحة الحروق",
          description: "استفسار عام حول حجز استشارة لتقييم حالات الحروق وآثارها.",
          message:
            "مرحبًا، أرغب في الاستفسار عن تنسيق موعد استشارة مع د. ملاك السيف (مجال جراحة الحروق).",
        },
      ],
    },
    credentialsSection: {
      eyebrow: "المؤهلات والعضويات المهنية",
      title: "المؤهلات العلمية والتدريب التخصصي",
      note: "المؤهلات واردة بحسب الملف التعريفي المنشور للمستشفى.",
      items: [
        {
          label: "البورد والتدريب التخصصي",
          text: siteCopyData.ar.credentials[0],
        },
        {
          label: "الدرجة الطبية الأساسية",
          text: siteCopyData.ar.credentials[1],
        },
        {
          label: "العضويات العلمية",
          text: siteCopyData.ar.credentials[2],
        },
      ],
    },
    aboutPreview: {
      eyebrow: "تعرّفي على الدكتورة",
      title: "د. ملاك السيف",
      body: siteCopyData.ar.about,
      cta: siteCopyData.ar.hero.secondary,
      instagramLabel: siteCopyData.ar.instagram,
      instagramNote:
        "لمتابعة الحساب الرسمي على إنستجرام والاطلاع على التحديثات المنشورة.",
    },
    specialtiesSection: {
      eyebrow: "نطاق الممارسة الطبية",
      title: "مجالات التخصص",
      intro:
        "تتركز الممارسة الطبية في ثلاثة مجالات رئيسية ضمن تخصص جراحة التجميل والترميم، وتُناقش الخيارات الملائمة بعد الفحص والتقييم الفردي المباشر.",
      tabsAriaLabel: "استكشاف مجالات التخصص",
      viewAllCta: "صفحة مجالات التخصص الكاملة",
      directWhatsappCta: "استفسار مباشر عبر واتساب",
      visualAlt:
        "صورة تحريرية طبية تعبر عن الرعاية التخصصية والتقييم السريري الفردي",
      items: [
        {
          id: "plastic-surgery",
          number: "01",
          title: siteCopyData.ar.specialties[0].title,
          tabLabel: siteCopyData.ar.specialties[0].title,
          summary: siteCopyData.ar.specialties[0].body,
          detail:
            "يتناول هذا المجال دراسة التناسق والاحتياجات الجمالية من منظور طبي، مع إيضاح الخيارات الممكنة وحدودها الواقعية بناءً على المعطيات الصحية لكل مراجِعة أو مراجِع.",
          assessmentNote:
            "تُحدَّد مدى ملاءمة أي إجراء بعد التقييم السريري المباشر ومناقشة التوقعات.",
          visualCaption:
            "جراحة التجميل — مناقشة الخيارات وفق التقييم السريري الفردي",
          image: "/images/generated/specialty-plastic-surgery.jpg",
          imageAlt:
            "صورة تحريرية هادئة تبرز الملامح الطبيعية والتناسق الوجهي في إطار جراحة التجميل",
          whatsappEnquiryMessage:
            "مرحبًا، أرغب في الاستفسار عن تنسيق موعد استشارة مع د. ملاك السيف (مجال جراحة التجميل).",
          ctaLabel: "طلب استشارة — جراحة التجميل",
        },
        {
          id: "reconstructive-surgery",
          number: "02",
          title: siteCopyData.ar.specialties[1].title,
          tabLabel: siteCopyData.ar.specialties[1].title,
          summary: siteCopyData.ar.specialties[1].body,
          detail:
            "يُعنى هذا المجال بمعالجة الأنسجة المتأثرة نتيجة إصابات أو عمليات سابقة أو حالات خلقية أو مكتسبة، بهدف دعم الوظيفة الحيوية والشكل التشريحي وفق خطة علاجية مدروسة.",
          assessmentNote:
            "تعتمد الخطة الترميمية على الفحص الطبي الدقيق وتاريخ الحالة الصحي.",
          visualCaption:
            "جراحة الترميم — استعادة الشكل والوظيفة وفق احتياج كل حالة",
          image: "/images/generated/specialty-reconstructive-editorial.jpg",
          imageAlt:
            "تكوين تحريري معماري يعبر عن الترابط واستعادة الشكل والتوازن البنيوي",
          whatsappEnquiryMessage:
            "مرحبًا، أرغب في الاستفسار عن تنسيق موعد استشارة مع د. ملاك السيف (مجال جراحة الترميم).",
          ctaLabel: "طلب استشارة — جراحة الترميم",
        },
        {
          id: "burn-surgery",
          number: "03",
          title: siteCopyData.ar.specialties[2].title,
          tabLabel: siteCopyData.ar.specialties[2].title,
          summary: siteCopyData.ar.specialties[2].body,
          detail:
            "يشمل تقييم الحالات المرتبطة بالحروق وتبعاتها على الجلد والأنسجة، وبحث الخيارات العلاجية أو الترميمية التي تراعي الجانبين الوظيفي والشكلي.",
          assessmentNote:
            "يتطلب تحديد الخيارات تقييمًا سريريًا مفصلًا لطبيعة الأثر وموضعه.",
          visualCaption:
            "جراحة الحروق — تقييم الحالات وآثارها ومناقشة الخيارات الملائمة",
          image: "/images/generated/specialty-burn-editorial.jpg",
          imageAlt:
            "تكوين تحريري هادئ من الأنسجة الكتانية العاجية يعبر عن العناية اللطيفة والمتابعة التأهيلية",
          whatsappEnquiryMessage:
            "مرحبًا، أرغب في الاستفسار عن تنسيق موعد استشارة مع د. ملاك السيف (مجال جراحة الحروق).",
          ctaLabel: "طلب استشارة — جراحة الحروق",
        },
      ],
    },
    journeySection: {
      eyebrow: "مسار الاستشارة",
      title: "خطوات واضحة نحو استشارتكِ",
      subtitle:
        "تبدأ رحلة الاستشارة بالتنسيق المسبق، ثم اللقاء السريري المباشر لفهم احتياجكِ وتوضيح الخيارات الملائمة.",
      note: "يُؤكَّد الموعد بعد التنسيق.",
      steps: [
        {
          number: "01",
          title: "التواصل",
          description:
            "التواصل عبر رقم التنسيق على واتساب أو الهاتف للاستفسار عن المواعيد المتاحة ومتطلبات الزيارة.",
          image: "/images/generated/article-questions-to-discuss.jpg",
          imageAlt: "بطاقات تنسيق عاجية مرتبة بعناية مع شريط أحمر داكن على سطح حجري دافئ",
          caption: "الخطوة 01 — بدء طلب التنسيق عبر واتساب أو الهاتف",
        },
        {
          number: "02",
          title: "التقييم ومناقشة الاحتياج",
          description:
            "لقاء الاستشارة الطبية لفهم الاحتياج بدقة، ومراجعة التاريخ الصحي، وإجراء التقييم السريري المباشر.",
          image: "/images/generated/article-consultation-prep.jpg",
          imageAlt: "دفتر ملاحظات عاجي مفتوح مع ملف أحمر داكن وقلم على مكتب هادئ",
          caption: "الخطوة 02 — الفحص السريري الفردي ومناقشة التوقعات",
        },
        {
          number: "03",
          title: "توضيح الخيارات والخطوات التالية",
          description:
            "شرح الخيارات الطبية المتاحة بوضوح وموضوعية، والإجابة عن الأسئلة لتمكينكِ من اتخاذ قرار واعٍ.",
          image: "/images/generated/step-03-options.jpg",
          imageAlt: "ثلاث كتل حجرية عاجية متدرجة بجانب ملف أحمر داكن تعبر عن وضوح الخيارات والخطوات",
          caption: "الخطوة 03 — إيضاح الخيارات الملائمة والخطوة التالية",
        },
      ],
      cta: siteCopyData.ar.hero.primary,
    },
    articlesPreviewSection: {
      eyebrow: "المحتوى التوعوي",
      title: "المقالات والتثقيف الطبي",
      subtitle:
        "مواد تعريفية حول الاستعداد للاستشارة الطبية وفهم خطوات التقييم الفردي.",
      emptyNote:
        "تخضع المقالات التوعوية للمراجعة الطبية قبل نشرها.",
      hubLinkLabel: "تصفح صفحة المقالات",
      readArticleLabel: "قراءة المقال",
    },
    faqSection: {
      eyebrow: "الأسئلة والتواصل",
      title: "أسئلة شائعة وتنسيق الاستشارة",
      intro: "إجابات موجزة حول آلية طلب الاستشارة والتنسيق.",
      items: siteCopyData.ar.faq,
    },
    contactCta: {
      eyebrow: "التنسيق والتواصل",
      title: siteCopyData.ar.contactTitle,
      body: "يُؤكَّد الموعد بعد التنسيق.",
      primaryWhatsapp: siteCopyData.ar.hero.primary,
      directWhatsappLinkLabel: "محادثة واتساب مباشرة",
      secondaryCall: siteCopyData.ar.call,
      instagramLink: siteCopyData.ar.instagram,
      phoneLabel: "رقم التنسيق",
    },
    aboutPage: {
      meta: {
        title: "عن الدكتورة | د. ملاك السيف — جراحة التجميل والترميم",
        description:
          "نبذة تعريفية عن د. ملاك السيف، جراحة التجميل والترميم، والمؤهلات العلمية والعضويات المهنية الموثقة.",
      },
      eyebrow: "الملف المهني",
      title: "عن د. ملاك السيف",
      lead: siteCopyData.ar.about,
      portraitAlt: "د. ملاك السيف — جراحة التجميل والترميم",
      portraitCaption: "د. ملاك السيف — جراحة التجميل والترميم",
      biographyTitle: "الخلفية المهنية والتخصص",
      biographyParagraphs: [
        "تعمل د. ملاك السيف في مجال جراحة التجميل والترميم، ويشمل نطاق اهتمامها المهني الجوانب التجميلية والترميمية وتقييم حالات الحروق وآثارها.",
        "حصلت على بكالوريوس الطب والجراحة من جامعة الملك سعود بن عبدالعزيز للعلوم الصحية في الرياض، وأتمت البورد السعودي لجراحة التجميل ضمن برنامج مستشفى الحرس الوطني، كما يذكر الملف التعريفي للمستشفى عضويتها في الجمعية الأمريكية لجراحة التجميل والترميم.",
      ],
      credentialsTitle: "المؤهلات والاعتمادات العلمية",
      credentialsSubtitle:
        "البيانات الأكاديمية والتدريبية المذكورة مستندة إلى الملف التعريفي المنشور للمستشفى.",
      approachEyebrow: "منهجية الاستشارة",
      approachTitle: "رؤية تقوم على الفهم المتأني والتقييم الفردي",
      approachPillars: [
        {
          title: "الاستماع وفهم الاحتياج",
          body: "تبدأ الاستشارة الطبية بالاستماع الدقيق لما يشغل المراجِعة أو المراجِع، وفهم الدوافع والتوقعات في بيئة تحترم الخصوصية.",
        },
        {
          title: "التقييم الطبي الموضوعي",
          body: "تُدرَس كل حالة بصورة مستقلة بناءً على المعطيات التشريحية والصحية، دون قوالب جاهزة أو تعميمات مسبقة.",
        },
        {
          title: "الوضوح في طرح الخيارات",
          body: "تُشرح الخيارات المتاحة وما يرتبط بها من خطوات بلغة واضحة ومتزنة تساعد على اتخاذ قرار مدروس.",
        },
      ],
      editorialNotice:
        "المعلومات الواردة في هذه الصفحة مخصصة للتعريف المهني العام ولا تُعد استشارة طبية عن بُعد.",
    },
    specialtiesPage: {
      meta: {
        title: "مجالات التخصص | د. ملاك السيف — جراحة التجميل والترميم",
        description:
          "تعرف على المجالات العامة للممارسة الطبية لدى د. ملاك السيف: جراحة التجميل، جراحة الترميم، وجراحة الحروق.",
      },
      eyebrow: "المجالات العامة للممارسة",
      title: "مجالات التخصص",
      lead: "تشمل الممارسة الطبية ثلاثة مسارات رئيسية: جراحة التجميل، جراحة الترميم، وجراحة الحروق. يهدف هذا العرض إلى تقديم لمحة تعريفية عامة، إذ يعتمد تحديد أي إجراء أو خطة علاجية على التقييم الفردي المباشر.",
      scopeNoteTitle: "ملاحظة حول التقييم الطبي الفردي",
      scopeNoteBody:
        "لا يقدم الموقع قائمة تفصيلية بالإجراءات الفرعية أو توصيات علاجية مسبقة. تختلف الاحتياجات والخيارات الطبية من شخص لآخر، وتُناقش التفاصيل كافة خلال الاستشارة السريرية المباشرة بعد الفحص.",
      consultationContextTitle: "ماذا تشمل مناقشة التخصص خلال الاستشارة؟",
      consultationContextPoints: [
        "مراجعة التاريخ الصحي العام وأي إجراءات أو تداخلات سابقة ذات صلة.",
        "إجراء الفحص السريري المباشر لتقييم الأنسجة والاحتياج الفعلي.",
        "توضيح الخيارات الملائمة للحالة والإجابة عن الاستفسارات بوضوح.",
      ],
    },
    articlesPage: {
      meta: {
        title: "المقالات | د. ملاك السيف — جراحة التجميل والترميم",
        description:
          "مقالات ومواد تعريفية عامة حول الاستعداد للاستشارة الطبية وفهم مجالات جراحة التجميل والترميم.",
      },
      eyebrow: "المكتبة التوعوية",
      title: "المقالات والإرشادات العامة",
      lead: "مقالات تعريفية تهدف إلى مساعدة المراجِعات والمراجعين على الاستعداد الجيد للاستشارة الطبية وفهم الجوانب التنظيمية العامة.",
      searchLabel: "البحث في المقالات",
      searchPlaceholder: "ابحثي في عناوين المقالات أو الملخصات...",
      categoryFilterLabel: "تصفية حسب الموضوع",
      resetButton: "إعادة تعيين البحث والتصفية",
      emptyPublishedTitle: "لا توجد مقالات منشورة حاليًا",
      emptyPublishedBody:
        "تخضع المقالات الإرشادية حاليًا للمراجعة التحريرية والطبية قبل إتاحتها للنشر العام. يمكنكِ في هذه الأثناء التواصل مباشرةً للاستفسار عن تنسيق موعد استشارة.",
      emptySearchTitle: "لا توجد مقالات مطابقة لبحثكِ",
      emptySearchBody:
        "جربي استخدام كلمات بحث أخرى أو إعادة تعيين التصفية لعرض جميع الموضوعات المتاحة.",
      readingTimeLabel: (minutes) => formatReadingTime(minutes, "ar"),
      readMoreLabel: "قراءة المقال كاملًا",
      tocTitle: "محتويات المقال",
      relatedTitle: "مقالات ذات صلة",
      authorLabel: "الإعداد",
      reviewedByLabel: "المراجعة الطبية",
      publishedDateLabel: "تاريخ النشر",
      updatedDateLabel: "آخر تحديث",
      draftBanner:
        "مسودة تحريرية للمعاينة المحلية فقط — لم يتم نشر هذا المقال أو اعتماده طبيًا بعد.",
      backToArticles: "العودة إلى جميع المقالات",
    },
    contactPage: {
      meta: {
        title: "تواصل معنا | د. ملاك السيف — جراحة التجميل والترميم",
        description:
          "قنوات التواصل الرسمية لطلب تنسيق استشارة مع د. ملاك السيف عبر واتساب أو الاتصال الهاتفي.",
      },
      eyebrow: "قنوات التنسيق الرسمية",
      title: "تواصل معنا",
      lead: "يمكنكِ التواصل عبر رقم التنسيق المخصص للاستفسار عن ترتيب موعد استشارة مع د. ملاك السيف. يُرجى ملاحظة أن بدء المحادثة أو الاتصال يمثل طلب تنسيق أولي ولا يُعد تأكيدًا تلقائيًا للموعد.",
      channelsTitle: "وسائل التواصل المتاحة",
      whatsappCard: {
        label: "المراسلة الفورية",
        title: "التنسيق عبر واتساب",
        description:
          "يفتح الرابط تطبيق واتساب مع رسالة استفسار مبدئية جاهزة يمكنكِ تعديلها وإرسالها لبدء طلب التنسيق.",
        action: siteCopyData.ar.hero.primary,
      },
      phoneCard: {
        label: "الاتصال المباشر",
        title: "رقم التنسيق الهاتفي",
        description:
          "للاتصال المباشر برقم التنسيق للاستفسار عن المواعيد المتاحة والخطوات التنظيمية.",
        action: siteCopyData.ar.call,
      },
      instagramCard: {
        label: "الحساب الرسمي",
        title: "إنستجرام (@dralsaifma)",
        description:
          "للاطلاع على الحساب الرسمي للدكتورة ملاك السيف على منصة إنستجرام.",
        action: siteCopyData.ar.instagram,
      },
      importantNoticeTitle: "إرشادات مهمة قبل التواصل",
      importantNotices: [
        "التواصل عبر واتساب أو الهاتف مخصص لتنسيق المواعيد والاستفسارات الإدارية فقط، ولا يُعد استشارة طبية عن بُعد.",
        "إرسال رسالة عبر واتساب لا يعني تأكيد الحجز؛ يتم تأكيد الموعد بعد المراجعة والاتفاق مع جهة التنسيق.",
        "حفاظًا على خصوصيتكِ، يُرجى عدم إرسال صور شخصية أو تقارير طبية تفصيلية في رسائل التنسيق الأولية.",
      ],
    },
    privacyPage: {
      meta: {
        title: "الخصوصية | د. ملاك السيف — جراحة التجميل والترميم",
        description:
          "بيان الخصوصية وإرشادات التعامل مع قنوات التواصل الخارجية في موقع د. ملاك السيف.",
      },
      eyebrow: "معلومات تنظيمية",
      title: "الخصوصية واستخدام الموقع",
      lead: "يوضح هذا البيان طبيعة عمل هذا الموقع التعريفي وكيفية التعامل مع روابط التواصل الخارجية.",
      sections: [
        {
          heading: "1. طبيعة الموقع وعدم جمع البيانات الطبية",
          body: "صُمم هذا الموقع ليكون نافذة تعريفية ومعلوماتية فقط. لا يتضمن الموقع أي نماذج إلكترونية لإدخال بيانات المرضى، ولا يوفر حسابات مستخدمين أو بوابات حجز أو دفع إلكتروني، ولا يطلب من الزوار إدخال معلومات شخصية أو صحية داخل صفحاته.",
        },
        {
          heading: "2. التواصل عبر تطبيق واتساب والمنصات الخارجية",
          body: "عند الضغط على أزرار التواصل عبر واتساب أو رابط إنستجرام، ينتقل المتصفح أو الجهاز إلى خدمة طرف ثالث مستقلة تخضع لسياسات الخصوصية وشروط الاستخدام الخاصة بتلك المنصة. لا يقوم الموقع بإرسال أي رسائل تلقائيًا نيابةً عن الزائر.",
        },
        {
          heading: "3. إرشادات حماية الخصوصية في الرسائل الأولية",
          body: "تُستخدم قناة واتساب لتنسيق المواعيد والاستفسارات التنظيمية العامة فقط. نوصي بعدم إرسال معلومات طبية حساسة أو تفاصيل صحية خاصة أو صور شخصية عبر رسائل التنسيق الأولية.",
        },
        {
          heading: "4. السجلات التقنية للاستضافة",
          body: "لا يستخدم الموقع أدوات تتبع إعلانية أو ملفات تعريف ارتباط تسويقية افتراضيًا. ومع ذلك، قد تقوم بيئة الاستضافة التقنية بتسجيل بيانات تشغيلية قياسية (مثل طلبات الشبكة وعناوين البروتوكول الأساسية) لأغراض الأمان وتشغيل الخدمة.",
        },
      ],
    },
    footer: {
      navigationHeading: "صفحات الموقع",
      contactHeading: "التنسيق والتواصل",
      coordinationLabel: "هاتف التنسيق",
      disclaimer: siteCopyData.ar.disclaimer,
      copyright: "د. ملاك السيف — جراحة التجميل والترميم",
    },
    notFound: {
      eyebrow: "خطأ 404",
      title: "الصفحة المطلوبة غير متوفرة",
      body: "عذرًا، الرابط الذي تحاولين الوصول إليه غير موجود أو ربما تغير مساره. يمكنكِ العودة إلى الصفحة الرئيسية للمتابعة.",
      backHomeAr: "العودة إلى الرئيسية (العربية)",
      backHomeEn: "Go to English Home",
    },
    homeMeta: {
      title: "د. ملاك السيف | جراحة التجميل والترميم",
      description:
        "الموقع التعريفي للدكتورة ملاك السيف — جراحة التجميل والترميم. تعرفي على المؤهلات العلمية، مجالات التخصص، وخطوات تنسيق الاستشارة.",
    },
  },
  en: {
    nav: {
      home: siteCopyData.en.nav.home,
      about: siteCopyData.en.nav.about,
      specialties: siteCopyData.en.nav.specialties,
      articles: "Articles",
      contact: siteCopyData.en.nav.contact,
      privacy: siteCopyData.en.privacy,
    },
    a11y: {
      skipToContent: "Skip to main content",
      mainNavLabel: "Main navigation",
      footerNavLabel: "Footer navigation",
      breadcrumbLabel: "Breadcrumb",
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
      switchLanguageLabel: "تغيير اللغة إلى العربية",
      switchLanguageText: "العربية",
      externalLinkNote: "Opens in a new tab",
    },
    header: {
      cta: siteCopyData.en.hero.primary,
    },
    hero: {
      eyebrow: siteCopyData.en.hero.eyebrow,
      title: "Care & beauty tailored to you",
      subtitle: siteCopyData.en.hero.subtitle,
      body: "Meet Dr. Malak Alsaif and explore plastic and reconstructive surgery.",
      primary: siteCopyData.en.hero.primary,
      secondary: "Explore areas of practice",
      directWhatsappLabel: "Direct WhatsApp link",
      portraitAlt: "Dr. Malak Alsaif — Plastic & Reconstructive Surgery",
      portraitCaption: "Dr. Malak Alsaif · Plastic & Reconstructive Surgery",
      editorialNote: "Individual Assessment · Clarity & Discretion",
      coordinationNote: "Appointments are confirmed after coordination.",
    },
    consultationDialog: {
      eyebrow: "Consultation Coordination",
      title: "Enquire About a Consultation",
      step1Title: "Select a General Enquiry Topic",
      step1Subtitle:
        "Choosing a broad topic prepares a concise initial message for the coordination number. No personal health details or medical history are requested.",
      step2Title: "Review Your Coordination Message",
      step2Subtitle:
        "Review or edit the draft message below before opening WhatsApp to start your conversation with the coordination contact.",
      messageLabel: "Draft WhatsApp Message",
      privacyReminder:
        "Appointments are confirmed after coordination. Avoid sending personal photographs or sensitive medical records in your initial message.",
      nextButton: "Next: Review Message",
      backButton: "Back to Topic Selection",
      continueWhatsappButton: "Continue on WhatsApp",
      directWhatsappFallback: "Open WhatsApp directly with a general message",
      closeButtonLabel: "Close consultation enquiry dialog",
      stepIndicator: (current, total) => `Step ${current} of ${total}`,
      topics: [
        {
          id: "general",
          label: "General Enquiry",
          description:
            "Ask about available consultation times and how to arrange a visit.",
          message: siteCopyData.en.whatsappMessage,
        },
        {
          id: "plastic-surgery",
          label: "Plastic Surgery",
          description:
            "General enquiry about scheduling an assessment for aesthetic concerns.",
          message:
            "Hello, I would like to enquire about coordinating a consultation with Dr. Malak Alsaif (Plastic surgery).",
        },
        {
          id: "reconstructive-surgery",
          label: "Reconstructive Surgery",
          description:
            "General enquiry about scheduling an assessment for reconstructive care.",
          message:
            "Hello, I would like to enquire about coordinating a consultation with Dr. Malak Alsaif (Reconstructive surgery).",
        },
        {
          id: "burn-surgery",
          label: "Burn Surgery",
          description:
            "General enquiry about scheduling an assessment for burn-related concerns.",
          message:
            "Hello, I would like to enquire about coordinating a consultation with Dr. Malak Alsaif (Burn surgery).",
        },
      ],
    },
    credentialsSection: {
      eyebrow: "Qualifications & Memberships",
      title: "Academic Foundation & Specialized Training",
      note: "Credentials reflect information published in the hospital profile.",
      items: [
        {
          label: "Board Certification & Residency",
          text: siteCopyData.en.credentials[0],
        },
        {
          label: "Medical Education",
          text: siteCopyData.en.credentials[1],
        },
        {
          label: "Professional Membership",
          text: siteCopyData.en.credentials[2],
        },
      ],
    },
    aboutPreview: {
      eyebrow: "Meet Dr. Malak",
      title: "Dr. Malak Alsaif",
      body: siteCopyData.en.about,
      cta: siteCopyData.en.hero.secondary,
      instagramLabel: siteCopyData.en.instagram,
      instagramNote:
        "Visit the official Instagram profile for published updates.",
    },
    specialtiesSection: {
      eyebrow: "Scope of Practice",
      title: "Areas of Practice",
      intro:
        "Clinical practice encompasses three broad areas within plastic and reconstructive surgery; suitable options are discussed following an in-person clinical evaluation.",
      tabsAriaLabel: "Explore areas of practice",
      viewAllCta: "Full areas of practice page",
      directWhatsappCta: "Direct WhatsApp enquiry",
      visualAlt:
        "Medical editorial photography representing individualized clinical care",
      items: [
        {
          id: "plastic-surgery",
          number: "01",
          title: siteCopyData.en.specialties[0].title,
          tabLabel: siteCopyData.en.specialties[0].title,
          summary: siteCopyData.en.specialties[0].body,
          detail:
            "Focuses on aesthetic considerations from a thoughtful medical perspective, outlining appropriate possibilities and realistic expectations tailored to each individual's clinical profile.",
          assessmentNote:
            "Suitability for any procedure is determined following an in-person clinical consultation.",
          visualCaption:
            "Plastic Surgery — Options discussed following an individualized clinical assessment",
          image: "/images/generated/specialty-plastic-surgery.jpg",
          imageAlt:
            "Medical editorial portrait highlighting natural facial proportions and calm aesthetic care",
          whatsappEnquiryMessage:
            "Hello, I would like to enquire about coordinating a consultation with Dr. Malak Alsaif (Plastic surgery).",
          ctaLabel: "Request consultation — Plastic surgery",
        },
        {
          id: "reconstructive-surgery",
          number: "02",
          title: siteCopyData.en.specialties[1].title,
          tabLabel: siteCopyData.en.specialties[1].title,
          summary: siteCopyData.en.specialties[1].body,
          detail:
            "Addresses tissue repair and restoration of form and function following injury, prior surgery, or congenital and acquired conditions through an individualized care plan.",
          assessmentNote:
            "Reconstructive planning relies on a thorough medical history and physical examination.",
          visualCaption:
            "Reconstructive Surgery — Restoration of form and function tailored to individual needs",
          image: "/images/generated/specialty-reconstructive-editorial.jpg",
          imageAlt:
            "Architectural editorial still-life representing structural restoration and balanced form",
          whatsappEnquiryMessage:
            "Hello, I would like to enquire about coordinating a consultation with Dr. Malak Alsaif (Reconstructive surgery).",
          ctaLabel: "Request consultation — Reconstructive surgery",
        },
        {
          id: "burn-surgery",
          number: "03",
          title: siteCopyData.en.specialties[2].title,
          tabLabel: siteCopyData.en.specialties[2].title,
          summary: siteCopyData.en.specialties[2].body,
          detail:
            "Covers the clinical evaluation of burn-related concerns and their tissue effects, discussing reconstructive or supportive options that consider both function and form.",
          assessmentNote:
            "Options are discussed individually after assessing the nature and location of affected tissue.",
          visualCaption:
            "Burn Surgery — Individual assessment of burn-related concerns and tissue effects",
          image: "/images/generated/specialty-burn-editorial.jpg",
          imageAlt:
            "Calm editorial composition of folded ivory linen gauze representing gentle care and follow-up",
          whatsappEnquiryMessage:
            "Hello, I would like to enquire about coordinating a consultation with Dr. Malak Alsaif (Burn surgery).",
          ctaLabel: "Request consultation — Burn surgery",
        },
      ],
    },
    journeySection: {
      eyebrow: "Consultation Pathway",
      title: "Your Consultation Journey",
      subtitle:
        "From initial coordination to an unhurried in-person clinical evaluation and discussion of your options.",
      note: "Appointments are confirmed after coordination.",
      steps: [
        {
          number: "01",
          title: "Initial Contact",
          description:
            "Contact the coordination number via WhatsApp or telephone to enquire about scheduling a consultation.",
          image: "/images/generated/article-questions-to-discuss.jpg",
          imageAlt: "Minimal ivory correspondence cards arranged with a fine deep-red ribbon on travertine stone",
          caption: "Step 01 — Initial scheduling coordination via WhatsApp or phone",
        },
        {
          number: "02",
          title: "Assessment & Discussion of Needs",
          description:
            "Attend an in-person consultation to review your medical history, discuss your goals, and complete a clinical assessment.",
          image: "/images/generated/article-consultation-prep.jpg",
          imageAlt: "An open ivory notebook and deep-red linen folder on a calm sunlit desk",
          caption: "Step 02 — Individual clinical assessment and discussion of goals",
        },
        {
          number: "03",
          title: "Clarifying Options & Next Steps",
          description:
            "Review appropriate options and practical next steps clearly so you can make a well-informed decision.",
          image: "/images/generated/step-03-options.jpg",
          imageAlt: "Three ascending warm-ivory travertine blocks beside a deep-red linen portfolio",
          caption: "Step 03 — Objective explanation of suitable options and next steps",
        },
      ],
      cta: siteCopyData.en.hero.primary,
    },
    articlesPreviewSection: {
      eyebrow: "Patient Education",
      title: "Articles & Patient Education",
      subtitle:
        "Informational reading on preparing for a consultation and understanding the clinical evaluation process.",
      emptyNote:
        "Educational guides are undergoing medical and editorial review prior to publication.",
      hubLinkLabel: "Explore the Articles Hub",
      readArticleLabel: "Read article",
    },
    faqSection: {
      eyebrow: "Questions & Contact",
      title: "Questions & Consultation Coordination",
      intro: "Brief answers on how consultation coordination works.",
      items: siteCopyData.en.faq,
    },
    contactCta: {
      eyebrow: "Coordination",
      title: siteCopyData.en.contactTitle,
      body: "Appointments are confirmed after coordination.",
      primaryWhatsapp: siteCopyData.en.hero.primary,
      directWhatsappLinkLabel: "Direct WhatsApp link",
      secondaryCall: siteCopyData.en.call,
      instagramLink: siteCopyData.en.instagram,
      phoneLabel: "Coordination Phone",
    },
    aboutPage: {
      meta: {
        title: "About | Dr. Malak Alsaif — Plastic & Reconstructive Surgery",
        description:
          "Professional profile of Dr. Malak Alsaif, practicing plastic and reconstructive surgery, including verified academic qualifications and board training.",
      },
      eyebrow: "Professional Profile",
      title: "About Dr. Malak Alsaif",
      lead: siteCopyData.en.about,
      portraitAlt: "Dr. Malak Alsaif — Plastic & Reconstructive Surgery",
      portraitCaption: "Dr. Malak Alsaif — Plastic & Reconstructive Surgery",
      biographyTitle: "Background & Clinical Focus",
      biographyParagraphs: [
        "Dr. Malak Alsaif practices in the field of plastic and reconstructive surgery, with clinical focus spanning aesthetic plastic surgery, tissue reconstruction, and burn-related assessment.",
        "She earned her medical degree (MBBS) from King Saud bin Abdulaziz University for Health Sciences in Riyadh and completed the Saudi Board in Plastic Surgery through the National Guard Hospital program. Her published hospital profile also notes membership in the American Society of Plastic Surgeons.",
      ],
      credentialsTitle: "Education, Board Training & Membership",
      credentialsSubtitle:
        "Academic and professional details listed below are sourced from the published hospital profile.",
      approachEyebrow: "Consultation Philosophy",
      approachTitle:
        "An Approach Grounded in Clarity and Individual Assessment",
      approachPillars: [
        {
          title: "Attentive Listening",
          body: "Every consultation begins by understanding the individual's priorities, questions, and expectations in a respectful, private setting.",
        },
        {
          title: "Individualized Evaluation",
          body: "Clinical considerations are evaluated case by case according to anatomy and medical history rather than standardized templates.",
        },
        {
          title: "Measured, Transparent Guidance",
          body: "Available options and practical considerations are explained clearly to support an informed, unhurried decision.",
        },
      ],
      editorialNotice:
        "Information on this page is provided for general professional introduction and does not constitute remote medical advice.",
    },
    specialtiesPage: {
      meta: {
        title:
          "Areas of Practice | Dr. Malak Alsaif — Plastic & Reconstructive Surgery",
        description:
          "Overview of broad clinical areas practiced by Dr. Malak Alsaif: plastic surgery, reconstructive surgery, and burn surgery.",
      },
      eyebrow: "Clinical Overview",
      title: "Areas of Practice",
      lead: "Clinical practice covers three broad areas: plastic surgery, reconstructive surgery, and burn surgery. This overview is informational; any specific procedure or care plan depends on an individual in-person medical assessment.",
      scopeNoteTitle: "A Note on Individual Assessment",
      scopeNoteBody:
        "This website does not publish a fixed catalog of specific sub-procedures or generalized treatment recommendations. Because anatomical considerations and goals vary, appropriate options are discussed directly during an in-person consultation.",
      consultationContextTitle: "What a Consultation Covers",
      consultationContextPoints: [
        "Review of general medical history and any relevant prior procedures.",
        "In-person clinical examination to assess tissue characteristics and individual needs.",
        "Objective discussion of suitable options and answers to your questions.",
      ],
    },
    articlesPage: {
      meta: {
        title: "Articles | Dr. Malak Alsaif — Plastic & Reconstructive Surgery",
        description:
          "General educational articles on preparing for a medical consultation and understanding plastic and reconstructive surgery.",
      },
      eyebrow: "Educational Library",
      title: "Articles & General Guidance",
      lead: "Informational guides designed to help visitors prepare thoughtfully for an in-person consultation and understand general organizational steps.",
      searchLabel: "Search articles",
      searchPlaceholder: "Search article titles or summaries...",
      categoryFilterLabel: "Filter by topic",
      resetButton: "Reset search and filters",
      emptyPublishedTitle: "No Published Articles Yet",
      emptyPublishedBody:
        "Educational articles are currently undergoing editorial and medical review before public release. In the meantime, you can reach out directly to enquire about coordinating a consultation.",
      emptySearchTitle: "No Matching Articles Found",
      emptySearchBody:
        "Try adjusting your search terms or reset the filters to view all available topics.",
      readingTimeLabel: (minutes) => formatReadingTime(minutes, "en"),
      readMoreLabel: "Read full article",
      tocTitle: "On This Page",
      relatedTitle: "Related Articles",
      authorLabel: "Prepared by",
      reviewedByLabel: "Reviewed by",
      publishedDateLabel: "Published",
      updatedDateLabel: "Last updated",
      draftBanner:
        "Local Editorial Draft Preview — This article has not yet been medically reviewed or published.",
      backToArticles: "Back to all articles",
    },
    contactPage: {
      meta: {
        title: "Contact | Dr. Malak Alsaif — Plastic & Reconstructive Surgery",
        description:
          "Official coordination details to enquire about arranging a consultation with Dr. Malak Alsaif via WhatsApp or telephone.",
      },
      eyebrow: "Official Coordination Channels",
      title: "Contact & Consultation Enquiry",
      lead: "Use the dedicated coordination number below to enquire about scheduling a consultation with Dr. Malak Alsaif. Please note that initiating a message or call begins the coordination request and does not automatically confirm an appointment.",
      channelsTitle: "Available Contact Channels",
      whatsappCard: {
        label: "Direct Messaging",
        title: "WhatsApp Coordination",
        description:
          "Opens WhatsApp with a pre-filled enquiry message that you can review and send to start the scheduling request.",
        action: siteCopyData.en.hero.primary,
      },
      phoneCard: {
        label: "Telephone",
        title: "Coordination Line",
        description:
          "Call the coordination number directly to ask about appointment availability and preparation.",
        action: siteCopyData.en.call,
      },
      instagramCard: {
        label: "Official Social Profile",
        title: "Instagram (@dralsaifma)",
        description:
          "Visit Dr. Malak Alsaif's official profile on Instagram.",
        action: siteCopyData.en.instagram,
      },
      importantNoticeTitle: "Important Coordination Notes",
      importantNotices: [
        "WhatsApp and telephone coordination are intended for scheduling enquiries and administrative questions only, not remote medical consultations.",
        "Sending a WhatsApp message does not confirm an appointment; bookings are confirmed separately by the coordination contact.",
        "For your privacy, please avoid sending sensitive medical records or personal clinical photographs in initial coordination messages.",
      ],
    },
    privacyPage: {
      meta: {
        title: "Privacy | Dr. Malak Alsaif — Plastic & Reconstructive Surgery",
        description:
          "Privacy information explaining the website's no-form architecture and third-party communication channels.",
      },
      eyebrow: "Site Information",
      title: "Privacy & Website Use",
      lead: "This page explains how this informational website operates and how external contact links work.",
      sections: [
        {
          heading: "1. Informational Architecture & No Intake Forms",
          body: "This website is designed strictly as an informational overview. It does not include medical intake forms, contact submission forms, patient portals, user accounts, or payment processing, and it does not collect personal health information through web forms.",
        },
        {
          heading: "2. Third-Party Services (WhatsApp & Instagram)",
          body: "When you select a WhatsApp or Instagram link on this website, your browser or device opens an independent third-party service governed by that platform's own privacy policy and terms of use. Clicking a WhatsApp link prepares a message in your application and never sends a message automatically.",
        },
        {
          heading: "3. Guidance on Initial Messages",
          body: "Initial WhatsApp communication is intended solely for administrative appointment coordination. Visitors are advised not to share sensitive medical details, clinical histories, or personal photographs in initial coordination messages.",
        },
        {
          heading: "4. Standard Hosting Logs",
          body: "This website does not load advertising trackers or marketing pixels by default. However, the underlying web hosting platform may record standard technical server logs (such as basic network request metadata and IP addresses) as part of normal infrastructure operation and security.",
        },
      ],
    },
    footer: {
      navigationHeading: "Navigation",
      contactHeading: "Coordination",
      coordinationLabel: "Coordination Phone",
      disclaimer: siteCopyData.en.disclaimer,
      copyright: "Dr. Malak Alsaif — Plastic & Reconstructive Surgery",
    },
    notFound: {
      eyebrow: "Error 404",
      title: "Page Not Found",
      body: "The page you are looking for does not exist or may have moved. You can return to the homepage below.",
      backHomeAr: "العودة إلى الرئيسية (العربية)",
      backHomeEn: "Return to Home (English)",
    },
    homeMeta: {
      title: "Dr. Malak Alsaif | Plastic & Reconstructive Surgery",
      description:
        "Official informational website of Dr. Malak Alsaif — Plastic & Reconstructive Surgery. Explore verified qualifications, areas of practice, and consultation coordination.",
    },
  },
};

export function getCopy(locale: Locale): ExtendedLocaleCopy {
  return extendedCopy[locale];
}
