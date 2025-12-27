import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import loginBg from "../assets/login_bg.png";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false); // New state for terms agreement
  const [isSignup, setIsSignup] = useState(false);
  const [isReset, setIsReset] = useState(false); // Toggle for password reset
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // Success message
  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (isSignup && !agreedToTerms) {
      setError("이용약관 및 개인정보처리방침에 동의해야 합니다.");
      return;
    }

    try {
      if (isReset) {
        await resetPassword(email);
        setMessage("Check your inbox for further instructions");
      } else if (isSignup) {
        await signup(email, password, name);
        navigate("/");
      } else {
        await login(email, password);
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      let msg = "오류가 발생했습니다.";
      if (err.code === "auth/email-already-in-use") {
        msg = "이미 가입된 이메일입니다. 로그인해주세요.";
      } else if (err.code === "auth/invalid-email") {
        msg = "유효하지 않은 이메일 주소입니다.";
      } else if (err.code === "auth/weak-password") {
        msg = "비밀번호는 6자 이상이어야 합니다.";
      } else if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        msg = "이메일 또는 비밀번호가 올바르지 않습니다.";
      } else {
        msg = "오류가 발생했습니다: " + err.message;
      }
      setError(msg);
    }
  }

  // Toggle modes helper
  const toggleMode = (mode) => {
    setError("");
    setMessage("");
    if (mode === "reset") {
      setIsReset(true);
      setIsSignup(false);
    } else if (mode === "signup") {
      setIsReset(false);
      setIsSignup(true);
    } else {
      // Login
      setIsReset(false);
      setIsSignup(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
      {/* Hero Image Section */}
      <div className="relative h-[35vh] w-full shrink-0 overflow-hidden bg-primary/10">
        <img
          src={loginBg}
          alt="Fresh Fridge"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-light dark:to-background-dark/90"></div>
      </div>

      {/* Main Content Card - Overlaps image */}
      <div className="flex flex-1 flex-col items-center px-6 -mt-10 relative z-10 w-full max-w-md mx-auto">
        <div className="w-full rounded-3xl bg-surface-light dark:bg-surface-dark shadow-xl p-8 border border-white/20 backdrop-blur-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">
              {isReset ? t("auth.resetPassword") : t("app.title")}
            </h1>
            <p className="text-sm text-text-sub-light dark:text-text-sub-dark">
              {isReset
                ? t("auth.resetEmailSent")
                : isSignup
                ? t("auth.signup")
                : t("auth.login")}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-700 dark:text-green-300 border border-green-100 dark:border-green-900/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">
                check_circle
              </span>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {isSignup && !isReset && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="홍길동"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                {t("auth.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
              />
            </div>

            {!isReset && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                  {t("auth.password")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                />
              </div>
            )}

            {isSignup && !isReset && (
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="terms"
                  className="text-xs text-text-sub-light dark:text-text-sub-dark leading-normal"
                >
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    (필수) 이용약관
                  </a>{" "}
                  및{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    (필수) 개인정보처리방침
                  </a>
                  에 동의합니다.
                </label>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-primary py-3.5 text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark active:scale-98"
            >
              {isReset
                ? t("auth.resetPassword")
                : isSignup
                ? t("auth.signup")
                : t("auth.login")}
            </button>
          </form>

          {!isReset && (
            <div className="mt-4 text-center">
              <button
                onClick={() => toggleMode("reset")}
                className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark hover:text-primary dark:hover:text-primary transition-colors"
              >
                {t("auth.forgotPassword")}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-text-sub-light dark:text-text-sub-dark">
            {isReset ? (
              <>
                {t("auth.hasAccount")}{" "}
                <button
                  onClick={() => toggleMode("login")}
                  className="font-bold text-primary hover:underline ml-1"
                >
                  {t("auth.login")}
                </button>
              </>
            ) : (
              <>
                {isSignup ? t("auth.hasAccount") : t("auth.noAccount")}{" "}
                <button
                  onClick={() => toggleMode(isSignup ? "login" : "signup")}
                  className="font-bold text-primary hover:underline ml-1"
                >
                  {isSignup ? t("auth.login") : t("auth.signup")}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
