rootProject.name = "sektor"

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

includeBuild("../../../nafura-platform/sources/backend")

fun includeSektorModule(name: String) {
    val path = ":sektor:$name"
    include(path)
    project(path).projectDir = file("modules/$name")
}

include(":sektor:app")
project(":sektor:app").projectDir = file("app")

listOf(
    "item", "stock", "currency", "finance", "partner", "achats", "ventes",
    "chantiers", "etudes", "rh", "hse", "marches", "approbations", "catalogue"
).forEach { includeSektorModule(it) }
