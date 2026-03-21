"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success("ログアウトしました");
    router.push("/login");
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={user ? "/memos" : "/"} className="text-xl font-bold">
          メモアプリ
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                ログアウト
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">ログイン</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">サインアップ</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
