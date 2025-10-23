<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Archive extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'article_id','fournisseur_id','motif','quantite','montant_vente','date_archivage','commentaire','utilisateur_id'
    ];

    protected $casts = [
        'montant_vente' => 'decimal:2',
        'date_archivage' => 'datetime',
    ];

    public function article(){ return $this->belongsTo(Article::class); }
    public function fournisseur(){ return $this->belongsTo(Fournisseur::class); }
    public function utilisateur(){ return $this->belongsTo(Utilisateur::class); }
}
