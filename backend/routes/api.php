<?php

use App\Http\Controllers\Auth\HyjackAuthController;
use Illuminate\Support\Facades\Route;

// 認証不要エンドポイント
Route::post('/login', [HyjackAuthController::class, 'emailLogin']);
Route::get('/social/{provider}/redirect', [HyjackAuthController::class, 'socialRedirect']);
Route::get('/social/{provider}/callback', [HyjackAuthController::class, 'socialCallback']);

// 認証必須エンドポイント
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [HyjackAuthController::class, 'logout']);
    Route::get('/user', [HyjackAuthController::class, 'user']);
    Route::post('/register',[App\Http\Controllers\Auth\HyjackAuthController::class,'register']);
});