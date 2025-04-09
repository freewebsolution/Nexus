<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Aggiungi il campo pin_id
            $table->unsignedBigInteger('pin_id')->nullable();
    
            // Imposta il campo pin_id come chiave esterna che fa riferimento alla tabella user_pins
            $table->foreign('pin_id')->references('id')->on('user_pins')->onDelete('set null');
        });
    }
    
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Rimuovi la chiave esterna e il campo pin_id
            $table->dropForeign(['pin_id']);
            $table->dropColumn('pin_id');
        });
    }
    
};
