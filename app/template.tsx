import { ViewTransition } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{
        "nav-up": "nav-up",
        "nav-down": "nav-down",
        default: "none",
      }}
      exit={{
        "nav-up": "nav-up",
        "nav-down": "nav-down",
        default: "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
