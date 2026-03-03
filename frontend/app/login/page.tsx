"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth.user) {
      // TODO: ログイン済みであれば前のページ戻る
      // router.back();
      router.push("/memos");
    }
  }, [auth, router]);

  // @ts-expect-error React event handler types are in transition
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await auth.login(email, password);
      // router.back();
      router.push("/memos");
    } catch {
      setError("ログインに失敗しました");
    }
  }
  if (auth.loading) {
    return <>Loading...</>;
  }
  return (
    <section>
      <h1>ログイン</h1>
      <form onSubmit={handleSubmit}>
        <label>
          email:
          <input
            type="email"
            id="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
        </label>
        <br />
        <label>
          password:
          <input
            type="password"
            id="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
          />
        </label>
        <br />
        <button type="submit">ログイン</button>
        <p>
          <a href="/signup">サインアップはこちら</a>
        </p>
        {error && <p>{error}</p>}
      </form>
    </section>
  );
}
