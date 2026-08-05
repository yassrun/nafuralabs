import io.spring.gradle.dependencymanagement.dsl.DependencyManagementExtension
import org.gradle.api.plugins.JavaPluginExtension
import org.gradle.jvm.toolchain.JavaLanguageVersion
import org.springframework.boot.gradle.plugin.SpringBootPlugin

plugins {
    id("org.springframework.boot") version "3.4.1" apply false
    id("io.spring.dependency-management") version "1.1.6" apply false
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
            languageVersion.set(JavaLanguageVersion.of(21))
        }
    }

    tasks.withType<JavaCompile>().configureEach {
        options.compilerArgs.add("-parameters")
        // Without this, javac falls back to the platform charset (cp1252 on Windows) and
        // accented literals in sources are mangled at compile time — visible as mojibake
        // in generated PDFs (e.g. "Ã©chantillon" instead of "échantillon").
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
    }

    tasks.withType<Test>().configureEach {
        useJUnitPlatform()
    }
}
