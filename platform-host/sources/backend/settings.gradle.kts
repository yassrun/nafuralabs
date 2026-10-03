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

// Name and business contexts come from app.nafura.json.
includeBuild("../../../nafura-platform/sources/backend")
apply(from = "../../../nafura-platform/gradle/nafura-host.settings.gradle")
