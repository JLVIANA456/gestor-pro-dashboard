-- Remove todas as versões da função
DROP FUNCTION IF EXISTS public.send_email_with_resend(text, text, text);
DROP FUNCTION IF EXISTS public.send_email_with_resend(text, text, text, text);

-- Recria com domínio @jlviana.com
CREATE OR REPLACE FUNCTION public.send_email_with_resend(
  to_email TEXT,
  subject TEXT,
  html_content TEXT,
  reply_to TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resend_api_key TEXT := 're_LKH1oeKs_BFV4KuoXshpPFBnCtEed5yvL';
  response_record RECORD;
  email_list JSONB;
BEGIN
  -- Limpeza e validação dos e-mails de destino
  SELECT jsonb_agg(trim(e))
  FROM unnest(string_to_array(replace(to_email, ';', ','), ',')) AS e
  WHERE trim(e) ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  INTO email_list;

  IF email_list IS NULL OR jsonb_array_length(email_list) = 0 THEN
    RAISE EXCEPTION 'E-mail inválido ou vazio Detectado: %', to_email;
  END IF;

  -- Chamada para o Resend usando o e-mail verificado
  SELECT * FROM http((
    'POST',
    'https://api.resend.com/emails',
    ARRAY[http_header('Authorization', 'Bearer ' || resend_api_key)],
    'application/json',
    json_build_object(
      'from', 'JLVIANA Consultoria Contábil <comunicado@jlviana.com>',
      'to', email_list,
      'subject', subject,
      'html', html_content
    )::TEXT
  )) INTO response_record;

  -- Verificação de sucesso
  IF response_record.status NOT IN (200, 201) THEN
    RAISE EXCEPTION 'Resend API Error: % (Status %)', response_record.content, response_record.status;
  END IF;

  RETURN response_record.content::JSON;
END;
$$;
