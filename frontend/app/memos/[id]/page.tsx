"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/auth";
import DeleteButton from "./DeleteButton";

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

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // メモ取得
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
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (!user) return null;

  if (error || !memo) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/memos"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← メモ一覧に戻る
          </Link>
        </div>

        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">エラー</p>
          <p>メモが見つかりませんでした。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/memos"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          ← メモ一覧に戻る
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/memos/${memo.id}/edit`}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            編集
          </Link>
          <DeleteButton memoId={memo.id} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h1 className="text-3xl font-bold mb-4">{memo.title}</h1>

        <div className="text-gray-500 text-sm mb-6">
          <p>作成日: {new Date(memo.created_at).toLocaleString("ja-JP")}</p>
          <p>更新日: {new Date(memo.updated_at).toLocaleString("ja-JP")}</p>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-800 whitespace-pre-wrap">{memo.content}</p>
        </div>
      </div>
    </div>
  );
}
