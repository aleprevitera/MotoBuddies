import { cn } from "@/lib/utils"

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

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-12 h-12 text-lg",
} as const

interface AvatarProps {
  username: string
  avatarUrl?: string | null
  size?: keyof typeof sizeClasses
  className?: string
}

export function Avatar({ username, avatarUrl, size = "md", className }: AvatarProps) {
  const initial = username.charAt(0).toUpperCase()
  const colorClass = COLORS[hashString(username) % COLORS.length]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={cn(
          "rounded-full object-cover shrink-0",
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
