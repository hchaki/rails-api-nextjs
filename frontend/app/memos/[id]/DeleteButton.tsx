"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export default function DeleteButton({ memoId }: { memoId: number }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("このメモを削除しますか？この操作は取り消せません。")) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetchWithAuth(`${API_URL}/memos/${memoId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/memos");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "メモの削除に失敗しました");
      }
    } catch (error) {
      console.error("Error deleting memo:", error);
      alert("ネットワークエラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isDeleting ? "削除中..." : "削除"}
    </button>
  );
}
