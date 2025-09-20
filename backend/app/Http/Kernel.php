<?php
// backend/app/Http/Kernel.php のmiddlewareに追加

class Kernel
{
    protected $middleware = [
        // ...
        \App\Http\Middleware\Cors::class,
    ];
}