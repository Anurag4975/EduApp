"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const roleRedirects: Record<string, string> = {
  super_admin: "/admin/dashboard",
  institution_admin: "/institution/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
};

export default function LoginPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
      return;
    }

    if (data.user && data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        setError("Failed to load your profile. Please try again.");
        setLoading(false);
        return;
      }

      const redirect = roleRedirects[profile?.role] ?? "/login";
      router.push(redirect);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div style={styles.root}>
      {/* Left panel */}
      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.brand}>
            <div style={styles.logoMark}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="#4F46E5" />
                <path
                  d="M7 14h4l3-7 3 14 3-7h4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span style={styles.brandName}>EduApp</span>
          </div>

          <div style={styles.taglineBlock}>
            <h1 style={styles.headline}>
              Learning that
              <br />
              <span style={styles.accent}>fits your world.</span>
            </h1>
            <p style={styles.sub}>
              One platform for institutions, teachers, and students — built to
              make education simpler.
            </p>
          </div>

          <div style={styles.statsRow}>
            {[
              { value: "50+", label: "Institutions" },
              { value: "10k+", label: "Students" },
              { value: "99.9%", label: "Uptime" },
            ].map((s) => (
              <div key={s.label} style={styles.stat}>
                <span style={styles.statVal}>{s.value}</span>
                <span style={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.dots} aria-hidden />
      </div>

      {/* Right panel — form */}
      <div style={styles.right}>
        <div style={styles.formCard}>
          <div style={styles.formTop}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSub}>Sign in to continue to your workspace</p>
          </div>

          <form onSubmit={handleLogin} style={styles.form} noValidate>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@institution.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                onFocus={(e) =>
                  Object.assign(e.target.style, styles.inputFocus)
                }
                onBlur={(e) => Object.assign(e.target.style, styles.input)}
              />
            </div>

            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label} htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  style={styles.forgotBtn}
                  onClick={() => alert("Password reset coming soon.")}
                >
                  Forgot password?
                </button>
              </div>
              <div style={styles.passwordWrap}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...styles.input, paddingRight: "44px" }}
                  onFocus={(e) =>
                    Object.assign(e.target.style, {
                      ...styles.inputFocus,
                      paddingRight: "44px",
                    })
                  }
                  onBlur={(e) =>
                    Object.assign(e.target.style, {
                      ...styles.input,
                      paddingRight: "44px",
                    })
                  }
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div style={styles.errorBox} role="alert">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={
                loading
                  ? { ...styles.submitBtn, opacity: 0.7 }
                  : styles.submitBtn
              }
            >
              {loading ? (
                <span style={styles.spinnerWrap}>
                  <span style={styles.spinner} /> Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p style={styles.footer}>
            Need access?{" "}
            <a href="mailto:admin@eduapp.com" style={styles.link}>
              Contact your institution admin
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
  },
  left: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "50%",
    background:
      "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
    padding: "48px",
    position: "relative",
    overflow: "hidden",
  },
  leftInner: {
    display: "flex",
    flexDirection: "column",
    gap: "48px",
    zIndex: 1,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoMark: {
    display: "flex",
    alignItems: "center",
  },
  brandName: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  taglineBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  headline: {
    fontSize: "48px",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: "1.1",
    letterSpacing: "-1.5px",
  },
  accent: {
    color: "#a5b4fc",
  },
  sub: {
    fontSize: "16px",
    color: "#c7d2fe",
    lineHeight: "1.6",
    maxWidth: "340px",
  },
  statsRow: {
    display: "flex",
    gap: "32px",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statVal: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: "13px",
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  dots: {
    position: "absolute",
    bottom: "-60px",
    right: "-60px",
    width: "300px",
    height: "300px",
    backgroundImage:
      "radial-gradient(circle, rgba(165,180,252,0.2) 1px, transparent 1px)",
    backgroundSize: "20px 20px",
    borderRadius: "50%",
  },
  right: {
    width: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px",
  },
  formCard: {
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  formTop: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  formTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
    letterSpacing: "-0.5px",
  },
  formSub: {
    fontSize: "15px",
    color: "#6b7280",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
  },
  forgotBtn: {
    fontSize: "13px",
    color: "#4F46E5",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "15px",
    color: "#111827",
    backgroundColor: "#ffffff",
    border: "1.5px solid #e5e7eb",
    borderRadius: "10px",
    outline: "none",
    transition: "border-color 0.15s",
  },
  inputFocus: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "15px",
    color: "#111827",
    backgroundColor: "#ffffff",
    border: "1.5px solid #4F46E5",
    borderRadius: "10px",
    outline: "none",
    transition: "border-color 0.15s",
  },
  passwordWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "0",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 14px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#dc2626",
  },
  submitBtn: {
    width: "100%",
    padding: "13px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#4F46E5",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background 0.15s",
    marginTop: "4px",
  },
  spinnerWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  footer: {
    fontSize: "14px",
    color: "#9ca3af",
    textAlign: "center",
  },
  link: {
    color: "#4F46E5",
    textDecoration: "none",
    fontWeight: "500",
  },
};
