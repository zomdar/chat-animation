"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ExternalLinkIcon, ListChecksIcon } from "lucide-react";
import type {
  ComponentProps,
  PropsWithChildren,
  ReactNode,
} from "react";

export type SourcesProps = ComponentProps<typeof DropdownMenu>;

export const Sources = ({ children, ...props }: SourcesProps) => (
  <DropdownMenu {...props}>{children}</DropdownMenu>
);

export type SourcesTriggerProps = ComponentProps<typeof Button> & {
  count: number;
  label?: ReactNode;
};

export const SourcesTrigger = ({
  count,
  className,
  label,
  children,
  ...props
}: SourcesTriggerProps) => (
  <DropdownMenuTrigger asChild>
    <Button
      size="sm"
      variant="ghost"
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-200 hover:bg-white/10",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <ListChecksIcon className="size-3.5" />
          <span className="font-medium uppercase tracking-wide">
            {label ?? "Sources"}
          </span>
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold">
            {count}
          </span>
        </>
      )}
    </Button>
  </DropdownMenuTrigger>
);

export type SourcesContentProps = ComponentProps<typeof DropdownMenuContent>;

export const SourcesContent = ({
  className,
  ...props
}: SourcesContentProps) => (
  <DropdownMenuContent
    align="end"
    className={cn(
      "w-80 bg-neutral-900/95 text-neutral-200 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/80",
      className
    )}
    {...props}
  />
);

export type SourceProps = PropsWithChildren<{
  href: string;
  title: string;
  description?: string;
  rank?: number;
}>;

export const Source = ({
  href,
  title,
  description,
  rank,
  children,
}: SourceProps) => {
  let hostname = href;
  try {
    hostname = new URL(href).hostname;
  } catch {
    hostname = href;
  }

  return (
  <DropdownMenuItem
    asChild
    className="flex cursor-pointer flex-col items-start gap-1 rounded-md px-3 py-2 text-left hover:bg-white/10 focus:bg-white/10"
  >
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-400">
        {typeof rank === "number" ? (
          <span className="font-semibold text-neutral-300">[{rank}]</span>
        ) : null}
        <span className="truncate text-neutral-400">
          {hostname}
        </span>
      </div>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white">{title}</p>
        <ExternalLinkIcon className="mt-0.5 size-3.5 shrink-0 text-neutral-400" />
      </div>
      {description ? (
        <p className="line-clamp-3 text-sm text-neutral-400">{description}</p>
      ) : null}
      {children}
    </a>
  </DropdownMenuItem>
  );
};
