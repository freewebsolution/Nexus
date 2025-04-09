<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPin extends Model
{
    /** @use HasFactory<\Database\Factories\UserPinFactory> */
    protected $table = 'user_pins';
    protected $guarded = ['id'];
    use HasFactory;
}
