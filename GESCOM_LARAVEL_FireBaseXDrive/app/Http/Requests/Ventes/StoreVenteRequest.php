<?php
namespace App\Http\Requests\Ventes;

use App\Services\Firebase\FirestoreService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreVenteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'sales'            => ['required','array','min:1'],
            'sales.*.id'       => ['required','string','exists:firestore,stocks'],
            'sales.*.quantity' => ['required','integer','min:1'],
            'client'           => ['required','array'],
            'client.type'      => ['required','in:existant,nouveau,none'],
            'client.id'        => ['nullable','string','exists:firestore,clients'],
            'client.nom'       => ['nullable','string','max:190'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            /** @var FirestoreService $firestore */
            $firestore = app(FirestoreService::class);

            $sales = $this->input('sales', []);
            foreach ($sales as $index => $sale) {
                $stockId = $sale['id'] ?? null;
                if (!$stockId) {
                    continue;
                }

                $stockSnapshot = $firestore->document('stocks', $stockId)->snapshot();
                if (!$stockSnapshot->exists()) {
                    $validator->errors()->add("sales.$index.id", 'Stock introuvable dans Firestore.');
                }
            }

            $client = $this->input('client');
            if (isset($client['id']) && $client['id']) {
                $clientSnapshot = $firestore->document('clients', $client['id'])->snapshot();
                if (!$clientSnapshot->exists()) {
                    $validator->errors()->add('client.id', 'Client introuvable dans Firestore.');
                }
            }
        });
    }
}
