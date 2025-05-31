"use client";

import { AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AnimatePresence mode="wait">
      <main className="min-h-screen" suppressHydrationWarning>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#4CAF50",
                secondary: "#FFFFFF",
              },
            },
          }}
        />
      </main>
    </AnimatePresence>
  );
}
