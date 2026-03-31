import { Outlet } from "react-router-dom";
import AppNavBar from "../components/AppNavBar";

export default function AuthenticatedLayout() {
  return (
    <>
      <AppNavBar />
      <div className="app-main-pad">
        <Outlet />
      </div>
    </>
  );
}
