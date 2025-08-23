// lib/apiClient.ts
const API_BASE = "http://localhost:8000/api"; // Laravel Sailのポート

export async function loginWithEmail(email: string, password: string) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  return await res.json();
}

export async function getUser(token: string) {
  const res = await fetch(`${API_BASE}/user`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  return await res.json();
}

//ソーシャルログイン用URLを取得する関数
export default async function getSocialLoginUrl(provider: string): Promise<string> {
    try {
        const response = await fetch(`${API_BASE}/social/${provider}/redirect`);
        const data = await response.json();

        if (data.redirect_url) {
            return data.redirect_url;
        }
        throw new Error("リダイレクトURLが含まれていません");
    } catch (error) {
        console.error(`${provider}ログインURL取得エラー:`, error);
        throw error;
    }
}