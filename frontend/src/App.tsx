import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./components/AppLayout";
import {
  LoadingScreen,
  ProtectedRoute,
  PublicOnlyRoute,
} from "./components/RouteGuards";

const AccountPage = lazy(async () => ({
  default: (await import("./pages/AccountPage")).AccountPage,
}));
const DiscoverPage = lazy(async () => ({
  default: (await import("./pages/DiscoverPage")).DiscoverPage,
}));
const FavoritesPage = lazy(async () => ({
  default: (await import("./pages/FavoritesPage")).FavoritesPage,
}));
const LoginPage = lazy(async () => ({
  default: (await import("./pages/LoginPage")).LoginPage,
}));
const PopularPage = lazy(async () => ({
  default: (await import("./pages/PopularPage")).PopularPage,
}));
const RegisterPage = lazy(async () => ({
  default: (await import("./pages/RegisterPage")).RegisterPage,
}));

export function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="discover" replace />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="popular" element={<PopularPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
