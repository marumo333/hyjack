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