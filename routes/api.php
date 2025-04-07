<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');



Route::post('/generate-pin', function () {
    $pin = str_pad(rand(0, 99999), 5, '0', STR_PAD_LEFT);  // Genera un PIN di 5 cifre
    // Salva il PIN nel database per l'utente Y, associandolo all'ID dell'utente
    return response()->json(['pin' => $pin]);
});



Route::post('/verify-pin', function (Request $request) {
    $pin = $request->input('pin');
    $validPin = '12345';  // Esempio di PIN (puoi cambiarlo per usare uno generato dinamicamente)

    if ($pin === $validPin) {
        return response()->json(['message' => 'PIN valido']);
    } else {
        return response()->json(['error' => 'PIN errato'], 400);
    }
});


