json.extract! conta, :id, :banco_id, :conta_numero, :conta_digito, :agencia_numero, :agencia_digito, :conta, :banco, :agencia, :movimentos, :saldo
json.url conta_url(conta, format: :json)
