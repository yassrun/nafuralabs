-- Un DPGF peut naître d'un dossier d'étude (import bordereau) sans métré amont.
ALTER TABLE dpgf ALTER COLUMN metre_id DROP NOT NULL;
