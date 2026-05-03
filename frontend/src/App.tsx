import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/require-auth";
import { SiteLayout } from "./layouts/site-layout";
import { WorkspaceLayout } from "./layouts/workspace-layout";
import { FeatureDetailPage } from "./pages/feature-detail-page";
import { FeaturesPage } from "./pages/features-page";
import { HomePage } from "./pages/home-page";
import {
  LoginPage,
  SignUpPage,
} from "./pages/auth-pages";
import { WorkspaceDecisionPage } from "./pages/workspace-decision-page";
import { WorkspacePage } from "./pages/workspace-page";
import { WorkspaceReviewPage } from "./pages/workspace-review-page";
import { WorkspaceUploadPage } from "./pages/workspace-upload-page";
import { WorkspaceValidatePage } from "./pages/workspace-validate-page";
import {
  featureRoutePath,
  routePaths,
  workspaceRouteSegments,
} from "./routes";

const App = () => (
  <Routes>
    <Route element={<SiteLayout />}>
      <Route element={<HomePage />} index />
      <Route element={<FeaturesPage />} path={routePaths.features} />
      <Route element={<LoginPage />} path={routePaths.login} />
      <Route element={<SignUpPage />} path={routePaths.signup} />
      <Route element={<FeatureDetailPage />} path={featureRoutePath} />
      <Route element={<RequireAuth />}>
        <Route element={<WorkspaceLayout />} path={routePaths.workspace}>
          <Route element={<WorkspacePage />} index />
          <Route element={<WorkspaceUploadPage />} path={workspaceRouteSegments.upload} />
          <Route element={<WorkspaceReviewPage />} path={workspaceRouteSegments.review} />
          <Route element={<WorkspaceValidatePage />} path={workspaceRouteSegments.validate} />
          <Route element={<WorkspaceDecisionPage />} path={workspaceRouteSegments.decision} />
        </Route>
      </Route>
      <Route element={<Navigate replace to={routePaths.home} />} path="*" />
    </Route>
  </Routes>
);

export default App;
