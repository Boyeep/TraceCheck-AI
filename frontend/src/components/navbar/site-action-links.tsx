import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { buildAuthNextQuery } from "../../auth/route-utils";
import {
  routePaths,
  workspacePaths,
} from "../../routes";

export const SiteActionLinks = ({
  className,
}: {
  className: string;
}) => {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return (
      <div className={className}>
        <Link
          className="site-pill site-pill-strong"
          to={workspacePaths.upload}
        >
          Open workspace
        </Link>
        <button
          className="site-pill site-pill-light"
          onClick={() => {
            void signOut()
              .catch(() => undefined)
              .finally(() => {
                navigate(routePaths.home);
              });
          }}
          type="button"
        >
          Sign out
        </button>
      </div>
    );
  }

  const authQuery = buildAuthNextQuery(workspacePaths.upload);

  return (
    <div className={className}>
      <Link
        className="site-pill site-pill-light"
        to={`${routePaths.login}${authQuery}`}
      >
        Login
      </Link>
      <Link
        className="site-pill site-pill-strong"
        to={`${routePaths.signup}${authQuery}`}
      >
        Sign up
      </Link>
    </div>
  );
};
