import { Outlet } from "react-router-dom";
import Header from "./Header";
import BottomNav from "./BottomNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-4 pb-24 sm:pb-10">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
