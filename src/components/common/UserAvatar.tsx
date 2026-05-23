"use client";

import Image from 'next/image';
import { useState } from 'react';

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}

function getDisplayName(name?: string | null, email?: string | null): string {
  return (name || email?.split('@')[0] || 'User').trim();
}

function getInitials(name?: string | null, email?: string | null): string {
  const display = getDisplayName(name, email);
  const parts = display.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return display.slice(0, 2).toUpperCase();
}

function buildAvatarUrl(displayName: string, size: number, background = '3b82f6'): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${background}&color=ffffff&size=${size}`;
}

export function UserAvatar({ name, email, size = 40, className = '' }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const displayName = getDisplayName(name, email);

  if (failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.35) }}
        role="img"
        aria-label={`${displayName} profile`}
      >
        {getInitials(name, email)}
      </div>
    );
  }

  return (
    <Image
      className={`rounded-full ${className}`}
      src={buildAvatarUrl(displayName, size)}
      alt={`${displayName} profile`}
      width={size}
      height={size}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
