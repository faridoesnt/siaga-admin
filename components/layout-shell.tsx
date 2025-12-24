"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { clearToken, isAuthenticated } from "@/lib/auth";
import { Button } from "./ui";

interface Props {
  children: ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/satpam", label: "Satpam" },
  { href: "/attendance-spots", label: "Attendance Spots" },
  { href: "/shifts", label: "Shifts" },
  { href: "/scheduling", label: "Scheduling" },
  { href: "/spot-assignment", label: "Spot Assignment" },
  { href: "/approvals", label: "Shift Swaps" },
  { href: "/attendance", label: "Attendance Monitoring" },
];

export function LayoutShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, []);

  const isLoginPage = pathname === "/login";

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
    router.replace("/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop / tablet sidebar */}
      <aside className="hidden h-screen w-60 shrink-0 border-r bg-white lg:flex lg:flex-col lg:sticky lg:top-0">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-sm font-semibold tracking-tight">SIAGA CS</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              current={pathname}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>
        {loggedIn && (
          <div className="border-t px-3 py-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile / tablet drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 flex lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="w-64 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-14 items-center justify-between border-b px-4">
              <span className="text-sm font-semibold tracking-tight">
                SIAGA CS
              </span>
              <button
                type="button"
                className="text-xs text-slate-500"
                onClick={() => setSidebarOpen(false)}
              >
                Close
              </button>
            </div>
            <nav className="space-y-1 px-3 py-4 text-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  current={pathname}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </nav>
            {loggedIn && (
              <div className="border-t px-3 py-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 bg-black/40" />
        </div>
      )}

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center border-b bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50 lg:hidden"
                onClick={() => setSidebarOpen((prev) => !prev)}
              >
                <span className="sr-only">Toggle navigation</span>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <span className="text-sm font-semibold tracking-tight lg:hidden">
                SIAGA CS
              </span>
            </div>
            {loggedIn && (
              <div className="hidden items-center gap-2 lg:flex">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  label,
  current,
  onClick,
}: {
  href: string;
  label: string;
  current: string | null;
  onClick?: () => void;
}) {
  const isActive = current === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center rounded-md px-3 py-2 ${
        isActive
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );
}
