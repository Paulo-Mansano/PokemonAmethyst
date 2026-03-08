package com.pokemonamethyst.security;

import com.pokemonamethyst.domain.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class UsuarioPrincipal implements UserDetails {

    private final Usuario usuario;

    public UsuarioPrincipal(Usuario usuario) {
        this.usuario = usuario;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public String getId() {
        return usuario.getId();
    }

    public boolean isMestre() {
        return usuario.isMestre();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return usuario.isMestre()
                ? Stream.of("ROLE_USER", "ROLE_MESTRE").map(SimpleGrantedAuthority::new).collect(Collectors.toList())
                : Stream.of("ROLE_USER").map(SimpleGrantedAuthority::new).collect(Collectors.toList());
    }

    @Override
    public String getPassword() {
        return usuario.getSenhaHash();
    }

    @Override
    public String getUsername() {
        return usuario.getNomeUsuario();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
