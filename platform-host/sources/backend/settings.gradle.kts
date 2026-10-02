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

rootProject.name = "platform-host-backend"

// Gradle substitutes ma.nafuralabs:<project-name> with the platform project of that name.
includeBuild("../../../nafura-platform/sources/backend")

// Business contexts of this product: bcs/<name>/backend.
apply(from = "../../../nafura-platform/gradle/nafura-host.settings.gradle")
