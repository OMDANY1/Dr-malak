"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminLoginClient({
  hasProvisionedUsers,
}: {
  hasProvisionedUsers: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cms/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "تعذر تسجيل الدخول. يرجى التحقق من البيانات.");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
      setLoading(false);
    }
  };

  return (
    <div className="cms-login-shell" dir="rtl" lang="ar">
      <div className="cms-login-card">
        <div className="cms-login-brand">
          <span className="cms-login-eyebrow">د. ملاك السيف — جراحة التجميل والترميم</span>
          <h1 className="cms-login-title">لوحة إدارة المحتوى</h1>
          <p className="cms-login-subtitle">
            تسجيل الدخول المخصص للمالكة والمحررين المعتمدين لإدارة محتوى الموقع.
          </p>
        </div>

        {!hasProvisionedUsers && (
          <div className="cms-login-setup-box" role="note">
            <strong>تهيئة أول حساب مسؤول (لم يتم إنشاء مستخدم بعد):</strong>
            <span>
              لأسباب أمنية لا يوجد تسجيل عام. يمكنكِ تهيئة حساب المالك الأول عبر سطر الأوامر:
            </span>
            <code className="cms-login-code">
              npm run cms:provision-admin -- --email=owner@domain.com --password=YourStrongPassword --role=owner
            </code>
          </div>
        )}

        {error && (
          <div className="cms-alert cms-alert--error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="cms-login-form" noValidate>
          <div className="cms-field">
            <label htmlFor="cms-login-email" className="cms-label">
              <span>البريد الإلكتروني</span>
            </label>
            <input
              id="cms-login-email"
              type="email"
              required
              autoComplete="username"
              dir="ltr"
              className="cms-input"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="cms-field">
            <label htmlFor="cms-login-password" className="cms-label">
              <span>كلمة المرور</span>
            </label>
            <input
              id="cms-login-password"
              type="password"
              required
              autoComplete="current-password"
              dir="ltr"
              className="cms-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cms-btn cms-btn--primary"
            style={{ width: "100%", marginTop: "0.35rem" }}
          >
            {loading ? "جاري التحقق..." : "تسجيل الدخول إلى لوحة التحكم"}
          </button>
        </form>

        <div
          style={{
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--cms-border)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.84rem",
          }}
        >
          <Link href="/ar" style={{ color: "var(--cms-red)", fontWeight: 700 }}>
            ← العودة إلى الموقع العام
          </Link>
          <span style={{ color: "var(--cms-ink-muted)" }}>وصول محمي ومُشفّر</span>
        </div>
      </div>
    </div>
  );
}
