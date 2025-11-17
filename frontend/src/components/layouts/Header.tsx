"use client";

import { useState, useRef, RefObject } from "react";
import { Search, LogOut, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fieldMotion } from "@/app/utils/motions";
import Link from "next/link";
import Image from "next/image";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useClickOutside } from "@/app/hooks/useClickOutside";
import AdSenseAd from "../ui/AdSenseAd";
import { useRouter } from "next/navigation";
import { Diamond } from "lucide-react";
import ButtonGeneral from "../ui/ButtonGeneral";

interface HeaderProps {
  session: Session;
}

const Header = ({ session }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const router = useRouter();

  const menuRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(menuRef as RefObject<HTMLElement>, () =>
    setIsMenuOpen(false)
  );

  const user = session.user;
  const userInitials = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const isFreeUser = session && session.user && user?.plan === "free";
  const adsenseSlot1 = process.env.NEXT_PUBLIC_ADSENSE_SLOT_1 as string;
  const adsenseSlot2 = process.env.NEXT_PUBLIC_ADSENSE_SLOT_2 as string;

  const handleUpgradeClick = () => {
    router.push("/profile#account");
  };

  return (
    <>
      <header className="flex items-center justify-between">
        <div
          className="logo flex flex-col gap-1 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <h1 className="font-bold text-2xl ">Focuslist</h1>
          <p className="text-sm">Organize sua vida com elegancia</p>
        </div>
        <div className="searchbar flex items-center gap-4">
          {/* <motion.div
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
          </motion.div> */}
          {isFreeUser && (
            <ButtonGeneral
              onClick={handleUpgradeClick}
              color="bg-warning/60 hover:bg-warning/50"
              aria-label="Fazer upgrade para remover anúncios"
              className="w-full sm:w-auto"
            >
              <div className="container flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base">
                <Diamond size="1.1rem" className="sm:size-[1.2rem]" />
                <span>Remover Anúncios</span>
              </div>
            </ButtonGeneral>
          )}
          <div className="relative" ref={menuRef}>
            <motion.div
              className="avatar flex w-10 aspect-square rounded-full bg-info justify-center items-center"
              variants={fieldMotion}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <UserIcon className="text-primary-foreground/60" />

              {user?.image ? (
                <Image
                  src={user.image}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <p className="font-semibold">{userInitials}</p>
              )}
            </motion.div>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  key="menu"
                  className="absolute top-12 right-0 w-48 bg-primary-foreground/20 backdrop-blur-md rounded-lg shadow-lg border border-primary-foreground/10 p-2 z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ul className="flex flex-col gap-1">
                    <li>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-primary-foreground/10"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <UserIcon size={16} />
                        <span>Meu Perfil</span>
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center gap-2 p-2 rounded-md text-red-400 hover:bg-red-500/10"
                      >
                        <LogOut size={16} />
                        <span>Sair</span>
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
      {isFreeUser && adsenseSlot1 && (
        <div>
          <AdSenseAd
            slot={adsenseSlot1}
            format="auto"
            className=" mx-auto h-fit"
            testMode={true}
          />
        </div>
      )}
    </>
  );
};

export default Header;
