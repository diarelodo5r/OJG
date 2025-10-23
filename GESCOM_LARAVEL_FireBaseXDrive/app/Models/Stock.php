<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Stock extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'stock';

    protected $fillable = [
        'article_id','fournisseur_id','lot','reference','quantite','montant','etat',
        'date_fabrication','date_peremption','description'
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'etat' => 'decimal:2',
        'date_fabrication' => 'date',
        'date_peremption' => 'date',
    ];

    public function article(){ return $this->belongsTo(Article::class); }
    public function fournisseur(){ return $this->belongsTo(Fournisseur::class); }
    public function ventes(){ return $this->hasMany(Vente::class); }
    public function historiques(){ return $this->hasMany(Historique::class); }
}
