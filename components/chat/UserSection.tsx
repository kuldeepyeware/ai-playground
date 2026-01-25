"use client";

import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function UserSection() {
  const { state } = useSidebar();
  const { isSignedIn, isLoaded, user } = useUser();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarFooter className='border-t border-(--border-secondary) p-2'>
      {!isLoaded ? (
        <div className='flex items-center gap-2 px-2 py-2'>
          <Skeleton className='h-8 w-8 rounded-full' />
          <Skeleton className='h-4 flex-1 rounded' />
        </div>
      ) : isSignedIn && user ? (
        <div className='flex items-center '>
          {!isCollapsed && (
            <>
              <div className='flex items-center gap-2 flex-1 min-w-0'>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-(--text-primary) truncate'>
                    {user.fullName ||
                      user.firstName ||
                      user.emailAddresses[0]?.emailAddress ||
                      "User"}
                  </p>
                  {user.emailAddresses[0]?.emailAddress && user.fullName && (
                    <p className='text-xs text-(--text-muted) truncate'>
                      {user.emailAddresses[0].emailAddress}
                    </p>
                  )}
                </div>
              </div>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </>
          )}
          {isCollapsed && (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          )}
        </div>
      ) : (
        <div
          className={`flex ${
            isCollapsed
              ? "flex-col items-center gap-2"
              : "flex-row items-center gap-2"
          } px-2 py-2`}>
          {!isCollapsed && (
            <>
              <SignInButton mode='modal'>
                <Button variant='ghost' size='sm' className='flex-1'>
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode='modal'>
                <Button size='sm' className='flex-1'>
                  Sign Up
                </Button>
              </SignUpButton>
            </>
          )}
          {isCollapsed && (
            <>
              <SignInButton mode='modal'>
                <Button variant='ghost' size='icon' className='w-full'>
                  <span className='text-xs'>Sign In</span>
                </Button>
              </SignInButton>
              <SignUpButton mode='modal'>
                <Button size='icon' className='w-full'>
                  <span className='text-xs'>Sign Up</span>
                </Button>
              </SignUpButton>
            </>
          )}
        </div>
      )}
    </SidebarFooter>
  );
}
