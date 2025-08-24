"use client";
import { useEffect, useState } from "react";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSocialLoginUrl, logout, getUserFromCookie } from "@/../../lib/apiClient"; // APIクライアント関数をインポート

type XProps = {
  className?: string;
}

export default function X({ className }: XProps) {
  const [user, setUser] = useState("");
  const router = useRouter();

  // ページロード時に認証状態を確認
  useEffect(() => {
  //Cookieからトークンを確認
  const user = getUserFromCookie();
  
  if (user) {
    setUser(user.name || user.email);
    router.push("/redirect");
  }
}, []);


  // Xログイン処理
  const signInX = async () => {
    try {
      // Laravel APIからGXログイン用URLを取得
      const redirectUrl = await getSocialLoginUrl('github');
      if (redirectUrl) {
        // Xログインページにリダイレクト
        window.location.href = redirectUrl;
      } else {
        throw new Error("リダイレクトURLが取得できませんでした");
      }
    } catch (error) {
      console.error("X認証エラー:", error);
    }
  };

  // ログアウト処理
  const signOutX = async () => {
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
      
      
      // ログインページにリダイレクト
      router.push("/");
    } catch (error: any) {
      console.error("ログアウトエラー発生", error.message);
    }
  };

  return user ? (
    <button
      onClick={signOutX}
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
      onClick={signInX}
      className={`
        w-full inline-flex items-center justify-center
        py-2 px-4 border border-gray-300 rounded-md shadow-sm
        bg-white text-sm font-medium text-gray-700 hover:bg-gray-50
        ${className}
      `}
    >
      <Image src="/github.jpg" alt="Github Icon" width={20} height={20} className="h-5 w-5 mr-2" />
      X
    </button>
  );
}