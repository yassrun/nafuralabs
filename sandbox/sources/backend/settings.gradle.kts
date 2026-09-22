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
        substitute(module("ma.nafuralabs:multi-tenant")).using(project(":platform:core:multi-tenant"))
        substitute(module("ma.nafuralabs:user-settings")).using(project(":platform:features:user-settings"))
        substitute(module("ma.nafuralabs:app-settings")).using(project(":platform:features:app-settings"))
        substitute(module("ma.nafuralabs:organization-identity")).using(project(":platform:features:organization-identity"))
        substitute(module("ma.nafuralabs:sysconfig")).using(project(":platform:features:configuration:sysconfig"))
        substitute(module("ma.nafuralabs:impression")).using(project(":platform:impression"))
    }
}
