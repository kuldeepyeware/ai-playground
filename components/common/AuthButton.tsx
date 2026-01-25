"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";

export function AuthButton() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <Skeleton className='h-8 w-8 animate-pulse rounded-full ' />;
  }

  if (isSignedIn) {
    return (
      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-8 w-8",
          },
        }}
      />
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <SignInButton mode='modal'>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className='rounded-lg px-3 py-1.5 text-sm font-medium text-(--text-secondary) transition-colors cursor-pointer hover:text-(--text-primary)'>
          Sign In
        </motion.button>
      </SignInButton>
      <SignUpButton mode='modal'>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className='rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors cursor-pointer hover:bg-(--primary-hover)'>
          Sign Up
        </motion.button>
      </SignUpButton>
    </div>
  );
}
