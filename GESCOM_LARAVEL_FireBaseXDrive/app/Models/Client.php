<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Vente; // Add this line to import the Vente model

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['nom','telephone','adresse'];

    public function ventes(){ return $this->hasMany(Vente::class); }
}
