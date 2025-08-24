"use client";
import { signOut, signIn } from "@/app/authSlice";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import getSocialLoginUrl, { logout, getUserFromCookie } from "@/../../lib/apiClient"; // APIクライアント関数をインポート

type GithubProps = {
  className?: string;
}

export default function Github({ className }: GithubProps) {
  const dispatch = useDispatch();
  const [user, setUser] = useState("");
  const router = useRouter();

  // ページロード時に認証状態を確認
  useEffect(() => {
  //Cookieからトークンを確認
  const user = getUserFromCookie();
  
  if (user) {
    setUser(user.name || user.email);
    dispatch(
      signIn({
        name: user.name || user.email,
        iconUrl: user.avatar || "",
        token: "cookie-based", // 実際のトークンはCookieに保存されているため、ここでは不要
      })
    );
    router.push("/redirect");
  }
}, [dispatch]);


  // GitHubログイン処理
  const signInGithub = async () => {
    try {
      // Laravel APIからGitHubログイン用URLを取得
      const redirectUrl = await getSocialLoginUrl('github');
      if (redirectUrl) {
        // GitHubログインページにリダイレクト
        window.location.href = redirectUrl;
      } else {
        throw new Error("リダイレクトURLが取得できませんでした");
      }
    } catch (error) {
      console.error("GitHub認証エラー:", error);
    }
  };

  // ログアウト処理
  const signOutGithub = async () => {
    try {
      // Laravel APIでログアウト処理
      const response = await fetch("http://localhost:8000/api/logout", {
        method: "POST",
        credentials: "include"
      });
      
      // Cookieを削除
      logout();
      
      // Reduxの状態をリセット
      setUser("");
      dispatch(signOut());
      
      // ログインページにリダイレクト
      router.push("/");
    } catch (error: any) {
      console.error("ログアウトエラー発生", error.message);
    }
  };

  return user ? (
    <button
      onClick={signOutGithub}
      className={`
      w-full inline-flex items-center justify-center
      py-2 px-4 border border-gray-300 rounded-md shadow-sm
      bg-white text-sm font-medium text-gray-700 hover:bg-gray-50
      ${className}
      `}
    >
      <Image
        src="/github.jpg"
        alt="Github Icon"
        width={20}
        height={20}
        className="h-5 w-5 mr-2"
      />
      ログアウト
    </button>
  ) : (
    <button
      onClick={signInGithub}
      className={`
        w-full inline-flex items-center justify-center
        py-2 px-4 border border-gray-300 rounded-md shadow-sm
        bg-white text-sm font-medium text-gray-700 hover:bg-gray-50
        ${className}
      `}
    >
      <Image src="/github.jpg" alt="Github Icon" width={20} height={20} className="h-5 w-5 mr-2" />
      Github
    </button>
  );
}