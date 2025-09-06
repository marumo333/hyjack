"use client";
import { Burger, Drawer } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserFromCookie, logout, isAuthenticated } from "@/lib/apiClient";

export default function MobileComponent({ className }: { className?: string }) {
  const [opened, handlers] = useDisclosure(false);
  const { open, close, toggle } = handlers;

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
    <>
      {user ? (
        <header className="fixed top-0 left-0 right-0 z-50 bg-blue-500 p-4 text-white shadow">
          <div className="flex w-full justify-between">
            <div className="flex w-full justify-between">
              <div>
                <Burger
                  opened={opened}
                  onClick={() => {
                    console.log("toggle");
                    toggle();
                  }}
                  color="#fff"
                />
                <Drawer
                  opened={opened}
                  onClose={close}
                  zIndex={9999}
                  withCloseButton={false}
                  classNames={{
                    body: "p-0",
                    inner: "w-[380px]",
                  }}
                >
                  {/* Xボタン追加 */}
                  <div className="flex justify-end p-4">
                    <button onClick={close} className="text-2xl font-bold">
                      &times;
                    </button>
                  </div>

                  <div className="px-4 pt-[78px] font-bold flex flex-col gap-4">
                    <button onClick={handleLogout} className="mb-4 text-left">
                      ログアウト
                    </button>
                    <Link href="/postedInfo" className="mb-4" onClick={close}>
                      商品一覧
                    </Link>
                    <Link href="/search" className="mb-4" onClick={close}>
                      商品検索
                    </Link>
                    <Link href="/dashboard" className="mb-4" onClick={close}>
                      マイページ
                    </Link>
                  </div>
                </Drawer>
              </div>
              <Link href="/" className="text-xl font-bold text-white">
                HYjack
              </Link>
              <div className="text-sm">{user}</div>
            </div>
          </div>
        </header>
      ) : (
        <header className="fixed top-0 left-0 right-0 z-50 bg-blue-500 p-4 text-white shadow">
          <div className="flex w-full justify-between">
            <div className="flex w-full justify-between">
              <div>
                <Burger
                  opened={opened}
                  onClick={() => {
                    console.log("toggle");
                    toggle();
                  }}
                  color="#fff"
                />
                <Drawer
                  opened={opened}
                  onClose={close}
                  zIndex={9999}
                  withCloseButton={false}
                  classNames={{
                    body: "p-0",
                    inner: "w-[380px]",
                  }}
                >
                  {/* Xボタン追加 */}
                  <div className="flex justify-end p-4">
                    <button onClick={close} className="text-2xl font-bold">
                      &times;
                    </button>
                  </div>

                  <div className="px-4 pt-[78px] font-bold flex flex-col gap-4">
                    <Link href="/postedInfo" className="mb-4" onClick={close}>
                      商品一覧
                    </Link>
                    <Link href="/search" className="mb-4" onClick={close}>
                      商品検索
                    </Link>
                    <Link href="/" className="mb-4" onClick={close}>
                      ログイン
                    </Link>
                  </div>
                </Drawer>
              </div>
              <Link href="/" className="text-xl font-bold text-white">
                HYjack
              </Link>
            </div>
          </div>
        </header>
      )}
    </>
  );
}
