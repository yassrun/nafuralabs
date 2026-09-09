/** Minimal FR strings so Import magique + help dialog are readable in the showroom. */
export const SANDBOX_FR = {
  shared: {
    filters: {
      reset: 'Réinitialiser',
      resetTitle: 'Réinitialiser les filtres',
      resetTooltip: 'Effacer les filtres actifs',
    },
  },
  platform: {
    smartImport: {
      button: 'Import magique',
      tooltip: 'Importer des données avec l’IA',
      phase: {
        preflight: 'Vérification…',
        extracting: 'Analyse IA…',
        reviewing: 'Revue…',
        importing: 'Import…',
      },
      menu: {
        open: 'Menu Import magique',
        tooltip: 'Importer avec l’IA — ouvrir le menu',
        fieldInfo: 'Info des champs',
        importSingle: 'Importer un élément…',
        importBulk: 'Importer un tableau…',
      },
      help: {
        close: 'Fermer',
        formats: 'Formats acceptés',
        maxSize: 'Taille maximale : {{size}} Mo',
        hierarchy: 'Structure hiérarchique',
        hierarchyHint: 'Lots parents puis postes.',
        expectedFields: 'Champs attendus',
        expectedFieldsFlat: 'Champs par ligne',
        extractRequired: 'Obligatoire (fichier)',
        infer: 'Complétable par l’IA',
        required: 'Obligatoire',
        optional: 'Facultatif',
        behaviour: 'Comportement',
        partial: 'Les lignes valides peuvent être importées; les autres corrigées ou ignorées.',
        strict: 'Toutes les lignes doivent être valides avant l’import.',
        duplicates: 'Les doublons détectés sont ignorés.',
      },
      errors: {
        tenantMissing: 'Tenant manquant (showroom).',
        network: 'API extraction indisponible.',
        forbidden: 'Accès refusé.',
        timeout: 'Délai d’extraction dépassé.',
        unknown: 'Erreur d’import.',
      },
    },
  },
} as const;
