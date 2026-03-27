package com.pokemonamethyst.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.rememberme.PersistentTokenBasedRememberMeServices;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;

/**
 * Remember-me ativado via JSON (flag {@code lembrar}) em vez do parâmetro de formulário {@code remember-me}.
 */
public class RestRememberMeServices extends PersistentTokenBasedRememberMeServices {

    /** Definido em {@link com.pokemonamethyst.web.controller.AuthController} antes de {@code loginSuccess}. */
    public static final String REMEMBER_ME_ATTR = RestRememberMeServices.class.getName() + ".lembrar";

    public RestRememberMeServices(String key, UserDetailsService userDetailsService, PersistentTokenRepository tokenRepository) {
        super(key, userDetailsService, tokenRepository);
    }

    @Override
    protected boolean rememberMeRequested(HttpServletRequest request, String parameter) {
        Object v = request.getAttribute(REMEMBER_ME_ATTR);
        if (v instanceof Boolean) {
            return (Boolean) v;
        }
        return super.rememberMeRequested(request, parameter);
    }
}
