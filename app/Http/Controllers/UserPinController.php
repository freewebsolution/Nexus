<?php
namespace App\Http\Controllers;

use App\Mail\PostMail;
use App\Models\User;
use App\Models\UserPin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class UserPinController extends Controller
{
    /**
     * Crea un nuovo PIN e associa agli utenti chiamante e chiamato.
     */
    public function generatePin(Request $request)
    {
        // Assicurati che l'utente sia autenticato
        $caller = Auth::user(); // L'utente chiamante
        $calledUserId = $request->input('id'); // L'id dell'utente chiamato

        // Verifica che l'utente chiamato esista
        $calledUser = User::find($calledUserId);
        if (!$calledUser) {
            return response()->json(['error' => 'User not found.'], 404);
        }
        $guestEmail = $calledUser->email;

        // Genera un PIN casuale di 5 numeri
        $pin = rand(10000, 99999); // Un PIN a 5 cifre

        // Crea una nuova entry nella tabella user_pins
        $userPin = UserPin::create([
            'pin' => $pin,
        ]);

        // Associa il PIN sia all'utente chiamante che all'utente chiamato
        $caller->pin_id = $userPin->id;
        $calledUser->pin_id = $userPin->id;

        // Salva le modifiche agli utenti
        $caller->save();
        $calledUser->save();

        Mail::to(Auth::user()->email)->send(new PostMail(['pin' => $pin]));
        Mail::to($guestEmail)->send(new PostMail(['pin' => $pin]));

        // Restituisci il PIN generato
        return response()->json([
            'pin' => $pin,
            'message' => 'Pin generated and associated with users.',
        ]);
    }
}
