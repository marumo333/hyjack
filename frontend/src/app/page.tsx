// app/page.tsx ログイン画面
"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { signIn} from "../authSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Google from "./google";
import Github from "./github";
import X from "./X";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const supabase = createClientComponentClient();
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // サインイン
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      alert(signInError.message);
      return;
    }
    // ここでセッション確定を待つ
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    console.error("Session fetch error:", sessionError);
    alert("ログインに失敗しました。もう一度お試しください。");
    return;
  }
    // Redux 登録
    dispatch(
      signIn({
        name: signInData.user?.email || "",
        iconUrl: signInData.user?.user_metadata?.avatar_url || "",
        token: signInData.session?.access_token || "",
      })
    );

    setTimeout(() => {
      router.replace("/redirect");
    }, 50);
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* タイトル */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          サインイン
        </h2>
      </div>

      {/* カード本体 */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          {/* Email/Password フォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300
                             rounded-md shadow-sm placeholder-gray-400 focus:outline-none
                             focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300
                             rounded-md shadow-sm placeholder-gray-400 focus:outline-none
                             focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            {/* Sign In ボタン */}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent
                           text-sm font-medium rounded-md text-white bg-indigo-600
                           hover:bg-indigo-700 focus:outline-none focus:ring-2
                           focus:ring-indigo-500 focus:ring-offset-2"
              >
                Sign in
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm">
                <Link href="/register" className="w-full flex justify-center py-2 px-4 border border-transparent
                           text-sm font-medium rounded-md text-white bg-green-600
                           hover:bg-green-700 focus:outline-none focus:ring-2
                           focus:ring-indigo-500 focus:ring-offset-2">新規登録はこちら</Link>
              </label>
            </div>
          </form>

          {/* 区切り線 + テキスト */}
          <div className="mt-6 flex items-center">
            <div className="flex-grow border-t border-gray-300" />
            <span className="mx-4 text-gray-500 text-sm">Or continue with</span>
            <div className="flex-grow border-t border-gray-300" />
          </div>

          {/* SNS ログインボタン */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Google
              className="w-full inline-flex justify-center py-2 px-4
                               border border-gray-300 rounded-md shadow-sm bg-white
                               text-sm font-medium text-gray-700 hover:bg-gray-50"
            />
            <Github
              className="w-full inline-flex justify-center py-2 px-4
                               border border-gray-300 rounded-md shadow-sm bg-white
                               text-sm font-medium text-gray-700 hover:bg-gray-50"
            />
            <X
              className="w-full inline-flex justify-center py-2 px-4
                               border border-gray-300 rounded-md shadow-sm bg-white
                               text-sm font-medium text-gray-700 hover:bg-gray-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
