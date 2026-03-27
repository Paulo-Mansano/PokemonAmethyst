package com.pokemonamethyst.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.authentication.rememberme.JdbcTokenRepositoryImpl;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;

import javax.sql.DataSource;
import java.time.Duration;

@Configuration
public class RememberMeConfig {

    @Bean
    public PersistentTokenRepository persistentTokenRepository(DataSource dataSource) {
        JdbcTokenRepositoryImpl repo = new JdbcTokenRepositoryImpl();
        repo.setDataSource(dataSource);
        repo.setCreateTableOnStartup(false);
        return repo;
    }

    @Bean
    public RestRememberMeServices rememberMeServices(
            UsuarioDetailsService usuarioDetailsService,
            PersistentTokenRepository persistentTokenRepository,
            @Value("${pokemon.auth.remember-me-key}") String key,
            @Value("${pokemon.auth.remember-me-session}") Duration rememberMeDuration) {
        RestRememberMeServices services = new RestRememberMeServices(key, usuarioDetailsService, persistentTokenRepository);
        services.setTokenValiditySeconds((int) Math.min(rememberMeDuration.getSeconds(), Integer.MAX_VALUE));
        services.setCookieName("remember-me");
        services.setParameter("remember-me");
        return services;
    }
}
