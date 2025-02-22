"use client";

type VoiceActivityIndicatorProps = {
  isActive: boolean;
  label: string;
};

export function VoiceActivityIndicator({
  isActive,
  label,
}: VoiceActivityIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full transition-colors duration-200 ${
          isActive ? "bg-green-500" : "bg-gray-300"
        }`}
      />
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
