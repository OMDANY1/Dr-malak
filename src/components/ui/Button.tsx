import React from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ivory" | "outline-ivory";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: ButtonVariant;
  external?: boolean;
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export function Button({
  children,
  href,
  variant = "primary",
  external = false,
  className = "",
  ariaLabel,
  onClick,
  type = "button",
}: ButtonProps) {
  const classes = `btn btn-${variant} ${className}`.trim();

  if (href) {
    const isExternalProtocol =
      external ||
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("tel:") ||
      href.startsWith("mailto:");

    if (isExternalProtocol) {
      const openInNewTab = href.startsWith("http://") || href.startsWith("https://");
      return (
        <a
          href={href}
          className={classes}
          aria-label={ariaLabel}
          {...(openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          onClick={onClick}
        >
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={classes} aria-label={ariaLabel} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
