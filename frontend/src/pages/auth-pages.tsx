import {
  KeyRound,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useState,
} from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { getSafeNextPath } from "../auth/route-utils";
import {
  routePaths,
  workspacePaths,
} from "../routes";

const authBenefits = [
  {
    icon: ShieldCheck,
    title: "Protected QA workspace",
    copy: "Only signed-in operators can open the intake and validation flow.",
  },
  {
    icon: KeyRound,
    title: "Session-backed API access",
    copy: "TraceCheck keeps your API calls tied to a real app session instead of anonymous fallback use.",
  },
  {
    icon: UserPlus,
    title: "Operator-friendly onboarding",
    copy: "Create a QA operator account in one step and continue directly into the upload workflow.",
  },
];

const AuthPageFrame = ({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) => (
  <main className="route-main">
    <div className="page-shell page-top-shell">
      <section className="auth-shell">
        <div className="auth-panel">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="route-title">{title}</h1>
          <p className="lede auth-lede">{description}</p>
          {children}
        </div>

        <aside className="auth-aside">
          <p className="eyebrow">Why It Matters</p>
          <h2>Keep the intake workflow visible, gated, and operator-specific.</h2>
          <p className="auth-aside-copy">
            TraceCheck is set up for receiving and QA teams, so the workspace now
            starts behind a simple account wall instead of dropping straight into
            the review flow.
          </p>

          <div className="auth-benefit-list">
            {authBenefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article className="auth-benefit-card" key={benefit.title}>
                  <div className="auth-benefit-icon">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
      </section>
    </div>
  </main>
);

export const LoginPage = () => {
  const { isAuthenticated, isReady, signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = getSafeNextPath(searchParams.get("next"), workspacePaths.upload);

  if (isReady && isAuthenticated) {
    return <Navigate replace to={nextPath} />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signIn({ email, password });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Sign-in failed. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageFrame
      description="Sign in to open the TraceCheck QA workspace and keep your intake actions attached to a named operator session."
      eyebrow="Login"
      title="Return to the verification queue."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span className="field-label-row">
            <strong>Email</strong>
          </span>
          <input
            autoComplete="email"
            className="field-input"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="qa@company.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="auth-field">
          <span className="field-label-row">
            <strong>Password</strong>
          </span>
          <input
            autoComplete="current-password"
            className="field-input"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
            type="password"
            value={password}
          />
        </label>

        {errorMessage ? <p className="auth-error-banner">{errorMessage}</p> : null}

        <div className="auth-actions">
          <button
            className="site-pill site-pill-strong site-pill-large auth-submit"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
          <p className="auth-switch-copy">
            No account yet?{" "}
            <Link to={`${routePaths.signup}?next=${encodeURIComponent(nextPath)}`}>
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </AuthPageFrame>
  );
};

export const SignUpPage = () => {
  const { isAuthenticated, isReady, signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = getSafeNextPath(searchParams.get("next"), workspacePaths.upload);

  if (isReady && isAuthenticated) {
    return <Navigate replace to={nextPath} />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match yet.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signUp({ name, email, password });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Sign-up failed. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageFrame
      description="Create a TraceCheck operator account and head straight into upload, review, and validation without using the anonymous workspace path."
      eyebrow="Sign Up"
      title="Create your QA operator account."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field-grid">
          <label className="auth-field">
            <span className="field-label-row">
              <strong>Full name</strong>
            </span>
            <input
              autoComplete="name"
              className="field-input"
              onChange={(event) => setName(event.target.value)}
              placeholder="Alya Putri"
              required
              type="text"
              value={name}
            />
          </label>

          <label className="auth-field">
            <span className="field-label-row">
              <strong>Email</strong>
            </span>
            <input
              autoComplete="email"
              className="field-input"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="qa@company.com"
              required
              type="email"
              value={email}
            />
          </label>
        </div>

        <div className="auth-field-grid">
          <label className="auth-field">
            <span className="field-label-row">
              <strong>Password</strong>
            </span>
            <input
              autoComplete="new-password"
              className="field-input"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
              type="password"
              value={password}
            />
          </label>

          <label className="auth-field">
            <span className="field-label-row">
              <strong>Confirm password</strong>
            </span>
            <input
              autoComplete="new-password"
              className="field-input"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              required
              type="password"
              value={confirmPassword}
            />
          </label>
        </div>

        {errorMessage ? <p className="auth-error-banner">{errorMessage}</p> : null}

        <div className="auth-actions">
          <button
            className="site-pill site-pill-strong site-pill-large auth-submit"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>
          <p className="auth-switch-copy">
            Already have an account?{" "}
            <Link to={`${routePaths.login}?next=${encodeURIComponent(nextPath)}`}>
              Login
            </Link>
          </p>
        </div>
      </form>
    </AuthPageFrame>
  );
};
