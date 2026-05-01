import { Navigate } from "react-router-dom";
import { workspaceRouteSegments } from "../routes";

export const WorkspacePage = () => (
  <Navigate replace to={workspaceRouteSegments.upload} />
);
