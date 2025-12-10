"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { WelcomeView } from "@/components/views/welcome-view";
import { BoardView } from "@/components/views/board-view";
import { SpecView } from "@/components/views/spec-view";
import { AgentView } from "@/components/views/agent-view";
import { SettingsView } from "@/components/views/settings-view";
import { AgentToolsView } from "@/components/views/agent-tools-view";
import { InterviewView } from "@/components/views/interview-view";
import { ContextView } from "@/components/views/context-view";
import { ProfilesView } from "@/components/views/profiles-view";
import { SetupView } from "@/components/views/setup-view";
import { useAppStore } from "@/store/app-store";
import { useSetupStore } from "@/store/setup-store";
import { getElectronAPI, isElectron } from "@/lib/electron";

export default function Home() {
  const { currentView, setCurrentView, setIpcConnected, theme, currentProject } = useAppStore();
  const { isFirstRun, setupComplete } = useSetupStore();
  const [isMounted, setIsMounted] = useState(false);

  // Compute the effective theme: project theme takes priority over global theme
  // This is reactive because it depends on currentProject and theme from the store
  const effectiveTheme = currentProject?.theme || theme;

  // Prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if this is first run and redirect to setup if needed
  useEffect(() => {
    console.log("[Setup Flow] Checking setup state:", {
      isMounted,
      isFirstRun,
      setupComplete,
      currentView,
      shouldShowSetup: isMounted && isFirstRun && !setupComplete,
    });

    if (isMounted && isFirstRun && !setupComplete) {
      console.log("[Setup Flow] Redirecting to setup wizard (first run, not complete)");
      setCurrentView("setup");
    } else if (isMounted && setupComplete) {
      console.log("[Setup Flow] Setup already complete, showing normal view");
    }
  }, [isMounted, isFirstRun, setupComplete, setCurrentView, currentView]);

  // Test IPC connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const api = getElectronAPI();
        const result = await api.ping();
        setIpcConnected(result === "pong" || result === "pong (mock)");
      } catch (error) {
        console.error("IPC connection failed:", error);
        setIpcConnected(false);
      }
    };

    testConnection();
  }, [setIpcConnected]);

  // Apply theme class to document (uses effective theme - project-specific or global)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(
      "dark",
      "retro",
      "light",
      "dracula",
      "nord",
      "monokai",
      "tokyonight",
      "solarized",
      "gruvbox",
      "catppuccin",
      "onedark",
      "synthwave"
    );

    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    } else if (effectiveTheme === "retro") {
      root.classList.add("retro");
    } else if (effectiveTheme === "dracula") {
      root.classList.add("dracula");
    } else if (effectiveTheme === "nord") {
      root.classList.add("nord");
    } else if (effectiveTheme === "monokai") {
      root.classList.add("monokai");
    } else if (effectiveTheme === "tokyonight") {
      root.classList.add("tokyonight");
    } else if (effectiveTheme === "solarized") {
      root.classList.add("solarized");
    } else if (effectiveTheme === "gruvbox") {
      root.classList.add("gruvbox");
    } else if (effectiveTheme === "catppuccin") {
      root.classList.add("catppuccin");
    } else if (effectiveTheme === "onedark") {
      root.classList.add("onedark");
    } else if (effectiveTheme === "synthwave") {
      root.classList.add("synthwave");
    } else if (effectiveTheme === "light") {
      root.classList.add("light");
    } else if (effectiveTheme === "system") {
      // System theme
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }
    }
  }, [effectiveTheme]);

  const renderView = () => {
    switch (currentView) {
      case "welcome":
        return <WelcomeView />;
      case "setup":
        return <SetupView />;
      case "board":
        return <BoardView />;
      case "spec":
        return <SpecView />;
      case "agent":
        return <AgentView />;
      case "settings":
        return <SettingsView />;
      case "tools":
        return <AgentToolsView />;
      case "interview":
        return <InterviewView />;
      case "context":
        return <ContextView />;
      case "profiles":
        return <ProfilesView />;
      default:
        return <WelcomeView />;
    }
  };

  // Setup view is full-screen without sidebar
  if (currentView === "setup") {
    return (
      <main className="h-screen overflow-hidden" data-testid="app-container">
        <SetupView />
        {/* Environment indicator */}
        {isMounted && !isElectron() && (
          <div className="fixed bottom-4 right-4 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20 pointer-events-none">
            Web Mode (Mock IPC)
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden" data-testid="app-container">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">{renderView()}</div>

      {/* Environment indicator - only show after mount to prevent hydration issues */}
      {isMounted && !isElectron() && (
        <div className="fixed bottom-4 right-4 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20 pointer-events-none">
          Web Mode (Mock IPC)
        </div>
      )}
    </main>
  );
}
