rootProject.name = "sektor"

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

includeBuild("../../../nafura-platform/sources/backend") {
    dependencySubstitution {
        substitute(module("ma.nafuralabs:doc-extractor"))
            .using(project(":platform:document-extraction"))
    }
}

fun includeSektorModule(name: String) {
    val path = ":sektor:$name"
    include(path)
    project(path).projectDir = file(name)
}

include(":sektor:app")
project(":sektor:app").projectDir = file("app")

listOf(
    "socle", "catalogue", "etudes", "chantiers", "marches",
    "achats", "ventes", "finance", "rh", "hse"
).forEach { includeSektorModule(it) }
