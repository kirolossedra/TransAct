package com.transact;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TransactApplication {
    public static void main(String[] args) {
        SpringApplication.run(TransactApplication.class, args);
    }
}
