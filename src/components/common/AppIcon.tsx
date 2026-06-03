"use client";

import React from "react";
import { getPublicApiUrl } from "@/lib/env";

const ABSOLUTE_IMAGE_URL_PATTERN = /^(https?:\/\/|\/\/|data:image\/)/i;
const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|gif|webp|svg|ico)(\?.*)?$/i;

export function isAppIconImageUrl(value?: string | null): boolean {
  if (!value?.trim()) return false;
  const trimmed = value.trim();
  if (ABSOLUTE_IMAGE_URL_PATTERN.test(trimmed)) return true;
  if (trimmed.startsWith("/")) return true;
  return IMAGE_EXTENSION_PATTERN.test(trimmed);
}

/** Resolve relative icon paths against the API origin (e.g. /uploads/...). */
export function toAbsoluteAppIconUrl(url: string): string {
  const trimmed = url.trim();
  if (ABSOLUTE_IMAGE_URL_PATTERN.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    const base =
      getPublicApiUrl() ||
      (typeof window !== "undefined" ? window.location.origin : "");
    return `${String(base).replace(/\/$/, "")}${trimmed}`;
  }
  return trimmed;
}

export function resolveAppIconImageUrl(
  iconUrl?: string | null,
  icon?: string | null
): string | null {
  if (iconUrl?.trim() && isAppIconImageUrl(iconUrl)) {
    return toAbsoluteAppIconUrl(iconUrl);
  }
  if (icon?.trim() && isAppIconImageUrl(icon)) {
    return toAbsoluteAppIconUrl(icon);
  }
  return null;
}

export function resolveAppIconEmoji(
  iconUrl?: string | null,
  icon?: string | null,
  fallback = "📱"
): string {
  if (icon?.trim() && !isAppIconImageUrl(icon)) {
    return icon.trim();
  }
  return fallback;
}

const sizeClasses = {
  xs: "h-8 w-8 text-sm",
  sm: "h-10 w-10 text-lg",
  md: "h-12 w-12 text-xl",
  lg: "h-16 w-16 text-3xl",
} as const;

export interface AppIconProps {
  name: string;
  icon?: string | null;
  iconUrl?: string | null;
  color?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
  fallback?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  icon,
  iconUrl,
  color = "#3B82F6",
  size = "md",
  className = "",
  fallback = "📱",
}) => {
  const imageSrc = resolveAppIconImageUrl(iconUrl, icon);
  const emoji = resolveAppIconEmoji(iconUrl, icon, fallback);
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-xl flex items-center justify-center overflow-hidden shadow-sm ${className}`}
      style={{
        backgroundColor: imageSrc ? `${color}15` : color || "#3B82F6",
        color: imageSrc ? undefined : "#fff",
      }}
      role="img"
      aria-label={`${name} icon`}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={`${name} icon`}
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.style.backgroundColor = color || "#3B82F6";
              parent.style.color = "#fff";
              parent.textContent = emoji;
            }
          }}
        />
      ) : (
        <span className="leading-none">{emoji}</span>
      )}
    </div>
  );
};
