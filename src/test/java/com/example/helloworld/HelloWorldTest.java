package com.example.helloworld;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * {@link HelloWorld} 单元测试。
 *
 * @author DTCoder
 */
class HelloWorldTest {

    @Test
    @DisplayName("getGreeting 返回默认问候语")
    void should_returnDefaultGreeting_when_invokeGetGreeting() {
        // Arrange
        HelloWorld helloWorld = new HelloWorld();

        // Act
        String greeting = helloWorld.getGreeting();

        // Assert
        assertNotNull(greeting);
        assertEquals(HelloWorld.DEFAULT_GREETING, greeting);
        assertEquals("Hello, World!", greeting);
    }
}
