import { Header } from "@/components/global/header";
import { Sidebar } from "@/components/global/sidebar";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <Sidebar />
      <div className="pb-8 md:ml-17.5">
        <Header />
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
