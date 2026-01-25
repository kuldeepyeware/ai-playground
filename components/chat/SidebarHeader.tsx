"use client";

import { useState } from "react";
import { SidebarHeader, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { PanelRight } from "lucide-react";
import Logo from "../common/Logo";

export function ChatSidebarHeader() {
  const { state, toggleSidebar } = useSidebar();
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);
  const isCollapsed = state === "collapsed";

  return (
    <SidebarHeader className=''>
      <div
        className={`flex items-center justify-between ${isCollapsed ? "pl-0.5" : "px-1"} py-2`}>
        <div
          className='flex items-center gap-1 relative'
          onMouseEnter={() => setIsHoveringLogo(true)}
          onMouseLeave={() => setIsHoveringLogo(false)}
          onClick={() => isCollapsed && toggleSidebar()}
          style={{ cursor: isCollapsed ? "pointer" : "default" }}>
          <div className='relative'>
            <Logo
              className={`h-7 w-7 transition-opacity ${
                isCollapsed && isHoveringLogo ? "opacity-0" : "opacity-100"
              }`}
            />
            {isCollapsed && isHoveringLogo && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg'>
                <PanelRight className='h-4 w-4 text-white' />
              </div>
            )}
          </div>
          <h1
            className={`text-sm font-semibold tracking-tight text-[#F9FAFB] whitespace-nowrap transition-all duration-300 ease-in-out ${
              isCollapsed
                ? "opacity-0 max-w-0 overflow-hidden"
                : "opacity-100 max-w-[200px]"
            }`}>
            AI Playground
          </h1>
        </div>
        {!isCollapsed && <SidebarTrigger className='cursor-pointer' />}
      </div>
    </SidebarHeader>
  );
}
