import { cn } from "@/lib/utils"
import { getBrandLogo } from "@/lib/brands"

const COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-rose-500",
]

export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

// Colori per i gruppi (bg leggero + testo + bordo)
export const GROUP_COLORS = [
  { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-300 dark:border-blue-800", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-300 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-300 dark:border-violet-800", text: "text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-300 dark:border-amber-800", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-300 dark:border-rose-800", text: "text-rose-700 dark:text-rose-300", dot: "bg-rose-500" },
  { bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-300 dark:border-cyan-800", text: "text-cyan-700 dark:text-cyan-300", dot: "bg-cyan-500" },
]

export function getGroupColor(groupId: string) {
  return GROUP_COLORS[hashString(groupId) % GROUP_COLORS.length]
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-12 h-12 text-lg",
} as const

interface AvatarProps {
  username: string
  avatarUrl?: string | null
  bikeModel?: string | null
  size?: keyof typeof sizeClasses
  className?: string
}

export function Avatar({ username, avatarUrl, bikeModel, size = "md", className }: AvatarProps) {
  const initial = username.charAt(0).toUpperCase()
  const colorClass = COLORS[hashString(username) % COLORS.length]

  // Priorità: 1) logo brand moto, 2) avatar URL custom, 3) iniziale colorata
  const brandLogo = getBrandLogo(bikeModel ?? null)
  const imageUrl = brandLogo ?? avatarUrl

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={username}
        className={cn(
          "rounded-full object-contain shrink-0 bg-white border border-border",
          sizeClasses[size],
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-semibold shrink-0",
        sizeClasses[size],
        colorClass,
        className
      )}
      title={username}
    >
      {initial}
    </div>
  )
}
