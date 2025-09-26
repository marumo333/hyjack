<?php
// routes/api.php

use App\Http\Controllers\Auth\HyjackAuthController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [HyjackAuthController::class, 'register']);
Route::post('login', [HyjackAuthController::class, 'emailLogin']); // /api/login

Route::middleware('auth:sanctum')->group(function () {
    Route::get('user', [HyjackAuthController::class, 'user']);
    Route::post('logout', [HyjackAuthController::class, 'logout']);
});

//Googleログイン用のroute
Route::get('social/google/redirect',[HyjackAuthController::class,'redirectToGoogle']);
Route::get('social/google/callback',[HyjackAuthController::class,'handleGoogleCallback']);

//Xログイン用のroute
Route::get('social/X/redirect',[HyjackAuthController::class,'redirectToX']);
Route::get('social/X/redirect',[HyjackAuthController::class,'handleXCallback']);

//GitHubログイン用のroute
Route::get('social/github/redirect',[HyjackAuthController::class,'redirectToGithub']);


