"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logout, getAuthToken } from "@/lib/apiClient";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 認証状態の確認
    const checkAuth = async () => {
      const token = getAuthToken();

      if (!token) {
        // 未認証の場合はログインページへリダイレクト
        router.replace("/");
        return;
      }

      // 仮のユーザー情報（必要に応じて取得方法を変更してください）
      setUser({ name: "ユーザー" });
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      // ログアウト処理
      logout();
      router.replace("/");
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">ようこそ、{user?.name || "ゲスト"}さん</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {/* カード1 */}
            <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
              <h3 className="font-medium mb-2">プロフィール</h3>
              <p className="text-sm text-gray-600 mb-4">あなたのアカウント情報を確認・編集できます</p>
              <Link href="/profile" className="text-blue-600 text-sm">
                詳細を見る →
              </Link>
            </div>
            
            {/* カード2 */}
            <div className="bg-green-50 p-6 rounded-lg shadow-sm">
              <h3 className="font-medium mb-2">ダッシュボード</h3>
              <p className="text-sm text-gray-600 mb-4">アクティビティの概要を確認できます</p>
              <Link href="/dashboard" className="text-green-600 text-sm">
                詳細を見る →
              </Link>
            </div>
            
            {/* カード3 */}
            <div className="bg-purple-50 p-6 rounded-lg shadow-sm">
              <h3 className="font-medium mb-2">設定</h3>
              <p className="text-sm text-gray-600 mb-4">アプリケーションの設定を変更できます</p>
              <Link href="/settings" className="text-purple-600 text-sm">
                詳細を見る →
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      {/* フッター */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 HyJack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}