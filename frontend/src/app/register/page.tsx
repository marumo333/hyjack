// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import  registerUser  from "@/lib/apiClient"; // apiClientを使用

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "customer" | "staff">("customer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // apiClientの関数を使用
      const response = await registerUser({
        email: email.trim(),
        password: password.trim(),
        role: role
      });
      
      // 成功したらCookieにトークンとユーザー情報を保存（apiClient内で行う場合は不要）
      console.log("Register succeeded:", response);
      
      // ログインページへリダイレクト
      router.replace("/login");
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err?.message || "登録中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-semibold text-center mb-6">新規登録</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              disabled={loading}
              autoComplete="email"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password (8文字以上)
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              disabled={loading}
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              ロールを選択
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "customer" | "staff")}
              disabled={loading}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="admin">フリーランス</option>
              <option value="customer">お客様</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {loading ? "登録中..." : "登録する"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          既にアカウントをお持ちですか？{" "}
          <a href="/login" className="text-indigo-600 hover:text-indigo-800">
            ログイン
          </a>
        </p>
      </div>
    </div>
  );
}
