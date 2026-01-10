import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Memo = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

async function getMemos(): Promise<Memo[]> {
  // サーバーサイド（Next.jsコンテナ内）からはDocker内部ネットワークを使用
  // クライアントサイドからはlocalhost経由でアクセス
  const apiUrl = process.env.API_URL || 'http://back:3000';

  try {
    const res = await fetch(`${apiUrl}/memos`, {
      cache: 'no-store', // 常に最新データを取得
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error:', res.status, errorText);
      throw new Error(`Failed to fetch memos: ${res.status} ${errorText}`);
    }

    return res.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export default async function MemosPage() {
  const memos = await getMemos();

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
                作成日: {new Date(memo.created_at).toLocaleString('ja-JP')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
