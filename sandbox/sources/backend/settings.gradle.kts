pluginManagement {
    val stackVersions = java.util.Properties().apply {
        file("../../../nafura-platform/stack.versions.properties").inputStream().use(::load)
    }
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
    resolutionStrategy {
        eachPlugin {
            when (requested.id.id) {
                "org.springframework.boot" -> useVersion(stackVersions.getProperty("spring-boot.version"))
                "io.spring.dependency-management" -> useVersion(stackVersions.getProperty("spring-dependency-management.version"))
            }
        }
    }
}

rootProject.name = "sandbox-backend"

includeBuild("../../../nafura-platform/sources/backend") {
    dependencySubstitution {
        substitute(module("ma.nafuralabs:framework")).using(project(":platform:core:framework"))
        substitute(module("ma.nafuralabs:notification")).using(project(":platform:notification"))
    }
}