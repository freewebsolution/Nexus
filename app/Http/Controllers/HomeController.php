<?php
namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class HomeController extends Controller
{
    public function index()
    {
        $users = User::where('id', '!=', Auth::id())->get(); // Esclude l'utente loggato
        return Inertia::render('Home', [
            'users' => $users
        ]);
    }
}
