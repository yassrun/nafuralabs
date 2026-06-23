rootProject.name = "nafuralabs"

fun includePlatform(path: String) {
    val relative = path.removePrefix(":platform:").replace(':', '/')
    include(path)
    project(path).projectDir = file("platform/backend/$relative")
}

fun includeSektorModule(name: String) {
    val path = ":sektor:$name"
    include(path)
    project(path).projectDir = file("products/sektor-btp/backend/modules/$name")
}

// ── Platform backend ────────────────────────────────────────────────────────
includePlatform(":platform:core:framework")
includePlatform(":platform:core:authorization")
includePlatform(":platform:core:identity")
includePlatform(":platform:core:scope")
includePlatform(":platform:core:tenancy")
includePlatform(":platform:core:observability")

includePlatform(":platform:features:configuration:settings")
includePlatform(":platform:features:configuration:sysconfig")
includePlatform(":platform:features:administration:iam")
includePlatform(":platform:features:administration:subscription")
includePlatform(":platform:features:ai:ai-agent-api")
includePlatform(":platform:features:ai:ai-agent-runtime")
includePlatform(":platform:features:ai:ai-conversation")
includePlatform(":platform:features:ai:llm-provider")
includePlatform(":platform:features:app-settings")
includePlatform(":platform:features:user-settings")
includePlatform(":platform:features:collaboration:audit")
includePlatform(":platform:features:collaboration:comment")
includePlatform(":platform:features:collaboration:doc-manager")
includePlatform(":platform:features:collaboration:notification")
includePlatform(":platform:features:collaboration:tagging")
includePlatform(":platform:features:collaboration:workflow")
includePlatform(":platform:features:collaboration:webhook")
includePlatform(":platform:features:documents:doc-extractor")
includePlatform(":platform:integrations:google-places")
includePlatform(":platform:core:job-runner")

// ── Sektor BTP (ERP) ────────────────────────────────────────────────────────
include(":sektor:app")
project(":sektor:app").projectDir = file("products/sektor-btp/backend/app")

listOf(
    "item", "stock", "currency", "finance", "partner", "achats", "ventes",
    "chantiers", "etudes", "rh", "hse", "marches", "approbations"
).forEach { includeSektorModule(it) }

// ── Venue Catalog ───────────────────────────────────────────────────────────
fun includeVenueCatalogModule(name: String) {
    val path = ":venue-catalog:$name"
    include(path)
    project(path).projectDir = file("products/venue-catalog/backend/modules/$name")
}

include(":venue-catalog:app")
project(":venue-catalog:app").projectDir = file("products/venue-catalog/backend/app")

listOf("api", "source-adapter", "catalog-place", "catalog-job", "compliance").forEach {
    includeVenueCatalogModule(it)
}

// ── Tools ───────────────────────────────────────────────────────────────────
include(":tools:lifecycle")
project(":tools:lifecycle").projectDir = file("tools/lifecycle")
