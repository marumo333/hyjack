<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class HyjackAuthController extends Controller
{
    // メソッド名をregisterに変更
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', Password::min(8)],
            'role' => 'required|string|in:admin,customer,staff',
        ]);

        if($validator->fails()){
            return response()->json(['errors'=>$validator->errors()],422);
        }

        //ユーザー作成
        $user = User::create([
            'name' => explode('@',$request->email)[0],//仮の名前としてメールアドレスの@前を使用
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        //トークンを生成
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'ユーザー登録が完了しました'
        ],201);
    }
    
    // ログインメソッド
    public function emailLogin(Request $request)
    {
        $v = Validator::make($request->all(), [
            'email'    => ['required','email'],
            'password' => ['required'],
        ]);

        if ($v->fails()) {
            return response()->json(['message' => 'バリデーションエラー', 'errors' => $v->errors()], 422);
        }

        if (!Auth::attempt($request->only('email','password'))) {
            return response()->json(['message' => '認証失敗'], 401);
        }

        $user  = $request->user();
        $token = $user->createToken('api')->plainTextToken; // Sanctumのtoken

        return response()->json([
            'token' => $token,
            'user'  => $user,
        ], 200);
    }
    
    // ユーザー情報取得メソッド
    public function user(Request $request)
    {
        return $request->user();
    }
    
    // ログアウトメソッド
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'ログアウトしました']);
    }
}
