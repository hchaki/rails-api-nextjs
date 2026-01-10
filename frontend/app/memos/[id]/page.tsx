import Link from "next/link";
import DeleteButton from "./DeleteButton";

export const dynamic = 'force-dynamic';

type Memo = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

async function getMemo(id: string): Promise<Memo | null> {
  const apiUrl = process.env.API_URL || "http://back:3000";

  try {
    const res = await fetch(`${apiUrl}/memos/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      const errorText = await res.text();
      console.error("API Error:", res.status, errorText);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

export default async function MemoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const memo = await getMemo(id);

  if (!memo) {
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
