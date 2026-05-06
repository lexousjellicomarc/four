import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'main'> {
  variant?: 'header' | 'sidebar';
}

export function AppContent({ children, className = '', ...props }: AppContentProps) {
  return (
    <main
      className={`bccc-backend-content relative min-w-0 flex-1 px-3 pb-8 pt-4 sm:px-4 lg:px-6 xl:px-8 ${className}`}
      {...props}
    >
      <div className="mx-auto w-full max-w-[1760px]">
        {children}
      </div>
    </main>
  );
}
