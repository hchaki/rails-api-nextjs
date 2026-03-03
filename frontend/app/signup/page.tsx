"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignupPage() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth.user) {
      // TODO: サインアップ済みであれば前のページ戻る
      // router.back();
      router.push("/memos");
    }
  }, [auth, router]);

  // @ts-expect-error React event handler types are in transition
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await auth.signup(email, password, passwordConfirmation);
      // router.back();
      router.push("/memos");
    } catch {
      setError("サインアップに失敗しました");
    }
  }
  if (auth.loading) {
    return <>Loading...</>;
  }
  return (
    <section>
      <h1>サインアップ</h1>
      <form onSubmit={handleSubmit} autoComplete="off">
        <label>
          email:
          <input
            type="email"
            id="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
            autoComplete="off"
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
            autoComplete="off"
          />
        </label>
        <br />
        <label>
          passwordConfirmation:
          <input
            type="password"
            id="passwordConfirmation"
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            value={passwordConfirmation}
            required
            autoComplete="off"
          />
        </label>
        <br />
        <button type="submit">サインアップ</button>
        <p>
          <a href="/login">ログインはこちら</a>
        </p>
        {error && <p>{error}</p>}
      </form>
    </section>
  );
}
