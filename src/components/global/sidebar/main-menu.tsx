"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BookOpen,
  Building2,
  Cpu,
  FileText,
  LayoutDashboard,
  Leaf,
  Megaphone,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const icons = {
  "/": LayoutDashboard,
  "/service-ops": Wrench,
  "/customers": Users,
  "/devices": Cpu,
  "/revenue": Wallet,
  "/societies": Building2,
  "/leads": Megaphone,
  "/sustainability": Leaf,
  "/docs": FileText,
  "/api-docs": BookOpen,
} as const;

type MenuItem = {
  path: string;
  name: string;
  /** Opens in a new tab — used for the standalone Scalar reference page. */
  newTab?: boolean;
  children?: { path: string; name: string }[];
};

const items: MenuItem[] = [
  {
    path: "/",
    name: "Overview",
  },
  {
    path: "/service-ops",
    name: "Service Ops",
  },
  {
    path: "/customers",
    name: "Customers",
  },
  {
    path: "/devices",
    name: "Devices",
    children: [
      { path: "/devices", name: "Overview" },
      { path: "/devices/fleet", name: "Fleet" },
    ],
  },
  {
    path: "/revenue",
    name: "Revenue",
  },
  {
    path: "/societies",
    name: "Societies",
  },
  {
    path: "/leads",
    name: "Leads",
  },
  {
    path: "/sustainability",
    name: "Sustainability",
  },
  {
    path: "/docs",
    name: "Case Study",
    newTab: true,
  },
  {
    path: "/api-docs",
    name: "API Docs",
    newTab: true,
  },
];

interface ItemProps {
  item: MenuItem;
  isActive: boolean;
  isExpanded: boolean;
  isItemExpanded: boolean;
  onToggle: (path: string) => void;
  onSelect?: () => void;
}

const ChildItem = ({
  child,
  isActive,
  isExpanded,
  shouldShow,
  onSelect,
  index,
}: {
  child: { path: string; name: string };
  isActive: boolean;
  isExpanded: boolean;
  shouldShow: boolean;
  onSelect?: () => void;
  index: number;
}) => {
  const showChild = isExpanded && shouldShow;

  return (
    <Link prefetch href={child.path} onClick={() => onSelect?.()} className="group/child block">
      <div className="relative">
        {/* Child item text */}
        <div
          className={cn(
            "mr-3.75 ml-8.75 flex h-8 items-center",
            "border-l pl-3",
            "transition-all duration-200 ease-out",
            showChild ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
          )}
          style={{
            transitionDelay: showChild ? `${40 + index * 20}ms` : `${index * 20}ms`,
          }}
        >
          <span
            className={cn(
              "text-xs font-medium transition-colors duration-200",
              "text-muted-foreground group-hover/child:text-primary",
              "overflow-hidden whitespace-nowrap",
              isActive && "text-primary"
            )}
          >
            {child.name}
          </span>
        </div>
      </div>
    </Link>
  );
};

const Item = ({ item, isActive, isExpanded, isItemExpanded, onToggle, onSelect }: ItemProps) => {
  const Icon = icons[item.path as keyof typeof icons];
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;

  // Children should be visible when: expanded sidebar AND this item is expanded
  const shouldShowChildren = isExpanded && isItemExpanded;

  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(item.path);
  };

  return (
    <div className="group">
      <Link
        prefetch={!item.newTab}
        href={item.path}
        target={item.newTab ? "_blank" : undefined}
        rel={item.newTab ? "noreferrer" : undefined}
        onClick={() => onSelect?.()}
        className="group"
      >
        <div className="relative">
          {/* Background that expands */}
          <div
            className={cn(
              "ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; mr-3.75 ml-3.75 h-10 border border-transparent transition-all duration-200",
              isActive && "dark:bg-secondary dark:border-border border-[#DCDAD2] bg-[#F2F1EF]",
              isExpanded ? "w-[calc(100%-30px)]" : "w-10"
            )}
          />

          {/* Icon - always in same position from sidebar edge */}
          <div className="group-hover:text-primary pointer-events-none absolute top-0 left-3.75 flex h-10 w-10 items-center justify-center text-black dark:text-[#666666]">
            <div className={cn(isActive && "dark:text-white")}>
              <Icon size={20} />
            </div>
          </div>

          {isExpanded && (
            <div className="pointer-events-none absolute top-0 right-1 left-13.75 flex h-10 items-center">
              <span
                className={cn(
                  "group-hover:text-primary text-sm font-medium text-[#666] transition-opacity duration-200 ease-in-out",
                  "overflow-hidden whitespace-nowrap",
                  hasChildren ? "pr-2" : "",
                  isActive && "text-primary"
                )}
              >
                {item.name}
              </span>
              {hasChildren && (
                <button
                  type="button"
                  onClick={handleChevronClick}
                  className={cn(
                    "mr-3 ml-auto flex h-8 w-8 items-center justify-center transition-all duration-200",
                    "hover:text-primary pointer-events-auto text-[#888]",
                    isActive && "text-primary/60",
                    shouldShowChildren && "rotate-180"
                  )}
                >
                  <Icons.ChevronDown size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Children */}
      {hasChildren && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            shouldShowChildren ? "mt-1 max-h-96" : "max-h-0"
          )}
        >
          {item.children!.map((child, index) => {
            const isChildActive = pathname === child.path;
            return (
              <ChildItem
                key={child.path}
                child={child}
                isActive={isChildActive}
                isExpanded={isExpanded}
                shouldShow={shouldShowChildren}
                onSelect={onSelect}
                index={index}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

type Props = {
  onSelect?: () => void;
  isExpanded?: boolean;
};

export function MainMenu({ onSelect, isExpanded = false }: Props) {
  const pathname = usePathname();
  const part = pathname?.split("/")[1];
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Keep the open section in sync with the route: the section that owns the
  // current child page opens, and any other section collapses on navigation.
  // Sidebar expand/collapse resets through the same rule.
  useEffect(() => {
    const owner = items.find((item) => item.children?.some((child) => child.path === pathname));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedItem(owner?.path ?? null);
  }, [isExpanded, pathname]);

  return (
    <div className="mt-6 w-full">
      <nav className="w-full">
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const isActive =
              (pathname === "/" && item.path === "/") || (pathname !== "/" && item.path.startsWith(`/${part}`));

            return (
              <Item
                key={item.path}
                item={item}
                isActive={isActive}
                isExpanded={isExpanded}
                isItemExpanded={expandedItem === item.path}
                onToggle={(path) => {
                  setExpandedItem(expandedItem === path ? null : path);
                }}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      </nav>
    </div>
  );
}
