package ma.nafura.platform.authorization.security.config;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.PublicEndpointRegistry;
import ma.nafura.platform.authorization.security.properties.SecurityProperties;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Centralized Spring Security configuration.
 *
 * <p>Features:
 * <ul>
 *   <li>OAuth2 Resource Server with JWT validation</li>
 *   <li>Stateless session management</li>
 *   <li>CSRF disabled for API usage</li>
 *   <li>Configurable CORS</li>
 *   <li>Configurable public endpoints</li>
 * </ul>
 *
 * @see SecurityProperties for configuration options
 */
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final SecurityProperties securityProperties;
    private final PublicEndpointRegistry publicEndpointRegistry;

    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        return new PublicAwareBearerTokenResolver(publicEndpointRegistry, securityProperties);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            BearerTokenResolver bearerTokenResolver,
            @Qualifier("jwtDecoder") JwtDecoder jwtDecoder
    ) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            // HSTS is an edge concern, not an app concern. Prod terminates TLS at the ingress
            // and adds HSTS there; http-only envs (staging / staging-local) must never emit it.
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts.disable()))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                for (PublicEndpointRegistry.PublicEndpointRule rule : publicEndpointRegistry.getRules()) {
                    if (rule.httpMethods().isEmpty()) {
                        for (String pattern : rule.patterns()) {
                            auth.requestMatchers(pattern).permitAll();
                        }
                    } else {
                        for (HttpMethod method : rule.httpMethods()) {
                            for (String pattern : rule.patterns()) {
                                auth.requestMatchers(method, pattern).permitAll();
                            }
                        }
                    }
                }
                for (String endpoint : securityProperties.getPublicEndpoints()) {
                    auth.requestMatchers(endpoint).permitAll();
                }
                auth.anyRequest().authenticated();
            })
            .oauth2ResourceServer(oauth2 -> oauth2
                .bearerTokenResolver(bearerTokenResolver)
                .jwt(jwt -> jwt.decoder(jwtDecoder))
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        SecurityProperties.CorsProperties corsProps = securityProperties.getCors();

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(corsProps.isAllowCredentials());
        config.setAllowedOriginPatterns(corsProps.getAllowedOriginPatterns());
        config.setAllowedHeaders(corsProps.getAllowedHeaders());
        config.setAllowedMethods(corsProps.getAllowedMethods());
        config.setExposedHeaders(corsProps.getExposedHeaders());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
