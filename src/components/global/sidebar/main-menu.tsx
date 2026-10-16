"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const icons = {
  "/": () => <Icons.Overview size={20} />,
  "/documents": () => <Icons.Invoice size={20} />,
  "/transactions": () => <Icons.Transactions size={20} />,
  "/tracker": () => <Icons.Tracker size={20} />,
  "/customers": () => <Icons.Customers size={20} />,
  "/vault": () => <Icons.Vault size={20} />,
  "/settings": () => <Icons.Settings size={20} />,
  "/apps": () => <Icons.Apps size={20} />,
  "/inbox": () => <Icons.Inbox2 size={20} />,
} as const;

const items = [
  {
    path: "/",
    name: "Workflows",
  },
  {
    path: "/documents",
    name: "Documents",
  },
  {
    path: "/inbox",
    name: "Inbox",
    children: [{ path: "/inbox/settings", name: "Settings" }],
  },
  {
    path: "/transactions",
    name: "Transactions",
    children: [
      {
        path: "/transactions/categories",
        name: "Categories",
      },
      {
        path: "/transactions?step=connect",
        name: "Connect bank",
      },
      {
        path: "/transactions?step=import&hide=true",
        name: "Import",
      },
      { path: "/transactions?createTransaction=true", name: "Create new" },
    ],
  },
  {
    path: "/tracker",
    name: "Tracker",
    children: [{ path: "/tracker?create=true", name: "Create new" }],
  },
  {
    path: "/customers",
    name: "Customers",
    children: [{ path: "/customers?createCustomer=true", name: "Create new" }],
  },
  {
    path: "/vault",
    name: "Vault",
  },
  {
    path: "/apps",
    name: "Apps",
    children: [
      { path: "/apps", name: "All" },
      { path: "/apps?tab=installed", name: "Installed" },
    ],
  },
  {
    path: "/settings",
    name: "Settings",
    children: [
      { path: "/settings", name: "General" },
      { path: "/settings/billing", name: "Billing" },
      { path: "/settings/accounts", name: "Bank Connections" },
      { path: "/settings/members", name: "Members" },
      { path: "/settings/notifications", name: "Notifications" },
      { path: "/settings/developer", name: "Developer" },
    ],
  },
];

interface ItemProps {
  item: {
    path: string;
    name: string;
    children?: { path: string; name: string }[];
  };
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
            "mr-[15px] ml-[35px] flex h-8 items-center",
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
      <Link prefetch href={item.path} onClick={() => onSelect?.()} className="group">
        <div className="relative">
          {/* Background that expands */}
          <div
            className={cn(
              "ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; mr-[15px] ml-[15px] h-10 border border-transparent transition-all duration-200",
              isActive && "dark:bg-secondary dark:border-border border-[#DCDAD2] bg-[#F2F1EF]",
              isExpanded ? "w-[calc(100%-30px)]" : "w-10"
            )}
          />

          {/* Icon - always in same position from sidebar edge */}
          <div className="group-hover:text-primary pointer-events-none absolute top-0 left-[15px] flex h-10 w-10 items-center justify-center text-black dark:text-[#666666]">
            <div className={cn(isActive && "dark:text-white")}>
              <Icon />
            </div>
          </div>

          {isExpanded && (
            <div className="pointer-events-none absolute top-0 right-1 left-[55px] flex h-10 items-center">
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

  // Reset expanded item when sidebar expands/collapses
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedItem(null);
  }, [isExpanded]);

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
