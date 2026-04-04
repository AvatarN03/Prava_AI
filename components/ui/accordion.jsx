"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const AccordionContext = React.createContext(null);
const AccordionItemContext = React.createContext(null);

function Accordion({
  type = "single",
  defaultValue,
  value,
  onValueChange,
  collapsible = true,
  className,
  children,
}) {
  const isControlled = value !== undefined;

  const initialValue = React.useMemo(() => {
    if (defaultValue !== undefined) return defaultValue;
    return type === "multiple" ? [] : "";
  }, [defaultValue, type]);

  const [internalValue, setInternalValue] = React.useState(initialValue);
  const activeValue = isControlled ? value : internalValue;

  const setValue = React.useCallback(
    (next) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  const isOpen = React.useCallback(
    (itemValue) => {
      if (type === "multiple") {
        return Array.isArray(activeValue) && activeValue.includes(itemValue);
      }
      return activeValue === itemValue;
    },
    [activeValue, type]
  );

  const toggle = React.useCallback(
    (itemValue) => {
      if (type === "multiple") {
        const current = Array.isArray(activeValue) ? activeValue : [];
        const next = current.includes(itemValue)
          ? current.filter((v) => v !== itemValue)
          : [...current, itemValue];
        setValue(next);
        return;
      }

      const currentlyOpen = activeValue === itemValue;
      if (currentlyOpen) {
        if (collapsible) setValue("");
        return;
      }

      setValue(itemValue);
    },
    [activeValue, collapsible, setValue, type]
  );

  return (
    <AccordionContext.Provider value={{ isOpen, toggle }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  );
}

const AccordionItem = React.forwardRef(({ className, value, ...props }, ref) => (
  <AccordionItemContext.Provider value={{ value }}>
    <div
      ref={ref}
      className={cn("border-b border-white/10 last:border-b-0", className)}
      data-accordion-item={value}
      {...props}
    />
  </AccordionItemContext.Provider>
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const root = React.useContext(AccordionContext);
  const item = React.useContext(AccordionItemContext);

  if (!root || !item) {
    throw new Error("AccordionTrigger must be used within AccordionItem");
  }

  const open = root.isOpen(item.value);

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex w-full items-center justify-between py-4 text-left text-sm font-medium transition-all hover:underline",
        className
      )}
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
      onClick={() => root.toggle(item.value)}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-current transition-transform duration-200",
          open && "rotate-180"
        )}
      />
    </button>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const root = React.useContext(AccordionContext);
  const item = React.useContext(AccordionItemContext);

  if (!root || !item) {
    throw new Error("AccordionContent must be used within AccordionItem");
  }

  const open = root.isOpen(item.value);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn("overflow-hidden text-sm", className)}
      data-state="open"
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </div>
  );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };