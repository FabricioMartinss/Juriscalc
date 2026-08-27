-- Nem todo usuário da plataforma tem número de OAB (ex: estagiários,
-- profissionais em formação). Torna oab_numero/oab_uf opcionais, mas exige
-- que venham juntos: não faz sentido um preenchido sem o outro.
ALTER TABLE usuarios
  ALTER COLUMN oab_numero DROP NOT NULL,
  ALTER COLUMN oab_uf DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oab_numero_uf_consistentes'
  ) THEN
    ALTER TABLE usuarios
      ADD CONSTRAINT oab_numero_uf_consistentes
      CHECK ((oab_numero IS NULL) = (oab_uf IS NULL));
  END IF;
END $$;
