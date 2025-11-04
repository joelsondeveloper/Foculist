import { motion } from "framer-motion"
import { fieldMotion } from "@/utils/motions"


interface ButtonProps {
    children: React.ReactNode
    color?: string
    [key: string]: unknown
}

const ButtonFull = ({children, color, ...props}: ButtonProps) => {
  return (
    <motion.button {...props} className={`btn ${color} rounded-xl px-4 py-2 w-full flex items-center justify-center gap-1`} variants={fieldMotion} initial="initial" whileHover="hover" whileTap="tap">
      {children}
    </motion.button>
  )
}

export default ButtonFull
