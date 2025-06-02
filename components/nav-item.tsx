import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

interface NavItemProps {
  title: string
  href: string
  icon: LucideIcon
  userRole: string | undefined
  roles: string[]
}

const NavItem = ({ title, href, icon, userRole, roles }: NavItemProps) => {
  // Check if the user has access based on their role
  const hasAccess = roles.includes(userRole || "")

  if (!hasAccess) {
    return null // Don't render the item if the user doesn't have access
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <icon className="mr-2 h-4 w-4" />
      <span>{title}</span>
    </Link>
  )
}

export default NavItem

