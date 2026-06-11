import { ViewTransition } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        "nav-up": "nav-up",
        "nav-down": "nav-down",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
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
