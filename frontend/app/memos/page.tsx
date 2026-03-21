"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useLoadContent } from "@/hooks/useLoadContent";

type Memo = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export default function MemosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [memos, loading] = useLoadContent<Memo[]>("memos");

  // 認証チェック: ログインしていなければ /login にリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // ローディング中
  if (authLoading || loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  // 認証されていない（リダイレクト中）
  if (!user) {
    return null;
  }

  // データ取得エラー
  if (!memos) {
    return <div className="container mx-auto p-4">Error loading memos</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">メモ一覧</h1>
        <Link
          href="/memos/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          新規作成
        </Link>
      </div>

      {memos.length === 0 ? (
        <p className="text-gray-500">メモがありません</p>
      ) : (
        <div className="grid gap-4">
          {memos.map((memo) => (
            <Link
              key={memo.id}
              href={`/memos/${memo.id}`}
              className="block border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <h2 className="text-xl font-semibold mb-2">{memo.title}</h2>
              <p className="text-gray-700 mb-2 line-clamp-2">{memo.content}</p>
              <p className="text-sm text-gray-500">
                作成日: {new Date(memo.created_at).toLocaleString("ja-JP")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
