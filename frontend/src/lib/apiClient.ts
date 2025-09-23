// lib/apiClient.ts
import Cookies from "js-cookie";

const API_BASE_URL= 'http://127.0.0.1:8000/api'
const TOKEN_COOKIE_NAME = "auth_token";
const USER_COOKIE_NAME = "user_info";

// CSRFトークンを取得する関数を改善
async function getCsrfToken() {
  try {
    console.log('Fetching CSRF token...');
    
    // sanctum/csrf-cookieにリクエストを送信
    const response = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
      method: 'GET',
      credentials: 'include', // クッキーを含める
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) {
      console.error('CSRF token fetch failed:', response.status);
      throw new Error('CSRFトークンの取得に失敗しました');
    }
    
    // レスポンスを待ってから次へ進む（より長い待機時間）
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 現在のクッキーからXSRF-TOKENを取得
    const cookies = document.cookie;
    console.log('Cookies after CSRF request:', cookies);
    
    // XSRF-TOKENクッキーを探す
    const match = cookies.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      console.log('Found CSRF token:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('No XSRF-TOKEN cookie found after fetching');
      throw new Error('No XSRF-TOKEN cookie found');
    }
  } catch (error) {
    console.error('CSRF token error:', error);
    throw error;
  }
}

// リクエスト実行関数（CSRFエラー時に自動再試行）
async function fetchWithCsrfRetry(url: string, options: RequestInit, retries = 1) {
  try {
    const response = await fetch(url, options);
    
    // CSRFエラーの場合 (419)
    if (response.status === 419 && retries > 0) {
      console.log('CSRF token expired or missing, refreshing...');
      await getCsrfToken(); // 新しいCSRFトークンを取得
      
      // 再リクエスト用に新しいoptionsオブジェクトを作成
      const newOptions = {
        ...options,
        headers: {
          ...options.headers,
        }
      };
      
      return fetchWithCsrfRetry(url, newOptions, retries - 1);
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// 認証状態を確認
export function isAuthenticated() {
  return !!Cookies.get(TOKEN_COOKIE_NAME);
}

//ユーザー登録関数を改善
export async function registerUser({
  email,
  password,
  role
}:{
  email:string;
  password:string;
  role:string
}){
  try {
    // CSRFトークンを取得し、明示的に値を受け取る
    const csrfToken = await getCsrfToken();
    
    // 取得したcsrfTokenを直接使用する（変数の警告を解消）
    console.log('Using XSRF token:', csrfToken);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': csrfToken,  // クッキーから取得する代わりに直接csrfTokenを使用
      },
      credentials: 'include' as RequestCredentials,
      body: JSON.stringify({ email, password, role }),
    };
    
    // 直接APIを呼び出す（再試行機能は使用しない）
    const response = await fetch(`${API_BASE_URL}/register`, options);
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: 'レスポンスの解析に失敗しました' };
      }
      
      console.error('API error:', errorData);
      
      // バリデーションエラー(422)の場合は詳細なエラーメッセージを表示
      if (response.status === 422 && errorData.errors) {
        // 全てのエラーメッセージを連結して表示
        const errorMessages = Object.entries(errorData.errors)
          .map(([field, messages]) => {
            // messagesが配列であることを確認
            const msgArray = Array.isArray(messages) ? messages : [String(messages)];
            return msgArray.map(msg => `${field}: ${msg}`).join('\n');
          })
          .join('\n');
          
        throw new Error(errorMessages || 'バリデーションエラーが発生しました');
      }
      
      throw new Error(errorData.message || `サーバーエラー: ${response.status}`);
    }
    
    const data = await response.json();
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
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json() : await res.text();

    if (!res.ok) {
      throw new Error(typeof body === "string" ? body : body.message || `HTTP ${res.status}`);
    }

    if (typeof body === "object" && body.token) {
      saveAuthData(body.token, {
        name: body.user?.name || body.user?.email || "",
        email: body.user?.email || "",
        avatar: body.user?.avatar_url || "",
        role: body.user?.role || "customer",
      });
      return { success: true, user: body.user };
    }

    throw new Error("Unexpected login response");
  } catch (e: any) {
    return { success: false, error: e?.message ?? "ネットワークエラー" };
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
  // トークンの有効期限を30日に設定
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  
  Cookies.set(TOKEN_COOKIE_NAME, token, {
    expires: expires,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "lax", // SameSite制限を緩和
  });

  Cookies.set(USER_COOKIE_NAME, JSON.stringify(user), {
    expires: expires,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "lax", // SameSite制限を緩和
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
function assertEndpoint(ep: string) {
  if (!ep || ep === '/' || /^\s*$/.test(ep)) {
    throw new Error('API endpoint が空です。具体的なパスを指定してください。');
  }
}

export async function apiGet(endpoint: string) {
  assertEndpoint(endpoint);
  const token = getAuthToken?.();
  const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  return await res.json();
}

export async function apiPost(endpoint: string, data: any) {
  assertEndpoint(endpoint);
  const token = getAuthToken?.();
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
