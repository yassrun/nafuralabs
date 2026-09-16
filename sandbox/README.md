# Sandbox

Produit de démonstration et de validation des composants et archetypes UI Nafura.

## Runtimes

- `sources/backend/`: API Spring Boot locale sur `:8082`.
- `sources/web/`: application Angular Anatomy Showroom sur `:4300`.

## Lancer localement

```powershell
cd sandbox
.\showroom-up.ps1
```

Le backend s'appuie sur le framework de `nafura-platform`; le web consomme ses bibliothèques UI via les alias `@platform`.
