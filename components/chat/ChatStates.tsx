"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading chat..." }: LoadingStateProps) {
  return (
    <div className='flex items-center justify-center py-20'>
      <div className='flex flex-col items-center gap-4'>
        <svg
          className='h-8 w-8 animate-spin text-(--text-muted)'
          fill='none'
          viewBox='0 0 24 24'>
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          />
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          />
        </svg>
        <p className='text-(--text-muted)'>{message}</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error: Error;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className='flex items-center justify-center py-20'>
      <div className='text-center space-y-2'>
        <div className='text-(--error) text-lg font-medium'>
          Error loading chat
        </div>
        <p className='text-(--text-secondary)'>{error.message}</p>
      </div>
    </div>
  );
}

export function ChatNotFoundState() {
  const router = useRouter();

  return (
    <div className='flex items-center h-screen justify-center py-20'>
      <div className='text-center space-y-4'>
        <div className='text-(--text-primary) text-lg font-medium'>
          Chat Not Available
        </div>
        <p className='text-(--text-secondary)'>
          This chat doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button
          onClick={() => router.push("/chat")}
          className='mt-4 cursor-pointer'>
          Create Chat
        </Button>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className='flex flex-col items-center justify-center py-20'>
      <div className='text-center space-y-4'>
        <h2 className='text-2xl font-bold text-(--text-primary)'>
          How can I help you today?
        </h2>
        <p className='text-(--text-secondary)'>
          Ask anything and compare responses from multiple AI models
        </p>
      </div>
    </div>
  );
}
