import { motion, AnimatePresence } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string
    link: string
    icon?: JSX.Element
  }[]
  className?: string
}) => {
  const visible = true
  const navigate = useNavigate()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "flex max-w-fit fixed top-10 inset-x-0 mx-auto border border-foreground/[0.2] rounded-full bg-transparent shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[5000] pr-2 pl-6 sm:pl-8 py-2 items-center justify-center space-x-12",
          className
        )}
      >
        <Sparkles className="w-7 h-7 text-primary rounded-full block" />
        {navItems.map((navItem: any, idx: number) => (
          <Link
            key={`link=${idx}`}
            to={navItem.link}
            className={cn(
              "relative text-neutral-50 items-center flex space-x-1 hover:text-neutral-300"
            )}
          >
            <span className="block sm:hidden">{navItem.icon}</span>
            <span className="hidden sm:block text-sm">{navItem.name}</span>
          </Link>
        ))}
        <button
          onClick={() => navigate("/auth")}
          className="border bg-sonic-dark text-sm font-medium relative border-foreground/[0.2] text-foreground px-6 py-2 rounded-full hover:text-foreground/80 transition-all"
        >
          <span>Login</span>
          <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-primary to-transparent h-px" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
