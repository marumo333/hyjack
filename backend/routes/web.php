//web.php
<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\HyjackAuthController;

Route::get('/', fn () => view('welcome'));

// Google
Route::get('/auth/google/redirect',[HyjackAuthController::class, 'redirectToGoogle'])->name('google.redirect');
Route::get('/auth/google/callback',[HyjackAuthController::class, 'handleGoogleCallback'])->name('google.callback');

// X (Twitter)
Route::get('/auth/x/redirect',[HyjackAuthController::class, 'redirectToX'])->name('x.redirect');
Route::get('/auth/x/callback',[HyjackAuthController::class, 'handleXCallback'])->name('x.callback');

// GitHub
Route::get('/auth/github/redirect',[HyjackAuthController::class, 'redirectToGithub'])->name('github.redirect');
Route::get('/auth/github/callback',[HyjackAuthController::class, 'handleGithubCallback'])->name('github.callback');

