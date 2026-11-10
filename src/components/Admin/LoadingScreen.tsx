import type { LucideIcon } from "lucide-react";

interface LoadingScreenProps {
  icon: LucideIcon;
  text: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  icon: Icon,
  text,
}: LoadingScreenProps) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <Icon size={48} className="text-[#d3a762] animate-bounce" />

        <p className="text-[#d3a762] font-semibold text-lg tracking-wide uppercase">
          {text}
        </p>
      </div>
    </div>
  );
}
