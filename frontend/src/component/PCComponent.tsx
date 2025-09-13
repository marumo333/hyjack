"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getUserFromCookie, isAuthenticated, logout } from "@/lib/apiClient";


export default function PCComponent({ className }: { className?: string }) {
  const [user, setUser] = useState<string | null | undefined>(undefined);
  
    // ページロード時に認証状態を確認
    useEffect(() => {
      const checkAuth = () => {
        // Cookieから認証状態を確認
        if (isAuthenticated()) {
          const userInfo = getUserFromCookie();
          if (userInfo) {
            setUser(userInfo.email || userInfo.name || "ログインユーザー");
          }
        } else {
          setUser(null);
        }
      };
  
      // 初期チェック
      checkAuth();
  
      // 定期的にチェック（オプション）
      const interval = setInterval(checkAuth, 5000);
      return () => clearInterval(interval);
    }, []);
  
    // ログアウト処理
    const handleLogout = async () => {
      try {
        await logout();
        setUser(null);
        close(); // ドロワーを閉じる
        window.location.href = "/"; // トップページにリダイレクト
      } catch (error) {
        console.error("ログアウトエラー:", error);
      }
    };
  return (
    <header className={`bg-white ${className}`}>
      <nav className="flex items-center justify-between border-b border-gray-200 px-4 py-2 max-lg:hidden">
          {/* ロゴ＋タイトル */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-900">
              HYjack
            </span>
          </Link>

        {/* メニュー */}
        <ul className="hidden md:flex space-x-6 text-blue-900 font-bold">
          <button onClick={handleLogout}>
                      ログアウト
          </button>
          <li>
            <Link href="/postedInfo">商品一覧</Link>
          </li>
          <li>
            <Link href="/search">商品検索</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
