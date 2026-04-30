import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  { href: "/settings/profile", title: "Profile", desc: "Name, avatar, and bio" },
  { href: "/settings/billing", title: "Billing", desc: "Top up credits and receipts" },
];

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em]">Settings</h1>
      <p className="text-sm text-muted-foreground">Manage your account and billing.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full rounded-xl border-border shadow-sm transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg tracking-[-0.02em]">{l.title}</CardTitle>
                <CardDescription>{l.desc}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
