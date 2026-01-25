"use client";

import { motion } from "framer-motion";
import { AuthButton } from "../common/AuthButton";
import Logo from "../common/Logo";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className='sticky top-0 z-50 w-full backdrop-blur-md'>
      <div
        className='flex h-16 w-full items-center justify-between'
        style={{
          paddingLeft: "clamp(1rem, 4vw, 2.5rem)",
          paddingRight: "clamp(1rem, 4vw, 2.5rem)",
        }}>
        {/* Logo / App Name */}
        <div className='flex items-center gap-3'>
          <Logo className='h-9 w-9' />
          <h1 className='text-xl font-semibold tracking-tight text-[#F9FAFB]'>
            AI Playground
          </h1>
        </div>

        {/* Right side - History & Auth */}
        <div className='flex items-center gap-4'>
          <AuthButton />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
