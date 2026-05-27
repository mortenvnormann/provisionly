import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SettingsLink() {
  return (
    <Link href="/settings">
      <Button type="button" variant="secondary">
        Settings
      </Button>
    </Link>
  );
}
