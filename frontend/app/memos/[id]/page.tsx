"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/auth";
import DeleteButton from "./DeleteButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

type Memo = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export default function MemoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user, loading: authLoading } = useAuth();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/memos/${id}`);
        if (!res.ok) {
          setError(true);
        } else {
          const data = await res.json();
          setMemo(data);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="mb-6">
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  if (error || !memo) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/memos">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              メモ一覧に戻る
            </Link>
          </Button>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">エラー</CardTitle>
            <CardDescription>メモが見つかりませんでした</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="ghost" asChild>
          <Link href="/memos">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            メモ一覧に戻る
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/memos/${memo.id}/edit`}>
              <PencilIcon className="mr-2 h-4 w-4" />
              編集
            </Link>
          </Button>
          <DeleteButton memoId={memo.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{memo.title}</CardTitle>
          <CardDescription>
            <div className="flex flex-col gap-1 text-sm">
              <span>作成日: {new Date(memo.created_at).toLocaleString("ja-JP")}</span>
              <span>更新日: {new Date(memo.updated_at).toLocaleString("ja-JP")}</span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-foreground">{memo.content}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
