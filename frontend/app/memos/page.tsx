"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLoadContent } from "@/hooks/useLoadContent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon } from "lucide-react";

type Memo = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

function MemoSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  );
}

export default function MemosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [memos, loading] = useLoadContent<Memo[]>("memos");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4">
          <MemoSkeleton />
          <MemoSkeleton />
          <MemoSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!memos) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">エラー</CardTitle>
            <CardDescription>メモの読み込みに失敗しました</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">メモ一覧</h1>
        <Button asChild>
          <Link href="/memos/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      {memos.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>メモがありません</CardTitle>
            <CardDescription>
              「新規作成」ボタンから最初のメモを作成しましょう
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {memos.map((memo) => (
            <Link key={memo.id} href={`/memos/${memo.id}`}>
              <Card className="transition-all hover:shadow-lg cursor-pointer">
                <CardHeader>
                  <CardTitle>{memo.title}</CardTitle>
                  <CardDescription>
                    作成日: {new Date(memo.created_at).toLocaleString("ja-JP")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">
                    {memo.content}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
