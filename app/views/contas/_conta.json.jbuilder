json.extract! conta, :id, :banco_id, :conta_numero, :conta_digito, :agencia_numero, :agencia_digito, :created_at, :updated_at
json.url conta_url(conta, format: :json)
