# Sandbox

Produit de démonstration et de validation des composants et archetypes UI Nafura.

## Runtimes

- `sources/backend/`: API Spring Boot locale sur `:8082`.
- `sources/web/`: application Angular Sandbox sur `:4300`.

## Lancer localement

```powershell
$env:JAVA_HOME = 'C:\Users\karkafiy\Desktop\tools\jdk-25.0.4.1+1'
$env:Path = 'C:\Users\karkafiy\Desktop\tools\gradle-9.7.1\bin;' + $env:Path
cd sandbox\sources\backend
gradle bootRun
```

Dans un second terminal:

```powershell
cd sandbox\sources\web
npm start
```

Le backend s'appuie sur le framework de `nafura-platform`; le web consomme ses bibliothèques UI via les alias `@platform`.
