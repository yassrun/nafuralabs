pluginManagement {
    val stackVersions = java.util.Properties().apply {
        file("../../stack.versions.properties").inputStream().use(::load)
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

rootProject.name = "nafura-platform"

fun includePlatform(path: String) {
    val relative = path.removePrefix(":platform:").replace(':', '/')
    include(path)
    project(path).projectDir = file(relative)
}

include(":platform")
project(":platform").projectDir = file("platform")

includePlatform(":platform:core:framework")
includePlatform(":platform:core:authorization-api")
includePlatform(":platform:core:authorization")
includePlatform(":platform:identite:identity")
includePlatform(":platform:core:scope")
includePlatform(":platform:core:tenancy")
includePlatform(":platform:core:multi-tenant")
includePlatform(":platform:core:lab")
includePlatform(":platform:core:observability")


includePlatform(":platform:core")
includePlatform(":platform:identite")
includePlatform(":platform:conversation")
includePlatform(":platform:features")
includePlatform(":platform:integrations")

includePlatform(":platform:features:configuration:settings")
includePlatform(":platform:features:configuration:sysconfig")
includePlatform(":platform:features:configuration")
includePlatform(":platform:identite:iam")
includePlatform(":platform:features:administration:subscription")
includePlatform(":platform:features:administration:usage")
includePlatform(":platform:features:administration")
includePlatform(":platform:conversation:ai-agent-api")
includePlatform(":platform:conversation:ai-agent-runtime")
includePlatform(":platform:conversation:ai-conversation")
includePlatform(":platform:conversation:ai-agent")
includePlatform(":platform:features:ai:llm-provider")
includePlatform(":platform:features:ai")
includePlatform(":platform:features:app-settings")
includePlatform(":platform:features:organization-identity")
includePlatform(":platform:features:user-settings")
includePlatform(":platform:features:collaboration:audit")
include(":platform:commentaire")
project(":platform:commentaire").projectDir = file("commentaire")
includePlatform(":platform:features:collaboration:doc-manager")
includePlatform(":platform:features:collaboration")
include(":platform:documents")
project(":platform:documents").projectDir = file("documents")
include(":platform:impression")
project(":platform:impression").projectDir = file("impression")
include(":platform:notification")
project(":platform:notification").projectDir = file("notification")
includePlatform(":platform:features:collaboration:tagging")
include(":platform:approbation")
project(":platform:approbation").projectDir = file("approbation")
includePlatform(":platform:features:collaboration:webhook")
include(":platform:document-extraction")
project(":platform:document-extraction").projectDir = file("document-extraction")
includePlatform(":platform:features:foundation:geo")
includePlatform(":platform:features:foundation")
includePlatform(":platform:integrations:google-places")
includePlatform(":platform:core:job-runner")
include(":platform:host-tests")
project(":platform:host-tests").projectDir = file("host-tests")
