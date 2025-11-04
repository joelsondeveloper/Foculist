"use client";

import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { fieldMotion } from "@/utils/motions";

const Header = () => {
  return (
    <header className="flex items-center justify-between">
      <div className="logo flex flex-col gap-1">
        <h1 className="font-bold text-2xl ">Focuslist</h1>
        <p className="text-sm">Organize your life with elegance</p>
      </div>
      <div className="searchbar flex items-center gap-4">
        <motion.div
          className="search relative flex items-center max-w-75 w-full flex-1"
          initial={{ width: 45 }}
          whileHover={{ width: 300 }}
          whileTap={{ scale: 0.98 }}
        >
          <Search className="absolute left-[11.5px] text-primary-foreground/60" />
          <input
            type="text"
            placeholder="Search tasks..."
            className=" h-10 w-full bg-primary-foreground/13 pl-12 rounded-2xl outline-0"
          />
        </motion.div>
        <motion.div
          className="avatar flex w-10 aspect-square rounded-full bg-info justify-center items-center"
          variants={fieldMotion}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
        >
          <p className="font-semibold">A</p>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
