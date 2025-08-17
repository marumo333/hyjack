"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { signOut, signIn } from "@/app/authSlice";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type XProps = {
  className?:string
}
export default function Google({className}:XProps) {
  const dispatch = useDispatch();
  const [user, setUser] = useState("");
  const router = useRouter();

  const supabase = createClientComponentClient();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user.email || "Google User");
          dispatch(
            signIn({
              name: session.user.email,
              iconUrl: "",
              token: session.provider_token,
            })
          );
          window.localStorage.setItem(
            "oauth_provider_token",
            session.provider_token || ""
          );
          window.localStorage.setItem(
            "oauth_provider_refresh_token",
            session.provider_refresh_token || ""
          );
        }

        if (event === "SIGNED_OUT") {
          window.localStorage.removeItem("oauth_provider_token");
          window.localStorage.removeItem("oauth_provider_refresh_token");
          setUser("");
          dispatch(signOut());
        }
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      router.push("/redirect");
    }
  }, [user, router]);

  const signInX = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "twitter",
        options: {
          redirectTo: `${window.location.origin}/redirect`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw new Error(error.message);
    } catch (error) {
      console.error("X認証エラー:", error);
    }
  };

  const signOutGoogle = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      dispatch(signOut());
    } catch (error: any) {
      console.error("ログアウトエラー発生", error.message);
    }
  };


  return  user ? (
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
            src="/x.jpg"
            alt="x Icon"
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
      <Image
            src="/x.jpg"
            alt="x Icon"
            width={20}
            height={20}
            className="h-5 w-5 mr-2"
            />
          X
          </button>
  );
}
