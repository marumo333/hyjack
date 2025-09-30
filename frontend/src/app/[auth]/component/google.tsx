"use client";
import { useEffect, useState } from "react";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { logout, getUserFromCookie } from "@/lib/apiClient"; // APIクライアント関数をインポート

type GoogleProps = {
  className?: string;
}

export default function Google({ className }: GoogleProps) {
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


  // Googleログイン処理
  const signInGoogle = () => {
    const origin = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://127.0.0.1:8000";
    window.location.href = `${origin}/auth/google/redirect`
  };

  // ログアウト処理
  const signOutGoogle = async () => {
    try {
      // Laravel APIでログアウト処理
      const response = await fetch("http://localhost:8000/api/logout", {
        method: "POST",
        credentials: "include"
      });
      
      if(!response.ok){
        console.error('ログアウト処理に失敗しました：',response.status,await response.text());
      }
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
      onClick={signOutGoogle}
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
      onClick={signInGoogle}
      className={`
        w-full inline-flex items-center justify-center
        py-2 px-4 border border-gray-300 rounded-md shadow-sm
        bg-white text-sm font-medium text-gray-700 hover:bg-gray-50
        ${className}
      `}
    >
      <Image src="/google.jpg" alt="Google Icon" width={20} height={20} className="h-5 w-5 mr-2" />
      Google
    </button>
  );
}