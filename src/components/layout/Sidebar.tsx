/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

"use client";

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

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-gray-100 flex justify-center">
        <Link href="/">
          <Image 
            src="/assets/logo.webp" 
            alt="Amo Vidas" 
            width={140} 
            height={140} 
          />
        </Link>
      </div>

      <div className="px-4 pt-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium px-3 mb-2">
          Menu de Navegação
        </p>
      </div>

      <nav className="flex-1 px-3">
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
                    isActive
                      ? "bg-[#FE3E6E] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 m-3 mb-4 rounded-xl bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FE3E6E] flex items-center justify-center text-white font-semibold text-sm">
            Vi
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">Vi Assistente</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 pb-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium w-full text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
