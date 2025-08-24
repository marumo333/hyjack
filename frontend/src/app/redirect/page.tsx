"use client"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserFromCookie, getAuthToken, apiGet } from "@/lib/apiClient";

export default function Redirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleAuth() {
      try {
        // ソーシャルログインのコールバックパラメータを確認
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const provider = params.get('provider');
        
        // コールバック処理（必要に応じて）
        if (code && provider) {
          // APIでトークン取得処理が必要な場合はここで実装
          // 例: await handleSocialCallback(provider, code);
          console.log(`${provider} コールバック処理中...`);
        }
        
        // 認証状態の確認
        const token = getAuthToken();
        const userInfo = getUserFromCookie();
        
        if (token && userInfo) {
          // 認証済みならダッシュボードへ
          setTimeout(() => {
            router.replace("/Home");
          }, 500);
        } else {
          // 未認証ならログイン画面へ
          console.log("認証情報が見つかりません");
          setError("認証情報が見つかりません");
          setTimeout(() => {
            router.replace("/");
          }, 1500);
        }
      } catch (err) {
        console.error("リダイレクト処理エラー:", err);
        setError("エラーが発生しました");
        setTimeout(() => {
          router.replace("/");
        }, 1500);
      } finally {
        setLoading(false);
      }
    }
    
    handleAuth();
  }, [router]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <h2 className="text-xl font-semibold">認証確認中...</h2>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-red-500">{error}</h2>
        <p className="mt-2">ログインページに戻ります...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-pulse">
        <h2 className="text-xl font-semibold">リダイレクト中...</h2>
      </div>
    </div>
  );
}