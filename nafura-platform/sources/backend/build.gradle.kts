import io.spring.gradle.dependencymanagement.dsl.DependencyManagementExtension
import org.gradle.api.plugins.JavaPluginExtension
import org.gradle.jvm.toolchain.JavaLanguageVersion
import org.springframework.boot.gradle.plugin.SpringBootPlugin

plugins {
    id("org.springframework.boot") apply false
    id("io.spring.dependency-management") apply false
}

val stackVersions = java.util.Properties().apply {
    file("../../stack.versions.properties").inputStream().use(::load)
}

val moduleDependencyGraphFile = layout.buildDirectory.file("reports/architecture/modules.dot")
val moduleDependencyGraph = tasks.register("moduleDependencyGraph") {
    group = "architecture"
    description = "Generates a DOT graph of direct Gradle project dependencies."
    outputs.file(moduleDependencyGraphFile)

    doLast {
        val modules = subprojects.sortedBy { it.path }
        val dependencies = modules.flatMap { source ->
            source.configurations.flatMap { configuration ->
                configuration.dependencies
                    .withType(org.gradle.api.artifacts.ProjectDependency::class.java)
                    .map { dependency ->
                        Triple(source.path, dependency.path, configuration.name)
                    }
            }
        }.distinct().sortedWith(compareBy({ it.first }, { it.second }, { it.third }))

        val output = moduleDependencyGraphFile.get().asFile
        output.parentFile.mkdirs()
        output.writeText(buildString {
            appendLine("digraph NafuraModules {")
            appendLine("  rankdir=LR;")
            modules.forEach { module ->
                val moduleId = module.path.removePrefix(":").replace(':', '.')
                appendLine("  \"$moduleId\" [label=\"${module.path}\"];")
            }
            dependencies.forEach { (source, target, configuration) ->
                val sourceId = source.removePrefix(":").replace(':', '.')
                val targetId = target.removePrefix(":").replace(':', '.')
                appendLine("  \"$sourceId\" -> \"$targetId\" [label=\"$configuration\"];")
            }
            appendLine("}")
        })
        logger.lifecycle("Module dependency graph: ${output.relativeTo(rootDir)}")
    }
}

allprojects {
    group = "ma.nafuralabs"
    version = "0.1.0-SNAPSHOT"

    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "java")
    apply(plugin = "io.spring.dependency-management")

    configure<JavaPluginExtension> {
        toolchain {
            languageVersion.set(JavaLanguageVersion.of(stackVersions.getProperty("java.version").toInt()))
        }
    }

    tasks.withType<JavaCompile>().configureEach {
        options.compilerArgs.add("-parameters")
        options.encoding = "UTF-8"
    }

    extensions.configure<DependencyManagementExtension> {
        imports {
            mavenBom(SpringBootPlugin.BOM_COORDINATES)
        }
    }

    dependencies {
        "compileOnly"("org.projectlombok:lombok")
        "annotationProcessor"("org.projectlombok:lombok")
        "compileOnly"("org.mapstruct:mapstruct:1.5.5.Final")
        "annotationProcessor"("org.projectlombok:lombok-mapstruct-binding:0.2.0")
        "annotationProcessor"("org.mapstruct:mapstruct-processor:1.5.5.Final")
        // Gradle 9 no longer ships a JUnit Platform launcher: without it, module tests do not run at all.
        "testRuntimeOnly"("org.junit.platform:junit-platform-launcher")
    }

    tasks.withType<Test>().configureEach {
        useJUnitPlatform()
    }

    tasks.named("check") {
        dependsOn(moduleDependencyGraph)
    }
}
