<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistoriquePrixAchat extends Model
{
    use HasFactory;

    protected $table = 'historique_prix_achat';

    protected $fillable = ['fournisseur_id','valeur'];

    protected $casts = [
        'valeur' => 'decimal:2',
    ];

    public function fournisseur(){ return $this->belongsTo(Fournisseur::class); }
}
