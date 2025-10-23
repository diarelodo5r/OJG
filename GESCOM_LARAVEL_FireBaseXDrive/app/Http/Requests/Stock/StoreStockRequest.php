<?php
namespace App\Http\Requests\Stock;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'article_id'      => ['required','exists:articles,id'],
            'fournisseur_id'  => ['nullable','exists:fournisseurs,id'],
            'lot'             => ['nullable','string','max:190'],
            'reference'       => ['nullable','string','max:190'],
            'quantite'        => ['required','integer','min:1'],
            'prix_unitaire'   => ['required','numeric','min:0'],
            'date_fabrication'=> ['nullable','date'],
            'date_peremption' => ['nullable','date','after_or_equal:date_fabrication'],
            'image_article'   => ['nullable','image','max:2048'],
            'description'     => ['nullable','string'],
        ];
    }
}
