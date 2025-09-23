<?php
// app/Http/Middleware/VerifyCsrfToken.php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',  // すべてのAPIルートをCSRF検証から除外
        'sanctum/csrf-cookie'
    ];
}