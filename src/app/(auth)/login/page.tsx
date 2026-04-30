import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">로딩…</div>}>
      <LoginForm />
    </Suspense>
  );
}
