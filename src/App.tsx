import { Navigate, Route, Routes } from "react-router-dom";
import { useProfileStore } from "./store/profileStore";
import AppLayout from "./components/AppLayout";
import ChooseProfilePage from "./pages/ChooseProfilePage";
import HomePage from "./pages/HomePage";
import PlansPage from "./pages/PlansPage";
import PlanDetailPage from "./pages/PlanDetailPage";
import ExerciseLibraryPage from "./pages/ExerciseLibraryPage";
import WorkoutSessionPage from "./pages/WorkoutSessionPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  const name = useProfileStore((s) => s.name);

  if (!name) {
    return (
      <Routes>
        <Route path="*" element={<ChooseProfilePage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/planes" element={<PlansPage />} />
        <Route path="/planes/:planId" element={<PlanDetailPage />} />
        <Route path="/ejercicios" element={<ExerciseLibraryPage />} />
        <Route path="/historial" element={<HistoryPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Route>
      <Route path="/entrenar/:planId/:dayId" element={<WorkoutSessionPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
