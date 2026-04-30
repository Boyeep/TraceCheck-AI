import { Navigate, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./layouts/site-layout";
import { WorkspaceLayout } from "./layouts/workspace-layout";
import { FeatureDetailPage } from "./pages/feature-detail-page";
import { FeaturesPage } from "./pages/features-page";
import { HomePage } from "./pages/home-page";
import { WorkspaceDecisionPage } from "./pages/workspace-decision-page";
import { WorkspacePage } from "./pages/workspace-page";
import { WorkspaceReviewPage } from "./pages/workspace-review-page";
import { WorkspaceUploadPage } from "./pages/workspace-upload-page";
import { WorkspaceValidatePage } from "./pages/workspace-validate-page";

const App = () => (
  <Routes>
    <Route element={<SiteLayout />}>
      <Route element={<HomePage />} index />
      <Route element={<FeaturesPage />} path="/features" />
      <Route element={<FeatureDetailPage />} path="/features/:featureSlug" />
      <Route element={<WorkspaceLayout />} path="/workspace">
        <Route element={<WorkspacePage />} index />
        <Route element={<WorkspaceUploadPage />} path="upload" />
        <Route element={<WorkspaceReviewPage />} path="review" />
        <Route element={<WorkspaceValidatePage />} path="validate" />
        <Route element={<WorkspaceDecisionPage />} path="decision" />
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Route>
  </Routes>
);

export default App;
