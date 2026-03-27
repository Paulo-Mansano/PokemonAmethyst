package com.pokemonamethyst.web.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    /** GET e HEAD (monitoramento costuma usar HEAD). */
    @RequestMapping(method = { RequestMethod.GET, RequestMethod.HEAD })
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("Servidor Acordado!");
    }
}
