"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/* ================= ROOT ================= */

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

/* ================= OVERLAY ================= */

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "bg-black/35 backdrop-blur-[3px]",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = "DialogOverlay"

/* ================= SIZE MAP ================= */

type DialogSize = "sm" | "md" | "lg" | "xl" | "full"

const sizeMap: Record<DialogSize, string> = {
  sm: "w-[92vw] max-w-[520px]",
  md: "w-[94vw] max-w-[760px]",
  lg: "w-[95vw] max-w-[1100px]",
  xl: "w-[96vw] max-w-[1220px]",
  full: "w-[96vw] max-w-[96vw] h-[94vh] max-h-[94vh]",
}

/* ================= CONTENT ================= */

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  size?: DialogSize
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size = "lg", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />

    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50",
        "-translate-x-1/2 -translate-y-1/2",

        "grid",
        "bg-white",
        "border border-border",
        "rounded-2xl",

        "shadow-[0_24px_60px_rgba(15,23,42,0.18),0_8px_24px_rgba(15,23,42,0.10)]",

        "max-h-[90vh]",
        "overflow-hidden",

        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "duration-200",

        sizeMap[size],

        className
      )}
      {...props}
    >
      {children}

      {/* BOTÃO FECHAR */}
      <DialogPrimitive.Close
        className={cn(
          "absolute right-4 top-4 rounded-full p-2",
          "text-muted-foreground transition",
          "hover:bg-muted hover:text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring"
        )}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = "DialogContent"

/* ================= HEADER ================= */

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1",
      "px-5 pt-5 pb-4",
      "border-b",
      "bg-white",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

/* ================= FOOTER ================= */

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row",
      "sm:justify-end sm:items-center",
      "gap-2",
      "px-5 py-4",
      "border-t",
      "bg-slate-50/60",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

/* ================= TITLE ================= */

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-[1.35rem]",
      "leading-tight",
      "tracking-[-0.03em]",
      "font-extrabold",
      "text-foreground",
      "pr-10",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

/* ================= DESCRIPTION ================= */

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-xs",
      "font-medium",
      "tracking-[0.14em]",
      "uppercase",
      "text-muted-foreground",
      className
    )}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

/* ================= EXPORT ================= */

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
}