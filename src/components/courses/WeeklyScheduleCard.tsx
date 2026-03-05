"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WeeklyScheduleCardProps {
  title: ReactNode;
  headerRight?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

export default function WeeklyScheduleCard({
  title,
  headerRight,
  children,
  footer,
}: WeeklyScheduleCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="min-w-0">{title}</CardTitle>
          {headerRight ? (
            <div className="flex items-center">{headerRight}</div>
          ) : null}
        </div>
      </CardHeader>
      {children ? <CardContent>{children}</CardContent> : null}
      {footer ? (
        <CardFooter className="border-t border-[#f0f0f0] text-xs text-[#666]">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}
