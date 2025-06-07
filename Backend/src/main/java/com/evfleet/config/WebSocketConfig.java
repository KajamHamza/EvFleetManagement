package com.evfleet.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:[*]")  // Use pattern instead of wildcard
                .withSockJS();
        
        // Add raw WebSocket endpoint for vehicles
        registry.addEndpoint("/ws/vehicles")
                .setAllowedOriginPatterns("http://localhost:[*]");  // Use pattern instead of wildcard
        
        // Add raw WebSocket endpoint for stations
        registry.addEndpoint("/ws/stations")
                .setAllowedOriginPatterns("http://localhost:[*]");
    }
} 