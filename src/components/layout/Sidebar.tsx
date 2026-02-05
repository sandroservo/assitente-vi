/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  ClipboardList,
  Settings,
  BookOpen,
  Users,
  BarChart3,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/chats", icon: MessageSquare, label: "Chats" },
  { href: "/kanban", icon: ClipboardList, label: "Kanban" },
  { href: "/knowledge", icon: BookOpen, label: "Conhecimento" },
  { href: "/users", icon: Users, label: "Usuários" },
  { href: "/reports", icon: BarChart3, label: "Relatórios" },
  { href: "/settings", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Ao entrar no Kanban, menu recolhido
  useEffect(() => {
    if (pathname.startsWith("/kanban")) {
      setCollapsed(true);
    }
  }, [pathname]);

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className={cn("border-b border-gray-100 flex shrink-0", collapsed ? "p-2 justify-center" : "p-5 justify-center")}>
        <Link href="/" className={collapsed ? "flex justify-center w-10 h-10" : "flex justify-center"}>
          <Image
            src="/assets/logo.webp"
            alt="Amo Vidas"
            width={collapsed ? 40 : 140}
            height={collapsed ? 40 : 140}
            className="object-contain"
          />
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 mx-3 mt-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all",
          collapsed && "justify-center px-2 mx-2"
        )}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        {!collapsed && <span>Recolher</span>}
      </button>

      {!collapsed && (
        <div className="px-4 pt-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium px-3 mb-2">
            Menu de Navegação
          </p>
        </div>
      )}

      <nav className="flex-1 px-3 overflow-hidden">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-[#FE3E6E] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cn("rounded-xl bg-gray-50 shrink-0", collapsed ? "p-2 m-2 flex justify-center" : "p-4 m-3 mb-2")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FE3E6E] flex items-center justify-center text-white font-semibold text-sm shrink-0">
            Vi
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">Vi Assistente</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 pb-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium w-full text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
