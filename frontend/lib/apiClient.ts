// lib/apiClient.ts
import Cookies from 'js-cookie'; 
const API_BASE = "http://localhost:8000/api"; // Laravel Sailのポート
const TOKEN_COOKIE_NAME = "auth_token";
const UESR_COOKIE_NAME = "user_information";

export async function loginWithEmail(email: string, password: string) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  const data = await res.json();

  if(data.token){
    //トークンをクッキーに保存
    Cookies.set(TOKEN_COOKIE_NAME,data.token,{expire:7,secure:true,sameSite:'strict'});

    //ユーザー情報もcookieに保存
    if(data.user){
        Cookies.set(TOKEN_COOKIE_NAME,JSON.stringify({
            email:data.user.email,
            password:data.user.password,
        }),{expires:7,secure:true,sameSite:'strict'});
    }
  }
  return data;
}

export async function getUser() {
    const token = Cookies.get(TOKEN_COOKIE_NAME);

    if(!token){
        return null;
    }
  const res = await fetch(`${API_BASE}/user`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  return await res.json();
}

export function getAuthToken(){
    return Cookies.get(TOKEN_COOKIE_NAME);
} 

export function getUserFromCookie(){
    const userJson = Cookies.get(UESR_COOKIE_NAME);
    if(userJson){
        try{
            return JSON.parse(userJson);
        }catch(e){
            return null;
        }
    }
    return null;
}

export function logout(){
    Cookies.remove(TOKEN_COOKIE_NAME);
    Cookies.remove(UESR_COOKIE_NAME);
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