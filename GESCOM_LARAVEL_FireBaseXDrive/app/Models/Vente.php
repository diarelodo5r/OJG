<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vente extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ventes';

    protected $fillable = [
        'stock_id','client_id','quantite','montant',
        'image_article_snapshot','lot_snapshot','reference_snapshot','nom_article_snapshot',
        'nom_famille_snapshot','prix_vente_snapshot','prix_achat_snapshot','nom_fournisseur_snapshot',
        'conditionnement_snapshot','description'
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'prix_vente_snapshot' => 'decimal:2',
        'prix_achat_snapshot' => 'decimal:2',
    ];

    public function client(){ return $this->belongsTo(Client::class); }
    public function stock(){ return $this->belongsTo(Stock::class); }
}
