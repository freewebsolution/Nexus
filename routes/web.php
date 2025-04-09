<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserPinController;


Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Rotta per la home page
    Route::get('/', [HomeController::class, 'index'])->middleware(['auth'])->name('home');
    Route::get('/home', [HomeController::class, 'index'])->middleware(['auth'])->name('home');

    //pin generator
    Route::post('/generate-pin', [UserPinController::class, 'generatePin']);
});

Route::get('/video-call', function () {
    return Inertia::render('VideoCall'); // VideoCall è il componente che React renderizzerà
})->middleware(['auth', 'verified'])->name('video-call');

Route::get('/video-call/{userId}', function ($userId) {
    return Inertia::render('VideoCall', ['userId' => $userId]);
})->middleware(['auth', 'verified'])->name('video-call');


require __DIR__ . '/auth.php';
