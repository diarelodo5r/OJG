<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Historique extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'historiques';

    protected $fillable = [
        'stock_id','fournisseur_id','utilisateur_id','type_mouvement','quantite_standard_id','prix_achat_id','prix_vente_id','description'
    ];

    public function stock(){ return $this->belongsTo(Stock::class); }
    public function fournisseur(){ return $this->belongsTo(Fournisseur::class); }
    public function utilisateur(){ return $this->belongsTo(Utilisateur::class); }
    public function quantiteStandard(){ return $this->belongsTo(HistoriqueQuantiteStandard::class, 'quantite_standard_id'); }
    public function prixAchat(){ return $this->belongsTo(HistoriquePrixAchat::class, 'prix_achat_id'); }
    public function prixVente(){ return $this->belongsTo(HistoriquePrixVente::class, 'prix_vente_id'); }
}
