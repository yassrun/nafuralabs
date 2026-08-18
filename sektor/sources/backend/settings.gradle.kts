rootProject.name = "sektor"

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

includeBuild("../../../nafura-platform/sources/backend") {
    dependencySubstitution {
        // An explicit block disables Gradle auto-substitution — list every GAV.
        fun sub(module: String, projectPath: String) {
            substitute(module("ma.nafuralabs:$module")).using(project(projectPath))
        }
        sub("framework", ":platform:core:framework")
        sub("authorization", ":platform:core:authorization")
        sub("identity", ":platform:core:identity")
        sub("scope", ":platform:core:scope")
        sub("tenancy", ":platform:core:tenancy")
        sub("observability", ":platform:core:observability")
        sub("job-runner", ":platform:core:job-runner")
        sub("settings", ":platform:features:configuration:settings")
        sub("sysconfig", ":platform:features:configuration:sysconfig")
        sub("iam", ":platform:features:administration:iam")
        sub("subscription", ":platform:features:administration:subscription")
        sub("usage", ":platform:features:administration:usage")
        sub("ai-agent-api", ":platform:features:ai:ai-agent-api")
        sub("ai-agent-runtime", ":platform:features:ai:ai-agent-runtime")
        sub("ai-conversation", ":platform:features:ai:ai-conversation")
        sub("llm-provider", ":platform:features:ai:llm-provider")
        sub("app-settings", ":platform:features:app-settings")
        sub("user-settings", ":platform:features:user-settings")
        sub("audit", ":platform:features:collaboration:audit")
        sub("comment", ":platform:commentaire")
        sub("doc-manager", ":platform:features:collaboration:doc-manager")
        sub("notification", ":platform:features:collaboration:notification")
        sub("tagging", ":platform:features:collaboration:tagging")
        sub("workflow", ":platform:approbation")
        sub("webhook", ":platform:features:collaboration:webhook")
        sub("geo", ":platform:features:foundation:geo")
        sub("google-places", ":platform:integrations:google-places")
        sub("documents", ":platform:documents")
        sub("impression", ":platform:impression")
        sub("doc-extractor", ":platform:document-extraction")
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
