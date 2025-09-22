// lib/apiClient.ts
import Cookies from "js-cookie";

const API_BASE_URL = 'http://localhost/api';
const TOKEN_COOKIE_NAME = "auth_token";
const USER_COOKIE_NAME = "user_info";

// 認証状態を確認
export function isAuthenticated() {
  return !!Cookies.get(TOKEN_COOKIE_NAME);
}

//ユーザー登録
export async function registerUser({
  email,
  password,
  role
}:{
  email:string;
  password:string;
  role:string
}){
  try{
    // クロスオリジンリクエストの設定
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // クッキー送信に必要
      body: JSON.stringify({ email, password, role }),
    });

    // レスポンスのJSONパース
    const data = await response.json();

    // エラーチェック
    if (!response.ok) {
      throw new Error(data.message || '登録に失敗しました');
    }
    
    return data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
}

// ユーザー情報を取得
export function getUserFromCookie() {
  const userJson = Cookies.get(USER_COOKIE_NAME);
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  }
  return null;
}

// loginWithEmail 関数を修正
export async function loginWithEmail(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    
    const data = await res.json();
    
    if (data.token) {
      // トークンとユーザー情報を保存
      Cookies.set(TOKEN_COOKIE_NAME, data.token, { 
        expires: 7, 
        secure: true,
        sameSite: "strict" 
      });
      
      Cookies.set(USER_COOKIE_NAME, JSON.stringify({
        name: data.user?.name || data.user?.email || "",
        email: data.user?.email || "",
        avatar: data.user?.avatar_url || data.user?.user_metadata?.avatar_url || ""
      }), { 
        expires: 7, 
        secure: true,
        sameSite: "strict" 
      });
      
      return { success: true, user: data.user };
    }
    
    return { success: false, error: data.message || "ログインに失敗しました" };
  } catch (error) {
    console.error("ログインエラー:", error);
    return { success: false, error: "ネットワークエラーが発生しました" };
  }
}
 
// ログアウト処理
export function logout() {
  Cookies.remove(TOKEN_COOKIE_NAME);
  Cookies.remove(USER_COOKIE_NAME);

  // 必要に応じてサーバーサイドのログアウトAPIを呼び出す
  fetch(`${API_BASE_URL}/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  }).catch((e) => console.error("ログアウトAPI呼び出しエラー:", e));
}

// 認証データを保存
export function saveAuthData(
  token: string,
  user: { name: string; email: string; avatar: string; role: string }
) {
  Cookies.set(TOKEN_COOKIE_NAME, token, {
    expires: 7,
    secure: true,
    sameSite: "strict",
  });

  Cookies.set(USER_COOKIE_NAME, JSON.stringify(user), {
    expires: 7,
    secure: true,
    sameSite: "strict",
  });

  return { token, user };
}

// トークンを取得
export function getAuthToken() {
  return Cookies.get(TOKEN_COOKIE_NAME);
}

// ソーシャルログインURLを取得
export async function getSocialLoginUrl(provider: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/social/${provider}/redirect`);
  const data = await response.json();

  if (data.redirect_url) {
    return data.redirect_url;
  }
  throw new Error("リダイレクトURLが含まれていません");
}

// API呼び出し用のヘルパー関数
export async function apiGet(endpoint: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  return await res.json();
}

export async function apiPost(endpoint: string, data: any) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return await res.json();
}
