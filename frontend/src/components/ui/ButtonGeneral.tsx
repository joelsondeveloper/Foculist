import { motion } from "framer-motion";
import { fieldMotion } from "@/app/utils/motions";

interface ButtonProps {
  children: React.ReactNode;
  color?: string;
  [key: string]: unknown;
}

const ButtonGeneral = ({ children, color, ...props }: ButtonProps) => {
  return (
    <motion.button
      {...props}
      className={`btn ${color} rounded-xl px-4 py-2 w-fit flex items-center mx-auto`}
      variants={fieldMotion}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
    >
      {children}
    </motion.button>
  );
};

export default ButtonGeneral;
