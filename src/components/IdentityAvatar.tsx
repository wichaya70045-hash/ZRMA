import React from 'react';
import {
  Shield,
  Terminal,
  Cpu,
  Radio,
  Key,
  Lock,
  Fingerprint,
  EyeOff,
  Binary,
  Globe,
  User,
} from 'lucide-react';

interface IdentityAvatarProps {
  iconKey?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function IdentityAvatar({
  iconKey = 'shield',
  className = '',
  size = 'md',
}: IdentityAvatarProps) {
  const sizeMap = {
    xs: { box: 'w-5 h-5 rounded', iconSize: 11, stroke: 1.75 },
    sm: { box: 'w-6 h-6 rounded-md', iconSize: 13, stroke: 1.75 },
    md: { box: 'w-8 h-8 rounded-lg', iconSize: 15, stroke: 1.75 },
    lg: { box: 'w-10 h-10 rounded-xl', iconSize: 18, stroke: 1.75 },
  };

  const { box, iconSize, stroke } = sizeMap[size] || sizeMap.md;

  const renderIcon = () => {
    switch (iconKey?.toLowerCase()) {
      case 'terminal':
        return <Terminal size={iconSize} strokeWidth={stroke} />;
      case 'cpu':
        return <Cpu size={iconSize} strokeWidth={stroke} />;
      case 'radar':
        return <Radio size={iconSize} strokeWidth={stroke} />;
      case 'key':
        return <Key size={iconSize} strokeWidth={stroke} />;
      case 'lock':
        return <Lock size={iconSize} strokeWidth={stroke} />;
      case 'fingerprint':
        return <Fingerprint size={iconSize} strokeWidth={stroke} />;
      case 'eye-off':
        return <EyeOff size={iconSize} strokeWidth={stroke} />;
      case 'binary':
        return <Binary size={iconSize} strokeWidth={stroke} />;
      case 'globe':
        return <Globe size={iconSize} strokeWidth={stroke} />;
      case 'shield':
      default:
        // If it's an old emoji string or unknown key, fallback to a clean shield or user
        return <Shield size={iconSize} strokeWidth={stroke} />;
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/[0.08] text-zinc-300 ${box} ${className}`}
      aria-hidden="true"
    >
      {renderIcon()}
    </div>
  );
}
