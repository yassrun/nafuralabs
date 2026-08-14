rootProject.name = "venue-catalog"

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

includeBuild("../../../nafura-platform/sources/backend")

fun includeVenueCatalogModule(name: String) {
    val path = ":venue-catalog:$name"
    include(path)
    project(path).projectDir = file("modules/$name")
}

include(":venue-catalog:app")
project(":venue-catalog:app").projectDir = file("app")

listOf("api", "source-adapter", "catalog-place", "catalog-job", "catalog-enrichment", "compliance").forEach {
    includeVenueCatalogModule(it)
}
