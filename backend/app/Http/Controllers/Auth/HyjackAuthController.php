<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class HyjackAuthController extends Controller
{
    // バリデーション
    public function validateRequest(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', Password::min(8)],
            'role' => 'required|string|in:admin,customer,staff',
        ]);

        if($validator->fail()){
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
            'messgae' => 'ユーザー登録が完了しました'
        ],201);
    }
}
