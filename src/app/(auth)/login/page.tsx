import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">불러오는 중…</div>}>
      <LoginForm />
    </Suspense>
  );
}
