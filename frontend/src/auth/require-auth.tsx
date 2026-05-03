import { Navigate, Outlet, useLocation } from "react-router-dom";
import { routePaths } from "../routes";
import { buildAuthNextQuery } from "./route-utils";
import { useAuth } from "./auth-context";

export const RequireAuth = () => {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <main className="route-main">
        <div className="page-shell page-top-shell">
          <section className="auth-loading-card">
            <p className="eyebrow">Securing Workspace</p>
            <h1 className="route-title">Checking your session.</h1>
            <p className="lede">
              TraceCheck is confirming your sign-in before loading the QA
              workspace.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    const nextPath = `${location.pathname}${location.search}`;
    return (
      <Navigate
        replace
        to={`${routePaths.login}${buildAuthNextQuery(nextPath)}`}
      />
    );
  }

  return <Outlet />;
};
