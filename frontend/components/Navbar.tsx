"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getDashboard } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await getDashboard();
        setPendingCount(res.data.stats.pending_approvals);
      } catch {}
    };

    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/", label: "Home" },
    { href: "/approvals", label: "Approvals", badge: pendingCount },
    { href: "/audit", label: "Audit Log" },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <Image
            src="/Nexflowiconalone.png"
            alt="NextFlow Logo"
            width={100}
            height={20}
            className="rounded-md"
            priority
          />

          <span className="text-white font-bold text-lg">NextFlow</span>
          <span className="text-gray-500 text-sm ml-1">Workflow Engine</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition flex items-center gap-2 ${
                pathname === link.href
                  ? "text-violet-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {link.label}

              {link.badge != null && link.badge > 0 && (
                <span className="bg-yellow-500 text-gray-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

      </div>
    </nav>
  );
}