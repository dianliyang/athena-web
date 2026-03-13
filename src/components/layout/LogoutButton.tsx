"use client";

import { Dictionary } from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  showLabel?: boolean;
  dict?: Dictionary;
  fullWidth?: boolean;
  className?: string;
}

export default function LogoutButton({ showLabel, dict, fullWidth, className }: LogoutButtonProps) {
  const handleLogout = async () => {
    window.location.assign("/auth/signout");
  };

  if (showLabel) {
    return (
      <Button
        variant="ghost"
        className={cn(
          "group/logout text-sidebar-foreground hover:text-red-600",
          fullWidth ? "w-full justify-start" : "",
          className,
        )}
        onClick={handleLogout}
        type="button"
      >
        <LogOut className="transition-colors group-hover/logout:text-red-600" />
        <span className="transition-colors group-hover/logout:text-red-600">
          {dict?.dashboard.identity.sign_out || "Sign Out"}
        </span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-9 w-9 text-sidebar-foreground hover:text-red-600", className)}
      onClick={handleLogout}
      type="button"
      title={dict?.dashboard.identity.sign_out || "Sign Out"}
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
