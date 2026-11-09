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
} from 'lucide-react';

interface IdentityAvatarProps {
  iconKey?: string;
  theme?: string; // 'red' | 'yellow' | 'orange' | 'amber' | 'zinc'
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function IdentityAvatar({
  iconKey = 'shield',
  theme = 'zinc',
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
        return <Shield size={iconSize} strokeWidth={stroke} />;
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'red':
        return 'bg-red-500/10 text-red-400 border-red-500/25';
      case 'yellow':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25';
      case 'orange':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/25';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'zinc':
      default:
        return 'bg-white/[0.04] text-zinc-300 border-white/[0.08]';
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 border ${getThemeClasses()} ${box} ${className}`}
      aria-hidden="true"
    >
      {renderIcon()}
    </div>
  );
}
